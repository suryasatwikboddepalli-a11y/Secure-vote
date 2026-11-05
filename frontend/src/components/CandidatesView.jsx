import React, { useState } from "react";
import { Users2, ExternalLink, Plus, Layers, Sparkles, CheckCircle2 } from "lucide-react";

export default function CandidatesView({
  elections,
  selectedId,
  setSelectedId,
  election,
  candidates,
  isOwner,
  onAddCandidate,
  busy,
  nowTime
}) {
  const [candidateName, setCandidateName] = useState("");
  const [manifestoCID, setManifestoCID] = useState("");

  const startTimestamp = election ? Number(election.startTime) : 0;
  const started = election ? nowTime >= startTimestamp : false;

  const handleSubmit = e => {
    e.preventDefault();
    if (!candidateName.trim()) return;
    onAddCandidate(candidateName.trim(), manifestoCID.trim());
    setCandidateName("");
    setManifestoCID("");
  };

  return (
    <div className="view-container">
      {/* Selector */}
      <div className="vote-election-selector-card card-panel">
        <div className="selector-label-group">
          <Layers size={16} className="text-indigo-600" />
          <span className="selector-label">SELECT ELECTION CANDIDATE ROSTER:</span>
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

      <div className="candidates-layout-grid">
        {/* Candidates List */}
        <div className="candidates-list-column">
          <div className="flex-between align-center mb-3">
            <div>
              <h3 className="section-title">Nominated Candidates</h3>
              <p className="text-dim text-xs">Official candidates for {election?.title || "Selected Election"}</p>
            </div>
            <span className="badge-subtle">{candidates.length} Nominees</span>
          </div>

          {candidates.length === 0 ? (
            <div className="card-panel empty-state-panel">
              <Users2 size={36} className="text-dim mb-3" />
              <h4>No candidates nominated yet</h4>
              <p className="text-dim text-sm">
                The administrator can nominate candidates using the form before voting starts.
              </p>
            </div>
          ) : (
            <div className="candidate-roster-grid">
              {candidates.map((cand, idx) => (
                <div className="card-panel candidate-roster-card" key={cand.id}>
                  <div className="roster-avatar">
                    {cand.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="roster-info">
                    <span className="roster-id-badge">CANDIDATE #{cand.id}</span>
                    <h4 className="roster-name">{cand.name}</h4>
                    {cand.cid ? (
                      <a
                        className="manifesto-link-btn"
                        href={`https://ipfs.io/ipfs/${encodeURIComponent(cand.cid)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>View Manifesto (IPFS)</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-dim text-xs">Standard Nominee</span>
                    )}
                  </div>
                  <div className="roster-votes-box">
                    <span className="text-dim text-xs">Votes</span>
                    <strong className="text-lg">{cand.votes}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Quick Nomination Sidebar */}
        {isOwner && (
          <div className="candidates-admin-column">
            <div className="card-panel admin-action-card">
              <div className="panel-header-simple">
                <h4 className="panel-title">Nominate Candidate</h4>
                <span className="badge-subtle">Admin Only</span>
              </div>
              <p className="text-dim text-xs mb-3">
                Add a new candidate to <strong>#{selectedId} {election?.title}</strong>. Must be done before start time.
              </p>

              {started ? (
                <div className="warning-callout">
                  <span>⚠️</span>
                  <p>This election has already started. Candidate nominations are locked.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="admin-form-compact">
                  <label className="form-label">
                    <span>Candidate Name <strong className="text-rose-500">*</strong></span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. David Williams"
                      value={candidateName}
                      onChange={e => setCandidateName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="form-label">
                    <span>Manifesto IPFS CID (Optional)</span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="bafybeic..."
                      value={manifestoCID}
                      onChange={e => setManifestoCID(e.target.value)}
                    />
                  </label>

                  <button className="btn-primary w-full mt-2" disabled={busy || !candidateName.trim()}>
                    <Plus size={16} /> Add Candidate
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
