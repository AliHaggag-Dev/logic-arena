# Logic Arena — Complete Website Guide

## Landing Page (/)
The landing page features a hero section reading "WRITE CODE. BATTLE ROBOTS." with a stats bar showing "6 GAME MODES", "3 ENVIRONMENTS", "60-LEVEL CAMPAIGN", "REAL-TIME BATTLES". Below are: a How It Works section (Write, Deploy, Evolve), a Game Modes showcase (DEATHMATCH, SURVIVAL, CTF, KOTH, RACING, TRAINING), an Environments section (NEO-CYBER, MAGMA CORE, GLACIAL TUNDRA), an AliScript code showcase, a Robot Roster (UNIT-01, UNIT-02, TITAN, SANDMAN), a platform feature grid (8 features), and CTAs: "ENTER THE ARENA" and "CREATE ACCOUNT".

## Login (/login)
Form fields: username (text), password (password). Social auth buttons for Google and GitHub. Links to Register, Forgot Password, and "Continue as Guest". On success, sets an HttpOnly auth cookie and redirects to /dashboard.

## Register (/register)
Form fields: username, email, password. Password strength indicator checks 5 criteria (length, uppercase, lowercase, number, special character). Social auth buttons. On success redirects to /verify-email. Links to Sign In and Continue as Guest.

## Forgot Password (/forgot-password)
Single email field. Sends a 6-digit OTP code to the email. Redirects to /reset-password with email in query params.

## Reset Password (/reset-password)
Two fields: 6-digit OTP code (large centered input) and new password. Posts to /auth/reset-password with code + new password. On success redirects to /login.

## Verify Email (/verify-email)
Single 6-digit OTP code input (large centered, numeric mode). Shows masked email (e.g. a***@domain.com). Code expires in 15 minutes. Links to "Didn't receive a code?" which goes to /forgot-password.

## Dashboard (/dashboard)
The home page after login. Shows match history, win/loss record, current rank, and XP progress. Key features: ArenaSelector (choose game mode + map theme), ScriptCard list of user's scripts with edit/delete/rename, ScriptForm to create new scripts, EditScriptModal (lazy-loaded code editor), AuthModal for guests. On mobile there is a quick lobby link card. Status bar shows connection status. Cyber grid background.

## Script Management
Scripts are the core of Logic Arena. Users write AliScript code in a built-in editor with syntax highlighting, auto-complete, semantic warnings (contradictory actions, redundant SETs, dead code), and an interactive playground on the Docs page. Each script has a title, mode setting (CLASSIC, TACTICAL, or HYBRID), and is stored server-side. Scripts are selected for use in matches. The Interactive Playground lets users test scripts by parsing and showing tokenized output with opcode counts.

## Settings (/settings)
Five expandable sections (accordion on mobile, sidebar on desktop):

### Identity
Avatar upload (JPG/PNG/WebP, max 2MB), username edit, email edit, connected accounts (Google/GitHub), logout button.

### Security
Change password (current + new + confirm, min 8 chars). "Danger Zone" with account deletion (type username to confirm).

### Appearance — Theme Selector
Three themes: CYBERPUNK (default dark neon, bg #030712, accent cyan #22d3ee), VIOLET SOVEREIGN (light theme, bg #f0f2fa, accent purple #5b21b6), OBSIDIAN EMBER (dark warm, bg #0e0a04, accent amber #f59e0b). On mobile, themes are switched via the ThemeSwitcher icon button in the MobileHeader (top-right). On desktop, themes are switched via the ThemeSwitcher dropdown in the Dashboard sidebar. Themes use the data-theme attribute via next-themes library.

### Arena Preferences
Graphics quality: Low, Medium, or High. Toggles for Arena sound effects, Music, and Click sounds.

### Notifications
Three toggles: Challenge requests, Tournament alerts, Match results.

## Arena Guide (/arena-guide)
Two tabs: Combat Protocols (game modes) and Arena Maps (environments).

### 6 Game Modes
1. DEATHMATCH (COMBAT) — 5:00 timeout, eliminate enemy, normal energy regen
2. SURVIVAL — Infinite (outlast), multiple aggressive bots, circle strafe advice
3. CAPTURE THE FLAG — 8:00 timeout, capture 3 flags, A* pathfinding advised
4. KING OF THE HILL — 6:00 timeout, hold center zone, 1 point per tick scoring
5. CHECKPOINT RACING — Fastest run wins, pass all checkpoints, full thrust
6. SANDBOX TRAINING — No limit, test and debug scripts, passive target

### 3 Arena Maps
1. NEO-CYBER GRID — Standard friction (1.0), no hazards, symmetric obstacles
2. MAGMA CORE — Lava hazard (-10 HP/sec), standard friction
3. GLACIAL TUNDRA — Ice surface, friction 0.25, inertia sliding physics

## Campaign (/campaign)
60 levels across 6 tabs (categories):
- Conditionals — "Master IF/ELSE logic to defeat reactive enemies"
- Loops — "Exploit WHILE patterns to outlast burst-fire opponents"
- Arrays — "Process sensor arrays to predict enemy trajectories"
- Data Structures — "Deploy dictionaries and state machines against apex threats"
- Recursion — "Unravel nested combat patterns with self-referencing logic"
- Graph Theory — "Navigate connected threat networks and pathfinding algorithms"

Each level has: title, description, 3 progressive hints (1st free, 2nd costs 10 points, 3rd costs 25 points), concept taught, difficulty (EASY=50pts, MEDIUM=120pts, HARD=300pts, EXTREME=500pts), 3-star rating system with star thresholds from server, unlock/completion status. Boss levels at order 10 have a cinematic shake intro (560ms). Completing a level posts to /campaign/levels/{id}/complete.

## Campaign Level Detail (/campaign/[id])
Full battle experience: write AliScript in a textarea editor, click "FIGHT" button with haptic feedback (50ms vibration). The fight streams authoritative `campaignFrame` payloads from the server while the engine advances fixed 60 FPS simulation steps. Obstacles come from `getSceneForLevel()`. Victory/defeat/draw modal counts points and stars immediately, preserves best-star tracking, and prefetches the next level for instant loading. Desktop: side-by-side editor + 3D canvas. Mobile: stacked with scroll.

Campaign level fights support server-side pause/resume through `campaign:pause`, `campaign:resume`, and `campaign:pause-state`. Pausing freezes the authoritative `CampaignSession`; resuming shifts wall-clock combat timestamps forward so wall-hit feedback, shield-hit feedback, and mine arming remain correct. Finished fights expose temporary in-memory replay controls over the canvas: play/pause, scrub, reset, and speed cycling.

## Tournaments (/tournaments)
List of tournaments with create/join functionality. Each tournament has: name, status (WAITING=yellow/QUEUE, IN_PROGRESS=cyan/LIVE, COMPLETED=green/DONE), participant progress bar (up to 8 players), creator link. Supports 2/4/8 player brackets with SVG-based bracket tree visualization. Round-based match system with matchIndex. Creator can start the tournament. Stats bar shows TOTAL, LIVE, QUEUE counts. Polls every 5 seconds with visibility pause.

## Tournament Detail (/tournaments/[id])
Full bracket visualization via BracketSVG (SVG bracket tree). Features: TournamentHeader (name, status, start button), BracketSVG (visual bracket with rounds and matches), MatchSidebar (player's match info, simulate/play buttons), scanline overlay. Responsive mobile layout.

## Leaderboard (/leaderboard)
Global ELO leaderboard from GET /users/leaderboard. Shows: rank, username, online status (real-time via WebSocket), match count, achievements, combat stats. Challenge button per user (from leaderboard source). Spectate button if user is in a match. Rank bar cap: 1000 entries. Polls every 30s with visibility pause. Rank tiers: Bronze, Silver, Gold, Platinum, Diamond, Legend. Seasons reset approximately every 3 months.

## Black Market (/black-market)
Shop where players spend Points (earned from campaign levels and matches). Three categories:

### Chassis (Robot Models)
- UNIT-01 — Free (COMMON)
- UNIT-02 — Free (COMMON)
- ARMORED MECH — 1800 points (LEGENDARY)
- SANDMAN — 2400 points (LEGENDARY)

### Paint (Neon Paints)
- Factory Spec — Free
- CRIMSON FURY — 300 points
- VOID BLACK — 500 points (RARE)
- AURORA SHIFT — 700 points (RARE)
- SOLAR FLARE — 1200 points (LEGENDARY)

### Tracer (Tracer Rounds)
- PULSE TRACER — 200 points
- INFERNO SHOT — 450 points (RARE)
- GHOST BEAM — 600 points (LEGENDARY)

Rarity colors: COMMON (cyan), RARE (purple), LEGENDARY (amber). Starter items (free): chassis-unit-01, paint-crimson, tracer-pulse. Features include MarketGrid browsing, ShowroomPanel 3D preview, purchase flow (POST /users/black-market/purchase), equip flow (POST /users/black-market/equip), toast notifications.

## Garage (/garage)
Robot customization hangar. Three tabs: Chassis, Paint, Tracer. Shows only items the user has unlocked (purchased from Black Market). 3D preview of selected chassis with paint + tracer colors. Equip button per item. Responsive: VaultMobileLayout and VaultDesktopLayout. Guest users see "VAULT LOCKED" modal.

## Garage Robot Detail (/garage/[robotId])
3D robot viewer (Three.js via RobotViewer). Color picker (preset colors including DEFAULT + named colors). Save loadout button (PATCH /users/profile). Mobile sticky footer with save. Four robots: UNIT-01, UNIT-02, TITAN, SANDMAN.

## Profile (/profile)
My Profile page showing: HeroSection (avatar, username, rank, member since, dominant combat stat), StatCardsSection (total matches, wins, losses, win rate), AchievementsList (unlocked achievements with levels), AnalyticsSection (radar chart of 5 combat stats: efficiency, aggression, defense, precision, speed), MatchHistorySection (recent matches). Dominant stat color determines profile accent color.

## Public Profile (/profile/[username])
Same layout as My Profile but read-only. Fetches from GET /users/{username}/public. Has back button navigation and error states (NOT_FOUND, NETWORK, UNKNOWN).

## Arena (/arena)
Full-screen 3D battle canvas (Three.js via Scene3D). Supports query params: scriptId, matchId, mode, matchMode, spectate, theme, and aiDifficulty for Practice vs AI launches.

### Game Modes in Arena
- CLASSIC — Token-based editing (10 token budget), live script editing during match
- TACTICAL — Round-based with BreakScreen and RoundTransitionOverlay
- HYBRID — Combined tactical and classic features
- TRAINING_SOLO — Sandbox with TrainingHUD (shots fired, dummies destroyed, timer)
- RACING — Checkpoint racing with RacingHUD

### HUD Elements
- DesktopHUD — full interface: robot selector, fog toggle, script info, stats
- MobileTopRightHUD — compact stats (FPS, fog, connection, mode data)
- MobileControls — touch controls, robot selection, classic mode editor
- SpectatorHUD — spectator controls
- WinnerScreen — match result overlay with rematch, AI bonus breakdowns, and transient guest performance stats
- OrientationLock — portrait mode warning on mobile
- PhaseBanner — shows combat round or tactical break timer (TACTICAL/HYBRID modes)

### Arena Features
60 FPS game loop, FPS counter, graphics quality setting (low/medium/high), fog of war toggle, sound effects, tracer fire and speech bubble effects, spectator count overlay, automatic fullscreen on mobile, WebSocket real-time state sync. 4 robot chassis: unit-01, unit-02, titan, sandman. 3 map themes: CYBER, MAGMA, GLACIAL. Guest sessions resolve scripts asynchronously and use guarded join emission so the 3D canvas does not freeze in an empty state.

## Replay (/replay/[matchId])
Frame-by-frame playback of persisted multiplayer matches. ReplayCanvas renders 2D match state. ReplayControls: play/pause, scrub, speed control, reset. Snapshot-based: fetches from GET /users/matches/{matchId}/replay and reads `Match.replayData`. Shows legend (robot circle, projectile dot), speed display (frames/s), duration, date, match ID. Campaign level replay controls are separate and temporary to the active level session.

## Lobby (/lobby)
Multiplayer match lobby with MatchModeSelector (CLASSIC, TACTICAL, HYBRID, TRAINING, RACING). Live match list from WebSocket. LobbyMatchCard per active match. ConnectionStatusBar (connecting/connected/error). Create match button (deploys to arena). Join match button (redirects to /arena with match params). Practice vs AI adds Easy, Medium, and Hard difficulty selection and routes to /arena with aiDifficulty so the server can attach the matching bot script and reward rules. NoScriptModal warns if no script selected. Guest: "LOGIN TO DEPLOY" / "LOGIN TO CREATE".

## Friends (/friends)
"ALLIANCE NETWORK" with tabs: Friends list, Incoming requests, Outgoing requests, Suggestions. Challenge friend to a match. Spectate friend's active match. Unfriend, accept/decline requests. User suggestions with "Add Friend". Toast notifications. Guest users redirect to /login.

## Docs (/docs)
Comprehensive AliScript language reference with sticky sidebar navigation. 12 sections: docs-intro (HeroSection), docs-quick-ref (QuickReferenceSection), docs-commands (CommandReferenceSection), docs-super-powers (SuperPowersSection for 9 tactical abilities), docs-queries (QueryFunctionsSection), docs-identifiers (IdentifierReferenceSection), docs-advanced (AdvancedLanguageFeaturesSection), docs-energy (EnergyCostSection), docs-rotation (RotationSystemSection with load-to-playground), docs-challenges (AlgorithmChallenges), docs-tactics (BattleTacticsSection), docs-playground (InteractivePlayground with live script editor + parse). Includes the AiTutor component for AI assistance.

## Performance Notes
Recent Lighthouse and runtime work focused on keeping campaign/public pages fast without weakening the arena:
- Public and campaign pages use canonical URLs and metadata consistency for SEO.
- GTM/analytics work is deferred so page interactivity is not blocked by third-party scripts.
- Heavy editors, modals, replay controls, and visual sections are dynamically imported where useful.
- Campaign level constants moved to `levels.constants.ts` for static generation and leaner pages.
- Arena movement uses interpolation buffers and direct Three.js mesh mutation instead of React state churn.
- Dynamic environments avoid per-frame allocations, consolidate frame loops, and use instanced meshes for repeated objects.
- Arena robot rendering keeps volatile raw vectors separate from interpolation caches, and Canvas structural options are memoized so graphics-quality changes do not repeatedly recreate WebGL context state.

## Known Limitations
- Campaign replay controls are in-memory and scoped to the current level attempt; leaving the page discards the review buffer.
- Persisted replay data exists for multiplayer matches played after replay capture was introduced.
- Guest match statistics are runtime-only and are cleared after leaving the arena; they do not populate permanent profile, replay, or leaderboard records.
- Practice vs AI rewards require an authenticated difficulty-tagged AI match. Generic solo testing and guest sessions intentionally award zero persistent points.
- Any new engine feature that stores absolute `Date.now()` timestamps must be included in the campaign resume timestamp-shift path.

## Insights (/insights)
ARIA Insights — AI-generated post-match analysis. Paginated insight list. Mark as read, mark all read. Delete single, delete all. Unread count banner. Empty state: "No insights yet".

## Other Public Pages
- /how-it-works — Detailed explanation with 6 sections
- /patch-notes — Version history with tags: COMBAT, GARAGE, ENGINE, BUG FIX, BALANCE, QOL
- /feature-requests — Form: title, description, use case, priority (NICE_TO_HAVE/MODERATE/HIGH/CRITICAL)
- /bug-report — Form: title, description, steps to reproduce, severity (LOW/MEDIUM/HIGH/CRITICAL)
- /contact — Form: name, email, subject, message. Social links: GitHub, LinkedIn, Portfolio
- /terms — Terms of Service (11 sections)
- /privacy — Privacy Policy (11 sections)
- /cookies — Cookie Policy (7 sections)

## Authentication System
JWT tokens stored in HttpOnly, Secure, SameSite=Strict cookies (la_session). Login via email/password, Google OAuth, or GitHub OAuth. Rate limiting: 5 attempts per 15 minutes on auth endpoints. New users register with email, username, and password. Server uses Helmet security headers, strict CORS whitelist, 100kb payload limit. API prefix: /api.

## Mobile Features
MobileHeader has ThemeSwitcher (icon button, top-right) for theme switching. DashboardSidebar on desktop has ThemeSwitcher (default variant, dropdown with label). Bottom navigation with 5 items, floating SYSTEM hub. Touch targets: minimum 44x44px. Safe-area-inset support. Pull-to-refresh. Portrait orientation guard in arena. Mobile controls in arena: virtual joystick and action buttons. Auto fullscreen on mobile in arena. Safe-area-inset-aware spacing.

## Theme System
Three themes implemented via next-themes with data-theme attribute:
- CYBERPUNK (default) — Dark neon, bg #030712, accent #22d3ee (cyan)
- VIOLET SOVEREIGN (light) — data-theme="light", bg #f0f2fa, accent #5b21b6 (purple)
- OBSIDIAN EMBER (desert) — data-theme="desert", bg #0e0a04, accent #f59e0b (amber)

Switch on mobile: ThemeSwitcher icon in MobileHeader (top-right). Switch on desktop: ThemeSwitcher dropdown in sidebar. Switch in settings: Appearance section with 3 theme cards. ThemeMetaSync updates meta name="theme-color". All colors are CSS variables.

## Points & Economy
Points are earned from campaign levels (EASY=50, MEDIUM=120, HARD=300, EXTREME=500), ranked matches, and authenticated Practice vs AI runs. AI practice points are calculated server-side from the active mode objective, final performance, and difficulty multiplier (Easy=1x, Medium=2x, Hard=3x). Spent in the Black Market on chassis, paints, and tracer rounds. Starter items are free. Rarities: COMMON, RARE, LEGENDARY.

## Friend & Challenge System
Send friend requests, accept/decline/receive. Challenge friends to matches. Spectate friends' active matches. Real-time online status via WebSocket. Toast notifications for friend events. Suggestions from platform.

## Spectator Mode
Watch live matches via /arena?spectate=true&matchId=... SpectatorHUD shows controls. Spectator count overlay. No script needed.

## Admin Pages (/admin/*)
Role-gated (ADMIN only). Includes: Admin Dashboard (KPI cards, user registration chart, matches/day chart, health stats), User Management, Market Management, Campaign Editor, Tournament Management, Match Management, Script Management, AI Insights Management, Health Monitoring, Security Settings, and Feedback management (contact form submissions, feature requests, bug reports).
