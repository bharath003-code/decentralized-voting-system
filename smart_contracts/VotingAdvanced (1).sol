// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingAdvanced {
    address public admin;
    uint public votingStart;
    uint public votingEnd;

    struct Candidate {
        uint id;
        string name;
        string party;
        string imageUrl;
        uint voteCount;
    }

    struct Voter {
        bool registered;
        bool voted;
        uint voteCoin;
    }

    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;

    mapping(address => Voter) public voters;

    event CandidateAdded(uint id, string name, string party, string imageUrl);
    event VoterRegistered(address voter);
    event VoteCast(address voter, uint candidateId);

    modifier duringVoting() {
        require(block.timestamp >= votingStart && block.timestamp <= votingEnd, "Voting not active");
        _;
    }

     constructor(uint _startTime, uint _endTime) {
       // require(_endTime > _startTime, "End must be after start");
        admin = msg.sender;
        votingStart = _startTime;
        votingEnd = _endTime;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }


    function transferAdmin(address newAdmin) external onlyAdmin {
    require(newAdmin != address(0), "Invalid address");
    admin = newAdmin;
    }

    function getVoterStatus(address _voter) external view returns (bool registered, bool voted, uint voteCoin) {
    Voter memory v = voters[_voter];
    return (v.registered, v.voted, v.voteCoin);
    }

    mapping(string => bool) private candidateNames;

    function addCandidate(string memory _name, string memory _party, string memory _imageUrl) public onlyAdmin {
    require(!candidateNames[_name], "Candidate already exists");
    candidatesCount++;
    candidates[candidatesCount] = Candidate(candidatesCount, _name, _party, _imageUrl, 0);
    candidateNames[_name] = true;
    emit CandidateAdded(candidatesCount, _name, _party, _imageUrl);
    }


    function getAllCandidates() external view returns (Candidate[] memory) {
    Candidate[] memory result = new Candidate[](candidatesCount);
    for (uint i = 1; i <= candidatesCount; i++) {
        result[i - 1] = candidates[i];
    }
    return result;
    }

    function registerVoter(address _voter) external onlyAdmin {
        Voter storage v = voters[_voter];
        require(!v.registered, "Already registered");
        v.registered = true;
        v.voteCoin = 1;
        emit VoterRegistered(_voter);
    }

    function vote(uint _candidateId) external duringVoting {
        Voter storage sender = voters[msg.sender];
        require(sender.registered, "Not registered");
        require(!sender.voted, "Already voted");
        require(sender.voteCoin == 1, "No vote coin");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        sender.voted = true;
        sender.voteCoin = 0;
        candidates[_candidateId].voteCount++;
        emit VoteCast(msg.sender, _candidateId);
    }

    function getVotes(uint _candidateId) external view returns (uint) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");
        return candidates[_candidateId].voteCount;
    }

    function getCandidate(uint _id) external view returns (string memory) {
        require(_id > 0 && _id <= candidatesCount, "Invalid candidate");
        return candidates[_id].name;
    }

    function getCandidateDetails(uint _id) external view returns (
    uint id,
    string memory name,
    string memory party,
    string memory imageUrl,
    uint voteCount
    ) {
    require(_id > 0 && _id <= candidatesCount, "Invalid candidate");
    Candidate memory c = candidates[_id];
    return (c.id, c.name, c.party, c.imageUrl, c.voteCount);
    }

    function getCandidateCount() external view returns (uint) {
        return candidatesCount;
    }

    function isVotingActive() external view returns (bool) {
        return block.timestamp >= votingStart && block.timestamp <= votingEnd;
    }
}