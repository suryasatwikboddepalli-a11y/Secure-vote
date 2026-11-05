import React, { useState } from "react";
import {
  Vote,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronDown,
  Layers,
  ArrowRight
} from "lucide-react";

export default function VoteView({
  elections,
  selectedId,
  setSelectedId,
  election,
  candidates,
  registered,
  voted,
  nowTime,
  account,
  onConnect,
  onOpenConfirmationModal
}) {
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // Time calculations
  const startTimestamp = election ? Number(election.startTime) : 0;
  const endTimestamp = election ? Number(election.endTime) : 0;
  const ended = election ? Boolean(election.ended) || nowTime >= endTimestamp : false;
  const started = election ? (Boolean(election.started) || nowTime >= startTimestamp) && !ended : false;
  const upcoming = election ? !started && !ended : false;

  const formatCountdown = diff => {
    if (diff <= 0) return "00h 00m 00s";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  };

  const selectedCandidateObj = candidates.find(c => c.id === selectedCandidateId);

  const handleSelectCandidate = candId => {
    if (!started || ended || !registered || voted) return;
    setSelectedCandidateId(candId);
  };

  const handleReviewVote = () => {
    if (!selectedCandidateObj) return;
    onOpenConfirmationModal(selectedCandidateObj);
  };

  return (
    <div className="view-container">
      {/* Election Selector Pill Bar */}
      <div className="vote-election-selector-card card-panel">
        <div className="selector-label-group">
          <Layers size={16} className="text-indigo-600" />
          <span className="selector-label">SELECT ACTIVE ELECTION:</span>
        </div>
        <select
          className="vote-election-dropdown"
          value={selectedId}
          onChange={e => {
            setSelectedId(e.target.value);
            setSelectedCandidateId(null);
          }}
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
          {/* Header Banner: Election Details and Countdown */}
          <div className="card-panel vote-hero-banner">
            <div className="vote-hero-header">
              <div className="badge-group">
                <span className={`status-pill pill-${ended ? "ended" : started ? "live" : "upcoming"}`}>
                  {ended ? "COMPLETED" : started ? "● VOTING IN PROGRESS" : "UPCOMING"}
                </span>
                <span className="card-id-tag">Registry #{selectedId}</span>
              </div>

              {started && (
                <div className="countdown-pill">
                  <Clock size={14} className="text-emerald-600" />
                  <span className="countdown-title">POLL CLOSES IN:</span>
                  <strong className="countdown-clock">{formatCountdown(endTimestamp - nowTime)}</strong>
                </div>
              )}
              {upcoming && (
                <div className="countdown-pill countdown-pill-upcoming">
                  <Clock size={14} className="text-cyan-600" />
                  <span className="countdown-title">VOTING OPENS IN:</span>
                  <strong className="countdown-clock">{formatCountdown(startTimestamp - nowTime)}</strong>
                </div>
              )}
            </div>

            <h2 className="vote-election-title">{election.title}</h2>
            <p className="vote-election-subtitle">
              Choose your candidate below. Only registered Ethereum wallet addresses are authorized to cast a vote. All ballots are immutable and transparently verified on-chain.
            </p>

            {/* Voter Eligibility Status Callout */}
            {!account ? (
              <div className="voter-status-banner banner-warning">
                <AlertCircle size={20} className="text-amber-600 shrink-0" />
                <div className="banner-content">
                  <strong>Wallet Not Connected</strong>
                  <span>Please connect your MetaMask wallet to verify your voter registration.</span>
                </div>
                <button className="btn-primary btn-small ml-auto" onClick={onConnect}>
                  Connect MetaMask
                </button>
              </div>
            ) : voted ? (
              <div className="voter-status-banner banner-success">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div className="banner-content">
                  <strong>Ballot Successfully Cast & Verified</strong>
                  <span>Your vote is officially confirmed and recorded on the Ethereum blockchain for this election.</span>
                </div>
              </div>
            ) : !registered ? (
              <div className="voter-status-banner banner-danger">
                <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                <div className="banner-content">
                  <strong>Wallet Address Not Registered</strong>
                  <span>
                    Your connected wallet (<code>{account.slice(0, 6)}…{account.slice(-4)}</code>) is not registered for this election. Contact the election administrator to register before voting begins.
                  </span>
                </div>
              </div>
            ) : ended ? (
              <div className="voter-status-banner banner-neutral">
                <Clock size={20} className="text-dim shrink-0" />
                <div className="banner-content">
                  <strong>Election Has Concluded</strong>
                  <span>The voting period for this election has ended. Check the Results tab to view the certified tally.</span>
                </div>
              </div>
            ) : !started ? (
              <div className="voter-status-banner banner-info">
                <Clock size={20} className="text-cyan-600 shrink-0" />
                <div className="banner-content">
                  <strong>Voting Not Open Yet</strong>
                  <span>You are a registered voter! The ballot will unlock automatically when the start time is reached.</span>
                </div>
              </div>
            ) : (
              <div className="voter-status-banner banner-eligible">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                <div className="banner-content">
                  <strong>You Are Eligible to Vote</strong>
                  <span>Your wallet is verified as an active, registered voter. Select your preferred candidate below.</span>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Selection Roster */}
          <div className="voting-candidates-section">
            <div className="flex-between align-center mb-4">
              <div>
                <h3 className="section-title">Official Ballot Candidates</h3>
                <p className="text-dim text-xs">Click a candidate card to select your vote</p>
              </div>
              <span className="badge-subtle">{candidates.length} Nominated</span>
            </div>

            {candidates.length === 0 ? (
              <div className="card-panel empty-state-panel">
                <h3>No candidates registered for this election</h3>
                <p className="text-dim text-sm">The administrator has not added any candidates yet.</p>
              </div>
            ) : (
              <div className="candidate-ballot-grid">
                {candidates.map((cand, idx) => {
                  const isSelected = selectedCandidateId === cand.id;
                  const canSelect = started && !ended && registered && !voted;

                  return (
                    <div
                      key={cand.id}
                      className={`candidate-ballot-card ${isSelected ? "ballot-card-selected" : ""} ${!canSelect ? "ballot-card-disabled" : ""}`}
                      onClick={() => handleSelectCandidate(cand.id)}
                    >
                      <div className="ballot-card-top">
                        <div className="ballot-avatar">
                          {cand.name.slice(0, 1).toUpperCase()}
                        </div>

                        {/* Radio Selection Indicator */}
                        <div className={`ballot-radio ${isSelected ? "radio-checked" : ""}`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                      </div>

                      <div className="ballot-candidate-info">
                        <span className="ballot-number-tag">CANDIDATE #{cand.id}</span>
                        <h4 className="ballot-candidate-name">{cand.name}</h4>

                        {cand.cid ? (
                          <a
                            className="manifesto-link-btn"
                            href={`https://ipfs.io/ipfs/${encodeURIComponent(cand.cid)}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                          >
                            <span>Read Manifesto on IPFS</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-dim text-xs">Official Nominee</span>
                        )}
                      </div>

                      <div className="ballot-card-footer">
                        {voted ? (
                          <span className="text-dim text-xs">Ballots locked</span>
                        ) : isSelected ? (
                          <span className="selection-active-label">✓ Selected</span>
                        ) : canSelect ? (
                          <span className="selection-hint-label">Click to select</span>
                        ) : (
                          <span className="selection-disabled-label">Unavailable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating or Bottom Sticky Review Button */}
          {started && !ended && registered && !voted && (
            <div className="card-panel review-vote-bar">
              <div className="review-bar-info">
                {selectedCandidateObj ? (
                  <>
                    <span className="text-dim text-xs">Selected Candidate:</span>
                    <strong className="text-indigo-600 text-base">{selectedCandidateObj.name}</strong>
                  </>
                ) : (
                  <span className="text-dim text-sm">Please select a candidate from the ballot above to proceed.</span>
                )}
              </div>

              <button
                className="btn-primary btn-large"
                disabled={!selectedCandidateObj}
                onClick={handleReviewVote}
              >
                <span>Review & Cast Ballot</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card-panel empty-state-panel">
          <h3>No Election Selected</h3>
          <p className="text-dim text-sm">Please select an election from the dropdown above.</p>
        </div>
      )}
    </div>
  );
}

