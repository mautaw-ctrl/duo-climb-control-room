<p align="center">
  <img src="assets/title_plate.png" alt="Miracle442's League Progression Tracker" width="100%">
</p>

<p align="center">
  <img src="assets/terminal_art.gif" alt="Terminal artwork" width="100%">
</p>

<p align="center">
  <sub>Personal Riot API progression tracker made for Mean Gurlz Headquarterz 💅🫦</sub>
</p>

<p align="center">
  <img alt="Region" src="https://img.shields.io/badge/REGION-EUW-0b0f0c?style=for-the-badge&labelColor=071008&color=4cff78">
  <img alt="Queue" src="https://img.shields.io/badge/QUEUE-RANKED_SOLO%2FDUO-0b0f0c?style=for-the-badge&labelColor=071008&color=4cff78">
  <img alt="API" src="https://img.shields.io/badge/DATA-RIOT_API-0b0f0c?style=for-the-badge&labelColor=071008&color=d8ff72">
  <img alt="Build" src="https://img.shields.io/badge/BUILD-0.1+-0b0f0c?style=for-the-badge&labelColor=071008&color=4cff78">
</p>

<p align="center">
  <img src="assets/signal_divider.svg" width="100%" alt="">
</p>

<p align="center">
  <img src="assets/section_release_metrics.svg" alt="[ RELEASE METRICS ]" width="100%">
</p>

```text
► PROJECT ........: Miracle442's League Progression Tracker
► ENGINE .........: Official Riot API + Local Persistent History
► REGION .........: EUW
► QUEUE ..........: Ranked Solo/Duo
► HEADQUARTERZ ...: Mean Gurlz
► VISUAL ARCH ....: ASCII / ANSI / techno-occult terminal codex
► BUILD ..........: 0.1+
```

<table>
<tr>
<td width="50%">

<p align="center">
  <img src="assets/section_summoner_01.svg" alt="[ SUMMONER 01 ]" width="100%">
</p>
```text
ID ........ Davy442#EUW
RANK ...... SILVER IV
LP ........ 81
TARGET .... GOLD IV
SEASON .... 23-10
RECENT .... 14-6
```

</td>
<td width="50%">

<p align="center">
  <img src="assets/section_summoner_02.svg" alt="[ SUMMONER 02 ]" width="100%">
</p>
```text
ID ........ SDSarah#EUW
RANK ...... SILVER IV
LP ........ 68
TARGET .... GOLD IV
SEASON .... 193-190
RECENT .... 12-8
```

</td>
</tr>
</table>

---

<p align="center">
  <img src="assets/section_live_rank_tracking.svg" alt="[ LIVE RANK TRACKING ]" width="100%">
</p>

The control room tracks the duo's ranked state directly through the official Riot API.

- Current **Tier / Division / LP**
- Season **Wins / Losses**
- Season **Win Rate**
- Recent **W/L record**
- Recent **Win Rate**
- Last-10 form
- Riot ID → **PUUID**
- Ranked Solo/Duo filtering
- Live data refresh

```text
CURRENT .......... SILVER IV / 81 LP
TARGET ........... GOLD IV
REMAINING ........ 219 RP

PROGRESS
[▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░] 68%
```

---

<p align="center">
  <img src="assets/section_improvement_engine.svg" alt="[ IMPROVEMENT ENGINE ]" width="100%">
</p>

Instead of only showing rank, the tracker compares recent play against the previous sample.

```text
METRIC              LAST 10      PREV 10       DELTA
──────────────────────────────────────────────────────
CS/MIN ............ 7.40         6.70          +0.70 ↑
KDA ............... 2.59         2.31          +0.28 ↑
DMG/MIN ........... 611          554           +57   ↑
DEATHS/GAME ....... 5.4          6.8           -1.4  ↑
VISION/MIN ........ 1.28         1.12          +0.16 ↑
```

<details>
<summary><strong>► PERSONAL PERFORMANCE TARGETS</strong></summary>

<br>

- Target **CS/min**
- Target **KDA**
- Target **Damage/min**
- Target **Vision/min**
- Maximum **Deaths/game**
- Improvement / decline indicators
- Completion bars
- Automatic trend observations

```text
CS/MIN ............ [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░]  7.4 / 8.0
KDA ............... [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░]  2.59 / 3.00
DMG/MIN ........... [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░]  611 / 700
DEATH CONTROL ..... [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░]  5.4 / ≤6.0
```

</details>

---

<p align="center">
  <img src="assets/section_goal_system.svg" alt="[ GOAL SYSTEM ]" width="100%">
</p>

Each summoner has an independent climb target.

<table>
<tr>
<td>

```text
┌──[ DAVY442 ]──────────────────────┐
│ CURRENT .... SILVER IV / 81 LP   │
│ TARGET ..... GOLD IV             │
│ REMAINING .. 219 RP              │
│ GOAL ................. 68%       │
└──────────────────────────────────┘
```

</td>
<td>

```text
┌──[ SDSARAH ]──────────────────────┐
│ CURRENT .... SILVER IV / 68 LP   │
│ TARGET ..... GOLD IV             │
│ REMAINING .. 232 RP              │
│ GOAL ................. 65%       │
└──────────────────────────────────┘
```

</td>
</tr>
</table>

Targets include:

`RANK` · `DIVISION` · `LP` · `TARGET DATE` · `RP REMAINING` · `GOAL %` · `CLIMB PACE` · `ETA`

---

<p align="center">
  <img src="assets/section_duo_lab.svg" alt="[ DUO LAB ]" width="100%">
</p>

```text
PAIR                    GAMES       RECORD       WR
───────────────────────────────────────────────────
TRISTANA + TARIC          14         10-4        71%
SAMIRA + TARIC             3          2-1        67%
```

The duo analysis layer includes:

- Shared games / W-L / Win Rate
- Last-10 duo form
- Champion pair combinations
- Pair-specific WR and KDA
- Blue / Red side performance
- Dragons / Barons / Towers
- First Dragon %
- Average game duration
- Combined deaths
- Combined damage contribution

---

<p align="center">
  <img src="assets/section_session_control.svg" alt="[ SESSION CONTROL ]" width="100%">
</p>

```text
► START SESSION NOW
► END SESSION
► SESSION W/L
► SESSION WIN RATE
► SESSION TIMER
► RANK MOVEMENT
► PLANNED GAMES
► STOP-AFTER-X-LOSSES
► SESSION FOCUS
```

> The session system is also a tilt-control layer: decide the plan before queueing, then measure whether the session followed it.

---

<p align="center">
  <img src="assets/section_match_database.svg" alt="[ MATCH DATABASE ]" width="100%">
</p>

```text
DATE         RESULT   DAVY442                 SDSARAH               TIME
────────────────────────────────────────────────────────────────────────
2026-09-27   LOSS     TRISTANA 4/8/2          TARIC 0/6/10          27m
2026-09-27   WIN      TRISTANA 14/3/3         TARIC 4/4/20          34m
2026-09-25   WIN      SAMIRA 7/9/7            TARIC 2/6/19          30m
```

`WIN / LOSS FILTER` · `CHAMPION SEARCH` · `DURATION` · `KDA` · `DUO RESULT`

---

<p align="center">
  <img src="assets/section_local_history_core.svg" alt="[ LOCAL HISTORY CORE ]" width="100%">
</p>

Riot gives the current rank and match history, but not a complete historical LP-after-every-game ledger.

The tracker therefore stores small local snapshots:

```text
timestamp
player
tier
division
LP
effective_rank_points
```

That local history enables:

- Long-term progression graphs
- Session rank movement
- Climb pace
- Historical goal %
- Better projections

---

<p align="center">
  <img src="assets/section_system_flow.svg" alt="[ SYSTEM FLOW ]" width="100%">
</p>


---

<p align="center">
  <img src="assets/section_data_privacy.svg" alt="[ DATA / PRIVACY ]" width="100%">
</p>

- Uses the official Riot API
- No U.GG / XDX scraping required
- API credentials must **never** be committed to GitHub
- Local history remains local
- Personal / non-commercial project

<p align="center">
  <img src="assets/signal_divider.svg" width="100%" alt="">
</p>

```text
"I jagten på det uopnåelige præsenterer vi hermed
 Miracle442's League Progression Tracker
 made for Mean Gurlz Headquarterz 💅🫦"

```

### Disclaimer

Miracle442's League Progression Tracker is a personal project and is not endorsed by Riot Games.  
League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.
