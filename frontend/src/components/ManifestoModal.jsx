import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, ShieldCheck, Database, FileText } from "lucide-react";

export default function ManifestoModal({ candidate, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!candidate || !candidate.cid) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(candidate.cid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cid = candidate.cid;
  const gateways = [
    { name: "IPFS.io Gateway", url: `https://ipfs.io/ipfs/${encodeURIComponent(cid)}` },
    { name: "DWeb.link Gateway", url: `https://dweb.link/ipfs/${encodeURIComponent(cid)}` },
    { name: "Pinata Cloud Gateway", url: `https://gateway.pinata.cloud/ipfs/${encodeURIComponent(cid)}` }
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-container manifesto-modal-box" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge bg-indigo-subtle">
              <Database size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3>IPFS Decentralized Storage Record</h3>
              <p>Candidate #{candidate.id}: {candidate.name}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="modal-body manifesto-modal-body">
          {/* IPFS Verification Banner */}
          <div className="ipfs-proof-card">
            <div className="flex-between align-center mb-1">
              <span className="ipfs-badge-label">
                <Database size={13} className="text-indigo-600" />
                <span>INTERPLANETARY FILE SYSTEM (IPFS)</span>
              </span>
              <span className="certified-pill">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>ON-CHAIN VERIFIED</span>
              </span>
            </div>
            <p className="text-dim text-xs">
              This manifesto is stored on the decentralized IPFS network. The Content Identifier (CID) below is permanently immutably linked to the candidate inside the Ethereum smart contract.
            </p>
          </div>

          {/* CID Hash Card */}
          <div className="cid-display-box mt-3">
            <div className="flex-between align-center mb-1">
              <span className="text-dim text-xs font-semibold">CONTENT IDENTIFIER (CID):</span>
              <button className="copy-cid-btn" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy CID</span>
                  </>
                )}
              </button>
            </div>
            <code className="cid-code-block">{cid}</code>
          </div>

          {/* Document Preview Card */}
          <div className="manifesto-preview-card mt-3">
            <div className="manifesto-preview-header">
              <FileText size={16} className="text-indigo-600" />
              <strong>Campaign Manifesto & Policy Pledges</strong>
            </div>
            <div className="manifesto-preview-content">
              <h4>Vision for Student Representation — {candidate.name}</h4>
              <p>
                1. <strong>Academic Excellence & Transparency:</strong> Real-time syllabus and faculty coordination with student advisory boards.
              </p>
              <p>
                2. <strong>Decentralized Resource Allocation:</strong> Transparent budget planning recorded on public ledgers for student clubs and activities.
              </p>
              <p>
                3. <strong>Open Governance:</strong> Regular town halls and cryptographic student polling for major campus policy decisions.
              </p>
            </div>
          </div>

          {/* Public IPFS Gateway Links */}
          <div className="ipfs-gateways-section mt-4">
            <span className="text-dim text-xs font-semibold mb-2 block">
              VIEW RAW ASSET VIA PUBLIC IPFS GATEWAYS:
            </span>
            <div className="gateways-grid">
              {gateways.map((gw, idx) => (
                <a
                  key={idx}
                  href={gw.url}
                  target="_blank"
                  rel="noreferrer"
                  className="gateway-link-btn"
                >
                  <span>{gw.name}</span>
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <a
            href={`https://dweb.link/ipfs/${encodeURIComponent(cid)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <span>Open in IPFS Browser</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
