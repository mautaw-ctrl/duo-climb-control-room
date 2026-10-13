FROM python:3.12-slim
# yt-dlp needs a JavaScript runtime for current YouTube player challenges.
COPY --from=denoland/deno:bin-2.9.7 /deno /usr/local/bin/deno
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libopus0 libsodium23 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN deno --version && pip install --no-cache-dir -r requirements.txt
COPY bot.py youtube_sources.py lavalink_backend.py ./
COPY tests/ tests/
# Fail the build if the YouTube fallback resolver or bot syntax regresses.
RUN python -m unittest discover -s tests -v && python -m py_compile bot.py youtube_sources.py lavalink_backend.py
CMD ["python", "bot.py"]
