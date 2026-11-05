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
  Sparkles
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

  // Ranked candidates
  const rankedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => Number(b.votes) - Number(a.votes));
  }, [candidates]);

  const topVotes = rankedCandidates.length > 0 ? Number(rankedCandidates[0].votes) : 0;
  const topCandidates = rankedCandidates.filter(c => Number(c.votes) === topVotes);
  const isTie = topCandidates.length > 1;
  const leader = topCandidates[0] || null;

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
          {/* Winner / Leader Spotlight Header */}
          <div className="card-panel results-summary-hero">
            <div className="panel-header-flex">
              <div className="badge-group">
                <span className={`status-pill pill-${ended ? "ended" : started ? "live" : "upcoming"}`}>
                  {ended ? "FINAL CERTIFIED AUDIT" : started ? "● LIVE IN-PROGRESS TALLY" : "PRE-ELECTION"}
                </span>
                <span className="card-id-tag">Registry #{selectedId}</span>
              </div>
              <span className="text-dim text-xs font-mono">
                Total Ballots Recorded: <strong>{totalVotes}</strong>
              </span>
            </div>

            <h2 className="results-election-title">{election.title}</h2>

            {/* Official Outcome Banner */}
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
                  <span>ON-CHAIN VERIFIED</span>
                </div>
              </div>
            ) : started ? (
              <div className="leader-announcement-card">
                <div className="leader-star-avatar">⚡</div>
                <div className="winner-details">
                  <span className="leader-tag">CURRENT RACE LEADER</span>
                  <h3 className="winner-name">
                    {totalVotes === 0
                      ? "Polls are open — Waiting for initial ballots"
                      : isTie
                      ? `Tied for 1st: ${topCandidates.map(c => c.name).join(" & ")}`
                      : `${leader?.name}`}
                  </h3>
                  {totalVotes > 0 && (
                    <p className="winner-sub">
                      Currently holding <strong>{leader?.votes} votes</strong> (
                      {((Number(leader?.votes) / totalVotes) * 100).toFixed(1)}% share)
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="upcoming-announcement-card">
                <Clock size={24} className="text-cyan-600" />
                <div>
                  <strong>Election Scheduled</strong>
                  <p className="text-dim text-xs m-0">Voting has not yet opened for this election.</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Breakdown Grid: Bar Distribution & Candidate List */}
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
                      className={`ranked-candidate-row ${isWinning ? "row-winner" : isFirst && started ? "row-leader" : ""}`}
                    >
                      <div className="candidate-rank-badge">
                        {isWinning ? "🏆" : isFirst && started ? "⚡" : `#${index + 1}`}
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
                            className={`progress-bar-fill ${isWinning ? "fill-gold" : isFirst && started ? "fill-emerald" : "fill-indigo"}`}
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
                  Every vote is signed by the voter's private key and stored on an immutable ledger. No central authority can alter historical votes.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card-panel empty-state-panel">
          <h3>No Election Selected</h3>
          <p className="text-dim text-sm">Select an election above to view the results audit.</p>
        </div>
      )}
    </div>
  );
}
