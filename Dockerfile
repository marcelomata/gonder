FROM golang:1.12 as builder
WORKDIR /app/gonder
RUN go get -u github.com/go-bindata/go-bindata/...
ENV GO111MODULE=on
ADD . /app/gonder
RUN go generate && \
    go build -ldflags '-s -w -linkmode external -extldflags -static' -o /app/gonder/start . && \
    cd /app/gonder/cert && \
    openssl req -x509 -sha256 -nodes -days 3650 -newkey rsa:4096 -keyout server.key -out server.pem -subj "/C=RU/ST=Moscow/L=Moscow/O=Supme/OU=Gonder/CN=gonder.supme.ru"

FROM alpine as production
LABEL maintainer="Supme <supme@gmail.com>"
WORKDIR /app
COPY --from=builder /app/gonder/start /app/
COPY --from=builder /app/gonder/dump.sql /app
COPY --from=builder /app/gonder/cert /app/cert
COPY --from=builder /app/gonder/dist_config.toml /app/
COPY --from=builder /app/gonder/logrotate /etc/logrotate.d/gonder
RUN chmod 644 /etc/logrotate.d/gonder && \
    apk add logrotate && \
    mkdir /app/log && \
    mkdir /app/files
EXPOSE 8080 7777
ENTRYPOINT ["./start"]
