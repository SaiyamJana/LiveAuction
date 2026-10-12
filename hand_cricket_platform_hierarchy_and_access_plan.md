# Hand Cricket Auction Platform

## Product Hierarchy, Navigation, Authentication and Authorization Plan

**Status:** Initial planning document\
**Purpose:** Define the public/private boundary, role hierarchy,
navigation, and essential access-control behavior before
implementation.\
**Working name:** Hand Cricket Auction Platform (name can be decided
later)

> This document is a focused starting specification, not a final
> implementation contract. Technical choices are provisional and should
> be reviewed before coding.

------------------------------------------------------------------------

## 1. Project Overview

The platform helps independent Hand Cricket communities run tournament
player auctions online. Today, organizers may collect player
registrations through forms and conduct auctions on Zoom or Google Meet,
where verbal bids can overlap and team budgets may need to be tracked
manually.

The website will provide:

-   Public access to tournament listings, completed tournament history,
    match history where recorded, and live auctions in read-only mode.
-   A single platform owner/admin (the project owner) who reviews and
    approves requests to create tournaments.
-   Account creation for people who want to organize a tournament.
-   Private organizer controls for approved tournament administrators.
-   Authenticated captain accounts for placing bids on behalf of
    assigned teams.
-   Optional player accounts for registration and participant-specific
    information.
-   Public spectator access without requiring login or signup.

The website is initially an auction and tournament-history platform. It
does not need to implement Hand Cricket gameplay itself. Voice/video can
remain on an external service such as Zoom or Google Meet.

All auction credits are fictional, non-monetary credits for
entertainment. The first version does not include real-money bidding,
payments, or gambling.

## 2. Core Product Principles

1.  **Browsing is public by default.** Visitors should not need an
    account to discover tournaments, view completed tournaments, inspect
    published match history, or watch a live auction.
2.  **Control actions require authentication and authorization.** A
    visitor may observe an auction but cannot bid, change auction state,
    edit teams, approve players, or access private management data
    without the appropriate permission.
3.  **There is one platform administrator.** The initial system has a
    single trusted platform owner/admin account controlled by the
    project owner. There is no public platform-admin signup.
4.  **Tournament creation is approval-based.** A person can submit a
    request to create a tournament, but the tournament is not created as
    an active/usable tournament until the platform admin approves it.
5.  **Tournament authority is scoped.** Approving a tournament makes the
    requester its tournament admin, not the platform admin.
6.  **A private management credential is not a shared password.** Use a
    secure, revocable invitation or claim token to grant
    tournament-admin access. Do not expose a permanent private key in a
    URL or use it as the only security check.
7.  **The server is authoritative.** The backend, not the browser,
    decides whether a user may perform an action and whether a bid is
    valid.
8.  **Public visibility does not imply public modification.** Public
    read endpoints must never expose management credentials, private
    email addresses, pending applications, session tokens, or other
    sensitive information.

------------------------------------------------------------------------

## 3. User Hierarchy

``` text
Platform
└── Platform Admin (one owner-controlled account)
    ├── Reviews tournament creation requests
    ├── Approves or rejects requests
    ├── Suspends/cancels abusive or invalid tournaments when necessary
    └── Has platform-wide administrative access with audit logging

Approved Tournament
└── Tournament Admin (requester approved by Platform Admin)
    ├── Configures tournament and auction
    ├── Manages player applications and eligible player pool
    ├── Creates/assigns teams and captains
    ├── Starts, pauses, resumes, and completes auction
    └── Corrects results through an audited process

Tournament Participants
├── Captain (authenticated; can bid for assigned team only)
├── Player/Participant (may register or receive a team assignment)
└── Other authorized staff (optional later; limited permissions)

Public Visitors (no account required)
├── Browse tournaments
├── View completed tournament and published match history
├── Watch ongoing tournament/auction in read-only mode
└── View public results and public team rosters
```

### Important separation

-   **Platform Admin:** the single site owner/admin. This role approves
    tournament creation requests and oversees the platform.
-   **Tournament Admin:** a normal user who requested a tournament and
    was approved. This role controls only their assigned tournament(s).
-   **Captain:** can place valid bids only for the team they are
    assigned to in that tournament.
-   **Public Visitor:** can read public information but cannot perform
    write actions.

Do not create a general-purpose "admin" role that accidentally gives
every tournament organizer platform-wide powers.

------------------------------------------------------------------------

## 4. Authentication and Account Rules

### 4.1 Public visitors

Public visitors do not need an account to:

-   Open the website.
-   Browse current, upcoming, and completed tournaments.
-   View a live auction as a spectator.
-   View published auction events, results, squads, and match history.
-   See aggregate website visit counters.
-   Open public tournament pages through a shared link.

A public visitor must authenticate before taking any protected action.

### 4.2 Tournament organizer registration

A person who wants to organize a tournament creates an account with:

-   Display/full name.
-   Email address.
-   Password.

Recommended flow:

1.  User opens **Organize a Tournament**.
2.  User creates an account or signs in.
3.  Email address is verified before the request can be approved or
    privileged access is granted.
4.  User submits a tournament creation request containing tournament
    details and proposed rules.
5.  The request appears in the platform admin's private review panel.
6.  The platform admin approves, rejects, or requests changes.
7.  If approved, the system creates the tournament and assigns the
    requester the `Tournament Admin` role for that tournament.
8.  The requester receives a notification and can open the tournament
    management dashboard.

A request should include, at minimum:

-   Proposed tournament name and description.
-   Community/group name.
-   Contact details for the requester.
-   Planned dates or approximate schedule.
-   Expected participant count.
-   Number of teams or proposed team structure.
-   Auction format and player-selection approach.
-   Starting budget/virtual credits per team.
-   Minimum bid and bid increment.
-   Roster size or limits.
-   Overs or match format, if applicable to the tournament.
-   Any additional rules or notes needed for review.

The admin may approve the request as submitted or return it for edits.
Approval should not automatically mean that registration or the auction
starts; the tournament admin must finish setup and explicitly
publish/open it.

### 4.3 Captain and participant authentication

Captains must have authenticated accounts before bidding. Their account
must be assigned to a specific team in a specific tournament.

For the first version, the simplest policy is:

-   Tournament admin invites or assigns captains by verified
    email/account.
-   A captain can bid only for their assigned team.
-   Captains cannot assign themselves to another team or change their
    budget.
-   If players are allowed to register without accounts, their
    registration must still be reviewed and linked to a verified account
    before granting protected participant capabilities.

Whether ordinary players need accounts for registration is an
implementation decision. Keep spectator browsing public regardless.

### 4.4 Platform admin account

-   No public signup route for platform admins.
-   Create the initial admin through a secure deployment/bootstrap
    process.
-   Store passwords using a suitable password-hashing algorithm; never
    store plaintext passwords.
-   Require strong authentication and, if practical, multi-factor
    authentication for the platform admin.
-   Protect admin sessions, apply rate limits, and record sensitive
    admin actions in an audit log.
-   Plan a secure recovery process so the platform does not become
    permanently inaccessible if credentials are lost.

### 4.5 Sessions and account security

Before implementation, decide the session/token strategy. Regardless of
strategy:

-   Hash passwords using a modern password-hashing library.
-   Verify email before granting organizer privileges.
-   Rate-limit login, signup, password reset, and tournament-request
    operations.
-   Use secure HTTPS in production.
-   Keep secrets out of source control and client-side bundles.
-   Provide password reset and session revocation.
-   Enforce permissions on the backend for every REST request and
    WebSocket command.
-   Do not trust a user ID, role, team ID, organization ID, or
    permission supplied only by the client.

------------------------------------------------------------------------

## 5. Tournament Request and Approval Lifecycle

Use a separate request record before creating an approved tournament.

``` text
Draft (optional)
  ↓ submit
Pending Review
  ├── Admin requests changes → Changes Requested
  │                              ↓ resubmit
  │                           Pending Review
  ├── Admin rejects → Rejected
  └── Admin approves → Approved
                           ↓
                    Tournament Created
                           ↓
                    Setup / Unpublished
                           ↓
                    Published / Registration Open
                           ↓
                    Registration Closed
                           ↓
                    Auction Ready
                           ↓
                    Auction Active / Paused
                           ↓
                    Auction Completed
```

### Rules

-   Submitting a request must not create a public tournament
    automatically.
-   Only the platform admin can approve or reject a creation request.
-   Approval creates the tournament and a tournament-admin assignment in
    a single safe workflow, so a partially approved request cannot leave
    a tournament without an owner.
-   Rejection should retain the request and its decision reason for
    audit/support purposes.
-   Changes requested should allow the requester to edit and resubmit.
-   Only the assigned tournament admin may manage that tournament.
-   The platform admin can suspend or cancel a tournament when
    necessary, with a reason recorded.
-   A tournament admin cannot approve their own request or elevate
    themselves to platform admin.
-   All status transitions must be validated on the backend.

------------------------------------------------------------------------

## 6. Private Tournament Admin Access: Use an Invitation, Not a Permanent "Private Key"

The requester already has an account. After approval, the system should
assign that account the `Tournament Admin` role. The requester then
signs in normally and sees the approved tournament in their dashboard.

If the tournament needs to be claimed by a different person, use a
secure invitation/claim flow:

1.  Platform admin approves the request and specifies the intended admin
    email/account.
2.  System generates a cryptographically random, single-use invitation
    token.
3.  Store only a hash of the token, along with tournament ID, intended
    recipient, expiry time, and used/revoked status.
4.  Send the claim link to the intended recipient.
5.  Require login and, if appropriate, matching verified email before
    acceptance.
6.  On acceptance, consume the token and assign the role.
7.  Allow the platform admin to revoke and reissue invitations.

Do not use a predictable tournament ID, a static password, or a
permanent shared secret as authorization. Do not put a long-lived admin
credential in a public tournament URL.

For a single requester who is approved directly, no separate key is
necessary: assign the role to the requester's existing account.

------------------------------------------------------------------------

## 7. Website Navigation and Page Access

### 7.1 Public navigation (no login required)

``` text
/
├── Home
├── Tournaments
│   ├── Upcoming
│   ├── Live Now
│   ├── Completed
│   └── Tournament Details
│       ├── Overview and rules
│       ├── Live auction (read-only for public)
│       ├── Auction timeline/history
│       ├── Teams and published rosters
│       ├── Results
│       └── Matches and match history (if recorded)
├── About / How It Works
├── Organize a Tournament
│   ├── Sign in (if existing user)
│   ├── Create account
│   └── Submit tournament request
└── Login / Create Account
```

Public tournament information must be intentionally published. Do not
expose private contact details, internal notes, pending registrations,
or private admin controls.

### 7.2 Authenticated user navigation

``` text
/account
├── Profile and account settings
├── My tournament requests
│   ├── Pending review
│   ├── Changes requested
│   ├── Approved
│   └── Rejected
└── My tournaments
    └── Tournament Admin Dashboard (only for assigned tournaments)
        ├── Overview
        ├── Tournament settings
        ├── Registration and player approvals
        ├── Teams and captain assignments
        ├── Auction rules and player pool
        ├── Auction control room
        ├── Auction history and audit
        ├── Results and exports
        └── Publish/visibility settings
```

### 7.3 Captain navigation

``` text
/my-teams
└── Tournament / Team
    ├── Team roster
    ├── Remaining virtual budget
    ├── Auction room (bidding controls when authorized)
    └── Auction results
```

Captains can see the public live auction, but bid controls are enabled
only after authentication and server-side verification that they are the
assigned captain of a team in that auction.

### 7.4 Platform admin navigation

``` text
/platform-admin
├── Overview
├── Tournament creation requests
│   ├── Request details
│   ├── Approve
│   ├── Reject with reason
│   └── Request changes
├── All tournaments
│   ├── View status
│   ├── Suspend/cancel if necessary
│   └── Review audit history
├── User/account support (minimal and privacy-conscious)
├── Website analytics
│   ├── Total visits
│   ├── Estimated unique visitors
│   └── Time-window summaries
└── Admin audit log
```

The platform admin routes must be protected by a platform-admin
permission checked on the backend. Hiding the navigation link is not
security.

------------------------------------------------------------------------

## 8. Authorization Matrix

Legend: **Public** = no account required; **Own** = own account/assigned
resources; **Assigned** = assigned tournament/team only; **Platform
Admin** = the single site owner/admin.

  -------------------------------------------------------------------------------------------------
  Action                        Public    Signed-in   Tournament      Captain        Platform Admin
                               visitor         user        Admin              
  ----------------------- ------------ ------------ ------------ ------------ ---------------------
  Browse public                    Yes          Yes          Yes          Yes                   Yes
  tournament listings                                                         

  View published past              Yes          Yes          Yes          Yes                   Yes
  tournament history                                                          

  Watch live auction               Yes          Yes          Yes          Yes                   Yes
  read-only                                                                   

  View published                   Yes          Yes          Yes          Yes                   Yes
  results/match history                                                       

  Submit tournament                 No          Yes   Yes, for a   Yes, for a            Not needed
  creation request                                   new request  new request 
                                                      if allowed   if allowed 

  View own request status           No          Own          Own          Own          All requests

  Approve/reject                    No           No           No           No                   Yes
  tournament requests                                                         

  Configure assigned                No           No     Assigned           No   Emergency/oversight
  tournament                                                                                   only

  Approve tournament                No           No     Assigned           No       Only if support
  players                                                                           intervention is
                                                                                          necessary

  Assign teams/captains             No           No     Assigned           No       Only if support
                                                                                    intervention is
                                                                                          necessary

  Place a bid                       No           No        No by     Assigned         No by default
                                                         default    team only 

  Pause/resume auction              No           No     Assigned           No             Emergency
                                                                                  intervention only

  Correct final result              No           No    Assigned,           No             Emergency
                                                          reason              intervention, audited
                                                        required              

  View private                      No     Own data     Assigned      Minimum   Only when necessary
  registrations/contact                        only   tournament    necessary    for administration
  data                                                              team data 

  View platform admin               No           No           No           No                   Yes
  panel                                                                       

  View aggregate public            Yes          Yes          Yes          Yes                   Yes
  visit count                                                                 

  View detailed                     No           No          Own           No              Platform
  analytics/audit logs                                tournament                    analytics/audit
                                                      audit only              
  -------------------------------------------------------------------------------------------------

The platform admin should not casually operate bids as a captain.
Administrative intervention should be separated from normal tournament
activity and audited.

------------------------------------------------------------------------

## 9. Public Live Auction: Read Access vs. Control Access

The live auction room should have two distinct capability levels.

### Public spectator mode

Anyone can open the live auction URL without signing in and view the
public state, including:

-   Tournament name and status.
-   Current player being auctioned.
-   Current accepted bid and leading team/captain, if tournament rules
    make this public.
-   Time remaining, based on a server-provided deadline.
-   Public bid/event timeline.
-   Published teams and roster updates.
-   Final results when the auction completes.
-   Connection status or last synchronization time.

Spectators must not be able to:

-   Place bids.
-   Nominate players unless explicitly authorized by a tournament rule.
-   Pause, resume, start, or end an auction.
-   Change auction rules, budgets, roster limits, or player status.
-   See private registration details, email addresses, credentials, or
    admin notes.
-   Subscribe to private team/organizer events by guessing a room name.

### Authenticated control mode

The backend verifies every action:

-   Bid command: signed-in user, assigned captain role, correct team,
    correct tournament, auction active, valid amount, budget and roster
    constraints satisfied.
-   Organizer command: signed-in user is the assigned tournament admin
    and the transition is valid.
-   Platform admin command: signed-in user has the single platform-admin
    privilege; action is within the narrow platform-oversight scope and
    logged.

The browser can show or hide buttons based on the user's role, but the
backend must repeat all authorization and business-rule checks.

### Real-time architecture notes

-   Use a public read-only event stream/room for published auction
    updates.
-   Use authenticated, authorized commands for bidding and organizer
    controls.
-   Do not broadcast private emails, registration notes, authentication
    data, or internal audit metadata to the public room.
-   A client joining a Socket.IO room must be authorized for that room
    and its event visibility.
-   The database remains the durable source of truth. On join/reconnect,
    the client should fetch or receive an authoritative snapshot, then
    apply newer events.
-   Important bid and auction-state changes must be persisted before
    being announced as accepted.
-   The server decides bid order and deadline validity; client clocks
    are display-only.

------------------------------------------------------------------------

## 10. Website Visit Counts and Unique Visitors

The homepage should be able to display aggregate counts without
requiring visitors to log in.

### Definitions

-   **Total visits/page views:** number of valid page-view events
    recorded. One person can generate multiple visits/page views.
-   **Estimated unique visitors:** approximate count of distinct
    anonymous visitor identifiers during a defined period or over the
    lifetime of the chosen analytics dataset.
-   **Sessions:** optional measure grouping activity during a period of
    inactivity.

Do not label a raw page-view count as "unique users."

### Recommended initial approach

Use a privacy-conscious first-party analytics mechanism:

1.  When a visitor loads the site, the frontend records a page-view
    event.
2.  If consent and applicable privacy requirements permit, assign a
    random anonymous visitor ID using a first-party cookie or local
    storage identifier.
3.  Send the event to a small analytics endpoint.
4.  The backend records timestamp, route/category, anonymous visitor ID
    or a privacy-preserving identifier, and minimal technical metadata.
5.  Exclude known bots, health checks, admin preview traffic, and
    obvious duplicate/retry events where practical.
6.  Aggregate total page views and approximate unique visitors for
    display.
7.  Cache public aggregate counters so each homepage load does not
    trigger expensive analytics queries.

### Limitations and privacy

-   Unique counts are estimates, not proof of distinct human beings.
-   Clearing cookies/storage, using private browsing, changing devices,
    or blocking analytics may cause one person to be counted more than
    once or not counted.
-   Shared devices may combine multiple people into one identifier.
-   Do not use invasive fingerprinting to try to make the count exact.
-   Do not collect more personal data than needed.
-   Publish a concise privacy notice and decide whether consent is
    required for the selected analytics approach.
-   Consider counting unique visitors over a clearly named period, such
    as "unique visitors this month," as well as a lifetime estimate.
    Lifetime unique counts become harder to interpret as identifiers
    expire or policies change.
-   The public page should show cached aggregate totals, not visitor IDs
    or raw event records.
-   Detailed analytics are visible only to the platform admin.

Suggested public labels: - **Website visits** --- total recorded page
views since launch. - **Estimated unique visitors** --- estimated
distinct anonymous browsers since launch, with the counting method
documented. - Optional: **Visitors this month** --- estimated unique
browsers in the current calendar month.

### Suggested data entities

**PageViewEvent** - `id` - `occurredAt` - `routeCategory` or normalized
route (avoid storing sensitive query strings) - `anonymousVisitorId` or
a privacy-preserving identifier, if used - `sessionId` (optional) -
`isBotOrExcluded` / exclusion reason (optional) - Minimal metadata
needed for aggregate reporting

**AnalyticsDailyAggregate** (optional when volume warrants it) -
`date` - `pageViews` - `estimatedUniqueVisitors` - `routeCategory`
(optional)

For an early low-traffic site, aggregation can be simpler. Choose the
final schema after selecting the analytics and privacy approach.

------------------------------------------------------------------------

## 11. Suggested Initial Data Entities

Keep the first version small and add entities only when required.

  -------------------------------------------------------------------------------
  Entity                        Purpose                   Important notes
  ----------------------------- ------------------------- -----------------------
  `User`                        Accounts for organizers   Name, normalized email,
                                and captains              password hash,
                                                          verification status,
                                                          account status,
                                                          timestamps

  `PlatformAdmin` or protected  Identifies the single     Must not be
  admin flag                    platform admin            user-editable; no
                                                          public admin signup

  `TournamentRequest`           Stores a proposed         Requester ID, proposed
                                tournament before         details/rules, status,
                                approval                  decision reason,
                                                          reviewer ID, timestamps

  `Tournament`                  Approved tournament and   Public slug/ID,
                                its lifecycle             owner/admin user ID,
                                                          settings, visibility,
                                                          status

  `TournamentAdminAssignment`   Grants management rights  Tournament ID, user ID,
  (or equivalent role record)   to an approved user       role, status,
                                                          created/revoked
                                                          timestamps

  `Team`                        Team within a tournament  Tournament ID, captain
                                                          user ID, budget, roster
                                                          configuration

  `PlayerRegistration`          Player's                  Tournament ID, user ID
                                application/eligibility   or participant details,
                                                          status, approval data

  `Auction`                     Auction configuration and Tournament ID, rules
                                current state             snapshot, state,
                                                          current lot, deadline

  `AuctionPlayer` / `PlayerLot` A player entry in the     Auction ID,
                                auction pool              player/registration ID,
                                                          lot state, final
                                                          team/price

  `Bid`                         Durable record of bid     Auction/lot/team/user
                                attempts/outcomes         IDs, amount, request
                                                          ID, sequence/order,
                                                          outcome, timestamp

  `AuctionEvent`                Important lifecycle/audit Actor, action, target,
                                events                    reason, timestamp;
                                                          avoid storing secrets

  `PageViewEvent`               Raw or short-retention    Minimal visitor
                                analytics event           identifier and
                                                          timestamp if used

  `AnalyticsDailyAggregate`     Cached daily totals       Optional; can be added
                                                          if aggregate queries
                                                          become expensive

  `AdminAuditLog`               Sensitive platform-admin  Actor, action, target,
                                actions                   reason, timestamp
  -------------------------------------------------------------------------------

Some entities can be embedded or combined in MongoDB after reviewing
access patterns. Do not force a separate collection for every concept if
it adds unnecessary complexity. The key requirements are clear
ownership, durable auction records, unique constraints where needed, and
backend-enforced isolation.

------------------------------------------------------------------------

## 12. Essential Business and Security Rules

1.  Public GET/read endpoints expose only published fields and records.
2.  All mutation endpoints and WebSocket commands authenticate the
    caller and authorize the requested action on the server.
3.  A tournament admin can manage only tournaments assigned to that
    account.
4.  A captain can bid only for the assigned team and only while the
    auction is accepting bids.
5.  Budgets, bid ordering, deadlines, roster limits, and auction status
    are enforced on the server.
6.  Every accepted bid is durably recorded and cannot be silently edited
    or deleted.
7.  Administrative corrections create an auditable correction event with
    actor and reason.
8.  Public tournament IDs and URLs are identifiers, not secrets or
    permissions.
9.  Approval tokens are random, single-use, expiring, revocable, and
    stored hashed if a claim flow is needed.
10. The platform admin's privileges are not granted through public
    signup or tournament creation.
11. Cross-tournament and cross-user data access must be tested
    explicitly.
12. Public visit counters expose aggregates only.
13. Do not expose passwords, password reset tokens, session tokens,
    private emails, or raw analytics identifiers in public API responses
    or logs.
14. If the platform admin suspends a tournament, the system must define
    whether the live auction pauses immediately and communicate the
    state change to participants.

------------------------------------------------------------------------

## 13. Initial MVP Scope

### Must have (P0)

-   Public homepage and tournament directory.
-   Public pages for upcoming, live, and completed tournaments.
-   Read-only public live auction view.
-   Public published results and history.
-   Organizer account signup/login and email verification.
-   Tournament creation request form.
-   Single platform-admin review panel.
-   Approve/reject/request-changes workflow.
-   Assign requester as tournament admin after approval.
-   Tournament admin dashboard and permission enforcement.
-   Team/captain assignment.
-   Authenticated captain bidding.
-   Server-authoritative bid validation and budget enforcement.
-   Durable auction history and final results.
-   Total page-view counter and clearly labelled estimated unique
    visitor count, using a privacy-conscious method.
-   Basic admin audit log and secure deployment configuration.

### Should have next (P1)

-   Secure claim/invitation flow when the approved tournament admin
    differs from the requester.
-   Player registration and approval workflow.
-   CSV import/export.
-   Notifications for request decisions and auction scheduling.
-   Tournament suspension and dispute-resolution workflow.
-   Daily analytics aggregates and simple time-window charts.

### Later (P2)

-   Match fixtures and standings.
-   More tournament formats.
-   Advanced analytics.
-   Public player profiles and cross-tournament statistics.
-   Additional organization staff roles.
-   Native mobile application or more advanced PWA behavior.

------------------------------------------------------------------------

## 14. Decisions to Finalize Before Coding

The following decisions need review. The recommendations below are
initial defaults, not irreversible decisions.

  -----------------------------------------------------------------------
  Question                            Suggested starting decision
  ----------------------------------- -----------------------------------
  Who is the platform admin?          One seeded owner-controlled
                                      account; no public admin signup

  Can anyone browse without login?    Yes, for published tournament
                                      information and live spectator view

  Can a visitor bid?                  No; captain must sign in and be
                                      assigned to a team

  Who approves new tournaments?       Only the platform admin

  Who becomes tournament admin after  The verified account that submitted
  approval?                           the request, unless a different
                                      recipient is explicitly designated

  Is a private key required to manage No for the approved requester; use
  a tournament?                       a secure invitation token only for
                                      a separate claim/delegation flow

  Can a tournament admin approve      No
  another tournament request?         

  Can the public see all tournament   All history explicitly marked
  history?                            public; private/internal records
                                      remain hidden

  Can the public see all ongoing      Public read-only view for published
  auctions?                           ongoing tournaments

  What does "unique visitors" mean?   Estimated distinct anonymous
                                      browser IDs over a clearly stated
                                      time window

  How are visits counted?             Record page views; exclude obvious
                                      bots and internal health checks
                                      where practical

  Should visitor identity be          No
  fingerprinted?                      

  Should visitors need an account to  Decide before implementation;
  register as players?                spectator access remains public
                                      either way

  Can captains nominate players?      Admin-controlled nomination for the
                                      initial version; configurable
                                      nomination can be considered later

  Can the platform admin alter        Only for exceptional intervention,
  auction outcomes?                   with a reason and audit record

  Can tournaments be                  Support a visibility setting later;
  unlisted/private?                   public browsing applies to
                                      published public tournaments
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 15. Acceptance Checklist for the First Release

-   [ ] An anonymous visitor can open the homepage and browse public
    tournaments.
-   [ ] An anonymous visitor can watch a published live auction without
    signing in.
-   [ ] Anonymous visitors cannot place bids or invoke organizer
    controls.
-   [ ] An organizer can register with name, email, and password and
    verify the email.
-   [ ] An organizer can submit a tournament request without creating a
    publicly active tournament.
-   [ ] Only the platform admin can approve or reject the request.
-   [ ] Approval creates the tournament and grants management access to
    the correct account.
-   [ ] A tournament admin cannot access another tournament's private
    controls.
-   [ ] A captain can bid only for their assigned team after
    authentication.
-   [ ] The backend rejects forged, stale, unauthorized, or invalid
    bids.
-   [ ] Public event streams contain only information intended for
    spectators.
-   [ ] Public tournament pages do not expose private registration
    details or admin credentials.
-   [ ] Total visits and estimated unique visitors are clearly defined
    and labelled.
-   [ ] Analytics do not require account creation and do not rely on
    invasive fingerprinting.
-   [ ] Sensitive platform-admin actions are recorded in an audit log.
-   [ ] Core access-control, cross-tournament isolation, and
    concurrent-bidding tests pass.

------------------------------------------------------------------------

## 16. Final Recommendation

Build the first version around three clear boundaries:

1.  **Public layer:** browsing, live spectator view, published
    tournament history, published results, and aggregate visit counters.
2.  **Authenticated tournament layer:** account-based tournament
    requests, approved tournament administration, captain bidding, and
    participant-specific actions.
3.  **Platform administration layer:** one owner-controlled admin
    account that approves tournament requests and handles exceptional
    platform-level intervention.

The most important design rule is that **visibility and authority are
separate**: anyone can watch a public auction, but only authenticated,
authorized users can change its state.

Keep this document as a planning baseline. Review the role model,
request-approval workflow, public/private data boundary, analytics
privacy, and auction rules before writing code. Update the specification
when those decisions change.
