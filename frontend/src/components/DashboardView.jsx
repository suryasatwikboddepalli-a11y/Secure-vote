import React from "react";
import {
  Layers,
  Vote,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Lock
} from "lucide-react";

export default function DashboardView({
  elections,
  selectedElection,
  candidates,
  totalVotesAll,
  nowTime,
  account,
  registered,
  voted,
  isOwner,
  onNavigate,
  onOpenCreateModal
}) {
  const activeElections = elections.filter(e => e.status === "live");
  const completedElections = elections.filter(e => e.status === "ended");
  const upcomingElections = elections.filter(e => e.status === "upcoming");

  // Leader in selected/active election
  const sortedCandidates = [...candidates].sort((a, b) => Number(b.votes) - Number(a.votes));
  const leader = sortedCandidates[0] || null;
  const currentElectionVotes = candidates.reduce((s, c) => s + Number(c.votes), 0);

  // Time remaining format
  const formatTimeLeft = endTimestamp => {
    const diff = endTimestamp - nowTime;
    if (diff <= 0) return "Voting Concluded";
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  };

  return (
    <div className="view-container">
      {/* 4 Summary Stats Cards */}
      <section className="stats-metric-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TOTAL ELECTIONS</span>
            <div className="metric-icon-box bg-indigo-subtle">
              <Layers size={18} className="text-indigo-600" />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-number">{elections.length}</strong>
            <span className="metric-subtext">On-chain registries</span>
          </div>
          <div className="metric-footer">
            <span className="text-dim text-xs">{activeElections.length} active · {completedElections.length} ended</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">ACTIVE ELECTIONS</span>
            <div className="metric-icon-box bg-emerald-subtle">
              <Vote size={18} className="text-emerald-600" />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-number text-emerald-600">{activeElections.length}</strong>
            <span className="metric-badge-live">● LIVE NOW</span>
          </div>
          <div className="metric-footer">
            <span className="text-dim text-xs">{upcomingElections.length} scheduled to open</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">TOTAL VOTES RECORDED</span>
            <div className="metric-icon-box bg-blue-subtle">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-number">{totalVotesAll}</strong>
            <span className="metric-subtext">Verified ballots</span>
          </div>
          <div className="metric-footer">
            <span className="text-dim text-xs">Publicly verifiable on EVM</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">YOUR STATUS</span>
            <div className="metric-icon-box bg-amber-subtle">
              <ShieldCheck size={18} className="text-amber-600" />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-number text-base">
              {!account ? "Disconnected" : voted ? "Voted ✓" : registered ? "Eligible" : "Unregistered"}
            </strong>
          </div>
          <div className="metric-footer">
            <span className="text-dim text-xs">
              {isOwner ? "Contract Administrator" : "Standard Voter Account"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Two-Column Layout */}
      <div className="dashboard-layout-grid">
        {/* Left Column: Spotlight & Participation Chart */}
        <div className="dashboard-col-left">
          {/* Active / Featured Election Hero Card */}
          {selectedElection ? (
            <div className="card-panel hero-election-panel">
              <div className="panel-header-flex">
                <div className="badge-group">
                  <span className={`status-pill pill-${selectedElection.status}`}>
                    {selectedElection.status === "live"
                      ? "● VOTING IN PROGRESS"
                      : selectedElection.status === "ended"
                      ? "COMPLETED"
                      : "UPCOMING"}
                  </span>
                  <span className="text-dim text-xs font-mono">Registry #{selectedElection.id}</span>
                </div>
                {selectedElection.status === "live" && (
                  <span className="live-clock-badge">
                    <Clock size={13} /> {formatTimeLeft(selectedElection.endTime)}
                  </span>
                )}
              </div>

              <div className="hero-election-body">
                <h3 className="hero-election-title">{selectedElection.title}</h3>
                <p className="hero-election-desc">
                  {selectedElection.status === "live"
                    ? "Polls are open. Qualified registered voters can review candidate manifestos and cast their cryptographically verifiable vote."
                    : selectedElection.status === "ended"
                    ? "Voting has officially concluded. Final results and audit counts are locked on the blockchain."
                    : "Pre-election nomination period. Candidates and voters are being registered prior to poll opening."}
                </p>

                {/* Winner Card (strictly when election has ended) OR Anti-Bias Sealed Notice during Live Poll */}
                {selectedElection.status === "ended" && leader && currentElectionVotes > 0 ? (
                  <div className="leader-highlight-card winner-card">
                    <div className="leader-avatar">🏆</div>
                    <div className="leader-info">
                      <span className="leader-title-tag">OFFICIAL ELECTED WINNER</span>
                      <strong className="leader-name">{leader.name}</strong>
                    </div>
                    <div className="leader-score">
                      <strong>{leader.votes} votes</strong>
                      <span>({((Number(leader.votes) / currentElectionVotes) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ) : selectedElection.status === "live" ? (
                  <div className="anti-bias-notice-card">
                    <div className="anti-bias-icon-box">
                      <Lock size={18} className="text-amber-600" />
                    </div>
                    <div className="anti-bias-info">
                      <div className="flex-gap-2 align-center mb-0.5">
                        <span className="anti-bias-tag">ELECTION INTEGRITY</span>
                        <span className="sealed-pill">BALLOTS SEALED</span>
                      </div>
                      <strong className="anti-bias-heading">Candidate Standings Sealed Until Poll Closes</strong>
                      <p className="anti-bias-sub">
                        To guarantee impartiality and prevent voter influence, individual vote counts and the leaderboard remain confidential until voting finishes.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Progress bar */}
                <div className="hero-progress-section">
                  <div className="flex-between text-xs mb-1">
                    <span className="text-dim">Ballots Cast in this Poll:</span>
                    <strong>{currentElectionVotes} votes</strong>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, currentElectionVotes * 20)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="panel-footer-flex">
                <button
                  className="btn-primary"
                  onClick={() => onNavigate("vote")}
                >
                  <Vote size={16} />
                  <span>{voted ? "View Your Vote Status" : "Go to Voting Booth"}</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => onNavigate("results")}
                >
                  View Full Tally
                </button>
              </div>
            </div>
          ) : (
            <div className="card-panel empty-dashboard-card">
              <Layers size={36} className="text-dim mb-3" />
              <h3>No Elections Registered</h3>
              <p className="text-dim text-sm max-w-sm mb-4">
                Deploy your first blockchain election to begin accepting decentralized ballots.
              </p>
              {isOwner && (
                <button className="btn-primary" onClick={onOpenCreateModal}>
                  <Sparkles size={16} /> Create Election
                </button>
              )}
            </div>
          )}

          {/* Participation Bar Chart Card */}
          <div className="card-panel">
            <div className="panel-header-simple">
              <div>
                <h4 className="panel-title">Election Participation Overview</h4>
                <p className="panel-subtitle">Audited vote volume across all registered smart-contract elections</p>
              </div>
              <span className="badge-subtle">EVM Data</span>
            </div>

            <div className="participation-chart-container">
              {elections.length === 0 ? (
                <div className="text-center py-6 text-dim text-sm">No election data to display</div>
              ) : (
                <div className="svg-chart-wrapper">
                  {elections.map((el, idx) => {
                    const votes = Number(el.totalVotes) || 0;
                    const maxVotes = Math.max(...elections.map(e => Number(e.totalVotes) || 0), 5);
                    const barHeightPct = Math.max(12, (votes / maxVotes) * 100);

                    return (
                      <div className="chart-bar-column" key={el.id}>
                        <div className="chart-bar-tooltip">
                          <strong>{el.title}</strong>
                          <span>{votes} {votes === 1 ? "vote" : "votes"}</span>
                        </div>
                        <div className="chart-bar-track">
                          <div
                            className={`chart-bar-fill ${el.status === "live" ? "fill-live" : el.status === "ended" ? "fill-ended" : "fill-upcoming"}`}
                            style={{ height: `${barHeightPct}%` }}
                          />
                        </div>
                        <span className="chart-bar-label">#{el.id}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Elections & Quick Actions */}
        <div className="dashboard-col-right">
          {/* Quick Actions Card */}
          <div className="card-panel quick-actions-panel">
            <h4 className="panel-title mb-3">Quick Navigation</h4>
            <div className="quick-actions-list">
              <button className="quick-action-btn" onClick={() => onNavigate("elections")}>
                <div className="qa-icon bg-indigo-subtle">
                  <Layers size={16} className="text-indigo-600" />
                </div>
                <div className="qa-text">
                  <strong>Browse All Elections</strong>
                  <span>Filter by active, completed, and upcoming</span>
                </div>
                <ArrowRight size={14} className="qa-arrow" />
              </button>

              <button className="quick-action-btn" onClick={() => onNavigate("vote")}>
                <div className="qa-icon bg-emerald-subtle">
                  <Vote size={16} className="text-emerald-600" />
                </div>
                <div className="qa-text">
                  <strong>Vote in Active Election</strong>
                  <span>Sign and submit ballot with MetaMask</span>
                </div>
                <ArrowRight size={14} className="qa-arrow" />
              </button>

              <button className="quick-action-btn" onClick={() => onNavigate("results")}>
                <div className="qa-icon bg-blue-subtle">
                  <Award size={16} className="text-blue-600" />
                </div>
                <div className="qa-text">
                  <strong>Inspect Certified Results</strong>
                  <span>View winners and vote count breakdown</span>
                </div>
                <ArrowRight size={14} className="qa-arrow" />
              </button>

              {isOwner && (
                <button className="quick-action-btn" onClick={onOpenCreateModal}>
                  <div className="qa-icon bg-amber-subtle">
                    <Sparkles size={16} className="text-amber-600" />
                  </div>
                  <div className="qa-text">
                    <strong>Launch New Election</strong>
                    <span>Deploy election onto smart contract</span>
                  </div>
                  <ArrowRight size={14} className="qa-arrow" />
                </button>
              )}
            </div>
          </div>

          {/* Recent Registries List */}
          <div className="card-panel">
            <div className="panel-header-simple">
              <h4 className="panel-title">Recent Elections</h4>
              <button className="btn-text-link" onClick={() => onNavigate("elections")}>
                View All
              </button>
            </div>

            <div className="recent-elections-list">
              {elections.slice(-4).reverse().map(e => (
                <div className="recent-election-item" key={e.id}>
                  <div className="recent-item-info">
                    <div className="flex-gap-2 align-center">
                      <span className={`status-dot dot-${e.status}`} />
                      <strong className="recent-title">#{e.id} {e.title}</strong>
                    </div>
                    <span className="recent-meta">
                      {e.candidateCount} candidates · {e.totalVotes} votes
                    </span>
                  </div>
                  <span className={`badge-pill-subtle badge-${e.status}`}>
                    {e.status}
                  </span>
                </div>
              ))}
              {elections.length === 0 && (
                <span className="text-dim text-sm text-center py-4">No records found.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

