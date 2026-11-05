import React from "react";
import { HelpCircle, ShieldCheck, Vote, Key, CheckCircle2 } from "lucide-react";

export default function HelpView() {
  const faqs = [
    {
      q: "How does decentralized voting work on SecureVote?",
      a: "SecureVote operates entirely through an audited Solidity smart contract deployed on an Ethereum Virtual Machine (EVM) blockchain. When you vote, you sign an Ethereum transaction with your MetaMask wallet. The smart contract validates that you are registered, verifies the election is open, and increments the candidate's count irreversibly."
    },
    {
      q: "Why does the app say 'Not Registered' when an election is live?",
      a: "For security and fraud prevention, the smart contract requires voters to be registered before the election start time. Once voting begins, the voter list is locked and no new voters can be added. If you missed registration, you can participate in the next scheduled election."
    },
    {
      q: "Can anyone see how I voted?",
      a: "In this academic smart contract demonstration, votes and wallet addresses are recorded transparently on-chain. As noted in the documentation, this design demonstrates tamper-evident auditability, double-vote prevention, and autonomous tallying."
    },
    {
      q: "How do I switch accounts to test multiple voters?",
      a: "Open your MetaMask extension, click the account selector at the top, and switch to another imported test account (e.g. Account #1: 0x7099... or Account #2: 0x3C44...). Then click 'Switch Account' in SecureVote to vote as that account."
    }
  ];

  return (
    <div className="view-container">
      <div className="card-panel mb-4">
        <div className="panel-header-simple">
          <div>
            <h3 className="panel-title">Knowledge Base & FAQ</h3>
            <p className="panel-subtitle">Everything you need to know about decentralized governance on SecureVote</p>
          </div>
          <HelpCircle size={22} className="text-indigo-600" />
        </div>

        <div className="faqs-list mt-4">
          {faqs.map((faq, i) => (
            <div className="faq-item" key={i}>
              <strong className="faq-question">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                {faq.q}
              </strong>
              <p className="faq-answer">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-panel">
        <div className="panel-header-simple">
          <h4 className="panel-title">Smart Contract Architectural Guarantees</h4>
          <span className="badge-subtle">Solidity ^0.8.24</span>
        </div>

        <div className="security-guarantees-grid mt-3">
          <div className="guarantee-box">
            <ShieldCheck size={20} className="text-indigo-600 mb-2" />
            <strong>Owner-Only Access Control</strong>
            <p className="text-dim text-xs">Only the authenticated deployer can create elections, add nominees, and register voters.</p>
          </div>

          <div className="guarantee-box">
            <Vote size={20} className="text-emerald-600 mb-2" />
            <strong>Strict One-Vote Enforcement</strong>
            <p className="text-dim text-xs">A cryptographic mapping tracks each wallet. Once <code>hasVoted</code> is set, duplicate votes revert.</p>
          </div>

          <div className="guarantee-box">
            <Key size={20} className="text-amber-600 mb-2" />
            <strong>Roster Locking at Launch</strong>
            <p className="text-dim text-xs">The contract checks <code>block.timestamp &lt; startTime</code> for registrations, guaranteeing an immutable voter list.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
