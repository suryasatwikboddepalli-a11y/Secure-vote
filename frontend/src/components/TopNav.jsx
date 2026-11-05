import React, { useState } from "react";
import {
  Menu,
  Bell,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Layers,
  Sparkles
} from "lucide-react";

export default function TopNav({
  activeTab,
  account,
  isOwner,
  onConnect,
  busy,
  setMobileOpen,
  electionsCount,
  onOpenCreateModal
}) {
  const [copied, setCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return { section: "Overview", title: "Dashboard" };
      case "elections":
        return { section: "Governance", title: "Elections Directory" };
      case "vote":
        return { section: "Action", title: "Cast Your Ballot" };
      case "candidates":
        return { section: "Directory", title: "Candidates Roster" };
      case "results":
        return { section: "Audit", title: "Election Results & Tally" };
      case "voters":
        return { section: "Admin", title: "Voter Management" };
      case "manage":
        return { section: "Admin", title: "Election Management" };
      case "settings":
        return { section: "Preferences", title: "Network & Wallet Settings" };
      case "help":
        return { section: "Documentation", title: "Help & Knowledge Base" };
      default:
        return { section: "App", title: "SecureVote" };
    }
  };

  const { section, title } = getBreadcrumbTitle();

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="app-topnav">
      {/* Left Breadcrumb & Mobile Trigger */}
      <div className="topnav-left">
        <button
          className="mobile-menu-trigger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open mobile menu"
        >
          <Menu size={20} />
        </button>

        <div className="breadcrumb-container">
          <span className="breadcrumb-section">{section}</span>
          <span className="breadcrumb-separator">/</span>
          <h1 className="breadcrumb-current">{title}</h1>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="topnav-right">
        {/* Network Indicator */}
        <div className="network-pill" title="Connected to Hardhat Local Devnet">
          <span className="network-beacon" />
          <span className="network-name">Hardhat Local</span>
          <span className="network-chainid">31337</span>
        </div>

        {/* Quick Action Button for Admin */}
        {isOwner && onOpenCreateModal && (
          <button className="btn-quick-create" onClick={onOpenCreateModal}>
            <Sparkles size={14} />
            <span>Create Poll</span>
          </button>
        )}

        {/* Notifications Popover Trigger */}
        <div className="notifications-wrapper">
          <button
            className={`btn-icon-square ${showNotifications ? "active" : ""}`}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="dropdown-header">
                <strong>Blockchain Events</strong>
                <span className="badge-subtle">Real-Time</span>
              </div>
              <div className="notifications-list">
                <div className="notification-item">
                  <div className="notification-status-icon success" />
                  <div className="notification-text">
                    <span className="notif-title">Contract Loaded</span>
                    <span className="notif-desc">Connected to SecureVoting on Hardhat network.</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-status-icon info" />
                  <div className="notification-text">
                    <span className="notif-title">Active Registries</span>
                    <span className="notif-desc">{electionsCount} election registries synchronized on-chain.</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-footer">
                <span>Audited on-chain via Ethers.js</span>
              </div>
            </div>
          )}
        </div>

        {/* Wallet Connection / Account Status */}
        {account ? (
          <div className="wallet-chip">
            <div className="wallet-avatar">
              <ShieldCheck size={14} className="text-emerald-500" />
            </div>
            <span className="wallet-text" title={account}>
              {account.slice(0, 6)}…{account.slice(-4)}
            </span>
            <button
              className="wallet-copy-btn"
              onClick={handleCopy}
              title={copied ? "Copied address" : "Copy full address"}
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
            <span className={`role-badge ${isOwner ? "role-admin" : "role-voter"}`}>
              {isOwner ? "ADMIN" : "VOTER"}
            </span>
          </div>
        ) : (
          <button className="btn-connect-wallet" onClick={onConnect} disabled={busy}>
            <span className="btn-wallet-icon">🦊</span>
            <span>{busy ? "Connecting…" : "Connect Wallet"}</span>
          </button>
        )}
      </div>
    </header>
  );
}

