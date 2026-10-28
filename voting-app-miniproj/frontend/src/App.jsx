
import { BrowserProvider, Contract } from "ethers";
import { useEffect, useState } from "react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import "./App.css";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [status, setStatus] = useState("Connect your wallet to begin.");
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [electionStarted, setElectionStarted] = useState(false);
  const [electionEnded, setElectionEnded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [voterAddress, setVoterAddress] = useState("");

  useEffect(() => {
  if (!window.ethereum) return;

  const handleAccountsChanged = () => {
    setAccount("");
    setContract(null);
    setIsAdmin(false);
    setCandidates([]);
    setStatus("Account changed. Click Connect Wallet again.");
  };

  window.ethereum.on("accountsChanged", handleAccountsChanged);

  return () => {
    window.ethereum.removeListener(
      "accountsChanged",
      handleAccountsChanged
    );
  };
}, []);

  async function refreshData(votingContract, voterAddress) {
    const started = await votingContract.electionStarted();
    const ended = await votingContract.electionEnded();
    const isRegistered =
      await votingContract.registeredVoters(voterAddress);
    const alreadyVoted =
      await votingContract.hasVoted(voterAddress);

    const count = Number(await votingContract.getCandidateCount());
    const list = [];

    for (let i = 0; i < count; i++) {
      const candidate = await votingContract.candidates(i);

      list.push({
        id: Number(candidate.id),
        name: candidate.name,
        votes: Number(candidate.voteCount),
      });
    }

    setCandidates(list);
    setRegistered(isRegistered);
    setHasVoted(alreadyVoted);
    setElectionStarted(started);
    setElectionEnded(ended);
    console.log("Election started:", started);
console.log("Election ended:", ended);
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus("Install MetaMask to connect your wallet.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      if (network.chainId !== 31337n) {
        setStatus("Switch MetaMask to the local Hardhat network (chain ID 31337).");
        return;
      }

      const votingContract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const adminAddress = await votingContract.admin();

      setIsAdmin(
        adminAddress.toLowerCase() === address.toLowerCase()
        
      );
      console.log("Connected account:", address);
console.log("Contract admin:", adminAddress);
console.log("Is admin:", adminAddress.toLowerCase() === address.toLowerCase());

      setAccount(address);
      setContract(votingContract);
      await refreshData(votingContract, address);
      setStatus("Wallet connected successfully.");
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  async function castVote(candidateId) {
    if (!contract) return;

    try {
      setLoading(true);
      setStatus("Confirm the transaction in MetaMask...");

      const tx = await contract.vote(candidateId);

      setStatus("Transaction submitted. Waiting for confirmation...");
      await tx.wait();

      await refreshData(contract, account);
      setStatus("Your vote was recorded successfully.");
    } catch (error) {
      setStatus(
        error.reason ||
        error.shortMessage ||
        "Voting failed. Check your eligibility and election status."
      );
    } finally {
      setLoading(false);
    }
  }

  async function registerVoter() {
    if (!contract || !voterAddress.trim()) return;

    try {
      setLoading(true);
      setStatus("Registering voter...");

      const tx = await contract.registerVoter(voterAddress.trim());
      await tx.wait();

      setVoterAddress("");
      setStatus("Voter registered successfully.");
      await refreshData(contract, account);
    } catch (error) {
      setStatus(
        error.reason || error.shortMessage || "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startElection() {
    try {
      setLoading(true);
      const tx = await contract.startElection();
      await tx.wait();

      await refreshData(contract, account);
      setStatus("Election started.");
    } catch (error) {
      setStatus(error.reason || error.shortMessage || "Could not start election.");
    } finally {
      setLoading(false);
    }
  }

  async function endElection() {
    try {
      setLoading(true);
      const tx = await contract.endElection();
      await tx.wait();

      await refreshData(contract, account);
      setStatus("Election ended.");
    } catch (error) {
      setStatus(error.reason || error.shortMessage || "Could not end election.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">BLOCKCHAIN APPLICATION</p>
          <h1>Electronic Voting</h1>
          <p className="subtitle">
            Transparent voting powered by a smart contract.
          </p>
        </div>

        <button onClick={connectWallet} disabled={loading}>
          {account
            ? `${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect Wallet"}
        </button>
      </header>

      <section className="status">
        <strong>Status</strong>
        <p>{status}</p>
      </section>

      {account && isAdmin && (
        <section className="status">
          <h2>Admin Panel</h2>

          <input
            type="text"
            placeholder="Voter wallet address (0x...)"
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          />

          <button
            onClick={registerVoter}
            disabled={loading || !voterAddress.trim()}
          >
            Register Voter
          </button>

          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button onClick={startElection} disabled={loading || electionStarted || electionEnded}>
              Start Election
            </button>

            <button onClick={endElection} disabled={loading || !electionStarted || electionEnded}>
              End Election
            </button>
          </div>
        </section>
      )} 

      {account && (
        <>
          <section className="summary">
            <div className="stat">
              <span>Registered voter</span>
              <strong>{registered ? "Yes" : "No"}</strong>
            </div>
            <div className="stat">
              <span>Your vote</span>
              <strong>{hasVoted ? "Submitted" : "Not submitted"}</strong>
            </div>
            <div className="stat">
              <span>Election</span>
              <strong>
                {electionEnded
                  ? "Ended"
                  : electionStarted
                    ? "Active"
                    : "Not started"}
              </strong>
            </div>
          </section>

          <section>
            <div className="section-heading">
              <h2>Candidates</h2>
              <span>{candidates.length} candidates</span>
            </div>

            <div className="candidate-list">
              {candidates.map((candidate) => (
                <article className="candidate" key={candidate.id}>
                  <div>
                    <h3>{candidate.name}</h3>
                    <p>
                      {candidate.votes}{" "}
                      {candidate.votes === 1 ? "vote" : "votes"}
                    </p>
                  </div>

                  <button
                    onClick={() => castVote(candidate.id)}
                    disabled={
                      loading ||
                      !registered ||
                      hasVoted ||
                      !electionStarted ||
                      electionEnded
                    }
                  >
                    {hasVoted
                      ? "Already voted"
                      : !registered
                        ? "Not registered"
                        : "Vote"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <button
            className="refresh"
            onClick={() => refreshData(contract, account)}
            disabled={loading}
          >
            Refresh results
          </button>
        </>
      )}

      <footer>
        Votes are recorded by the smart contract on your local blockchain.
      </footer>
    </main>
  );
}

export default App;
