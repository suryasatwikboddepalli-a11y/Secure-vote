import React from "react";
import { ShieldAlert, Plus, Layers, Clock, AlertTriangle, CheckCircle2, Award, Sparkles } from "lucide-react";

export default function ManageView({
  elections,
  selectedId,
  setSelectedId,
  election,
  isOwner,
  onOpenCreateModal,
  onEndElection,
  busy,
  nowTime
}) {
  const endTimestamp = election ? Number(election.endTime) : 0;
  const deadlinePassed = election ? nowTime >= endTimestamp : false;
  const isEnded = election ? Boolean(election.ended) || deadlinePassed : false;

  return (
    <div className="view-container">
      {/* Admin Status Banner */}
      <div className="card-panel admin-banner-card">
        <div className="admin-banner-left">
          <div className="admin-icon-container">
            <ShieldAlert size={28} className="text-indigo-600" />
          </div>
          <div>
            <div className="flex-gap-2 align-center">
              <h3>Election Administration Console</h3>
              <span className={`badge-pill-subtle ${isOwner ? "badge-live" : "badge-upcoming"}`}>
                {isOwner ? "OWNER PRIVILEGES ACTIVE" : "READ ONLY"}
              </span>
            </div>
            <p className="text-dim text-sm mt-1">
              {isOwner
                ? "You have full administrative authority over the SecureVoting smart contract. Create elections, configure voting windows, and certify final results."
                : "Your connected wallet is not the contract deployer. You can review administrative status but cannot execute owner functions."}
            </p>
          </div>
        </div>

        {isOwner && onOpenCreateModal && (
          <button className="btn-primary" onClick={onOpenCreateModal}>
            <Sparkles size={16} /> Deploy New Election
          </button>
        )}
      </div>

      {/* Selected Election Management Operations */}
      <div className="manage-operations-grid mt-4">
        <div className="card-panel">
          <div className="panel-header-simple">
            <div>
              <h4 className="panel-title">Manage Selected Election</h4>
              <p className="panel-subtitle">Lifecycle controls for Registry #{selectedId}</p>
            </div>
            <select
              className="vote-election-dropdown w-auto"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              {elections.map(el => (
                <option key={el.id} value={el.id}>
                  #{el.id} — {el.title}
                </option>
              ))}
            </select>
          </div>

          {election ? (
            <div className="manage-details-body mt-4">
              <div className="summary-item-card mb-3">
                <span className="summary-label">ELECTION TITLE</span>
                <strong className="text-base">{election.title}</strong>
              </div>

              <div className="form-grid-2 mb-4">
                <div className="summary-item-card">
                  <span className="summary-label">SCHEDULED START</span>
                  <span>{new Date(Number(election.startTime) * 1000).toLocaleString()}</span>
                </div>
                <div className="summary-item-card">
                  <span className="summary-label">SCHEDULED END</span>
                  <span>{new Date(Number(election.endTime) * 1000).toLocaleString()}</span>
                </div>
              </div>

              {/* End Election Action */}
              <div className="action-box-panel">
                <div className="action-box-text">
                  <strong>Conclude & Certify Election</strong>
                  <p className="text-dim text-xs">
                    Permanently emits <code>ElectionEnded</code> on the blockchain. Can only be invoked after the end date has passed.
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={onEndElection}
                  disabled={busy || !isOwner || !deadlinePassed}
                  title={!deadlinePassed ? "Deadline has not arrived yet" : "End election"}
                >
                  <Award size={16} /> Certify & End
                </button>
              </div>
            </div>
          ) : (
            <div className="text-dim text-sm text-center py-6">No election selected.</div>
          )}
        </div>

        {/* All Managed Registries Overview */}
        <div className="card-panel">
          <div className="panel-header-simple">
            <h4 className="panel-title">Contract Registries Overview</h4>
            <span className="badge-subtle">{elections.length} Total</span>
          </div>

          <div className="managed-registries-list mt-3">
            {elections.map(el => (
              <div className="managed-registry-item" key={el.id}>
                <div>
                  <strong className="block text-sm">#{el.id} {el.title}</strong>
                  <span className="text-dim text-xs">{el.candidateCount} candidates · {el.totalVotes} votes</span>
                </div>
                <span className={`status-pill pill-${el.status}`}>
                  {el.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

