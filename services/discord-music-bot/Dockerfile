FROM python:3.12-slim
# yt-dlp needs a JavaScript runtime for current YouTube player challenges.
COPY --from=denoland/deno:bin-2.9.7 /deno /usr/local/bin/deno
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libopus0 libsodium23 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN deno --version && pip install --no-cache-dir -r requirements.txt
COPY bot.py .
CMD ["python", "bot.py"]
