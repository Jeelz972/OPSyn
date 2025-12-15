// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBaA99che1oz9BHc23IhiFoY-nK0xvg4q4",
    authDomain: "statu18elite.firebaseapp.com",
    projectId: "statu18elite",
    storageBucket: "statu18elite.appspot.com",
    messagingSenderId: "862850988986",
    appId: "1:862850988986:web:d64afc2c94eb50a1f6fb83",
    measurementId: "G-VNEB7Z8ZR1"
};

let db = null;
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try { firebase.initializeApp(firebaseConfig); db = firebase.firestore(); } 
    catch (e) { console.error(e); }
}

const { useState, useEffect } = React;

// --- DONNÉES ---
const ZONES_TERRAIN = [
    { id: 'gauche_0', name: 'G 0°', color: 'from-blue-500 to-blue-600' },
    { id: 'gauche_45', name: 'G 45°', color: 'from-emerald-400 to-emerald-600' },
    { id: 'gauche_70', name: 'G 70°', color: 'from-cyan-400 to-cyan-600' },
    { id: 'axe', name: 'Axe', color: 'from-indigo-500 to-indigo-600' },
    { id: 'droit_70', name: 'D 70°', color: 'from-red-500 to-red-600' },
    { id: 'droit_45', name: 'D 45°', color: 'from-amber-400 to-amber-600' },
    { id: 'droit_0', name: 'D 0°', color: 'from-pink-500 to-pink-600' }
];

const INITIAL_PLAYERS = [
    { id: 1, name: 'Maxime' }, { id: 2, name: 'Sasha' }, { id: 3, name: 'Théotime' },
    { id: 4, name: 'Noé' }, { id: 5, name: 'Keziah' }, { id: 6, name: 'Nathan' },
    { id: 7, name: 'Valentin' }, { id: 8, name: 'Jad' }, { id: 9, name: 'Marco' },
    { id: 10, name: 'Thierno' }, { id: 11, name: 'Peniel' }, { id: 12, name: 'Nat' }
];

const SHOT_TYPES = [
    { id: '2pt_arret', label: '2pts Arrêt', points: 2, icon: '🛑', cat: '2pt', mouv: false },
    { id: '2pt_mouv', label: '2pts Mouv.', points: 2, icon: '🏃', cat: '2pt', mouv: true },
    { id: '3pt_arret', label: '3pts Arrêt', points: 3, icon: '🛑', cat: '3pt', mouv: false },
    { id: '3pt_mouv', label: '3pts Mouv.', points: 3, icon: '🏃', cat: '3pt', mouv: true },
    { id: '1pt_lancer', label: 'Lancer Franc', points: 1, icon: '🏀', cat: 'lf', mouv: false }
];

// --- APP ---
function App() {
    const [activeModule, setActiveModule] = useState('shooting');
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [historyData, setHistoryData] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const h = localStorage.getItem('basketball_history');
        const p = localStorage.getItem('basketball_players');
        if (h) setHistoryData(JSON.parse(h));
        if (p) setPlayers(JSON.parse(p));
    }, []);

    const updateData = (key, data, setter) => {
        setter(data);
        localStorage.setItem(key, JSON.stringify(data));
    };

    const handleCloud = async (mode) => {
        if (!db) return alert("Firebase non configuré");
        setIsSyncing(true);
        try {
            const docRef = db.collection('stats_v3').doc('backup');
            if(mode === 'save') {
                await docRef.set({ history: JSON.stringify(historyData), players: JSON.stringify(players), last: new Date().toISOString() });
                alert("✅ Sauvegarde réussie !");
            } else {
                const doc = await docRef.get();
                if(doc.exists) {
                    const d = doc.data();
                    updateData('basketball_history', JSON.parse(d.history), setHistoryData);
                    updateData('basketball_players', JSON.parse(d.players), setPlayers);
                    alert("✅ Données chargées !");
                }
            }
        } catch (e) { alert("Erreur: " + e.message); }
        setIsSyncing(false);
    };

    return (
        <div className="min-h-screen pb-12 bg-gradient-to-br from-slate-50 to-slate-200">
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
                    <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2">
                        🏀 StatElite <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border">v4.1 Style</span>
                    </h1>
                    <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                        <button onClick={()=>setActiveModule('shooting')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeModule==='shooting'?'bg-white text-blue-600 shadow-md scale-105':'text-gray-500 hover:text-gray-800'}`}>🎯 Saisie</button>
                        <button onClick={()=>setActiveModule('analysis')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeModule==='analysis'?'bg-white text-blue-600 shadow-md scale-105':'text-gray-500 hover:text-gray-800'}`}>📊 Analyse</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={()=>handleCloud('save')} disabled={isSyncing} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition active:scale-95 flex items-center gap-1">{isSyncing ? '⏳' : '☁️ Save'}</button>
                        <button onClick={()=>handleCloud('load')} disabled={isSyncing} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition active:scale-95">📥</button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
                {activeModule === 'shooting' && <ShootingModule players={players} setPlayers={(p)=>updateData('basketball_players',p,setPlayers)} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
                {activeModule === 'analysis' && <AnalysisModule players={players} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
            </div>
        </div>
    );
}

// --- SAISIE ---
function ShootingModule({ players, setPlayers, historyData, setHistoryData }) {
    const [mode, setMode] = useState('field');
    const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id);
    const [selectedZone, setSelectedZone] = useState(null);
    const [selectedType, setSelectedType] = useState('2pt_arret');
    const [tentes, setTentes] = useState('');
    const [marques, setMarques] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingId, setEditingId] = useState(null);
    const [newPlayer, setNewPlayer] = useState('');

    useEffect(() => {
        if(mode === 'lf') { setSelectedZone('zone_lf'); setSelectedType('1pt_lancer'); } 
        else { setSelectedZone(null); setSelectedType('2pt_arret'); }
        setEditingId(null); setTentes(''); setMarques('');
    }, [mode]);

    const saveShot = () => {
        const tt = parseInt(tentes), tr = parseInt(marques);
        if(!selectedPlayer || !selectedZone || isNaN(tt) || tt===0 || tr>tt) return alert("Erreur dans la saisie.");
        
        const record = { id: editingId || Date.now(), date, playerId: parseInt(selectedPlayer), zoneId: selectedZone, type: selectedType, tentes: tt, marques: tr };
        
        if (editingId) {
            setHistoryData(historyData.map(item => item.id === editingId ? record : item));
            setEditingId(null);
            alert("✅ Modifié");
        } else {
            setHistoryData([...historyData, record]);
            const btn = document.getElementById('validBtn');
            if(btn) { btn.innerText = "✅ ENREGISTRÉ"; setTimeout(()=>btn.innerText = "VALIDER LA SÉRIE", 800); }
        }
        setTentes(''); setMarques('');
    };

    const loadForEdit = (record) => {
        setEditingId(record.id);
        setMode(record.zoneId === 'zone_lf' ? 'lf' : 'field');
        setTimeout(() => {
            setSelectedPlayer(record.playerId); setSelectedZone(record.zoneId); setSelectedType(record.type); setTentes(record.tentes); setMarques(record.marques); setDate(record.date);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    };

    const deleteRecord = (id) => { if(confirm("Supprimer ?")) { setHistoryData(historyData.filter(i => i.id !== id)); if(editingId === id) setEditingId(null); } };
    const addPlayer = () => { if(newPlayer.trim()) { setPlayers([...players, {id:Date.now(), name: newPlayer}]); setNewPlayer(''); } };
    const recentHistory = [...historyData].sort((a,b) => b.id - a.id).slice(0, 10);

    return (
        <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit sticky top-24">
                    <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 tracking-wider">Effectif</h3>
                    <div className="flex gap-2 mb-3"><input value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 w-full outline-none" placeholder="Nouveau..."/><button onClick={addPlayer} className="bg-blue-600 text-white rounded-lg px-3 font-bold">+</button></div>
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                        {players.map(p => (
                            <button key={p.id} onClick={()=>setSelectedPlayer(p.id)} className={`w-full text-left p-3 rounded-xl transition flex justify-between group ${selectedPlayer===p.id ? 'bg-slate-800 text-white shadow-lg':'hover:bg-gray-50 text-gray-600'}`}>
                                <span>{p.name}</span>{selectedPlayer===p.id && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Actif</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-9 space-y-6">
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
                        <button onClick={()=>setMode('field')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition ${mode==='field' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>🏀 Tirs de Champ</button>
                        <button onClick={()=>setMode('lf')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition ${mode==='lf' ? 'bg-white text-purple-600 shadow' : 'text-gray-500'}`}>⛹️ Lancers Francs</button>
                    </div>
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-gray-50 font-semibold text-gray-600 rounded-xl px-4 py-2 outline-none"/>
                </div>
                <div className={`bg-white rounded-3xl shadow-xl border-4 overflow-hidden ${mode==='lf' ? 'border-purple-100' : 'border-blue-100'}`}>
                    <div className={`p-4 text-center ${mode==='lf' ? 'bg-purple-50' : 'bg-blue-50'} border-b border-gray-100`}>
                        <h2 className={`text-lg font-bold uppercase tracking-widest ${mode==='lf' ? 'text-purple-800' : 'text-blue-800'}`}>{editingId ? "✏️ Modification" : (mode==='lf' ? "Série LF" : "Nouvelle Série")}</h2>
                    </div>
                    <div className="p-6 md:p-8">
                        {mode === 'field' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-slide-up">
                                {ZONES_TERRAIN.map(z => (
                                    <button key={z.id} onClick={()=>setSelectedZone(z.id)} className={`py-4 px-2 rounded-xl border-2 transition relative overflow-hidden ${selectedZone===z.id ? `border-transparent bg-gradient-to-br ${z.color} text-white shadow-lg scale-105` : 'border-gray-100 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50'}`}>
                                        <span className="relative z-10 font-bold">{z.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {(selectedZone || mode === 'lf') ? (
                            <div className="animate-fade-in space-y-8">
                                {mode === 'field' && (
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {SHOT_TYPES.filter(t=>t.cat !== 'lf').map(t => (
                                            <button key={t.id} onClick={()=>setSelectedType(t.id)} className={`px-4 py-3 rounded-xl border-2 flex flex-col items-center transition ${selectedType===t.id ? 'border-slate-800 bg-slate-800 text-white shadow-lg scale-105' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}>
                                                <span className="text-xl mb-1">{t.icon}</span><span className="text-xs font-bold uppercase">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-center items-end gap-6 md:gap-12">
                                    <div className="flex flex-col items-center"><label className="text-xs font-bold text-gray-400 mb-2">TENTÉS</label><input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} className="w-28 h-20 text-5xl font-black text-center bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none text-gray-800" placeholder="0"/></div>
                                    <div className="text-4xl text-gray-300 font-light pb-4">/</div>
                                    <div className="flex flex-col items-center"><label className="text-xs font-bold text-gray-400 mb-2">MARQUÉS</label><input type="number" value={marques} onChange={e=>setMarques(e.target.value)} className="w-28 h-20 text-5xl font-black text-center bg-green-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-green-500 outline-none text-green-600" placeholder="0"/></div>
                                </div>
                                <button id="validBtn" onClick={saveShot} className={`w-full py-4 rounded-xl text-white font-black text-lg shadow-lg transition active:scale-95 ${editingId ? 'bg-orange-500' : 'bg-slate-900 hover:bg-slate-800'}`}>{editingId ? "MODIFIER LA SÉRIE" : "VALIDER LA SÉRIE"}</button>
                                {editingId && <button onClick={()=>{setEditingId(null);setTentes('');setMarques('')}} className="w-full text-center text-gray-400 underline">Annuler modification</button>}
                            </div>
                        ) : <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">👈 Sélectionnez une zone</div>}
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"><h3 className="font-bold text-gray-600 text-sm">🕒 Dernières Saisies</h3><span className="text-xs text-gray-400">{historyData.length} total</span></div>
                    <div className="divide-y divide-gray-100">
                        {recentHistory.map(item => (
                            <div key={item.id} className={`p-3 flex items-center justify-between hover:bg-blue-50 transition ${editingId===item.id?'bg-orange-50':''}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${item.zoneId==='zone_lf'?'bg-purple-500':'bg-blue-500'}`}>{item.zoneId==='zone_lf'?'LF':ZONES_TERRAIN.find(z=>z.id===item.zoneId)?.name}</div>
                                    <div><div className="font-bold text-gray-800 text-sm">{players.find(p=>p.id===item.playerId)?.name}</div><div className="text-xs text-gray-500">{SHOT_TYPES.find(t=>t.id===item.type)?.label} • {item.date}</div></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-black text-gray-800 text-lg leading-none">{item.marques}/{item.tentes}</div>
                                        <div className={`text-[10px] font-bold ${item.tentes>0 && (item.marques/item.tentes)>=0.5 ? 'text-green-500' : 'text-orange-500'}`}>
                                            {item.tentes>0?Math.round((item.marques/item.tentes)*100):0}%
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={()=>loadForEdit(item)} className="p-2 text-blue-400 hover:bg-blue-100 rounded">✏️</button>
                                        <button onClick={()=>deleteRecord(item.id)} className="p-2 text-red-300 hover:bg-red-100 rounded">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- ANALYSE & IMPORT ---
function AnalysisModule({ players, historyData, setHistoryData }) {
    const [filterPlayer, setFilterPlayer] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // IMPORT (Identique)
    const [pendingFiles, setPendingFiles] = useState([]); 
    const [showImportModal, setShowImportModal] = useState(false);

    const parseCSVRows = (csvText) => {
        const lines = csvText.split('\n');
        const parseCSVLine = (line) => {
            const res = []; let cur = '', inQ = false;
            for(let c of line) {
                if(c === '"') { inQ = !inQ; } else if(c === ',' && !inQ) { res.push(cur); cur = ''; } else cur += c;
            }
            res.push(cur); return res.map(s => s.trim().replace(/^"|"$/g, ''));
        };
        let headerIdx = lines.findIndex(l => l.toUpperCase().startsWith('JOURS'));
        if (headerIdx === -1) headerIdx = 3; 
        const dataRows = lines.slice(headerIdx + 1);
        const extractedData = [];
        const map = [ { id: 'gauche_0', c: 1 }, { id: 'gauche_45', c: 4 }, { id: 'gauche_70', c: 7 }, { id: 'axe', c: 10 }, { id: 'droit_70', c: 13 }, { id: 'droit_45', c: 16 }, { id: 'droit_0', c: 19 } ];
        dataRows.forEach(l => {
            const row = parseCSVLine(l);
            if(row.length < 20) return;
            const dRaw = row[0];
            if(!dRaw || !dRaw.includes('/')) return;
            const [dd, mm, yyyy] = dRaw.split('/');
            const dateISO = `${yyyy}-${mm}-${dd}`;
            map.forEach(m => {
                const tt = parseInt(row[m.c]); const tr = parseInt(row[m.c+1]);
                if(!isNaN(tt) && tt > 0) extractedData.push({ zoneId: m.id, date: dateISO, type: '3pt_arret', tentes: tt, marques: isNaN(tr) ? 0 : tr });
            });
        });
        return extractedData;
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if(files.length === 0) return;
        const promises = files.map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const extracted = parseCSVRows(evt.target.result);
                let detectedId = players[0].id;
                const fName = file.name.toUpperCase();
                const match = players.find(p => fName.includes(p.name.toUpperCase()));
                if(match) detectedId = match.id;
                resolve({ fileName: file.name, playerId: detectedId, data: extracted });
            };
            reader.readAsText(file);
        }));
        Promise.all(promises).then(results => {
            const validFiles = results.filter(f => f.data.length > 0);
            if(validFiles.length > 0) { setPendingFiles(validFiles); setShowImportModal(true); } else { alert("Aucune donnée valide."); }
        });
    };

    const confirmImport = () => {
        let newRecords = [];
        const existingKeys = new Set(historyData.map(item => `${item.date}-${item.playerId}-${item.zoneId}`));
        let duplicateCount = 0;
        pendingFiles.forEach(file => {
            file.data.forEach(d => {
                const key = `${d.date}-${file.playerId}-${d.zoneId}`;
                if(!existingKeys.has(key)) { newRecords.push({ id: Date.now() + Math.random(), playerId: parseInt(file.playerId), ...d }); existingKeys.add(key); } else { duplicateCount++; }
            });
        });
        if(newRecords.length > 0) { setHistoryData([...historyData, ...newRecords]); alert(`✅ Ajoutés : ${newRecords.length} (${duplicateCount} ignorés).`); } else { alert(`⚠️ Tous existent déjà.`); }
        setShowImportModal(false); setPendingFiles([]);
    };

    const updatePendingPlayer = (index, newId) => { const updated = [...pendingFiles]; updated[index].playerId = newId; setPendingFiles(updated); };

    // --- CALCUL STATS ---
    const calculateStats = () => {
        const matrix = {}; const maxPerZone = {};
        
        // Structure pour les stats globales (Cards)
        const teamGlobal = {
            total: { tt: 0, tr: 0 },
            cat2pt: { tt: 0, tr: 0 },
            cat3pt: { tt: 0, tr: 0 },
            catLF: { tt: 0, tr: 0 }
        };

        // Structure pour la ligne "Total Équipe" du tableau
        const teamRow = { 'global_arret': {tt:0, tr:0}, 'global_mouv': {tt:0, tr:0}, 'lf': {tt:0, tr:0} };
        ZONES_TERRAIN.forEach(z => teamRow[z.id] = {tt:0, tr:0});

        players.forEach(p => {
            matrix[p.id] = { 'global_arret': {tt:0, tr:0}, 'global_mouv': {tt:0, tr:0}, 'lf': {tt:0, tr:0} };
            ZONES_TERRAIN.forEach(z => matrix[p.id][z.id] = {tt:0, tr:0});
        });

        // 1. Filtrer par Date
        let dateFiltered = [...historyData];
        if(startDate) dateFiltered = dateFiltered.filter(d => d.date >= startDate);
        if(endDate) dateFiltered = dateFiltered.filter(d => d.date <= endDate);

        // 2. Calculs (Stats globales + Matrix)
        dateFiltered.forEach(d => {
            const type = SHOT_TYPES.find(t=>t.id === d.type);
            
            // --- Calculs Globaux (Cards) ---
            teamGlobal.total.tt += d.tentes;
            teamGlobal.total.tr += d.marques;
            
            if(d.zoneId === 'zone_lf') {
                teamGlobal.catLF.tt += d.tentes; teamGlobal.catLF.tr += d.marques;
            } else if (type) {
                if(type.cat === '2pt') { teamGlobal.cat2pt.tt += d.tentes; teamGlobal.cat2pt.tr += d.marques; }
                if(type.cat === '3pt') { teamGlobal.cat3pt.tt += d.tentes; teamGlobal.cat3pt.tr += d.marques; }
            }

            // --- Calculs Ligne Équipe Tableau ---
            if(d.zoneId === 'zone_lf') {
                teamRow['lf'].tt += d.tentes; teamRow['lf'].tr += d.marques;
            } else if (teamRow[d.zoneId]) {
                teamRow[d.zoneId].tt += d.tentes; teamRow[d.zoneId].tr += d.marques;
                const key = type?.mouv ? 'global_mouv' : 'global_arret';
                teamRow[key].tt += d.tentes; teamRow[key].tr += d.marques;
            }

            // --- Calculs Matrix Joueurs ---
            if(filterPlayer === 'all' || d.playerId == filterPlayer) {
                if(matrix[d.playerId]) {
                    if(d.zoneId === 'zone_lf') {
                        matrix[d.playerId]['lf'].tt += d.tentes; matrix[d.playerId]['lf'].tr += d.marques;
                    } else if (matrix[d.playerId][d.zoneId]) {
                        matrix[d.playerId][d.zoneId].tt += d.tentes; matrix[d.playerId][d.zoneId].tr += d.marques;
                        const key = type?.mouv ? 'global_mouv' : 'global_arret';
                        matrix[d.playerId][key].tt += d.tentes; matrix[d.playerId][key].tr += d.marques;
                    }
                }
            }
        });

        // Calculs Percentages TeamRow
        Object.keys(teamRow).forEach(k => { teamRow[k].pct = teamRow[k].tt > 0 ? (teamRow[k].tr/teamRow[k].tt)*100 : 0; });

        // Calculs Percentages Matrix + Max
        Object.keys(matrix).forEach(pid => {
            Object.keys(matrix[pid]).forEach(zid => {
                const cell = matrix[pid][zid];
                cell.pct = cell.tt > 0 ? (cell.tr/cell.tt)*100 : 0;
                if(cell.tt > 0) { if(!maxPerZone[zid] || cell.pct > maxPerZone[zid].pct) maxPerZone[zid] = { pct: cell.pct, playerId: pid }; }
            });
        });

        return { matrix, maxPerZone, teamRow, teamGlobal };
    };

    const { matrix, maxPerZone, teamRow, teamGlobal } = calculateStats();
    const formatPct = (n) => n.toFixed(0) + '%';
    const setQuickRange = (type) => {
        const now = new Date();
        if(type==='all') { setStartDate(''); setEndDate(''); }
        if(type==='month') { const d = new Date(now.getFullYear(), now.getMonth(), 1); setStartDate(d.toISOString().split('T')[0]); setEndDate(''); }
        if(type==='season') { const d = new Date(now.getMonth() < 8 ? now.getFullYear()-1 : now.getFullYear(), 8, 1); setStartDate(d.toISOString().split('T')[0]); setEndDate(''); }
    };

    return (
        <div className="space-y-6">
            {/* FILTRES */}
            <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 animate-slide-up">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-gray-400 font-bold text-xs uppercase">Joueur:</span>
                    <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)} className="bg-gray-50 border-none font-bold text-gray-700 rounded-xl px-4 py-2 outline-none w-full md:w-auto">
                        <option value="all">Tous les joueurs</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
                        <button onClick={()=>setQuickRange('all')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold ${!startDate?'bg-white shadow text-blue-600':'text-gray-400'}`}>TOUT</button>
                        <button onClick={()=>setQuickRange('month')} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-200">MOIS</button>
                        <button onClick={()=>setQuickRange('season')} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-200">SAISON</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><span className="text-xs text-gray-400 font-bold">Du</span><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent border-none text-sm font-bold text-gray-700 outline-none w-32"/></div>
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><span className="text-xs text-gray-400 font-bold">Au</span><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent border-none text-sm font-bold text-gray-700 outline-none w-32"/></div>
                    </div>
                </div>
            </div>

            {/* STATS GLOBALES (CARTES STYLE ORIGINAL) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2 animate-fade-in">
                <div className="bg-blue-50 p-4 rounded-xl text-center shadow-sm border border-blue-100">
                    <div className="text-3xl font-black text-blue-600">{teamGlobal.total.tt}</div>
                    <div className="text-xs font-bold text-blue-400 uppercase">Tirs Totaux</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center shadow-sm border border-green-100">
                    <div className="text-3xl font-black text-green-600">{teamGlobal.total.tt > 0 ? Math.round((teamGlobal.total.tr/teamGlobal.total.tt)*100) : 0}%</div>
                    <div className="text-xs font-bold text-green-400 uppercase">Réussite Globale</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl text-center shadow-sm border border-yellow-100">
                    <div className="text-2xl font-bold text-yellow-600">{teamGlobal.cat2pt.tr}/{teamGlobal.cat2pt.tt}</div>
                    <div className="text-sm font-bold text-yellow-500">{teamGlobal.cat2pt.tt > 0 ? Math.round((teamGlobal.cat2pt.tr/teamGlobal.cat2pt.tt)*100) : 0}%</div>
                    <div className="text-[10px] font-bold text-yellow-400 uppercase mt-1">2 Points</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center shadow-sm border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">{teamGlobal.cat3pt.tr}/{teamGlobal.cat3pt.tt}</div>
                    <div className="text-sm font-bold text-purple-500">{teamGlobal.cat3pt.tt > 0 ? Math.round((teamGlobal.cat3pt.tr/teamGlobal.cat3pt.tt)*100) : 0}%</div>
                    <div className="text-[10px] font-bold text-purple-400 uppercase mt-1">3 Points</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center shadow-sm border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">{teamGlobal.catLF.tr}/{teamGlobal.catLF.tt}</div>
                    <div className="text-sm font-bold text-orange-500">{teamGlobal.catLF.tt > 0 ? Math.round((teamGlobal.catLF.tr/teamGlobal.catLF.tt)*100) : 0}%</div>
                    <div className="text-[10px] font-bold text-orange-400 uppercase mt-1">Lancers Francs</div>
                </div>
            </div>

            {/* IMPORT BTN */}
            <div className="flex justify-end">
                <label className="cursor-pointer bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm shadow hover:bg-slate-700 transition flex items-center gap-2 transform active:scale-95">
                    <span>📂 Importer CSV (Multi)</span>
                    <input type="file" accept=".csv" multiple className="hidden" onChange={handleFileSelect} />
                </label>
            </div>

            {/* MODAL IMPORT */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in">
                        <h3 className="text-xl font-black text-gray-800 mb-4">📥 Confirmer les Imports</h3>
                        <div className="max-h-[50vh] overflow-y-auto space-y-2 mb-6">
                            {pendingFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex-1"><div className="font-bold text-gray-700 text-sm truncate">{file.fileName}</div><div className="text-xs text-green-600 font-medium">{file.data.length} tirs détectés</div></div>
                                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400">→</span><select value={file.playerId} onChange={(e) => updatePendingPlayer(idx, e.target.value)} className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500">{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3"><button onClick={()=>setShowImportModal(false)} className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 font-bold">Annuler</button><button onClick={confirmImport} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg">Tout Confirmer</button></div>
                    </div>
                </div>
            )}

            {/* TABLEAU */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"><h2 className="font-black text-xl text-gray-800">🏆 Leaderboard</h2><span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border">👑 = Leader de la zone</span></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-900 text-white shadow-lg">
                                <th className="p-4 text-left sticky left-0 bg-slate-900 z-10 font-bold">Joueur</th>
                                <th className="p-4 bg-purple-900/50 border-l border-white/10 text-purple-200">LF</th>
                                <th className="p-4 bg-blue-900/50 border-l border-white/10 text-blue-200">Arrêt</th>
                                <th className="p-4 bg-orange-900/50 border-l border-white/10 text-orange-200">Mouv</th>
                                {ZONES_TERRAIN.map(z => <th key={z.id} className="p-4 border-l border-white/10 bg-gradient-to-b from-transparent to-white/5">{z.name}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* LIGNE TOTAL ÉQUIPE */}
                            <tr className="bg-slate-100 font-bold border-b-2 border-slate-200">
                                <td className="p-4 text-left sticky left-0 bg-slate-100 z-10 text-slate-800 uppercase tracking-wider shadow-r">TOTAL ÉQUIPE</td>
                                <td className="p-3 border-l border-slate-200 text-purple-800">{teamRow.lf.tr}/{teamRow.lf.tt} <span className="text-xs ml-1 bg-purple-200 px-1 rounded">{formatPct(teamRow.lf.pct)}</span></td>
                                <td className="p-3 border-l border-slate-200 text-blue-800">{teamRow.global_arret.tr}/{teamRow.global_arret.tt} <span className="text-xs ml-1 bg-blue-200 px-1 rounded">{formatPct(teamRow.global_arret.pct)}</span></td>
                                <td className="p-3 border-l border-slate-200 text-orange-800">{teamRow.global_mouv.tr}/{teamRow.global_mouv.tt} <span className="text-xs ml-1 bg-orange-200 px-1 rounded">{formatPct(teamRow.global_mouv.pct)}</span></td>
                                {ZONES_TERRAIN.map(z => (
                                    <td key={z.id} className="p-3 border-l border-slate-200 text-slate-700">
                                        {teamRow[z.id].tr}/{teamRow[z.id].tt} <span className="text-xs ml-1 bg-white px-1 rounded border">{formatPct(teamRow[z.id].pct)}</span>
                                    </td>
                                ))}
                            </tr>

                            {/* LIGNES JOUEURS */}
                            {players.map(p => {
                                const stats = matrix[p.id];
                                if(!stats || (filterPlayer !== 'all' && p.id != filterPlayer)) return null;
                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-4 font-bold text-left sticky left-0 bg-white group-hover:bg-blue-50 transition-colors shadow-lg border-r border-gray-100 text-gray-700">{p.name}</td>
                                        <td className="p-3 bg-purple-50/30 border-l border-gray-100 font-mono text-gray-600"><div className="font-bold">{stats.lf.tr}/{stats.lf.tt}</div><div className="text-xs text-purple-600 font-bold">{formatPct(stats.lf.pct)}</div></td>
                                        <td className="p-3 bg-blue-50/30 border-l border-gray-100 font-mono text-gray-600"><div className="font-bold">{stats.global_arret.tr}/{stats.global_arret.tt}</div><div className="text-xs text-blue-600 font-bold">{formatPct(stats.global_arret.pct)}</div></td>
                                        <td className="p-3 bg-orange-50/30 border-l border-gray-100 font-mono text-gray-600"><div className="font-bold">{stats.global_mouv.tr}/{stats.global_mouv.tt}</div><div className="text-xs text-orange-600 font-bold">{formatPct(stats.global_mouv.pct)}</div></td>
                                        {ZONES_TERRAIN.map(z => {
                                            const s = stats[z.id];
                                            const isBest = maxPerZone[z.id]?.playerId == p.id && s.tt > 0 && maxPerZone[z.id].pct > 0;
                                            return (
                                                <td key={z.id} className={`p-3 border-l border-gray-100 relative ${isBest ? 'bg-yellow-50' : ''}`}>
                                                    {isBest && <div className="absolute inset-0 border-2 border-yellow-400 opacity-50 pointer-events-none"></div>}
                                                    <div className={`font-bold ${isBest ? 'text-yellow-700 scale-110 transform' : 'text-gray-700'}`}>{s.tr}/{s.tt}</div>
                                                    <div className={`text-xs ${isBest ? 'font-black text-yellow-600' : 'text-gray-400'}`}>{s.tt > 0 ? formatPct(s.pct) : '-'}</div>
                                                    {isBest && <span className="absolute top-1 right-1 text-[10px]">👑</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Initialisation de l'application
ReactDOM.render(<App />, document.getElementById('root'));
