import React from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, X, Loader2, ArrowRight } from "lucide-react";

export default function VoteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  election,
  candidate,
  account,
  busy
}) {
  if (!isOpen || !candidate) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal-container" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <ShieldAlert size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3>Confirm Your Vote</h3>
              <p>Please review your selection before signing with MetaMask</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={busy} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Election Card */}
          <div className="summary-item-card">
            <span className="summary-label">ELECTION</span>
            <div className="summary-value-row">
              <strong>{election?.title || "Active Election"}</strong>
              <span className="badge-subtle">ID #{election?.id}</span>
            </div>
          </div>

          {/* Chosen Candidate Card */}
          <div className="summary-candidate-card">
            <span className="summary-label">SELECTED CANDIDATE</span>
            <div className="candidate-choice-preview">
              <div className="choice-avatar">
                {candidate.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="choice-details">
                <span className="choice-name">{candidate.name}</span>
                <span className="choice-meta">Candidate ID #{candidate.id}</span>
              </div>
              <span className="choice-verified-badge">
                <CheckCircle2 size={16} className="text-emerald-600" /> Selected
              </span>
            </div>
          </div>

          {/* Voter Wallet Address */}
          <div className="summary-item-card">
            <span className="summary-label">SIGNING WALLET (VOTER)</span>
            <span className="summary-address-text">{account}</span>
          </div>

          {/* Blockchain Finality Warning Callout */}
          <div className="blockchain-warning-callout">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="callout-text">
              <strong>Permanent Blockchain Commitment</strong>
              <p>
                Casting this vote generates a cryptographically signed transaction. Once confirmed on the Ethereum network, your vote is irreversible and cannot be changed or submitted again.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Confirming in MetaMask…</span>
              </>
            ) : (
              <>
                <span>Sign & Cast Vote</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

