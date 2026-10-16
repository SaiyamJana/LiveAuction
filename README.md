there will be total of 4 dedicated workflow roles !!
Owner , tournament Organizer , Captains , Users
For normal users no account creation / login is required 
Normal users can open the website can see the past tournaments , current tournaments and theiir current stage , i.e whther auction hapened , or what is expected date and some details of tournaments (matches and their details and all !!)
- **Custom Tournament Structure:** Each tournament organizer can design a fully customized, multi-stage tournament format by defining the number and type of stages, participating teams, groups, qualification criteria, elimination rules, fixture generation, and progression between stages (e.g., league → playoffs → semifinals → final, or league → multiple groups → knockout), with all configurations stored in the database and match progression managed dynamically by the backend without hardcoding specific tournament formats.

Flow of Tournament 
All users can see the website without login and creation of account 
Simple account creation of users takes place with Username , email , password 
also a small creation of owner account (note there can be only 1 owner account across database)
Same Username , email , password , 
All users , owner needs to login using his Username , password (no reset password option for owner)
Every user / owner can delete their account (with 2 time confirmation) in their dashboards
If someone wants to reset his password , he needs to enter Username and email (correctly) and then can reset his password 
If one user clicks a button (Create a tournament) , he needs to create / login into its account 
A notifiaction or something goes to owner dashboard i.e me , if i approve then only his tournament is created 
Later he can give details about custom tournaments options 

after auction , organizer can assign some unsold players to teams (in 0 price) if some captains doesnt filled up their minimum team size
Note : There will be no images , videos things in entire website 

This all are required to enter by organizer before players start registrating

Tournament details : 
Tournament name.
Tournament description.
Registration opening and closing dates.
Tournament visibility: public or private.
Tournament status: draft, registration open, registration closed, auction scheduled, auction in progress, tournament in progress, completed, or cancelled.
Tournament rules and instructions.
Organizer contact details visible to participants
Time zone used for schedules and deadlines.

Tournament Team details : 
Total number of teams participating.
Team names, entered manually or generated initially and edited later.
Maximum players allowed in each team.
Minimum players required in each team, if applicable.
Team captain assignment: organizer assigns captains or selects from approved volunteers.
team names can be changed after setup by team captains respective or organizer !!
Team registration status and approval.
Team-specific rules or restrictions, if required.
No of players in each match by each team , no of reserve players in each team , this all goes in team specific rules

Player registration : 
Organizer will create the form structure (like google form !!)

Tournament structure enter now : 
Total number of stages, excluding the separate final qualification/playoff stage
Stage names: organizer-defined, such as League Stage, Group Stage 2, Super Six, Round of 16, or custom names.
Stage order.
Stage type:League / round-robin , Groups. , Knockout , Custom stage.

Stage configuration : 
Stage name and stage type , Number of groups.
Group names, such as Group A, Group B, Group C, or custom names.
Number of teams in each group.
Whether all eligible teams must be allocated.
Team allocation method:
- Ready-made / automatic: System distributes teams evenly and randomly.
- Custom / manual: Organizer selects which teams enter each group.
- Seeded allocation (recommended additional option): Teams are distributed based on ranking or seed to avoid certain teams being grouped together.

Qualification Rules / Stage : 
Number of teams qualifying from each group (It would be selected in prev stage itself , i.e which no of teams top in each grp gets moved into next stage / next stage which is qualification)
Whether the number of qualifying teams can vary across group (selected by organizer either ready made , by system or custom by organizer)
Points table can be edited by organizer easily during the tournament 

Fixture matches in every stage (Either stages / qualification stages)
No of macthes in every stage 
Which teams play each other.
Either selected as 
Single round-robin or double round-robin.
Automatic/random: System generates fixtures from eligible teams.
Custom/manual: Organizer selects both teams for every match.

Playoff Configuration : Similarly 
WC playoff style , IPL PLayoff style , Custom (like prev stages)

Tournament details : 
Whther organizer wants to maintain : 
Points Table (mandatory) for every stage 
Max runs (overall tournaments)
most wickets 
Most runs etc and many more 

Each match details can be filled by two options : 
CSV file (containing match details )
Manual entry by organizer
i.e manual writing 
1st innigs batting : runs , bowls faced , strike rate , bowling : runs given , bowls bowled , wickets taken , total runs by team , 
Similar for 2nd innings : Also team names and etc 

This details will entered by organizer 
Then after cliking enter button , all ttournaments details , points table and all max runs and whatever gets updated automatically 
If some incorrect things happen , then organizer can click revert button then make changes manually 
NRR calculation can also by system , manual entry can also be done 

Whatever details can be , all can be edited by organizer later !!!!!!
All details can be edited 
All things has 2 thins : System enabled automatic , manual entry / changes 