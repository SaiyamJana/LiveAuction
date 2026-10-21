# User : 
Actual document storing signed up users (i.e organizers / captains)
- username : name
- email : email
- passwordHash : hashed pass
- role : owner / user (owner specific dashboard is required)
- secureCodeHash : For reset / delete account !
- tokenVersion : old JWTs need to failed after pass reset
- failedAttempts : reset on success

any user cant create tournamnet on his own (acceptance from owner is required)
# Tournament Request Document : 
The request send by any user (organizer if request is accepted) to owner
- user_id : user who wants to become organizer
- name : proposed name of tournament
- description : tournament proposed details 
- status : pending | accepted | rejected | withdrawn
- response : response by owner (if any)
- sendAt : sending time 
- reviewedAt : owner action time

# Tournament : 
Actual tournament Document 
- name : tournament name
- slug : URL name (only for making the link cool !)
- description : details 
- organizer_id : user id 
- request_id : foreign key for tournament creation req doc
- visibility : public | private
- status :  draft | registration_open | registration_closed | auction | tournament_in_progress | completed | cancelled
- tournament_timeline : simple object storing 5 dates : (registration start , close , auction start , end , tournament start)
- contact : Again how should one store : name , contact no : (object storing name and contact )
- teamConfig : Again need to decide : totalTeams , maxPlayers , minPlayers in each time (Object)
- pointsConfig : {win , loss , tie , noresult} -> how many points allocated / deducted for every criteria
- CurrentStage : foreign key to stages Document

# Team : 
Actual Team details :
- tournamentId : foreign key
- name : name
- shortCode : short form of team
- captainUserId : at first it will be null
- purse : Object having initial , current purse
- squadCount : total players buyed

# Player Registration submissions Document
All players submissions recorded here
- tournamentId : foreign key (tournamentId , userId : unique)
- userId : foreign key
- Actual Name : 
- Display Name :
- accountType : (star | gem , isVerified)
- Contact : Number and Country
- wantsCaptain : 
- Response : If rejected then need to rectify by user again
- status : accepted | rejected | pending

# Player 
Document for approved submissions (This all goes to auctions)
- tournamentId : 
- userId : 
- registrationId :
- displayName : 
- status : (sold | unsold | withdrawn | pending)
- teamId : assigned team
- soldPrice : sold price

# Stage
Document storing information about 1 stage in a tournament 
tournamentId : 
name : Name of this stage 
position : Unique per tournament 
type : groups | playoff | custom
status : ready | in-progress | completed
teamIds : Array of all teams participating
fixtureMode : auto | manual
allocationMethod : auto | manual
groups : Object 
    [_id (auto) , name , order , teamIds , qualificationCount]

# Fixture / Match
Most imp document storing information about matches between teams
tournamentId : 
stageId : 
groupId : 
matchhNumber : matchNumber within the group / playoff
roundLabel : Match no 46 / Semi Final 2
isPLayoff : is match is playoff?
teamA_id : 
teamB_id : 
Labels : (teamALabel , teamBLabel) (Eg : Winner of SF1)
description : (venue , description about result)
status : scheduled | completed | cancelled
result : 
    [type : win | tie | noresult , winnerId] --> loserId can be extracted from winnerId , teams
scheduledAt : 
completedAt : 
innings : Object 
    [inningsNo
     battingTeamId
     bowlingTeamId
     battingstats : [{playerId , runs , bowlsfaced , four , six , isOut}]
     bowlingstats : [{playerId , bowlsBowled , runsGiven , maidenBowls , wickets}]
     wicketsFallen : [{runs , wickets , over}]]

# Standings 
Document for points table (per team document)
tournamentId : 
stageId : 
groupId : 
teamId : 
details : {played , won , loss , tie , no_result}
points : 
current_nrr : 
position : 
createdAt / updatedAt : 

# Player_statistics 
Document for extractting statistics 
tournamentId : 
playerId : 
batting : Document : 
    [matches , innings , runs , bowls , fours , sixes , highScore , notOuts]
bowling : Document : 
    [matches , bowlsbowled , wicketsTaken , runGiven , bestFigures(Document of wicket , runsGiven)]

# Auction 
Document storing information about auction details !!
tournamentId : 
status : draft | scheduled | live | paused | completed | cancelled
timeline : Array of date & time of auctions dates
Purse Details : Document : [totalPurse | basePrice]
timer : [timing between organizer clicks done and unsold announce]
bidIncrement : Array of rules 
    [CurrentPrice , increment] ---> {Eg [(basePrice , 1k) , (50k , 5k) , (100k , 10k) etc]}
playerOrder : auto | manual
currentPlayerId : 
currentOrder : 39th player
currentAmount : current bidding amount 
currentTeamId : 

# bids 
Document storing bids informations
tournamentId: 
playerId : 
teamId : 
amount :

# Notifications 
recipientId : userId
type : Eg tournamentRequest | tournamentResponse | etc can be decided later
body : notifications
readAt : null - unread

