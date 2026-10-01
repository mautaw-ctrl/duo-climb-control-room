FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1
ENV WINEDEBUG=-all

RUN apt-get update && apt-get install -y \
    ca-certificates curl p7zip-full \
    wine64 xvfb x11vnc fluxbox xterm \
    novnc websockify fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/keeperfx

ARG KEEPERFX_URL=https://github.com/dkfans/keeperfx/releases/download/v1.4.0/keeperfx_1_4_0_complete.7z
RUN curl -L "$KEEPERFX_URL" -o /tmp/keeperfx.7z \
    && 7z x /tmp/keeperfx.7z -o/opt/keeperfx \
    && rm /tmp/keeperfx.7z

COPY deploy/keeperfx-local/start.sh /usr/local/bin/start-keeperfx
RUN chmod +x /usr/local/bin/start-keeperfx

EXPOSE 6080
CMD ["/usr/local/bin/start-keeperfx"]
