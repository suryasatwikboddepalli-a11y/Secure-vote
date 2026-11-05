import { useCallback, useEffect, useState, useMemo } from "react";
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
  return new Date(Number(timestamp) * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatCountdown(diffInSeconds) {
  if (diffInSeconds <= 0) return "00h 00m 00s";
  const days = Math.floor(diffInSeconds / 86400);
  const hours = Math.floor((diffInSeconds % 86400) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState("1");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'live' | 'ended' | 'upcoming'
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [nowTime, setNowTime] = useState(Math.floor(Date.now() / 1000));
  const [form, setForm] = useState({ title: "", start: "", end: "", candidate: "", cid: "", voter: "" });

  // Ticking clock for real-time live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      setCandidates(
        candidateRows.map(c => ({
          id: c.id.toString(),
          name: c.name,
          cid: c.manifestoCID,
          votes: c.voteCount.toString()
        }))
      );
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
      const currentSec = Math.floor(Date.now() / 1000);

      for (let id = 1; id < next; id++) {
        try {
          const [details, candidateRows] = await Promise.all([
            currentSession.contract.getElection(id),
            currentSession.contract.getCandidates(id)
          ]);
          const startNum = Number(details.startTime);
          const endNum = Number(details.endTime);
          const isEnded = Boolean(details.ended) || currentSec >= endNum;
          const isLive = (Boolean(details.started) || currentSec >= startNum) && !isEnded;
          const status = isEnded ? "ended" : isLive ? "live" : "upcoming";
          const votesSum = candidateRows.reduce((acc, c) => acc + Number(c.voteCount), 0);

          items.push({
            id: String(id),
            title: details.title,
            startTime: startNum,
            endTime: endNum,
            status,
            candidateCount: candidateRows.length,
            totalVotes: votesSum
          });
        } catch {
          /* Skip unavailable or corrupted record */
        }
      }
      setElections(items);
      if (items.length && !items.some(e => e.id === selectedId)) {
        setSelectedId(items[items.length - 1].id);
      }
    } catch (e) {
      setError(readableError(e));
    }
  }, [selectedId]);

  const connect = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const current = await connectWallet();
      const owner = await current.contract.owner();
      setSession(current);
      setAccount(current.account);
      setIsOwner(owner.toLowerCase() === current.account.toLowerCase());
      await loadAll(current);
      setMessage("Wallet connected successfully.");
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (session && selectedId) loadElection(session, selectedId);
  }, [session, selectedId, loadElection]);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = () => {
      setSession(null);
      setAccount("");
      setMessage("Wallet account changed. Reconnect to continue.");
    };
    const onChainChanged = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", onAccountsChanged);
    window.ethereum.on?.("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const transact = async (action, successMessage) => {
    if (!session) {
      setError("Please connect your wallet first.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const tx = await action();
      if (tx?.wait) await tx.wait();
      setMessage(successMessage);
      await loadAll(session);
      await loadElection(session, selectedId);
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const createElection = () =>
    transact(() => {
      const start = dateInputToUnix(form.start);
      const end = dateInputToUnix(form.end);
      if (start <= Math.floor(Date.now() / 1000)) throw new Error("Choose a start time in the future.");
      if (end <= start) throw new Error("The end time must be after the start time.");
      return session.contract.createElection(form.title.trim(), start, end);
    }, "Election created successfully! You can now add candidates and register voters.");

  const addCandidate = () =>
    transact(() => {
      if (!form.candidate.trim()) throw new Error("Enter a candidate name.");
      return session.contract.addCandidate(selectedId, form.candidate.trim(), form.cid.trim());
    }, "Candidate added to election.");

  const registerVoter = () =>
    transact(() => {
      if (!ethers.isAddress(form.voter.trim())) throw new Error("Enter a valid wallet address.");
      return session.contract.registerVoter(selectedId, form.voter.trim());
    }, "Voter registered successfully.");

  const vote = candidateId =>
    transact(() => session.contract.vote(selectedId, candidateId), "Vote confirmed on the blockchain! Thank you for voting.");

  const endElectionAdmin = () =>
    transact(() => session.contract.endElection(selectedId), "Election officially ended on-chain.");

  // Presets helper for admin
  const setQuickPreset = (startDelayMinutes, durationMinutes) => {
    const startDate = new Date(Date.now() + startDelayMinutes * 60 * 1000);
    const endDate = new Date(Date.now() + (startDelayMinutes + durationMinutes) * 60 * 1000);
    const toLocalISO = d => {
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };
    setForm(prev => ({
      ...prev,
      start: toLocalISO(startDate),
      end: toLocalISO(endDate)
    }));
  };

  // Status calculation for selected election
  const startTimestamp = election ? Number(election.startTime) : 0;
  const endTimestamp = election ? Number(election.endTime) : 0;
  const ended = election ? Boolean(election.ended) || nowTime >= endTimestamp : false;
  const started = election ? (Boolean(election.started) || nowTime >= startTimestamp) && !ended : false;
  const upcoming = election ? !started && !ended : false;

  const totalVotes = candidates.reduce((sum, c) => sum + Number(c.votes), 0);

  // Ranked candidates
  const rankedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => Number(b.votes) - Number(a.votes));
  }, [candidates]);

  // Leader / Winner calculation
  const topVotes = rankedCandidates.length > 0 ? Number(rankedCandidates[0].votes) : 0;
  const topCandidates = rankedCandidates.filter(c => Number(c.votes) === topVotes);
  const isTie = topCandidates.length > 1;
  const leader = topCandidates[0] || null;
  const runnerUp = rankedCandidates.length > 1 ? rankedCandidates[1] : null;
  const leadMargin = leader && runnerUp ? Number(leader.votes) - Number(runnerUp.votes) : 0;

  // Filtered elections list based on active tab
  const filteredElections = useMemo(() => {
    if (filterTab === "all") return elections;
    return elections.filter(e => e.status === filterTab);
  }, [elections, filterTab]);

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="topbar">
        <a className="brand" href="#">
          <div className="brand-mark">⚡</div>
          <div>
            <span>Secure<span className="accent">Vote</span></span>
            <small>DECENTRALIZED VOTING DAPP</small>
          </div>
        </a>

        <div className="wallet-area">
          {account && (
            <div className="wallet-badge">
              <span className="account-dot" />
              <span className="wallet-address">{account.slice(0, 6)}…{account.slice(-4)}</span>
              {isOwner && <span className="owner-chip">ADMIN</span>}
            </div>
          )}
          <button className="button button-primary" onClick={connect} disabled={busy}>
            {busy ? "Connecting…" : account ? "Switch Account" : "Connect MetaMask"}
          </button>
        </div>
      </header>

      <main>
        {/* Hero Banner */}
        <section className="hero">
          <div className="eyebrow">
            <span className="pulse" /> TRANSPARENT · IMMUTABLE · ON-CHAIN
          </div>
          <h1>
            Decentralized Elections.
            <br />
            <span className="gradient-text">Verifiable & Real-time.</span>
          </h1>
          <p>
            Experience secure, tamper-evident voting backed by Ethereum smart contracts. Track live leads as ballots are cast, or inspect certified results of completed elections.
          </p>
        </section>

        {/* Global Notifications */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <div className="alert-body">
              <strong>Transaction or Action Failed</strong>
              <span>{error}</span>
            </div>
            <button className="alert-close" onClick={() => setError("")}>×</button>
          </div>
        )}
        {message && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            <div className="alert-body">
              <strong>Success</strong>
              <span>{message}</span>
            </div>
            <button className="alert-close" onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">TOTAL ELECTIONS</span>
            <strong>{elections.length}</strong>
            <span className="stat-caption">On-chain registries</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">CANDIDATES</span>
            <strong>{candidates.length}</strong>
            <span className="stat-caption">In selected election</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">BALLOTS CAST</span>
            <strong className="stat-highlight">{totalVotes}</strong>
            <span className="stat-caption">Verified votes recorded</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">YOUR STATUS</span>
            <strong className={`status-value ${registered ? "status-eligible" : ""}`}>
              {!session ? "Guest" : voted ? "Voted ✓" : registered ? "Eligible" : "Unregistered"}
            </strong>
            <span className="stat-caption">For selected election</span>
          </div>
        </section>

        {/* Election Selector & Filter Bar */}
        <section className="election-controls-panel">
          <div className="controls-header">
            <div>
              <div className="eyebrow">EXPLORE ELECTIONS</div>
              <h2>Select & Inspect Election</h2>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterTab === "all" ? "active" : ""}`}
                onClick={() => setFilterTab("all")}
              >
                All <span className="tab-count">{elections.length}</span>
              </button>
              <button
                className={`filter-tab ${filterTab === "live" ? "active" : ""}`}
                onClick={() => setFilterTab("live")}
              >
                🟢 Live Now <span className="tab-count">{elections.filter(e => e.status === "live").length}</span>
              </button>
              <button
                className={`filter-tab ${filterTab === "ended" ? "active" : ""}`}
                onClick={() => setFilterTab("ended")}
              >
                🏆 Completed <span className="tab-count">{elections.filter(e => e.status === "ended").length}</span>
              </button>
              <button
                className={`filter-tab ${filterTab === "upcoming" ? "active" : ""}`}
                onClick={() => setFilterTab("upcoming")}
              >
                ⏳ Upcoming <span className="tab-count">{elections.filter(e => e.status === "upcoming").length}</span>
              </button>
            </div>
          </div>

          {/* Quick Election Card Carousel / Buttons */}
          <div className="election-pills-row">
            {filteredElections.length === 0 ? (
              <div className="no-elections-hint">No elections match the "{filterTab}" category.</div>
            ) : (
              filteredElections.map(e => (
                <button
                  key={e.id}
                  className={`election-select-pill ${selectedId === e.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(e.id)}
                >
                  <span className={`pill-badge badge-${e.status}`}>
                    {e.status === "live" ? "● LIVE" : e.status === "ended" ? "COMPLETED" : "UPCOMING"}
                  </span>
                  <span className="pill-title">#{e.id} {e.title}</span>
                  <span className="pill-votes">{e.totalVotes} votes</span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Selected Election View */}
        {election ? (
          <>
            {/* Election Header Banner with Live Countdown / Certified Result */}
            <section className={`election-banner panel ${ended ? "banner-ended" : started ? "banner-live" : "banner-upcoming"}`}>
              <div className="banner-main">
                <div className="banner-badges">
                  <span className={`status-pill ${ended ? "ended" : started ? "live" : "upcoming"}`}>
                    <i /> {ended ? "COMPLETED ELECTION" : started ? "VOTING LIVE & ONGOING" : "UPCOMING ELECTION"}
                  </span>
                  <span className="election-id-chip">Election #{selectedId}</span>
                </div>

                <h3>{election.title}</h3>
                <p className="banner-subtitle">
                  {ended
                    ? "Voting has officially closed. Certified final tally is permanently recorded on-chain."
                    : started
                    ? "Voting is currently in progress. Cast your ballot or monitor the live lead below."
                    : "Candidate nomination and voter registration are currently open before poll starts."}
                </p>

                {/* Status-specific Callout: Live Lead vs Winner */}
                {ended ? (
                  <div className="winner-callout-box">
                    <span className="trophy-icon">🏆</span>
                    <div>
                      <span className="callout-tag">OFFICIAL CERTIFIED RESULT</span>
                      <h4>
                        {totalVotes === 0
                          ? "Concluded with 0 Votes Cast"
                          : isTie
                          ? `Tied Victory: ${topCandidates.map(c => c.name).join(" & ")} (${topVotes} votes each)`
                          : `Winner: ${leader?.name} with ${leader?.votes} votes (${totalVotes > 0 ? ((Number(leader?.votes) / totalVotes) * 100).toFixed(1) : 0}% of total)`}
                      </h4>
                    </div>
                  </div>
                ) : started ? (
                  <div className="leader-callout-box">
                    <span className="leader-icon">⚡</span>
                    <div>
                      <span className="callout-tag">LIVE RACE LEADER</span>
                      <h4>
                        {totalVotes === 0
                          ? "Polls are open — Waiting for first vote to be cast"
                          : isTie
                          ? `Tied for 1st Place: ${topCandidates.map(c => c.name).join(" & ")} (${topVotes} votes each)`
                          : `${leader?.name} is leading with ${leader?.votes} votes (${((Number(leader?.votes) / totalVotes) * 100).toFixed(1)}%)${leadMargin > 0 ? ` · (+${leadMargin} lead)` : ""}`}
                      </h4>
                    </div>
                  </div>
                ) : (
                  <div className="upcoming-callout-box">
                    <span className="upcoming-icon">⏳</span>
                    <div>
                      <span className="callout-tag">PRE-ELECTION PHASE</span>
                      <h4>Voting will automatically unlock at start time</h4>
                    </div>
                  </div>
                )}
              </div>

              {/* Time & Countdown Block */}
              <div className="time-block">
                {started && (
                  <div className="countdown-container">
                    <span className="countdown-label">POLL CLOSES IN</span>
                    <strong className="countdown-time">{formatCountdown(endTimestamp - nowTime)}</strong>
                  </div>
                )}
                {upcoming && (
                  <div className="countdown-container">
                    <span className="countdown-label">VOTING STARTS IN</span>
                    <strong className="countdown-time countdown-upcoming">{formatCountdown(startTimestamp - nowTime)}</strong>
                  </div>
                )}

                <div className="dates-row">
                  <div>
                    <span>STARTS</span>
                    <strong>{formatDate(election.startTime)}</strong>
                  </div>
                  <div>
                    <span>ENDS</span>
                    <strong>{formatDate(election.endTime)}</strong>
                  </div>
                </div>

                {isOwner && ended && (
                  <button className="button button-secondary button-small" onClick={endElectionAdmin} disabled={busy}>
                    Certify & Close Election
                  </button>
                )}
              </div>
            </section>

            {/* Candidate Ballot & Standings Section */}
            <div className="section-heading">
              <div>
                <div className="eyebrow">{ended ? "CERTIFIED BALLOT RESULTS" : "THE BALLOT & CANDIDATES"}</div>
                <h2>{ended ? "Final Results & Standings" : "Candidates & Live Standings"}</h2>
              </div>
              <span className="muted">{candidates.length} candidate{candidates.length === 1 ? "" : "s"} nominated</span>
            </div>

            {candidates.length ? (
              <section className="candidate-grid">
                {rankedCandidates.map((candidate, index) => {
                  const voteNum = Number(candidate.votes);
                  const pct = totalVotes > 0 ? ((voteNum / totalVotes) * 100).toFixed(1) : "0.0";
                  const isFirst = index === 0 && voteNum > 0;
                  const isWinning = ended && isFirst && !isTie;

                  return (
                    <article
                      className={`candidate-card ${isWinning ? "candidate-winner" : isFirst && started ? "candidate-leading" : ""}`}
                      key={candidate.id}
                    >
                      <div className="candidate-top">
                        <div className="candidate-avatar">
                          {candidate.name.slice(0, 1).toUpperCase()}
                        </div>

                        {/* Rank / Standing Badge */}
                        <div className="candidate-standing-badge">
                          {isWinning ? (
                            <span className="badge-gold">👑 WINNER</span>
                          ) : isFirst && started ? (
                            <span className="badge-lead">⚡ LEADING #{index + 1}</span>
                          ) : (
                            <span className="badge-rank">RANK #{index + 1}</span>
                          )}
                        </div>
                      </div>

                      <h3>{candidate.name}</h3>

                      {candidate.cid && (
                        <a
                          className="manifesto-link"
                          href={`https://ipfs.io/ipfs/${encodeURIComponent(candidate.cid)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View manifesto on IPFS ↗
                        </a>
                      )}

                      {/* Vote Share Progress */}
                      <div className="candidate-stats-section">
                        <div className="vote-meta">
                          <span className="votes-number"><strong>{candidate.votes}</strong> {voteNum === 1 ? "vote" : "votes"}</span>
                          <span className="votes-percent">{pct}% share</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${isWinning ? "progress-winner" : isFirst && started ? "progress-leader" : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        className={`button button-vote ${registered && started && !voted ? "button-vote-active" : ""}`}
                        disabled={!session || busy || !started || ended || !registered || voted}
                        onClick={() => vote(candidate.id)}
                      >
                        {voted
                          ? "✓ You have already voted"
                          : !registered
                          ? "Not registered to vote"
                          : ended
                          ? "Election concluded"
                          : !started
                          ? "Voting not open"
                          : `Vote for ${candidate.name}`}
                      </button>
                    </article>
                  );
                })}
              </section>
            ) : (
              <div className="empty-state panel">
                <span className="empty-icon">◎</span>
                <h3>No candidates registered</h3>
                <p>The administrator can add candidates using the console below before voting starts.</p>
              </div>
            )}

            {/* Live Tally Breakdown Panel */}
            <section className="results-panel panel">
              <div>
                <div className="eyebrow">{ended ? "FINAL CERTIFIED AUDIT" : "LIVE TALLY AUDIT"}</div>
                <h2>{ended ? "Certified Vote Breakdown" : "Live Vote Distribution"}</h2>
                <p>
                  Every vote is cryptographically signed and publicly verifiable on the Ethereum blockchain. One vote per registered address.
                </p>
                <div className="tally-summary-chip">
                  <span>Total Turnout:</span>
                  <strong>{totalVotes} verified ballots</strong>
                </div>
              </div>

              <div className="result-list">
                {rankedCandidates.map((c, idx) => {
                  const voteNum = Number(c.votes);
                  const pct = totalVotes ? ((voteNum / totalVotes) * 100).toFixed(1) : 0;
                  return (
                    <div className="result-row" key={c.id}>
                      <div className="result-meta">
                        <div className="candidate-result-label">
                          <span className="rank-marker">#{idx + 1}</span>
                          <strong className="candidate-name-text">{c.name}</strong>
                          {idx === 0 && voteNum > 0 && (
                            <span className="pill-small-lead">{ended ? "Winner" : "Leading"}</span>
                          )}
                        </div>
                        <strong>{c.votes} votes ({pct}%)</strong>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state panel">
            <span className="empty-icon">◷</span>
            <h3>No election selected</h3>
            <p>Select an election from the list above or create a new one using the administrator console.</p>
          </div>
        )}

        {/* Administrator Console (Owner Only) */}
        {session && isOwner && (
          <section className="admin-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">CONTRACT OWNER ONLY</div>
                <h2>Administrator Console</h2>
              </div>
              <span className="admin-pill">ADMIN ACCESS GRANTED</span>
            </div>

            <div className="admin-grid">
              {/* Card 1: Create Election */}
              <form
                className="panel admin-card"
                onSubmit={e => {
                  e.preventDefault();
                  createElection();
                }}
              >
                <h3>01 / Create Election</h3>
                <p>Configure a title and voting schedule. Use quick presets for fast demonstrations.</p>

                {/* Timing Presets */}
                <div className="presets-row">
                  <span className="preset-label">Quick Presets:</span>
                  <div className="preset-buttons">
                    <button type="button" className="preset-btn" onClick={() => setQuickPreset(1, 5)}>
                      ⚡ 5-Min Demo
                    </button>
                    <button type="button" className="preset-btn" onClick={() => setQuickPreset(1, 60)}>
                      ⏱️ 1-Hour
                    </button>
                    <button type="button" className="preset-btn" onClick={() => setQuickPreset(2, 1440)}>
                      📅 24-Hour
                    </button>
                  </div>
                </div>

                <label>
                  Election Title
                  <input
                    required
                    maxLength="100"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Student Council 2026"
                  />
                </label>

                <label>
                  Start Date & Time
                  <input
                    required
                    type="datetime-local"
                    value={form.start}
                    onChange={e => setForm({ ...form, start: e.target.value })}
                  />
                </label>

                <label>
                  End Date & Time
                  <input
                    required
                    type="datetime-local"
                    value={form.end}
                    onChange={e => setForm({ ...form, end: e.target.value })}
                  />
                </label>

                <button className="button button-primary" disabled={busy}>
                  {busy ? "Processing…" : "Create Election"}
                </button>
              </form>

              {/* Card 2: Add Candidate */}
              <form
                className="panel admin-card"
                onSubmit={e => {
                  e.preventDefault();
                  addCandidate();
                }}
              >
                <h3>02 / Add Candidate</h3>
                <p>Nominate a candidate to Election #{selectedId} before voting begins.</p>

                <label>
                  Candidate Name
                  <input
                    required
                    value={form.candidate}
                    onChange={e => setForm({ ...form, candidate: e.target.value })}
                    placeholder="e.g. Alice Johnson"
                  />
                </label>

                <label>
                  Manifesto IPFS CID <span className="optional">OPTIONAL</span>
                  <input
                    value={form.cid}
                    onChange={e => setForm({ ...form, cid: e.target.value })}
                    placeholder="bafybeic..."
                  />
                </label>

                <button className="button button-secondary" disabled={busy || !election || started || ended}>
                  {started || ended ? "Registration Closed" : "Add Candidate"}
                </button>
              </form>

              {/* Card 3: Register Voter */}
              <form
                className="panel admin-card"
                onSubmit={e => {
                  e.preventDefault();
                  registerVoter();
                }}
              >
                <h3>03 / Register Voter</h3>
                <p>Register eligible wallet addresses for Election #{selectedId} before voting opens.</p>

                {/* Quick Address Insert Helpers */}
                <div className="presets-row">
                  <span className="preset-label">Quick Address:</span>
                  <div className="preset-buttons">
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => setForm({ ...form, voter: account })}
                    >
                      👑 My Admin
                    </button>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => setForm({ ...form, voter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" })}
                    >
                      👤 Voter 1
                    </button>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => setForm({ ...form, voter: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" })}
                    >
                      👤 Voter 2
                    </button>
                  </div>
                </div>

                <label>
                  Voter Wallet Address
                  <input
                    required
                    value={form.voter}
                    onChange={e => setForm({ ...form, voter: e.target.value })}
                    placeholder="0x..."
                  />
                </label>

                <div className="security-hint">
                  Only the contract owner can register voters. Once voting begins, voter list is locked for security.
                </div>

                <button className="button button-secondary" disabled={busy || !election || started || ended}>
                  {started || ended ? "Registration Closed" : "Register Voter"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Security / Audit Strip */}
        <section className="security-strip">
          <div className="security-icon">🛡️</div>
          <div>
            <strong>Decentralized Cryptographic Security</strong>
            <p>
              Smart contract access-control, double-vote prevention, non-editable voter registries once live, and transparent distributed ledger auditable by anyone.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#">
          <div className="brand-mark">⚡</div>
          <span>Secure<span className="accent">Vote</span></span>
        </a>
        <span>Ethereum Solidity Academic Demonstration</span>
        <span>Chain ID: 31337 (Local Hardhat)</span>
      </footer>
    </div>
  );
}
