import React from "react";
import {
  LayoutDashboard,
  Vote,
  Layers,
  Users2,
  BarChart3,
  UserCheck,
  ShieldAlert,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOwner,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  account,
  onDisconnect
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "elections", label: "Elections", icon: Layers },
    { id: "vote", label: "Vote", icon: Vote, highlight: true },
    { id: "candidates", label: "Candidates", icon: Users2 },
    { id: "results", label: "Results", icon: BarChart3 }
  ];

  const adminItems = [
    { id: "voters", label: "Voter Management", icon: UserCheck },
    { id: "manage", label: "Election Management", icon: ShieldAlert }
  ];

  const footerItems = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle }
  ];

  const handleNavClick = id => {
    setActiveTab(id);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => handleNavClick("dashboard")}>
            <div className="brand-logo-container">
              <ShieldCheck className="brand-icon" size={22} />
            </div>
            {!collapsed && (
              <div className="brand-text">
                <span className="brand-name">Secure<span className="brand-name-accent">Vote</span></span>
                <span className="brand-tagline">DECENTRALIZED GOVERNANCE</span>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="sidebar-nav-container">
          <div className="nav-group-label">{!collapsed && "MAIN NAVIGATION"}</div>
          <nav className="nav-list">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? "active" : ""} ${item.highlight ? "nav-highlight" : ""}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : ""}
                >
                  <Icon size={18} className="nav-icon" />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {item.highlight && !collapsed && (
                    <span className="nav-badge-pill">POLL</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin Navigation */}
          <div className="nav-group-label">
            {!collapsed && (
              <span className="admin-group-label">
                ADMINISTRATION {isOwner ? "(YOU)" : "(RESTRICTED)"}
              </span>
            )}
          </div>
          <nav className="nav-list">
            {adminItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : ""}
                >
                  <Icon size={18} className="nav-icon" />
                  {!collapsed && (
                    <span className="nav-label flex-between">
                      {item.label}
                      {isOwner && <span className="owner-status-dot" title="Admin Access" />}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary / Footer Nav */}
          <div className="nav-group-label">{!collapsed && "SYSTEM"}</div>
          <nav className="nav-list">
            {footerItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : ""}
                >
                  <Icon size={18} className="nav-icon" />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Account Info */}
        <div className="sidebar-footer">
          {account ? (
            <div className="account-card">
              <div className="account-avatar-indicator">
                <div className="avatar-dot" />
              </div>
              {!collapsed && (
                <div className="account-details">
                  <span className="account-address">
                    {account.slice(0, 6)}…{account.slice(-4)}
                  </span>
                  <span className="account-role-label">
                    {isOwner ? "Contract Administrator" : "Verified Voter"}
                  </span>
                </div>
              )}
              {!collapsed && (
                <button
                  className="disconnect-btn"
                  onClick={onDisconnect}
                  title="Disconnect Wallet"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            !collapsed && (
              <div className="account-disconnected-hint">
                <span>Wallet not connected</span>
              </div>
            )
          )}

          {/* Desktop Collapse Toggle */}
          <button
            className="collapse-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
