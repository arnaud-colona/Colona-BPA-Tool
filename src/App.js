import React, { useState, useMemo, useEffect } from "react";

const API_URL = "VOTRE_URL_SCRIPT_ICI";
const APP_VERSION = "3.5.0";

export default function App() {
  const [view, setView] = useState("overview");
  const [tasks, setTasks] = useState([]);
  const [softwares, setSoftwares] = useState([]);
  const [changelog, setChangelog] = useState([]);
  const [history, setHistory] = useState([]);
  const [lastCommit, setLastCommit] = useState("");
  const [taskModal, setTaskModal] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ÉTATS DE FILTRE POUR NAVIGATION INTERNE
  const [globalFilter, setGlobalFilter] = useState({ dept: "", pillar: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resp = await fetch(API_URL);
      const data = await resp.json();
      setTasks(data.tasks);
      setSoftwares(data.softwares);
      setLastCommit(data.lastCommit || "3.4 bugfix sync google sheet");
      
      const chResp = await fetch(`${API_URL}?action=getChangelog`);
      setChangelog(await chResp.json());
      
      const hiResp = await fetch(`${API_URL}?action=getHistory`);
      setHistory(await hiResp.json());
      
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  // FONCTION DE NAVIGATION AVEC FILTRE
  const navigateWithFilter = (type, value) => {
    setGlobalFilter({
      dept: type === 'dept' ? value : "",
      pillar: type === 'pillar' ? value : ""
    });
    setView("tasks");
  };

  if (loading) return <div style={{padding: 50, textAlign:'center'}}>Chargement Colona BPA...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* ── HEADER & NAV ── */}
      <nav style={{ display:'flex', gap:20, padding:20, background:'#004a99', color:'#fff' }}>
        <b style={{cursor:'pointer'}} onClick={() => {setGlobalFilter({dept:"",pillar:""}); setView("overview")}}>COLONA BPA</b>
        <span style={{cursor:'pointer'}} onClick={() => setView("overview")}>Vue d'ensemble</span>
        <span style={{cursor:'pointer'}} onClick={() => {setGlobalFilter({dept:"",pillar:""}); setView("tasks")}}>Tâches</span>
        <span style={{cursor:'pointer'}} onClick={() => setView("processes")}>Processus</span>
        <span style={{cursor:'pointer'}} onClick={() => setView("settings")}>Paramètres</span>
      </nav>

      <main style={{ padding: 20 }}>
        
        {/* ── VUE D'ENSEMBLE ── */}
        {view === "overview" && (
          <div>
            <h1>Tableau de bord Colona</h1>
            <div style={{display:'flex', gap:10, marginBottom:20}}>
              <button onClick={() => navigateWithFilter('pillar', 'Produce-to-Market')}>Produce-to-Market</button>
              <button onClick={() => navigateWithFilter('pillar', 'Order-to-Cash')}>Order-to-Cash</button>
              <button onClick={() => navigateWithFilter('pillar', 'Enable-to-Operate')}>Enable-to-Operate</button>
            </div>
            <h3>Départements</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              {[...new Set(tasks.map(t => t.DeptID))].map(d => (
                <div key={d} onClick={() => navigateWithFilter('dept', d)} style={{padding:15, border:'1px solid #ccc', cursor:'pointer', borderRadius:8}}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TÂCHES (Filtrées) ── */}
        {view === "tasks" && (
          <TasksView 
            tasks={tasks} 
            initialFilter={globalFilter} 
            onEdit={t => setTaskModal(t)}
          />
        )}

        {/* ── PROCESSUS ── */}
        {view === "processes" && (
          <ProcessView 
            tasks={tasks} 
            onTaskClick={t => setTaskModal(t)} 
          />
        )}

        {/* ── PARAMÈTRES ── */}
        {view === "settings" && (
          <SettingsView 
            version={APP_VERSION} 
            lastCommit={lastCommit}
            changelog={changelog}
            history={history}
          />
        )}
      </main>

      {/* ── MODALE ÉDITION ── */}
      {taskModal && (
        <TaskModal 
          task={taskModal} 
          onClose={() => setTaskModal(null)} 
          softwares={softwares}
        />
      )}
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function ProcessView({ tasks, onTaskClick }) {
  return (
    <div>
      <h2>Analyse par Processus</h2>
      <div style={{background:'#f9f9f9', padding:15, borderLeft:'4px solid #004a99', marginBottom:20}}>
        <strong>Objectif du processus :</strong> Optimiser la chaîne de valeur agroalimentaire de Colona Waremme en réduisant les irritants et en digitalisant les flux.
      </div>
      <ul>
        {tasks.map(t => (
          <li key={t.TaskID} style={{cursor:'pointer', color:'#004a99', marginBottom:5}} onClick={() => onTaskClick(t)}>
            {t.TaskName} (Éditer)
          </li>
        ))}
      </ul>
    </div>
  );
}

function TasksView({ tasks, initialFilter, onEdit }) {
  const filtered = tasks.filter(t => {
    if (initialFilter.dept && t.DeptID !== initialFilter.dept) return false;
    if (initialFilter.pillar && t.TaskType !== initialFilter.pillar) return false;
    return true;
  });

  return (
    <div>
      <h2>Liste des Tâches {initialFilter.dept ? `- ${initialFilter.dept}` : ""}</h2>
      <table width="100%" border="1" cellPadding="5" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#eee'}}>
            <th>ID</th><th>Nom</th><th>Département</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.TaskID}>
              <td>{t.TaskID}</td><td>{t.TaskName}</td><td>{t.DeptID}</td>
              <td><button onClick={() => onEdit(t)}>Éditer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsView({ version, lastCommit, changelog, history }) {
  const [subTab, setSubTab] = useState("app");

  return (
    <div>
      <h1>Paramètres</h1>
      <div style={{ marginBottom: 20 }}>
        <span 
          title={lastCommit} 
          style={{ cursor: 'help', padding: '5px 10px', background: '#e0e0e0', borderRadius: 4, fontWeight: 'bold' }}
        >
          Version : {version} (H: {new Date().toLocaleTimeString()})
        </span>
      </div>

      <div style={{display:'flex', gap:10, marginBottom:15}}>
        <button onClick={() => setSubTab("app")}>App Changelog</button>
        <button onClick={() => setSubTab("hist")}>Historique des modifs</button>
      </div>

      {subTab === "app" ? (
        <div style={{maxHeight:400, overflowY:'auto', border:'1px solid #ddd', padding:10}}>
          <h3>Journal des versions (Sheet Changelog)</h3>
          {changelog.map((c, i) => (
            <div key={i} style={{borderBottom:'1px solid #eee', padding:'5px 0'}}>
              <b>v{c.version}</b> - {new Date(c.date).toLocaleDateString()} : {c.detail}
            </div>
          ))}
        </div>
      ) : (
        <div style={{maxHeight:400, overflowY:'auto', border:'1px solid #ddd', padding:10}}>
          <h3>Historique des lignes (Sheet History)</h3>
          {history.map((h, i) => (
            <div key={i} style={{fontSize:12, marginBottom:5}}>
              [{new Date(h[0]).toLocaleString()}] <b>{h[1]}</b> : {h[2]} - {h[3]} ({h[4]})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskModal({ task, onClose }) {
  return (
    <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div style={{background:'#fff', padding:20, borderRadius:8, width:500}}>
        <h2>Édition : {task.TaskName || "Nouvelle tâche"}</h2>
        <p>ID: {task.TaskID}</p>
        {/* Champs d'édition ici... */}
        <button onClick={onClose} style={{marginTop:20}}>Fermer</button>
      </div>
    </div>
  );
}