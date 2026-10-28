
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    address public admin;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;

    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public hasVoted;

    bool public electionStarted;
    bool public electionEnded;

    constructor(string[] memory candidateNames) {
        admin = msg.sender;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(
                Candidate(i, candidateNames[i], 0)
            );
        }
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    function registerVoter(address voter) external onlyAdmin {
        require(voter != address(0), "Invalid address");
        require(!registeredVoters[voter], "Already registered");

        registeredVoters[voter] = true;
    }

    function startElection() external onlyAdmin {
        require(!electionStarted, "Already started");
        require(!electionEnded, "Election ended");

        electionStarted = true;
    }

    function endElection() external onlyAdmin {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Already ended");

        electionEnded = true;
    }

    function vote(uint256 candidateId) external {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Election ended");
        require(registeredVoters[msg.sender], "Not registered");
        require(!hasVoted[msg.sender], "Already voted");
        require(candidateId < candidates.length, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
}
