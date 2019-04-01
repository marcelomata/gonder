var cm = CodeMirror.fromTextArea(document.getElementById("campaignTemplateHTML"), {
    lineNumbers: true,
    mode: {
        name: "htmlmixed",
        scriptTypes: [{matches: /\/x-handlebars-template|\/x-mustache/i,mode: null}]
    },
    selectionPointer: true,
    theme: "dracula"
});


$('#templateTabs').w2tabs({
    name: 'templateTabs',
    active: 'preview',
    tabs: [
        { id: 'preview', caption: w2utils.lang('Preview') },
        { id: 'html', caption: w2utils.lang('HTML') },
        { id: 'text', caption: w2utils.lang('Text') },
        { id: 'help', caption: w2utils.lang('Help') }
    ],
    onClick: function (event) {
        switch (event.target)
        {
            case "preview":
                templateShowPreview();
                break;
            case "html":
                templateShowHTML();
                break;
            case "text":
                templateShowText();
                break;
            case "help":
                templateShowHelp();
                break;
        }
    }
});

function templateShowText() {
    $("#campaignTemplatePreviewContainer").hide();
    $("#campaignTemplateHelpContainer").hide();
    $("#campaignTemplateHTMLContainer").hide();
    $("#campaignTemplateTextContainer").show();
    cm.refresh();
}

function templateShowHTML() {
    $("#campaignTemplatePreviewContainer").hide();
    $("#campaignTemplateHelpContainer").hide();
    $("#campaignTemplateTextContainer").hide();
    $("#campaignTemplateHTMLContainer").show();
    cm.refresh();
}

function templateShowPreview() {
    $("#campaignTemplateHTMLContainer").hide();
    $("#campaignTemplateHelpContainer").hide();
    $("#campaignTemplateTextContainer").hide();
    $('#campaignTemplatePreview').html(cm.getValue());
    $("#campaignTemplatePreviewContainer").show();

}

function templateShowHelp() {
    $("#campaignTemplatePreviewContainer").hide();
    $("#campaignTemplateHTMLContainer").hide();
    $("#campaignTemplateTextContainer").hide();
    $("#campaignTemplateHelpContainer").show();
}

function MakeTextFromHTML(withImg) {
    var config;
    if (withImg) {
        config = {
            headingStyle: "hashify",
            linkProcess: function (href, linkText) {
                href = href.replace(/^\s*?(\[.*?\]).*?/g, '');
                if (linkText == "") {
                    return "(" + href + ")";
                }
                return "[" + linkText + "] " + "(" + href + ")";
            }
        };
    } else {
        config = {
            headingStyle: "hashify",
            imgProcess: function (src, alt){
                if (alt == "") {
                    return " ";
                }
                return alt
            },
            linkProcess: function (href, linkText) {
                href = href.replace(/^\s*?(\[.*?\]).*?/g, '');
                if (linkText == " ") {
                    return "(" + href + ")";
                }
                return "[" + linkText + "] " + "(" + href + ")";
            }
        };
    }

    $("#campaignTemplateText").val(
        htmlToPlainText(cm.getValue().replace(/(?=<!--)([\s\S]*?)-->/g, ''), config).replace(/(&\S{2,16};)/g, function(str, num) {
            return $("<span />", { html: num }).text();
        })
    );
}