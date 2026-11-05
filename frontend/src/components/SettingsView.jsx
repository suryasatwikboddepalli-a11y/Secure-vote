import React from "react";
import { Settings, ShieldCheck, RefreshCw, ExternalLink, Copy, Check } from "lucide-react";

export default function SettingsView({ account, isOwner, onConnect, busy }) {
  return (
    <div className="view-container">
      <div className="settings-layout-grid">
        {/* Network Configurations */}
        <div className="card-panel">
          <div className="panel-header-simple">
            <h4 className="panel-title">Blockchain Network Configuration</h4>
            <span className="badge-subtle">Local Devnet</span>
          </div>

          <div className="settings-list mt-3">
            <div className="setting-row">
              <span className="setting-label">Network Name</span>
              <strong className="setting-val">Hardhat Local Node</strong>
            </div>

            <div className="setting-row">
              <span className="setting-label">EVM Chain ID</span>
              <strong className="setting-val font-mono">31337 (0x7a69)</strong>
            </div>

            <div className="setting-row">
              <span className="setting-label">JSON-RPC URL</span>
              <code className="setting-val font-mono text-xs">http://127.0.0.1:8545</code>
            </div>

            <div className="setting-row">
              <span className="setting-label">Contract Address</span>
              <code className="setting-val font-mono text-xs break-all">
                0x5FbDB2315678afecb367f032d93F642f64180aa3
              </code>
            </div>
          </div>
        </div>

        {/* Connected Wallet Profile */}
        <div className="card-panel">
          <div className="panel-header-simple">
            <h4 className="panel-title">Connected Wallet Profile</h4>
            <span className="badge-subtle">MetaMask</span>
          </div>

          <div className="settings-list mt-3">
            <div className="setting-row">
              <span className="setting-label">Wallet Address</span>
              <code className="setting-val font-mono text-xs break-all">
                {account || "Not connected"}
              </code>
            </div>

            <div className="setting-row">
              <span className="setting-label">Role Classification</span>
              <strong className="setting-val text-indigo-600">
                {isOwner ? "Contract Administrator (Owner)" : "Verified Voter"}
              </strong>
            </div>

            <div className="setting-row">
              <span className="setting-label">Provider Protocol</span>
              <span className="setting-val">EIP-1193 (BrowserProvider)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button className="btn-secondary w-full" onClick={onConnect} disabled={busy}>
              <RefreshCw size={15} /> Switch Wallet Account / Reconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

