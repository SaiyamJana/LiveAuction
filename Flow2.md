# Complete Tournament Hosting Flow

## Public Homepage and Tournament Discovery
- Anyone can access the website without login or signup.
- The homepage displays upcoming, ongoing, and completed tournaments.
- Visitors can view tournament details, participants, fixtures, match results, points tables, brackets, and winners.
- Visitors can search and filter tournaments and open any tournament to explore its complete history.

## Organizer Registration and Login
- Anyone who wants to host a tournament clicks "Create Tournament."
- The organizer registers using their name, email, and password, then logs in.
- The system authenticates the organizer and redirects them to their dashboard.
- The dashboard displays tournaments created by that organizer and their current status.
- Organizers can create and manage only their own tournaments.

## Tournament Creation and Publishing
- The organizer clicks "Create Tournament" and fills in the tournament details.
- Details include tournament name, description, game type, rules, tournament format, participant limit, registration deadline, start date, and end date.
- The organizer selects a format, such as Knockout, League, Round-Robin, or Group Stage followed by Knockouts.
- The organizer configures individual or team participation, eligibility criteria, and any other tournament-specific settings.
- The system validates the information and saves the tournament.
- The organizer publishes the tournament, making it visible to everyone on the public homepage.

## Participant Registration and Approval
- Visitors open a tournament page and review its details and rules.
- Interested participants log in or create an account if required for registration.
- Participants register individually or submit their team details, depending on the tournament format.
- The system validates registrations and prevents duplicate entries.
- If approval is required, the organizer reviews and approves or rejects registrations.
- Participants receive confirmation after successful registration.
- The organizer monitors registrations and finalizes the participant list when registration closes or the participant limit is reached.

## Fixture Generation and Match Scheduling
- After registration closes, the organizer finalizes the confirmed participants or teams.
- The organizer generates fixtures automatically or arranges matches manually.
- For Knockout tournaments, the system creates brackets and handles byes when required.
- For League or Round-Robin tournaments, the system generates the required fixtures and match schedule.
- For Group Stage tournaments, the system creates groups and schedules group matches.
- The organizer assigns match dates, times, and other relevant details.
- The organizer reviews and publishes the fixtures.
- Everyone can view the fixtures on the public tournament page without logging in.

## Match Execution in the Hand Cricket App
- Matches are played externally using the Hand Cricket app, not directly on the tournament website.
- The website does not provide live gameplay or live scoring.
- Participants play their scheduled matches in the Hand Cricket app.
- After a match finishes, the Hand Cricket app provides a CSV file containing the match scorecard and available match statistics.
- The organizer obtains the CSV file for the completed match and uploads it to the corresponding fixture on the tournament website.

## CSV Upload and Result Processing
- The organizer opens the relevant match in the tournament dashboard.
- The organizer uploads the CSV scorecard exported from the Hand Cricket app.
- The system validates the uploaded file and checks that its format and required data are correct.
- The system extracts the match information, player details, scores, and other available statistics from the CSV.
- The system verifies that the uploaded scorecard corresponds to the selected fixture and that the match has not already been processed.
- The system calculates or identifies the winner based on the scorecard and the tournament's rules.
- If the file is invalid, incomplete, or inconsistent, the system displays an error and asks the organizer to upload a corrected file.
- The organizer reviews the extracted scorecard and confirms the result.
- Once confirmed, the system saves the scorecard, final scores, winner, and match statistics in the database.
- The match status changes to completed, and its result becomes publicly visible.
- Visitors can open the match to view its final scorecard and available statistics.

## Points Table and Tournament Progression
- After a result is confirmed, the system updates the tournament records automatically.
- For League or Round-Robin tournaments, the points table is updated using the configured points and tie-breaker rules.
- For Group Stage tournaments, the relevant group standings are updated.
- For Knockout tournaments, the winner advances to the next round.
- The system updates the bracket and identifies the next fixtures when the required results are available.
- The organizer can view completed matches, pending scorecard uploads, upcoming fixtures, and qualification status.
- Visitors can view updated standings, brackets, results, and match history without logging in.
- The process continues until all required matches, including the final, are completed and their scorecards have been processed.

## Final Match and Tournament Completion
- The organizer schedules and publishes the final match.
- The finalists play their match in the Hand Cricket app.
- After the match, the organizer uploads the final CSV scorecard.
- The system processes the file, extracts the scores, and determines the winner according to the configured rules.
- The organizer reviews and confirms the final result.
- The system updates the final scorecard, tournament standings, and winner information.
- The organizer declares the tournament completed.
- The tournament status changes to completed, and the tournament appears in the completed tournaments section.
- The public tournament page displays the winner, runner-up, final standings, fixtures, results, and match scorecards.
- Anyone can revisit the completed tournament at any time to view its full history.

## Organizer Dashboard and Tournament Management
- Organizers can view and manage their own tournaments from a central dashboard.
- They can edit permitted tournament details, manage registrations, generate fixtures, and schedule matches.
- They can upload CSV scorecards for completed matches and review extracted results.
- They can track matches awaiting scorecards, results awaiting confirmation, and matches that are fully completed.
- They can correct an incorrect result through an authorized process.
- They can export tournament results and available statistics if the feature is implemented.
- Organizers cannot modify tournaments belonging to other organizers.

## Platform Administrator
- The website has only one platform administrator: the website owner.
- The admin can view and manage all tournaments created by every organizer.
- The admin can manage organizer accounts, investigate reports, and moderate tournaments that violate platform rules.
- The admin can review tournament records and intervene in disputes or incorrect results when necessary.
- The admin can monitor platform-wide statistics, including tournaments, registrations, completed matches, and organizers.
- Admin permissions are separate from organizer permissions, and public tournament viewing remains accessible without login.

## Essential System Requirements
- Public access to upcoming, ongoing, and completed tournaments without login.
- Secure authentication for organizers and any participants who need accounts.
- Backend authorization so organizers can manage only their own tournaments.
- CSV validation and reliable extraction of match results from the Hand Cricket app's scorecards.
- Duplicate-upload prevention and safeguards against processing the same match result more than once.
- Organizer review and confirmation before finalizing uploaded results.
- Automatic updates to match status, points tables, knockout brackets, and tournament standings after result confirmation.
- Persistent storage of tournament details, registrations, fixtures, CSV scorecards, match results, and tournament history.
- Publicly accessible tournament pages with shareable URLs and no exposure of private participant information.