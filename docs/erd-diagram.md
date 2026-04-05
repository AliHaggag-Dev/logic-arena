# Entity Relationship Diagram (ERD)

## Entities:

### User
*   `id` (PK, UUID)
*   `username` (String, Unique)
*   `email` (String, Unique)
*   `password_hash` (String)
*   `created_at` (Timestamp)
*   `updated_at` (Timestamp)

### RobotScript
*   `id` (PK, UUID)
*   `user_id` (FK to User.id, UUID)
*   `name` (String)
*   `code` (Text)
*   `version` (Integer)
*   `created_at` (Timestamp)
*   `updated_at` (Timestamp)

### Match
*   `id` (PK, UUID)
*   `status` (Enum: 'pending', 'in_progress', 'completed', 'cancelled')
*   `started_at` (Timestamp, Nullable)
*   `ended_at` (Timestamp, Nullable)
*   `winner_user_id` (FK to User.id, UUID, Nullable)
*   `replay_data` (JSONB/Text - stores serialized game state for replay)
*   `created_at` (Timestamp)

### MatchParticipant
*   `match_id` (PK, FK to Match.id, UUID)
*   `user_id` (PK, FK to User.id, UUID)
*   `robot_script_id` (FK to RobotScript.id, UUID) - The specific script used by this user in this match.
*   `score` (Integer, Nullable)
*   `placement` (Integer, Nullable)
*   `joined_at` (Timestamp)

## Relationships:

*   **User 1 -- M RobotScript:** A User can have multiple RobotScripts.
    *   `RobotScript.user_id` references `User.id`

*   **User 1 -- M Match:** A User can be a winner of multiple Matches.
    *   `Match.winner_user_id` references `User.id`

*   **Match M -- M User (through MatchParticipant):** A Match can have multiple Users, and a User can participate in multiple Matches.
    *   `MatchParticipant.match_id` references `Match.id`
    *   `MatchParticipant.user_id` references `User.id`

*   **MatchParticipant 1 -- 1 RobotScript:** Each participant in a match uses one specific RobotScript.
    *   `MatchParticipant.robot_script_id` references `RobotScript.id`

## Diagram (Conceptual):

```mermaid
erDiagram
    User ||--o{ RobotScript : has
    User ||--o{ Match : wins
    User }|..|{ MatchParticipant : participates_in
    Match }|..|{ MatchParticipant : has_participants
    RobotScript ||--o{ MatchParticipant : used_by

    User {
        UUID id PK
        string username UK
        string email UK
        string password_hash
        timestamp created_at
        timestamp updated_at
    }

    RobotScript {
        UUID id PK
        UUID user_id FK
        string name
        text code
        int version
        timestamp created_at
        timestamp updated_at
    }

    Match {
        UUID id PK
        string status "pending, in_progress, completed, cancelled"
        timestamp started_at
        timestamp ended_at
        UUID winner_user_id FK
        jsonb replay_data
        timestamp created_at
    }

    MatchParticipant {
        UUID match_id PK,FK
        UUID user_id PK,FK
        UUID robot_script_id FK
        int score
        int placement
        timestamp joined_at
    }