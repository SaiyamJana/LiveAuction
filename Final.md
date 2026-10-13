# TOURNAMENT MANAGEMENT PLATFORM
## Complete Website Blueprint — Requirements, Architecture, Workflows & Implementation Roadmap

## 1. PROJECT OVERVIEW

The goal is to build a web-based tournament management platform where anyone can browse tournaments, fixtures, match history, results, standings, teams, and statistics without creating an account.

Users who want to participate must create an account. Organizers must apply for approval from the platform's single global administrator before they can create and manage tournaments.

The platform supports multiple tournament formats, player registrations, waiting lists, team formation, live auctions, fixture scheduling, result entry, CSV scorecard imports, standings, announcements, notifications, reports, and historical archives.

Matches are played externally. The website tracks match status and publishes results after the organizer reviews and confirms them.

### Primary objectives

- Public access to tournament information without login.
- Secure role-based access for players, organizers, and the global administrator.
- Flexible tournament formats and customizable rules.
- Optional live player auctions or manual team assignment.
- Reliable fixture, result, and standings management.
- A permanent history of tournaments and their matches.
- Low-cost initial deployment, avoiding paid email services.
- Transparent audit history for important changes and administrative actions.

---

## 2. USER ROLES AND PERMISSIONS

### 2.1 Public Visitor

No account is required.

Visitors can:

- Browse all tournaments, including ongoing and completed tournaments.
- View tournament details, rules, teams, fixtures, results, standings, and supported statistics.
- View public announcements and tournament timelines.
- Watch live auctions in read-only mode.
- View live match status without seeing unpublished scores.
- Search and filter tournaments.
- Download public tournament reports when exports are available.
- View archived tournaments and their match history.

Visitors cannot register players, bid in auctions, or perform organizer actions.

**Important:** Invite-only tournaments also appear in public listings. Invite-only restricts registration, not visibility.

### 2.2 Registered Player

Players can:

- Register and log in using email and password.
- Register for eligible tournaments.
- Track registration approval and waiting-list status.
- Withdraw before the applicable deadline.
- Submit an interest application to become a captain.
- Receive team assignments and tournament updates.
- View their fixtures, teams, and notifications.
- Participate in auctions only if they are an authorized captain.
- Control whether their participation history is publicly visible.
- Request account deletion.
- Request password recovery through the administrator-assisted process.

Players can join multiple tournaments independently, even when their dates overlap.

### 2.3 Organizer

An organizer must first apply for approval.

Once approved, an organizer can:

- Create and manage their own tournaments.
- Configure formats, rules, registration, and team formation.
- Approve registrations and manage waiting lists.
- Review captain applications and select captains.
- Select the players eligible for auction.
- Run auctions and manage squads.
- Create and edit fixtures.
- Enter or import match results.
- Review and confirm results and statistics.
- Manage standings, qualification, and announcements.
- Export tournament reports.
- Reschedule or cancel tournaments with a recorded reason.
- Suspend or remove participants from their tournament with a reason.
- Finalize tournaments and publish the completed archive.
- View their tournament's private activity log.

Organizers cannot manage tournaments belonging to other organizers unless the global administrator intervenes.

### 2.4 Global Administrator

There is exactly **one global platform administrator**.

The administrator can:

- Approve or reject organizer applications.
- Manage user accounts and account statuses.
- View and manage all tournaments.
- Monitor platform activity and audit logs.
- Suspend users or tournaments.
- Intervene in exceptional tournament operations.
- Review account recovery and deletion requests.
- Handle exceptional disputes or locked operations.
- Perform administrative corrections when necessary.
- Review and record all exceptional interventions.

The administrator account must be provisioned securely. Public signup must never allow a user to become an administrator.

---

## 3. AUTHENTICATION AND ACCOUNT MANAGEMENT

### Authentication method

Use email and password for all registered users.

The platform initially does not require email verification and does not depend on email-delivery services.

### Registration

Player registration collects:

- Name
- Email
- Password

Organizer applications collect the required account details and any additional information needed for administrative review.

### Organizer approval workflow

1. A user submits an organizer application.
2. The application receives a pending status.
3. The administrator reviews it.
4. The administrator approves or rejects it.
5. Only approved organizers can create tournaments.
6. The decision and its timestamp are recorded.

### Password recovery

Use an administrator-assisted recovery process initially.

1. The user requests recovery.
2. The user contacts the administrator through the designated support process.
3. The administrator verifies the user's identity without asking for their current password.
4. A secure, short-lived, single-use reset mechanism is issued.
5. The user sets a new password.
6. Relevant sessions are revoked where appropriate.
7. The action is recorded in the audit log.

Never display or retrieve a user's existing password.

### Account deletion

Users can submit account deletion requests.

The system should remove or anonymize personal information where appropriate while preserving the minimum historical records needed for tournament integrity, financial or administrative accountability where applicable, and published results.

The deletion request and its resolution must be recorded.

### Suspicious accounts

Because email verification is initially skipped, mitigate abuse using:

- Registration and login rate limits.
- Duplicate-account checks where appropriate.
- Organizer approval.
- Account suspension.
- Tournament registration controls.
- Administrative review.

---

## 4. TOURNAMENT CREATION AND CONFIGURATION

An approved organizer can create a tournament and configure the following.

### Basic details

- Tournament name
- Description
- Organizer
- Start and end dates
- Registration opening and closing dates
- Tournament status
- Rules
- Participant limit
- Team count and team names, where applicable

### Tournament formats

The platform must support:

1. **Knockout:** A losing team is eliminated according to the configured tournament rules.
2. **League / Round-robin:** Teams play their scheduled opponents and earn points.
3. **Groups followed by knockout:** Teams play in groups, and qualified teams advance to knockout rounds.

### Registration settings

Organizers can choose:

- Public registration.
- Invite-only registration.
- Automatic registration approval.
- Manual registration approval.
- Registration deadline.
- Maximum participant count.
- Whether a waiting list is enabled.

All tournaments remain publicly discoverable, including invite-only tournaments.

### Registration deadline and waiting list

- Registration closes automatically at the configured deadline.
- The organizer can reopen registration.
- Reopening and deadline changes are recorded.
- When capacity is reached, eligible additional applicants enter the waiting list.
- When a spot becomes available, the organizer manually selects a waiting-list player.
- Waiting-list changes are recorded.

### Rule editing

Organizers can edit tournament rules at any time, including after the tournament has started.

However, the system must:

- Record the old and new rule values.
- Record who made the change, when, and why.
- Preview the potential impact when a change affects fixtures, standings, qualification, or existing results.
- Recalculate affected data safely after confirmation.
- Preserve the history of previous calculations and decisions where necessary.

### Tournament lifecycle

A tournament may move through statuses such as:

- Draft
- Registration open
- Registration closed
- Team formation
- Auction in progress
- Fixtures published
- Ongoing
- Completed
- Cancelled

The exact transitions should be validated by the backend.

---

## 5. PLAYER REGISTRATION AND WITHDRAWAL

### Registration process

1. A player logs in.
2. The player opens a tournament.
3. The player submits a registration.
4. The system checks eligibility, deadlines, duplicate registration, and capacity.
5. The registration is automatically approved or sent for organizer review.
6. If the tournament is full, the player may be placed on the waiting list.
7. The player receives an in-website notification about the outcome.

### Withdrawal rules

Players can withdraw:

- Before the auction begins for auction-based tournaments.
- Before the tournament begins for tournaments without an auction.

Exceptional cases can be handled by the organizer.

When a player withdraws, the system must update registration and eligibility records without deleting historical information that is needed for accountability.

### Duplicate registrations

The same player must not have multiple active registrations for the same tournament.

The backend must enforce this rule even if two registration requests arrive simultaneously.

---

## 6. CAPTAIN SELECTION AND TEAM FORMATION

### Captain applications

During registration, a player can express interest in becoming a captain.

The organizer reviews applications and chooses captains. The organizer always has the final decision.

### Player eligibility for auctions

Captain selection and auction eligibility are separate decisions.

The organizer must explicitly approve which registered players are eligible to enter the auction pool.

Only eligible players can be auctioned.

### Team formation options

Each tournament can use one of two methods:

**Option A: Live auction**

Captains bid for eligible players using the tournament's configured auction rules.

**Option B: Manual team assignment**

The organizer directly assigns eligible players to teams.

Both methods must enforce tournament-specific squad limits and other configured rules.

---

## 7. LIVE AUCTION SYSTEM

### 7.1 Auction configuration

The organizer can configure:

- Team count and team names.
- Starting purse for each team.
- Maximum squad size.
- Player base price.
- Minimum bid increment.
- Countdown duration.
- Eligible auction players.
- Auction order, where applicable.
- Unsold-player handling.
- Rules for exceptional auction corrections.

The backend must validate all settings before the auction begins.

### 7.2 Public auction room

Anyone can watch the auction without logging in.

The public view displays relevant auction information, such as:

- Current player.
- Current price.
- Provisional highest bidder.
- Participating teams.
- Remaining purses.
- Squad counts.
- Auction status.
- Countdown.
- Sold and unsold players.

Only authorized, logged-in captains can bid.

Only the organizer can perform organizer-controlled auction operations such as advancing or closing a round, undoing the last bid, and finalizing auction outcomes.

### 7.3 Bidding rules

Suppose the current price is X and the configured increment is Y.

The next valid bid is:

**Next bid = X + Y**

The backend—not the browser—must validate every bid.

A valid bid must satisfy all relevant conditions:

- The auction is active.
- The player is eligible and currently available.
- The bidder is an authorized captain.
- The captain is permitted to bid in the current round.
- The bid amount is correct.
- The team has sufficient remaining purse.
- The team has available squad capacity.
- The bid does not violate other configured rules.

### 7.4 Bidding-round workflow

1. The current player and price are displayed.
2. An eligible captain submits a bid.
3. The server validates and accepts or rejects it.
4. The accepted bid becomes the provisional highest bid.
5. That captain cannot bid again in the same bidding round.
6. The organizer clicks **Done** to close the current bidding round.
7. The server starts the configured countdown, for example, 10 seconds.
8. If another valid captain bids before the countdown expires, the provisional leader and price update.
9. The organizer clicks Done to close that new round and restart the countdown.
10. If the countdown expires without another accepted bid, the player is sold to the current highest bidder, according to the configured auction rules.

If there are no valid bids, the player can be marked unsold according to the configured rules.

### 7.5 Simultaneous bids

Two captains might submit bids at nearly the same time.

The server must process bids atomically. The first valid bid accepted by the server becomes authoritative.

Conflicting or stale bids are rejected with an appropriate message. A rejected captain may try again in a later eligible round.

The browser must never be trusted to decide which bid wins.

### 7.6 Undo Last Bid

Before a player is sold, the organizer can undo the last accepted bid.

Undo behavior:

- Restore the previous price.
- Restore the previous highest bidder.
- Reopen bidding.
- Cancel the existing countdown.
- Wait for the organizer to click Done to start a fresh countdown.
- Record who performed the undo, when, and why.

Undo must not erase bid history. It should append a compensating event so that the audit trail remains complete.

Once a sale is finalized, corrections should require a separate authorized administrative process.

### 7.7 Purse and squad validation

The server must ensure:

- Teams never exceed their purse.
- Teams never exceed squad size.
- Players are not sold to multiple teams.
- Only eligible players enter the auction.
- A team cannot bid when doing so would violate applicable rules.
- A sold player has a valid winning team and final price.
- Auction state remains consistent if multiple requests arrive simultaneously.

### 7.8 Unsold players and finalization

Unsold players appear in a separate list.

The organizer can run another round for unsold players before finalizing squads.

When the auction is finalized, the system validates all squads and preserves the complete auction history.

---

## 8. FIXTURE GENERATION AND SCHEDULING

### Fixture creation methods

Organizers can choose:

- Automatic fixture generation.
- Manual fixture creation.

Organizers can edit fixture dates, times, venues, and other supported scheduling details.

### Knockout tournaments

- Generate the initial bracket.
- After a result is confirmed, determine the winner.
- Automatically populate the next bracket position when the dependencies are satisfied.
- Preserve a record of manual overrides.

### League tournaments

- Generate the required round-robin fixtures.
- Calculate standings from confirmed results.
- Apply the configured points and tie-breakers.

### Group-stage tournaments

- Generate group fixtures.
- Calculate group standings.
- Determine qualification using the configured rules.
- Populate knockout fixtures after qualification is confirmed.

### Fixture statuses

Use appropriate statuses such as:

- Scheduled
- Ongoing
- Completed
- Postponed
- Cancelled

Only confirmed results should advance brackets or affect published standings.

### Scheduling changes

Rescheduling requires a reason and should notify affected participants through in-website notifications.

---

## 9. POINTS, STANDINGS, AND QUALIFICATION

### Configurable rules

Organizers can configure:

- Points awarded for different outcomes.
- Tie-breakers.
- Qualification criteria.
- Number of teams advancing from each group.
- Knockout progression rules.

Provide sensible defaults so organizers do not have to configure every setting manually.

### Standings calculations

Standings must be based on confirmed match results only.

The system should calculate supported fields, such as:

- Matches played.
- Wins.
- Losses.
- Draws or ties, if applicable.
- Points.
- Configured tie-breaker metrics.
- Qualification status.

Do not assume that every scorecard supports every statistical field.

### Qualification overrides

Organizers can override automatic qualification decisions where the tournament rules allow it.

Every override must record:

- Previous decision.
- New decision.
- Actor.
- Timestamp.
- Reason.

### Corrections and recalculation

When a confirmed result is corrected:

1. Preserve the original result.
2. Record the correction and reason.
3. Recalculate affected standings.
4. Re-evaluate qualification where necessary.
5. Identify any downstream fixture or bracket impact.
6. Preserve an audit trail of the changes.

---

## 10. MATCH RESULTS AND SCORECARD IMPORTS

The website supports both manual result entry and CSV scorecard uploads.

### 10.1 Match status

The website displays whether a match is scheduled, ongoing, postponed, cancelled, or completed.

While a match is ongoing, the public sees the live status only. Scores are published after the organizer confirms the result.

### 10.2 Manual result entry

The organizer selects a match and enters the supported result fields.

The system validates the input and shows a preview before confirmation.

### 10.3 CSV upload workflow

1. The organizer selects a match.
2. The organizer uploads a scorecard CSV file.
3. The server validates the file type and size.
4. The parser reads the available columns.
5. The website displays a preview of the parsed data.
6. Validation errors and missing or unsupported fields are highlighted.
7. The organizer reviews and corrects the data where possible.
8. The organizer confirms the result.
9. The system saves the confirmed result and supported statistics.
10. Standings and qualification are updated.

**Important implementation dependency:** Obtain a real sample scorecard CSV before implementing the parser. The exact columns, field meanings, and data formats must be determined from the actual file. Do not invent a CSV schema or assume unavailable statistics exist.

### 10.4 Result correction

Organizers can correct confirmed results, but the correction must include a reason and preserve:

- Original result.
- Corrected result.
- Person making the change.
- Timestamp.
- Reason.
- Affected standings and qualification updates.

### 10.5 Statistics

Calculate only statistics supported by the actual scorecard data.

The organizer reviews statistics before confirmation. Unverified imported values must not immediately affect public standings.

---

## 11. ANNOUNCEMENTS AND NOTIFICATIONS

### In-website notifications only

The initial release will not use email notifications or browser push notifications.

Notifications are stored in the database and displayed inside the website.

### Notification events

Potential notification events include:

- Registration approved or rejected.
- Waiting-list status changed.
- Tournament registration opened, closed, or reopened.
- Team assignment published.
- Auction-related updates.
- Fixtures created or changed.
- Match rescheduled or cancelled.
- Result confirmed or corrected.
- Announcement published.
- Tournament cancelled or finalized.
- Account or organizer-application status changed.

### Announcements

Organizers can publish tournament announcements.

The system supports:

- Public announcements.
- A pinned notice.
- In-website notifications to relevant participants.
- Publication timestamps.
- An announcement history.

### Live updates

Socket.IO can be used for live auction and other real-time updates.

Notifications must also be stored persistently, so users who are offline can see them later.

If polling is used as a fallback, its frequency should be configurable and reasonable.

---

## 12. SEARCH, PUBLIC PAGES, AND DASHBOARDS

### Public homepage

Display:

- Upcoming tournaments.
- Ongoing tournaments.
- Recently completed tournaments.
- Featured or recently updated tournaments.
- Search and filter controls.

### Tournament discovery

Support useful filters, such as:

- Tournament status.
- Format.
- Date.
- Other meaningful tournament attributes.

All tournaments must remain discoverable, including invite-only tournaments.

### Tournament detail page

Provide sections for:

- Overview.
- Rules.
- Teams and squads.
- Fixtures.
- Standings.
- Results and match history.
- Supported statistics.
- Announcements.
- Public tournament timeline.
- Live auction room, when applicable.

### Player dashboard

Display:

- Registered tournaments.
- Registration and waiting-list status.
- Team assignments.
- Upcoming fixtures.
- Notifications.
- Relevant tournament updates.
- Account settings and history-visibility preferences.

### Organizer dashboard

Display:

- Owned tournaments.
- Tournament creation and editing.
- Registration approvals and waiting lists.
- Captain applications.
- Auction eligibility.
- Auction and squad management.
- Fixtures and results.
- Standings and qualification.
- Announcements.
- Reports and exports.
- Private activity logs.

### Administrator dashboard

Display:

- Organizer approval queue.
- User management.
- All tournaments.
- Platform activity and audit logs.
- Suspended accounts and tournaments.
- Account recovery and deletion requests.
- Administrative intervention tools.

---

## 13. USER PRIVACY AND PARTICIPATION HISTORY

Players can control whether their participation history is publicly visible.

Public tournament records must remain useful for tournament integrity, while personal profile information should be limited to what is necessary.

The implementation should distinguish between:

- Public tournament records.
- Personal account details.
- Private account settings.
- Internal administrative logs.

Deleting an account must not silently erase official results or audit history. Personal information should be removed or anonymized where appropriate, according to the platform's retention policy.

The platform will not initially provide global player career rankings or cross-tournament player statistics.

Statistics and rankings remain tournament-specific.

---

## 14. PLAYER SUSPENSION AND REMOVAL

Organizers can suspend or remove a player from their tournament when necessary.

The system must require a recorded reason and preserve the action in the audit log.

When a player is removed:

- Update eligibility and registration status.
- Handle auction eligibility and team membership appropriately.
- Review affected fixtures where necessary.
- Preserve already-confirmed match history.
- Notify relevant participants when appropriate.

Do not silently delete historical results because a player has been removed.

There is no built-in player-reporting system in the initial version.

Players can contact the organizer informally outside a dedicated appeal workflow.

---

## 15. TOURNAMENT CANCELLATION AND RESCHEDULING

### Cancellation

An organizer can cancel a tournament, but a reason is required.

The system should:

- Update the tournament status.
- Record the reason.
- Notify affected participants.
- Preserve fixtures, registrations, announcements, and historical records.
- Display the cancellation status publicly.

### Rescheduling

An organizer can change tournament dates and fixture schedules.

The system should:

- Record the previous and new schedule.
- Require a reason.
- Notify affected participants.
- Preserve the history of schedule changes.

---

## 16. AUDIT LOGGING AND ADMINISTRATIVE OVERSIGHT

Maintain audit logs for significant operations, including:

- Organizer approvals and rejections.
- Tournament creation and edits.
- Rule changes.
- Registration approvals and withdrawals.
- Waiting-list changes.
- Captain selection.
- Auction bids and undo actions.
- Squad changes.
- Fixture changes.
- Result submissions and corrections.
- Qualification overrides.
- Announcements.
- Suspensions and removals.
- Tournament cancellations and rescheduling.
- Account recovery and deletion.
- Global administrator interventions.

Each applicable audit record should contain:

- Actor.
- Action.
- Affected entity.
- Timestamp.
- Previous and new values where relevant.
- Reason where required.

Use append-only event records for important financial-like or operational histories such as auction bids. Do not erase an event merely to reverse it.

---

## 17. DATABASE DESIGN

The initial backend can use MongoDB with Mongoose.

The following collections are recommended.

### 17.1 users

Stores:

- Name.
- Normalized email.
- Password hash.
- Role.
- Account status.
- Profile settings.
- Participation-history visibility.
- Created and updated timestamps.

### 17.2 organizerApplications

Stores:

- Applicant.
- Application details.
- Status.
- Administrator decision.
- Decision reason.
- Submission and decision timestamps.

### 17.3 tournaments

Stores:

- Tournament name and description.
- Owner/organizer.
- Format.
- Visibility and registration settings.
- Dates and deadlines.
- Participant limits.
- Tournament rules.
- Status.
- Created and updated timestamps.

### 17.4 registrations

Stores:

- Tournament.
- Player.
- Registration status.
- Approval status.
- Withdrawal status.
- Waiting-list position.
- Captain-interest status.
- Auction eligibility.
- Relevant timestamps.

### 17.5 teams

Stores:

- Tournament.
- Team name.
- Captain.
- Squad members or references to assignments.
- Squad size.
- Auction purse and remaining purse, where applicable.
- Team status.

### 17.6 teamAssignments

Recommended to separate player-to-team assignment history from the team document when tracking assignment changes is important.

Stores:

- Tournament.
- Team.
- Player.
- Assignment method.
- Assignment status.
- Assigned by.
- Timestamp.
- Previous assignment information where applicable.

### 17.7 auctionLots

Stores:

- Tournament.
- Player being auctioned.
- Auction status.
- Base price.
- Current price.
- Highest bidder/team.
- Current round.
- Sale status.
- Final price and winning team.
- Relevant timestamps.

### 17.8 auctionBids

Stores:

- Auction lot.
- Bidder/captain.
- Team.
- Bid amount.
- Timestamp.
- Acceptance or rejection outcome.
- Round identifier.
- Undo or reversal event references where applicable.

Preserve bid history rather than deleting accepted bids.

### 17.9 fixtures

Stores:

- Tournament.
- Stage and round.
- Participating teams.
- Date, time, and venue.
- Fixture status.
- Bracket dependencies.
- Confirmed result reference, where applicable.

### 17.10 matchResults

Stores:

- Fixture.
- Submitted result data.
- CSV import metadata, if applicable.
- Validated data.
- Confirmed outcome.
- Supported player/team statistics.
- Confirmation status.
- Correction history.
- Actor and timestamps.

### 17.11 standingsSnapshots

Optional collection for preserving published standings or qualification decisions at important points in the tournament.

### 17.12 announcements

Stores:

- Tournament.
- Creator.
- Content.
- Pinned status.
- Publication status.
- Publication timestamp.

### 17.13 notifications

Stores:

- Recipient.
- Notification type.
- Message.
- Related tournament, fixture, or entity.
- Read status.
- Created timestamp.

### 17.14 auditLogs

Stores:

- Actor.
- Action.
- Entity type and identifier.
- Old and new values, when appropriate.
- Reason.
- Timestamp.
- Additional context.

### 17.15 accountRequests

Stores:

- User.
- Request type: recovery or deletion.
- Request status.
- Review details.
- Resolution history.
- Relevant timestamps.

### Relationships and integrity

Conceptually:

- One user can organize multiple tournaments.
- A tournament has registrations, teams, fixtures, results, announcements, and audit events.
- A user can register for multiple tournaments.
- A team belongs to a tournament.
- A fixture belongs to a tournament.
- A confirmed result belongs to a fixture.
- An auction lot refers to an eligible player.
- An auction lot contains bid history.
- Notifications belong to recipients.
- Audit records identify actors and affected entities.

### Important database constraints

Enforce the following on the server and, where appropriate, with database indexes and transactions:

- No duplicate active registration for the same player and tournament.
- Only registered and eligible players can be assigned or auctioned.
- A player cannot be sold to multiple teams in the same tournament.
- A sold lot must have a valid winning team and final price.
- Team purse and squad limits cannot be exceeded.
- Unreviewed imports cannot affect published results or standings.
- Corrections preserve original values and reasons.
- Account deletion does not destroy required historical tournament records.
- Capacity and waiting-list updates remain consistent under concurrent requests.
- Every organizer operation verifies ownership.
- Every administrator operation verifies the administrator role.

Use database transactions where multiple related records must change together and the chosen database deployment supports them.

---

## 18. BACKEND API DESIGN

Example REST API structure:

### Authentication

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/recovery/request
- POST /api/auth/recovery/complete

### Organizer applications

- POST /api/organizer-applications
- GET /api/admin/organizer-applications
- PATCH /api/admin/organizer-applications/:id

### Tournaments

- GET /api/tournaments
- POST /api/tournaments
- GET /api/tournaments/:id
- PATCH /api/tournaments/:id
- POST /api/tournaments/:id/cancel
- POST /api/tournaments/:id/finalize

### Registrations

- POST /api/tournaments/:id/registrations
- GET /api/tournaments/:id/registrations
- PATCH /api/registrations/:id/approval
- POST /api/registrations/:id/withdraw
- POST /api/tournaments/:id/registrations/reopen

### Teams and auction

- POST /api/tournaments/:id/teams
- PATCH /api/tournaments/:id/captains
- PATCH /api/tournaments/:id/auction-eligibility
- POST /api/tournaments/:id/auction/start
- POST /api/auction/lots/:id/bid
- POST /api/auction/lots/:id/done
- POST /api/auction/lots/:id/undo-last-bid
- POST /api/tournaments/:id/auction/unsold-round
- POST /api/tournaments/:id/auction/finalize

### Fixtures and results

- GET /api/tournaments/:id/fixtures
- POST /api/tournaments/:id/fixtures/generate
- POST /api/tournaments/:id/fixtures
- PATCH /api/fixtures/:id
- POST /api/fixtures/:id/start
- POST /api/fixtures/:id/results/manual
- POST /api/fixtures/:id/results/preview
- POST /api/fixtures/:id/results/confirm
- POST /api/fixtures/:id/results/correct

### Standings and reports

- GET /api/tournaments/:id/standings
- POST /api/tournaments/:id/qualification/override
- GET /api/tournaments/:id/reports
- GET /api/tournaments/:id/exports/:type

### Announcements and notifications

- POST /api/tournaments/:id/announcements
- GET /api/tournaments/:id/announcements
- GET /api/notifications
- PATCH /api/notifications/:id/read

These are example route names, not a finalized API contract. Exact payloads, validation schemas, permissions, response formats, and error codes should be defined during implementation.

All sensitive operations must be authorized on the backend. Hiding a button in the frontend is not security.

---

## 19. RECOMMENDED TECHNOLOGY STACK

### Frontend

- React.
- Vite.
- Tailwind CSS.
- React Router.
- A reusable component structure.
- A charting library if charts are needed.

### Backend

- Node.js.
- Express.
- MongoDB.
- Mongoose.
- Socket.IO for real-time updates.
- A CSV parsing library.
- A PDF generation library.
- Zod or an equivalent validation library.

### Testing

- Vitest for suitable unit tests.
- API and integration tests.
- Tests for permissions and concurrent operations.
- End-to-end tests for important user workflows where practical.

### Architecture

Use a modular monolith initially.

Keep the frontend and backend in one repository, but separate their code and responsibilities. Do not introduce microservices unless actual scale or operational requirements justify them.

### Example repository structure

    tournament-platform/
      client/
        src/
          app/
          components/
            common/
            tournament/
            fixtures/
            auction/
          pages/
            public/
            auth/
            player/
            organizer/
            admin/
          features/
            tournaments/
            registrations/
            auction/
            results/
            notifications/
          services/
          hooks/
          types/
      server/
        src/
          config/
          middleware/
          modules/
            auth/
            users/
            organizers/
            tournaments/
            registrations/
            teams/
            auction/
            fixtures/
            results/
            standings/
            notifications/
            reports/
            audit/
          sockets/
          utils/
          app.ts
      tests/
      docs/
      .env.example
      .gitignore
      README.md

The structure can be adapted to the preferred JavaScript or TypeScript setup.

---

## 20. SECURITY REQUIREMENTS

Security must be enforced on the server.

### Passwords and sessions

- Store only password hashes.
- Use a well-maintained password-hashing algorithm such as Argon2id or appropriately configured bcrypt.
- Never store plaintext passwords.
- Use secure, HTTP-only cookies or another carefully designed session/token strategy.
- Protect cookie-based authentication against CSRF where relevant.
- Use HTTPS in deployment.
- Revoke sessions after sensitive account changes where appropriate.

### Authorization

Every protected operation must verify:

- The user is authenticated.
- The user has the correct role.
- The organizer owns the tournament.
- The user is eligible for the operation.
- The tournament is in a state where the operation is allowed.

### Abuse prevention

Apply rate limits to:

- Login.
- Registration.
- Recovery requests.
- Auction bids.
- Sensitive administrative endpoints.

Validate all inputs on the server.

### File uploads

- Restrict CSV upload size and accepted file types.
- Validate CSV structure and values.
- Reject malformed or unexpected data safely.
- Never execute uploaded content.
- Prevent spreadsheet formula injection in generated CSV exports.

### Secrets and deployment

- Store secrets in environment variables or the hosting provider's secret manager.
- Keep .env out of Git.
- Provide a safe .env.example containing placeholder values only.
- Restrict production database access.
- Use backups and test restoration.

### Audit integrity

Do not allow ordinary users or organizers to modify or delete audit records. Exceptional administrator corrections should themselves be recorded.

---

## 21. EXPORTS AND REPORTS

Support CSV and PDF exports for relevant tournament information, including:

- Team squads.
- Fixtures.
- Standings.
- Match results.
- Supported player statistics.
- Supported team statistics.
- Auction summaries where appropriate.

Exports must respect permissions and history-visibility settings where applicable.

CSV exports must be protected against formula injection.

PDFs should be generated on demand initially rather than stored permanently unless there is a clear reason to retain them.

---

## 22. FREE OR LOW-COST DEPLOYMENT PLAN

The initial version should avoid paid services wherever practical.

### Suggested deployment structure

- Frontend: a static hosting provider with a free tier.
- Backend: a Node.js-compatible host with a free or low-cost tier.
- Database: a MongoDB-compatible managed database tier or another suitable low-cost database.
- Real-time updates: Socket.IO hosted with the backend.
- Reports: generated on demand.
- Notifications: stored in the application database.
- Domain: use a hosting subdomain initially if purchasing a domain is not desired.

### Cost-control rules

- Do not use a paid email delivery service initially.
- Do not build email verification into the first release.
- Keep one backend service and one database.
- Avoid microservices.
- Paginate large result sets.
- Limit upload sizes.
- Generate PDF reports on demand.
- Use database-backed notifications.
- Avoid unnecessary background services.

### Important limitations

Free tiers may have:

- Sleeping or cold starts.
- Limited database storage.
- Limited bandwidth.
- Connection limits.
- Restricted execution time.
- Limited backup or retention features.

Check the current provider terms before choosing a deployment platform. A free tier is suitable for a prototype or small initial audience, but reliable production use may eventually require paid hosting and a tested backup strategy.

### Deployment checklist

- Configure environment variables.
- Configure CORS correctly.
- Configure production frontend and backend URLs.
- Ensure WebSocket connections work.
- Check database access rules.
- Test direct navigation and page refreshes on frontend routes.
- Test login and session persistence.
- Test file uploads.
- Test report generation.
- Test backup and restoration.
- Monitor server and database errors.

---

## 23. IMPLEMENTATION ROADMAP

Build the system incrementally rather than attempting all features at once.

### Phase 1: Foundation and authentication

Implement:

- Repository setup.
- Frontend and backend structure.
- Database connection.
- User registration and login.
- Secure password hashing.
- Role-based authorization.
- Secure global administrator bootstrap.
- Organizer application and approval.
- Initial audit logging.

**Completion criteria:** Public visitors can browse basic pages, players can authenticate, organizers require approval, and unauthorized users cannot access protected operations.

### Phase 2: Tournaments and registration

Implement:

- Tournament creation and editing.
- Tournament formats and configurable rules.
- Public tournament listings.
- Tournament details pages.
- Registration workflows.
- Automatic and manual approval.
- Deadlines and reopening.
- Participant limits and waiting lists.
- Announcements and in-website notifications.

**Completion criteria:** An approved organizer can create a tournament, publish it, accept registrations, and manage the waiting list.

### Phase 3: Teams and auction

Implement:

- Captain-interest applications.
- Captain selection.
- Auction eligibility.
- Manual team assignment.
- Auction configuration.
- Live public auction room.
- Authorized bidding.
- Countdown handling.
- Undo Last Bid.
- Unsold-player rounds.
- Purse and squad validation.
- Auction finalization.

**Completion criteria:** Concurrent bids are handled safely, invalid bids are rejected, the countdown is server-authoritative, and final squads remain consistent.

### Phase 4: Fixtures and standings

Implement:

- Knockout fixture generation.
- Round-robin fixture generation.
- Group-stage fixture generation.
- Manual fixtures.
- Fixture editing and rescheduling.
- Points configuration.
- Tie-breakers.
- Automatic standings.
- Qualification and bracket advancement.
- Audited qualification overrides.

**Completion criteria:** Confirmed match outcomes correctly update standings and any dependent fixtures.

### Phase 5: Results and historical archives

Implement:

- Match status tracking.
- Manual result entry.
- CSV upload and parsing.
- Import preview and validation.
- Organizer confirmation.
- Supported player and team statistics.
- Result correction and audit history.
- Standings recalculation.
- Cancellation and finalization.
- CSV and PDF exports.
- Public historical archives.

**Completion criteria:** Unconfirmed data never affects published standings, and corrections preserve history.

**Required input before CSV parser development:** A real example of the scorecard CSV file.

### Phase 6: Security, privacy, and deployment

Implement:

- Full permission checks.
- Rate limiting.
- Upload validation.
- Secure recovery workflow.
- Account deletion requests.
- Participation-history visibility.
- Suspension and removal workflows.
- Administrator intervention.
- Mobile responsiveness.
- Production configuration.
- Backups and restoration testing.
- End-to-end tests.

**Completion criteria:** Critical user workflows work in production, protected operations are authorized, and data can be restored from backup.

---

## 24. RELEASE TEST CHECKLIST

### Authentication and permissions

- [ ] Public visitors can browse without logging in.
- [ ] Players can register and log in.
- [ ] An unapproved organizer cannot create a tournament.
- [ ] Only the designated administrator has global admin privileges.
- [ ] Organizers cannot modify another organizer's tournament.
- [ ] Protected API routes validate permissions on the server.

### Registration and teams

- [ ] Duplicate active registrations are rejected.
- [ ] Manual approval works.
- [ ] Automatic approval works.
- [ ] Registration closes at the deadline.
- [ ] Reopening registration is audited.
- [ ] Participant limits are enforced.
- [ ] Waiting-list selection works.
- [ ] Withdrawal rules are enforced.
- [ ] Only eligible players can be assigned or auctioned.

### Auction

- [ ] Public visitors can watch but cannot bid.
- [ ] Only authorized captains can bid.
- [ ] Bid increments are enforced.
- [ ] Simultaneous bids cannot corrupt the auction state.
- [ ] A captain cannot bid twice in the same round.
- [ ] The server controls countdown timing.
- [ ] Undo restores the previous state and records the action.
- [ ] Purse and squad limits cannot be exceeded.
- [ ] Unsold rounds and finalization work correctly.

### Fixtures and results

- [ ] All supported tournament formats generate correct fixtures.
- [ ] Only confirmed results affect standings.
- [ ] Knockout winners advance correctly.
- [ ] CSV previews expose invalid data.
- [ ] Manual result entry works.
- [ ] Corrections preserve the original result.
- [ ] Standings and qualification recalculate correctly.
- [ ] Rescheduling and cancellation are audited.

### Privacy and account lifecycle

- [ ] Participation-history visibility is respected.
- [ ] Account deletion requests can be processed.
- [ ] Required historical records remain intact.
- [ ] Password recovery does not expose existing passwords.
- [ ] Suspensions and removals preserve historical match records.

### Deployment and operations

- [ ] Production URLs and environment variables are correct.
- [ ] WebSocket updates work.
- [ ] Direct frontend route refreshes work.
- [ ] Upload size limits work.
- [ ] CSV exports resist formula injection.
- [ ] PDF reports generate successfully.
- [ ] Backups are available and restoration has been tested.
- [ ] Server errors and important failures are logged.

---

## 25. FINAL PRODUCT DECISIONS

The following decisions define the initial release:

1. There is exactly one global platform administrator.
2. Public visitors can browse all tournaments without an account.
3. Invite-only tournaments remain publicly visible, but registration is restricted.
4. Players need accounts to register.
5. Organizers require administrator approval.
6. Authentication uses email and password.
7. Email verification and email notifications are excluded initially.
8. Password recovery is administrator-assisted.
9. Notifications are in-website only.
10. Tournaments support knockout, league, and group-stage-plus-knockout formats.
11. Team formation supports live auctions or manual assignment.
12. The auction is publicly viewable but bidding is restricted to authorized captains.
13. Auction rules are configurable, with server-side validation and auditable undo.
14. Results can be entered manually or imported from CSV.
15. CSV parsing must be based on a real sample file.
16. Results are published only after organizer confirmation.
17. Live matches display status only; scores are published after the match result is confirmed.
18. Rules can change after a tournament starts, with audit history and impact handling.
19. Organizers can suspend or remove players with a recorded reason.
20. Organizers can cancel or reschedule tournaments with reasons and participant notifications.
21. A waiting list is supported, with manual selection when a spot opens.
22. Players can join multiple tournaments independently.
23. Participation-history visibility is controlled by the player.
24. Account deletion requests are supported while preserving necessary historical records.
25. There is no built-in reporting system or formal appeal workflow in the initial release.
26. Global career rankings and cross-tournament statistics are excluded.
27. The public tournament archive remains available after completion.
28. The global administrator can intervene in exceptional cases, with all interventions audited.
29. CSV and PDF reports are supported.
30. The first release prioritizes reliability, security, and low operating cost over unnecessary complexity.

---

## 26. RECOMMENDED BUILD ORDER

For the smoothest implementation, follow this sequence:

1. Build the project foundation, authentication, roles, and administrator bootstrap.
2. Build public tournament browsing and tournament detail pages.
3. Implement organizer applications and approvals.
4. Implement tournament creation, rules, registration, and waiting lists.
5. Implement teams, captain selection, and manual assignments.
6. Implement the live auction with concurrency-safe server logic.
7. Implement fixtures and standings.
8. Implement manual results and CSV import using the actual scorecard format.
9. Implement result confirmation, correction, and historical archives.
10. Implement notifications, announcements, exports, and audit views.
11. Implement account lifecycle and exceptional administrator workflows.
12. Complete security testing, backups, and deployment.

**Final guiding principle:** The backend is the source of truth for permissions, registrations, auction bids, countdowns, results, standings, and audit history. The frontend presents the data and provides the controls, but it must never be trusted to enforce critical rules on its own.