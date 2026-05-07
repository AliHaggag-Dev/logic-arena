# Entity Relationship Diagram (ERD)

This document maps the entire PostgreSQL schema utilized by the Logic Arena backend via Prisma ORM.

```mermaid
erDiagram
    USER ||--o{ ROBOT_SCRIPT : "writes"
    USER ||--o{ MATCH_PARTICIPANT : "plays in"
    USER ||--o{ MATCH : "wins"
    USER ||--o{ TOURNAMENT : "creates/participates"
    
    MATCH ||--o{ MATCH_PARTICIPANT : "has"
    ROBOT_SCRIPT ||--o{ MATCH_PARTICIPANT : "executes in"
    
    TOURNAMENT ||--o{ TOURNAMENT_MATCH : "organizes"
    
    USER {
        String id PK
        String email "UNIQUE"
        String username "UNIQUE"
        String passwordHash
        String googleId "UNIQUE"
        String githubId "UNIQUE"
        String avatarUrl
        String provider "local | google | github"
        Boolean isVerified
        Int rank
        Json combatStats "{efficiency, aggression, defense, precision, speed}"
        Int currentLevel "Legacy Campaign"
        String[] completedCampaignLevels
        String selectedRobotId "Legacy Chassis"
        String selectedColor
        Json arenaPreferences "{defaultRobot, soundFx, music, graphicsQuality}"
        Json notificationSettings "{challengeReqs, tournamentAlerts}"
        Int points "Black Market Currency"
        String[] unlockedItems
        String equippedChassis
        String equippedPaint
        String equippedTracer
        DateTime createdAt
    }

    ROBOT_SCRIPT {
        String id PK
        String title
        String content "Raw AliScript"
        String userId FK
        Int version
        DateTime createdAt
    }

    MATCH {
        String id PK
        String type "1v1 | BR | RACING | CAMPAIGN"
        String status "pending | in_progress | completed"
        String winnerId FK "Nullable"
        Int duration "Seconds"
        Json replayData "Compressed tick history"
        DateTime startedAt
        DateTime endedAt
        DateTime createdAt
    }

    MATCH_PARTICIPANT {
        String id PK
        String matchId FK
        String userId FK
        String robotScriptId FK
        Int score
        Int placement "1st, 2nd, etc."
        DateTime createdAt
    }

    TOURNAMENT {
        String id PK
        String name
        String status "WAITING | IN_PROGRESS | COMPLETED"
        String creatorId FK
        String winnerId "Nullable"
        DateTime createdAt
    }

    TOURNAMENT_MATCH {
        String id PK
        String tournamentId FK
        Int round "1=Quarter, 2=Semi, 3=Final"
        Int matchIndex "Bracket position"
        String player1Id "Nullable"
        String player2Id "Nullable"
        String winnerId "Nullable"
        String status "PENDING | IN_PROGRESS | COMPLETED"
        DateTime createdAt
    }
```

## Schema Highlights

### Player Identity & Black Market
The `USER` model contains extensive metadata, including Cloudinary avatar URLs, OAuth IDs, and JSON blocks for `combatStats`, `arenaPreferences`, and `notificationSettings`. It natively handles Black Market progression (`points`, `unlockedItems`, `equippedChassis`).

### Match History & Telemetry
Every arena encounter is tracked via the `MATCH` and `MATCH_PARTICIPANT` junction table. Scripts executed during a match are hard-linked (`robotScriptId`) so players can analyze exactly which code payload resulted in a win or loss. Telemetry is saved to `replayData` for the post-game 2D canvas viewer.

### Tournaments
The `TOURNAMENT` and `TOURNAMENT_MATCH` tables support dynamic, n-player recursive bracket generation, mapping the progression of players through quarter-finals to the championship match.