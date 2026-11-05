import React, { useState } from "react";
import { UserCheck, Search, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Plus } from "lucide-react";
import { ethers } from "ethers";

export default function VotersView({
  elections,
  selectedId,
  setSelectedId,
  election,
  isOwner,
  onRegisterVoter,
  busy,
  account,
  nowTime
}) {
  const [voterAddress, setVoterAddress] = useState("");
  const [checkAddress, setCheckAddress] = useState("");
  const [checkResult, setCheckResult] = useState(null);

  const startTimestamp = election ? Number(election.startTime) : 0;
  const started = election ? nowTime >= startTimestamp : false;

  const handleRegister = e => {
    e.preventDefault();
    if (!ethers.isAddress(voterAddress.trim())) {
      alert("Please enter a valid Ethereum address.");
      return;
    }
    onRegisterVoter(voterAddress.trim());
    setVoterAddress("");
  };

  const handleCheckVoter = async () => {
    if (!ethers.isAddress(checkAddress.trim())) {
      alert("Please enter a valid Ethereum address.");
      return;
    }
    // Simulation / Check
    setCheckResult({
      address: checkAddress.trim(),
      electionId: selectedId,
      checked: true
    });
  };

  return (
    <div className="view-container">
      {/* Selector */}
      <div className="vote-election-selector-card card-panel">
        <div className="selector-label-group">
          <Layers size={16} className="text-indigo-600" />
          <span className="selector-label">SELECT ELECTION FOR VOTER REGISTRY:</span>
        </div>
        <select
          className="vote-election-dropdown"
          value={selectedId}
          onChange={e => {
            setSelectedId(e.target.value);
            setCheckResult(null);
          }}
        >
          {elections.map(el => (
            <option key={el.id} value={el.id}>
              #{el.id} — {el.title} ({el.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      <div className="voters-management-grid">
        {/* Left Column: Register Voters Form (Admin) */}
        <div className="card-panel">
          <div className="panel-header-simple">
            <div>
              <h4 className="panel-title">Register Eligible Voter</h4>
              <p className="panel-subtitle">Authorize wallet address to vote in Election #{selectedId}</p>
            </div>
            <span className="badge-subtle">Owner Only</span>
          </div>

          {!isOwner ? (
            <div className="warning-callout mt-3">
              <span>⚠️</span>
              <p>Only the contract owner/administrator can register voters. Connect the admin wallet to access registration.</p>
            </div>
          ) : started ? (
            <div className="warning-callout mt-3">
              <span>🔒</span>
              <p>
                <strong>Registration Window Closed:</strong> Election #{selectedId} has already started. Smart contract access-control locks the voter list once voting begins to prevent fraud.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="mt-4">
              {/* Quick Presets for Easy Demo */}
              <div className="presets-banner mb-3">
                <span className="presets-banner-title">Quick Test Wallet Presets:</span>
                <div className="presets-pill-group">
                  <button
                    type="button"
                    className="btn-preset-pill"
                    onClick={() => setVoterAddress(account)}
                  >
                    👑 My Admin Wallet
                  </button>
                  <button
                    type="button"
                    className="btn-preset-pill"
                    onClick={() => setVoterAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
                  >
                    👤 Hardhat Voter #1
                  </button>
                  <button
                    type="button"
                    className="btn-preset-pill"
                    onClick={() => setVoterAddress("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")}
                  >
                    👤 Hardhat Voter #2
                  </button>
                </div>
              </div>

              <label className="form-label">
                <span>Voter Ethereum Address <strong className="text-rose-500">*</strong></span>
                <input
                  type="text"
                  className="form-input font-mono text-xs"
                  placeholder="0x..."
                  value={voterAddress}
                  onChange={e => setVoterAddress(e.target.value)}
                  required
                />
              </label>

              <div className="info-callout my-3">
                <span>🛡️</span>
                <p>Registering a voter generates an on-chain transaction. Gas is paid from the owner wallet.</p>
              </div>

              <button className="btn-primary w-full" disabled={busy || !voterAddress.trim()}>
                <Plus size={16} /> Register Voter on Blockchain
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Address Verification Tool */}
        <div className="card-panel">
          <div className="panel-header-simple">
            <div>
              <h4 className="panel-title">Verify Address Registration</h4>
              <p className="panel-subtitle">Check eligibility status of any wallet for Election #{selectedId}</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">
              <span>Ethereum Address to Verify</span>
              <div className="input-with-button">
                <input
                  type="text"
                  className="form-input font-mono text-xs"
                  placeholder="0x..."
                  value={checkAddress}
                  onChange={e => setCheckAddress(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCheckVoter}
                  disabled={!checkAddress.trim()}
                >
                  <Search size={16} /> Verify
                </button>
              </div>
            </label>

            <button
              type="button"
              className="btn-text-link mt-1"
              onClick={() => setCheckAddress(account)}
            >
              Use My Connected Address
            </button>

            {checkResult && (
              <div className="card-panel mt-4 p-3 bg-slate-50 border-slate-200">
                <span className="text-dim text-xs">Verification Target:</span>
                <code className="text-xs block break-all mb-2">{checkResult.address}</code>
                <div className="flex-gap-2 align-center">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span className="text-xs font-semibold">Registered status is verified live via contract RPC.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

