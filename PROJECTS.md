# Where my projects live

A map from game name to folder on this machine, because the folder names and the
repository names do not always match the name of the game. If you are an AI
assistant and you need to read the source of one of my games, this is the file
that tells you where it is.

Last verified: 9 August 2026.

---

## Quick table

| Game | Local folder | GitHub repo | Engine | Playable |
|---|---|---|---|---|
| **Cyber Station** | `C:\Users\olive\Documents\Unity Projects & Builds\TSA` | [OliverNealDev/CyberStation](https://github.com/OliverNealDev/CyberStation) | Unity 6 (6000.3.8f1) | [itch.io](https://olivernealdev.itch.io/cyber-station), Windows download only |
| **Tile Turfer** | `C:\Users\olive\ThreatHealth` | [OliverNealDev/TileTurfer](https://github.com/OliverNealDev/TileTurfer) | Unity 6 (6000.0.55f1), URP 2D | [itch.io](https://olivernealdev.itch.io/tile-turfer) |
| **Minimalists** | `C:\Users\olive\Minimalists` | [OliverNealDev/Minimalists](https://github.com/OliverNealDev/Minimalists) | Unity 6 (6000.0.45f1) | [itch.io](https://olivernealdev.itch.io/minimalists) |
| **Wanted** | `C:\Users\olive\Wanted` | [OliverNealDev/Wanted](https://github.com/OliverNealDev/Wanted) | Unity 6 (6000.0.45f1), URP 2D | [itch.io](https://olivernealdev.itch.io/wanted) |
| **Unicellular** | `C:\Users\olive\Documents\GitHub\UnicellularRebuiltECS` | [OliverNealDev/Unicellular](https://github.com/OliverNealDev/Unicellular) | Unity 6 (6000.0.45f1) | [itch.io](https://olivernealdev.itch.io/unicellular) |
| **3D Netcode Tank Game** | `C:\Users\olive\Documents\GitHub\NetcodeTankGame` | [OliverNealDev/NetcodeTankGame](https://github.com/OliverNealDev/NetcodeTankGame) | Unity 6 (6000.0.33f1) | Source only |
| **Pinnable** | `C:\Users\olive\Documents\Unity Projects & Builds\Pinnable-main\Pinnable-main` | [OliverNealDev/Pinnable](https://github.com/OliverNealDev/Pinnable) | Unity 2022.3 LTS (opens in Unity 6) | [itch.io](https://olivernealdev.itch.io/pinnable) |
| **Out of Water** (Shiverbug Studios, work) | `C:\Users\olive\Documents\Unity Projects & Builds\Turtle-Seagull` | ShiverbugStudios/Turtle-Seagull (private) | Unity 6 (6000.3.5f2) | Unreleased |
| **Portfolio site** | `C:\Users\olive\Documents\GitHub\portfolio` | [OliverNealDev/portfolio](https://github.com/OliverNealDev/portfolio) | Static HTML/CSS/JS | [oliverneal.dev](https://oliverneal.dev) |
| **GitHub profile README** | `C:\Users\olive\Documents\GitHub\OliverNealDev` | [OliverNealDev/OliverNealDev](https://github.com/OliverNealDev/OliverNealDev) | Markdown | [Profile](https://github.com/OliverNealDev) |

---

## The names that do not match

Three of these will trip you up, so they are worth stating plainly:

- **`TSA` is Cyber Station.** `TSA` was the working title. The GitHub repository was
  later renamed to `CyberStation`, but the local folder, the `.sln` and the git
  remote all still say `TSA`.
- **`ThreatHealth` is Tile Turfer.** Same story: working title kept locally, repository
  renamed to `TileTurfer` on GitHub.
- **`Turtle-Seagull` is Out of Water.** That is the studio's internal project name for
  the game at Shiverbug Studios.
- **`UnicellularRebuiltECS` is Unicellular.** The folder is named after a planned ECS
  rebuild that has not happened; the code in it is the GameObject version that shipped.
  The GitHub repository is now just `Unicellular`.

Because the repositories were renamed after cloning, `git remote -v` in the local
folders still shows the old URLs (`.../TSA.git`, `.../ThreatHealth.git`,
`.../UnicellularRebuiltECS.git`). GitHub redirects those, so pushing and pulling
still works.

---

## What each game actually is

**Cyber Station** (Apr 2026, solo, Unity 3D). A neon station management game and my
final-year artefact: placement and construction, a fixed 10 Hz passenger simulation
that routes by lowest estimated total delay, coordinated staff AI, a six-factor
station rating system that feeds back into passenger spawn rate. 86 scripts, ~17,100
lines. Scored 90/100 and won Best Games Programming and Development Artefact at
ExpoTees 2026. Breakdown: <https://oliverneal.dev/cyber-station.html>

**Tile Turfer** (Jan 2026, solo, Unity 6 URP 2D). A Splatoon-style turf-war arena
shooter. Procedural cellular-automata caves, a 2D NavMesh baked at runtime, and a
single turf-percentage value that drives fire rate, attack patterns, enemy cap and
spawn interval for both sides. Breakdown: <https://oliverneal.dev/tile-turfer.html>

**Minimalists** (Aug 2025, solo, Unity 3D). A node-conquest RTS pared back to
essentials. Forces are committed by a 25/50/75/100% slider against six distinct AI
personalities, from a 1v1 duel to a four-way free-for-all.
Breakdown: <https://oliverneal.dev/minimalists.html>

**Wanted** (May 2025, solo, Unity 6 URP 2D). A top-down stealth survival game built
in one week for the Tyne to Game jam. No win condition, only a survival timer, one
detection meter that fills four times slower under foliage, three-state officer AI,
six patrol cars and twenty-four officers, 250 procedurally placed trees with
distance-culled 2D shadows. Breakdown: <https://oliverneal.dev/wanted.html>

**Unicellular** (Feb 2025, solo, Unity). An idle simulation holding thousands of
FSM-driven organisms in one scene via a decoupled multi-rate tick (20 Hz behaviour,
0.5 Hz bookkeeping) and time-sliced proximity AI. Stress-tested at 1,000 and 10,000
entities. Breakdown: <https://oliverneal.dev/unicellular.html>

**3D Netcode Tank Game** (Jan 2025, solo, Unity 3D). A server-authoritative
multiplayer tank shooter on Unity Netcode for GameObjects: 64-ray hitscan resolved
inside a ServerRpc, a rate-limited turret rig, Relay-hosted sessions, Unity
Authentication and Cloud Save. Breakdown: <https://oliverneal.dev/tank-game.html>

**Pinnable** (Mar 2024, solo, Unity 2D). An arcade score-attack catch game with a
weighted spawn director, homing and drilling pin behaviours and a Rigidbody2D catch
loop. Breakdown: <https://oliverneal.dev/pinnable.html>

**Out of Water** (Shiverbug Studios, 13 July to 18 September 2026, team). An original
IP two-player splitscreen 3D platformer collectathon in Unity 6. My ownership:
character and enemy gameplay code, the co-op moveset, performance work (GPU-driven
rendering, quality tiers, LOD and culling, plus a profiling tool built for the team),
splitscreen device routing and cameras, a UI Toolkit front end, a decoupled FMOD
audio layer, editor tooling for level designers, and water, caustic and bubble
shaders in Shader Graph and hand-written URP HLSL. **Read-only context: this is the
studio's private repository, not mine to restructure.**

**Space Bar Simulator** (Jan 2026, team of ten, Unreal Engine 5). No local folder on
this machine. A retro-futurist first-person bar simulator built for Teesside
University's Beta Arcade module. My contribution: the player controller on Enhanced
Input, a component-based interaction system behind a Blueprint interface,
camera-blended interactive stations and the UI computer terminal.
Breakdown: <https://oliverneal.dev/space-bar.html>

---

## Other folders you may run into

These exist on the machine but are not portfolio projects, so do not read them for
context on my work unless I ask:

| Folder | What it is |
|---|---|
| `C:\Users\olive\Documents\GitHub\Minimalists` | Stale duplicate clone of Minimalists. The live copy is `C:\Users\olive\Minimalists` |
| `C:\Users\olive\Documents\GitHub\UnnetcodeTankGame` | Duplicate clone of the tank game |
| `C:\Users\olive\Documents\GitHub\PinnableOverhaul` | Abandoned Pinnable rework |
| `C:\Users\olive\Documents\GitHub\newPortfolio`, `newerPortfolio`, `blindPortfolio` | Superseded portfolio drafts. The live site is `portfolio` |
| `C:\Users\olive\Documents\GitHub\HellsChampion`, `TidesOfTheMoon`, `AI-project`, `2D-Games-Development` | University group projects owned by other students |

When a project has both a `C:\Users\olive\<Name>` and a
`C:\Users\olive\Documents\GitHub\<Name>` copy, **the one in the table at the top of
this file is the live one.**

---

## Canonical sources of truth

- <https://oliverneal.dev> for what each project is and how it works
- <https://oliverneal.dev/llms.txt> for a plain-text summary of the whole site
- Each repository's `README.md` for the technical detail of that project
