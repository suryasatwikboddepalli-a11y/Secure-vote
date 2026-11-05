import React, { useMemo } from "react";
import {
  Award,
  Layers,
  Vote,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Lock,
  EyeOff
} from "lucide-react";

export default function ResultsView({
  elections,
  selectedId,
  setSelectedId,
  election,
  candidates,
  nowTime
}) {
  const startTimestamp = election ? Number(election.startTime) : 0;
  const endTimestamp = election ? Number(election.endTime) : 0;
  const ended = election ? Boolean(election.ended) || nowTime >= endTimestamp : false;
  const started = election ? (Boolean(election.started) || nowTime >= startTimestamp) && !ended : false;

  const totalVotes = candidates.reduce((sum, c) => sum + Number(c.votes), 0);

  // Ranked candidates (calculated only when ended)
  const rankedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => Number(b.votes) - Number(a.votes));
  }, [candidates]);

  const topVotes = rankedCandidates.length > 0 ? Number(rankedCandidates[0].votes) : 0;
  const topCandidates = rankedCandidates.filter(c => Number(c.votes) === topVotes);
  const isTie = topCandidates.length > 1;
  const leader = topCandidates[0] || null;

  const formatCountdown = diff => {
    if (diff <= 0) return "00h 00m 00s";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  };

  return (
    <div className="view-container">
      {/* Election Selector Pill Bar */}
      <div className="vote-election-selector-card card-panel">
        <div className="selector-label-group">
          <Layers size={16} className="text-indigo-600" />
          <span className="selector-label">SELECT ELECTION FOR RESULTS AUDIT:</span>
        </div>
        <select
          className="vote-election-dropdown"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {elections.map(el => (
            <option key={el.id} value={el.id}>
              #{el.id} — {el.title} ({el.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {election ? (
        <>
          {/* Main Results / Integrity Header */}
          <div className="card-panel results-summary-hero">
            <div className="panel-header-flex">
              <div className="badge-group">
                <span className={`status-pill pill-${ended ? "ended" : started ? "live" : "upcoming"}`}>
                  {ended ? "FINAL CERTIFIED AUDIT" : started ? "● VOTING IN PROGRESS" : "UPCOMING"}
                </span>
                <span className="card-id-tag">Registry #{selectedId}</span>
              </div>
              <span className="text-dim text-xs font-mono">
                Total Ballots Cast: <strong>{totalVotes}</strong>
              </span>
            </div>

            <h2 className="results-election-title">{election.title}</h2>

            {/* IF ELECTION IS COMPLETED: Reveal Official Winner & Certified Results */}
            {ended ? (
              <div className="winner-announcement-card">
                <div className="winner-trophy-avatar">🏆</div>
                <div className="winner-details">
                  <span className="winner-tag">OFFICIAL ELECTED WINNER</span>
                  <h3 className="winner-name">
                    {totalVotes === 0
                      ? "Election concluded with 0 votes cast"
                      : isTie
                      ? `Tied Victory: ${topCandidates.map(c => c.name).join(" & ")}`
                      : leader?.name}
                  </h3>
                  {totalVotes > 0 && !isTie && (
                    <p className="winner-sub">
                      Secured <strong>{leader?.votes} votes</strong> (
                      {((Number(leader?.votes) / totalVotes) * 100).toFixed(1)}% of total vote share)
                    </p>
                  )}
                </div>
                <div className="certified-stamp">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span>ON-CHAIN CERTIFIED</span>
                </div>
              </div>
            ) : (
              /* IF ELECTION IS ONGOING OR UPCOMING: Keep Results Strictly Sealed */
              <div className="results-sealed-card">
                <div className="sealed-icon-box">
                  <Lock size={26} className="text-amber-600" />
                </div>
                <div className="sealed-content">
                  <div className="flex-gap-2 align-center mb-1">
                    <span className="sealed-tag">ELECTION INTEGRITY PROTOCOL</span>
                    <span className="sealed-pill">BALLOTS SEALED</span>
                  </div>
                  <h3 className="sealed-title">Leaderboard is sealed while voting is active</h3>
                  <p className="sealed-desc">
                    To prevent voter bias, bandwagon effects, and election influence, individual candidate vote counts and rankings remain confidential until the poll closes on{" "}
                    <strong>{new Date(endTimestamp * 1000).toLocaleString()}</strong>.
                  </p>
                  <div className="sealed-meta-row mt-3">
                    <span className="countdown-pill">
                      <Clock size={14} className="text-emerald-600" />
                      <span>Polls close in: <strong>{formatCountdown(endTimestamp - nowTime)}</strong></span>
                    </span>
                    <span className="text-dim text-xs font-mono">
                      Turnout: <strong>{totalVotes} verified ballots</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Section: Shown only when Ended, else Nominee List without Counts */}
          {ended ? (
            <div className="results-data-grid">
              {/* Candidate Standings Table / List */}
              <div className="card-panel">
                <div className="panel-header-simple">
                  <h4 className="panel-title">Certified Candidate Standings</h4>
                  <span className="badge-subtle">{candidates.length} Contenders</span>
                </div>

                <div className="ranked-candidates-list">
                  {rankedCandidates.map((cand, index) => {
                    const voteNum = Number(cand.votes);
                    const pct = totalVotes > 0 ? ((voteNum / totalVotes) * 100).toFixed(1) : "0.0";
                    const isFirst = index === 0 && voteNum > 0;
                    const isWinning = ended && isFirst && !isTie;

                    return (
                      <div
                        key={cand.id}
                        className={`ranked-candidate-row ${isWinning ? "row-winner" : ""}`}
                      >
                        <div className="candidate-rank-badge">
                          {isWinning ? "🏆" : `#${index + 1}`}
                        </div>

                        <div className="ranked-candidate-info">
                          <div className="flex-between align-center mb-1">
                            <strong className="cand-name">{cand.name}</strong>
                            <span className="cand-votes-text">
                              <strong>{cand.votes}</strong> votes ({pct}%)
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="progress-bar-track">
                            <div
                              className={`progress-bar-fill ${isWinning ? "fill-gold" : "fill-indigo"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit & Statistics Overview Card */}
              <div className="card-panel">
                <div className="panel-header-simple">
                  <h4 className="panel-title">Cryptographic Audit Trail</h4>
                  <span className="badge-subtle">Smart Contract</span>
                </div>

                <div className="audit-details-list">
                  <div className="audit-item">
                    <span className="audit-label">Smart Contract Address</span>
                    <span className="audit-value font-mono text-xs">
                      0x5FbDB2315678afecb367f032d93F642f64180aa3
                    </span>
                  </div>

                  <div className="audit-item">
                    <span className="audit-label">Consensus Network</span>
                    <span className="audit-value">Hardhat Local (EVM Chain ID 31337)</span>
                  </div>

                  <div className="audit-item">
                    <span className="audit-label">Voting Schedule</span>
                    <span className="audit-value text-xs">
                      {new Date(startTimestamp * 1000).toLocaleString()} –{" "}
                      {new Date(endTimestamp * 1000).toLocaleString()}
                    </span>
                  </div>

                  <div className="audit-item">
                    <span className="audit-label">Double-Vote Prevention</span>
                    <span className="audit-value text-emerald-600 font-semibold flex-gap-1">
                      <CheckCircle2 size={14} /> Enforced by EVM State
                    </span>
                  </div>
                </div>

                <div className="info-callout mt-4">
                  <span>🛡️</span>
                  <p>
                    Every vote was signed by the voter's private key and confirmed on the blockchain. The results are permanently auditable and immutable.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* WHILE VOTING IS IN PROGRESS: Show Nominees with Sealed Indicators */
            <div className="results-data-grid">
              <div className="card-panel">
                <div className="panel-header-simple">
                  <h4 className="panel-title">Official Election Contenders</h4>
                  <span className="badge-subtle">Secret Ballot</span>
                </div>
                <p className="text-dim text-xs mb-3">
                  Votes are being securely tallied by the smart contract. Standings will be computed immediately after polls close.
                </p>

                <div className="ranked-candidates-list">
                  {candidates.map((cand, idx) => (
                    <div className="ranked-candidate-row" key={cand.id}>
                      <div className="candidate-avatar-small">
                        {cand.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <strong className="cand-name">{cand.name}</strong>
                        <span className="text-dim text-xs block">Candidate ID #{cand.id}</span>
                      </div>
                      <div className="sealed-tally-pill">
                        <Lock size={12} className="text-amber-600" />
                        <span>Sealed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-panel">
                <div className="panel-header-simple">
                  <h4 className="panel-title">Election Safeguards</h4>
                  <span className="badge-subtle">Anti-Bias Policy</span>
                </div>

                <div className="sealed-safeguards-box">
                  <EyeOff size={28} className="text-indigo-600 mb-2" />
                  <strong>Why are results hidden during elections?</strong>
                  <p className="text-dim text-xs leading-relaxed mt-2">
                    In democratic voting systems, releasing ongoing poll tallies influences voter behavior through bandwagon and strategic voting effects. SecureVote preserves independent choice by locking leaderboard displays until the voting window ends.
                  </p>
                </div>

                <div className="info-callout mt-4">
                  <span>ℹ️</span>
                  <p>
                    Once the clock passes the deadline, refresh this page to inspect the official winner and certified vote distribution.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card-panel empty-state-panel">
          <h3>No Election Selected</h3>
          <p className="text-dim text-sm">Select an election above to view results.</p>
        </div>
      )}
    </div>
  );
}
