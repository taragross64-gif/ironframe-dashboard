import { useState, useMemo, useEffect, useCallback } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');`;

const styles = `
  ${FONTS}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f1117; color: #e2e8f0; font-family: 'IBM Plex Sans', sans-serif; }
  :root {
    --bg: #0f1117; --bg2: #161b27; --bg3: #1e2535; --border: #2a3347;
    --amber: #f59e0b; --steel: #60a5fa; --green: #34d399;
    --red: #f87171; --yellow: #fbbf24;
    --text: #e2e8f0; --text-dim: #64748b; --text-mid: #94a3b8;
  }
  .app { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 220px; min-width: 220px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; }
  .sidebar-logo { padding: 0 20px 28px; font-family: 'Bebas Neue', cursive; font-size: 22px; letter-spacing: 2px; color: var(--amber); border-bottom: 1px solid var(--border); line-height: 1.2; }
  .sidebar-logo span { display: block; font-size: 11px; letter-spacing: 3px; color: var(--text-dim); font-family: 'IBM Plex Mono', monospace; margin-top: 4px; }
  .sidebar-nav { padding: 20px 0; flex: 1; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-mid); border-left: 3px solid transparent; transition: all 0.15s; }
  .nav-item:hover { color: var(--text); background: var(--bg3); }
  .nav-item.active { color: var(--amber); border-left-color: var(--amber); background: rgba(245,158,11,0.07); }
  .sync-status { padding: 12px 20px; font-size: 10px; font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
  .sync-dot { width: 7px; height: 7px; border-radius: 50%; }
  .sync-dot.synced { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .sync-dot.syncing { background: var(--yellow); animation: pulse 1s infinite; }
  .sync-dot.error { background: var(--red); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .main { flex: 1; overflow-y: auto; background: var(--bg); }
  .topbar { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
  .topbar-title { font-family: 'Bebas Neue', cursive; font-size: 26px; letter-spacing: 2px; color: var(--text); }
  .topbar-title span { color: var(--amber); }
  .btn { padding: 8px 18px; border-radius: 4px; border: none; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 600; transition: all 0.15s; letter-spacing: 0.5px; }
  .btn-amber { background: var(--amber); color: #000; }
  .btn-amber:hover { background: #fbbf24; }
  .btn-ghost { background: transparent; color: var(--text-mid); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--amber); color: var(--amber); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .content { padding: 28px; }
  .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
  .project-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 22px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
  .project-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .project-card.status-active::before { background: var(--green); }
  .project-card.status-planning::before { background: var(--steel); }
  .project-card.status-hold::before { background: var(--yellow); }
  .project-card.status-complete::before { background: var(--text-dim); }
  .project-card:hover { border-color: var(--amber); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .card-name { font-family: 'Bebas Neue', cursive; font-size: 20px; letter-spacing: 1px; color: var(--text); line-height: 1.2; }
  .card-client { font-size: 12px; color: var(--text-dim); margin-top: 2px; font-family: 'IBM Plex Mono', monospace; }
  .status-badge { padding: 3px 10px; border-radius: 3px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; white-space: nowrap; }
  .badge-active { background: rgba(52,211,153,0.15); color: var(--green); }
  .badge-planning { background: rgba(96,165,250,0.15); color: var(--steel); }
  .badge-hold { background: rgba(251,191,36,0.15); color: var(--yellow); }
  .badge-complete { background: rgba(100,116,139,0.15); color: var(--text-dim); }
  .card-meta { display: flex; gap: 16px; margin: 14px 0; flex-wrap: wrap; }
  .meta-item { font-size: 11px; color: var(--text-dim); font-family: 'IBM Plex Mono', monospace; }
  .meta-item strong { display: block; color: var(--text-mid); margin-bottom: 2px; }
  .progress-bar { height: 4px; background: var(--bg3); border-radius: 2px; margin-top: 14px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; background: var(--amber); transition: width 0.5s; }
  .progress-label { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: var(--text-dim); font-family: 'IBM Plex Mono', monospace; }
  .back-btn { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-dim); font-size: 13px; transition: color 0.15s; }
  .back-btn:hover { color: var(--amber); }
  .detail-header { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 24px; margin-bottom: 20px; }
  .detail-title { font-family: 'Bebas Neue', cursive; font-size: 32px; letter-spacing: 2px; color: var(--text); }
  .detail-meta { display: flex; gap: 24px; margin-top: 12px; flex-wrap: wrap; }
  .tabs { display: flex; gap: 2px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 4px; margin-bottom: 20px; flex-wrap: wrap; }
  .tab { padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-dim); transition: all 0.15s; white-space: nowrap; }
  .tab:hover { color: var(--text); }
  .tab.active { background: var(--amber); color: #000; font-weight: 700; }
  .timeline { position: relative; padding-left: 28px; }
  .timeline::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: var(--border); }
  .timeline-item { position: relative; margin-bottom: 24px; }
  .timeline-dot { position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border); background: var(--bg); transition: all 0.2s; }
  .timeline-dot.done { background: var(--green); border-color: var(--green); }
  .timeline-dot.active { background: var(--amber); border-color: var(--amber); box-shadow: 0 0 0 4px rgba(245,158,11,0.2); }
  .timeline-dot.upcoming { background: var(--bg3); border-color: var(--text-dim); }
  .timeline-content { background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 14px 16px; }
  .timeline-name { font-weight: 600; font-size: 14px; color: var(--text); margin-bottom: 4px; }
  .timeline-date { font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); }
  .timeline-notes { font-size: 12px; color: var(--text-mid); margin-top: 6px; }
  .add-form { background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 16px; margin-top: 16px; }
  .table-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 14px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); border-bottom: 1px solid var(--border); font-weight: 500; }
  td { padding: 12px 14px; border-bottom: 1px solid rgba(42,51,71,0.5); color: var(--text-mid); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(245,158,11,0.03); color: var(--text); }
  .note-item { background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 16px; margin-bottom: 12px; }
  .note-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .note-tag { padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; }
  .tag-client { background: rgba(96,165,250,0.15); color: var(--steel); }
  .tag-site { background: rgba(52,211,153,0.15); color: var(--green); }
  .tag-internal { background: rgba(245,158,11,0.15); color: var(--amber); }
  .tag-vendor { background: rgba(248,113,113,0.15); color: var(--red); }
  .note-time { font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); }
  .note-text { font-size: 13px; color: var(--text-mid); line-height: 1.6; }
  .check-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; margin-bottom: 8px; transition: all 0.15s; }
  .check-item.done { opacity: 0.5; }
  .check-item.done .check-text { text-decoration: line-through; color: var(--text-dim); }
  .custom-check { width: 18px; height: 18px; min-width: 18px; border: 2px solid var(--border); border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-top: 1px; }
  .custom-check.checked { background: var(--amber); border-color: var(--amber); }
  .check-text { font-size: 13px; color: var(--text); flex: 1; }
  .check-meta { display: flex; gap: 10px; margin-top: 4px; align-items: center; }
  .priority-badge { padding: 1px 7px; border-radius: 2px; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'IBM Plex Mono', monospace; }
  .priority-high { background: rgba(248,113,113,0.15); color: var(--red); }
  .priority-medium { background: rgba(251,191,36,0.15); color: var(--yellow); }
  .priority-low { background: rgba(100,116,139,0.15); color: var(--text-dim); }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .cal-header { background: var(--bg3); padding: 10px; text-align: center; font-size: 11px; font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); font-weight: 500; }
  .cal-day { background: var(--bg2); padding: 8px; min-height: 80px; }
  .cal-day.other-month { background: var(--bg); }
  .cal-day.today { background: rgba(245,158,11,0.06); }
  .cal-day-num { font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); margin-bottom: 4px; }
  .cal-day.today .cal-day-num { color: var(--amber); font-weight: 700; }
  .cal-event { font-size: 10px; padding: 2px 5px; border-radius: 2px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; font-weight: 500; }
  .cal-nav { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  .cal-month { font-family: 'Bebas Neue', cursive; font-size: 28px; letter-spacing: 2px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; width: 100%; max-width: 560px; max-height: 85vh; overflow-y: auto; padding: 28px; }
  .modal-title { font-family: 'Bebas Neue', cursive; font-size: 24px; letter-spacing: 2px; color: var(--amber); margin-bottom: 24px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 11px; font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); font-weight: 500; }
  input, select, textarea { background: var(--bg3); border: 1px solid var(--border); border-radius: 4px; color: var(--text); padding: 9px 12px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.15s; width: 100%; }
  input:focus, select:focus, textarea:focus { border-color: var(--amber); }
  textarea { resize: vertical; min-height: 80px; }
  select option { background: var(--bg3); }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
  .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 18px 20px; }
  .stat-value { font-family: 'Bebas Neue', cursive; font-size: 36px; letter-spacing: 1px; color: var(--amber); line-height: 1; }
  .stat-label { font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .section-title { font-family: 'Bebas Neue', cursive; font-size: 18px; letter-spacing: 2px; color: var(--text-dim); margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .empty { text-align: center; padding: 40px; color: var(--text-dim); font-size: 13px; font-family: 'IBM Plex Mono', monospace; }
  .input-row { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
  .input-row input, .input-row select { flex: 1; min-width: 120px; }
  .contract-value { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--green); }
  .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg); gap: 16px; }
  .loading-title { font-family: 'Bebas Neue', cursive; font-size: 32px; letter-spacing: 4px; color: var(--amber); }
  .loading-sub { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-dim); letter-spacing: 2px; }
  .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--amber); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--bg2); border: 1px solid var(--border); border-left: 3px solid var(--green); padding: 12px 18px; border-radius: 5px; font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: var(--text-mid); z-index: 200; animation: slideIn 0.2s ease; }
  .toast.error { border-left-color: var(--red); }
  @keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }
`;

const SEED_PROJECTS = [
  {
    id: "p1", name: "Meridian Office Complex", client: "Meridian Holdings LLC",
    address: "4820 Commerce Blvd, Milwaukee, WI", pm: "Sandra Kowalski",
    contract: 1850000, status: "active", start: "2026-01-15", end: "2026-08-30", progress: 38,
    milestones: [
      { id: "m1", name: "Project Kickoff", date: "2026-01-15", status: "done", notes: "All stakeholders attended. Scope confirmed." },
      { id: "m2", name: "Demolition Complete", date: "2026-02-20", status: "done", notes: "Floors 2–4 cleared." },
      { id: "m3", name: "MEP Rough-In", date: "2026-04-10", status: "active", notes: "Electrical 60% complete, plumbing on schedule." },
      { id: "m4", name: "Drywall & Insulation", date: "2026-05-22", status: "upcoming", notes: "" },
      { id: "m5", name: "Final Inspection", date: "2026-08-15", status: "upcoming", notes: "" },
    ],
    pos: [
      { id: "po1", po: "PO-2026-001", vendor: "Apex Electrical Supply", desc: "Panel boards & conduit", amount: 48200, date: "2026-01-20", status: "Received" },
      { id: "po2", po: "PO-2026-004", vendor: "Midwest Drywall Co.", desc: "5/8\" type-X drywall — 12,000 sheets", amount: 31500, date: "2026-02-05", status: "Approved" },
      { id: "po3", po: "PO-2026-009", vendor: "ProTech HVAC", desc: "Ductwork fabrication & equipment", amount: 124000, date: "2026-02-18", status: "Pending" },
    ],
    notes: [
      { id: "n1", tag: "client", text: "Client confirmed upgraded lighting package in executive suites. Will issue change order CO-003.", date: "2026-02-28 14:32" },
      { id: "n2", tag: "site", text: "Water intrusion at NE stairwell. Roofing subcontractor notified. Repair scheduled March 6.", date: "2026-02-25 09:15" },
      { id: "n3", tag: "internal", text: "MEP subcontractor is 4 days behind. Recovery plan: adding weekend crew.", date: "2026-03-01 16:00" },
    ],
    checklist: [
      { id: "c1", text: "Execute subcontractor agreements", done: true, due: "2026-01-20", priority: "high" },
      { id: "c2", text: "Submit building permit application", done: true, due: "2026-01-18", priority: "high" },
      { id: "c3", text: "Finalize MEP coordination drawings", done: false, due: "2026-03-15", priority: "high" },
      { id: "c4", text: "Order long-lead HVAC equipment", done: false, due: "2026-03-10", priority: "medium" },
      { id: "c5", text: "Schedule owner walkthrough — Milestone 3", done: false, due: "2026-04-12", priority: "medium" },
    ],
  },
  {
    id: "p2", name: "Lakefront Retail Buildout", client: "Shoreline Properties Inc.",
    address: "201 Harbor View Dr, Racine, WI", pm: "Tom Braddock",
    contract: 520000, status: "planning", start: "2026-03-01", end: "2026-06-15", progress: 12,
    milestones: [
      { id: "m1", name: "Design Review Approval", date: "2026-02-20", status: "done", notes: "City approved with minor revisions." },
      { id: "m2", name: "Permit Issued", date: "2026-03-05", status: "active", notes: "Awaiting final sign-off." },
      { id: "m3", name: "Structural Steel Install", date: "2026-03-28", status: "upcoming", notes: "" },
      { id: "m4", name: "Tenant Handover", date: "2026-06-10", status: "upcoming", notes: "" },
    ],
    pos: [
      { id: "po1", po: "PO-2026-011", vendor: "Great Lakes Steel", desc: "Structural steel — storefront framing", amount: 18400, date: "2026-02-15", status: "Approved" },
    ],
    notes: [
      { id: "n1", tag: "client", text: "Shoreline wants polished concrete floors instead of VCT tile. Cost delta approx. +$9,200.", date: "2026-02-22 11:45" },
      { id: "n2", tag: "vendor", text: "Glass storefront: 8-week lead time from Vitro. Must order by March 10.", date: "2026-02-27 10:00" },
    ],
    checklist: [
      { id: "c1", text: "Issue Notice to Proceed to GC", done: false, due: "2026-03-01", priority: "high" },
      { id: "c2", text: "Confirm glass system order deadline with Vitro", done: false, due: "2026-03-08", priority: "high" },
      { id: "c3", text: "Distribute site safety plan", done: true, due: "2026-02-28", priority: "medium" },
    ],
  },
  {
    id: "p3", name: "Grandview Medical Clinic", client: "Grandview Health Systems",
    address: "9901 Medical Pkwy, Waukesha, WI", pm: "Sandra Kowalski",
    contract: 3100000, status: "hold", start: "2026-04-01", end: "2027-02-28", progress: 5,
    milestones: [
      { id: "m1", name: "Owner Financing Confirmed", date: "2026-03-15", status: "upcoming", notes: "Pending bank commitment letter." },
      { id: "m2", name: "Preconstruction Meeting", date: "2026-04-01", status: "upcoming", notes: "" },
      { id: "m3", name: "Foundation Pour", date: "2026-05-10", status: "upcoming", notes: "" },
    ],
    pos: [],
    notes: [
      { id: "n1", tag: "internal", text: "Project on hold pending owner financing. Expected LOI by March 15.", date: "2026-02-20 13:00" },
    ],
    checklist: [
      { id: "c1", text: "Confirm financing — obtain commitment letter", done: false, due: "2026-03-15", priority: "high" },
      { id: "c2", text: "Finalize structural drawings with engineer", done: false, due: "2026-03-20", priority: "medium" },
    ],
  },
];

const PROJECT_COLORS = ["#f59e0b","#60a5fa","#34d399","#f87171","#a78bfa","#fb923c"];
const STORAGE_KEY = "ironframe-projects-v1";
const POLL_INTERVAL = 5000;

const fmt = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const fmtMoney = (n) => n ? "$" + Number(n).toLocaleString() : "—";
const statusLabel = { active:"In Progress", planning:"Planning", hold:"On Hold", complete:"Complete" };
const badgeClass = { active:"badge-active", planning:"badge-planning", hold:"badge-hold", complete:"badge-complete" };
const statusCardClass = { active:"status-active", planning:"status-planning", hold:"status-hold", complete:"status-complete" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Storage helpers ───────────────────────────────────────────────────────────
async function loadFromStorage() {
  try {
    const result = await window.storage.get(STORAGE_KEY, true);
    if (result && result.value) return JSON.parse(result.value);
  } catch {}
  return null;
}

async function saveToStorage(projects) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(projects), true);
    return true;
  } catch {
    return false;
  }
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [syncStatus, setSyncStatus] = useState("syncing");
  const [toast, setToast] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Initial load
  useEffect(() => {
    (async () => {
      setSyncStatus("syncing");
      const data = await loadFromStorage();
      if (data && Array.isArray(data) && data.length > 0) {
        setProjects(data);
        setLastSaved(JSON.stringify(data));
      } else {
        setProjects(SEED_PROJECTS);
        await saveToStorage(SEED_PROJECTS);
        setLastSaved(JSON.stringify(SEED_PROJECTS));
      }
      setSyncStatus("synced");
    })();
  }, []);

  // Poll for remote changes every 5s
  useEffect(() => {
    if (!projects) return;
    const interval = setInterval(async () => {
      const data = await loadFromStorage();
      if (data) {
        const remote = JSON.stringify(data);
        if (remote !== lastSaved) {
          setProjects(data);
          setLastSaved(remote);
          showToast("🔄 Updated by a team member");
        }
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [projects, lastSaved]);

  // Save whenever projects change
  const persistProjects = useCallback(async (newProjects) => {
    setSyncStatus("syncing");
    setProjects(newProjects);
    const ok = await saveToStorage(newProjects);
    setLastSaved(JSON.stringify(newProjects));
    setSyncStatus(ok ? "synced" : "error");
    if (!ok) showToast("Save failed — check connection", "error");
  }, []);

  const updateProject = useCallback((id, updates) => {
    setProjects(ps => {
      const next = ps.map(p => p.id === id ? { ...p, ...updates } : p);
      saveToStorage(next).then(ok => {
        setLastSaved(JSON.stringify(next));
        setSyncStatus(ok ? "synced" : "error");
      });
      setSyncStatus("syncing");
      return next;
    });
  }, []);

  const selectedProject = projects?.find(p => p.id === selectedId);

  const saveProject = async (data) => {
    let next;
    if (editingProject) {
      next = projects.map(p => p.id === editingProject.id ? { ...p, ...data } : p);
    } else {
      const newP = { ...data, id: "p" + Date.now(), milestones:[], pos:[], notes:[], checklist:[], progress: data.progress || 0 };
      next = [...projects, newP];
    }
    await persistProjects(next);
    showToast(editingProject ? "Project updated ✓" : "Project created ✓");
    setShowModal(false);
  };

  const deleteProject = async (id) => {
    const next = projects.filter(p => p.id !== id);
    await persistProjects(next);
    showToast("Project deleted");
    setView("dashboard");
  };

  if (!projects) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-title">IRONFRAME</div>
          <div className="spinner" />
          <div className="loading-sub">LOADING SHARED DATA...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <Sidebar view={view} setView={setView} setSelectedId={setSelectedId} syncStatus={syncStatus} />
        <div className="main">
          {view === "dashboard" && <Dashboard projects={projects} onOpen={id => { setSelectedId(id); setView("detail"); }} onNew={() => { setEditingProject(null); setShowModal(true); }} />}
          {view === "detail" && selectedProject && (
            <DetailView project={selectedProject} onBack={() => setView("dashboard")} onUpdate={(u) => updateProject(selectedProject.id, u)} onEdit={() => { setEditingProject(selectedProject); setShowModal(true); }} onDelete={() => deleteProject(selectedProject.id)} />
          )}
          {view === "calendar" && <CalendarView projects={projects} onOpen={id => { setSelectedId(id); setView("detail"); }} />}
        </div>
      </div>
      {showModal && <ProjectModal project={editingProject} onSave={saveProject} onClose={() => setShowModal(false)} />}
      {toast && <div className={`toast ${toast.type === "error" ? "error" : ""}`}>{toast.msg}</div>}
    </>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, setSelectedId, syncStatus }) {
  const syncLabel = { synced:"SYNCED", syncing:"SAVING...", error:"SYNC ERROR" };
  const syncColor = { synced:"var(--green)", syncing:"var(--yellow)", error:"var(--red)" };
  return (
    <div className="sidebar">
      <div className="sidebar-logo">IRONFRAME<span>CONSTRUCTION MGMT</span></div>
      <nav className="sidebar-nav">
        {[{id:"dashboard",icon:"⬛",label:"All Projects"},{id:"calendar",icon:"📅",label:"Calendar"}].map(n => (
          <div key={n.id} className={`nav-item ${view === n.id || (view==="detail" && n.id==="dashboard") ? "active" : ""}`}
            onClick={() => { setView(n.id); if (n.id==="dashboard") setSelectedId(null); }}>
            <span style={{fontSize:15}}>{n.icon}</span>{n.label}
          </div>
        ))}
      </nav>
      <div className="sync-status" style={{color: syncColor[syncStatus]}}>
        <div className={`sync-dot ${syncStatus}`} />
        {syncLabel[syncStatus]}
      </div>
      <div style={{padding:"4px 20px 16px", fontSize:10, color:"var(--text-dim)", fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.5}}>
        Shared across<br />all team members
      </div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ projects, onOpen, onNew }) {
  const active = projects.filter(p => p.status === "active").length;
  const totalContract = projects.reduce((s, p) => s + (Number(p.contract) || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + p.checklist.filter(c => !c.done).length, 0);
  return (
    <>
      <div className="topbar">
        <div className="topbar-title">PROJECT <span>DASHBOARD</span></div>
        <button className="btn btn-amber" onClick={onNew}>+ New Project</button>
      </div>
      <div className="content">
        <div className="stats-bar">
          <div className="stat-card"><div className="stat-value">{projects.length}</div><div className="stat-label">Total Projects</div></div>
          <div className="stat-card"><div className="stat-value">{active}</div><div className="stat-label">Active</div></div>
          <div className="stat-card"><div className="stat-value" style={{fontSize:26}}>{fmtMoney(totalContract)}</div><div className="stat-label">Total Contract Value</div></div>
          <div className="stat-card"><div className="stat-value">{totalTasks}</div><div className="stat-label">Open Tasks</div></div>
        </div>
        <div className="section-title">Projects</div>
        <div className="projects-grid">
          {projects.map((p, i) => (
            <div key={p.id} className={`project-card ${statusCardClass[p.status]}`} onClick={() => onOpen(p.id)}>
              <div className="card-header">
                <div><div className="card-name">{p.name}</div><div className="card-client">{p.client}</div></div>
                <span className={`status-badge ${badgeClass[p.status]}`}>{statusLabel[p.status]}</span>
              </div>
              <div className="card-meta">
                <div className="meta-item"><strong>PM</strong>{p.pm}</div>
                <div className="meta-item"><strong>Contract</strong><span className="contract-value">{fmtMoney(p.contract)}</span></div>
                <div className="meta-item"><strong>End Date</strong>{fmt(p.end)}</div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width: p.progress + "%"}} /></div>
              <div className="progress-label"><span>Progress</span><span>{p.progress}%</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── DETAIL VIEW ───────────────────────────────────────────────────────────────
function DetailView({ project, onBack, onUpdate, onEdit, onDelete }) {
  const [tab, setTab] = useState("timeline");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tabs = ["timeline","purchase orders","notes","checklist"];
  return (
    <>
      <div className="topbar">
        <div className="back-btn" onClick={onBack}>← Back to Projects</div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit Project</button>
          {confirmDelete
            ? <><button className="btn btn-sm" style={{background:"var(--red)",color:"#fff"}} onClick={onDelete}>Confirm Delete</button><button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button></>
            : <button className="btn btn-ghost btn-sm" style={{color:"var(--red)", borderColor:"var(--red)"}} onClick={() => setConfirmDelete(true)}>Delete</button>
          }
        </div>
      </div>
      <div className="content">
        <div className="detail-header">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12}}>
            <div>
              <div className="detail-title">{project.name}</div>
              <div className="detail-meta">
                <div className="meta-item"><strong>Client</strong>{project.client}</div>
                <div className="meta-item"><strong>Address</strong>{project.address}</div>
                <div className="meta-item"><strong>PM</strong>{project.pm}</div>
                <div className="meta-item"><strong>Contract</strong><span className="contract-value">{fmtMoney(project.contract)}</span></div>
                <div className="meta-item"><strong>Start</strong>{fmt(project.start)}</div>
                <div className="meta-item"><strong>End</strong>{fmt(project.end)}</div>
              </div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:12}}>
              <span className={`status-badge ${badgeClass[project.status]}`}>{statusLabel[project.status]}</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24, fontFamily:"'Bebas Neue', cursive", color:"var(--amber)"}}>{project.progress}%</div>
                <div style={{fontSize:11, color:"var(--text-dim)", fontFamily:"'IBM Plex Mono', monospace"}}>COMPLETE</div>
              </div>
            </div>
          </div>
          <div className="progress-bar" style={{marginTop:16, height:6}}><div className="progress-fill" style={{width: project.progress + "%"}} /></div>
        </div>
        <div className="tabs">{tabs.map(t => <div key={t} className={`tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>{t.toUpperCase()}</div>)}</div>
        {tab === "timeline" && <TimelineTab project={project} onUpdate={onUpdate} />}
        {tab === "purchase orders" && <POTab project={project} onUpdate={onUpdate} />}
        {tab === "notes" && <NotesTab project={project} onUpdate={onUpdate} />}
        {tab === "checklist" && <ChecklistTab project={project} onUpdate={onUpdate} />}
      </div>
    </>
  );
}

// ── TIMELINE ─────────────────────────────────────────────────────────────────
function TimelineTab({ project, onUpdate }) {
  const [form, setForm] = useState({ name:"", date:"", notes:"" });
  const [adding, setAdding] = useState(false);
  const add = () => {
    if (!form.name || !form.date) return;
    const m = { id: "m"+Date.now(), name:form.name, date:form.date, status:"upcoming", notes:form.notes };
    const sorted = [...project.milestones, m].sort((a,b) => a.date.localeCompare(b.date));
    onUpdate({ milestones: sorted });
    setForm({ name:"", date:"", notes:"" }); setAdding(false);
  };
  const cycle = (id) => {
    const c = { done:"active", active:"upcoming", upcoming:"done" };
    onUpdate({ milestones: project.milestones.map(m => m.id===id ? {...m, status: c[m.status]} : m) });
  };
  const remove = (id) => onUpdate({ milestones: project.milestones.filter(m => m.id!==id) });
  return (
    <div>
      <div className="section-title">Milestones</div>
      {project.milestones.length === 0 && <div className="empty">No milestones yet.</div>}
      <div className="timeline">
        {project.milestones.map(m => (
          <div key={m.id} className="timeline-item">
            <div className={`timeline-dot ${m.status}`} onClick={() => cycle(m.id)} style={{cursor:"pointer"}} title="Click to cycle status" />
            <div className="timeline-content">
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <div>
                  <div className="timeline-name">{m.name}</div>
                  <div className="timeline-date">{fmt(m.date)} · <span style={{color: m.status==="done"?"var(--green)":m.status==="active"?"var(--amber)":"var(--text-dim)"}}>{m.status.toUpperCase()}</span></div>
                  {m.notes && <div className="timeline-notes">{m.notes}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" style={{color:"var(--red)", borderColor:"transparent"}} onClick={() => remove(m.id)}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="add-form">
          <div style={{fontFamily:"'Bebas Neue',cursive", letterSpacing:2, marginBottom:12, color:"var(--amber)"}}>ADD MILESTONE</div>
          <div className="input-row">
            <input placeholder="Milestone name" value={form.name} onChange={e => setForm({...form,name:e.target.value})} />
            <input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})} />
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} style={{marginBottom:12,width:"100%"}} />
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-amber btn-sm" onClick={add}>Add</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : <button className="btn btn-ghost btn-sm" style={{marginTop:16}} onClick={() => setAdding(true)}>+ Add Milestone</button>}
    </div>
  );
}

// ── PO TAB ────────────────────────────────────────────────────────────────────
function POTab({ project, onUpdate }) {
  const [form, setForm] = useState({ po:"", vendor:"", desc:"", amount:"", date:"", status:"Pending" });
  const [adding, setAdding] = useState(false);
  const add = () => {
    if (!form.po || !form.vendor) return;
    onUpdate({ pos: [...project.pos, { ...form, id:"po"+Date.now(), amount: Number(form.amount) }] });
    setForm({ po:"", vendor:"", desc:"", amount:"", date:"", status:"Pending" }); setAdding(false);
  };
  const remove = (id) => onUpdate({ pos: project.pos.filter(p => p.id!==id) });
  const statusColor = { Pending:"var(--yellow)", Approved:"var(--steel)", Received:"var(--green)" };
  const total = project.pos.reduce((s,p) => s+(Number(p.amount)||0), 0);
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <div className="section-title" style={{margin:0}}>Purchase Orders</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:"var(--green)"}}>Total: {fmtMoney(total)}</div>
      </div>
      {project.pos.length === 0 && <div className="empty">No purchase orders yet.</div>}
      {project.pos.length > 0 && (
        <div className="table-wrapper" style={{background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:5, marginBottom:16}}>
          <table>
            <thead><tr><th>P.O. #</th><th>Vendor</th><th>Description</th><th>Amount</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {project.pos.map(p => (
                <tr key={p.id}>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace", color:"var(--amber)"}}>{p.po}</td>
                  <td>{p.vendor}</td>
                  <td style={{color:"var(--text-dim)"}}>{p.desc}</td>
                  <td className="contract-value">{fmtMoney(p.amount)}</td>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:12}}>{fmt(p.date)}</td>
                  <td><span style={{color:statusColor[p.status], fontSize:11, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700}}>{p.status}</span></td>
                  <td><button className="btn btn-ghost btn-sm" style={{color:"var(--red)", borderColor:"transparent"}} onClick={() => remove(p.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {adding ? (
        <div className="add-form">
          <div style={{fontFamily:"'Bebas Neue',cursive", letterSpacing:2, marginBottom:12, color:"var(--amber)"}}>ADD PURCHASE ORDER</div>
          <div className="input-row">
            <input placeholder="P.O. Number" value={form.po} onChange={e => setForm({...form,po:e.target.value})} />
            <input placeholder="Vendor" value={form.vendor} onChange={e => setForm({...form,vendor:e.target.value})} />
          </div>
          <div className="input-row">
            <input placeholder="Description" value={form.desc} onChange={e => setForm({...form,desc:e.target.value})} />
            <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} />
          </div>
          <div className="input-row">
            <input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})} />
            <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
              <option>Pending</option><option>Approved</option><option>Received</option>
            </select>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-amber btn-sm" onClick={add}>Add P.O.</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>+ Add Purchase Order</button>}
    </div>
  );
}

// ── NOTES TAB ─────────────────────────────────────────────────────────────────
function NotesTab({ project, onUpdate }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("internal");
  const [author, setAuthor] = useState("");
  const add = () => {
    if (!text.trim()) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10) + " " + now.toTimeString().slice(0,5);
    const label = author.trim() ? `[${author.trim()}] ${text}` : text;
    onUpdate({ notes: [{ id:"n"+Date.now(), tag, text:label, date:dateStr }, ...project.notes] });
    setText("");
  };
  const remove = (id) => onUpdate({ notes: project.notes.filter(n => n.id!==id) });
  return (
    <div>
      <div className="section-title">Notes & Discussions</div>
      <div style={{background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:5, padding:16, marginBottom:20}}>
        <div className="input-row">
          <input placeholder="Your name (optional)" value={author} onChange={e => setAuthor(e.target.value)} style={{flex:"0 0 180px"}} />
          <select value={tag} onChange={e => setTag(e.target.value)} style={{flex:"0 0 150px"}}>
            <option value="internal">Internal</option>
            <option value="client">Client Call</option>
            <option value="site">Site Visit</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>
        <textarea placeholder="Add a note or discussion entry..." value={text} onChange={e => setText(e.target.value)} style={{marginBottom:10}} />
        <button className="btn btn-amber btn-sm" onClick={add}>Add Note</button>
      </div>
      {project.notes.length === 0 && <div className="empty">No notes yet.</div>}
      {project.notes.map(n => (
        <div key={n.id} className="note-item">
          <div className="note-header">
            <span className={`note-tag tag-${n.tag}`}>{n.tag==="client"?"Client Call":n.tag==="site"?"Site Visit":n.tag==="vendor"?"Vendor":"Internal"}</span>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <span className="note-time">{n.date}</span>
              <button className="btn btn-ghost btn-sm" style={{color:"var(--red)", borderColor:"transparent"}} onClick={() => remove(n.id)}>×</button>
            </div>
          </div>
          <div className="note-text">{n.text}</div>
        </div>
      ))}
    </div>
  );
}

// ── CHECKLIST TAB ─────────────────────────────────────────────────────────────
function ChecklistTab({ project, onUpdate }) {
  const [form, setForm] = useState({ text:"", due:"", priority:"medium" });
  const [adding, setAdding] = useState(false);
  const toggle = (id) => onUpdate({ checklist: project.checklist.map(c => c.id===id ? {...c,done:!c.done} : c) });
  const remove = (id) => onUpdate({ checklist: project.checklist.filter(c => c.id!==id) });
  const add = () => {
    if (!form.text.trim()) return;
    onUpdate({ checklist: [...project.checklist, { id:"c"+Date.now(), text:form.text, due:form.due, priority:form.priority, done:false }] });
    setForm({ text:"", due:"", priority:"medium" }); setAdding(false);
  };
  const open = project.checklist.filter(c => !c.done);
  const done = project.checklist.filter(c => c.done);
  const Item = ({ c }) => (
    <div className={`check-item ${c.done?"done":""}`}>
      <div className={`custom-check ${c.done?"checked":""}`} onClick={() => toggle(c.id)}>
        {c.done && <span style={{fontSize:10,color:"#000",fontWeight:900}}>✓</span>}
      </div>
      <div style={{flex:1}}>
        <div className="check-text">{c.text}</div>
        <div className="check-meta">
          <span className={`priority-badge priority-${c.priority}`}>{c.priority}</span>
          {c.due && <span style={{fontSize:11,color:"var(--text-dim)",fontFamily:"'IBM Plex Mono',monospace"}}>Due {fmt(c.due)}</span>}
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"transparent"}} onClick={() => remove(c.id)}>×</button>
    </div>
  );
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <div className="section-title" style={{margin:0}}>Checklist</div>
        <span style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace",color:"var(--text-dim)"}}>{done.length}/{project.checklist.length} complete</span>
      </div>
      {open.length > 0 && <><div style={{fontSize:11,letterSpacing:2,color:"var(--text-dim)",marginBottom:10,fontFamily:"'IBM Plex Mono',monospace"}}>OPEN</div>{open.map(c => <Item key={c.id} c={c} />)}</>}
      {done.length > 0 && <><div style={{fontSize:11,letterSpacing:2,color:"var(--text-dim)",margin:"20px 0 10px",fontFamily:"'IBM Plex Mono',monospace"}}>COMPLETED</div>{done.map(c => <Item key={c.id} c={c} />)}</>}
      {project.checklist.length === 0 && <div className="empty">No tasks yet.</div>}
      {adding ? (
        <div className="add-form" style={{marginTop:16}}>
          <div style={{fontFamily:"'Bebas Neue',cursive", letterSpacing:2, marginBottom:12, color:"var(--amber)"}}>ADD TASK</div>
          <input placeholder="Task description" value={form.text} onChange={e => setForm({...form,text:e.target.value})} style={{marginBottom:10,width:"100%"}} />
          <div className="input-row">
            <input type="date" value={form.due} onChange={e => setForm({...form,due:e.target.value})} />
            <select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>
              <option value="high">High Priority</option><option value="medium">Medium Priority</option><option value="low">Low Priority</option>
            </select>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-amber btn-sm" onClick={add}>Add Task</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : <button className="btn btn-ghost btn-sm" style={{marginTop:16}} onClick={() => setAdding(true)}>+ Add Task</button>}
    </div>
  );
}

// ── CALENDAR ──────────────────────────────────────────────────────────────────
function CalendarView({ projects, onOpen }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const prev = () => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const next = () => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };
  const allEvents = useMemo(() => {
    const evs = [];
    projects.forEach((p,pi) => p.milestones.forEach(m => evs.push({ date:m.date, label:m.name, projectId:p.id, color:PROJECT_COLORS[pi%PROJECT_COLORS.length] })));
    return evs;
  }, [projects]);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay-1; i >= 0; i--) cells.push({ day:daysInPrev-i, current:false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day:i, current:true });
  while (cells.length%7!==0) cells.push({ day:cells.length-daysInMonth-firstDay+1, current:false });
  const eventsOn = (day, curr) => {
    if (!curr) return [];
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return allEvents.filter(e => e.date===ds);
  };
  return (
    <>
      <div className="topbar"><div className="topbar-title">PROJECT <span>CALENDAR</span></div></div>
      <div className="content">
        <div className="cal-nav">
          <button className="btn btn-ghost btn-sm" onClick={prev}>‹</button>
          <div className="cal-month">{MONTHS[month]} {year}</div>
          <button className="btn btn-ghost btn-sm" onClick={next}>›</button>
        </div>
        <div style={{display:"flex", gap:16, flexWrap:"wrap", marginBottom:16}}>
          {projects.map((p,i) => (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={() => onOpen(p.id)}>
              <div style={{width:10,height:10,borderRadius:2,background:PROJECT_COLORS[i%PROJECT_COLORS.length]}} />
              <span style={{fontSize:11,color:"var(--text-mid)",fontFamily:"'IBM Plex Mono',monospace"}}>{p.name}</span>
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {DAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
          {cells.map((cell,idx) => {
            const evs = eventsOn(cell.day, cell.current);
            const isToday = cell.current && cell.day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
            return (
              <div key={idx} className={`cal-day ${!cell.current?"other-month":""} ${isToday?"today":""}`}>
                <div className="cal-day-num">{cell.day}</div>
                {evs.map((e,ei) => (
                  <div key={ei} className="cal-event" title={e.label}
                    style={{background:e.color+"22",color:e.color,border:`1px solid ${e.color}44`}}
                    onClick={() => onOpen(e.projectId)}>{e.label}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── PROJECT MODAL ─────────────────────────────────────────────────────────────
function ProjectModal({ project, onSave, onClose }) {
  const [form, setForm] = useState({
    name:project?.name||"", client:project?.client||"", address:project?.address||"",
    pm:project?.pm||"", contract:project?.contract||"", status:project?.status||"planning",
    start:project?.start||"", end:project?.end||"", progress:project?.progress||0,
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{project ? "Edit Project" : "New Project"}</div>
        <div className="form-grid">
          <div className="form-group full"><label>Project Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Riverside Office Renovation" /></div>
          <div className="form-group"><label>Client</label><input value={form.client} onChange={e=>set("client",e.target.value)} /></div>
          <div className="form-group"><label>Project Manager</label><input value={form.pm} onChange={e=>set("pm",e.target.value)} /></div>
          <div className="form-group full"><label>Site Address</label><input value={form.address} onChange={e=>set("address",e.target.value)} /></div>
          <div className="form-group"><label>Contract Value ($)</label><input type="number" value={form.contract} onChange={e=>set("contract",e.target.value)} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e=>set("status",e.target.value)}>
              <option value="planning">Planning</option><option value="active">In Progress</option>
              <option value="hold">On Hold</option><option value="complete">Complete</option>
            </select>
          </div>
          <div className="form-group"><label>Start Date</label><input type="date" value={form.start} onChange={e=>set("start",e.target.value)} /></div>
          <div className="form-group"><label>End Date</label><input type="date" value={form.end} onChange={e=>set("end",e.target.value)} /></div>
          <div className="form-group full"><label>Progress — {form.progress}%</label><input type="range" min="0" max="100" value={form.progress} onChange={e=>set("progress",Number(e.target.value))} style={{background:"transparent",border:"none",padding:0}} /></div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-amber" onClick={() => onSave(form)}>Save Project</button>
        </div>
      </div>
    </div>
  );
}
