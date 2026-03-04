import { useState, useMemo, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

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
  .sidebar { width: 220px; min-width: 220px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; position: relative; z-index: 50; transition: transform 0.25s ease; height: 100vh; }
  .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 40; }
  @media (max-width: 768px) {
    .sidebar { position: fixed; top: 0; left: 0; bottom: 0; transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay.open { display: block; }
    .hamburger { display: flex !important; }
    .main { width: 100vw; }
    .content { padding: 14px; }
    .stats-bar { grid-template-columns: repeat(2, 1fr) !important; }
    .projects-grid { grid-template-columns: 1fr !important; }
    .form-grid { grid-template-columns: 1fr !important; }
    .form-group.full { grid-column: 1 !important; }
    .topbar-title { font-size: 18px; }
  }
  .hamburger { display: none; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--border); color: var(--text-mid); border-radius: 4px; width: 36px; height: 36px; cursor: pointer; font-size: 18px; margin-right: 12px; flex-shrink: 0; }
  .hamburger:hover { border-color: var(--amber); color: var(--amber); }
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
  .main { flex: 1; overflow-y: auto; background: var(--bg); min-width: 0; }
  .topbar { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
  .topbar-left { display: flex; align-items: center; flex: 1; min-width: 0; }
  .topbar-title { font-family: 'Bebas Neue', cursive; font-size: 22px; letter-spacing: 2px; color: var(--text); white-space: nowrap; }
  .topbar-title span { color: var(--amber); }
  .btn { padding: 8px 18px; border-radius: 4px; border: none; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 600; transition: all 0.15s; letter-spacing: 0.5px; white-space: nowrap; }
  .btn-amber { background: var(--amber); color: #000; }
  .btn-amber:hover { background: #fbbf24; }
  .btn-ghost { background: transparent; color: var(--text-mid); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--amber); color: var(--amber); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .content { padding: 20px; }
  .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .project-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 20px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
  .project-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .project-card.status-active::before { background: var(--green); }
  .project-card.status-planning::before { background: var(--steel); }
  .project-card.status-hold::before { background: var(--yellow); }
  .project-card.status-complete::before { background: var(--text-dim); }
  .project-card:hover { border-color: var(--amber); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px; }
  .card-name { font-family: 'Bebas Neue', cursive; font-size: 20px; letter-spacing: 1px; color: var(--text); line-height: 1.2; }
  .card-client { font-size: 12px; color: var(--text-dim); margin-top: 2px; font-family: 'IBM Plex Mono', monospace; }
  .status-badge { padding: 3px 10px; border-radius: 3px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; white-space: nowrap; flex-shrink: 0; }
  .badge-active { background: rgba(52,211,153,0.15); color: var(--green); }
  .badge-planning { background: rgba(96,165,250,0.15); color: var(--steel); }
  .badge-hold { background: rgba(251,191,36,0.15); color: var(--yellow); }
  .badge-complete { background: rgba(100,116,139,0.15); color: var(--text-dim); }
  .card-meta { display: flex; gap: 12px; margin: 12px 0; flex-wrap: wrap; }
  .meta-item { font-size: 11px; color: var(--text-dim); font-family: 'IBM Plex Mono', monospace; }
  .meta-item strong { display: block; color: var(--text-mid); margin-bottom: 2px; }
  .progress-bar { height: 4px; background: var(--bg3); border-radius: 2px; margin-top: 12px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; background: var(--amber); transition: width 0.5s; }
  .progress-label { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: var(--text-dim); font-family: 'IBM Plex Mono', monospace; }
  .back-btn { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-dim); font-size: 13px; transition: color 0.15s; }
  .back-btn:hover { color: var(--amber); }
  .detail-header { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 20px; margin-bottom: 16px; }
  .detail-title { font-family: 'Bebas Neue', cursive; font-size: 28px; letter-spacing: 2px; color: var(--text); }
  .detail-meta { display: flex; gap: 20px; margin-top: 12px; flex-wrap: wrap; }
  .tabs { display: flex; gap: 2px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 4px; margin-bottom: 16px; flex-wrap: wrap; }
  .tab { padding: 7px 13px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--text-dim); transition: all 0.15s; white-space: nowrap; }
  .tab:hover { color: var(--text); }
  .tab.active { background: var(--amber); color: #000; font-weight: 700; }
  .timeline { position: relative; padding-left: 28px; }
  .timeline::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: var(--border); }
  .timeline-item { position: relative; margin-bottom: 20px; }
  .timeline-dot { position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border); background: var(--bg); transition: all 0.2s; cursor: pointer; }
  .timeline-dot.done { background: var(--green); border-color: var(--green); }
  .timeline-dot.active { background: var(--amber); border-color: var(--amber); box-shadow: 0 0 0 4px rgba(245,158,11,0.2); }
  .timeline-dot.upcoming { background: var(--bg3); border-color: var(--text-dim); }
  .timeline-content { background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 12px 14px; }
  .timeline-name { font-weight: 600; font-size: 14px; color: var(--text); margin-bottom: 4px; }
  .timeline-date { font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); }
  .timeline-notes { font-size: 12px; color: var(--text-mid); margin-top: 6px; }
  .add-form { background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 16px; margin-top: 16px; }
  .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 500px; }
  th { text-align: left; padding: 10px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); border-bottom: 1px solid var(--border); font-weight: 500; }
  td { padding: 10px 12px; border-bottom: 1px solid rgba(42,51,71,0.5); color: var(--text-mid); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(245,158,11,0.03); color: var(--text); }
  .note-item { background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 14px; margin-bottom: 10px; }
  .note-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px; }
  .note-tag { padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; }
  .tag-client { background: rgba(96,165,250,0.15); color: var(--steel); }
  .tag-site { background: rgba(52,211,153,0.15); color: var(--green); }
  .tag-internal { background: rgba(245,158,11,0.15); color: var(--amber); }
  .tag-vendor { background: rgba(248,113,113,0.15); color: var(--red); }
  .note-time { font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); }
  .note-text { font-size: 13px; color: var(--text-mid); line-height: 1.6; }
  .check-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; margin-bottom: 8px; }
  .check-item.done { opacity: 0.5; }
  .check-item.done .check-text { text-decoration: line-through; color: var(--text-dim); }
  .custom-check { width: 18px; height: 18px; min-width: 18px; border: 2px solid var(--border); border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-top: 1px; }
  .custom-check.checked { background: var(--amber); border-color: var(--amber); }
  .check-text { font-size: 13px; color: var(--text); flex: 1; }
  .check-meta { display: flex; gap: 8px; margin-top: 4px; align-items: center; flex-wrap: wrap; }
  .priority-badge { padding: 1px 7px; border-radius: 2px; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'IBM Plex Mono', monospace; }
  .priority-high { background: rgba(248,113,113,0.15); color: var(--red); }
  .priority-medium { background: rgba(251,191,36,0.15); color: var(--yellow); }
  .priority-low { background: rgba(100,116,139,0.15); color: var(--text-dim); }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .cal-header { background: var(--bg3); padding: 8px 4px; text-align: center; font-size: 10px; font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); font-weight: 500; }
  .cal-day { background: var(--bg2); padding: 6px; min-height: 70px; }
  .cal-day.other-month { background: var(--bg); }
  .cal-day.today { background: rgba(245,158,11,0.06); }
  .cal-day-num { font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); margin-bottom: 3px; }
  .cal-day.today .cal-day-num { color: var(--amber); font-weight: 700; }
  .cal-event { font-size: 9px; padding: 2px 4px; border-radius: 2px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; font-weight: 500; }
  .cal-nav { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
  .cal-month { font-family: 'Bebas Neue', cursive; font-size: 26px; letter-spacing: 2px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 24px; }
  .modal-title { font-family: 'Bebas Neue', cursive; font-size: 24px; letter-spacing: 2px; color: var(--amber); margin-bottom: 20px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 11px; font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); font-weight: 500; }
  input, select, textarea { background: var(--bg3); border: 1px solid var(--border); border-radius: 4px; color: var(--text); padding: 9px 12px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.15s; width: 100%; }
  input:focus, select:focus, textarea:focus { border-color: var(--amber); }
  textarea { resize: vertical; min-height: 80px; }
  select option { background: var(--bg3); }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
  .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 16px; }
  .stat-value { font-family: 'Bebas Neue', cursive; font-size: 32px; letter-spacing: 1px; color: var(--amber); line-height: 1; }
  .stat-label { font-size: 10px; font-family: 'IBM Plex Mono', monospace; color: var(--text-dim); margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .section-title { font-family: 'Bebas Neue', cursive; font-size: 16px; letter-spacing: 2px; color: var(--text-dim); margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .empty { text-align: center; padding: 32px; color: var(--text-dim); font-size: 13px; font-family: 'IBM Plex Mono', monospace; }
  .input-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
  .input-row input, .input-row select { flex: 1; min-width: 120px; }
  .contract-value { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--green); }
  .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg); gap: 16px; }
  .loading-title { font-family: 'Bebas Neue', cursive; font-size: 32px; letter-spacing: 4px; color: var(--amber); }
  .loading-sub { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-dim); letter-spacing: 2px; }
  .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--amber); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .toast { position: fixed; bottom: 20px; right: 20px; left: 20px; max-width: 360px; margin: 0 auto; background: var(--bg2); border: 1px solid var(--border); border-left: 3px solid var(--green); padding: 12px 16px; border-radius: 5px; font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: var(--text-mid); z-index: 200; animation: slideIn 0.2s ease; }
  .toast.error { border-left-color: var(--red); }
  @keyframes slideIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const SEED_PROJECTS = [
  {
    id: "p1", name: "Meridian Office Complex", client: "Meridian Holdings LLC",
    address: "4820 Commerce Blvd, Milwaukee, WI", pm: "Sandra Kowalski",
    contract: 1850000, status: "active", start: "2026-01-15", end: "2026-08-30", progress: 38,
    milestones: [
      { id: "m1", name: "Project Kickoff", date: "2026-01-15", status: "done", notes: "All stakeholders attended." },
      { id: "m2", name: "Demolition Complete", date: "2026-02-20", status: "done", notes: "Floors 2-4 cleared." },
      { id: "m3", name: "MEP Rough-In", date: "2026-04-10", status: "active", notes: "Electrical 60% complete." },
      { id: "m4", name: "Drywall and Insulation", date: "2026-05-22", status: "upcoming", notes: "" },
      { id: "m5", name: "Final Inspection", date: "2026-08-15", status: "upcoming", notes: "" }
    ],
    pos: [
      { id: "po1", po: "PO-2026-001", vendor: "Apex Electrical Supply", desc: "Panel boards and conduit", amount: 48200, date: "2026-01-20", status: "Received" },
      { id: "po2", po: "PO-2026-004", vendor: "Midwest Drywall Co.", desc: "5/8 type-X drywall", amount: 31500, date: "2026-02-05", status: "Approved" }
    ],
    notes: [
      { id: "n1", tag: "client", text: "Client confirmed upgraded lighting package. Will issue change order CO-003.", date: "2026-02-28 14:32" }
    ],
    checklist: [
      { id: "c1", text: "Execute subcontractor agreements", done: true, due: "2026-01-20", priority: "high" },
      { id: "c2", text: "Finalize MEP coordination drawings", done: false, due: "2026-03-15", priority: "high" },
      { id: "c3", text: "Order long-lead HVAC equipment", done: false, due: "2026-03-10", priority: "medium" }
    ]
  },
  {
    id: "p2", name: "Lakefront Retail Buildout", client: "Shoreline Properties Inc.",
    address: "201 Harbor View Dr, Racine, WI", pm: "Tom Braddock",
    contract: 520000, status: "planning", start: "2026-03-01", end: "2026-06-15", progress: 12,
    milestones: [
      { id: "m1", name: "Design Review Approval", date: "2026-02-20", status: "done", notes: "City approved." },
      { id: "m2", name: "Permit Issued", date: "2026-03-05", status: "active", notes: "Awaiting final sign-off." },
      { id: "m3", name: "Tenant Handover", date: "2026-06-10", status: "upcoming", notes: "" }
    ],
    pos: [],
    notes: [],
    checklist: [
      { id: "c1", text: "Issue Notice to Proceed to GC", done: false, due: "2026-03-01", priority: "high" }
    ]
  }
];

const PROJECT_COLORS = ["#f59e0b","#60a5fa","#34d399","#f87171","#a78bfa","#fb923c"];
const DB_DOC = "hollywood-projects";
const COLLECTION = "data";

const fmt = function(d) { return d ? new Date(d + "T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "---"; };
const fmtMoney = function(n) { return n ? "$" + Number(n).toLocaleString() : "---"; };
const statusLabel = { active:"In Progress", planning:"Planning", hold:"On Hold", complete:"Complete" };
const badgeClass = { active:"badge-active", planning:"badge-planning", hold:"badge-hold", complete:"badge-complete" };
const statusCardClass = { active:"status-active", planning:"status-planning", hold:"status-hold", complete:"status-complete" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

async function saveProjects(projects) {
  try {
    const ref = doc(db, COLLECTION, DB_DOC);
    await setDoc(ref, { projects: projects });
    return true;
  } catch(e) {
    console.error("Save error:", e);
    return false;
  }
}

export default function App() {
  const [projects, setProjects] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [syncStatus, setSyncStatus] = useState("syncing");
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = function(msg, type) {
    setToast({ msg: msg, type: type || "success" });
    setTimeout(function() { setToast(null); }, 3000);
  };

  useEffect(function() {
    setSyncStatus("syncing");
    const ref = doc(db, COLLECTION, DB_DOC);
    const unsub = onSnapshot(ref, async function(snap) {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.projects) {
          setProjects(data.projects);
          setSyncStatus("synced");
        }
      } else {
        await saveProjects(SEED_PROJECTS);
        setProjects(SEED_PROJECTS);
        setSyncStatus("synced");
      }
    }, function(err) {
      console.error("Snapshot error:", err);
      setSyncStatus("error");
      showToast("Connection error", "error");
    });
    return function() { unsub(); };
  }, []);

  const updateProject = useCallback(function(id, updates) {
    setProjects(function(ps) {
      const next = ps.map(function(p) { return p.id === id ? Object.assign({}, p, updates) : p; });
      setSyncStatus("syncing");
      saveProjects(next).then(function(ok) { setSyncStatus(ok ? "synced" : "error"); });
      return next;
    });
  }, []);

  const selectedProject = projects ? projects.find(function(p) { return p.id === selectedId; }) : null;

  const saveProject = useCallback(async (data) => {
  setProjects(prev => {
    const next = editingProject
      ? prev.map(p => p.id === editingProject.id ? { ...p, ...data } : p)
      : [...prev, { ...data, id:"p"+Date.now(), milestones:[], pos:[], notes:[], checklist:[], progress: data.progress||0 }];
    localVersion.current += 1;
    persist(next).then(ok => setSyncStatus(ok ? "synced" : "error"));
    setSyncStatus("syncing");
    return next;
  });
  showToast(editingProject ? "Project updated" : "Project created");
  setShowModal(false);
}, [editingProject, showToast]);
  };

  const deleteProject = async function(id) {
    var next = projects.filter(function(p) { return p.id !== id; });
    setSyncStatus("syncing");
    const ok = await saveProjects(next);
    setProjects(next);
    setSyncStatus(ok ? "synced" : "error");
    showToast("Project deleted");
    setView("dashboard");
  };

  if (!projects) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-title">HOLLYWOOD</div>
          <div className="spinner" />
          <div className="loading-sub">CONNECTING TO DATABASE...</div>
        </div>
      </>
    );
  }

  const syncColor = syncStatus === "synced" ? "var(--green)" : syncStatus === "syncing" ? "var(--yellow)" : "var(--red)";
  const syncText = syncStatus === "synced" ? "SYNCED" : syncStatus === "syncing" ? "SAVING..." : "SYNC ERROR";

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className={"sidebar-overlay" + (sidebarOpen ? " open" : "")} onClick={function() { setSidebarOpen(false); }} />
        <div className={"sidebar" + (sidebarOpen ? " open" : "")}>
          <div className="sidebar-logo">HOLLYWOOD<span>PROPERTY SOLUTIONS</span></div>
          <nav className="sidebar-nav">
            <div className={"nav-item" + (view === "dashboard" || view === "detail" ? " active" : "")}
              onClick={function() { setView("dashboard"); setSelectedId(null); setSidebarOpen(false); }}>
              All Projects
            </div>
            <div className={"nav-item" + (view === "calendar" ? " active" : "")}
              onClick={function() { setView("calendar"); setSidebarOpen(false); }}>
              Calendar
            </div>
          </nav>
          <div className="sync-status" style={{color: syncColor}}>
            <div className={"sync-dot " + syncStatus} />
            {syncText}
          </div>
          <div style={{padding:"4px 20px 16px",fontSize:10,color:"var(--text-dim)",fontFamily:"'IBM Plex Mono',monospace",lineHeight:1.5}}>
            Live sync across all team members
          </div>
        </div>
        <div className="main">
          {view === "dashboard" && <Dashboard projects={projects} onOpen={function(id){setSelectedId(id);setView("detail");}} onNew={function(){setEditingProject(null);setShowModal(true);}} setSidebarOpen={setSidebarOpen} />}
          {view === "detail" && selectedProject && <DetailView project={selectedProject} onBack={function(){setView("dashboard");}} onUpdate={function(u){updateProject(selectedProject.id,u);}} onEdit={function(){setEditingProject(selectedProject);setShowModal(true);}} onDelete={function(){deleteProject(selectedProject.id);}} setSidebarOpen={setSidebarOpen} />}
          {view === "calendar" && <CalendarView projects={projects} onOpen={function(id){setSelectedId(id);setView("detail");}} setSidebarOpen={setSidebarOpen} />}
        </div>
      </div>
      {showModal && <ProjectModal project={editingProject} onSave={saveProject} onClose={function(){setShowModal(false);}} />}
      {toast && <div className={"toast" + (toast.type === "error" ? " error" : "")}>{toast.msg}</div>}
    </>
  );
}

function HamburgerBtn(props) {
  return (
    <button className="hamburger" onClick={function() { props.setSidebarOpen(function(o) { return !o; }); }}>
      &#9776;
    </button>
  );
}

function Dashboard(props) {
  var projects = props.projects;
  var active = projects.filter(function(p) { return p.status === "active"; }).length;
  var totalContract = projects.reduce(function(s, p) { return s + (Number(p.contract) || 0); }, 0);
  var totalTasks = projects.reduce(function(s, p) { return s + p.checklist.filter(function(c) { return !c.done; }).length; }, 0);
  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <HamburgerBtn setSidebarOpen={props.setSidebarOpen} />
          <div className="topbar-title">PROJECT <span>DASHBOARD</span></div>
        </div>
        <button className="btn btn-amber" onClick={props.onNew}>+ New Project</button>
      </div>
      <div className="content">
        <div className="stats-bar">
          <div className="stat-card"><div className="stat-value">{projects.length}</div><div className="stat-label">Total Projects</div></div>
          <div className="stat-card"><div className="stat-value">{active}</div><div className="stat-label">Active</div></div>
          <div className="stat-card"><div className="stat-value" style={{fontSize:22}}>{fmtMoney(totalContract)}</div><div className="stat-label">Contract Value</div></div>
          <div className="stat-card"><div className="stat-value">{totalTasks}</div><div className="stat-label">Open Tasks</div></div>
        </div>
        <div className="section-title">Projects</div>
        <div className="projects-grid">
          {projects.map(function(p) {
            return (
              <div key={p.id} className={"project-card " + (statusCardClass[p.status] || "")} onClick={function() { props.onOpen(p.id); }}>
                <div className="card-header">
                  <div><div className="card-name">{p.name}</div><div className="card-client">{p.client}</div></div>
                  <span className={"status-badge " + (badgeClass[p.status] || "")}>{statusLabel[p.status]}</span>
                </div>
                <div className="card-meta">
                  <div className="meta-item"><strong>PM</strong>{p.pm}</div>
                  <div className="meta-item"><strong>Contract</strong><span className="contract-value">{fmtMoney(p.contract)}</span></div>
                  <div className="meta-item"><strong>End Date</strong>{fmt(p.end)}</div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{width: (p.progress || 0) + "%"}} /></div>
                <div className="progress-label"><span>Progress</span><span>{p.progress || 0}%</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function DetailView(props) {
  var project = props.project;
  const [tab, setTab] = useState("timeline");
  const [confirmDelete, setConfirmDelete] = useState(false);
  var tabs = ["timeline","purchase orders","notes","checklist"];
  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <HamburgerBtn setSidebarOpen={props.setSidebarOpen} />
          <div className="back-btn" onClick={props.onBack}>&#8592; Back</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button className="btn btn-ghost btn-sm" onClick={props.onEdit}>Edit</button>
          {confirmDelete ? (
            <>
              <button className="btn btn-sm" style={{background:"var(--red)",color:"#fff",border:"none"}} onClick={props.onDelete}>Confirm</button>
              <button className="btn btn-ghost btn-sm" onClick={function(){setConfirmDelete(false);}}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"var(--red)"}} onClick={function(){setConfirmDelete(true);}}>Delete</button>
          )}
        </div>
      </div>
      <div className="content">
        <div className="detail-header">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
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
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span className={"status-badge " + (badgeClass[project.status] || "")}>{statusLabel[project.status]}</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:22,fontFamily:"'Bebas Neue',cursive",color:"var(--amber)"}}>{project.progress || 0}%</div>
                <div style={{fontSize:10,color:"var(--text-dim)",fontFamily:"'IBM Plex Mono',monospace"}}>COMPLETE</div>
              </div>
            </div>
          </div>
          <div className="progress-bar" style={{marginTop:14,height:5}}>
            <div className="progress-fill" style={{width: (project.progress || 0) + "%"}} />
          </div>
        </div>
        <div className="tabs">
          {tabs.map(function(t) { return <div key={t} className={"tab" + (tab === t ? " active" : "")} onClick={function(){setTab(t);}}>{t.toUpperCase()}</div>; })}
        </div>
        {tab === "timeline" && <TimelineTab project={project} onUpdate={props.onUpdate} />}
        {tab === "purchase orders" && <POTab project={project} onUpdate={props.onUpdate} />}
        {tab === "notes" && <NotesTab project={project} onUpdate={props.onUpdate} />}
        {tab === "checklist" && <ChecklistTab project={project} onUpdate={props.onUpdate} />}
      </div>
    </>
  );
}

function TimelineTab(props) {
  var project = props.project;
  const [form, setForm] = useState({ name:"", date:"", notes:"" });
  const [adding, setAdding] = useState(false);
  const statusColors = { done:"var(--green)", active:"var(--amber)", upcoming:"var(--text-dim)" };
  function add() {
    if (!form.name || !form.date) return;
    var m = { id: "m"+Date.now(), name:form.name, date:form.date, status:"upcoming", notes:form.notes };
    var sorted = project.milestones.concat([m]).sort(function(a,b){return a.date.localeCompare(b.date);});
    props.onUpdate({ milestones: sorted });
    setForm({ name:"", date:"", notes:"" }); setAdding(false);
  }
  function cycle(id) {
    var nxt = { done:"active", active:"upcoming", upcoming:"done" };
    props.onUpdate({ milestones: project.milestones.map(function(m){return m.id===id?Object.assign({},m,{status:nxt[m.status]}):m;}) });
  }
  function remove(id) { props.onUpdate({ milestones: project.milestones.filter(function(m){return m.id!==id;}) }); }
  return (
    <div>
      <div className="section-title">Milestones</div>
      {project.milestones.length === 0 && <div className="empty">No milestones yet.</div>}
      <div className="timeline">
        {project.milestones.map(function(m) {
          return (
            <div key={m.id} className="timeline-item">
              <div className={"timeline-dot " + m.status} onClick={function(){cycle(m.id);}} title="Tap to cycle status" />
              <div className="timeline-content">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div className="timeline-name">{m.name}</div>
                    <div className="timeline-date">{fmt(m.date)} &middot; <span style={{color:statusColors[m.status]}}>{m.status.toUpperCase()}</span></div>
                    {m.notes ? <div className="timeline-notes">{m.notes}</div> : null}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"transparent"}} onClick={function(){remove(m.id);}}>x</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {adding ? (
        <div className="add-form">
          <div style={{fontFamily:"'Bebas Neue',cursive",letterSpacing:2,marginBottom:12,color:"var(--amber)"}}>ADD MILESTONE</div>
          <div className="input-row">
            <input placeholder="Milestone name" value={form.name} onChange={function(e){setForm(Object.assign({},form,{name:e.target.value}));}} />
            <input type="date" value={form.date} onChange={function(e){setForm(Object.assign({},form,{date:e.target.value}));}} />
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={function(e){setForm(Object.assign({},form,{notes:e.target.value}));}} style={{marginBottom:10,width:"100%"}} />
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-amber btn-sm" onClick={add}>Add</button>
            <button className="btn btn-ghost btn-sm" onClick={function(){setAdding(false);}}>Cancel</button>
          </div>
        </div>
      ) : <button className="btn btn-ghost btn-sm" style={{marginTop:14}} onClick={function(){setAdding(true);}}>+ Add Milestone</button>}
    </div>
  );
}

function POTab(props) {
  var project = props.project;
  const [form, setForm] = useState({ po:"", vendor:"", desc:"", amount:"", date:"", status:"Pending" });
  const [adding, setAdding] = useState(false);
  var statusColors = { Pending:"var(--yellow)", Approved:"var(--steel)", Received:"var(--green)" };
  var total = project.pos.reduce(function(s,p){return s+(Number(p.amount)||0);},0);
  function add() {
    if (!form.po || !form.vendor) return;
    props.onUpdate({ pos: project.pos.concat([Object.assign({},form,{id:"po"+Date.now(),amount:Number(form.amount)})]) });
    setForm({ po:"", vendor:"", desc:"", amount:"", date:"", status:"Pending" }); setAdding(false);
  }
  function remove(id) { props.onUpdate({ pos: project.pos.filter(function(p){return p.id!==id;}) }); }
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="section-title" style={{margin:0}}>Purchase Orders</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"var(--green)"}}>Total: {fmtMoney(total)}</div>
      </div>
      {project.pos.length === 0 && <div className="empty">No purchase orders yet.</div>}
      {project.pos.length > 0 && (
        <div className="table-wrapper" style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:5,marginBottom:14}}>
          <table>
            <thead><tr><th>P.O. #</th><th>Vendor</th><th>Description</th><th>Amount</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {project.pos.map(function(p) {
                return (
                  <tr key={p.id}>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",color:"var(--amber)"}}>{p.po}</td>
                    <td>{p.vendor}</td><td style={{color:"var(--text-dim)"}}>{p.desc}</td>
                    <td className="contract-value">{fmtMoney(p.amount)}</td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>{fmt(p.date)}</td>
                    <td><span style={{color:statusColors[p.status],fontSize:11,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>{p.status}</span></td>
                    <td><button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"transparent"}} onClick={function(){remove(p.id);}}>x</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {adding ? (
        <div className="add-form">
          <div style={{fontFamily:"'Bebas Neue',cursive",letterSpacing:2,marginBottom:12,color:"var(--amber)"}}>ADD PURCHASE ORDER</div>
          <div className="input-row">
            <input placeholder="P.O. Number" value={form.po} onChange={function(e){setForm(Object.assign({},form,{po:e.target.value}));}} />
            <input placeholder="Vendor" value={form.vendor} onChange={function(e){setForm(Object.assign({},form,{vendor:e.target.value}));}} />
          </div>
          <div className="input-row">
            <input placeholder="Description" value={form.desc} onChange={function(e){setForm(Object.assign({},form,{desc:e.target.value}));}} />
            <input placeholder="Amount" type="number" value={form.amount} onChange={function(e){setForm(Object.assign({},form,{amount:e.target.value}));}} />
          </div>
          <div className="input-row">
            <input type="date" value={form.date} onChange={function(e){setForm(Object.assign({},form,{date:e.target.value}));}} />
            <select value={form.status} onChange={function(e){setForm(Object.assign({},form,{status:e.target.value}));}}><option>Pending</option><option>Approved</option><option>Received</option></select>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-amber btn-sm" onClick={add}>Add P.O.</button>
            <button className="btn btn-ghost btn-sm" onClick={function(){setAdding(false);}}>Cancel</button>
          </div>
        </div>
      ) : <button className="btn btn-ghost btn-sm" onClick={function(){setAdding(true);}}>+ Add Purchase Order</button>}
    </div>
  );
}

function NotesTab(props) {
  var project = props.project;
  const [text, setText] = useState("");
  const [tag, setTag] = useState("internal");
  const [author, setAuthor] = useState("");
  var tagLabels = { client:"Client Call", site:"Site Visit", vendor:"Vendor", internal:"Internal" };
  function add() {
    if (!text.trim()) return;
    var now = new Date();
    var dateStr = now.toISOString().slice(0,10) + " " + now.toTimeString().slice(0,5);
    var label = author.trim() ? "[" + author.trim() + "] " + text : text;
    props.onUpdate({ notes: [{ id:"n"+Date.now(), tag:tag, text:label, date:dateStr }].concat(project.notes) });
    setText("");
  }
  function remove(id) { props.onUpdate({ notes: project.notes.filter(function(n){return n.id!==id;}) }); }
  return (
    <div>
      <div className="section-title">Notes and Discussions</div>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:5,padding:14,marginBottom:16}}>
        <div className="input-row">
          <input placeholder="Your name (optional)" value={author} onChange={function(e){setAuthor(e.target.value);}} style={{flex:"0 0 160px"}} />
          <select value={tag} onChange={function(e){setTag(e.target.value);}}>
            <option value="internal">Internal</option><option value="client">Client Call</option>
            <option value="site">Site Visit</option><option value="vendor">Vendor</option>
          </select>
        </div>
        <textarea placeholder="Add a note..." value={text} onChange={function(e){setText(e.target.value);}} style={{marginBottom:10}} />
        <button className="btn btn-amber btn-sm" onClick={add}>Add Note</button>
      </div>
      {project.notes.length === 0 && <div className="empty">No notes yet.</div>}
      {project.notes.map(function(n) {
        return (
          <div key={n.id} className="note-item">
            <div className="note-header">
              <span className={"note-tag tag-" + n.tag}>{tagLabels[n.tag]}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span className="note-time">{n.date}</span>
                <button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"transparent"}} onClick={function(){remove(n.id);}}>x</button>
              </div>
            </div>
            <div className="note-text">{n.text}</div>
          </div>
        );
      })}
    </div>
  );
}

function ChecklistTab(props) {
  var project = props.project;
  const [form, setForm] = useState({ text:"", due:"", priority:"medium" });
  const [adding, setAdding] = useState(false);
  function toggle(id) { props.onUpdate({ checklist: project.checklist.map(function(c){return c.id===id?Object.assign({},c,{done:!c.done}):c;}) }); }
  function remove(id) { props.onUpdate({ checklist: project.checklist.filter(function(c){return c.id!==id;}) }); }
  function add() {
    if (!form.text.trim()) return;
    props.onUpdate({ checklist: project.checklist.concat([{ id:"c"+Date.now(), text:form.text, due:form.due, priority:form.priority, done:false }]) });
    setForm({ text:"", due:"", priority:"medium" }); setAdding(false);
  }
  var open = project.checklist.filter(function(c){return !c.done;});
  var done = project.checklist.filter(function(c){return c.done;});
  function Item(p) {
    var c = p.c;
    return (
      <div className={"check-item" + (c.done ? " done" : "")}>
        <div className={"custom-check" + (c.done ? " checked" : "")} onClick={function(){toggle(c.id);}}>
          {c.done ? <span style={{fontSize:10,color:"#000",fontWeight:900}}>&#10003;</span> : null}
        </div>
        <div style={{flex:1}}>
          <div className="check-text">{c.text}</div>
          <div className="check-meta">
            <span className={"priority-badge priority-" + c.priority}>{c.priority}</span>
            {c.due ? <span style={{fontSize:11,color:"var(--text-dim)",fontFamily:"'IBM Plex Mono',monospace"}}>Due {fmt(c.due)}</span> : null}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"transparent"}} onClick={function(){remove(c.id);}}>x</button>
      </div>
    );
  }
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="section-title" style={{margin:0}}>Checklist</div>
        <span style={{fontSize:11,fontFamily:"'IBM Plex Mono',monospace",color:"var(--text-dim)"}}>{done.length}/{project.checklist.length} complete</span>
      </div>
      {open.length > 0 && <><div style={{fontSize:10,letterSpacing:2,color:"var(--text-dim)",marginBottom:8,fontFamily:"'IBM Plex Mono',monospace"}}>OPEN</div>{open.map(function(c){return <Item key={c.id} c={c} />;})}</>}
      {done.length > 0 && <><div style={{fontSize:10,letterSpacing:2,color:"var(--text-dim)",margin:"16px 0 8px",fontFamily:"'IBM Plex Mono',monospace"}}>COMPLETED</div>{done.map(function(c){return <Item key={c.id} c={c} />;})}</>}
      {project.checklist.length === 0 && <div className="empty">No tasks yet.</div>}
      {adding ? (
        <div className="add-form" style={{marginTop:14}}>
          <div style={{fontFamily:"'Bebas Neue',cursive",letterSpacing:2,marginBottom:12,color:"var(--amber)"}}>ADD TASK</div>
          <input placeholder="Task description" value={form.text} onChange={function(e){setForm(Object.assign({},form,{text:e.target.value}));}} style={{marginBottom:10,width:"100%"}} />
          <div className="input-row">
            <input type="date" value={form.due} onChange={function(e){setForm(Object.assign({},form,{due:e.target.value}));}} />
            <select value={form.priority} onChange={function(e){setForm(Object.assign({},form,{priority:e.target.value}));}}>
              <option value="high">High Priority</option><option value="medium">Medium Priority</option><option value="low">Low Priority</option>
            </select>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-amber btn-sm" onClick={add}>Add Task</button>
            <button className="btn btn-ghost btn-sm" onClick={function(){setAdding(false);}}>Cancel</button>
          </div>
        </div>
      ) : <button className="btn btn-ghost btn-sm" style={{marginTop:14}} onClick={function(){setAdding(true);}}>+ Add Task</button>}
    </div>
  );
}

function CalendarView(props) {
  var projects = props.projects;
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const allEvents = useMemo(function() {
    var evs = [];
    projects.forEach(function(p,pi) {
      (p.milestones || []).forEach(function(m) {
        evs.push({ date:m.date, label:m.name, projectId:p.id, color:PROJECT_COLORS[pi%PROJECT_COLORS.length] });
      });
    });
    return evs;
  }, [projects]);
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var daysInPrev = new Date(year, month, 0).getDate();
  var cells = [];
  for (var i = firstDay-1; i >= 0; i--) cells.push({ day:daysInPrev-i, current:false });
  for (var j = 1; j <= daysInMonth; j++) cells.push({ day:j, current:true });
  while (cells.length%7!==0) cells.push({ day:cells.length-daysInMonth-firstDay+1, current:false });
  function eventsOn(day, curr) {
    if (!curr) return [];
    var ds = year + "-" + String(month+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
    return allEvents.filter(function(e){return e.date===ds;});
  }
  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <HamburgerBtn setSidebarOpen={props.setSidebarOpen} />
          <div className="topbar-title">PROJECT <span>CALENDAR</span></div>
        </div>
      </div>
      <div className="content">
        <div className="cal-nav">
          <button className="btn btn-ghost btn-sm" onClick={function(){if(month===0){setMonth(11);setYear(function(y){return y-1;});}else setMonth(function(m){return m-1;});}}>&#8249;</button>
          <div className="cal-month">{MONTHS[month]} {year}</div>
          <button className="btn btn-ghost btn-sm" onClick={function(){if(month===11){setMonth(0);setYear(function(y){return y+1;});}else setMonth(function(m){return m+1;});}}>&#8250;</button>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
          {projects.map(function(p,i){return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}} onClick={function(){props.onOpen(p.id);}}><div style={{width:9,height:9,borderRadius:2,background:PROJECT_COLORS[i%PROJECT_COLORS.length]}}/><span style={{fontSize:10,color:"var(--text-mid)",fontFamily:"'IBM Plex Mono',monospace"}}>{p.name}</span></div>);})}
        </div>
        <div className="calendar-grid">
          {DAYS.map(function(d){return <div key={d} className="cal-header">{d}</div>;})}
          {cells.map(function(cell,idx){
            var evs = eventsOn(cell.day, cell.current);
            var isToday = cell.current && cell.day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
            return (
              <div key={idx} className={"cal-day" + (!cell.current?" other-month":"") + (isToday?" today":"")}>
                <div className="cal-day-num">{cell.day}</div>
                {evs.map(function(e,ei){return(<div key={ei} className="cal-event" title={e.label} style={{background:e.color+"22",color:e.color,border:"1px solid "+e.color+"44"}} onClick={function(){props.onOpen(e.projectId);}}>{e.label}</div>);})}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ProjectModal(props) {
  var project = props.project;
  const [form, setForm] = useState({
    name: project ? project.name : "", client: project ? project.client : "",
    address: project ? project.address : "", pm: project ? project.pm : "",
    contract: project ? project.contract : "", status: project ? project.status : "planning",
    start: project ? project.start : "", end: project ? project.end : "",
    progress: project ? project.progress : 0
  });
  function set(k,v) { setForm(function(f){return Object.assign({},f,{[k]:v});}); }
  return (
    <div className="modal-overlay" onClick={function(e){if(e.target===e.currentTarget)props.onClose();}}>
      <div className="modal">
        <div className="modal-title">{project ? "Edit Project" : "New Project"}</div>
        <div className="form-grid">
          <div className="form-group full"><label>Project Name</label><input value={form.name} onChange={function(e){set("name",e.target.value);}} placeholder="e.g. Riverside Office Renovation" /></div>
          <div className="form-group"><label>Client</label><input value={form.client} onChange={function(e){set("client",e.target.value);}} /></div>
          <div className="form-group"><label>Project Manager</label><input value={form.pm} onChange={function(e){set("pm",e.target.value);}} /></div>
          <div className="form-group full"><label>Site Address</label><input value={form.address} onChange={function(e){set("address",e.target.value);}} /></div>
          <div className="form-group"><label>Contract Value ($)</label><input type="number" value={form.contract} onChange={function(e){set("contract",e.target.value);}} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={function(e){set("status",e.target.value);}}>
              <option value="planning">Planning</option><option value="active">In Progress</option>
              <option value="hold">On Hold</option><option value="complete">Complete</option>
            </select>
          </div>
          <div className="form-group"><label>Start Date</label><input type="date" value={form.start} onChange={function(e){set("start",e.target.value);}} /></div>
          <div className="form-group"><label>End Date</label><input type="date" value={form.end} onChange={function(e){set("end",e.target.value);}} /></div>
          <div className="form-group full"><label>Progress - {form.progress}%</label><input type="range" min="0" max="100" value={form.progress} onChange={function(e){set("progress",Number(e.target.value));}} style={{background:"transparent",border:"none",padding:0}} /></div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={props.onClose}>Cancel</button>
          <button className="btn btn-amber" onClick={function(){props.onSave(form);}}>Save Project</button>
        </div>
      </div>
    </div>
  );
}
