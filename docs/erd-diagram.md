# ERD Diagram (Logic Arena)

Below is the Entity-Relationship Diagram outlining the current PostgreSQL database schema, managed by Prisma ORM.

```mermaid
erDiagram
    User ||--o{ RobotScript : "authors"
    User ||--o{ MatchParticipant : "participates_in"
    User ||--o{ Match : "wins"
    User ||--o{ Tournament : "creates"
    User ||--o{ Tournament : "joins"
    User ||--o{ AriaInsight : "receives"

    Match ||--o{ MatchParticipant : "has_participants"
    Match ||--o| User : "winner"

    RobotScript ||--o{ MatchParticipant : "deployed_in"

    Tournament ||--o{ TournamentMatch : "contains"
    Tournament ||--o| User : "creator"

    User {
        String id PK
        String email UK
        String username UK
        String passwordHash
        String googleId UK
        String githubId UK
        String avatarUrl
        String provider
        Boolean isVerified
        String role
        Int rank
        Json combatStats
        String[] completedCampaignLevels
        String selectedRobotId
        String selectedColor
        Json arenaPreferences
        Json notificationSettings
        Int points
        String[] unlockedItems
        String equippedChassis
        String equippedPaint
        String equippedTracer
        DateTime createdAt
    }

    RobotScript {
        String id PK
        String title
        String content
        String userId FK
        Int version
        DateTime createdAt
    }

    Match {
        String id PK
        String type
        String status
        String winnerId FK
        Int duration
        Json replayData
        DateTime startedAt
        DateTime endedAt
        DateTime createdAt
    }

    MatchParticipant {
        String id PK
        String matchId FK
        String userId FK
        String robotScriptId FK
        Int score
        Int placement
        DateTime createdAt
    }

    Tournament {
        String id PK
        String name
        String status
        String creatorId FK
        String winnerId FK
        DateTime createdAt
    }

    TournamentMatch {
        String id PK
        String tournamentId FK
        Int round
        Int matchIndex
        String player1Id FK
        String player2Id FK
        String winnerId FK
        String status
        DateTime createdAt
    }

    AriaInsight {
        String id PK
        String userId FK
        String matchId FK
        String title
        String content
        String category
        Boolean isRead
        DateTime createdAt
    }

    BugReport {
        String id PK
        String title
        String description
        String steps
        String severity
        String status
        String userId
        DateTime createdAt
    }

    FeatureRequest {
        String id PK
        String title
        String description
        String useCase
        String priority
        String status
        Int votes
        String userId
        DateTime createdAt
    }

    ContactMessage {
        String id PK
        String name
        String email
        String subject
        String message
        String status
        DateTime createdAt
    }
```

## Schema Highlights

* **Auth & Profiles**: Supports both Local and OAuth (Google/GitHub). Profile configurations including colors and preferences are stored as JSON strings.
* **MatchParticipants**: A junction table linking a specific `User`, `Match`, and `RobotScript` version to track exact combat metrics per match.
* **Economy (Black Market)**: `points` and `unlockedItems` fields manage user progression and unlocks.
* **Admin / Support**: `BugReport`, `FeatureRequest`, and `ContactMessage` handle user support workflows and feedback hub tracking.