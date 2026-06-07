export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
}

const SECTIONS: { title: string; content: string }[] = [
  {
    title: '[HIGH-PRIORITY] AliScript Command Signatures — Quick Reference',
    content: `This is the authoritative source. Never invent arguments not listed here.

NO-ARGUMENT COMMANDS (write alone on their own line):
PATHFIND, FIRE, BURST_FIRE, SCAN, MOVE, MOVE_FAST, BACKUP, STOP, SHIELD, CLOAK, MINE

COMMANDS WITH ARGUMENTS:
- WAIT N               — N is number of ticks (1 tick = 100ms)
- TELEPORT x, y         — x and y are arena coordinates
- DASH distance         — distance is a number (lateral thrust)
- SET var = expr        — variable assignment (free, works in STASIS)
- TAUNT "message"       — displays a message above the robot (free)

FUNCTIONS THAT RETURN VALUES:
- GET_ALL_VISIBLE_ENEMIES()   — no args, returns Array<[distance, x, y, health]>
- RAYCAST(angle)              — one arg (relative radian offset), returns distance number
- BROADCAST(data)             — one arg (any value), returns number of receivers
- RECEIVE()                   — no args, returns Array of messages
- LENGTH(arr)                 — one arg (array or string), returns number
- PUSH(arr, value)            — two args, returns new length
- POP(arr)                    — one arg, returns removed value

STATUS FUNCTIONS (log only, return nothing):
GET_HEALTH(), GET_ENERGY(), GET_POSITION(), GET_ROTATION(),
GET_DISTANCE(), GET_VISIBLE_COUNT(), GET_OBSTACLE_TYPE(), GET_ENERGY_PCT(),
GET_FOV_DIR(), GET_OBSTACLE_DISTANCE()

MATH FUNCTIONS:
ABS(x), SQRT(x), POW(b,e), SIN(x), COS(x), TAN(x), ATAN2(y,x),
MIN(a,b), MAX(a,b), FLOOR(x), CEIL(x), ROUND(x), LOG(x), RANDOM()`,
  },
  {
    title: 'Platform Overview',
    content: `Logic Arena is a competitive real-time robot battle simulator where players write AliScript code to control robots in arena combat. The platform features a Dashboard for managing scripts and matchmaking, a Docs page with the full AliScript language reference, a Garage for robot customization, Campaign mode with 60+ levels, a Leaderboard for rankings, Tournaments, and the Arena where real-time battles happen at 60 FPS. Players start by writing an AliScript program, selecting a robot chassis, and entering matchmaking. Matches are AI-vs-AI — the code you write controls your robot automatically.`,
  },
  {
    title: 'Dashboard',
    content: `The Dashboard (/dashboard) is the home page after login. It shows your match history, win/loss record, current rank, and XP progress. From here you can create and manage AliScript files, enter matchmaking (1v1 Quick Match or Ranked), browse recent matches, and access all other sections via the sidebar: Docs, Garage, Leaderboard, Tournaments, Campaign, Black Market, Settings, and Profile. Scripts are stored server-side and can be selected for use in matches.`,
  },
  {
    title: 'Script Management',
    content: `Scripts are the core of Logic Arena. You write AliScript code in the built-in editor with syntax highlighting, auto-complete, semantic warnings (contradictory actions, redundant SETs, dead code), and an interactive playground on the Docs page. Each script can be titled and saved. The editor shows character count and has tabs for multiple scripts. Scripts are used in matches by pre-selecting which script your robot runs. The Interactive Playground lets you test scripts by parsing them and showing the tokenized output with opcode counts.`,
  },
  {
    title: 'Matchmaking & Battles',
    content: `Matchmaking has two modes: Quick Match (unranked) and Ranked (affects your MMR/ELO). Once matched, you're taken to the Arena where your AI script battles the opponent's script in real-time at 60 FPS. The 3D arena shows two robots with FOV cones, health bars, energy meters, and obstacles. Matches last until one robot's HP reaches 0. Spectator mode lets you watch live matches. The arena supports Training Mode (vs AI bots) and Racing Mode (obstacle course time trials). Matches are recorded and available for replay via the Replay page.`,
  },
  {
    title: 'Arena UI',
    content: `The Arena (/arena) is the 3D battle viewer. On desktop, it shows a full HUD with health bars, energy bars, script output, and timers overlaid on the 3D scene. On mobile, the HUD is repositioned to bottom/top corners and a virtual joystick and action buttons replace keyboard controls. The scene renders two robots (GLB models), obstacles, a grid floor, and FOV cones. A chat panel on the right shows real-time script output. The arena uses React Three Fiber for 3D rendering with InstancedMesh for obstacles.`,
  },
  {
    title: 'Garage',
    content: `The Garage (/garage) lets you customize your robots. You can change chassis models (different GLB models like robot.glb, robot2.glb, armored-robot.glb, bunny.glb), apply color schemes, equip cosmetics, and view your robot collection. Cosmetics include paint jobs, decals, and weapon skins purchased from the Black Market. Each robot has a name, chassis type, and cosmetic loadout. Changes are visible in the arena during battles.`,
  },
  {
    title: 'Campaign',
    content: `The Campaign (/campaign) features 60+ levels organised across multiple stages. Each level presents a specific combat challenge with pre-defined enemy scripts and arena layouts. Completing levels earns XP, coins, and sometimes exclusive cosmetics. Levels have difficulty ratings and star rankings based on performance (time to win, HP remaining, etc.). The campaign teaches AliScript progressively — early levels teach basic movement, mid levels introduce combat and sensors, late levels require advanced tactics like swarm coordination and predictive aiming.`,
  },
  {
    title: 'Leaderboard',
    content: `The Leaderboard (/leaderboard) displays ranked players by MMR/ELO score. It shows username, rank, win/loss record, win rate percentage, total matches played, and current division/rank tier. The leaderboard has both global and friends-only views. Rank tiers include Bronze, Silver, Gold, Platinum, Diamond, and Legend. Rankings reset each season (approximately 3 months).`,
  },
  {
    title: 'Tournaments',
    content: `Tournaments (/tournaments) are scheduled competitive events with bracket-style elimination. Players register before the tournament starts, then compete in rounds. Tournament brackets are rendered as SVG bracket trees. Each round has a set time limit. Winners advance, losers are eliminated. Tournament winners earn special badges, exclusive cosmetics, and large XP/coin rewards. Tournaments support single-elimination and round-robin formats. Match schedules and results are shown in the tournament detail view.`,
  },
  {
    title: 'Black Market',
    content: `The Black Market (/black-market) is a shop where players spend coins earned from matches and campaigns. Items include robot chassis, paint jobs, decals, weapon skins, emotes, and nameplate styles. Items are organized by category (Chassis, Paint, Decals, Skins). Featured items rotate periodically. The market has a preview panel showing how items look on your robot before purchase. Rarer items cost more and may be exclusive to certain seasons or events.`,
  },
  {
    title: 'Settings & Profile',
    content: `Settings (/settings) lets you change your display name, avatar, email preferences, password, and theme. Three themes are available: Cyberpunk (default dark with cyan accent), Violet Sovereign (light theme with violet accent), and Obsidian Ember (dark warm with amber accent). The profile page (/profile/[username]) shows your public stats: rank, win/loss, match history, achievements, and equipped cosmetics. You can also view other players' profiles.`,
  },
  {
    title: 'Auth & Security',
    content: `Authentication uses JWT tokens stored in HttpOnly, Secure, SameSite=Strict cookies (la_session). Login supports email/password, Google OAuth, and GitHub OAuth. New users register with email, username, and password. Rate limiting protects auth endpoints (5 attempts per 15 minutes). The server uses Helmet for security headers, strict CORS whitelist, and 100kb payload limits. All API requests go through /api prefix with cookie-based auth.`,
  },
  {
    title: 'Replay System',
    content: `The Replay page (/replay/[matchId]) lets you watch past matches. Controls include Play/Pause, Skip Back, and speed adjustment. The replay uses the same 3D scene as the live arena but runs from recorded match data. You can see both robots' HP/energy history, script decisions, and the full timeline of events. Replays are useful for analyzing strategies and debugging scripts.`,
  },
  {
    title: 'AliScript Execution Model',
    content: `AliScript runs top-to-bottom every tick (10 ticks/second = 100ms per tick). Variables RESET every tick — use the initialization pattern: "IF NOT initialized THEN SET initialized = TRUE END" to persist state. TLE (Time Limit Exceeded) fires at 2000 operations per tick. Nested O(N²) loops will crash your script. Energy regenerates at 3/tick normally. STASIS mode (energy ≤ 0) blocks all movement and combat commands. WAIT N suspends execution for N ticks. The Action Optimizer deduplicates commands: same action dispatched once per tick max. PATHFIND followed by STOP in the same tick cancels PATHFIND.`,
  },
  {
    title: 'AliScript Commands',
    content: `MOVE (2 energy/tick): move forward. MOVE_FAST (4 energy/tick): 2x speed movement. BACKUP (2 energy/tick): reverse movement. PATHFIND (3 energy/tick): A* pathfinding to nearest visible enemy. STOP (free): halt all movement. FIRE (8 energy/shot): deals 25 HP damage, requires enemy in 120° FOV. BURST_FIRE (18 energy/burst): fires 3 shots at -8°, 0°, +8° for up to 24 HP damage. SCAN (3 energy/call): rotates FOV cone +15°. WAIT N (free): suspends execution for N ticks. All movement and combat commands except STOP and WAIT are blocked during STASIS.`,
  },
  {
    title: 'AliScript Identifiers',
    content: `Read-only identifiers (can't be SET): health (0-100), MY_ENERGY (0-100), IN_STASIS (true when energy ≤ 0), CAN_SEE_ENEMY (true if enemy in 120° FOV), distance (to nearest visible enemy), NEAREST_VISIBLE_X/Y (enemy coordinates), POSITION_X/Y (your coordinates), rotation (body angle in radians, writable via SET), target_vx/target_vy (enemy velocity for predictive aiming), bullet_speed (400 units/sec).`,
  },
  {
    title: 'AliScript Control Flow & Data Structures',
    content: `Control flow: IF/THEN/ELSE/END for conditional logic, WHILE DO/END (max 10 iterations per tick to prevent infinite loops), FOR i = 0 TO n DO/END, FUNCTION name(params)/CALL name(args)/RETURN, BREAK/CONTINUE. Data structures: SET arr = [1,2,3] creates arrays, access with arr[0], LENGTH(arr), PUSH(arr, val), POP(arr). SET obj = {key: "val"} creates dictionaries, access with obj.key or obj["key"], mutate with SET obj.key = val. Math library: ABS, SQRT, POW, SIN, COS, TAN, ATAN2, MIN, MAX, FLOOR, CEIL, ROUND, LOG, RANDOM. Advanced sensors: GET_ALL_VISIBLE_ENEMIES() returns unsorted Array<[distance, x, y, health]>, RAYCAST(angle) returns distance to first solid object. Swarm: BROADCAST(data) sends to teammates, RECEIVE() returns Array of messages (deep-copied).`,
  },
  {
    title: 'Semantic Warnings & Best Practices',
    content: `The editor shows semantic warnings: Contradictory — PATHFIND then STOP in same block (Action Optimizer cancels the PATHFIND). Redundant — SET x = 5 then SET x = 7 without reading x between. Dead code — statements after RETURN/BREAK/WAIT (never execute). Best practices: Always use the initialization pattern for persistent variables. Prefer SCAN + FIRE combos over blindly firing. Use PATHFIND sparingly (3 energy/tick adds up). In swarm modes, use BROADCAST for coordination. Avoid O(N²) nested loops — they'll hit the 2000 op TLE limit.`,
  },
  {
    title: 'Training & Racing Modes',
    content: `Training Mode is a practice environment in the Arena where you fight AI-controlled bots with pre-set difficulty levels. No ELO is affected. Racing Mode is a time-trial obstacle course where your robot navigates a track with walls, traps, and checkpoints. The goal is the fastest completion time. Both modes are accessible from the Arena and are useful for testing scripts before competitive play.`,
  },
  {
    title: 'Energy System Mechanics',
    content: `Energy starts at 100 and regenerates at 3/tick regardless of STASIS state. Most commands consume energy (MOVE=2, MOVE_FAST=4, BACKUP=2, PATHFIND=3, FIRE=8, BURST_FIRE=18, SCAN=3). When energy reaches 0, IN_STASIS becomes true, and all movement/combat commands are blocked (only STOP and WAIT work). Energy management is critical — conserve energy by using cheaper commands when possible and planning attack bursts. The Energy Cost docs section has a full cost breakdown and an interactive simulator.`,
  },
  {
    title: 'Theme System & Appearance',
    content: `Three themes available: CYBERPUNK (default dark neon, bg #030712, accent cyan #22d3ee), VIOLET SOVEREIGN (light theme, bg #f0f2fa, accent purple #5b21b6), OBSIDIAN EMBER (dark warm, bg #0e0a04, accent amber #f59e0b). Switch themes on mobile: tap the ThemeSwitcher icon button in the top-right corner of the MobileHeader. Switch on desktop: use the ThemeSwitcher dropdown in the Dashboard sidebar. Switch in Settings: go to Settings > Appearance and click one of the 3 theme cards. Themes use the data-theme attribute via next-themes. All colors are CSS variables — never hardcoded.`,
  },
  {
    title: 'Mobile Features & Controls',
    content: `On mobile, the arena shows a MobileTopRightHUD with compact stats (FPS, fog, connection, mode data). MobileControls provide virtual joystick and action buttons instead of keyboard. The MobileHeader has a ThemeSwitcher icon button (top-right) for theme switching. Bottom navigation has 5 items with a floating SYSTEM hub as the 5th item. Touch targets are minimum 44x44px. Safe-area-inset support for notched phones. Pull-to-refresh on some pages. Portrait orientation lock in arena warns users. Auto fullscreen on mobile when entering arena.`,
  },
  {
    title: 'Points & Economy System',
    content: `Points are the main currency in Logic Arena. Earned from completing campaign levels (EASY=50pts, MEDIUM=120pts, HARD=300pts, EXTREME=500pts) and from playing matches. Spent in the Black Market on cosmetic items: robot chassis (UNIT-01 free, UNIT-02 free, ARMORED MECH 1800pts, SANDMAN 2400pts), paint jobs (Factory Spec free, CRIMSON FURY 300pts, VOID BLACK 500pts RARE, AURORA SHIFT 700pts RARE, SOLAR FLARE 1200pts LEGENDARY), and tracer rounds (PULSE TRACER 200pts, INFERNO SHOT 450pts RARE, GHOST BEAM 600pts LEGENDARY). Three rarities: COMMON (cyan), RARE (purple), LEGENDARY (amber). Starter items: chassis-unit-01, paint-crimson, tracer-pulse (all free).`,
  },
  {
    title: 'Campaign Level Details',
    content: `60 levels across 6 categories: Conditionals (IF/ELSE logic), Loops (WHILE patterns), Arrays (sensor arrays), Data Structures (dictionaries/state machines), Recursion (nested patterns), Graph Theory (pathfinding). 4 difficulty tiers with point rewards: EASY=50pts, MEDIUM=120pts, HARD=300pts, EXTREME=500pts. Each level has 3 progressive hints (1st free, 2nd costs 10pts, 3rd costs 25pts), a 3-star rating system, and unlock/completion tracking. Boss levels at order 10 have a cinematic shake intro (560ms). POST to /campaign/levels/{id}/complete to submit completion. Desktop: side-by-side editor + 3D canvas. Mobile: stacked layout with scroll.`,
  },
  {
    title: 'Tournament System Details',
    content: `Tournaments support 2/4/8 player brackets with SVG-based bracket tree visualization. Three statuses: WAITING (yellow/QUEUE, players can join), IN_PROGRESS (cyan/LIVE, bracket locked), COMPLETED (green/DONE, winner declared). Round-based match system with matchIndex. Creator can start the tournament when ready. Players can join open tournaments, guest users blocked. Tournament stats bar shows TOTAL, LIVE, QUEUE counts. Leaderboard shows rank tiers: Bronze, Silver, Gold, Platinum, Diamond, Legend. Seasons reset every ~3 months.`,
  },
  {
    title: 'Arena Guide — Game Modes & Maps',
    content: `Six game modes: DEATHMATCH/COMBAT (1v1 elimination, 5:00 timeout), SURVIVAL (endless waves, outlast enemies), CAPTURE THE FLAG (8:00, capture 3 flags, A* pathfinding advised), KING OF THE HILL (6:00, hold center zone, 1pt/tick), CHECKPOINT RACING (fastest run, pass all checkpoints), SANDBOX TRAINING (no limit, test and debug scripts). Three arena maps: NEO-CYBER GRID (standard friction 1.0, no hazards, symmetric obstacles), MAGMA CORE (lava hazard -10HP/sec, standard friction), GLACIAL TUNDRA (ice surface friction 0.25, inertia sliding physics).`,
  },
  {
    title: 'Settings Page Details',
    content: `Settings (/settings) has 5 sections. Identity: avatar upload (JPG/PNG/WebP, 2MB max), username edit, email edit, connected accounts (Google/GitHub), logout. Security: change password (current + new + confirm, min 8 chars), account deletion (type username to confirm). Appearance: 3 theme cards with live preview. Arena Preferences: graphics quality (Low/Medium/High), sound effects toggle, music toggle, click sounds toggle. Notifications: challenge requests toggle, tournament alerts toggle, match results toggle. Guest users see a lock overlay prompting registration.`,
  },
  {
    title: 'FOV & Targeting System',
    content: `The Field of View (FOV) cone is 120° by default, centered on the robot's facing direction (the "rotation" value). CAN_SEE_ENEMY is true only when an enemy is inside this cone. FIRE and BURST_FIRE require CAN_SEE_ENEMY to be true (energy is NOT deducted on failed FIRE). SCAN rotates the FOV cone +15° per call, allowing you to sweep for enemies. GET_ALL_VISIBLE_ENEMIES() returns only enemies currently in the FOV cone. For predictive aiming, use target_vx/target_vy with bullet_speed (400) to calculate lead.`,
  },
];

/**
 * Section-aware chunker: keeps each section as a single chunk.
 * Long chunks are split at 200-word boundaries with 20-word overlap.
 */
export function buildKnowledgeBase(): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  let id = 0;

  for (const section of SECTIONS) {
    const words = section.content.split(/\s+/);
    const targetWords = 200;
    const overlap = 20;

    if (words.length <= targetWords) {
      chunks.push({
        id: `kb-${id++}`,
        title: section.title,
        content: section.content,
      });
    } else {
      for (let i = 0; i < words.length; i += targetWords - overlap) {
        if (i > 0 && i + overlap > words.length) break;
        chunks.push({
          id: `kb-${id++}`,
          title: section.title,
          content: words.slice(i, i + targetWords).join(' '),
        });
      }
    }
  }

  return chunks;
}

export const KNOWLEDGE_BASE = SECTIONS;
