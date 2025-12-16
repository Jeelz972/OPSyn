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
    'gauche_0': '0G', 'droit_0': '0D', 'gauche_45': '45G', 'droit_45': '45D',
    'gauche_70': '70G', 'droit_70': '70D', 'axe': 'Axe', 'zone_lf': 'Ligne'
};

// Zones utilisées pour la SAISIE
const ZONES_INPUT = [
    { key: '0G', name: '0° Corner G', id:'gauche_0', color: 'from-blue-500 to-blue-600' },
    { key: '45G', name: '45° Aile G', id:'gauche_45', color: 'from-emerald-400 to-emerald-600' },
    { key: '70G', name: '70° Elbow G', id:'gauche_70', color: 'from-cyan-400 to-cyan-600' },
    { key: 'Axe', name: 'Axe Top', id:'axe', color: 'from-indigo-500 to-indigo-600' },
    { key: '70D', name: '70° Elbow D', id:'droit_70', color: 'from-red-500 to-red-600' },
    { key: '45D', name: '45° Aile D', id:'droit_45', color: 'from-amber-400 to-amber-600' },
    { key: '0D', name: '0° Corner D', id:'droit_0', color: 'from-pink-500 to-pink-600' }
];

const INITIAL_PLAYERS = [
    { id: 1, name: 'Maxime' }, { id: 2, name: 'Sasha' }, { id: 3, name: 'Théotime' },
    { id: 4, name: 'Noé' }, { id: 5, name: 'Keziah' }, { id: 6, name: 'Nathan' },
    { id: 7, name: 'Valentin' }, { id: 8, name: 'Jad' }, { id: 9, name: 'Marco' },
    { id: 10, name: 'Thierno' }, { id: 11, name: 'Peniel' }, { id: 12, name: 'Nat' }
];

// --- NOUVEAU COMPOSANT HEATMAP "SYNERGY STYLE" ---
const HalfCourtHeatmapPro = ({ heatmapData }) => {
    
    // Fonction couleur : Blanc si vide, sinon dégradé Bleu->Rouge
    const getColor = (stats) => {
        if (!stats || stats.tt === 0) return "white"; // Règle demandée : blanc si pas de donnée
        const pct = (stats.tr / stats.tt) * 100;
        if (pct >= 55) return "#dc2626"; // Rouge (Chaud)
        if (pct >= 45) return "#f97316"; // Orange
        if (pct >= 40) return "#facc15"; // Jaune
        if (pct >= 35) return "#34d399"; // Vert clair
        return "#3b82f6"; // Bleu (Froid)
    };

    // Définition des zones visuelles (SVG Paths)
    // Canvas 500x470. Panier à (250, 50).
    const visualZones = {
        // --- ZONES 2PTS ---
        // Raquette (Axe 2pt)
        '2pt_Axe': { path: "M210,50 L290,50 L290,200 C270,210 230,210 210,200 Z", label: {x:250, y:130} },
        // Mid-Range Gauche Bas (Corner/Aile Bas 2pt)
        '2pt_G_Bas': { path: "M30,50 L210,50 L210,160 C150,160 90,120 30,50 Z", label: {x:130, y:90} },
        // Mid-Range Droit Bas
        '2pt_D_Bas': { path: "M470,50 L290,50 L290,160 C350,160 410,120 470,50 Z", label: {x:370, y:90} },
        // Mid-Range Gauche Haut (Aile/Elbow Haut 2pt)
        '2pt_G_Haut': { path: "M210,160 L210,200 C150,220 100,280 80,330 L30,290 C60,220 120,170 210,160 Z", label: {x:140, y:230} },
        // Mid-Range Droit Haut
        '2pt_D_Haut': { path: "M290,160 L290,200 C350,220 400,280 420,330 L470,290 C440,220 380,170 290,160 Z", label: {x:360, y:230} },

        // --- ZONES 3PTS ---
        // Corners
        '3pt_0G': { path: "M30,50 L80,50 L80,220 L30,290 Z", label: {x:55, y:150} },
        '3pt_0D': { path: "M470,50 L420,50 L420,220 L470,290 Z", label: {x:445, y:150} },
        // Ailes (Wings)
        '3pt_45G': { path: "M80,50 L170,50 C150,150 130,250 100,350 L80,220 Z", label: {x:120, y:150} },
        '3pt_45D': { path: "M420,50 L330,50 C350,150 370,250 400,350 L420,220 Z", label: {x:380, y:150} },
        // Top (Axe + Elbows 3pt)
        '3pt_Top': { path: "M170,50 L330,50 C370,250 400,350 250,450 C100,350 130,250 170,50 Z", label: {x:250, y:280} }
    };

    return (
        <div className="relative w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{backgroundImage: 'radial-gradient(circle at 50% 20%, #f8fafc, #e2e8f0)'}}>
            <svg viewBox="0 0 500 470" className="w-full h-full">
                
                {/* --- ZONES DE CHALEUR --- */}
                {Object.keys(visualZones).map(zoneId => {
                    const stats = heatmapData[zoneId] || {tt:0, tr:0};
                    const pct = stats.tt > 0 ? (stats.tr/stats.tt)*100 : null;
                    const hasData = pct !== null;
                    const color = getColor(stats);
                    const isWhite = color === 'white';

                    return (
                        <g key={zoneId} className="group">
                            <path 
                                d={visualZones[zoneId].path} 
                                fill={color}
                                stroke={isWhite ? "#e5e7eb" : "white"} // Bordure grise si blanc, sinon blanche
                                strokeWidth={isWhite ? "1" : "2"}
                                className={`transition-all duration-300 origin-center ${hasData ? 'opacity-90 hover:opacity-100 hover:scale-[1.01] cursor-pointer' : 'opacity-100'}`}
                            />
                            {hasData && (
                                <>
                                <text x={visualZones[zoneId].label.x} y={visualZones[zoneId].label.y} textAnchor="middle" fill={isWhite ? "#1e293b" : "white"} fontSize="14" fontWeight="900" style={{textShadow: isWhite ? "none" : "0px 1px 3px rgba(0,0,0,0.3)", pointerEvents:'none'}}>
                                    {`${Math.round(pct)}%`}
                                </text>
                                <text x={visualZones[zoneId].label.x} y={visualZones[zoneId].label.y + 15} textAnchor="middle" fill={isWhite ? "#475569" : "#e2e8f0"} fontSize="11" fontWeight="bold" style={{pointerEvents:'none'}}>
                                    {stats.tr}/{stats.tt}
                                </text>
                                </>
                            )}
                        </g>
                    );
                })}

                {/* --- DESSIN DU TERRAIN (Lignes par-dessus) --- */}
                <g fill="none" stroke="#64748b" strokeWidth="2" pointerEvents="none">
                    {/* Ligne à 3 Points */}
                    <line x1="80" y1="50" x2="80" y2="220" /> 
                    <line x1="420" y1="50" x2="420" y2="220" />
                    <path d="M80,220 Q250,380 420,220" />
                    {/* Raquette */}
                    <rect x="170" y="50" width="160" height="190" />
                    <path d="M170,240 A80,80 0 0,0 330,240" />
                    {/* Panier */}
                    <line x1="220" y1="40" x2="280" y2="40" stroke="#0f172a" strokeWidth="4" />
                    <circle cx="250" cy="50" r="12" stroke="#ea580c" strokeWidth="3" />
                </g>
            </svg>
        </div>
    );
};

// --- LOGIQUE MIGRATION & RESTE DE L'APP ---
const SHOT_TYPES = [
    { id: '2pt_arret', label: '2pts Arrêt', points: 2, icon: '🛑', cat: '2pt', mouv: false },
    { id: '2pt_mouv', label: '2pts Mouv.', points: 2, icon: '🏃', cat: '2pt', mouv: true },
    { id: '3pt_arret', label: '3pts Arrêt', points: 3, icon: '🛑', cat: '3pt', mouv: false },
    { id: '3pt_mouv', label: '3pts Mouv.', points: 3, icon: '🏃', cat: '3pt', mouv: true },
    { id: '1pt_lancer', label: 'Lancer Franc', points: 1, icon: '🏀', cat: 'lf', mouv: false }
];

// (Fonction migrateData inchangée...)
const migrateData = (oldData) => { if (!oldData || oldData.length === 0) return []; if (oldData[0].zones && oldData[0].zones.Distance) return oldData; const newDataMap = {}; oldData.forEach(item => { let dist = "2pt", typ = "arrêt"; if (item.type) { if (item.type.includes('3pt')) dist = "3pt"; else if (item.type.includes('1pt') || item.type.includes('lancer')) dist = "LF"; if (item.type.includes('mouv')) typ = "mouvement"; } const key = `${item.date}-${item.playerId}-${dist}-${typ}`; if (!newDataMap[key]) { newDataMap[key] = { id: key, playerId: item.playerId, date: item.date, zones: { Distance: dist, types: typ } }; } const zoneKey = ZONE_MAPPING[item.zoneId] || 'Axe'; if (!newDataMap[key].zones[zoneKey]) newDataMap[key].zones[zoneKey] = { made: 0, attempted: 0 }; newDataMap[key].zones[zoneKey].made += (item.marques || 0); newDataMap[key].zones[zoneKey].attempted += (item.tentes || 0); }); return Object.values(newDataMap).map(d => ({ ...d, id: Date.now().toString(36) + Math.random().toString(36).substr(2) })); };

// --- MAIN COMPONENT ---
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
                <h1 className="text-xl font-black text-slate-800">🏀 StatElite <span className="text-xs text-gray-400 font-normal">v7.0 ProMap</span></h1>
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

// --- SHOOTING MODULE (Inchangé) ---
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
            session.zones[selectedZoneKey].made += tr; session.zones[selectedZoneKey].attempted += tt;
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
                            {ZONES_INPUT.map(z => (
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

// --- ANALYSIS MODULE ---
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

    // Fonction utilitaire pour ajouter des stats
    const addStats = (target, made, attempted) => { target.tt += attempted; target.tr += made; };

    const calculateStats = () => {
        // Init structures
        const teamStats = { 
            '2pt':{tt:0,tr:0}, '3pt':{tt:0,tr:0}, 'LF':{tt:0,tr:0}, total:{tt:0,tr:0},
            'arret':{tt:0,tr:0}, 'mouvement':{tt:0,tr:0}
        };
        const matrix = {};
        players.forEach(p => matrix[p.id] = { 
            '2pt':{tt:0,tr:0}, '3pt':{tt:0,tr:0}, 'LF':{tt:0,tr:0},
            'arret':{tt:0,tr:0}, 'mouvement':{tt:0,tr:0}, // Ajout des clés individuelles
            zones_input: {} 
        });
        
        // Structure spécifique pour la Heatmap Visuelle (Mapping des données d'entrée vers les zones visuelles)
        const visualHeatmapData = {
            '2pt_Axe': {tt:0,tr:0}, '2pt_G_Bas': {tt:0,tr:0}, '2pt_D_Bas': {tt:0,tr:0}, '2pt_G_Haut': {tt:0,tr:0}, '2pt_D_Haut': {tt:0,tr:0},
            '3pt_0G': {tt:0,tr:0}, '3pt_0D': {tt:0,tr:0}, '3pt_45G': {tt:0,tr:0}, '3pt_45D': {tt:0,tr:0}, '3pt_Top': {tt:0,tr:0}
        };

        // Filtrage date
        let filtered = historyData;
        if(startDate) filtered = filtered.filter(d => d.date >= startDate);
        if(endDate) filtered = filtered.filter(d => d.date <= endDate);

        // Itération des données
        filtered.forEach(session => {
            const dist = session.zones.Distance; // '2pt', '3pt', 'LF'
            const typ = session.zones.types; // 'arrêt', 'mouvement'
            const pid = session.playerId;
            const isPlayerSelected = filterPlayer === 'all' || filterPlayer == pid;

            Object.keys(session.zones).forEach(inputKey => {
                if(inputKey === 'Distance' || inputKey === 'types') return;
                const stats = session.zones[inputKey];
                if(!stats || stats.attempted === 0) return;

                // 1. Stats Globales (Equipe)
                addStats(teamStats.total, stats.made, stats.attempted);
                if(teamStats[dist]) addStats(teamStats[dist], stats.made, stats.attempted);
                if(teamStats[typ]) addStats(teamStats[typ], stats.made, stats.attempted);

                // 2. Stats Individuelles (Matrice)
                if(matrix[pid]) {
                    if(matrix[pid][dist]) addStats(matrix[pid][dist], stats.made, stats.attempted);
                    if(matrix[pid][typ]) addStats(matrix[pid][typ], stats.made, stats.attempted);
                }

                // 3. Remplissage de la Heatmap Visuelle (Si le joueur correspond au filtre)
                if (isPlayerSelected && dist !== 'LF') {
                    let visualZoneId = null;
                    // Logique de mapping : Input Key (ex: 'Axe') + Distance (ex: '2pt') -> Visual Zone ID (ex: '2pt_Axe')
                    if (dist === '2pt') {
                        if (inputKey === 'Axe') visualZoneId = '2pt_Axe';
                        else if (inputKey === '0G') visualZoneId = '2pt_G_Bas';
                        else if (inputKey === '0D') visualZoneId = '2pt_D_Bas';
                        else if (['45G', '70G'].includes(inputKey)) visualZoneId = '2pt_G_Haut';
                        else if (['45D', '70D'].includes(inputKey)) visualZoneId = '2pt_D_Haut';
                    } else if (dist === '3pt') {
                        if (inputKey === '0G') visualZoneId = '3pt_0G';
                        else if (inputKey === '0D') visualZoneId = '3pt_0D';
                        else if (inputKey === '45G') visualZoneId = '3pt_45G';
                        else if (inputKey === '45D') visualZoneId = '3pt_45D';
                        else if (['Axe', '70G', '70D'].includes(inputKey)) visualZoneId = '3pt_Top';
                    }

                    if (visualZoneId && visualHeatmapData[visualZoneId]) {
                        addStats(visualHeatmapData[visualZoneId], stats.made, stats.attempted);
                    }
                }
            });
        });

        const recentSessions = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));
        return { matrix, teamStats, recentSessions, visualHeatmapData };
    };

    const { matrix, teamStats, recentSessions, visualHeatmapData } = calculateStats();
    const formatPct = (tr, tt) => tt > 0 ? Math.round((tr/tt)*100)+'%' : '-';

    return (
        <div className="space-y-6">
            {/* FILTRES */}
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
                {/* HEATMAP PRO (GAUCHE) */}
                <div className="md:col-span-7 h-[470px]">
                    <HalfCourtHeatmapPro heatmapData={visualHeatmapData} />
                </div>
                {/* KPI CARDS (DROITE) */}
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

            {/* TABLEAU RÉCAPITULATIF (Avec Arrêt/Mouvement) */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 bg-gray-50 border-b font-bold text-gray-700 text-sm">📊 Détail par Joueur</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="p-3 text-left bg-gray-200">Joueur</th>
                                {/* Nouvelles colonnes */}
                                <th className="p-3 bg-blue-100 text-blue-800">Arrêt 🛑</th>
                                <th className="p-3 bg-red-100 text-red-800">Mouv 🏃</th>
                                <th className="p-3 border-l">2 Pts</th>
                                <th className="p-3">3 Pts</th>
                                <th className="p-3">LF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Ligne Total Equipe */}
                            <tr className="bg-gray-50 font-bold">
                                <td className="p-3 text-left">TOTAL ÉQUIPE</td>
                                <td className="p-3 text-blue-600 bg-blue-50">{formatPct(teamStats['arret'].tr, teamStats['arret'].tt)}</td>
                                <td className="p-3 text-red-600 bg-red-50">{formatPct(teamStats['mouvement'].tr, teamStats['mouvement'].tt)}</td>
                                <td className="p-3 border-l text-yellow-600">{formatPct(teamStats['2pt'].tr, teamStats['2pt'].tt)}</td>
                                <td className="p-3 text-purple-600">{formatPct(teamStats['3pt'].tr, teamStats['3pt'].tt)}</td>
                                <td className="p-3 text-orange-600">{formatPct(teamStats['LF'].tr, teamStats['LF'].tt)}</td>
                            </tr>
                            {/* Lignes Joueurs */}
                            {players.map(p => {
                                if(filterPlayer !== 'all' && p.id != filterPlayer) return null;
                                const s = matrix[p.id];
                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/50">
                                        <td className="p-3 text-left font-bold text-gray-800">{p.name}</td>
                                        {/* Nouvelles cellules */}
                                        <td className="p-3 font-bold text-blue-700 bg-blue-50/30">{formatPct(s['arret'].tr, s['arret'].tt)}</td>
                                        <td className="p-3 font-bold text-red-700 bg-red-50/30">{formatPct(s['mouvement'].tr, s['mouvement'].tt)}</td>
                                        <td className="p-3 border-l text-yellow-600 font-bold">{formatPct(s['2pt'].tr, s['2pt'].tt)}</td>
                                        <td className="p-3 text-purple-600 font-bold">{formatPct(s['3pt'].tr, s['3pt'].tt)}</td>
                                        <td className="p-3 text-orange-600 font-bold">{formatPct(s['LF'].tr, s['LF'].tt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* HISTORIQUE SESSIONS */}
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
