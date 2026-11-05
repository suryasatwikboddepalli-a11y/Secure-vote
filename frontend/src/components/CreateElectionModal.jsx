import React, { useState } from "react";
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Users,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";

export default function CreateElectionModal({
  isOpen,
  onClose,
  onCreate,
  busy,
  account
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [candidatesList, setCandidatesList] = useState(["Alice Johnson", "Bob Smith"]);
  const [candidateInput, setCandidateInput] = useState("");
  const [votersList, setVotersList] = useState([]);
  const [voterInput, setVoterInput] = useState("");

  if (!isOpen) return null;

  // Presets helper
  const applyPreset = (startOffsetMinutes, durationMinutes) => {
    const start = new Date(Date.now() + startOffsetMinutes * 60 * 1000);
    const end = new Date(Date.now() + (startOffsetMinutes + durationMinutes) * 60 * 1000);
    const toLocalISO = d => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };
    setStartTime(toLocalISO(start));
    setEndTime(toLocalISO(end));
  };

  const handleAddCandidate = () => {
    if (!candidateInput.trim()) return;
    setCandidatesList([...candidatesList, candidateInput.trim()]);
    setCandidateInput("");
  };

  const handleRemoveCandidate = index => {
    setCandidatesList(candidatesList.filter((_, i) => i !== index));
  };

  const handleAddVoter = addr => {
    const val = addr || voterInput.trim();
    if (!val) return;
    if (!votersList.includes(val)) {
      setVotersList([...votersList, val]);
    }
    setVoterInput("");
  };

  const handleRemoveVoter = index => {
    setVotersList(votersList.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    await onCreate({
      title,
      description,
      startTime,
      endTime,
      candidates: candidatesList,
      voters: votersList
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal-container modal-wizard-container" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Sparkles size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3>New Decentralized Election</h3>
              <p>Step {step} of 4: {step === 1 ? "Election Details" : step === 2 ? "Voting Schedule" : step === 3 ? "Candidates & Voters" : "Review & Launch"}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={busy} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Wizard Step Progress Tracker */}
        <div className="wizard-stepper">
          {[
            { num: 1, name: "Details" },
            { num: 2, name: "Timeline" },
            { num: 3, name: "Roster" },
            { num: 4, name: "Launch" }
          ].map(s => (
            <div
              key={s.num}
              className={`wizard-step-node ${step === s.num ? "active" : step > s.num ? "completed" : ""}`}
            >
              <div className="step-circle">{step > s.num ? "✓" : s.num}</div>
              <span className="step-text">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="modal-body wizard-body">
          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className="wizard-step-content">
              <label className="form-label">
                <span>Election Title <strong className="text-rose-500">*</strong></span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2026 Student Governance Council"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </label>

              <label className="form-label">
                <span>Description (Optional summary for voters)</span>
                <textarea
                  className="form-textarea"
                  placeholder="Explain the purpose, eligibility rules, and positions being contested in this ballot."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </label>

              <div className="info-callout">
                <span>ℹ️</span>
                <p>The election title and timestamps are immutably written onto the Ethereum smart contract.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Time Window */}
          {step === 2 && (
            <div className="wizard-step-content">
              <div className="presets-banner">
                <span className="presets-banner-title">Fast Presets for Testing & Demos:</span>
                <div className="presets-pill-group">
                  <button type="button" className="btn-preset-pill" onClick={() => applyPreset(1, 5)}>
                    ⚡ 5-Minute Demo
                  </button>
                  <button type="button" className="btn-preset-pill" onClick={() => applyPreset(2, 60)}>
                    ⏱️ 1-Hour Poll
                  </button>
                  <button type="button" className="btn-preset-pill" onClick={() => applyPreset(5, 1440)}>
                    📅 24-Hour Election
                  </button>
                </div>
              </div>

              <div className="form-grid-2">
                <label className="form-label">
                  <span>Voting Start Time <strong className="text-rose-500">*</strong></span>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                  <span className="field-hint">Must be set in the future.</span>
                </label>

                <label className="form-label">
                  <span>Voting End Time <strong className="text-rose-500">*</strong></span>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                  <span className="field-hint">Must be after start time.</span>
                </label>
              </div>

              <div className="warning-callout">
                <span>⚠️</span>
                <p>
                  <strong>Contract Security Rule:</strong> Candidates and voters can only be added <em>before</em> the start time is reached. Once voting begins, voter rosters are locked.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Candidates & Voters */}
          {step === 3 && (
            <div className="wizard-step-content">
              {/* Candidates section */}
              <div className="roster-section">
                <div className="roster-header">
                  <strong>Candidates Nominated ({candidatesList.length})</strong>
                  <span className="badge-subtle">At least 2 recommended</span>
                </div>

                <div className="input-with-button">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Candidate full name (e.g. Carol Martinez)"
                    value={candidateInput}
                    onChange={e => setCandidateInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddCandidate())}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddCandidate}>
                    <Plus size={16} /> Add
                  </button>
                </div>

                <div className="roster-chips-container">
                  {candidatesList.map((name, i) => (
                    <div className="roster-chip" key={i}>
                      <span className="chip-name">{name}</span>
                      <button type="button" onClick={() => handleRemoveCandidate(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voter Registration section */}
              <div className="roster-section mt-4">
                <div className="roster-header">
                  <strong>Registered Voters ({votersList.length})</strong>
                  <span className="badge-subtle">Authorized wallets</span>
                </div>

                <div className="quick-voters-pills">
                  <button type="button" className="btn-voter-preset" onClick={() => handleAddVoter(account)}>
                    + My Admin ({account.slice(0, 6)}…)
                  </button>
                  <button
                    type="button"
                    className="btn-voter-preset"
                    onClick={() => handleAddVoter("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
                  >
                    + Hardhat Voter #1
                  </button>
                  <button
                    type="button"
                    className="btn-voter-preset"
                    onClick={() => handleAddVoter("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")}
                  >
                    + Hardhat Voter #2
                  </button>
                </div>

                <div className="input-with-button">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0x... Ethereum address"
                    value={voterInput}
                    onChange={e => setVoterInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddVoter())}
                  />
                  <button type="button" className="btn-secondary" onClick={() => handleAddVoter()}>
                    <Plus size={16} /> Register
                  </button>
                </div>

                <div className="roster-chips-container">
                  {votersList.map((addr, i) => (
                    <div className="roster-chip" key={i}>
                      <span className="chip-address">{addr.slice(0, 6)}…{addr.slice(-4)}</span>
                      <button type="button" onClick={() => handleRemoveVoter(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {votersList.length === 0 && (
                    <span className="text-dim text-xs">No voters added yet. You can also register voters later before start time.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review and Deploy */}
          {step === 4 && (
            <div className="wizard-step-content">
              <div className="review-summary-card">
                <div className="review-row">
                  <span className="review-label">Title:</span>
                  <strong>{title || "Untitled Election"}</strong>
                </div>
                {description && (
                  <div className="review-row">
                    <span className="review-label">Description:</span>
                    <span>{description}</span>
                  </div>
                )}
                <div className="review-row">
                  <span className="review-label">Starts:</span>
                  <span>{new Date(startTime).toLocaleString()}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Ends:</span>
                  <span>{new Date(endTime).toLocaleString()}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Candidates:</span>
                  <span>{candidatesList.join(", ") || "None"}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Voters to Register:</span>
                  <span>{votersList.length} address(es)</span>
                </div>
              </div>

              <div className="info-callout">
                <span>🚀</span>
                <p>
                  Clicking <strong>Deploy Election</strong> will prompt MetaMask to execute the transaction on the local Hardhat blockchain.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Nav */}
        <div className="modal-footer flex-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(step - 1)}
                disabled={busy}
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
          </div>

          <div className="flex-gap-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (step === 1 && !title.trim()) return alert("Please enter an election title.");
                  if (step === 2 && (!startTime || !endTime)) return alert("Please specify start and end dates.");
                  setStep(step + 1);
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmitAll}
                disabled={busy || !title.trim()}
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deploying to Chain…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Deploy Election</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

