import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Layers,
  Calendar,
  Users2,
  Vote,
  LayoutGrid,
  List,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";

export default function ElectionsView({
  elections,
  selectedId,
  setSelectedId,
  onNavigate,
  isOwner,
  onOpenCreateModal
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  const filtered = useMemo(() => {
    return elections
      .filter(e => {
        const matchesSearch =
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.id.includes(searchQuery);
        const matchesStatus = statusFilter === "all" || e.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return Number(b.id) - Number(a.id);
        if (sortBy === "oldest") return Number(a.id) - Number(b.id);
        if (sortBy === "mostVotes") return Number(b.totalVotes) - Number(a.totalVotes);
        if (sortBy === "endingSoonest") return a.endTime - b.endTime;
        return 0;
      });
  }, [elections, searchQuery, statusFilter, sortBy]);

  const formatDate = ts =>
    new Date(Number(ts) * 1000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

  return (
    <div className="view-container">
      {/* Header and Filter Controls */}
      <div className="directory-header-controls">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search elections by title or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-and-view-group">
          {/* Status Tabs */}
          <div className="segmented-filter-tabs">
            {["all", "live", "ended", "upcoming"].map(st => (
              <button
                key={st}
                className={`seg-tab ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === "all"
                  ? "All"
                  : st === "live"
                  ? "🟢 Active"
                  : st === "ended"
                  ? "🏆 Completed"
                  : "⏳ Upcoming"}
                <span className="seg-count">
                  {st === "all"
                    ? elections.length
                    : elections.filter(e => e.status === st).length}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="mostVotes">Sort: Most Votes</option>
            <option value="endingSoonest">Sort: Ending Soonest</option>
          </select>

          {/* Grid / List View Toggle */}
          <div className="view-toggle-btns">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>

          {isOwner && onOpenCreateModal && (
            <button className="btn-primary" onClick={onOpenCreateModal}>
              <Sparkles size={15} /> Create
            </button>
          )}
        </div>
      </div>

      {/* Elections Results Grid / List */}
      {filtered.length === 0 ? (
        <div className="empty-state-panel card-panel">
          <Layers size={40} className="text-dim mb-3" />
          <h3>No elections found</h3>
          <p className="text-dim text-sm">
            {searchQuery
              ? `No elections matching "${searchQuery}". Try clearing your search.`
              : "No elections currently match this status filter."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="elections-cards-grid">
          {filtered.map(el => (
            <div
              key={el.id}
              className={`election-card-item ${selectedId === el.id ? "card-selected" : ""}`}
              onClick={() => setSelectedId(el.id)}
            >
              <div className="card-top-row">
                <span className={`status-pill pill-${el.status}`}>
                  {el.status === "live"
                    ? "● ACTIVE"
                    : el.status === "ended"
                    ? "COMPLETED"
                    : "UPCOMING"}
                </span>
                <span className="card-id-tag">ID #{el.id}</span>
              </div>

              <h4 className="card-election-title">{el.title}</h4>

              <div className="card-meta-list">
                <div className="meta-item">
                  <Calendar size={14} className="text-dim" />
                  <span>
                    {formatDate(el.startTime)} – {formatDate(el.endTime)}
                  </span>
                </div>
                <div className="meta-item">
                  <Users2 size={14} className="text-dim" />
                  <span>{el.candidateCount} Candidates nominated</span>
                </div>
                <div className="meta-item">
                  <Vote size={14} className="text-dim" />
                  <span><strong>{el.totalVotes}</strong> verified ballots cast</span>
                </div>
              </div>

              <div className="card-footer-actions">
                <button
                  className="btn-select-election"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                    onNavigate("vote");
                  }}
                >
                  <span>{el.status === "live" ? "Vote in Election" : "Inspect Ballot"}</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  className="btn-view-results"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                    onNavigate("results");
                  }}
                >
                  Results
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View (Structured Table) */
        <div className="elections-table-card card-panel">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ELECTION TITLE</th>
                <th>STATUS</th>
                <th>SCHEDULE</th>
                <th>CANDIDATES</th>
                <th>VOTES</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(el => (
                <tr
                  key={el.id}
                  className={selectedId === el.id ? "row-selected" : ""}
                  onClick={() => setSelectedId(el.id)}
                >
                  <td className="font-mono text-dim">#{el.id}</td>
                  <td>
                    <strong className="table-title">{el.title}</strong>
                  </td>
                  <td>
                    <span className={`status-pill pill-${el.status}`}>
                      {el.status}
                    </span>
                  </td>
                  <td className="text-xs text-dim">
                    {formatDate(el.startTime)} – {formatDate(el.endTime)}
                  </td>
                  <td>{el.candidateCount}</td>
                  <td>
                    <strong>{el.totalVotes}</strong>
                  </td>
                  <td className="text-right">
                    <button
                      className="btn-table-action"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                        onNavigate("vote");
                      }}
                    >
                      Vote
                    </button>
                    <button
                      className="btn-table-action"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                        onNavigate("results");
                      }}
                    >
                      Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

