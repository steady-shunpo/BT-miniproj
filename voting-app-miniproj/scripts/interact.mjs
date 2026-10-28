
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { NonceManager } from "ethers";

const provider = new JsonRpcProvider("http://127.0.0.1:8545");

const adminKey = process.env.DEPLOYER_PRIVATE_KEY;
const voterKey = process.env.VOTER_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!adminKey || !voterKey || !contractAddress) {
  throw new Error("Set all three environment variables first");
}

const adminWallet = new Wallet(adminKey, provider);
const admin = new NonceManager(adminWallet);
const voter = new Wallet(voterKey, provider);

const artifact = await import("../artifacts/contracts/Voting.sol/Voting.json", {
  with: { type: "json" }
});

const voting = new Contract(
  contractAddress,
  artifact.default.abi,
  admin
);

// Register the voter and start the election.

const voterAddress = await voter.getAddress();

// Register only if this voter isn't registered yet.
let tx;

if (!(await voting.registeredVoters(voterAddress))) {
  tx = await voting.registerVoter(voterAddress);
  await tx.wait();
  console.log("Voter registered:", voterAddress);
} else {
  console.log("Voter already registered:", voterAddress);
}

// Start only if the election hasn't started yet.
if (!(await voting.electionStarted())) {
  tx = await voting.startElection();
  await tx.wait();
  console.log("Election started");
} else {
  console.log("Election already started");
}


// Cast a vote for candidate ID 0 (Alice).
const voterContract = voting.connect(voter);
tx = await voterContract.vote(0);
await tx.wait();
console.log("Vote cast for Alice");

// Read the result from the blockchain.
const candidate = await voting.candidates(0);
console.log("Candidate:", candidate.name);
console.log("Votes:", candidate.voteCount.toString());
