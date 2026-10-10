FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libopus0 libsodium23 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY services/discord-music-bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/discord-music-bot/bot.py .
CMD ["python", "bot.py"]
