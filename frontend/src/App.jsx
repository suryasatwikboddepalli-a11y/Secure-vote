import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet } from "./contract.js";

function dateInputToUnix(value) {
  const timestamp = Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isFinite(timestamp)) throw new Error("Please select valid election dates.");
  return timestamp;
}
function readableError(error) {
  return error?.shortMessage || error?.reason || error?.message || "Something went wrong.";
}
function formatDate(timestamp) {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

export default function App() {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState("1");
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", start: "", end: "", candidate: "", cid: "", voter: "" });

  const loadElection = useCallback(async (currentSession, id) => {
    if (!currentSession || !id || Number(id) < 1) return;
    try {
      const [details, candidateRows, isRegistered, alreadyVoted] = await Promise.all([
        currentSession.contract.getElection(id),
        currentSession.contract.getCandidates(id),
        currentSession.contract.isRegisteredVoter(id, currentSession.account),
        currentSession.contract.hasVoted(id, currentSession.account)
      ]);
      setElection(details);
      setCandidates(candidateRows.map(c => ({
        id: c.id.toString(), name: c.name, cid: c.manifestoCID,
        votes: c.voteCount.toString()
      })));
      setRegistered(isRegistered);
      setVoted(alreadyVoted);
    } catch {
      setElection(null);
      setCandidates([]);
      setRegistered(false);
      setVoted(false);
    }
  }, []);

  const loadAll = useCallback(async (currentSession) => {
    try {
      const next = Number(await currentSession.contract.nextElectionId());
      const items = [];
      for (let id = 1; id < next; id++) {
        try {
          const details = await currentSession.contract.getElection(id);
          items.push({ id: String(id), title: details.title });
        } catch { /* Skip an unavailable record. */ }
      }
      setElections(items);
      if (items.length && !items.some(e => e.id === selectedId)) setSelectedId(items[0].id);
    } catch (e) { setError(readableError(e)); }
  }, [selectedId]);

  const connect = async () => {
    setError(""); setMessage(""); setBusy(true);
    try {
      const current = await connectWallet();
      const owner = await current.contract.owner();
      setSession(current);
      setAccount(current.account);
      setIsOwner(owner.toLowerCase() === current.account.toLowerCase());
      await loadAll(current);
      setMessage("Wallet connected successfully.");
    } catch (e) { setError(readableError(e)); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (session && selectedId) loadElection(session, selectedId);
  }, [session, selectedId, loadElection]);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = () => { setSession(null); setAccount(""); setMessage("Wallet changed. Reconnect to continue."); };
    const onChainChanged = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", onAccountsChanged);
    window.ethereum.on?.("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const transact = async (action, successMessage) => {
    if (!session) { setError("Connect your wallet first."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const tx = await action();
      if (tx?.wait) await tx.wait();
      setMessage(successMessage);
      await loadAll(session);
      await loadElection(session, selectedId);
    } catch (e) { setError(readableError(e)); }
    finally { setBusy(false); }
  };

  const createElection = () => transact(() => {
    const start = dateInputToUnix(form.start);
    const end = dateInputToUnix(form.end);
    if (start <= Math.floor(Date.now() / 1000)) throw new Error("Choose a start time in the future.");
    if (end <= start) throw new Error("The end time must be after the start time.");
    return session.contract.createElection(form.title.trim(), start, end);
  }, "Election created. Refresh the election list if needed.");

  const addCandidate = () => transact(() => {
    if (!form.candidate.trim()) throw new Error("Enter a candidate name.");
    return session.contract.addCandidate(selectedId, form.candidate.trim(), form.cid.trim());
  }, "Candidate added.");

  const registerVoter = () => transact(() => {
    if (!ethers.isAddress(form.voter.trim())) throw new Error("Enter a valid wallet address.");
    return session.contract.registerVoter(selectedId, form.voter.trim());
  }, "Voter registered.");

  const vote = (candidateId) => transact(
    () => session.contract.vote(selectedId, candidateId),
    "Vote transaction confirmed."
  );

  const now = Math.floor(Date.now() / 1000);
  const started = election ? (Boolean(election.started) || now >= Number(election.startTime)) : false;
  const ended = election ? (Boolean(election.ended) || now >= Number(election.endTime)) : false;
  const totalVotes = candidates.reduce((sum, c) => sum + Number(c.votes), 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">S</span><span>Secure<span className="accent">Vote</span><small>BLOCKCHAIN VOTING DEMO</small></span></a>
        <div className="wallet-area">
          {account && <span className="wallet-address">{account.slice(0, 6)}…{account.slice(-4)}</span>}
          <button className="button button-primary" onClick={connect} disabled={busy}>{busy ? "Please wait…" : account ? "Reconnect wallet" : "Connect MetaMask"}</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span className="pulse"></span> TRANSPARENT. VERIFIABLE. ON-CHAIN.</div>
          <h1>Your vote.<br /><span className="gradient-text">Recorded on Ethereum.</span></h1>
          <p>A classroom-ready decentralized voting application. Connect your wallet to participate in elections for which the administrator has registered you.</p>
          <div className="hero-note"><span>ⓘ</span> Demonstration only: votes and voter addresses are publicly visible on this blockchain.</div>
        </section>

        {error && <div className="alert alert-error"><strong>Action failed</strong><span>{error}</span><button onClick={() => setError("")}>×</button></div>}
        {message && <div className="alert alert-success"><strong>Update</strong><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}

        {!session && <section className="connect-panel panel">
          <div className="panel-icon">◈</div><div><h2>Connect your wallet to begin</h2><p>Install MetaMask, connect it to the local Hardhat network, and then connect here.</p></div>
          <button className="button button-primary" onClick={connect} disabled={busy}>Connect wallet <span>↗</span></button>
        </section>}

        <section className="stats-grid">
          <div className="stat-card"><span className="stat-label">ELECTIONS</span><strong>{elections.length}</strong><span className="stat-caption">Created on this contract</span></div>
          <div className="stat-card"><span className="stat-label">CANDIDATES</span><strong>{candidates.length}</strong><span className="stat-caption">In selected election</span></div>
          <div className="stat-card"><span className="stat-label">VOTES RECORDED</span><strong>{totalVotes}</strong><span className="stat-caption">Public on-chain count</span></div>
          <div className="stat-card"><span className="stat-label">YOUR STATUS</span><strong className="status-value">{!session ? "Guest" : voted ? "Voted" : registered ? "Eligible" : "Unregistered"}</strong><span className="stat-caption">For selected election</span></div>
        </section>

        <section className="section-heading"><div><div className="eyebrow">PARTICIPATE</div><h2>Active election</h2></div>
          <label className="select-label">SELECT ELECTION
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={!elections.length}>
              {!elections.length && <option value="1">No elections loaded</option>}
              {elections.map(e => <option value={e.id} key={e.id}>#{e.id} — {e.title}</option>)}
            </select>
          </label>
        </section>

        {election ? <>
          <section className="election-banner panel">
            <div><span className={`status-pill ${ended ? "ended" : started ? "live" : "upcoming"}`}><i />{ended ? "ENDED" : started ? "VOTING OPEN" : "UPCOMING"}</span>
              <h3>{election.title}</h3><p>Election #{selectedId} · One vote per registered wallet</p></div>
            <div className="time-block"><span>STARTS</span><strong>{formatDate(election.startTime)}</strong><span>ENDS</span><strong>{formatDate(election.endTime)}</strong></div>
          </section>

          <div className="section-heading candidate-heading"><div><div className="eyebrow">THE BALLOT</div><h2>Choose your candidate</h2></div><span className="muted">{candidates.length} candidates</span></div>
          {candidates.length ? <section className="candidate-grid">
            {candidates.map((candidate, index) => <article className="candidate-card" key={candidate.id}>
              <div className="candidate-top"><div className="candidate-avatar">{candidate.name.slice(0, 1).toUpperCase()}</div><span className="candidate-number">CANDIDATE {String(index + 1).padStart(2, "0")}</span></div>
              <h3>{candidate.name}</h3>
              {candidate.cid && <a className="manifesto-link" href={`https://ipfs.io/ipfs/${encodeURIComponent(candidate.cid)}`} target="_blank" rel="noreferrer">View manifesto on IPFS ↗</a>}
              <div className="vote-count"><span>Votes received</span><strong>{candidate.votes}</strong></div>
              <button className="button button-vote" disabled={!session || busy || !started || ended || !registered || voted} onClick={() => vote(candidate.id)}>
                {voted ? "Already voted" : !registered ? "Not registered" : ended ? "Election ended" : !started ? "Voting not open" : "Vote for candidate"}
              </button>
            </article>)}
          </section> : <div className="empty-state panel"><span>◎</span><h3>No candidates added yet</h3><p>The administrator can add candidates before voting begins.</p></div>}

          <section className="results-panel panel"><div><div className="eyebrow">LIVE TALLY</div><h2>Election results</h2><p>Vote counts update from the smart contract. Individual votes are not private in this demo.</p></div>
            <div className="result-list">{candidates.map(c => <div className="result-row" key={c.id}><div className="result-meta"><span>{c.name}</span><strong>{c.votes} votes</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${totalVotes ? Number(c.votes) / totalVotes * 100 : 0}%` }} /></div></div>)}</div>
          </section>
        </> : <div className="empty-state panel"><span>◷</span><h3>Election not loaded</h3><p>Connect to the deployed contract. If there are no elections, create one using the administrator panel below.</p></div>}

        {session && isOwner && <section className="admin-section">
          <div className="section-heading"><div><div className="eyebrow">CONTRACT OWNER</div><h2>Administrator console</h2></div><span className="admin-pill">ADMIN ACCESS</span></div>
          <div className="admin-grid">
            <form className="panel admin-card" onSubmit={e => { e.preventDefault(); createElection(); }}>
              <h3>01 / Create election</h3><p>Set a title and voting window. Start and end times use your local time zone.</p>
              <label>Election title<input required maxLength="100" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="e.g. Class Representative Election"/></label>
              <label>Start date & time<input required type="datetime-local" value={form.start} onChange={e => setForm({...form, start:e.target.value})}/></label>
              <label>End date & time<input required type="datetime-local" value={form.end} onChange={e => setForm({...form, end:e.target.value})}/></label>
              <button className="button button-primary" disabled={busy}>Create election</button>
            </form>
            <form className="panel admin-card" onSubmit={e => { e.preventDefault(); addCandidate(); }}>
              <h3>02 / Add candidate</h3><p>Add a candidate to the selected election before its start time.</p>
              <label>Candidate name<input required value={form.candidate} onChange={e => setForm({...form, candidate:e.target.value})} placeholder="Candidate full name"/></label>
              <label>Manifesto IPFS CID <span className="optional">OPTIONAL</span><input value={form.cid} onChange={e => setForm({...form, cid:e.target.value})} placeholder="bafy…"/></label>
              <button className="button button-secondary" disabled={busy || !election}>Add candidate</button>
            </form>
            <form className="panel admin-card" onSubmit={e => { e.preventDefault(); registerVoter(); }}>
              <h3>03 / Register voter</h3><p>Register an eligible wallet address before the election starts.</p>
              <label>Voter wallet address<input required value={form.voter} onChange={e => setForm({...form, voter:e.target.value})} placeholder="0x…"/></label>
              <div className="security-hint">Only the contract owner can register voters. Never collect or store wallet seed phrases.</div>
              <button className="button button-secondary" disabled={busy || !election}>Register voter</button>
            </form>
          </div>
        </section>}

        <section className="security-strip"><div className="security-icon">⌑</div><div><strong>Security by contract rules</strong><p>Owner-only administration, registered voter checks, duplicate-vote prevention, candidate validation, and start/end time enforcement.</p></div></section>
      </main>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark">S</span><span>Secure<span className="accent">Vote</span></span></a><span>Built for Ethereum & Solidity coursework</span><span>Not for real-world elections</span></footer>
    </div>
  );
}
