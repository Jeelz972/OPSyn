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

// --- DONNÉES & CONFIG ---
const ZONE_MAPPING = {
    'gauche_0': '0G', 'droit_0': '0D',
    'gauche_45': '45G', 'droit_45': '45D',
    'gauche_70': '70G', 'droit_70': '70D',
    'axe': 'Axe', 'zone_lf': 'Ligne'
};

const ZONES_DISPLAY = [
    { key: '0G', name: '0° Corner G', id:'gauche_0' },
    { key: '45G', name: '45° Aile G', id:'gauche_45' },
    { key: '70G', name: '70° Elbow G', id:'gauche_70' },
    { key: 'Axe', name: 'Axe Top', id:'axe' },
    { key: '70D', name: '70° Elbow D', id:'droit_70' },
    { key: '45D', name: '45° Aile D', id:'droit_45' },
    { key: '0D', name: '0° Corner D', id:'droit_0' }
];

const INITIAL_PLAYERS = [
    { id: 1, name: 'Maxime' }, { id: 2, name: 'Sasha' }, { id: 3, name: 'Théotime' },
    { id: 4, name: 'Noé' }, { id: 5, name: 'Keziah' }, { id: 6, name: 'Nathan' },
    { id: 7, name: 'Valentin' }, { id: 8, name: 'Jad' }, { id: 9, name: 'Marco' },
    { id: 10, name: 'Thierno' }, { id: 11, name: 'Peniel' }, { id: 12, name: 'Nat' }
];

// --- NOUVEAU COMPOSANT HEATMAP REALISTE (SVG) ---
const HalfCourtHeatmap = ({ stats }) => {
    
    const getColor = (pct) => {
        if (pct === null || isNaN(pct)) return "transparent"; 
        if (pct >= 60) return "#dc2626"; // Rouge
        if (pct >= 50) return "#ea580c"; // Orange
        if (pct >= 40) return "#facc15"; // Jaune
        if (pct >= 30) return "#60a5fa"; // Bleu clair
        return "#1e3a8a"; // Bleu foncé
    };

    // Dimensions virtuelles du SVG : 500x470. Panier centré à (250, 60)
    const basket = { x: 250, y: 60 };
    
    // Définition des chemins pour les zones de tir (Grid System)
    const zonePaths = {
        // Corners (Distance fixe)
        '0G': "M30,60 L90,60 L90,210 L30,210 Z",
        '0D': "M410,60 L470,60 L470,210 L410,210 Z",
        
        // Ailes (Wings) - Suivent la courbe
        '45G': "M90,60 L170,60 C150,150 130,250 100,350 L30,280 C60,200 80,120 90,60 Z",
        '45D': "M330,60 L410,60 C420,120 440,200 470,280 L400,350 C370,250 350,150 330,60 Z",

        // Elbows/Slots (Intermédiaire)
        '70G': "M170,60 L210,60 L210,250 C180,280 150,310 130,330 L100,350 C130,250 150,150 170,60 Z",
        '70D': "M290,60 L330,60 C350,150 370,250 400,350 L370,330 C350,310 320,280 290,250 L290,60 Z",

        // Axe (Top Key)
        'Axe': "M210,60 L290,60 L290,250 C270,270 230,270 210,250 Z"
    };

    // Position des labels
    const labels = {
        '0G': {x: 60, y: 135}, '0D': {x: 440, y: 135},
        '45G': {x: 120, y: 200}, '45D': {x: 380, y: 200},
        '70G': {x: 180, y: 240}, '70D': {x: 320, y: 240},
        'Axe': {x: 250, y: 210}
    };

    return (
        <div className="relative w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{backgroundImage: 'radial-gradient(circle at 50% 20%, #f8fafc, #e2e8f0)'}}>
            <svg viewBox="0 0 500 470" className="w-full h-full">
                
                {/* --- ZONES DE CHALEUR (En arrière-plan) --- */}
                {ZONES_DISPLAY.map(z => {
                    const data = stats[z.key] || {tt:0, tr:0};
                    const pct = data.tt > 0 ? (data.tr/data.tt)*100 : null;
                    const hasData = pct !== null;

                    return (
                        <g key={z.key} className="group">
                            <path 
                                d={zonePaths[z.key]} 
                                fill={getColor(pct)} 
                                stroke={hasData ? "white" : "none"}
                                strokeWidth="2"
                                className={`transition-all duration-300 origin-center ${hasData ? 'opacity-80 hover:opacity-100 hover:scale-[1.01] cursor-pointer' : 'opacity-0'}`}
                            />
                            {hasData && (
                                <>
                                <text x={labels[z.key].x} y={labels[z.key].y} textAnchor="middle" fill={pct > 50 ? "white" : "#1e293b"} fontSize="16" fontWeight="900" style={{textShadow: "0px 1px 3px rgba(0,0,0,0.3)", pointerEvents:'none'}}>
                                    {`${Math.round(pct)}%`}
                                </text>
                                <text x={labels[z.key].x} y={labels[z.key].y + 15} textAnchor="middle" fill={pct > 50 ? "white" : "#334155"} fontSize="11" fontWeight="bold" style={{pointerEvents:'none'}}>
                                    {data.tr}/{data.tt}
                                </text>
                                </>
                            )}
                        </g>
                    );
                })}

                {/* --- DESSIN DU TERRAIN RÉALISTE (Lignes par-dessus) --- */}
                <g fill="none" stroke="#64748b" strokeWidth="2">
                    {/* Baseline & Sidelines */}
                    <line x1="30" y1="460" x2="470" y2="460" strokeWidth="3" />
                    <line x1="30" y1="60" x2="30" y2="460" />
                    <line x1="470" y1="60" x2="470" y2="460" />

                    {/* Ligne à 3 Points (Réaliste : Droite puis Courbe) */}
                    {/* Côtés droits (approx 2.99m en réalité, ajusté à l'échelle) */}
                    <line x1="90" y1="60" x2="90" y2="210" /> 
                    <line x1="410" y1="60" x2="410" y2="210" />
                    {/* Arc de cercle connectant les droites */}
                    <path d="M90,210 Q250,380 410,210" />

                    {/* Raquette (Paint) */}
                    <rect x="170" y="270" width="160" height="190" />

                    {/* Cercle Lancer-Franc (Top Key) */}
                    {/* Demi-cercle plein (bas) */}
                    <path d="M170,270 A80,80 0 0,0 330,270" />
                    {/* Demi-cercle pointillé (haut) */}
                    <path d="M170,270 A80,80 0 0,1 330,270" strokeDasharray="6,6" />

                    {/* Zone Restrictive (Sous le panier) */}
                    <path d="M220,120 A30,30 0 0,1 280,120" />
                </g>

                {/* Panier & Planche (Drawing) */}
                <line x1="220" y1="50" x2="280" y2="50" stroke="#0f172a" strokeWidth="4" /> {/* Planche */}
                <circle cx="250" cy="60" r="12" stroke="#ea580c" strokeWidth="3" fill="none" /> {/* Arceau */}
                {/* Filet (Stylisé) */}
                <path d="M238,60 L242,85 L250,90 L258,85 L262,60" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.7"/>
                
                {/* Légende */}
                <text x="250" y="450" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">VUE DU DESSUS • DEMI-TERRAIN</text>
            </svg>
        </div>
    );
};

// --- RESTE DU CODE (Logique, Saisie, Analyse...) ---
// (Identique à la v6.1 sauf intégration du nouveau composant Heatmap)

const SHOT_TYPES = [
    { id: '2pt_arret', label: '2pts Arrêt', points: 2, icon: '🛑', cat: '2pt', mouv: false },
    { id: '2pt_mouv', label: '2pts Mouv.', points: 2, icon: '🏃', cat: '2pt', mouv: true },
    { id: '3pt_arret', label: '3pts Arrêt', points: 3, icon: '🛑', cat: '3pt', mouv: false },
    { id: '3pt_mouv', label: '3pts Mouv.', points: 3, icon: '🏃', cat: '3pt', mouv: true },
    { id: '1pt_lancer', label: 'Lancer Franc', points: 1, icon: '🏀', cat: 'lf', mouv: false }
];

const migrateData = (oldData) => {
    if (!oldData || oldData.length === 0) return [];
    if (oldData[0].zones && oldData[0].zones.Distance) return oldData;
    const newDataMap = {};
    oldData.forEach(item => {
        let dist = "2pt", typ = "arrêt";
        if (item.type) {
            if (item.type.includes('3pt')) dist = "3pt";
            else if (item.type.includes('1pt') || item.type.includes('lancer')) dist = "LF";
            if (item.type.includes('mouv')) typ = "mouvement";
        }
        const key = `${item.date}-${item.playerId}-${dist}-${typ}`;
        if (!newDataMap[key]) { newDataMap[key] = { id: key, playerId: item.playerId, date: item.date, zones: { Distance: dist, types: typ } }; }
        const zoneKey = ZONE_MAPPING[item.zoneId] || 'Axe';
        if (!newDataMap[key].zones[zoneKey]) newDataMap[key].zones[zoneKey] = { made: 0, attempted: 0 };
        newDataMap[key].zones[zoneKey].made += (item.marques || 0);
        newDataMap[key].zones[zoneKey].attempted += (item.tentes || 0);
    });
    return Object.values(newDataMap).map(d => ({ ...d, id: Date.now().toString(36) + Math.random().toString(36).substr(2) }));
};

function App() {
    const [activeModule, setActiveModule] = useState('shooting');
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [historyData, setHistoryData] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const h = localStorage.getItem('basketball_history');
        const p = localStorage.getItem('basketball_players');
        if (h) setHistoryData(migrateData(JSON.parse(h)));
        if (p) setPlayers(JSON.parse(p));
    }, []);

    const updateData = (key, data, setter) => { setter(data); localStorage.setItem(key, JSON.stringify(data)); };

    const handleCloud = async (mode) => {
        if (!db) return alert("Firebase non configuré");
        setIsSyncing(true);
        try {
            const docRef = db.collection('stats_v3').doc('backup_v5');
            if(mode === 'save') {
                await docRef.set({ history: JSON.stringify(historyData), players: JSON.stringify(players), last: new Date().toISOString() });
                alert("✅ Sauvegardé !");
            } else {
                const doc = await docRef.get();
                if(doc.exists) {
                    const d = doc.data();
                    updateData('basketball_history', migrateData(JSON.parse(d.history)), setHistoryData);
                    updateData('basketball_players', JSON.parse(d.players), setPlayers);
                    alert("✅ Chargé !");
                }
            }
        } catch (e) { alert("Erreur: " + e.message); }
        setIsSyncing(false);
    };

    return (
        <div className="min-h-screen pb-12 bg-gray-50 font-sans text-slate-800">
            <div className="bg-white sticky top-0 z-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-black text-slate-800">🏀 StatElite <span className="text-xs text-gray-400 font-normal">v6.2 RealCourt</span></h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={()=>setActiveModule('shooting')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='shooting'?'bg-white shadow text-blue-600':'text-gray-500'}`}>Saisie</button>
                    <button onClick={()=>setActiveModule('analysis')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='analysis'?'bg-white shadow text-blue-600':'text-gray-500'}`}>Analyse</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={()=>handleCloud('save')} disabled={isSyncing} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{isSyncing?'...':'Save'}</button>
                    <button onClick={()=>handleCloud('load')} disabled={isSyncing} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Load</button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
                {activeModule === 'shooting' && <ShootingModule players={players} setPlayers={(p)=>updateData('basketball_players',p,setPlayers)} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
                {activeModule === 'analysis' && <AnalysisModule players={players} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
            </div>
        </div>
    );
}

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
        if(!selectedPlayer || !selectedZoneKey || isNaN(tt) || tt===0 || tr>tt) return alert("Erreur de saisie.");
        const newData = [...historyData];
        const existingIndex = newData.findIndex(d => d.date === date && d.playerId === parseInt(selectedPlayer) && d.zones.Distance === distance && d.zones.types === typeTir);
        if (existingIndex >= 0) {
            const session = newData[existingIndex];
            if (!session.zones[selectedZoneKey]) session.zones[selectedZoneKey] = { made: 0, attempted: 0 };
            session.zones[selectedZoneKey].made += tr;
            session.zones[selectedZoneKey].attempted += tt;
            newData[existingIndex] = { ...session };
        } else {
            newData.push({ id: Date.now().toString(36), playerId: parseInt(selectedPlayer), date, zones: { Distance: distance, types: typeTir, [selectedZoneKey]: { made: tr, attempted: tt } } });
        }
        setHistoryData(newData); setTentes(''); setMarques('');
        const btn = document.getElementById('validBtn'); if(btn) { btn.innerText = "✅ OK"; setTimeout(()=>btn.innerText = "VALIDER", 800); }
    };

    const addPlayer = () => { if(newPlayer.trim()) { setPlayers([...players, {id:Date.now(), name: newPlayer}]); setNewPlayer(''); } };

    return (
        <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-2xl shadow p-4">
                    <div className="flex gap-2 mb-3"><input value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} className="bg-gray-50 border p-2 w-full rounded text-sm" placeholder="Nouveau..."/><button onClick={addPlayer} className="bg-blue-600 text-white rounded px-3">+</button></div>
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                        {players.map(p => (
                            <button key={p.id} onClick={()=>setSelectedPlayer(p.id)} className={`w-full text-left p-3 rounded-xl transition flex justify-between ${selectedPlayer===p.id ? 'bg-slate-800 text-white':'hover:bg-gray-50'}`}>
                                <span className="font-bold text-sm">{p.name}</span>{selectedPlayer===p.id && <span>●</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-9 space-y-6">
                <div className="bg-white p-2 rounded-2xl shadow border flex justify-between items-center">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={()=>setMode('field')} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${mode==='field'?'bg-white text-blue-600 shadow':'text-gray-500'}`}>Tirs Champ</button>
                        <button onClick={()=>setMode('lf')} className={`px-6 py-2 rounded-lg font-bold text-sm transition ${mode==='lf'?'bg-white text-purple-600 shadow':'text-gray-500'}`}>Lancers Francs</button>
                    </div>
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-gray-50 font-bold text-gray-600 rounded-xl px-4 py-2 outline-none text-sm"/>
                </div>
                <div className={`bg-white rounded-3xl shadow-xl border-4 p-6 ${mode==='lf'?'border-purple-100':'border-blue-100'}`}>
                    {mode === 'field' && (
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
                    )}
                    {mode === 'field' && (
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {ZONES_DISPLAY.map(z => (
                                <button key={z.key} onClick={()=>setSelectedZoneKey(z.key)} className={`py-4 rounded-xl border-2 transition relative overflow-hidden ${selectedZoneKey===z.key ? `border-transparent bg-gradient-to-br ${z.color} text-white shadow-lg scale-105` : 'border-gray-100 text-gray-500 hover:border-blue-200'}`}>
                                    <span className="relative z-10 font-bold text-sm">{z.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {(selectedZoneKey || mode === 'lf') ? (
                        <div className="animate-fade-in">
                            <div className="text-center mb-4 text-xs uppercase font-bold text-gray-400 tracking-widest">Saisie : {mode==='lf' ? 'Lancer Franc' : `${distance} ${typeTir} - Zone ${selectedZoneKey}`}</div>
                            <div className="flex justify-center items-end gap-8 mb-6">
                                <div className="text-center"><label className="text-xs font-bold text-gray-400">TENTÉS</label><input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-gray-50 rounded-xl outline-none"/></div>
                                <div className="text-center"><label className="text-xs font-bold text-green-500">MARQUÉS</label><input type="number" value={marques} onChange={e=>setMarques(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-green-50 text-green-600 rounded-xl outline-none"/></div>
                            </div>
                            <button id="validBtn" onClick={saveShot} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition">VALIDER</button>
                        </div>
                    ) : <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl text-sm">👈 Choisissez une zone</div>}
                </div>
            </div>
        </div>
    );
}

function AnalysisModule({ players, historyData, setHistoryData }) {
    const [filterPlayer, setFilterPlayer] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const setQuickRange = (type) => {
        const now = new Date();
        if(type==='all') { setStartDate(''); setEndDate(''); }
        if(type==='month') { const d = new Date(now.getFullYear(), now.getMonth(), 1); const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]; setStartDate(iso); setEndDate(''); }
        if(type==='season') { const startYear = now.getMonth() < 8 ? now.getFullYear()-1 : now.getFullYear(); const d = new Date(startYear, 8, 1); const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]; setStartDate(iso); setEndDate(''); }
    };

    const deleteSession = (id) => { if(confirm("Supprimer ?")) setHistoryData(historyData.filter(d => d.id !== id)); };

    const calculateStats = () => {
        const matrix = {}; 
        const teamStats = { '2pt':{tt:0,tr:0}, '3pt':{tt:0,tr:0}, 'LF':{tt:0,tr:0}, total:{tt:0,tr:0}, 'arret':{tt:0,tr:0}, 'mouvement':{tt:0,tr:0}, zones: {} };
        ZONES_DISPLAY.forEach(z => teamStats.zones[z.key] = {tt:0, tr:0});
        players.forEach(p => { matrix[p.id] = { '2pt':{tt:0,tr:0}, '3pt':{tt:0,tr:0}, 'LF':{tt:0,tr:0}, zones: {} }; ZONES_DISPLAY.forEach(z => matrix[p.id].zones[z.key] = {tt:0,tr:0}); });

        let filtered = historyData;
        if(startDate) filtered = filtered.filter(d => d.date >= startDate);
        if(endDate) filtered = filtered.filter(d => d.date <= endDate);

        filtered.forEach(session => {
            const dist = session.zones.Distance; const typ = session.zones.types; const pid = session.playerId;
            Object.keys(session.zones).forEach(key => {
                if(key === 'Distance' || key === 'types') return;
                const stats = session.zones[key]; if(!stats || stats.attempted === 0) return;
                teamStats.total.tt += stats.attempted; teamStats.total.tr += stats.made;
                if(teamStats[dist]) { teamStats[dist].tt += stats.attempted; teamStats[dist].tr += stats.made; }
                if(teamStats[typ]) { teamStats[typ].tt += stats.attempted; teamStats[typ].tr += stats.made; }
                if(teamStats.zones[key]) { teamStats.zones[key].tt += stats.attempted; teamStats.zones[key].tr += stats.made; }
                if(matrix[pid]) {
                    if(matrix[pid][dist]) { matrix[pid][dist].tt += stats.attempted; matrix[pid][dist].tr += stats.made; }
                    if(matrix[pid].zones[key]) { matrix[pid].zones[key].tt += stats.attempted; matrix[pid].zones[key].tr += stats.made; }
                }
            });
        });
        const heatmapStats = filterPlayer === 'all' ? teamStats.zones : (matrix[filterPlayer] ? matrix[filterPlayer].zones : {});
        const recentSessions = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));
        return { matrix, teamStats, recentSessions, heatmapStats };
    };

    const { matrix, teamStats, recentSessions, heatmapStats } = calculateStats();
    const formatPct = (tr, tt) => tt > 0 ? Math.round((tr/tt)*100)+'%' : '-';

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 items-center">
                    <span className="font-bold text-sm text-gray-500">Joueur :</span>
                    <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)} className="font-bold bg-gray-50 p-2 rounded text-sm">
                        <option value="all">👥 Toute l'équipe</option>
                        {players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['all', 'month', 'season'].map(t => (
                            <button key={t} onClick={()=>setQuickRange(t)} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded uppercase">{t}</button>
                        ))}
                    </div>
                    <div className="flex gap-2 items-center">
                        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border p-1 rounded text-xs"/>
                        <span className="text-gray-400 text-xs">à</span>
                        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border p-1 rounded text-xs"/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 h-[470px]">
                    <HalfCourtHeatmap stats={heatmapStats} />
                </div>
                <div className="md:col-span-5 grid grid-cols-1 gap-3 content-start">
                    <div className="bg-slate-900 p-4 rounded-xl text-white shadow-lg flex justify-between items-center mb-2">
                        <div><div className="text-xs text-slate-400 font-bold uppercase">Total Tirs</div><div className="text-2xl font-black">{teamStats.total.tr}/{teamStats.total.tt}</div></div>
                        <div className="text-3xl font-black text-green-400">{formatPct(teamStats.total.tr, teamStats.total.tt)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500 text-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase">2 Pts</div>
                            <div className="font-bold text-gray-800">{teamStats['2pt'].tr}/{teamStats['2pt'].tt}</div>
                            <div className="text-xs font-black text-yellow-600">{formatPct(teamStats['2pt'].tr, teamStats['2pt'].tt)}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500 text-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase">3 Pts</div>
                            <div className="font-bold text-gray-800">{teamStats['3pt'].tr}/{teamStats['3pt'].tt}</div>
                            <div className="text-xs font-black text-purple-600">{formatPct(teamStats['3pt'].tr, teamStats['3pt'].tt)}</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500 text-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase">LF</div>
                            <div className="font-bold text-gray-800">{teamStats['LF'].tr}/{teamStats['LF'].tt}</div>
                            <div className="text-xs font-black text-orange-600">{formatPct(teamStats['LF'].tr, teamStats['LF'].tt)}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500 flex justify-between items-center">
                            <div><div className="text-[10px] font-bold text-gray-400 uppercase">Tirs Arrêt 🛑</div><div className="font-bold text-gray-800">{teamStats['arret'].tr}/{teamStats['arret'].tt}</div></div>
                            <div className="text-xl font-black text-blue-600">{formatPct(teamStats['arret'].tr, teamStats['arret'].tt)}</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500 flex justify-between items-center">
                            <div><div className="text-[10px] font-bold text-gray-400 uppercase">Tirs Mouv 🏃</div><div className="font-bold text-gray-800">{teamStats['mouvement'].tr}/{teamStats['mouvement'].tt}</div></div>
                            <div className="text-xl font-black text-red-600">{formatPct(teamStats['mouvement'].tr, teamStats['mouvement'].tt)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 bg-gray-50 border-b font-bold text-gray-700 text-sm">📊 Détail par Joueur</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="p-3 text-left">Joueur</th>
                                <th className="p-3">2 Pts</th>
                                <th className="p-3">3 Pts</th>
                                <th className="p-3">LF</th>
                                {ZONES_DISPLAY.map(z => <th key={z.key} className="p-3">{z.key}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {players.map(p => {
                                if(filterPlayer !== 'all' && p.id != filterPlayer) return null;
                                const s = matrix[p.id];
                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/50">
                                        <td className="p-3 text-left font-bold text-gray-800">{p.name}</td>
                                        <td className="p-3 text-yellow-600 font-bold">{formatPct(s['2pt'].tr, s['2pt'].tt)}</td>
                                        <td className="p-3 text-purple-600 font-bold">{formatPct(s['3pt'].tr, s['3pt'].tt)}</td>
                                        <td className="p-3 text-orange-600 font-bold">{formatPct(s['LF'].tr, s['LF'].tt)}</td>
                                        {ZONES_DISPLAY.map(z => (
                                            <td key={z.key} className="p-3 text-gray-500">
                                                {s.zones[z.key].tt > 0 ? Math.round(s.zones[z.key].tr/s.zones[z.key].tt*100)+'%' : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold text-sm mb-4 text-gray-700">📜 Historique Séances</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {recentSessions.map(session => {
                        const pName = players.find(p=>p.id===session.playerId)?.name;
                        let totM=0, totA=0;
                        Object.keys(session.zones).forEach(k=>{ if(k!=='Distance'&&k!=='types'){ totM+=session.zones[k].made; totA+=session.zones[k].attempted; } });
                        return (
                            <div key={session.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 text-xs">
                                <div><span className="font-bold">{pName}</span> <span className="text-gray-500">| {session.date} | {session.zones.Distance} {session.zones.types}</span></div>
                                <div className="flex gap-3 items-center">
                                    <span className="font-mono font-bold">{totM}/{totA} ({totA>0?Math.round(totM/totA*100):0}%)</span>
                                    <button onClick={()=>deleteSession(session.id)} className="text-red-400 hover:text-red-600">🗑️</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
