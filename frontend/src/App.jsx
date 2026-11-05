import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { connectWallet } from "./contract.js";

// Components
import Sidebar from "./components/Sidebar.jsx";
import TopNav from "./components/TopNav.jsx";
import DashboardView from "./components/DashboardView.jsx";
import ElectionsView from "./components/ElectionsView.jsx";
import VoteView from "./components/VoteView.jsx";
import CandidatesView from "./components/CandidatesView.jsx";
import ResultsView from "./components/ResultsView.jsx";
import VotersView from "./components/VotersView.jsx";
import ManageView from "./components/ManageView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import HelpView from "./components/HelpView.jsx";
import VoteConfirmationModal from "./components/VoteConfirmationModal.jsx";
import CreateElectionModal from "./components/CreateElectionModal.jsx";
import Toast from "./components/Toast.jsx";

function dateInputToUnix(value) {
  const timestamp = Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isFinite(timestamp)) throw new Error("Please select valid election dates.");
  return timestamp;
}

function readableError(error) {
  return error?.shortMessage || error?.reason || error?.message || "Action could not be completed.";
}

export default function App() {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Elections & Selected Election Data
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState("1");
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [registered, setRegistered] = useState(false);
  const [voted, setVoted] = useState(false);

  // Modals & Notifications
  const [candidateToConfirm, setCandidateToConfirm] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [busy, setBusy] = useState(false);
  const [nowTime, setNowTime] = useState(Math.floor(Date.now() / 1000));

  // Live timer for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  // Load a single election's details, candidate roster, and user registration
  const loadElection = useCallback(async (currentSession, id) => {
    if (!currentSession || !id || Number(id) < 1) return;
    try {
      const [details, candidateRows, isRegistered, alreadyVoted] = await Promise.all([
        currentSession.contract.getElection(id),
        currentSession.contract.getCandidates(id),
        currentSession.contract.isRegisteredVoter(id, currentSession.account),
        currentSession.contract.hasVoted(id, currentSession.account)
      ]);
      setElection(details);
      setCandidates(
        candidateRows.map(c => ({
          id: c.id.toString(),
          name: c.name,
          cid: c.manifestoCID,
          votes: c.voteCount.toString()
        }))
      );
      setRegistered(isRegistered);
      setVoted(alreadyVoted);
    } catch {
      setElection(null);
      setCandidates([]);
      setRegistered(false);
      setVoted(false);
    }
  }, []);

  // Load all elections from the contract
  const loadAll = useCallback(async currentSession => {
    try {
      const next = Number(await currentSession.contract.nextElectionId());
      const items = [];
      const currentSec = Math.floor(Date.now() / 1000);

      for (let id = 1; id < next; id++) {
        try {
          const [details, candidateRows] = await Promise.all([
            currentSession.contract.getElection(id),
            currentSession.contract.getCandidates(id)
          ]);
          const startNum = Number(details.startTime);
          const endNum = Number(details.endTime);
          const isEnded = Boolean(details.ended) || currentSec >= endNum;
          const isLive = (Boolean(details.started) || currentSec >= startNum) && !isEnded;
          const status = isEnded ? "ended" : isLive ? "live" : "upcoming";
          const votesSum = candidateRows.reduce((acc, c) => acc + Number(c.voteCount), 0);

          items.push({
            id: String(id),
            title: details.title,
            startTime: startNum,
            endTime: endNum,
            status,
            candidateCount: candidateRows.length,
            totalVotes: votesSum
          });
        } catch {
          /* Skip unavailable or corrupted entry */
        }
      }
      setElections(items);
      if (items.length && !items.some(e => e.id === selectedId)) {
        setSelectedId(items[items.length - 1].id);
      }
    } catch (e) {
      showToast(readableError(e), "error");
    }
  }, [selectedId]);

  // Connect MetaMask wallet
  const connect = async () => {
    setBusy(true);
    try {
      const current = await connectWallet();
      const owner = await current.contract.owner();
      setSession(current);
      setAccount(current.account);
      setIsOwner(owner.toLowerCase() === current.account.toLowerCase());
      await loadAll(current);
      showToast("MetaMask wallet connected successfully.", "success");
    } catch (e) {
      showToast(readableError(e), "error");
    } finally {
      setBusy(false);
    }
  };

  // Auto-connect on mount if MetaMask already authorized
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then(accounts => {
          if (accounts && accounts.length > 0) {
            connect();
          }
        })
        .catch(() => {});
    }
  }, []);

  // Reload selected election when session or selectedId changes
  useEffect(() => {
    if (session && selectedId) {
      loadElection(session, selectedId);
    }
  }, [session, selectedId, loadElection]);

  // Handle MetaMask accounts or chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = accounts => {
      if (!accounts || accounts.length === 0) {
        setSession(null);
        setAccount("");
        showToast("Wallet disconnected.", "info");
      } else {
        connect();
      }
    };
    const onChainChanged = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", onAccountsChanged);
    window.ethereum.on?.("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  // Wrapper for executing contract transactions
  const transact = async (action, successMsg) => {
    if (!session) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    setBusy(true);
    try {
      const tx = await action();
      if (tx?.wait) {
        showToast("Transaction submitted to blockchain. Awaiting confirmation…", "info");
        await tx.wait();
      }
      showToast(successMsg, "success");
      await loadAll(session);
      await loadElection(session, selectedId);
      return true;
    } catch (e) {
      showToast(readableError(e), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Submit confirmed vote
  const handleConfirmVote = async () => {
    if (!candidateToConfirm) return;
    const ok = await transact(
      () => session.contract.vote(selectedId, candidateToConfirm.id),
      `Vote successfully recorded on-chain for ${candidateToConfirm.name}!`
    );
    if (ok) {
      setCandidateToConfirm(null);
    }
  };

  // Create Election multi-step submission
  const handleCreateElection = async formData => {
    const { title, startTime, endTime, candidates: candList, voters: voterList } = formData;
    setBusy(true);
    try {
      const start = dateInputToUnix(startTime);
      const end = dateInputToUnix(endTime);
      if (start <= Math.floor(Date.now() / 1000)) throw new Error("Start time must be in the future.");
      if (end <= start) throw new Error("End time must be after start time.");

      showToast("Deploying election to Ethereum blockchain…", "info");
      const tx = await session.contract.createElection(title.trim(), start, end);
      await tx.wait();

      const newIdNum = Number(await session.contract.nextElectionId()) - 1;
      const newIdStr = String(newIdNum);

      // Add candidates if specified
      if (candList && candList.length > 0) {
        for (const name of candList) {
          try {
            const candTx = await session.contract.addCandidate(newIdStr, name, "");
            await candTx.wait();
          } catch (candErr) {
            console.error("Error adding candidate:", candErr);
          }
        }
      }

      // Register voters if specified
      if (voterList && voterList.length > 0) {
        for (const voter of voterList) {
          try {
            if (ethers.isAddress(voter)) {
              const vTx = await session.contract.registerVoter(newIdStr, voter);
              await vTx.wait();
            }
          } catch (vErr) {
            console.error("Error registering voter:", vErr);
          }
        }
      }

      showToast(`Election #${newIdStr} deployed successfully!`, "success");
      setIsCreateModalOpen(false);
      setSelectedId(newIdStr);
      await loadAll(session);
      await loadElection(session, newIdStr);
      setActiveTab("elections");
    } catch (err) {
      showToast(readableError(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAddCandidate = async (name, cid) => {
    await transact(
      () => session.contract.addCandidate(selectedId, name, cid),
      `Candidate "${name}" nominated successfully.`
    );
  };

  const handleRegisterVoter = async voterAddress => {
    await transact(
      () => session.contract.registerVoter(selectedId, voterAddress),
      `Voter address registered successfully.`
    );
  };

  const handleEndElection = async () => {
    await transact(
      () => session.contract.endElection(selectedId),
      `Election #${selectedId} officially concluded on-chain.`
    );
  };

  const handleDisconnect = () => {
    setSession(null);
    setAccount("");
    setIsOwner(false);
    showToast("Wallet session disconnected.", "info");
  };

  const totalVotesAll = useMemo(() => {
    return elections.reduce((sum, e) => sum + (Number(e.totalVotes) || 0), 0);
  }, [elections]);

  const selectedElectionSummary = elections.find(e => e.id === selectedId) || null;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOwner={isOwner}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        account={account}
        onDisconnect={handleDisconnect}
      />

      {/* Main Content Area */}
      <div className={`app-main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Top Navbar */}
        <TopNav
          activeTab={activeTab}
          account={account}
          isOwner={isOwner}
          onConnect={connect}
          busy={busy}
          setMobileOpen={setMobileMenuOpen}
          electionsCount={elections.length}
          onOpenCreateModal={isOwner ? () => setIsCreateModalOpen(true) : null}
        />

        {/* Dynamic View Router */}
        <div className="app-content-body">
          {activeTab === "dashboard" && (
            <DashboardView
              elections={elections}
              selectedElection={selectedElectionSummary}
              candidates={candidates}
              totalVotesAll={totalVotesAll}
              nowTime={nowTime}
              account={account}
              registered={registered}
              voted={voted}
              isOwner={isOwner}
              onNavigate={setActiveTab}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {activeTab === "elections" && (
            <ElectionsView
              elections={elections}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onNavigate={setActiveTab}
              isOwner={isOwner}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {activeTab === "vote" && (
            <VoteView
              elections={elections}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              election={election}
              candidates={candidates}
              registered={registered}
              voted={voted}
              nowTime={nowTime}
              account={account}
              onConnect={connect}
              onOpenConfirmationModal={candidate => setCandidateToConfirm(candidate)}
            />
          )}

          {activeTab === "candidates" && (
            <CandidatesView
              elections={elections}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              election={election}
              candidates={candidates}
              isOwner={isOwner}
              onAddCandidate={handleAddCandidate}
              busy={busy}
              nowTime={nowTime}
            />
          )}

          {activeTab === "results" && (
            <ResultsView
              elections={elections}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              election={election}
              candidates={candidates}
              nowTime={nowTime}
            />
          )}

          {activeTab === "voters" && (
            <VotersView
              elections={elections}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              election={election}
              isOwner={isOwner}
              onRegisterVoter={handleRegisterVoter}
              busy={busy}
              account={account}
              nowTime={nowTime}
            />
          )}

          {activeTab === "manage" && (
            <ManageView
              elections={elections}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              election={election}
              isOwner={isOwner}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onEndElection={handleEndElection}
              busy={busy}
              nowTime={nowTime}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              account={account}
              isOwner={isOwner}
              onConnect={connect}
              busy={busy}
            />
          )}

          {activeTab === "help" && <HelpView />}
        </div>
      </div>

      {/* Vote Confirmation Modal */}
      <VoteConfirmationModal
        isOpen={Boolean(candidateToConfirm)}
        onClose={() => setCandidateToConfirm(null)}
        onConfirm={handleConfirmVote}
        election={selectedElectionSummary}
        candidate={candidateToConfirm}
        account={account}
        busy={busy}
      />

      {/* Multi-step Create Election Modal */}
      <CreateElectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateElection}
        busy={busy}
        account={account}
      />

      {/* Floating Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </div>
  );
}
