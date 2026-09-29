const PLAYERS = [
  { gameName: "Davy442", tagLine: "EUW", targetTier: "GOLD", targetRank: "IV", targetLP: 0 },
  { gameName: "SDSarah", tagLine: "EUW", targetTier: "GOLD", targetRank: "IV", targetLP: 0 }
];

const REGION = "europe";
const PLATFORM = "euw1";
const QUEUE = "RANKED_SOLO_5x5";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if ((url.pathname === "/" || url.pathname === "/win98-web") && request.method === "GET") {
      return Response.redirect(new URL("/win98-web/", url), 302);
    }

    const hotAssets = new Set([
      "/miracle-os-bridge.js",
      "/os-audio.js",
      "/winamp/",
      "/winamp/index.html",
      "/winamp/player.js",
      "/winamp/direct.js",
      "/winamp-skins/",
      "/winamp-skins/index.html",
      "/winamp-skins/skins.json",
      "/music/deus-ex/manifest.json"
    ]);
    if (
      hotAssets.has(url.pathname) ||
      url.pathname === "/emulators/" ||
      url.pathname === "/emulators/index.html" ||
      url.pathname === "/toybox/" ||
      url.pathname === "/toybox/index.html" ||
      url.pathname === "/tracker/" ||
      url.pathname === "/tracker/index.html" ||
      url.pathname === "/wasmpsx/" ||
      url.pathname === "/wasmpsx/index.html" ||
      url.pathname === "/gameboy/" ||
      url.pathname === "/gameboy/index.html" ||
      url.pathname === "/playjs/" ||
      url.pathname === "/playjs/index.html" ||
      url.pathname === "/space-huggers/" ||
      url.pathname === "/space-huggers/index.html" ||
      url.pathname === "/snakeia/" ||
      url.pathname === "/snakeia/index.html" ||
      url.pathname === "/uno/" ||
      url.pathname === "/uno/index.html" ||
      url.pathname === "/soundbox/" ||
      url.pathname === "/soundbox/index.html" ||
      url.pathname === "/tinymusic/" ||
      url.pathname === "/tinymusic/index.html" ||
      url.pathname === "/sonantx/" ||
      url.pathname === "/sonantx/index.html" ||
      url.pathname === "/keeperfx/" ||
      url.pathname === "/keeperfx/index.html" ||
      url.pathname === "/keeperfx/keeperfx-loader.js" ||
      url.pathname === "/keeperfx/game-files/required-files.json" ||
      url.pathname === "/winamp-skins/" ||
      url.pathname === "/winamp-skins/index.html"
    ) {
      const asset = await env.ASSETS.fetch(request);
      const headers = new Headers(asset.headers);
      headers.set("Cache-Control", "no-store, max-age=0");
      return new Response(asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers
      });
    }

    if (url.pathname.startsWith("/win98-web/")) {
      const localAsset = await env.ASSETS.fetch(request);
      if (localAsset.status !== 404) return localAsset;

      // Safe fallback while a fresh full upstream build is deploying.
      if (url.pathname === "/win98-web/" || url.pathname === "/win98-web/index.html") {
        const upstream = await fetch(`https://azayrahmad.github.io${url.pathname}`);
        const headers = new Headers(upstream.headers);
        headers.set("Cache-Control", "no-store");
        headers.delete("content-security-policy");
        headers.delete("x-frame-options");
        let html = await upstream.text();

        // The upstream PWA can otherwise keep an old desktop build cached on
        // our domain. Miracle442 OS is deployed by the Worker, so disable the
        // upstream service-worker registration and remove any older one.
        html = html.replace(
          /<script[^>]*src=["'][^"']*registerSW[^"']*["'][^>]*><\/script>/gi,
          ""
        );
        html = html.replace(
          "<head>",
          '<head><script>if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){if(r.scope.indexOf("/win98-web/")!==-1)r.unregister();});});}</script>'
        );
        html = html.replace(
          "</body>",
          '<script src="/os-audio.js"></script><script src="/miracle-os-bridge.js"></script></body>'
        );
        return new Response(html, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers
        });
      }
      return proxyStatic(`https://azayrahmad.github.io${url.pathname}`, request);
    }

    if (url.pathname.startsWith("/vendor/webamp-modern/")) {
      const upstreamPath = url.pathname.slice("/vendor/webamp-modern/".length);
      return proxyStatic(`https://webamp.org/modern/${upstreamPath}`, request);
    }

    if (url.pathname.startsWith("/wasmpsx/")) {
      const name = url.pathname.slice("/wasmpsx/".length);
      const allowed = new Set([
        "wasmpsx.min.js",
        "wasmpsx_worker.js",
        "wasmpsx_worker.wasm",
        "wasmpsx_ww.wasm"
      ]);
      if (allowed.has(name)) {
        const type = name.endsWith(".wasm")
          ? "application/wasm"
          : "application/javascript; charset=utf-8";
        return proxyStatic(
          "https://raw.githubusercontent.com/js-emulators/wasmpsx/main/" + name,
          request,
          type
        );
      }
      if (name === "" || name === "index.html") {
        return env.ASSETS.fetch(request);
      }
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname === "/vendor/gameboyjs/gameboy.js") {
      return proxyStatic(
        "https://raw.githubusercontent.com/juchi/gameboy.js/gh-pages/js/gameboy.js",
        request,
        "application/javascript; charset=utf-8"
      );
    }

    if (url.pathname === "/vendor/howler/howler.core.min.js") {
      return proxyStatic(
        "https://raw.githubusercontent.com/goldfire/howler.js/master/dist/howler.core.min.js",
        request,
        "application/javascript; charset=utf-8"
      );
    }

    if (url.pathname === "/vendor/tinymusic/TinyMusic.min.js") {
      return proxyStatic(
        "https://raw.githubusercontent.com/kevincennis/TinyMusic/master/dist/TinyMusic.min.js",
        request,
        "application/javascript; charset=utf-8"
      );
    }

    if (url.pathname === "/vendor/sonantx/sonantx.js") {
      return proxyStatic(
        "https://raw.githubusercontent.com/nicolas-van/sonant-x/master/sonantx.js",
        request,
        "application/javascript; charset=utf-8"
      );
    }

    if (url.pathname.startsWith("/vendor/chiptune3/")) {
      const upstreamPath = url.pathname.slice("/vendor/chiptune3/".length);
      return proxyStatic(`https://drsnuggles.github.io/chiptune/${upstreamPath}`, request);
    }

    if (url.pathname.startsWith("/_snowpack/") || url.pathname.startsWith("/web_modules/")) {
      return proxyStatic(`https://webamp.org/modern${url.pathname}`, request);
    }

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (url.pathname === "/api/archive-download") {
        if (env.SITE_PASSCODE && !(await isAuthorized(request, env))) {
          return json({ ok: false, error: "AUTH_REQUIRED" }, 401);
        }

        const source = url.searchParams.get("url");
        if (!source) return json({ ok: false, error: "Missing archive URL" }, 400);

        let archiveUrl;
        try {
          archiveUrl = new URL(source);
        } catch {
          return json({ ok: false, error: "Invalid archive URL" }, 400);
        }

        if (
          archiveUrl.protocol !== "https:" ||
          archiveUrl.hostname !== "archive.org" ||
          !archiveUrl.pathname.startsWith("/download/")
        ) {
          return json({ ok: false, error: "Archive URL not allowed" }, 403);
        }

        const headers = new Headers();
        const range = request.headers.get("Range");
        if (range) headers.set("Range", range);

        const upstream = await fetch(archiveUrl.toString(), {
          method: request.method === "HEAD" ? "HEAD" : "GET",
          headers,
          redirect: "follow"
        });

        const out = new Headers(upstream.headers);
        out.set("Cache-Control", "public, max-age=3600");
        out.set("Access-Control-Allow-Origin", url.origin);
        out.set("X-Miracle442-Archive-Proxy", "1");
        out.delete("content-security-policy");
        out.delete("x-frame-options");

        return new Response(request.method === "HEAD" ? null : upstream.body, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: out
        });
      }

      if (url.pathname === "/api/status") {
        return json({
          ok: true,
          service: "Miracle442 League Progression Tracker",
          riotKeyConfigured: Boolean(env.RIOT_API_KEY),
          authRequired: Boolean(env.SITE_PASSCODE),
          now: new Date().toISOString()
        });
      }

      if (url.pathname === "/api/login" && request.method === "POST") {
        return login(request, env);
      }

      if (url.pathname === "/api/logout" && request.method === "POST") {
        return json({ ok: true }, 200, {
          "Set-Cookie": "duo_auth=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
        });
      }

      if (env.SITE_PASSCODE && !(await isAuthorized(request, env))) {
        return json({ ok: false, error: "AUTH_REQUIRED" }, 401);
      }

      if (!env.RIOT_API_KEY) {
        return json({ ok: false, error: "RIOT_API_KEY is not configured in Cloudflare Secrets." }, 500);
      }

      if (url.pathname === "/api/duo") {
        return json(await getDuoDashboard(env));
      }

      const playerMatch = url.pathname.match(/^\/api\/player\/([^/]+)\/([^/]+)$/);
      if (playerMatch) {
        const gameName = decodeURIComponent(playerMatch[1]);
        const tagLine = decodeURIComponent(playerMatch[2]);
        return json({ ok: true, player: await getPlayerSnapshot(env, gameName, tagLine) });
      }

      return json({ ok: false, error: "Not found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: error?.message || "Unknown server error" }, 500);
    }
  }
};

async function login(request, env) {
  if (!env.SITE_PASSCODE) return json({ ok: true, authRequired: false });
  const body = await request.json().catch(() => ({}));
  if (body.passcode !== env.SITE_PASSCODE) {
    return json({ ok: false, error: "INVALID_PASSCODE" }, 401);
  }
  const signature = await authSignature(env);
  return json({ ok: true }, 200, {
    "Set-Cookie": `duo_auth=${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`
  });
}

async function isAuthorized(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)duo_auth=([^;]+)/);
  return Boolean(match && match[1] === await authSignature(env));
}

async function authSignature(env) {
  const secret = env.SESSION_SECRET || env.SITE_PASSCODE;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("duo-climb-authorized-v1"));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getDuoDashboard(env) {
  const identities = [];

  for (const cfg of PLAYERS) {
    const account = await riotCached(
      env,
      `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(cfg.gameName)}/${encodeURIComponent(cfg.tagLine)}`,
      86400
    );
    identities.push({ ...cfg, puuid: account.puuid, rank: await getRank(env, account.puuid) });
  }

  const matchIdSets = [];
  for (const player of identities) {
    const ids = await riotCached(
      env,
      `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(player.puuid)}/ids?queue=420&start=0&count=20`,
      90
    );
    matchIdSets.push(ids);
  }

  const uniqueIds = [...new Set([...matchIdSets[0], ...matchIdSets[1]])].slice(0, 30);
  const details = [];
  for (const id of uniqueIds) {
    try {
      details.push(await riotCached(
        env,
        `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(id)}`,
        3600
      ));
    } catch (e) {
      console.warn("Match fetch failed", id, e.message);
    }
  }

  const players = identities.map((p, i) => {
    const ownIds = new Set(matchIdSets[i]);
    const ownMatches = details
      .filter(m => ownIds.has(m.metadata?.matchId))
      .sort((a, b) => (b.info?.gameCreation || 0) - (a.info?.gameCreation || 0));

    return {
      riotId: `${p.gameName}#${p.tagLine}`,
      gameName: p.gameName,
      tagLine: p.tagLine,
      rank: p.rank,
      target: { tier: p.targetTier, rank: p.targetRank, lp: p.targetLP },
      goal: goalProgress(p.rank, p),
      recent10: summarizePlayerMatches(ownMatches.slice(0, 10), p.puuid),
      previous10: summarizePlayerMatches(ownMatches.slice(10, 20), p.puuid)
    };
  });

  const shared = details
    .filter(m => {
      const ids = new Set(m.metadata?.participants || []);
      return ids.has(identities[0].puuid) && ids.has(identities[1].puuid);
    })
    .sort((a, b) => (b.info?.gameCreation || 0) - (a.info?.gameCreation || 0))
    .slice(0, 10);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    region: "EUW",
    players,
    duo: summarizeDuo(shared, identities[0].puuid, identities[1].puuid)
  };
}

async function getPlayerSnapshot(env, gameName, tagLine) {
  const account = await riotCached(
    env,
    `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    86400
  );
  return { riotId: `${gameName}#${tagLine}`, rank: await getRank(env, account.puuid) };
}

async function getRank(env, puuid) {
  let entries;
  try {
    entries = await riotCached(
      env,
      `https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
      90
    );
  } catch {
    const summoner = await riotCached(
      env,
      `https://${PLATFORM}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
      86400
    );
    entries = await riotCached(
      env,
      `https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summoner.id)}`,
      90
    );
  }

  const solo = Array.isArray(entries) ? entries.find(e => e.queueType === QUEUE) : null;
  if (!solo) return { tier: "UNRANKED", rank: "", lp: 0, wins: 0, losses: 0, winRate: 0 };

  const games = solo.wins + solo.losses;
  return {
    tier: solo.tier,
    rank: solo.rank,
    lp: solo.leaguePoints,
    wins: solo.wins,
    losses: solo.losses,
    winRate: games ? round1((solo.wins / games) * 100) : 0
  };
}

function summarizePlayerMatches(matches, puuid) {
  const rows = [];
  for (const match of matches) {
    const p = match.info?.participants?.find(x => x.puuid === puuid);
    if (!p) continue;
    const minutes = Math.max((match.info?.gameDuration || 0) / 60, 1);
    rows.push({
      win: Boolean(p.win),
      champion: p.championName,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      kda: (p.kills + p.assists) / Math.max(1, p.deaths),
      csMin: ((p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)) / minutes,
      damageMin: (p.totalDamageDealtToChampions || 0) / minutes,
      visionMin: (p.visionScore || 0) / minutes
    });
  }

  const wins = rows.filter(r => r.win).length;
  const avg = key => rows.length ? rows.reduce((s, r) => s + r[key], 0) / rows.length : 0;
  const champions = {};
  for (const r of rows) {
    champions[r.champion] ||= { champion: r.champion, games: 0, wins: 0 };
    champions[r.champion].games++;
    if (r.win) champions[r.champion].wins++;
  }

  return {
    games: rows.length,
    wins,
    losses: rows.length - wins,
    winRate: rows.length ? round1((wins / rows.length) * 100) : 0,
    kda: round2(avg("kda")),
    csMin: round2(avg("csMin")),
    damageMin: Math.round(avg("damageMin")),
    visionMin: round2(avg("visionMin")),
    deathsPerGame: round2(avg("deaths")),
    champions: Object.values(champions)
      .sort((a, b) => b.games - a.games)
      .slice(0, 5)
      .map(c => ({ ...c, winRate: Math.round((c.wins / c.games) * 100) }))
  };
}

function summarizeDuo(matches, puuidA, puuidB) {
  const recentMatches = [];
  const pairs = {};
  let wins = 0;

  for (const match of matches) {
    const a = match.info?.participants?.find(x => x.puuid === puuidA);
    const b = match.info?.participants?.find(x => x.puuid === puuidB);
    if (!a || !b) continue;
    if (a.win) wins++;

    const key = `${a.championName} + ${b.championName}`;
    pairs[key] ||= { pair: key, games: 0, wins: 0 };
    pairs[key].games++;
    if (a.win) pairs[key].wins++;

    recentMatches.push({
      id: match.metadata?.matchId,
      date: new Date(match.info?.gameCreation || Date.now()).toISOString(),
      win: Boolean(a.win),
      durationMin: Math.round((match.info?.gameDuration || 0) / 60),
      player1: { champion: a.championName, kills: a.kills, deaths: a.deaths, assists: a.assists },
      player2: { champion: b.championName, kills: b.kills, deaths: b.deaths, assists: b.assists }
    });
  }

  let lossStreak = 0;
  for (const m of recentMatches) {
    if (m.win) break;
    lossStreak++;
  }

  return {
    sharedGames: recentMatches.length,
    wins,
    losses: recentMatches.length - wins,
    winRate: recentMatches.length ? round1((wins / recentMatches.length) * 100) : 0,
    currentLossStreak: lossStreak,
    sessionAdvice: lossStreak >= 2
      ? "STOP SIGNAL: 2+ consecutive duo losses. Take a break before queueing again."
      : "QUEUE SIGNAL: no 2-loss stop trigger in the current shared sample.",
    pairs: Object.values(pairs)
      .sort((a, b) => b.games - a.games || b.wins - a.wins)
      .map(p => ({ ...p, winRate: Math.round((p.wins / p.games) * 100) })),
    recentMatches
  };
}

function goalProgress(rank, target) {
  if (!rank || rank.tier === "UNRANKED") return { percent: 0, remainingRP: null };
  const current = rankPoints(rank.tier, rank.rank, rank.lp);
  const start = rankPoints("SILVER", "IV", 0);
  const goal = rankPoints(target.targetTier, target.targetRank, target.targetLP);
  const total = Math.max(goal - start, 1);
  return {
    percent: Math.max(0, Math.min(100, Math.round(((current - start) / total) * 100))),
    remainingRP: Math.max(0, goal - current)
  };
}

function rankPoints(tier, rank, lp) {
  const tierBase = {
    IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200,
    PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400,
    MASTER: 2800, GRANDMASTER: 3200, CHALLENGER: 3600
  };
  const division = { IV: 0, III: 100, II: 200, I: 300 };
  return (tierBase[tier] ?? 0) + (division[rank] ?? 0) + (lp || 0);
}

async function riotCached(env, url, ttlSeconds) {
  const cache = caches.default;
  const cacheKey = new Request(url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached.json();

  const response = await fetch(url, {
    headers: { "X-Riot-Token": env.RIOT_API_KEY, "Accept": "application/json" }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Riot API ${response.status}: ${body.slice(0, 220)}`);
  }

  const data = await response.json();
  await cache.put(cacheKey, new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${ttlSeconds}` }
  }));
  return data;
}

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}


async function proxyStatic(targetUrl, request, forcedType = null) {
  const upstream = await fetch(targetUrl, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers: {
      "Accept": request.headers.get("Accept") || "*/*",
      "User-Agent": "Duo-Climb-Control-Room/1.0"
    },
    cf: { cacheEverything: true, cacheTtl: 86400 }
  });

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=86400, immutable");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.delete("content-security-policy");
  headers.delete("x-frame-options");
  if (forcedType) headers.set("Content-Type", forcedType);

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}
