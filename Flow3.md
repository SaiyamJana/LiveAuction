# Complete Tournament Hosting and Live Auction Flow

## Public Homepage and Tournament Discovery
- Anyone can access the website without login or signup to view upcoming, ongoing, and completed tournaments.
- Visitors can view tournament details, participants, fixtures, match results, points tables, brackets, winners, and previous match history.
- Visitors can search and filter tournaments and open any tournament to explore its complete details.

## Organizer Registration and Login
- Anyone who wants to host a tournament clicks "Create Tournament" and registers using their name, email, and password.
- After login, the organizer is redirected to their dashboard, where they can create and manage their own tournaments.
- Organizers can manage only the tournaments they have created, while the platform owner remains the only administrator with global access.

## Tournament Creation and Publishing
- The organizer enters the tournament name, description, game type, rules, tournament format, participant limit, registration deadline, and tournament dates.
- The organizer selects the format, such as Knockout, League, Round-Robin, or Group Stage followed by Knockouts.
- The organizer configures participant registration, approval requirements, team settings, and other tournament-specific options.
- The organizer enables or disables the Live Auction feature depending on the tournament requirements.
- The system validates the information, and the organizer publishes the tournament.
- The tournament becomes publicly visible on the homepage, and anyone can view its details without logging in.

## Participant Registration
- Interested players open the tournament page and register using their name, email, and other required details.
- The registration form includes an optional "I want to participate as a Captain" checkbox.
- Selecting the checkbox indicates interest in becoming a captain but does not automatically grant captain privileges.
- The system validates registrations and prevents duplicate entries.
- The organizer reviews registrations and approves participants if approval is required.
- After registration closes, the organizer finalizes the eligible player list.

## Live Auction Configuration and Captain Assignment
- If Live Auction is enabled, the organizer configures the number of teams, team names, initial purse, minimum and maximum squad sizes, player base prices, bid increments, and bid timer.
- The organizer also configures auction order, unsold player rules, and other auction-specific settings.
- For example, the organizer creates 8 teams and assigns an initial purse to each team.
- The organizer searches registered players by name or email and selects 8 captains from the players who registered their interest in captaincy.
- The organizer assigns one captain to each team and finalizes the team names and captain details.
- Selected captains receive access to their assigned team's auction dashboard and can bid for players on behalf of their teams.
- The organizer defines whether captains are automatically included in their teams' squads and whether their inclusion has any purse cost.
- Before the auction starts, the system verifies the team settings and locks critical auction rules to prevent unauthorized changes during bidding.

## Live Auction Process
- The organizer opens the auction control panel, selects the first player, and clicks "Start Bidding."
- The player appears on the auction screen with their name, category, base price, current highest bid, leading team, and countdown timer.
- Eligible captains can place bids from their own dashboards while spectators watch the auction.
- Every bid is sent to the backend, which validates the bid amount, captain permissions, team eligibility, remaining purse, and squad requirements.
- The first valid bid is accepted at the base price or at a higher permitted amount.
- After an accepted bid, the current price and leading team are updated for everyone, and the configured countdown begins or resets.
- For example, if the timer is set to 15 seconds, captains have 15 seconds to submit the next valid bid.
- Each new accepted bid must satisfy the configured increment, and the timer resets according to the auction rules.
- If no further valid bid is accepted before the timer expires, the current highest bidder wins the player.
- If nobody bids, the player is marked unsold or handled according to the configured unsold-player rules.
- The organizer can pause or resume the auction and manage exceptional situations through authorized controls.
- After a player is sold, the system records the winning team and final price, deducts the amount from the team's purse, updates its squad, and proceeds to the next player.

## Simultaneous Bidding and Auction Synchronization
- All bids are processed by one authoritative backend server so that every captain follows the same auction state.
- If two captains click the bid button at nearly the same time, the server processes their requests in a defined order and validates each bid against the latest accepted price.
- The first valid bid committed by the server becomes the accepted bid. The next bid must satisfy the increment above that updated price.
- Invalid, duplicate, stale, or late bids are rejected with a clear message.
- The backend controls the countdown and determines whether a bid arrived before the deadline; the browser timer is only a visual display.
- Socket.IO broadcasts accepted bids, updated prices, leading teams, timer changes, and auction status to all connected captains and spectators in real time.
- The backend uses atomic updates or transactions to prevent conflicting bids, duplicate purchases, and incorrect purse deductions.

## Team Purse and Bid Eligibility
- Before accepting a bid, the system checks whether the team has sufficient purse remaining and has not reached its maximum squad size.
- The system also reserves enough money for the minimum base-price cost of the remaining required players.
- The maximum affordable bid is calculated as: Remaining Purse − (Remaining Required Players × Minimum Base Price).
- For example, if a team has 400 credits remaining and needs 3 more players at a minimum base price of 50 credits each, it must reserve 150 credits and can bid up to 250 credits for the current player.
- After winning a player, the team purse decreases by the winning price, the remaining squad requirement decreases, and the affordability calculation is updated.
- If a team cannot afford the next bid while retaining enough purse to complete its minimum squad, the system prevents that bid.
- The same validation is enforced by the backend even if the frontend disables the bid button.
- Teams that reach their maximum squad size or cannot satisfy the auction's eligibility rules are prevented from bidding further.

## Auction Completion and Final Squads
- The auction continues until all required players have been auctioned or the organizer completes it according to the configured rules.
- The system displays each team's final squad, players purchased, individual purchase prices, total spending, and remaining purse.
- The organizer reviews the final squads and resolves any pending auction issues.
- Unsold players can be offered again in a subsequent round if that option was enabled.
- Once the auction is finalized, the system saves the complete auction history and prevents unauthorized changes to confirmed purchases.

## Fixture Generation and Match Scheduling
- After the auction, the organizer finalizes the participating teams and generates fixtures automatically or arranges them manually.
- For Knockout tournaments, the system generates brackets and handles byes when required.
- For League or Round-Robin tournaments, the system generates the required fixtures and match schedule.
- For Group Stage tournaments, the organizer configures groups and the system generates group matches.
- The organizer assigns match dates and other relevant details, reviews the fixtures, and publishes the schedule.
- Everyone can view the fixtures and tournament schedule without logging in.

## Match Execution and CSV Scorecard Upload
- Matches are played externally in the Hand Cricket app; the tournament website does not provide live gameplay or live scoring.
- After a match finishes, the Hand Cricket app provides a CSV file containing the match scorecard and available statistics.
- The organizer opens the corresponding fixture in the tournament dashboard and uploads the CSV file.
- The system validates the file, extracts the available match details and scores, and checks that the scorecard corresponds to the selected fixture.
- The organizer reviews the extracted information and confirms the result.
- The system saves the scorecard, final scores, winner, and available statistics, then marks the match as completed.
- Invalid, incomplete, duplicate, or inconsistent uploads are rejected or flagged for review.
- Confirmed results become publicly visible on the tournament page.

## Points Table and Tournament Progression
- After a result is confirmed, the system updates tournament standings according to the configured rules.
- League and Round-Robin tournaments update the points table, while Group Stage tournaments update their respective group standings.
- In Knockout tournaments, the winner advances to the next round, and the bracket is updated.
- The system updates qualification status and prepares the next fixtures when the required results are available.
- Visitors can view completed matches, uploaded scorecards, standings, brackets, and upcoming fixtures without logging in.
- This process continues until all required matches, including the final, have been completed and their scorecards processed.

## Final Match and Tournament Completion
- The organizer schedules and publishes the final match.
- The finalists play the match in the Hand Cricket app.
- After the match, the organizer uploads the final CSV scorecard, and the system extracts the result for verification.
- The organizer confirms the final result and declares the tournament completed.
- The system updates the winner, runner-up, final standings, match history, and tournament status.
- The completed tournament appears in the completed tournaments section and remains publicly accessible for future viewing.

## Organizer Dashboard and Platform Administration
- Organizers can manage their own tournaments, participants, captains, teams, auctions, fixtures, scorecard uploads, and results from their dashboard.
- Organizers can monitor pending registrations, upcoming matches, missing scorecards, and results awaiting confirmation.
- The single platform administrator can view all tournaments, manage organizer accounts, investigate reports, and moderate tournaments when necessary.
- The administrator has global management privileges, while organizers remain restricted to their own tournaments.

## Essential System Requirements
- Public viewing of upcoming, ongoing, and completed tournaments without login.
- Secure organizer authentication and backend authorization.
- Real-time auction synchronization using Socket.IO and server-authoritative bid processing.
- Configurable auction timers, bid increments, purse limits, and squad requirements.
- Reliable CSV validation, scorecard extraction, and match-result confirmation.
- Automatic updates to team squads, remaining purses, points tables, brackets, and tournament standings.
- Persistent storage of tournament details, registrations, auction history, fixtures, uploaded scorecards, match results, and final standings.
- Prevention of duplicate bids, conflicting purchases, duplicate scorecard processing, and unauthorized modifications.