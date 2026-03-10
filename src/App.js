import React, { useState, useMemo, useEffect } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxhf3YWW1k2kJpM_0bvk_q_9g_CDay1RgzbJvmjy7WOe-qHIUY_nhC8MRE6WjcP98vfxA/exec";

const DEPARTMENTS_INIT = [
  { id: "achats", name: "Achats", manager: "DEWINGAERDEN Gauthier", headcount: 1, pillar: "P2S" },
  { id: "commercial", name: "Commercial", manager: "COLON Maxime", headcount: 6, pillar: "O2C" },
  { id: "compta", name: "Comptabilité", manager: "TONGLET Justine", headcount: 3, pillar: "E2O" },
  { id: "cs", name: "Customer Service", manager: "MALSCHALCK Jessica", headcount: 6, pillar: "O2C" },
  { id: "direction", name: "Direction", manager: "COLON Thibault", headcount: 6, pillar: "E2O" },
  { id: "dosettes", name: "Dosettes", manager: "Responsables atelier", headcount: 44, pillar: "P2S" },
  { id: "entretien", name: "Entretien", manager: "HENNAUT Cédric", headcount: 21, pillar: "E2O" },
  { id: "enviro", name: "Environnement", manager: "SNEESSENS Martin", headcount: 1, pillar: "E2O" },
  { id: "expedition", name: "Expédition", manager: "DEWAELE Alain", headcount: 16, pillar: "O2C" },
  { id: "facility", name: "Facility", manager: "GODART Olivier", headcount: 0, pillar: "E2O" },
  { id: "it", name: "IT", manager: "DESPONTIN Audric", headcount: 2, pillar: "E2O" },
  { id: "labelling", name: "Labelling", manager: "COLAS Germain", headcount: 3, pillar: "O2C" },
  { id: "logistique", name: "Logistique", manager: "RAFFA Giulia", headcount: 5, pillar: "O2C" },
  { id: "manager", name: "Manager", manager: "WARNANT Hervé", headcount: 8, pillar: "E2O" },
  { id: "packaging", name: "Packaging", manager: "DEWAELE Alain", headcount: 0, pillar: "P2S" },
  { id: "pesees", name: "Pesées", manager: "COMPERE Anaïs", headcount: 24, pillar: "P2S" },
  { id: "planning", name: "Planning", manager: "LESSIRE Olivier", headcount: 4, pillar: "P2S" },
  { id: "production", name: "Production", manager: "HENNAUT Cédric", headcount: 92, pillar: "P2S" },
  { id: "qualite", name: "Qualité", manager: "SNEESSENS Martin", headcount: 5, pillar: "P2S" },
  { id: "rd", name: "R&D", manager: "VERCRUYSSE Ellen", headcount: 3, pillar: "P2S" },
  { id: "rh", name: "RH", manager: "HERBELIN Laurence", headcount: 5, pillar: "E2O" },
  { id: "reception", name: "Réception", manager: "DEWAELE Alain", headcount: 10, pillar: "P2S" },
  { id: "supplychain", name: "Supply Chain", manager: "JONET Olivier", headcount: 1, pillar: "P2S" },
  { id: "securite", name: "Sécurité", manager: "DECHAMBRE Bernard", headcount: 2, pillar: "E2O" },
  { id: "technique", name: "Technique", manager: "GREGOIRE Frédéric", headcount: 12, pillar: "E2O" },
];

const PILLARS = {
  P2S: { label: "Produce-to-Stock", short: "P2S", color: "#e67e22", bg: "#fef3e2", icon: "🏭", desc: "De la matière première au produit fini stocké" },
  O2C: { label: "Order-to-Cash", short: "O2C", color: "#27ae60", bg: "#e8f8f0", icon: "📦", desc: "De la commande client à l'encaissement" },
  E2O: { label: "Enable-to-Operate", short: "E2O", color: "#2980b9", bg: "#e8f4fd", icon: "⚙️", desc: "Fonctions support & infrastructure transversale" },
};

const FREQUENCIES = ["Journalier", "Hebdomadaire", "Bi-hebdomadaire", "Mensuel", "Trimestriel", "Ponctuel"];
const TASK_TEMPLATE = { TaskID: "", DeptID: "", TaskName: "", Software: "", Frequency: "Journalier", Notes: "", Deps: "", CreatedAt: "", Version: "1" };
function uid() { return "T" + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase(); }

// ── API ───────────────────────────────────────────────────────────────────────
async function apiFetch(params) {
  const url = API_URL + "?" + new URLSearchParams(params).toString();
  const res = await fetch(url, { redirect: "follow" });
  return res.json();
}
async function apiSaveTask(task) {
  const url = API_URL + "?action=saveTask&task=" + encodeURIComponent(JSON.stringify(task));
  const res = await fetch(url, { redirect: "follow" });
  return res.json();
}
async function apiDeleteTask(taskId) {
  const url = API_URL + "?action=deleteTask&taskId=" + encodeURIComponent(taskId);
  const res = await fetch(url, { redirect: "follow" });
  return res.json();
}
async function apiAddSoftware(name) {
  const url = API_URL + "?action=addSoftware&name=" + encodeURIComponent(name);
  const res = await fetch(url, { redirect: "follow" });
  return res.json();
}

// ── MERMAID ───────────────────────────────────────────────────────────────────
function generateMermaid(tasks) {
  if (!tasks.length) return "flowchart LR\n  A[Aucune tâche encodée]";
  const lines = ["flowchart TD", "  %% Colona BPA"];
  Object.entries(PILLARS).forEach(([pk, pv]) => {
    const depts = DEPARTMENTS_INIT.filter(d => d.pillar === pk);
    const active = depts.filter(d => tasks.find(t => t.DeptID === d.id));
    if (!active.length) return;
    lines.push(`  subgraph ${pk}["${pv.icon} ${pv.label}"]`);
    active.forEach(d => {
      const tl = tasks.filter(t => t.DeptID === d.id);
      lines.push(`    ${d.id}["${d.name}\\n(${tl.length} tâche${tl.length > 1 ? "s" : ""})"]`);
    });
    lines.push("  end");
  });
  const seen = new Set();
  tasks.forEach(t => {
    const deps = t.Deps ? t.Deps.split(",").map(s => s.trim()).filter(Boolean) : [];
    deps.forEach(did => {
      const key = `${t.DeptID}->${did}`;
      if (!seen.has(key) && t.DeptID !== did) {
        seen.add(key);
        const lbl = t.TaskName.length > 18 ? t.TaskName.slice(0, 16) + "…" : t.TaskName;
        lines.push(`  ${t.DeptID} -->|"${lbl}"| ${did}`);
      }
    });
  });
  return lines.join("\n");
}

function generateMermaidPillar(tasks, pk) {
  const depts = DEPARTMENTS_INIT.filter(d => d.pillar === pk);
  const rel = tasks.filter(t => depts.find(d => d.id === t.DeptID));
  if (!rel.length) return `flowchart LR\n  A["Aucune tâche pour ce pilier"]`;
  const lines = [`flowchart LR`, `  %% ${PILLARS[pk].label}`];
  depts.forEach(d => {
    const ts = rel.filter(t => t.DeptID === d.id);
    if (ts.length) {
      lines.push(`  ${d.id}(["🔹 ${d.name}"])`);
      ts.forEach(t => {
        const tid = `${d.id}_${t.TaskID}`;
        lines.push(`  ${tid}["${t.TaskName}\\n📅 ${t.Frequency}\\n💻 ${t.Software || "N/A"}"]`);
        lines.push(`  ${d.id} --> ${tid}`);
      });
    }
  });
  return lines.join("\n");
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Badge({ pillar }) {
  const p = PILLARS[pillar];
  if (!p) return null;
  return <span style={{ background: p.color, color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{p.icon} {p.short}</span>;
}

function Spinner() {
  return <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #e67e22", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", verticalAlign: "middle", marginRight: 8 }} />;
}

function MermaidBlock({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: "#0f1117", borderRadius: 10, overflow: "hidden", border: "1px solid #2a2d3a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "#1a1d2e", borderBottom: "1px solid #2a2d3a" }}>
        <span style={{ color: "#7c83a0", fontSize: 12, fontFamily: "monospace" }}>mermaid</span>
        <button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ background: copied ? "#27ae60" : "#2a2d3a", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>
          {copied ? "✓ Copié !" : "📋 Copier"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", color: "#a8d8ea", fontSize: 12, overflowX: "auto", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{code}</pre>
      <div style={{ padding: "8px 14px", background: "#1a1d2e", borderTop: "1px solid #2a2d3a", fontSize: 11, color: "#555" }}>
        💡 Coller sur <strong style={{ color: "#7c83a0" }}>mermaid.live</strong> pour visualiser
      </div>
    </div>
  );
}

// ── SOFTWARE SELECTOR ─────────────────────────────────────────────────────────
function SoftwareSelector({ value, onChange, softwares, onSoftwareAdded, showSync }) {
  const [isOther, setIsOther] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [saveToList, setSaveToList] = useState(false);
  const [savingsw, setSavingsw] = useState(false);

  // When editing a task whose software isn't in the list
  useEffect(() => {
    if (value && !softwares.find(s => s.name === value)) {
      setIsOther(true);
      setCustomValue(value);
    }
  }, []);

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === "__other__") {
      setIsOther(true);
      setCustomValue("");
      onChange("");
    } else {
      setIsOther(false);
      setCustomValue("");
      setSaveToList(false);
      onChange(val);
    }
  };

  const handleCustomChange = (e) => {
    setCustomValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSave = async () => {
    if (!customValue.trim()) return;
    setSavingsw(true);
    try {
      const res = await apiAddSoftware(customValue.trim());
      if (res.status === "ok") {
        onSoftwareAdded({ id: res.id, name: res.name });
        showSync("ok", `✅ "${res.name}" ajouté à la liste des logiciels !`);
        setSaveToList(false);
        setIsOther(false);
        onChange(res.name);
      } else if (res.status === "duplicate") {
        showSync("error", `⚠️ "${customValue}" existe déjà dans la liste.`);
        setSaveToList(false);
      }
    } catch {
      showSync("error", "❌ Erreur lors de l'ajout.");
    }
    setSavingss(false);
  };

  const sel = { width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 14, background: "#fafafa", fontFamily: "inherit" };
  const inp = { flex: 1, padding: "9px 12px", border: "1.5px solid #e67e22", borderRadius: 7, fontSize: 14, background: "#fffaf5", fontFamily: "inherit", outline: "none" };

  return (
    <div>
      <select style={sel} value={isOther ? "__other__" : (value || "")} onChange={handleSelect}>
        <option value="">— Choisir un logiciel —</option>
        {softwares.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        <option value="__other__">✏️ Autre (préciser…)</option>
      </select>

      {isOther && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={inp} placeholder="Précise le logiciel / outil…" value={customValue} onChange={handleCustomChange} autoFocus />
            <button onClick={() => { setIsOther(false); setCustomValue(""); setSaveToList(false); onChange(""); }}
              style={{ background: "#f0f0f0", border: "none", borderRadius: 7, padding: "9px 12px", cursor: "pointer", color: "#666", fontFamily: "inherit" }}>✕</button>
          </div>

          {customValue.trim().length > 0 && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff9f3", borderRadius: 8, border: "1px solid #ffe0b2" }}>
              <input type="checkbox" id="saveCb" checked={saveToList} onChange={e => setSaveToList(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#e67e22" }} />
              <label htmlFor="saveCb" style={{ fontSize: 13, color: "#555", cursor: "pointer", flex: 1 }}>
                Enregistrer <strong>"{customValue}"</strong> dans la liste pour réutilisation future
              </label>
              {saveToList && (
                <button onClick={handleSave} disabled={savingss}
                  style={{ background: savingss ? "#ccc" : "#e67e22", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {savingss ? <><Spinner />Ajout…</> : "💾 Ajouter à la liste"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("overview");
  const [tasks, setTasks] = useState([]);
  const [softwares, setSoftwares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [form, setForm] = useState({ ...TASK_TEMPLATE });
  const [editId, setEditId] = useState(null);
  const [filterPillar, setFilterPillar] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [mermaidMode, setMermaidMode] = useState("global");
  const [versionLog, setVersionLog] = useState([{ v: 1, ts: new Date().toLocaleString("fr-BE"), desc: "Connexion à Google Sheets…" }]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch({ action: "getTasks" }),
      apiFetch({ action: "getSoftwares" }),
    ]).then(([td, sd]) => {
      if (td.status === "ok") setTasks(td.tasks || []);
      if (sd.status === "ok") setSoftwares(sd.softwares || []);
      setVersionLog(l => [...l, {
        v: 2, ts: new Date().toLocaleString("fr-BE"),
        desc: `✅ ${td.tasks?.length || 0} tâche(s) et ${sd.softwares?.length || 0} logiciel(s) chargés`
      }]);
    }).catch(() => showSync("error", "❌ Impossible de contacter Google Sheets."))
      .finally(() => setLoading(false));
  }, []);

  const showSync = (type, text) => { setSyncMsg({ type, text }); setTimeout(() => setSyncMsg(null), 4000); };

  const saveTask = async () => {
    if (!form.DeptID || !form.TaskName) return;
    setSaving(true);
    const task = { ...form, TaskID: editId || uid(), CreatedAt: form.CreatedAt || new Date().toLocaleString("fr-BE"), Version: String(tasks.length + 1) };
    try {
      await apiSaveTask(task);
      if (editId) {
        setTasks(p => p.map(t => t.TaskID === editId ? task : t));
        setVersionLog(l => [...l, { v: l.length + 1, ts: new Date().toLocaleString("fr-BE"), desc: `✏️ Modification: "${task.TaskName}"` }]);
        showSync("ok", "✅ Tâche modifiée et sauvegardée !");
      } else {
        setTasks(p => [...p, task]);
        setVersionLog(l => [...l, { v: l.length + 1, ts: new Date().toLocaleString("fr-BE"), desc: `➕ Ajout: "${task.TaskName}" → ${task.DeptID}` }]);
        showSync("ok", "✅ Tâche sauvegardée dans Google Sheets !");
      }
      setForm({ ...TASK_TEMPLATE });
      setEditId(null);
    } catch { showSync("error", "❌ Erreur de sauvegarde."); }
    setSaving(false);
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    try {
      await apiDeleteTask(id);
      setTasks(p => p.filter(t => t.TaskID !== id));
      setVersionLog(l => [...l, { v: l.length + 1, ts: new Date().toLocaleString("fr-BE"), desc: `🗑️ Suppression tâche ${id}` }]);
      showSync("ok", "✅ Tâche supprimée.");
    } catch { showSync("error", "❌ Erreur lors de la suppression."); }
  };

  const editTask = (t) => { setForm({ ...t }); setEditId(t.TaskID); setTab("input"); };

  const filteredTasks = useMemo(() => tasks.filter(t =>
    (filterPillar === "ALL" || DEPARTMENTS_INIT.find(d => d.id === t.DeptID)?.pillar === filterPillar) &&
    (filterDept === "ALL" || t.DeptID === filterDept)
  ), [tasks, filterPillar, filterDept]);

  const mermaidCode = useMemo(() =>
    mermaidMode === "global" ? generateMermaid(tasks) : generateMermaidPillar(tasks, mermaidMode),
    [tasks, mermaidMode]);

  const totalHC = DEPARTMENTS_INIT.reduce((a, b) => a + b.headcount, 0);
  const deptsByPillar = (pk) => DEPARTMENTS_INIT.filter(d => d.pillar === pk);
  const tasksByDept = (id) => tasks.filter(t => t.DeptID === id);

  const S = {
    app: { fontFamily: "'Segoe UI', Trebuchet MS, sans-serif", background: "#f5f4f0", minHeight: "100vh", color: "#1a1a2e" },
    header: { background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 60%, #3d2b1f 100%)", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    tabs: { display: "flex", background: "#fff", borderBottom: "2px solid #e0ddd5", padding: "0 24px", overflowX: "auto" },
    tab: (a) => ({ padding: "14px 18px", border: "none", background: "none", cursor: "pointer", fontWeight: a ? 700 : 500, color: a ? "#e67e22" : "#666", borderBottom: a ? "3px solid #e67e22" : "3px solid transparent", marginBottom: -2, fontSize: 13, whiteSpace: "nowrap", fontFamily: "inherit" }),
    body: { padding: "24px 32px", maxWidth: 1100, margin: "0 auto" },
    card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 20 },
    input: { width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 14, boxSizing: "border-box", background: "#fafafa", fontFamily: "inherit" },
    select: { width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 7, fontSize: 14, boxSizing: "border-box", background: "#fafafa", fontFamily: "inherit" },
    label: { fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 },
    btn: (c) => ({ background: c, color: "#fff", border: "none", borderRadius: 7, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }),
    pill: (c, bg) => ({ background: bg, color: c, border: `1px solid ${c}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, display: "inline-block" }),
    th: { padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", background: "#f9f8f5", borderBottom: "1px solid #eee" },
    td: { padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #f0efeb", verticalAlign: "middle" },
  };

  return (
    <div style={S.app}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } tr:hover td { background: #fafafa; }`}</style>

      <div style={S.header}>
        <div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>🌿 COLONA — Waremme</div>
          <div style={{ color: "#e67e22", fontSize: 13, fontWeight: 600, letterSpacing: 3, marginTop: 2 }}>Business Process Analysis Tool</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#e67e22", fontWeight: 700, fontSize: 18 }}>{loading ? <><Spinner />Chargement…</> : `${tasks.length} tâche${tasks.length !== 1 ? "s" : ""}`}</div>
          <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>{loading ? "Connexion à Google Sheets…" : "✅ Synchronisé avec Google Sheets"}</div>
        </div>
      </div>

      {syncMsg && (
        <div style={{ background: syncMsg.type === "ok" ? "#e8f8f0" : "#fdecea", borderBottom: `3px solid ${syncMsg.type === "ok" ? "#27ae60" : "#e74c3c"}`, padding: "10px 32px", fontSize: 13, fontWeight: 600, color: syncMsg.type === "ok" ? "#27ae60" : "#e74c3c" }}>
          {syncMsg.text}
        </div>
      )}

      <div style={S.tabs}>
        {[["overview","🏠 Vue d'ensemble"],["input","✏️ Saisie"],["tasks","📋 Tâches"],["taxonomy","🗂️ Taxonomie"],["mermaid","📊 Mermaid"],["versioning","🕓 Historique"],["softwares","💻 Logiciels"]].map(([k,l]) => (
          <button key={k} style={S.tab(tab === k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={S.body}>

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              {Object.entries(PILLARS).map(([pk, pv]) => (
                <div key={pk} style={{ background: pv.color, borderRadius: 12, padding: "20px 24px", color: "#fff" }}>
                  <div style={{ fontSize: 28 }}>{pv.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>{pv.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{pv.desc}</div>
                  <div style={{ marginTop: 14, display: "flex", gap: 20 }}>
                    <div><div style={{ fontSize: 22, fontWeight: 800 }}>{deptsByPillar(pk).length}</div><div style={{ fontSize: 10, opacity: 0.8 }}>depts</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 800 }}>{deptsByPillar(pk).reduce((a,d)=>a+d.headcount,0)}</div><div style={{ fontSize: 10, opacity: 0.8 }}>employés</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 800 }}>{tasks.filter(t=>deptsByPillar(pk).find(d=>d.id===t.DeptID)).length}</div><div style={{ fontSize: 10, opacity: 0.8 }}>tâches</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>📊 25 Départements Colona</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 8 }}>
                {DEPARTMENTS_INIT.map(d => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f9f8f5", borderRadius: 8, border: "1px solid #eee" }}>
                    <Badge pillar={d.pillar} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.manager}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>{d.headcount || "—"}</div>
                    {tasksByDept(d.id).length > 0 && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27ae60", flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#f0f0f8", borderRadius: 8, fontSize: 13, color: "#555" }}>
                👥 <strong>{totalHC}</strong> employés · 25 départements · 🟢 = tâches encodées · 💻 <strong>{softwares.length}</strong> logiciels
              </div>
            </div>
          </div>
        )}

        {/* ══ SAISIE ══ */}
        {tab === "input" && (
          <div style={S.card}>
            <h3 style={{ margin: "0 0 20px" }}>{editId ? "✏️ Modifier la tâche" : "➕ Encoder une nouvelle tâche"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={S.label}>🏢 Département *</label>
                <select style={S.select} value={form.DeptID} onChange={e => setForm(f => ({ ...f, DeptID: e.target.value }))}>
                  <option value="">— Choisir —</option>
                  {Object.entries(PILLARS).map(([pk, pv]) => (
                    <optgroup key={pk} label={`${pv.icon} ${pv.label}`}>
                      {DEPARTMENTS_INIT.filter(d => d.pillar === pk).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>📝 Nom de la tâche *</label>
                <input style={S.input} placeholder="Ex: Valider bon de commande fournisseur" value={form.TaskName} onChange={e => setForm(f => ({ ...f, TaskName: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>💻 Logiciel / Outil</label>
                <SoftwareSelector
                  value={form.Software}
                  onChange={val => setForm(f => ({ ...f, Software: val }))}
                  softwares={softwares}
                  onSoftwareAdded={(sw) => setSoftwares(p => [...p, sw])}
                  showSync={showSync}
                />
              </div>
              <div>
                <label style={S.label}>📅 Fréquence</label>
                <select style={S.select} value={form.Frequency} onChange={e => setForm(f => ({ ...f, Frequency: e.target.value }))}>
                  {FREQUENCIES.map(fr => <option key={fr}>{fr}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>🔗 Dépendances — Cliquer sur les départements liés</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 7, background: "#fafafa", minHeight: 44 }}>
                  {DEPARTMENTS_INIT.filter(d => d.id !== form.DeptID).map(d => {
                    const cur = form.Deps ? form.Deps.split(",").map(s => s.trim()).filter(Boolean) : [];
                    const active = cur.includes(d.id);
                    return (
                      <button key={d.id} onClick={() => {
                        const deps = form.Deps ? form.Deps.split(",").map(s => s.trim()).filter(Boolean) : [];
                        setForm(f => ({ ...f, Deps: (active ? deps.filter(x => x !== d.id) : [...deps, d.id]).join(",") }));
                      }} style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${active ? PILLARS[d.pillar].color : "#ccc"}`, background: active ? PILLARS[d.pillar].color : "#fff", color: active ? "#fff" : "#555", fontSize: 12, cursor: "pointer", fontWeight: active ? 700 : 400, fontFamily: "inherit" }}>
                        {d.name}
                      </button>
                    );
                  })}
                </div>
                {form.Deps && <div style={{ fontSize: 12, color: "#27ae60", marginTop: 6 }}>✓ {form.Deps.split(",").filter(Boolean).length} dépendance(s)</div>}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>💬 Notes</label>
                <input style={S.input} placeholder="Volume, contraintes, particularités…" value={form.Notes} onChange={e => setForm(f => ({ ...f, Notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 10, alignItems: "center" }}>
              <button style={S.btn(!form.DeptID || !form.TaskName || saving ? "#ccc" : "#e67e22")} onClick={saveTask} disabled={!form.DeptID || !form.TaskName || saving}>
                {saving ? <><Spinner />Sauvegarde…</> : editId ? "💾 Enregistrer" : "➕ Ajouter la tâche"}
              </button>
              {editId && <button style={S.btn("#95a5a6")} onClick={() => { setForm({ ...TASK_TEMPLATE }); setEditId(null); }}>Annuler</button>}
            </div>
            {form.DeptID && (() => { const d = DEPARTMENTS_INIT.find(x => x.id === form.DeptID); const p = PILLARS[d.pillar]; return (
              <div style={{ marginTop: 14, padding: "10px 14px", background: p.bg, borderRadius: 8, fontSize: 13, color: "#555", borderLeft: `4px solid ${p.color}` }}>
                {p.icon} <strong>{d.name}</strong> · <strong style={{ color: p.color }}>{p.label}</strong> · {d.manager}
              </div>
            ); })()}
          </div>
        )}

        {/* ══ TÂCHES ══ */}
        {tab === "tasks" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={S.label}>Pilier</label>
                <select style={S.select} value={filterPillar} onChange={e => setFilterPillar(e.target.value)}>
                  <option value="ALL">Tous</option>
                  {Object.entries(PILLARS).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={S.label}>Département</label>
                <select style={S.select} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                  <option value="ALL">Tous</option>
                  {DEPARTMENTS_INIT.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "flex-end" }}>
                <div style={{ padding: "10px 16px", background: "#e8f8f0", borderRadius: 8, fontSize: 13, color: "#27ae60", fontWeight: 700 }}>{filteredTasks.length} tâche{filteredTasks.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            {loading ? (
              <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#aaa" }}><Spinner />Chargement…</div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#aaa" }}>
                <div style={{ fontSize: 40 }}>📭</div>
                <div style={{ fontWeight: 600, marginTop: 12 }}>Aucune tâche encodée</div>
              </div>
            ) : (
              <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Pilier","Département","Tâche","Logiciel","Fréquence","Dépendances","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredTasks.map(t => {
                      const dept = DEPARTMENTS_INIT.find(d => d.id === t.DeptID);
                      if (!dept) return null;
                      const deps = t.Deps ? t.Deps.split(",").map(s => s.trim()).filter(Boolean) : [];
                      return (
                        <tr key={t.TaskID}>
                          <td style={S.td}><Badge pillar={dept.pillar} /></td>
                          <td style={S.td}><strong>{dept.name}</strong></td>
                          <td style={S.td}><strong>{t.TaskName}</strong>{t.Notes && <div style={{ fontSize: 11, color: "#aaa" }}>{t.Notes}</div>}</td>
                          <td style={S.td}><span style={S.pill("#2980b9","#e8f4fd")}>{t.Software || "N/A"}</span></td>
                          <td style={S.td}><span style={S.pill("#8e44ad","#f5eef8")}>{t.Frequency}</span></td>
                          <td style={S.td}>{deps.length > 0 ? <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{deps.map(did => { const dd = DEPARTMENTS_INIT.find(d => d.id === did); return dd ? <span key={did} style={S.pill(PILLARS[dd.pillar].color, PILLARS[dd.pillar].bg)}>{dd.name}</span> : null; })}</div> : <span style={{ color: "#ccc" }}>—</span>}</td>
                          <td style={S.td}>
                            <button onClick={() => editTask(t)} style={{ background: "#f0f0f8", border: "none", borderRadius: 5, padding: "5px 10px", cursor: "pointer", marginRight: 4 }}>✏️</button>
                            <button onClick={() => deleteTask(t.TaskID)} style={{ background: "#fdecea", border: "none", borderRadius: 5, padding: "5px 10px", cursor: "pointer" }}>🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ TAXONOMIE ══ */}
        {tab === "taxonomy" && (
          <div>
            <div style={{ ...S.card, borderLeft: "4px solid #1a1a2e", background: "#f9f8f5" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>📐 Taxonomie — 3 Piliers Colona</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>Flux transversaux inter-piliers détectés automatiquement.</p>
            </div>
            {Object.entries(PILLARS).map(([pk, pv]) => {
              const depts = deptsByPillar(pk);
              const ptasks = tasks.filter(t => depts.find(d => d.id === t.DeptID));
              return (
                <div key={pk} style={{ ...S.card, borderTop: `4px solid ${pv.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div><div style={{ fontSize: 18 }}>{pv.icon} <strong style={{ color: pv.color }}>{pv.label}</strong></div><div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{pv.desc}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 800, color: pv.color }}>{ptasks.length}</div><div style={{ fontSize: 11, color: "#aaa" }}>tâches</div></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                    {depts.map(d => {
                      const ts = tasksByDept(d.id);
                      return (
                        <div key={d.id} style={{ padding: "10px 14px", background: pv.bg, borderRadius: 8, border: `1px solid ${pv.color}30` }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{d.headcount > 0 ? `${d.headcount} emp.` : "Transverse"}</div>
                          {ts.length > 0 && <div style={{ marginTop: 8 }}>{ts.map(t => <div key={t.TaskID} style={{ fontSize: 11, padding: "2px 6px", background: "rgba(255,255,255,0.7)", borderRadius: 4, marginBottom: 3 }}>▸ {t.TaskName}</div>)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {tasks.some(t => (t.Deps || "").trim()) && (
              <div style={{ ...S.card, borderLeft: "4px solid #9b59b6" }}>
                <h3 style={{ margin: "0 0 14px", color: "#9b59b6", fontSize: 14 }}>🔗 Flux transversaux détectés</h3>
                {tasks.filter(t => (t.Deps || "").trim()).map(t => {
                  const src = DEPARTMENTS_INIT.find(d => d.id === t.DeptID); if (!src) return null;
                  const deps = t.Deps.split(",").map(s => s.trim()).filter(Boolean);
                  const isInter = deps.some(did => DEPARTMENTS_INIT.find(d => d.id === did)?.pillar !== src.pillar);
                  return (
                    <div key={t.TaskID} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, flexWrap: "wrap" }}>
                      <Badge pillar={src.pillar} /><strong>{src.name}</strong>
                      <span style={{ color: "#aaa" }}>→ "{t.TaskName}" →</span>
                      {deps.map(did => { const dd = DEPARTMENTS_INIT.find(d => d.id === did); return dd ? <span key={did}><Badge pillar={dd.pillar} /> <strong>{dd.name}</strong></span> : null; })}
                      {isInter && <span style={{ background: "#9b59b6", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>⚡ INTER-PILIER</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ MERMAID ══ */}
        {tab === "mermaid" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[["global","🌐 Vue globale"],["P2S","🏭 Produce-to-Stock"],["O2C","📦 Order-to-Cash"],["E2O","⚙️ Enable-to-Operate"]].map(([k,l]) => (
                <button key={k} onClick={() => setMermaidMode(k)} style={{ padding: "9px 18px", borderRadius: 8, border: `2px solid ${mermaidMode === k ? "#e67e22" : "#ddd"}`, background: mermaidMode === k ? "#fef3e2" : "#fff", fontWeight: mermaidMode === k ? 700 : 400, cursor: "pointer", fontSize: 13, color: mermaidMode === k ? "#e67e22" : "#555", fontFamily: "inherit" }}>{l}</button>
              ))}
            </div>
            {tasks.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#aaa" }}><div style={{ fontSize: 40 }}>📊</div><div style={{ fontWeight: 600, marginTop: 12 }}>Encode d'abord des tâches avec des dépendances</div></div>
            ) : (
              <div>
                <MermaidBlock code={mermaidCode} />
                <div style={{ ...S.card, marginTop: 16, background: "#e8f4fd", border: "1px solid #2980b920" }}>
                  <h4 style={{ margin: "0 0 10px", color: "#2980b9", fontSize: 13 }}>🚀 Visualiser</h4>
                  <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#555", lineHeight: 2 }}>
                    <li>Copier via <strong>📋 Copier</strong></li><li>Ouvrir <strong>mermaid.live</strong></li><li>Coller → diagramme instantané</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORIQUE ══ */}
        {tab === "versioning" && (
          <div>
            <div style={{ ...S.card, borderLeft: "4px solid #27ae60" }}>
              <h3 style={{ margin: "0 0 8px", color: "#27ae60", fontSize: 15 }}>🕓 Journal des versions</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#666" }}>Chaque action est tracée ici et persistée dans Google Sheets.</p>
              <div style={{ borderLeft: "3px solid #27ae60", paddingLeft: 20 }}>
                {[...versionLog].reverse().map((e, i) => (
                  <div key={i} style={{ marginBottom: 16, position: "relative" }}>
                    <div style={{ position: "absolute", left: -26, top: 2, width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#27ae60" : "#ccc", border: "2px solid #fff" }} />
                    <div><span style={{ fontWeight: 800, color: "#27ae60" }}>v{e.v}</span><span style={{ fontSize: 11, color: "#aaa", marginLeft: 12 }}>{e.ts}</span></div>
                    <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{e.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...S.card, background: "#f9f8f5" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>📊 Statistiques</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[["📝 Tâches", tasks.length],["🔗 Avec dépendances", tasks.filter(t=>(t.Deps||"").trim()).length],["🏢 Depts actifs", new Set(tasks.map(t=>t.DeptID)).size],["💻 Logiciels", softwares.length]].map(([l,v]) => (
                  <div key={l} style={{ padding: "12px 16px", background: "#fff", borderRadius: 8, border: "1px solid #eee", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#e67e22" }}>{v}</div>
                    <div style={{ color: "#666", marginTop: 4, fontSize: 13 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ LOGICIELS ══ */}
        {tab === "softwares" && (
          <div>
            <div style={{ ...S.card, borderLeft: "4px solid #2980b9" }}>
              <h3 style={{ margin: "0 0 8px", color: "#2980b9", fontSize: 15 }}>💻 Gestion des logiciels</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>Liste synchronisée avec Google Sheets — visible par tous les utilisateurs.</p>
            </div>
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["#","ID","Nom du logiciel","Utilisé dans"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {softwares.map((sw, i) => {
                    const usage = tasks.filter(t => t.Software === sw.name).length;
                    return (
                      <tr key={sw.id}>
                        <td style={{ ...S.td, color: "#aaa", width: 40 }}>{i + 1}</td>
                        <td style={{ ...S.td, width: 80 }}><span style={S.pill("#2980b9","#e8f4fd")}>{sw.id}</span></td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{sw.name}</td>
                        <td style={S.td}>{usage > 0 ? <span style={S.pill("#27ae60","#e8f8f0")}>{usage} tâche{usage > 1 ? "s" : ""}</span> : <span style={{ color: "#ccc", fontSize: 12 }}>Non utilisé</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ ...S.card, background: "#f9f8f5", fontSize: 13, color: "#666" }}>
              💡 Pour ajouter un logiciel, utilise <strong>"Autre"</strong> dans l'onglet <strong>✏️ Saisie</strong> et coche la case d'enregistrement.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
