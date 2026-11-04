// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SecureVote - academic decentralized voting demonstration
/// @notice Votes are transparent on-chain; this is NOT a secret-ballot system.
contract SecureVoting {
    address public immutable owner;
    uint256 public nextElectionId = 1;

    struct Election {
        string title;
        uint64 startTime;
        uint64 endTime;
        bool exists;
    }

    struct Candidate {
        uint256 id;
        string name;
        string manifestoCID; // Optional IPFS CID; never put private data here.
        uint256 voteCount;
        bool exists;
    }

    mapping(uint256 => Election) private elections;
    mapping(uint256 => Candidate[]) private candidates;
    mapping(uint256 => mapping(address => bool)) public isRegisteredVoter;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(uint256 => bool)) private candidateIdExists;
    mapping(uint256 => uint256) private nextCandidateId;

    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter);
    event ElectionEnded(uint256 indexed electionId);

    error NotOwner();
    error ElectionNotFound();
    error InvalidElectionWindow();
    error ElectionAlreadyStarted();
    error ElectionNotStarted();
    error ElectionClosed();
    error InvalidCandidate();
    error NotRegisteredVoter();
    error AlreadyVoted();
    error EmptyTitleOrName();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier electionExists(uint256 electionId) {
        if (!elections[electionId].exists) revert ElectionNotFound();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createElection(
        string calldata title,
        uint64 startTime,
        uint64 endTime
    ) external onlyOwner returns (uint256 electionId) {
        if (bytes(title).length == 0) revert EmptyTitleOrName();
        if (startTime >= endTime || endTime <= block.timestamp) revert InvalidElectionWindow();

        electionId = nextElectionId++;
        elections[electionId] = Election({
            title: title,
            startTime: startTime,
            endTime: endTime,
            exists: true
        });
        nextCandidateId[electionId] = 1;
        emit ElectionCreated(electionId, title, startTime, endTime);
    }

    function addCandidate(
        uint256 electionId,
        string calldata name,
        string calldata manifestoCID
    ) external onlyOwner electionExists(electionId) returns (uint256 candidateId) {
        Election storage election = elections[electionId];
        if (block.timestamp >= election.startTime) revert ElectionAlreadyStarted();
        if (bytes(name).length == 0) revert EmptyTitleOrName();

        candidateId = nextCandidateId[electionId]++;
        candidates[electionId].push(Candidate({
            id: candidateId,
            name: name,
            manifestoCID: manifestoCID,
            voteCount: 0,
            exists: true
        }));
        candidateIdExists[electionId][candidateId] = true;
        emit CandidateAdded(electionId, candidateId, name);
    }

    function registerVoter(
        uint256 electionId,
        address voter
    ) external onlyOwner electionExists(electionId) {
        Election storage election = elections[electionId];
        if (block.timestamp >= election.startTime) revert ElectionAlreadyStarted();
        require(voter != address(0), "Invalid voter address");
        isRegisteredVoter[electionId][voter] = true;
        emit VoterRegistered(electionId, voter);
    }

    function vote(uint256 electionId, uint256 candidateId) external electionExists(electionId) {
        Election storage election = elections[electionId];
        if (block.timestamp < election.startTime) revert ElectionNotStarted();
        if (block.timestamp >= election.endTime) revert ElectionClosed();
        if (!isRegisteredVoter[electionId][msg.sender]) revert NotRegisteredVoter();
        if (hasVoted[electionId][msg.sender]) revert AlreadyVoted();
        if (!candidateIdExists[electionId][candidateId]) revert InvalidCandidate();

        hasVoted[electionId][msg.sender] = true;
        // Incrementing a counter is deliberately simple and auditable.
        for (uint256 i = 0; i < candidates[electionId].length; i++) {
            if (candidates[electionId][i].id == candidateId) {
                candidates[electionId][i].voteCount++;
                break;
            }
        }
        emit VoteCast(electionId, candidateId, msg.sender);
    }

    function endElection(uint256 electionId) external onlyOwner electionExists(electionId) {
        Election storage election = elections[electionId];
        require(block.timestamp >= election.endTime, "Election deadline has not passed");
        emit ElectionEnded(electionId);
    }

    function getElection(uint256 electionId)
        external view electionExists(electionId)
        returns (string memory title, uint64 startTime, uint64 endTime, bool started, bool ended)
    {
        Election storage election = elections[electionId];
        return (
            election.title,
            election.startTime,
            election.endTime,
            block.timestamp >= election.startTime,
            block.timestamp >= election.endTime
        );
    }

    function getCandidates(uint256 electionId)
        external view electionExists(electionId)
        returns (Candidate[] memory)
    {
        return candidates[electionId];
    }

    function getCandidateCount(uint256 electionId)
        external view electionExists(electionId)
        returns (uint256)
    {
        return candidates[electionId].length;
    }
}
