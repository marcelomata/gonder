package campaign

import (
	"bytes"
	"database/sql"
	"github.com/supme/gonder/models"
	"io"
	"log"
	"os"
	"sync"
	"time"
)

var (
	startedCampaign struct {
		campaigns []string
		sync.Mutex
	}
	camplog *log.Logger
)

// Run start look database for ready campaign for send
func Run() {
	l, err := os.OpenFile("log/campaign.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Printf("error opening campaign log file: %v", err)
	}
	defer l.Close()
	camplog = log.New(io.MultiWriter(l, os.Stdout), "", log.Ldate|log.Ltime)

	for {
		for {
			if GetStartedCampaignsCount() <= models.Config.MaxCampaingns {
				break
			}
			time.Sleep(1 * time.Second)
		}

		startedCampaign.Lock()
		if id, err := checkNextCampaign(); err == nil {
			startedCampaign.campaigns = append(startedCampaign.campaigns, id)
			camp, err := GetCampaign(id)
			checkErr(err)
			go func() {
				camp.Send()
				removeStartedCampaign(id)
			}()
		}
		startedCampaign.Unlock()
		time.Sleep(10 * time.Second)
	}
}

func GetStartedCampaignsCount() int {
	startedCampaign.Lock()
	defer startedCampaign.Unlock()
	return len(startedCampaign.campaigns)
}

func GetStartedCampaigns() []string {
	var started []string
	startedCampaign.Lock()
	started = startedCampaign.campaigns
	startedCampaign.Unlock()
	if started == nil {
		started = []string{}
	}
	return started
}

func checkNextCampaign() (string, error) {
	var launched bytes.Buffer
	for i, s := range startedCampaign.campaigns {
		if i != 0 {
			launched.WriteString(",")
		}
		launched.WriteString("'" + s + "'")
	}
	var query bytes.Buffer
	query.WriteString("SELECT t1.`id` FROM `campaign` t1 WHERE t1.`accepted`=1 AND (NOW() BETWEEN t1.`start_time` AND t1.`end_time`) AND (SELECT COUNT(*) FROM `recipient` WHERE campaign_id=t1.`id` AND removed=0 AND status IS NULL) > 0")
	if launched.String() != "" {
		query.WriteString(" AND t1.`id` NOT IN (" + launched.String() + ")")
	}

	var id string
	err := models.Db.QueryRow(query.String()).Scan(&id)
	if err == sql.ErrNoRows {
		return "", err
	}
	checkErr(err)
	return id, err
}

func removeStartedCampaign(id string) {
	startedCampaign.Lock()
	for i := range startedCampaign.campaigns {
		if startedCampaign.campaigns[i] == id {
			startedCampaign.campaigns = append(startedCampaign.campaigns[:i], startedCampaign.campaigns[i+1:]...)
			break
		}
	}
	startedCampaign.Unlock()
	return
}

func checkErr(err error) {
	if err != nil {
		camplog.Println(err)
	}
}
