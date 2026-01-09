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
const API_BASE_URL = 'https://opsyn.onrender.com'; // ← REMPLACER PAR VOTRE URL

const { useState, useEffect, useMemo, useRef } = React;

// --- DONNÉES & CONSTANTES ---
const ZONES_LIST = [
    { key: '0G', label: '0° G' }, { key: '45G', label: '45° G' }, { key: '70G', label: '70° G' },
    { key: 'Axe', label: 'Axe' },
    { key: '70D', label: '70° D' }, { key: '45D', label: '45° D' }, { key: '0D', label: '0° D' }
];

const INPUT_ZONES = [
    { key: '0G', name: '0° Corner G', color: 'from-blue-500 to-blue-600' },
    { key: '45G', name: '45° Aile G', color: 'from-emerald-400 to-emerald-600' },
    { key: '70G', name: '70° Elbow G', color: 'from-cyan-400 to-cyan-600' },
    { key: 'Axe', name: 'Axe Top', color: 'from-indigo-500 to-indigo-600' },
    { key: '70D', name: '70° Elbow D', color: 'from-red-500 to-red-600' },
    { key: '45D', name: '45° Aile D', color: 'from-amber-400 to-amber-600' },
    { key: '0D', name: '0° Corner D', color: 'from-pink-500 to-pink-600' }
];

const INITIAL_PLAYERS = [
    { id: 1, name: 'Maxime' }, { id: 2, name: 'Sasha' }, { id: 3, name: 'Théotime' },
    { id: 4, name: 'Noé' }, { id: 5, name: 'Keziah' }, { id: 6, name: 'Nathan' },
    { id: 7, name: 'Valentin' }, { id: 8, name: 'Jad' }, { id: 9, name: 'Marco' },
    { id: 10, name: 'Thierno' }, { id: 11, name: 'Peniel' }, { id: 12, name: 'Nat' }
];

// ============================================
// SYSTÈME DE MAPPING ZONES → COORDONNÉES
// ============================================

const BASKET_POS = { x: 50, y: 8 };

const ZONE_ANGLES = {
    '0D': 0, '45D': 45, '70D': 70, 'Axe': 90,
    '70G': 110, '45G': 135, '0G': 180,
    'Ligne': 90, 'LF': 90
};

const DISTANCE_RADIUS = {
    '2pt': { min: 8, max: 28 },
    '3pt': { min: 38, max: 48 },
    'LF': { min: 18, max: 18 }
};

const ZONE_SPREAD = {
    '0G': { angleSpread: 8, radiusSpread: 4 },
    '0D': { angleSpread: 8, radiusSpread: 4 },
    '45G': { angleSpread: 12, radiusSpread: 6 },
    '45D': { angleSpread: 12, radiusSpread: 6 },
    '70G': { angleSpread: 10, radiusSpread: 5 },
    '70D': { angleSpread: 10, radiusSpread: 5 },
    'Axe': { angleSpread: 15, radiusSpread: 5 },
    'Ligne': { angleSpread: 5, radiusSpread: 2 },
    'LF': { angleSpread: 5, radiusSpread: 2 }
};

function zoneToCoordinates(zone, distance) {
    const baseAngle = ZONE_ANGLES[zone] || 90;
    const distConfig = DISTANCE_RADIUS[distance] || DISTANCE_RADIUS['2pt'];
    const spread = ZONE_SPREAD[zone] || { angleSpread: 10, radiusSpread: 5 };
    
    const angleVariation = (Math.random() - 0.5) * 2 * spread.angleSpread;
    const angle = baseAngle + angleVariation;
    
    const baseRadius = distConfig.min + Math.random() * (distConfig.max - distConfig.min);
    const radiusVariation = (Math.random() - 0.5) * 2 * spread.radiusSpread;
    const radius = Math.max(5, baseRadius + radiusVariation);
    
    const angleRad = (angle * Math.PI) / 180;
    const x = BASKET_POS.x + radius * Math.cos(angleRad);
    const y = BASKET_POS.y + radius * Math.sin(angleRad);
    
    return {
        x: Math.max(2, Math.min(98, x)),
        y: Math.max(2, Math.min(98, y))
    };
}

function convertHistoryToShots(historyData, playerFilter = null) {
    const shots = [];
    
    historyData.forEach(session => {
        if (playerFilter && playerFilter !== 'team' && session.playerId.toString() !== playerFilter) return;
        
        const distance = session.zones.Distance || '2pt';
        const shotType = session.zones.types || 'arret';
        
        Object.keys(session.zones).forEach(zoneKey => {
            if (zoneKey === 'Distance' || zoneKey === 'types') return;
            
            const zoneData = session.zones[zoneKey];
            if (!zoneData || typeof zoneData !== 'object' || !zoneData.attempted) return;
            
            const normalizedZone = (zoneKey === 'Ligne') ? 'LF' : zoneKey;
            const effectiveDistance = (normalizedZone === 'LF') ? 'LF' : distance;
            
            for (let i = 0; i < zoneData.made; i++) {
                const coords = zoneToCoordinates(normalizedZone, effectiveDistance);
                shots.push({
                    x: coords.x, y: coords.y, result: 'made',
                    player_id: session.playerId.toString(),
                    zone: normalizedZone, distance: effectiveDistance,
                    shot_type: shotType, date: session.date
                });
            }
            
            const missed = zoneData.attempted - zoneData.made;
            for (let i = 0; i < missed; i++) {
                const coords = zoneToCoordinates(normalizedZone, effectiveDistance);
                shots.push({
                    x: coords.x, y: coords.y, result: 'missed',
                    player_id: session.playerId.toString(),
                    zone: normalizedZone, distance: effectiveDistance,
                    shot_type: shotType, date: session.date
                });
            }
        });
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
        if (h) setHistoryData(JSON.parse(h));
        if (p) setPlayers(JSON.parse(p));
    }, []);

    const updateHistory = (newData) => { setHistoryData(newData); localStorage.setItem('basketball_history', JSON.stringify(newData)); };
    const updatePlayers = (newPlayers) => { setPlayers(newPlayers); localStorage.setItem('basketball_players', JSON.stringify(newPlayers)); };

    const handleCloud = async (mode) => {
        if (!db) return alert("Firebase non configuré");
        setIsSyncing(true);
        try {
            const docRef = db.collection('stats_v3').doc('backup_v5');
            if(mode === 'save') {
                await docRef.set({ history: JSON.stringify(historyData), players: JSON.stringify(players), last: new Date().toISOString() });
                alert("✅ Données sauvegardées !");
            } else {
                const doc = await docRef.get();
                if(doc.exists) {
                    const d = doc.data();
                    updateHistory(JSON.parse(d.history));
                    updatePlayers(JSON.parse(d.players));
                    alert("✅ Données chargées !");
                } else alert("Aucune sauvegarde trouvée.");
            }
        } catch (e) { alert("Erreur: " + e.message); }
        setIsSyncing(false);
    };

    return (
        <div className="min-h-screen pb-12 bg-gray-50 text-gray-800 font-sans">
            <div className="bg-white sticky top-0 z-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    🏀 StatElite <span className="text-xs text-white bg-slate-800 px-2 rounded-full font-normal">v8.0</span>
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
    const [selectedZoneKey, setSelectedZoneKey] = useState(null);
    const [distance, setDistance] = useState('2pt');
    const [typeTir, setTypeTir] = useState('arrêt');
    const [tentes, setTentes] = useState('');
    const [marques, setMarques] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [newPlayer, setNewPlayer] = useState('');

    useEffect(() => {
        if (mode === 'lf') { setDistance('LF'); setTypeTir('arrêt'); setSelectedZoneKey('Ligne'); }
        else { setDistance('2pt'); setTypeTir('arrêt'); setSelectedZoneKey(null); }
        setTentes(''); setMarques('');
    }, [mode]);

    const saveShot = () => {
        const tt = parseInt(tentes), tr = parseInt(marques);
        if(!selectedPlayer || !selectedZoneKey || isNaN(tt) || tt===0 || tr>tt) return alert("Vérifiez les scores");
        
        const newData = [...historyData];
        const existingIndex = newData.findIndex(d => d.date === date && d.playerId === parseInt(selectedPlayer) && d.zones.Distance === distance && d.zones.types === typeTir);
        
        if (existingIndex >= 0) {
            const session = newData[existingIndex];
            if (!session.zones[selectedZoneKey]) session.zones[selectedZoneKey] = { made: 0, attempted: 0 };
            session.zones[selectedZoneKey].made += tr;
            session.zones[selectedZoneKey].attempted += tt;
            newData[existingIndex] = { ...session };
        } else {
            newData.push({
                id: Date.now().toString(36), playerId: parseInt(selectedPlayer), date,
                zones: { Distance: distance, types: typeTir, [selectedZoneKey]: { made: tr, attempted: tt } }
            });
        }
        setHistoryData(newData); setTentes(''); setMarques('');
        const btn = document.getElementById('validBtn'); if(btn) { btn.innerText = "✅ ENREGISTRÉ"; setTimeout(()=>btn.innerText = "VALIDER", 800); }
    };

    const addPlayer = () => { if(newPlayer.trim()) { setPlayers([...players, {id:Date.now(), name: newPlayer}]); setNewPlayer(''); } };

    return (
        <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
                    <h3 className="font-bold text-gray-400 text-xs uppercase mb-3">Joueurs</h3>
                    <div className="flex gap-2 mb-3"><input value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} className="bg-gray-50 border p-2 w-full rounded text-sm outline-none" placeholder="Nouveau..."/><button onClick={addPlayer} className="bg-blue-600 text-white rounded px-3 font-bold">+</button></div>
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                        {players.map(p => (
                            <button key={p.id} onClick={()=>setSelectedPlayer(p.id)} className={`w-full text-left p-3 rounded-lg transition flex justify-between ${selectedPlayer===p.id ? 'bg-slate-800 text-white shadow-md':'hover:bg-gray-50 text-gray-600'}`}>
                                <span className="font-bold text-sm">{p.name}</span>
                                {selectedPlayer===p.id && <span className="text-blue-400">●</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9 space-y-6">
                <div className="bg-white p-2 rounded-xl shadow border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                        <button onClick={()=>setMode('field')} className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-bold text-sm transition ${mode==='field'?'bg-white text-blue-600 shadow':'text-gray-500'}`}>Tirs Champ</button>
                        <button onClick={()=>setMode('lf')} className={`flex-1 sm:flex-none px-6 py-2 rounded-md font-bold text-sm transition ${mode==='lf'?'bg-white text-purple-600 shadow':'text-gray-500'}`}>Lancers Francs</button>
                    </div>
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-gray-50 font-bold text-gray-600 rounded-lg px-4 py-2 outline-none text-sm w-full sm:w-auto"/>
                </div>

                <div className={`bg-white rounded-2xl shadow-xl border-4 p-6 transition-colors ${mode==='lf'?'border-purple-50':'border-blue-50'}`}>
                    {mode === 'field' && (
                        <>
                            <div className="flex justify-center gap-4 mb-6">
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={()=>setDistance('2pt')} className={`px-4 py-1 rounded font-bold text-sm ${distance==='2pt'?'bg-white shadow text-blue-600':'text-gray-400'}`}>2 Pts</button>
                                    <button onClick={()=>setDistance('3pt')} className={`px-4 py-1 rounded font-bold text-sm ${distance==='3pt'?'bg-white shadow text-purple-600':'text-gray-400'}`}>3 Pts</button>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={()=>setTypeTir('arrêt')} className={`px-4 py-1 rounded font-bold text-sm ${typeTir==='arrêt'?'bg-white shadow text-green-600':'text-gray-400'}`}>Arrêt 🛑</button>
                                    <button onClick={()=>setTypeTir('mouvement')} className={`px-4 py-1 rounded font-bold text-sm ${typeTir==='mouvement'?'bg-white shadow text-orange-600':'text-gray-400'}`}>Mouv 🏃</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                {INPUT_ZONES.map(z => (
                                    <button key={z.key} onClick={()=>setSelectedZoneKey(z.key)} className={`py-4 rounded-xl border-2 transition relative overflow-hidden ${selectedZoneKey===z.key ? `border-transparent bg-gradient-to-br ${z.color} text-white shadow-lg scale-105` : 'border-gray-100 text-gray-500 hover:border-blue-200 bg-white'}`}>
                                        <span className="relative z-10 font-bold text-sm">{z.name}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {(selectedZoneKey || mode === 'lf') ? (
                        <div className="animate-fade-in">
                            <div className="text-center mb-4 text-xs uppercase font-bold text-gray-400 tracking-widest">
                                {mode==='lf' ? 'Lancer Franc' : `${distance} ${typeTir} - Zone ${selectedZoneKey}`}
                            </div>
                            <div className="flex justify-center items-end gap-8 mb-6">
                                <div className="text-center"><label className="text-xs font-bold text-gray-400 block mb-1">TENTÉS</label><input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-200" placeholder="0"/></div>
                                <div className="text-center"><label className="text-xs font-bold text-green-500 block mb-1">MARQUÉS</label><input type="number" value={marques} onChange={e=>setMarques(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-green-50 text-green-600 rounded-xl outline-none focus:ring-2 focus:ring-green-200" placeholder="0"/></div>
                            </div>
                            <button id="validBtn" onClick={saveShot} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition active:scale-95">VALIDER LA SÉRIE</button>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">👈 Sélectionnez une zone pour commencer</div>
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

    const calculateStats = () => {
        const initStat = () => ({ tt: 0, tr: 0 });
        const team = { zones: {}, types: { 'arrêt': initStat(), 'mouvement': initStat() }, total: initStat() };
        ZONES_LIST.forEach(z => team.zones[z.key] = initStat());
        team.zones['LF'] = initStat();

        const playersStats = {};
        players.forEach(p => {
            playersStats[p.id] = { zones: {}, types: { 'arrêt': initStat(), 'mouvement': initStat() }, total: initStat() };
            ZONES_LIST.forEach(z => playersStats[p.id].zones[z.key] = initStat());
            playersStats[p.id].zones['LF'] = initStat();
        });

        let filteredData = historyData;
        if (startDate) filteredData = filteredData.filter(d => d.date >= startDate);
        if (endDate) filteredData = filteredData.filter(d => d.date <= endDate);

        filteredData.forEach(session => {
            const pid = session.playerId;
            const type = session.zones.types;
            
            Object.keys(session.zones).forEach(key => {
                if (key === 'Distance' || key === 'types') return;
                const data = session.zones[key];
                if (!data || data.attempted === 0) return;
                const zoneKey = (key === 'Ligne') ? 'LF' : key;

                team.total.tt += data.attempted; team.total.tr += data.made;
                if (team.types[type]) { team.types[type].tt += data.attempted; team.types[type].tr += data.made; }
                if (team.zones[zoneKey]) { team.zones[zoneKey].tt += data.attempted; team.zones[zoneKey].tr += data.made; }

                if (playersStats[pid]) {
                    const pStat = playersStats[pid];
                    pStat.total.tt += data.attempted; pStat.total.tr += data.made;
                    if (pStat.types[type]) { pStat.types[type].tt += data.attempted; pStat.types[type].tr += data.made; }
                    if (pStat.zones[zoneKey]) { pStat.zones[zoneKey].tt += data.attempted; pStat.zones[zoneKey].tr += data.made; }
                }
            });
        });

        const bestPerformers = {};
        const allZoneKeys = [...ZONES_LIST.map(z => z.key), 'LF'];
        allZoneKeys.forEach(zKey => {
            let bestPid = null, bestPct = -1;
            players.forEach(p => {
                const s = playersStats[p.id].zones[zKey];
                if (s.tt >= 5) {
                    const pct = (s.tr / s.tt) * 100;
                    if (pct > bestPct) { bestPct = pct; bestPid = p.id; }
                }
            });
            if (bestPid) bestPerformers[zKey] = { pid: bestPid, pct: bestPct };
        });

        return { team, playersStats, bestPerformers, recentSessions: filteredData.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)) };
    };

    const { team, playersStats, bestPerformers, recentSessions } = calculateStats();
    const fmt = (stat) => stat.tt > 0 ? Math.round((stat.tr / stat.tt) * 100) + '%' : '-';
    const fmtDet = (stat) => stat.tt > 0 ? `${stat.tr}/${stat.tt}` : '';

    const setQuickRange = (type) => {
        const now = new Date();
        if(type==='all') { setStartDate(''); setEndDate(''); }
        if(type==='month') { const d = new Date(now.getFullYear(), now.getMonth(), 1); setStartDate(d.toISOString().split('T')[0]); setEndDate(''); }
        if(type==='season') { const startYear = now.getMonth()<8 ? now.getFullYear()-1 : now.getFullYear(); const d = new Date(startYear, 8, 1); setStartDate(d.toISOString().split('T')[0]); setEndDate(''); }
    };

    const deleteSession = (id) => { if(confirm("Supprimer ?")) setHistoryData(historyData.filter(d => d.id !== id)); };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    {['all', 'month', 'season'].map(t => (
                        <button key={t} onClick={()=>setQuickRange(t)} className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-white hover:shadow-sm rounded uppercase transition">{t === 'all' ? 'Tout' : t === 'month' ? 'Mois' : 'Saison'}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-400">Du</span>
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"/>
                    <span className="font-bold text-gray-400">Au</span>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"/>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-3 font-bold flex justify-between">
                        <span>🌍 Global par Type</span>
                        <span className="text-green-400">{team.total.tr}/{team.total.tt} ({fmt(team.total)})</span>
                    </div>
                    <div className="p-4 flex justify-around items-center">
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Tirs Arrêt 🛑</div>
                            <div className="text-2xl font-black text-slate-800">{fmt(team.types['arrêt'])}</div>
                            <div className="text-xs text-gray-500">{team.types['arrêt'].tr}/{team.types['arrêt'].tt}</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Tirs Mouvement 🏃</div>
                            <div className="text-2xl font-black text-slate-800">{fmt(team.types['mouvement'])}</div>
                            <div className="text-xs text-gray-500">{team.types['mouvement'].tr}/{team.types['mouvement'].tt}</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Lancers Francs 🏀</div>
                            <div className="text-2xl font-black text-orange-600">{fmt(team.zones['LF'])}</div>
                            <div className="text-xs text-gray-500">{team.zones['LF'].tr}/{team.zones['LF'].tt}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Performance par Zone (Équipe)</h3>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {ZONES_LIST.map(z => {
                            const stat = team.zones[z.key];
                            const pct = stat.tt > 0 ? (stat.tr/stat.tt)*100 : 0;
                            const color = stat.tt === 0 ? 'bg-gray-50' : pct >= 50 ? 'bg-green-100 text-green-800' : pct >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                            return (
                                <div key={z.key} className={`rounded p-2 ${color} flex flex-col justify-center`}>
                                    <span className="text-[10px] font-bold uppercase mb-1">{z.key}</span>
                                    <span className="font-black text-sm">{fmt(stat)}</span>
                                    <span className="text-[9px] opacity-75">{fmtDet(stat)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">📊 Performance Individuelle & Tops</h3>
                    <div className="text-xs text-gray-500 flex gap-2 items-center"><span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-full block"></span> = Leader Zone</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-gray-200">
                                <th className="p-3 text-left bg-white sticky left-0 z-10 shadow-sm min-w-[120px]">Joueur</th>
                                <th className="p-3 bg-blue-50/50 text-blue-800">Arrêt 🛑</th>
                                <th className="p-3 bg-red-50/50 text-red-800 border-r border-gray-200">Mouv 🏃</th>
                                {ZONES_LIST.map(z => <th key={z.key} className="p-3 min-w-[60px]">{z.key}</th>)}
                                <th className="p-3 bg-orange-50 text-orange-800 border-l border-gray-200">LF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {players.map(p => {
                                const s = playersStats[p.id];
                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-3 text-left font-bold text-slate-700 bg-white sticky left-0 z-10 shadow-sm border-r border-gray-100">{p.name}</td>
                                        <td className="p-3 bg-blue-50/20 font-mono text-blue-700 font-bold">{fmt(s.types['arrêt'])}</td>
                                        <td className="p-3 bg-red-50/20 font-mono text-red-700 font-bold border-r border-gray-200">{fmt(s.types['mouvement'])}</td>
                                        {ZONES_LIST.map(z => {
                                            const stat = s.zones[z.key];
                                            const isBest = bestPerformers[z.key]?.pid === p.id && bestPerformers[z.key]?.pct > 0;
                                            return (
                                                <td key={z.key} className={`p-2 relative ${isBest ? 'bg-yellow-100 ring-inset ring-2 ring-yellow-300' : ''}`}>
                                                    <div className={`font-bold ${isBest ? 'text-yellow-800 scale-110' : 'text-gray-600'}`}>{fmt(stat)}</div>
                                                    <div className="text-[10px] text-gray-400">{fmtDet(stat)}</div>
                                                    {isBest && <span className="absolute top-0 right-0 text-[8px]">👑</span>}
                                                </td>
                                            );
                                        })}
                                        <td className={`p-3 border-l border-gray-200 relative ${bestPerformers['LF']?.pid === p.id ? 'bg-orange-100' : 'bg-orange-50/30'}`}>
                                            <div className="font-bold text-orange-700">{fmt(s.zones['LF'])}</div>
                                            {bestPerformers['LF']?.pid === p.id && <span className="absolute top-1 right-1 text-[8px]">👑</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-sm mb-4 text-gray-600 uppercase">📜 Historique des séances</h3>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {recentSessions.length === 0 ? <p className="text-gray-400 italic text-sm">Aucune séance trouvée.</p> : 
                    recentSessions.map(sess => {
                        const pName = players.find(p=>p.id===sess.playerId)?.name || '?';
                        let totalSessM = 0, totalSessA = 0;
                        Object.keys(sess.zones).forEach(k => {
                            if(k!=='Distance'&&k!=='types'){ totalSessM += sess.zones[k].made; totalSessA += sess.zones[k].attempted; }
                        });
                        return (
                            <div key={sess.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 text-sm hover:bg-white hover:shadow-sm transition">
                                <div>
                                    <span className="font-bold text-slate-700">{pName}</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="text-gray-500">{sess.date}</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="text-blue-500 text-xs font-bold uppercase">{sess.zones.Distance} {sess.zones.types}</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="font-mono font-bold text-slate-800">{totalSessM}/{totalSessA}</span>
                                    <button onClick={()=>deleteSession(sess.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition">🗑️</button>
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
    const [mode, setMode] = useState('analysis');
    const [selectedPlayer, setSelectedPlayer] = useState('team');
    const [localShots, setLocalShots] = useState([]);
    const [viewType, setViewType] = useState('heatmap');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [distance, setDistance] = useState('2pt');
    const [shotType, setShotType] = useState('arret');
    const [resultFilter, setResultFilter] = useState('all');
    const [dataSource, setDataSource] = useState('firebase');
    const courtRef = useRef(null);

    const firebaseShots = useMemo(() => convertHistoryToShots(historyData, selectedPlayer), [historyData, selectedPlayer]);

    const localStats = useMemo(() => {
        const shots = dataSource === 'firebase' ? firebaseShots : localShots;
        let filtered = shots;
        if (resultFilter === 'made') filtered = shots.filter(s => s.result === 'made');
        else if (resultFilter === 'missed') filtered = shots.filter(s => s.result === 'missed');
        
        const total = filtered.length;
        const made = filtered.filter(s => s.result === 'made').length;
        return { total, made, missed: total - made, percentage: total > 0 ? Math.round((made / total) * 1000) / 10 : 0 };
    }, [firebaseShots, localShots, dataSource, resultFilter]);

    const displayShots = useMemo(() => {
        const shots = dataSource === 'firebase' ? firebaseShots : localShots;
        if (resultFilter === 'made') return shots.filter(s => s.result === 'made');
        if (resultFilter === 'missed') return shots.filter(s => s.result === 'missed');
        return shots;
    }, [firebaseShots, localShots, dataSource, resultFilter]);

    const handleCourtClick = (e, result) => {
        if (mode !== 'input' || !courtRef.current) return;
        const rect = courtRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        setLocalShots(prev => [...prev, {
            x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, result,
            player_id: selectedPlayer === 'team' ? players[0]?.id.toString() : selectedPlayer,
            distance, shot_type: shotType, date: new Date().toISOString().split('T')[0]
        }]);
    };

    const generateVisualization = async (type) => {
        setIsLoading(true);
        setViewType(type);
        
        const shotsToSend = dataSource === 'firebase' ? firebaseShots : localShots;
        if (shotsToSend.length < 3) { alert('Il faut au moins 3 tirs'); setIsLoading(false); return; }
        
        try {
            await fetch(`${API_BASE_URL}/api/shots/team`, { method: 'DELETE' });
            await fetch(`${API_BASE_URL}/api/shots/bulk`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shots: shotsToSend })
            });
            
            const endpoint = type === 'heatmap' ? 'heatmap' : 'shotchart';
            const filter = resultFilter !== 'all' ? `?result_filter=${resultFilter}` : '';
            const res = await fetch(`${API_BASE_URL}/api/${endpoint}/${selectedPlayer}${filter}`);
            
            if (!res.ok) throw new Error('Erreur génération');
            const data = await res.json();
            setGeneratedImage(data.image);
        } catch (e) {
            console.error('Erreur API:', e);
            alert('Erreur API. Vérifiez que le backend est démarré sur ' + API_BASE_URL);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setMode('analysis')} className={`px-5 py-2 rounded-md font-bold text-sm transition ${mode === 'analysis' ? 'bg-white text-purple-600 shadow' : 'text-gray-500'}`}>📊 Analyse Firebase</button>
                        <button onClick={() => setMode('input')} className={`px-5 py-2 rounded-md font-bold text-sm transition ${mode === 'input' ? 'bg-white text-emerald-600 shadow' : 'text-gray-500'}`}>🎯 Saisie Terrain</button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500">Joueur:</span>
                        <select value={selectedPlayer} onChange={(e) => { setSelectedPlayer(e.target.value); setGeneratedImage(null); }} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-bold text-sm outline-none">
                            <option value="team">🏀 Équipe Complète</option>
                            {players.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
                        </select>
                    </div>
                    
                    {mode === 'analysis' && (
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setDataSource('firebase')} className={`px-3 py-1 rounded text-xs font-bold ${dataSource === 'firebase' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>🔥 Firebase ({firebaseShots.length})</button>
                                <button onClick={() => setDataSource('session')} className={`px-3 py-1 rounded text-xs font-bold ${dataSource === 'session' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}>📍 Session ({localShots.length})</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    {mode === 'input' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h3 className="font-bold text-gray-700 text-sm mb-4">⚙️ Paramètres</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-2">DISTANCE</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button onClick={() => setDistance('2pt')} className={`flex-1 py-2 rounded text-sm font-bold ${distance === '2pt' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>2 Pts</button>
                                        <button onClick={() => setDistance('3pt')} className={`flex-1 py-2 rounded text-sm font-bold ${distance === '3pt' ? 'bg-white shadow text-purple-600' : 'text-gray-400'}`}>3 Pts</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-2">TYPE</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button onClick={() => setShotType('arret')} className={`flex-1 py-2 rounded text-sm font-bold ${shotType === 'arret' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>🛑 Arrêt</button>
                                        <button onClick={() => setShotType('mouvement')} className={`flex-1 py-2 rounded text-sm font-bold ${shotType === 'mouvement' ? 'bg-white shadow text-orange-600' : 'text-gray-400'}`}>🏃 Mouv</button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700"><strong>Clic gauche</strong> = Réussi ✅<br/><strong>Clic droit</strong> = Raté ❌</p>
                            </div>
                        </div>
                    )}
                    
                    {mode === 'analysis' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h3 className="font-bold text-gray-700 text-sm mb-4">🎨 Visualisation</h3>
                            <div className="space-y-3">
                                <button onClick={() => generateVisualization('heatmap')} disabled={isLoading} className={`w-full py-3 rounded-lg font-bold text-sm transition ${viewType === 'heatmap' && generatedImage ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {isLoading && viewType === 'heatmap' ? '⏳ Génération...' : '🔥 Générer Heatmap'}
                                </button>
                                <button onClick={() => generateVisualization('shotchart')} disabled={isLoading} className={`w-full py-3 rounded-lg font-bold text-sm transition ${viewType === 'shotchart' && generatedImage ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {isLoading && viewType === 'shotchart' ? '⏳ Génération...' : '📍 Générer Shot Chart'}
                                </button>
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 block mb-2">FILTRER</label>
                                    <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                                        <option value="all">Tous les tirs</option>
                                        <option value="made">✅ Réussis uniquement</option>
                                        <option value="missed">❌ Ratés uniquement</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h3 className="font-bold text-gray-700 text-sm mb-3">📈 {selectedPlayer === 'team' ? 'Équipe' : players.find(p => p.id.toString() === selectedPlayer)?.name}</h3>
                        <div className="text-center py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mb-3">
                            <div className="text-3xl font-black text-blue-600">{localStats.percentage}%</div>
                            <div className="text-xs text-blue-500 font-bold uppercase">Réussite</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 rounded-lg p-2">
                                <div className="text-lg font-black text-gray-800">{localStats.total}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Total</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                                <div className="text-lg font-black text-green-600">{localStats.made}</div>
                                <div className="text-[10px] text-green-600 uppercase">Réussis</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2">
                                <div className="text-lg font-black text-red-500">{localStats.missed}</div>
                                <div className="text-[10px] text-red-500 uppercase">Ratés</div>
                            </div>
                        </div>
                        {mode === 'input' && localShots.length > 0 && (
                            <button onClick={() => { setLocalShots([]); setGeneratedImage(null); }} className="w-full mt-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition">🗑️ Effacer session</button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h4 className="font-bold text-gray-700 text-sm mb-3">📋 Légende</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></span><span className="text-sm text-gray-600">Tir réussi</span></div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></span><span className="text-sm text-gray-600">Tir raté</span></div>
                        </div>
                        {mode === 'analysis' && viewType === 'heatmap' && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="h-3 rounded bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600"></div>
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1"><span>Faible</span><span>Forte densité</span></div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="lg:col-span-9">
                    {mode === 'analysis' && generatedImage ? (
                        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-white text-center">
                                        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p className="font-bold">Génération en cours...</p>
                                    </div>
                                </div>
                            ) : (
                                <img src={generatedImage} alt="Shot Chart" className="w-full h-auto rounded-lg" />
                            )}
                        </div>
                    ) : (
                        <div 
                            ref={courtRef}
                            onClick={(e) => handleCourtClick(e, 'made')}
                            onContextMenu={(e) => { e.preventDefault(); handleCourtClick(e, 'missed'); }}
                            className={`relative bg-gradient-to-b from-orange-700 to-orange-900 rounded-2xl shadow-2xl overflow-hidden ${mode === 'input' ? 'cursor-crosshair' : ''}`}
                            style={{ aspectRatio: '1.06' }}
                        >
                            <svg viewBox="0 0 100 94" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                <rect x="0" y="0" width="100" height="94" fill="#c2410c" />
                                <g stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" fill="none">
                                    <rect x="4" y="4" width="92" height="86" />
                                    <rect x="31" y="4" width="38" height="38" />
                                    <rect x="38" y="4" width="24" height="16" strokeDasharray="2,1" />
                                    <circle cx="50" cy="42" r="12" />
                                    <path d="M 10 4 L 10 32 Q 10 78 50 78 Q 90 78 90 32 L 90 4" />
                                    <circle cx="50" cy="12" r="3" strokeWidth="0.8" />
                                    <rect x="44" y="8" width="12" height="1" fill="rgba(255,255,255,0.8)" />
                                </g>
                                {mode === 'analysis' && (
                                    <g fontSize="3" fill="rgba(255,255,255,0.4)" textAnchor="middle" fontWeight="bold">
                                        <text x="8" y="25">0°G</text>
                                        <text x="20" y="55">45°G</text>
                                        <text x="35" y="70">70°G</text>
                                        <text x="50" y="80">Axe</text>
                                        <text x="65" y="70">70°D</text>
                                        <text x="80" y="55">45°D</text>
                                        <text x="92" y="25">0°D</text>
                                    </g>
                                )}
                            </svg>
                            
                            {displayShots.map((shot, idx) => (
                                <div 
                                    key={idx}
                                    className={`absolute w-2.5 h-2.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 border border-white shadow-lg ${shot.result === 'made' ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ left: `${shot.x}%`, top: `${shot.y}%`, opacity: 0.85 }}
                                    title={`${shot.zone || ''} ${shot.distance || ''} - ${shot.result === 'made' ? 'Réussi' : 'Raté'}`}
                                />
                            ))}
                            
                            {displayShots.length === 0 && !generatedImage && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white/60 p-6">
                                        <span className="text-5xl mb-3 block">📊</span>
                                        <p className="font-bold">{mode === 'input' ? 'Cliquez pour ajouter des tirs' : 'Aucune donnée'}</p>
                                        <p className="text-sm mt-1">{mode === 'analysis' ? 'Sélectionnez un joueur ou vérifiez Firebase' : ''}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {mode === 'analysis' && !generatedImage && displayShots.length > 0 && (
                        <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                            <h4 className="font-bold text-indigo-800 text-sm mb-2">💡 Aperçu des {displayShots.length} tirs</h4>
                            <p className="text-xs text-indigo-700">Cliquez sur "Générer Heatmap" ou "Générer Shot Chart" pour obtenir une visualisation professionnelle via l'API Python.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
