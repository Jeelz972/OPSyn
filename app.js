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

// --- CONFIGURATION API SHOT CHART ---
const API_BASE_URL = 'https://opsyn.onrender.com';

const { useState, useEffect, useMemo, useRef } = React;

// --- DONNÉES & CONSTANTES ---
const ZONES_CONFIG = [
    { id: 'gauche_0', key: '0G', label: '0° G', angle: 175 },
    { id: 'gauche_45', key: '45G', label: '45° G', angle: 135 },
    { id: 'gauche_70', key: '70G', label: '70° G', angle: 115 },
    { id: 'axe', key: 'Axe', label: 'Axe', angle: 90 },
    { id: 'droit_70', key: '70D', label: '70° D', angle: 65 },
    { id: 'droit_45', key: '45D', label: '45° D', angle: 45 },
    { id: 'droit_0', key: '0D', label: '0° D', angle: 5 }
];

const ZONE_KEY_TO_ID = {
    '0G': 'gauche_0', '45G': 'gauche_45', '70G': 'gauche_70',
    'Axe': 'axe', '70D': 'droit_70', '45D': 'droit_45', '0D': 'droit_0'
};

const INITIAL_PLAYERS = [
    { id: 1, name: 'Maxime' }, { id: 2, name: 'Sasha' }, { id: 3, name: 'Théotime' },
    { id: 4, name: 'Noé' }, { id: 5, name: 'Keziah' }, { id: 6, name: 'Nathan' },
    { id: 7, name: 'Valentin' }, { id: 8, name: 'Jad' }, { id: 9, name: 'Marco' },
    { id: 10, name: 'Thierno' }, { id: 11, name: 'Peniel' }, { id: 12, name: 'Nat' }
];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function detectDataFormat(record) {
    if (record.zones && typeof record.zones === 'object') return 'new';
    if (record.zoneId && record.tentes !== undefined) return 'old';
    return 'unknown';
}

function normalizeHistoryData(rawData) {
    if (!rawData || !Array.isArray(rawData)) return [];
    const normalized = [];
    rawData.forEach(record => {
        const format = detectDataFormat(record);
        if (format === 'old') {
            normalized.push(record);
        } else if (format === 'new') {
            const zones = record.zones;
            const distance = zones.Distance || '3pt';
            const shotType = zones.types === 'mouvement' ? 'mouv' : 'arret';
            Object.keys(zones).forEach(zoneKey => {
                if (zoneKey === 'Distance' || zoneKey === 'types') return;
                const zoneData = zones[zoneKey];
                if (!zoneData || typeof zoneData !== 'object') return;
                const zoneId = ZONE_KEY_TO_ID[zoneKey] || zoneKey.toLowerCase();
                const attempted = zoneData.attempted || 0;
                const made = zoneData.made || 0;
                if (attempted > 0) {
                    normalized.push({
                        id: `${record.id}_${zoneKey}`,
                        playerId: record.playerId,
                        zoneId: zoneId,
                        date: record.date,
                        type: `${distance}_${shotType}`,
                        tentes: attempted,
                        marques: made
                    });
                }
            });
        }
    });
    console.log(`📊 Normalisation: ${rawData.length} enregistrements → ${normalized.length} entrées`);
    return normalized;
}

function parseType(type) {
    if (!type) return { distance: '3pt', shotType: 'arret' };
    const t = type.toLowerCase();
    let distance = '3pt';
    if (t.includes('2pt')) distance = '2pt';
    else if (t.includes('lf')) distance = 'lf';
    let shotType = 'arret';
    if (t.includes('mouv')) shotType = 'mouv';
    return { distance, shotType };
}

function getZoneKey(zoneId) {
    const zone = ZONES_CONFIG.find(z => z.id === zoneId);
    return zone ? zone.key : zoneId;
}

const ZONE_POSITIONS = {
    'gauche_0': { '3pt': { xMin: 4, xMax: 12, yMin: 8, yMax: 28 }, '2pt': { xMin: 8, xMax: 18, yMin: 10, yMax: 22 } },
    'droit_0': { '3pt': { xMin: 88, xMax: 96, yMin: 8, yMax: 28 }, '2pt': { xMin: 82, xMax: 92, yMin: 10, yMax: 22 } },
    'gauche_45': { '3pt': { xMin: 6, xMax: 22, yMin: 45, yMax: 65 }, '2pt': { xMin: 18, xMax: 32, yMin: 30, yMax: 48 } },
    'droit_45': { '3pt': { xMin: 78, xMax: 94, yMin: 45, yMax: 65 }, '2pt': { xMin: 68, xMax: 82, yMin: 30, yMax: 48 } },
    'gauche_70': { '3pt': { xMin: 18, xMax: 35, yMin: 62, yMax: 78 }, '2pt': { xMin: 25, xMax: 40, yMin: 38, yMax: 52 } },
    'droit_70': { '3pt': { xMin: 65, xMax: 82, yMin: 62, yMax: 78 }, '2pt': { xMin: 60, xMax: 75, yMin: 38, yMax: 52 } },
    'axe': { '3pt': { xMin: 32, xMax: 68, yMin: 72, yMax: 88 }, '2pt': { xMin: 38, xMax: 62, yMin: 42, yMax: 58 } },
    'lf': { 'lf': { xMin: 44, xMax: 56, yMin: 38, yMax: 44 } }
};

function zoneToCoordinates(zoneId, type) {
    const { distance } = parseType(type);
    const zoneConfig = ZONE_POSITIONS[zoneId];
    if (!zoneConfig) return { x: 50 + (Math.random() - 0.5) * 20, y: 50 + (Math.random() - 0.5) * 20 };
    const posConfig = zoneConfig[distance] || zoneConfig['3pt'] || Object.values(zoneConfig)[0];
    if (!posConfig) return { x: 50 + (Math.random() - 0.5) * 20, y: 50 + (Math.random() - 0.5) * 20 };
    return { x: posConfig.xMin + Math.random() * (posConfig.xMax - posConfig.xMin), y: posConfig.yMin + Math.random() * (posConfig.yMax - posConfig.yMin) };
}

function convertHistoryToShots(historyData, playerFilter) {
    const shots = [];
    if (!historyData || !Array.isArray(historyData)) return shots;
    historyData.forEach(record => {
        if (playerFilter && playerFilter !== 'team' && record.playerId.toString() !== playerFilter) return;
        const zoneId = record.zoneId || 'axe';
        const tentes = record.tentes || 0;
        const marques = record.marques || 0;
        const { distance, shotType } = parseType(record.type);
        for (let i = 0; i < marques; i++) {
            const coords = zoneToCoordinates(zoneId, record.type);
            shots.push({ ...coords, result: 'made', player_id: record.playerId.toString(), zone: zoneId, distance, shot_type: shotType, date: record.date });
        }
        for (let i = 0; i < (tentes - marques); i++) {
            const coords = zoneToCoordinates(zoneId, record.type);
            shots.push({ ...coords, result: 'missed', player_id: record.playerId.toString(), zone: zoneId, distance, shot_type: shotType, date: record.date });
        }
    });
    return shots;
}

// --- APP ---
function App() {
    const [activeModule, setActiveModule] = useState('shooting');
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [historyData, setHistoryData] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const h = localStorage.getItem('basketball_history');
        const p = localStorage.getItem('basketball_players');
        if (h) { 
            const parsed = JSON.parse(h);
            const normalized = normalizeHistoryData(parsed);
            setHistoryData(normalized);
        }
        if (p) setPlayers(JSON.parse(p));
    }, []);

    const updateHistory = (newData) => { 
        setHistoryData(newData); 
        localStorage.setItem('basketball_history', JSON.stringify(newData)); 
    };
    const updatePlayers = (newPlayers) => { 
        setPlayers(newPlayers); 
        localStorage.setItem('basketball_players', JSON.stringify(newPlayers)); 
    };

    const handleCloud = async (mode) => {
        if (!db) return alert("Firebase non configuré");
        setIsSyncing(true);
        try {
            const docRef = db.collection('stats_v3').doc('backup_v5');
            if (mode === 'save') {
                await docRef.set({ history: JSON.stringify(historyData), players: JSON.stringify(players), last: new Date().toISOString() });
                alert("✅ Données sauvegardées !");
            } else {
                const doc = await docRef.get();
                if (doc.exists) {
                    const d = doc.data();
                    const loadedRaw = JSON.parse(d.history);
                    const loadedPlayers = JSON.parse(d.players);
                    const normalized = normalizeHistoryData(loadedRaw);
                    const totalShots = normalized.reduce((acc, r) => acc + (r.tentes || 0), 0);
                    console.log('📥 Firebase:', loadedRaw.length, '→', normalized.length, 'entrées,', totalShots, 'tirs');
                    updateHistory(normalized);
                    updatePlayers(loadedPlayers);
                    alert(`✅ ${normalized.length} entrées (${totalShots} tirs) !`);
                } else alert("Aucune sauvegarde trouvée.");
            }
        } catch (e) { console.error(e); alert("Erreur: " + e.message); }
        setIsSyncing(false);
    };

    return (
        <div className="min-h-screen pb-12 bg-gray-50 text-gray-800 font-sans">
            <div className="bg-white sticky top-0 z-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    🏀 StatElite <span className="text-xs text-white bg-slate-800 px-2 rounded-full font-normal">v9.2</span>
                </h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={()=>setActiveModule('shooting')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='shooting'?'bg-white shadow text-blue-600':'text-gray-500'}`}>Saisie</button>
                    <button onClick={()=>setActiveModule('analysis')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='analysis'?'bg-white shadow text-blue-600':'text-gray-500'}`}>Analyse</button>
                    <button onClick={()=>setActiveModule('shotchart')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='shotchart'?'bg-white shadow text-orange-600':'text-gray-500'}`}>Shot Chart</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={()=>handleCloud('save')} disabled={isSyncing} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{isSyncing?'...':'Save'}</button>
                    <button onClick={()=>handleCloud('load')} disabled={isSyncing} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Load</button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
                {activeModule === 'shooting' && <ShootingModule players={players} setPlayers={updatePlayers} historyData={historyData} setHistoryData={updateHistory} />}
                {activeModule === 'analysis' && <AnalysisModule players={players} historyData={historyData} setHistoryData={updateHistory} />}
                {activeModule === 'shotchart' && <ShotChartModule players={players} historyData={historyData} />}
            </div>
        </div>
    );
}

// --- MODULE SAISIE ---
function ShootingModule({ players, setPlayers, historyData, setHistoryData }) {
    const [mode, setMode] = useState('field');
    const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id);
    const [selectedZoneId, setSelectedZoneId] = useState(null);
    const [distance, setDistance] = useState('3pt');
    const [typeTir, setTypeTir] = useState('arret');
    const [tentes, setTentes] = useState('');
    const [marques, setMarques] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [newPlayer, setNewPlayer] = useState('');

    useEffect(() => {
        if (mode === 'lf') { setDistance('lf'); setTypeTir('arret'); setSelectedZoneId('lf'); }
        else { setDistance('3pt'); setTypeTir('arret'); setSelectedZoneId(null); }
        setTentes(''); setMarques('');
    }, [mode]);

    const saveShot = () => {
        const tt = parseInt(tentes), tr = parseInt(marques);
        if (!selectedPlayer || !selectedZoneId || isNaN(tt) || tt === 0 || tr > tt) return alert("Vérifiez les données");
        const newRecord = { id: Date.now() + Math.random(), playerId: parseInt(selectedPlayer), zoneId: selectedZoneId, date, type: `${distance}_${typeTir}`, tentes: tt, marques: tr };
        setHistoryData([...historyData, newRecord]);
        setTentes(''); setMarques('');
        const btn = document.getElementById('validBtn');
        if (btn) { btn.innerText = "✅ OK"; setTimeout(() => btn.innerText = "VALIDER", 800); }
    };

    const addPlayer = () => { if (newPlayer.trim()) { setPlayers([...players, { id: Date.now(), name: newPlayer }]); setNewPlayer(''); } };

    const playerQuickStats = useMemo(() => {
        const data = historyData.filter(r => r.playerId === selectedPlayer);
        const total = data.reduce((acc, r) => acc + (r.tentes || 0), 0);
        const made = data.reduce((acc, r) => acc + (r.marques || 0), 0);
        return { total, made, pct: total > 0 ? Math.round((made / total) * 100) : 0 };
    }, [historyData, selectedPlayer]);

    return (
        <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
                    <h3 className="font-bold text-gray-400 text-xs uppercase mb-3">Joueurs</h3>
                    <div className="flex gap-2 mb-3">
                        <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} className="bg-gray-50 border p-2 w-full rounded text-sm outline-none" placeholder="Nouveau..." />
                        <button onClick={addPlayer} className="bg-blue-600 text-white rounded px-3 font-bold">+</button>
                    </div>
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                        {players.map(p => (
                            <button key={p.id} onClick={() => setSelectedPlayer(p.id)} className={`w-full text-left p-3 rounded-lg transition flex justify-between ${selectedPlayer === p.id ? 'bg-slate-800 text-white shadow-md' : 'hover:bg-gray-50 text-gray-600'}`}>
                                <span className="font-bold text-sm">{p.name}</span>
                                {selectedPlayer === p.id && <span className="text-blue-400">●</span>}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                    <div className="text-xs uppercase opacity-75 mb-1">Stats joueur</div>
                    <div className="text-3xl font-black">{playerQuickStats.pct}%</div>
                    <div className="text-sm opacity-75">{playerQuickStats.made}/{playerQuickStats.total} tirs</div>
                </div>
            </div>
            <div className="lg:col-span-9 space-y-6">
                <div className="bg-white p-2 rounded-xl shadow border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                        <button onClick={() => setMode('field')} className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-bold text-sm transition ${mode === 'field' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>Tirs Champ</button>
                        <button onClick={() => setMode('lf')} className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-bold text-sm transition ${mode === 'lf' ? 'bg-white text-purple-600 shadow' : 'text-gray-500'}`}>Lancers Francs</button>
                    </div>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-gray-50 font-bold text-gray-600 rounded-lg px-4 py-2 outline-none text-sm w-full sm:w-auto" />
                </div>
                <div className={`bg-white rounded-2xl shadow-xl border-4 p-6 transition-colors ${mode === 'lf' ? 'border-purple-50' : 'border-blue-50'}`}>
                    {mode === 'field' && (
                        <>
                            <div className="flex justify-center gap-4 mb-6">
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setDistance('2pt')} className={`px-4 py-1 rounded font-bold text-sm ${distance === '2pt' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>2 Pts</button>
                                    <button onClick={() => setDistance('3pt')} className={`px-4 py-1 rounded font-bold text-sm ${distance === '3pt' ? 'bg-white shadow text-purple-600' : 'text-gray-400'}`}>3 Pts</button>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setTypeTir('arret')} className={`px-4 py-1 rounded font-bold text-sm ${typeTir === 'arret' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>Arrêt 🛑</button>
                                    <button onClick={() => setTypeTir('mouv')} className={`px-4 py-1 rounded font-bold text-sm ${typeTir === 'mouv' ? 'bg-white shadow text-orange-600' : 'text-gray-400'}`}>Mouv 🏃</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                {ZONES_CONFIG.map(z => (
                                    <button key={z.id} onClick={() => setSelectedZoneId(z.id)} className={`py-4 rounded-xl border-2 transition ${selectedZoneId === z.id ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-105' : 'border-gray-100 text-gray-500 hover:border-blue-200 bg-white'}`}>
                                        <span className="font-bold text-sm">{z.label}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {(selectedZoneId || mode === 'lf') ? (
                        <div className="animate-fade-in">
                            <div className="text-center mb-4 text-xs uppercase font-bold text-gray-400 tracking-widest">
                                {mode === 'lf' ? 'Lancer Franc' : `${distance.toUpperCase()} ${typeTir} - ${getZoneKey(selectedZoneId)}`}
                            </div>
                            <div className="flex justify-center items-end gap-8 mb-6">
                                <div className="text-center">
                                    <label className="text-xs font-bold text-gray-400 block mb-1">TENTÉS</label>
                                    <input type="number" value={tentes} onChange={e => setTentes(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-200" placeholder="0" />
                                </div>
                                <div className="text-center">
                                    <label className="text-xs font-bold text-green-500 block mb-1">MARQUÉS</label>
                                    <input type="number" value={marques} onChange={e => setMarques(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-green-50 text-green-600 rounded-xl outline-none focus:ring-2 focus:ring-green-200" placeholder="0" />
                                </div>
                            </div>
                            <button id="validBtn" onClick={saveShot} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition active:scale-95">VALIDER</button>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">👈 Sélectionnez une zone</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- MODULE ANALYSE ---
function AnalysisModule({ players, historyData, setHistoryData }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredData = useMemo(() => {
        let data = historyData || [];
        if (startDate) data = data.filter(d => d.date >= startDate);
        if (endDate) data = data.filter(d => d.date <= endDate);
        return data;
    }, [historyData, startDate, endDate]);

    const stats = useMemo(() => {
        const initStat = () => ({ tt: 0, tr: 0 });
        const team = { zones: {}, types: { arret: initStat(), mouv: initStat() }, total: initStat() };
        ZONES_CONFIG.forEach(z => team.zones[z.id] = initStat());
        team.zones['lf'] = initStat();
        const playersStats = {};
        players.forEach(p => {
            playersStats[p.id] = { zones: {}, types: { arret: initStat(), mouv: initStat() }, total: initStat() };
            ZONES_CONFIG.forEach(z => playersStats[p.id].zones[z.id] = initStat());
            playersStats[p.id].zones['lf'] = initStat();
        });
        filteredData.forEach(record => {
            const pid = record.playerId;
            const { shotType } = parseType(record.type);
            const zoneId = record.zoneId || 'axe';
            const tt = record.tentes || 0;
            const tr = record.marques || 0;
            team.total.tt += tt; team.total.tr += tr;
            if (team.types[shotType]) { team.types[shotType].tt += tt; team.types[shotType].tr += tr; }
            if (team.zones[zoneId]) { team.zones[zoneId].tt += tt; team.zones[zoneId].tr += tr; }
            if (playersStats[pid]) {
                playersStats[pid].total.tt += tt; playersStats[pid].total.tr += tr;
                if (playersStats[pid].types[shotType]) { playersStats[pid].types[shotType].tt += tt; playersStats[pid].types[shotType].tr += tr; }
                if (playersStats[pid].zones[zoneId]) { playersStats[pid].zones[zoneId].tt += tt; playersStats[pid].zones[zoneId].tr += tr; }
            }
        });
        const bestPerformers = {};
        [...ZONES_CONFIG.map(z => z.id), 'lf'].forEach(zId => {
            let best = null;
            players.forEach(p => {
                const s = playersStats[p.id]?.zones[zId];
                if (s && s.tt >= 5) {
                    const pct = (s.tr / s.tt) * 100;
                    if (!best || pct > best.pct) best = { pid: p.id, pct };
                }
            });
            if (best) bestPerformers[zId] = best;
        });
        return { team, playersStats, bestPerformers };
    }, [filteredData, players]);

    const fmt = (s) => s.tt > 0 ? Math.round((s.tr / s.tt) * 100) + '%' : '-';
    const fmtDet = (s) => s.tt > 0 ? `${s.tr}/${s.tt}` : '';
    const setQuickRange = (type) => {
        const now = new Date();
        if (type === 'all') { setStartDate(''); setEndDate(''); }
        if (type === 'month') { setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]); setEndDate(''); }
        if (type === 'season') { const y = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear(); setStartDate(new Date(y, 8, 1).toISOString().split('T')[0]); setEndDate(''); }
    };
    const deleteRecord = (id) => { if (confirm("Supprimer ?")) setHistoryData(historyData.filter(d => d.id !== id)); };
    const totalShots = filteredData.reduce((acc, r) => acc + (r.tentes || 0), 0);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    {['all', 'month', 'season'].map(t => (
                        <button key={t} onClick={() => setQuickRange(t)} className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-white hover:shadow-sm rounded uppercase transition">
                            {t === 'all' ? 'Tout' : t === 'month' ? 'Mois' : 'Saison'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-400">Du</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 outline-none" />
                    <span className="font-bold text-gray-400">Au</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 outline-none" />
                </div>
                <div className="text-sm text-gray-500 font-bold">{filteredData.length} séries • {totalShots} tirs</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-3 font-bold flex justify-between">
                        <span>🌍 Global</span>
                        <span className="text-green-400">{stats.team.total.tr}/{stats.team.total.tt} ({fmt(stats.team.total)})</span>
                    </div>
                    <div className="p-4 flex justify-around items-center">
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Arrêt 🛑</div>
                            <div className="text-2xl font-black text-slate-800">{fmt(stats.team.types.arret)}</div>
                            <div className="text-xs text-gray-500">{fmtDet(stats.team.types.arret)}</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Mouvement 🏃</div>
                            <div className="text-2xl font-black text-slate-800">{fmt(stats.team.types.mouv)}</div>
                            <div className="text-xs text-gray-500">{fmtDet(stats.team.types.mouv)}</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">LF 🏀</div>
                            <div className="text-2xl font-black text-orange-600">{fmt(stats.team.zones.lf)}</div>
                            <div className="text-xs text-gray-500">{fmtDet(stats.team.zones.lf)}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Par Zone (Équipe)</h3>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {ZONES_CONFIG.map(z => {
                            const s = stats.team.zones[z.id];
                            const pct = s.tt > 0 ? (s.tr / s.tt) * 100 : 0;
                            const color = s.tt === 0 ? 'bg-gray-50' : pct >= 50 ? 'bg-green-100 text-green-800' : pct >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                            return (
                                <div key={z.id} className={`rounded p-2 ${color}`}>
                                    <span className="text-[10px] font-bold uppercase block">{z.key}</span>
                                    <span className="font-black text-sm">{fmt(s)}</span>
                                    <span className="text-[9px] opacity-75 block">{fmtDet(s)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-slate-800">📊 Performance Individuelle</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b">
                                <th className="p-3 text-left bg-white sticky left-0 z-10 shadow-sm min-w-[100px]">Joueur</th>
                                <th className="p-3 bg-blue-50/50">Arrêt</th>
                                <th className="p-3 bg-red-50/50 border-r">Mouv</th>
                                {ZONES_CONFIG.map(z => <th key={z.id} className="p-3 min-w-[50px]">{z.key}</th>)}
                                <th className="p-3 bg-orange-50 border-l">LF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {players.map(p => {
                                const ps = stats.playersStats[p.id];
                                if (!ps || ps.total.tt === 0) return null;
                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/30">
                                        <td className="p-3 text-left font-bold text-slate-700 bg-white sticky left-0 z-10 shadow-sm border-r">{p.name}</td>
                                        <td className="p-3 bg-blue-50/20 font-mono font-bold text-blue-700">{fmt(ps.types.arret)}</td>
                                        <td className="p-3 bg-red-50/20 font-mono font-bold text-red-700 border-r">{fmt(ps.types.mouv)}</td>
                                        {ZONES_CONFIG.map(z => {
                                            const s = ps.zones[z.id];
                                            const isBest = stats.bestPerformers[z.id]?.pid === p.id;
                                            return (
                                                <td key={z.id} className={`p-2 ${isBest ? 'bg-yellow-100' : ''}`}>
                                                    <div className={`font-bold ${isBest ? 'text-yellow-800' : 'text-gray-600'}`}>{fmt(s)}</div>
                                                    <div className="text-[10px] text-gray-400">{fmtDet(s)}</div>
                                                    {isBest && <span className="text-[8px]">👑</span>}
                                                </td>
                                            );
                                        })}
                                        <td className={`p-3 border-l ${stats.bestPerformers.lf?.pid === p.id ? 'bg-orange-100' : 'bg-orange-50/30'}`}>
                                            <div className="font-bold text-orange-700">{fmt(ps.zones.lf)}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-sm mb-4 text-gray-600 uppercase">📜 Historique récent</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredData.length === 0 ? <p className="text-gray-400 italic">Aucune donnée.</p> :
                        filteredData.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50).map(rec => {
                            const pName = players.find(p => p.id === rec.playerId)?.name || '?';
                            return (
                                <div key={rec.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border text-sm hover:bg-white hover:shadow-sm transition">
                                    <div>
                                        <span className="font-bold text-slate-700">{pName}</span>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <span className="text-gray-500">{rec.date}</span>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <span className="text-blue-500 text-xs font-bold uppercase">{getZoneKey(rec.zoneId)} {rec.type}</span>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <span className="font-mono font-bold text-slate-800">{rec.marques}/{rec.tentes}</span>
                                        <button onClick={() => deleteRecord(rec.id)} className="text-red-400 hover:text-red-600 p-1 rounded">🗑️</button>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

// --- MODULE SHOT CHART ---
function ShotChartModule({ players, historyData }) {
    const [selectedPlayer, setSelectedPlayer] = useState('team');
    const [viewType, setViewType] = useState('points');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [resultFilter, setResultFilter] = useState('all');
    const [distanceFilter, setDistanceFilter] = useState('all');
    const [apiError, setApiError] = useState(null);

    const allShots = useMemo(() => convertHistoryToShots(historyData, selectedPlayer), [historyData, selectedPlayer]);

    const filteredShots = useMemo(() => {
        let shots = allShots;
        if (resultFilter === 'made') shots = shots.filter(s => s.result === 'made');
        else if (resultFilter === 'missed') shots = shots.filter(s => s.result === 'missed');
        if (distanceFilter !== 'all') shots = shots.filter(s => s.distance === distanceFilter);
        return shots;
    }, [allShots, resultFilter, distanceFilter]);

    const localStats = useMemo(() => {
        const total = filteredShots.length;
        const made = filteredShots.filter(s => s.result === 'made').length;
        return { total, made, missed: total - made, pct: total > 0 ? Math.round((made / total) * 1000) / 10 : 0 };
    }, [filteredShots]);

    const zoneStats = useMemo(() => {
        const stats = {};
        ZONES_CONFIG.forEach(z => stats[z.id] = { made: 0, total: 0 });
        let data = historyData || [];
        if (selectedPlayer !== 'team') data = data.filter(r => r.playerId.toString() === selectedPlayer);
        if (distanceFilter !== 'all') data = data.filter(r => parseType(r.type).distance === distanceFilter);
        data.forEach(record => {
            const zoneId = record.zoneId;
            if (stats[zoneId]) { stats[zoneId].total += record.tentes || 0; stats[zoneId].made += record.marques || 0; }
        });
        Object.keys(stats).forEach(z => { const s = stats[z]; s.pct = s.total > 0 ? Math.round((s.made / s.total) * 1000) / 10 : null; });
        return stats;
    }, [historyData, selectedPlayer, distanceFilter]);

    const getPctColor = (pct) => {
        if (pct === null) return 'rgba(128, 128, 128, 0.3)';
        if (pct < 25) return `rgba(59, 130, 246, ${0.4 + (pct / 25) * 0.3})`;
        else if (pct < 40) { const t = (pct - 25) / 15; return `rgba(${Math.round(59 + t * 175)}, ${Math.round(130 + t * 49)}, ${Math.round(246 - t * 246)}, 0.7)`; }
        else if (pct < 55) { const t = (pct - 40) / 15; return `rgba(${Math.round(234 + t * 15)}, ${Math.round(179 - t * 64)}, 50, 0.75)`; }
        else { const t = Math.min((pct - 55) / 20, 1); return `rgba(${Math.round(249 - t * 50)}, ${Math.round(115 - t * 85)}, 30, 0.85)`; }
    };

    const getPlayerCount = (pid) => (historyData || []).filter(r => r.playerId === pid).reduce((acc, r) => acc + (r.tentes || 0), 0);

    const generateHeatmap = async () => {
        setIsLoading(true); setApiError(null); setGeneratedImage(null);
        if (filteredShots.length < 3) { alert('Minimum 3 tirs requis'); setIsLoading(false); return; }
        try {
            console.log('🔥 Heatmap - API:', API_BASE_URL, '- Tirs:', filteredShots.length);
            await fetch(`${API_BASE_URL}/api/shots/team`, { method: 'DELETE' });
            const bulkRes = await fetch(`${API_BASE_URL}/api/shots/bulk`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shots: filteredShots })
            });
            if (!bulkRes.ok) throw new Error(`Erreur envoi: ${bulkRes.status}`);
            const playerId = selectedPlayer === 'team' ? 'team' : selectedPlayer;
            const heatmapRes = await fetch(`${API_BASE_URL}/api/heatmap/${playerId}`);
            if (!heatmapRes.ok) throw new Error(`Erreur heatmap: ${heatmapRes.status}`);
            const heatmapData = await heatmapRes.json();
            setGeneratedImage(heatmapData.image);
            setViewType('heatmap');
            console.log('✅ Heatmap générée!');
        } catch (e) {
            console.error('❌ Erreur:', e);
            setApiError(e.message);
            alert(`Erreur API: ${e.message}`);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <select value={selectedPlayer} onChange={(e) => { setSelectedPlayer(e.target.value); setGeneratedImage(null); }} className="bg-gray-50 border rounded-lg px-4 py-2 font-bold text-sm outline-none">
                        <option value="team">🏀 Équipe ({allShots.length} tirs)</option>
                        {players.map(p => <option key={p.id} value={p.id.toString()}>{p.name} ({getPlayerCount(p.id)})</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="bg-gray-50 border rounded-lg px-3 py-2 text-sm outline-none">
                            <option value="all">Tous</option>
                            <option value="made">✅ Réussis</option>
                            <option value="missed">❌ Ratés</option>
                        </select>
                        <select value={distanceFilter} onChange={(e) => setDistanceFilter(e.target.value)} className="bg-gray-50 border rounded-lg px-3 py-2 text-sm outline-none">
                            <option value="all">Toutes distances</option>
                            <option value="2pt">2 Points</option>
                            <option value="3pt">3 Points</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewType('points')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${viewType === 'points' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>📍 Points</button>
                        <button onClick={() => setViewType('zones')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${viewType === 'zones' ? 'bg-gradient-to-r from-blue-500 to-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>🌡️ Zones</button>
                        <button onClick={generateHeatmap} disabled={isLoading} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${viewType === 'heatmap' ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'} ${isLoading ? 'opacity-50' : ''}`}>
                            {isLoading ? '⏳...' : '🔥 Heatmap'}
                        </button>
                    </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">API: {API_BASE_URL} | Tirs: {filteredShots.length}</div>
            </div>
            {apiError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"><strong>Erreur:</strong> {apiError}</div>}
            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h3 className="font-bold text-gray-700 text-sm mb-3">📊 Statistiques</h3>
                        <div className="text-center py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mb-3">
                            <div className="text-3xl font-black text-blue-600">{localStats.pct}%</div>
                            <div className="text-xs text-blue-500 font-bold uppercase">Réussite</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 rounded-lg p-2"><div className="text-lg font-black text-gray-800">{localStats.total}</div><div className="text-[10px] text-gray-500">Total</div></div>
                            <div className="bg-green-50 rounded-lg p-2"><div className="text-lg font-black text-green-600">{localStats.made}</div><div className="text-[10px] text-green-600">Réussis</div></div>
                            <div className="bg-red-50 rounded-lg p-2"><div className="text-lg font-black text-red-500">{localStats.missed}</div><div className="text-[10px] text-red-500">Ratés</div></div>
                        </div>
                    </div>
                    {viewType === 'zones' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h4 className="font-bold text-gray-700 text-sm mb-3">📍 Par Zone</h4>
                            <div className="space-y-2">
                                {ZONES_CONFIG.map(z => {
                                    const s = zoneStats[z.id];
                                    return (
                                        <div key={z.id} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: getPctColor(s?.pct) }}>
                                            <span className="font-bold text-sm text-white drop-shadow">{z.key}</span>
                                            <span className="font-mono text-sm text-white drop-shadow">{s?.pct !== null ? `${s.pct}%` : '-'} <span className="text-xs opacity-75">({s?.made}/{s?.total})</span></span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h4 className="font-bold text-gray-700 text-sm mb-3">📋 Légende</h4>
                        {viewType === 'zones' ? (
                            <div className="space-y-2">
                                <div className="h-4 rounded bg-gradient-to-r from-blue-500 via-yellow-400 via-orange-500 to-red-700"></div>
                                <div className="flex justify-between text-[10px] text-gray-500"><span>0%</span><span>25%</span><span>40%</span><span>55%+</span></div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-500"></span><span className="text-sm">Réussi</span></div>
                                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-500"></span><span className="text-sm">Raté</span></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-9">
                    {viewType === 'heatmap' && generatedImage ? (
                        <div className="bg-slate-900 rounded-2xl shadow-2xl p-4">
                            <img src={generatedImage} alt="Heatmap" className="w-full h-auto rounded-lg" />
                        </div>
                    ) : (
                        <div className="relative bg-gradient-to-b from-orange-700 to-orange-800 rounded-2xl shadow-2xl overflow-hidden" style={{ aspectRatio: '1' }}>
                            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                <rect x="0" y="0" width="100" height="100" fill="#c2410c" />
                                {viewType === 'zones' && (
                                    <g>
                                        <rect x="4" y="4" width="8" height="28" fill={getPctColor(zoneStats['gauche_0']?.pct)} rx="2" />
                                        <rect x="88" y="4" width="8" height="28" fill={getPctColor(zoneStats['droit_0']?.pct)} rx="2" />
                                        <path d="M 4,32 Q 4,70 25,70 L 10,32 Z" fill={getPctColor(zoneStats['gauche_45']?.pct)} />
                                        <path d="M 96,32 Q 96,70 75,70 L 90,32 Z" fill={getPctColor(zoneStats['droit_45']?.pct)} />
                                        <path d="M 25,70 Q 35,85 50,88 L 35,70 Z" fill={getPctColor(zoneStats['gauche_70']?.pct)} />
                                        <path d="M 75,70 Q 65,85 50,88 L 65,70 Z" fill={getPctColor(zoneStats['droit_70']?.pct)} />
                                        <ellipse cx="50" cy="88" rx="18" ry="8" fill={getPctColor(zoneStats['axe']?.pct)} />
                                    </g>
                                )}
                                <g stroke="rgba(255,255,255,0.8)" strokeWidth="0.6" fill="none">
                                    <rect x="4" y="4" width="92" height="92" />
                                    <rect x="31" y="4" width="38" height="22" />
                                    <rect x="38" y="4" width="24" height="10" strokeDasharray="2,1" />
                                    <circle cx="50" cy="26" r="10" />
                                    <path d="M 4,32 Q 4,85 50,85 Q 96,85 96,32" />
                                    <circle cx="50" cy="8" r="2.5" strokeWidth="0.8" fill="none" />
                                    <rect x="44" y="5" width="12" height="1.5" fill="rgba(255,255,255,0.8)" />
                                </g>
                                <g fontSize="4" fill="rgba(255,255,255,0.5)" textAnchor="middle" fontWeight="bold">
                                    <text x="8" y="20">0°G</text><text x="92" y="20">0°D</text>
                                    <text x="12" y="52">45°G</text><text x="88" y="52">45°D</text>
                                    <text x="28" y="75">70°G</text><text x="72" y="75">70°D</text>
                                    <text x="50" y="92">Axe</text>
                                </g>
                                {viewType === 'zones' && (
                                    <g fontSize="5" fill="white" textAnchor="middle" fontWeight="black">
                                        <text x="8" y="16">{zoneStats['gauche_0']?.pct !== null ? zoneStats['gauche_0'].pct + '%' : ''}</text>
                                        <text x="92" y="16">{zoneStats['droit_0']?.pct !== null ? zoneStats['droit_0'].pct + '%' : ''}</text>
                                        <text x="14" y="48">{zoneStats['gauche_45']?.pct !== null ? zoneStats['gauche_45'].pct + '%' : ''}</text>
                                        <text x="86" y="48">{zoneStats['droit_45']?.pct !== null ? zoneStats['droit_45'].pct + '%' : ''}</text>
                                        <text x="30" y="72">{zoneStats['gauche_70']?.pct !== null ? zoneStats['gauche_70'].pct + '%' : ''}</text>
                                        <text x="70" y="72">{zoneStats['droit_70']?.pct !== null ? zoneStats['droit_70'].pct + '%' : ''}</text>
                                        <text x="50" y="86">{zoneStats['axe']?.pct !== null ? zoneStats['axe'].pct + '%' : ''}</text>
                                    </g>
                                )}
                            </svg>
                            {viewType === 'points' && filteredShots.map((shot, i) => (
                                <div key={i} className={`absolute w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${shot.result === 'made' ? 'bg-green-400' : 'bg-red-400'}`} style={{ left: `${shot.x}%`, top: `${shot.y}%`, opacity: 0.85 }} />
                            ))}
                            {viewType === 'points' && filteredShots.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                                    <div className="text-center"><span className="text-5xl block mb-2">📊</span><p className="font-bold">Aucune donnée</p></div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <p className="text-xs text-indigo-700"><strong>{filteredShots.length} tirs</strong> — {viewType === 'heatmap' ? 'Heatmap Python (seaborn KDE).' : viewType === 'zones' ? 'Zones avec %.' : 'Points par zone.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
