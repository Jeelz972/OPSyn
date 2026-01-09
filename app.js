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

// --- DONNÉES & CONSTANTES ---
const ZONES_LIST = [
    { key: '0G', label: '0° G' }, { key: '45G', label: '45° G' }, { key: '70G', label: '70° G' },
    { key: 'Axe', label: 'Axe' },
    { key: '70D', label: '70° D' }, { key: '45D', label: '45° D' }, { key: '0D', label: '0° D' }
];

// Configuration Saisie (Couleurs & IDs)
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

// --- APP ---
function App() {
   const [activeModule, setActiveModule] = useState('shooting');
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [historyData, setHistoryData] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Chargement initial
    useEffect(() => {
        const h = localStorage.getItem('basketball_history');
        const p = localStorage.getItem('basketball_players');
        if (h) setHistoryData(JSON.parse(h));
        if (p) setPlayers(JSON.parse(p));
    }, []);

    // Sauvegarde locale helpers
    const updateHistory = (newData) => { setHistoryData(newData); localStorage.setItem('basketball_history', JSON.stringify(newData)); };
    const updatePlayers = (newPlayers) => { setPlayers(newPlayers); localStorage.setItem('basketball_players', JSON.stringify(newPlayers)); };

    // Sauvegarde Cloud
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
            {/* Header */}
            <div className="bg-white sticky top-0 z-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    🏀 StatElite <span className="text-xs text-white bg-slate-800 px-2 rounded-full font-normal">v8.0 Analysis</span>
                </h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={()=>setActiveModule('shooting')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='shooting'?'bg-white shadow text-blue-600':'text-gray-500'}`}>Saisie</button>
                    <button onClick={()=>setActiveModule('analysis')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='analysis'?'bg-white shadow text-blue-600':'text-gray-500'}`}>Analyse</button>
                    <button onClick={()=>setActiveModule('shotchart')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeModule==='shotchart'?'bg-white shadow text-orange-600':'text-gray-500'}`}>Shot Chart</button>
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

// --- MODULE SAISIE (Shooting) ---
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
            {/* Colonne Joueurs */}
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

            {/* Colonne Saisie */}
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

// --- CONFIGURATION API ---
const API_BASE_URL = 'https://opsyn.onrender.com'; // Remplacer par votre URL

// --- MODULE SHOT CHART ---
function ShotChartModule({ players, historyData }) {
    const [mode, setMode] = useState('input'); // 'input' ou 'analysis'
    const [selectedPlayer, setSelectedPlayer] = useState('team');
    const [shots, setShots] = useState([]);
    const [heatmapImg, setHeatmapImg] = useState(null);
    const [shotchartImg, setShotchartImg] = useState(null);
    const [viewType, setViewType] = useState('heatmap'); // 'heatmap' ou 'shotchart'
    const [isLoading, setIsLoading] = useState(false);
    const [distance, setDistance] = useState('2pt');
    const [shotType, setShotType] = useState('arret');
    const [stats, setStats] = useState(null);
    const [resultFilter, setResultFilter] = useState('all');
    const courtRef = React.useRef(null);

    // Charger les tirs existants au montage
    useEffect(() => {
        loadShots();
    }, [selectedPlayer]);

    const loadShots = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/shots/${selectedPlayer}`);
            const data = await res.json();
            setShots(data.shots || []);
        } catch (e) {
            console.log('API non disponible, mode local');
        }
    };

    // Gestion du clic sur le terrain
    const handleCourtClick = async (e, result) => {
        if (!courtRef.current) return;
        
        const rect = courtRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const newShot = {
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10,
            result: result,
            player_id: selectedPlayer === 'team' ? players[0]?.id.toString() : selectedPlayer,
            distance: distance,
            shot_type: shotType,
            date: new Date().toISOString().split('T')[0]
        };
        
        // Ajouter localement immédiatement
        setShots(prev => [...prev, newShot]);
        
        // Envoyer au backend
        try {
            await fetch(`${API_BASE_URL}/api/shot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newShot)
            });
        } catch (e) {
            console.log('Sauvegarde locale uniquement');
        }
    };

    // Charger Heatmap
    const loadHeatmap = async () => {
        setIsLoading(true);
        try {
            const filter = resultFilter !== 'all' ? `?result_filter=${resultFilter}` : '';
            const res = await fetch(`${API_BASE_URL}/api/heatmap/${selectedPlayer}${filter}`);
            if (!res.ok) throw new Error('Pas assez de données');
            const data = await res.json();
            setHeatmapImg(data.image);
            setStats(data.stats);
        } catch (e) {
            alert('Erreur: ' + e.message);
        }
        setIsLoading(false);
    };

    // Charger Shot Chart
    const loadShotChart = async () => {
        setIsLoading(true);
        try {
            const filter = resultFilter !== 'all' ? `?result_filter=${resultFilter}` : '';
            const res = await fetch(`${API_BASE_URL}/api/shotchart/${selectedPlayer}${filter}`);
            if (!res.ok) throw new Error('Pas assez de données');
            const data = await res.json();
            setShotchartImg(data.image);
            setStats(data.stats);
        } catch (e) {
            alert('Erreur: ' + e.message);
        }
        setIsLoading(false);
    };

    // Effacer les tirs
    const clearShots = async () => {
        if (!confirm('Supprimer tous les tirs ?')) return;
        setShots([]);
        setHeatmapImg(null);
        setShotchartImg(null);
        try {
            await fetch(`${API_BASE_URL}/api/shots/${selectedPlayer}`, { method: 'DELETE' });
        } catch (e) {}
    };

    // Sync depuis historique existant vers l'API
    const syncFromHistory = async () => {
        if (!historyData.length) return alert('Aucune donnée à synchroniser');
        
        setIsLoading(true);
        const syntheticShots = [];
        
        historyData.forEach(session => {
            const pid = session.playerId.toString();
            Object.keys(session.zones).forEach(zoneKey => {
                if (zoneKey === 'Distance' || zoneKey === 'types') return;
                
                const zoneData = session.zones[zoneKey];
                if (!zoneData || !zoneData.attempted) return;
                
                // Coordonnées approximatives par zone
                const zoneCoords = {
                    '0G': { x: 5, y: 30 },
                    '45G': { x: 15, y: 60 },
                    '70G': { x: 30, y: 75 },
                    'Axe': { x: 50, y: 85 },
                    '70D': { x: 70, y: 75 },
                    '45D': { x: 85, y: 60 },
                    '0D': { x: 95, y: 30 },
                    'Ligne': { x: 50, y: 40 },
                    'LF': { x: 50, y: 40 }
                };
                
                const coords = zoneCoords[zoneKey] || { x: 50, y: 50 };
                
                // Créer des tirs synthétiques avec dispersion
                for (let i = 0; i < zoneData.made; i++) {
                    syntheticShots.push({
                        x: coords.x + (Math.random() - 0.5) * 10,
                        y: coords.y + (Math.random() - 0.5) * 10,
                        result: 'made',
                        player_id: pid,
                        distance: session.zones.Distance || '2pt',
                        shot_type: session.zones.types || 'arret',
                        date: session.date
                    });
                }
                
                const missed = zoneData.attempted - zoneData.made;
                for (let i = 0; i < missed; i++) {
                    syntheticShots.push({
                        x: coords.x + (Math.random() - 0.5) * 10,
                        y: coords.y + (Math.random() - 0.5) * 10,
                        result: 'missed',
                        player_id: pid,
                        distance: session.zones.Distance || '2pt',
                        shot_type: session.zones.types || 'arret',
                        date: session.date
                    });
                }
            });
        });
        
        try {
            await fetch(`${API_BASE_URL}/api/shots/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shots: syntheticShots })
            });
            alert(`✅ ${syntheticShots.length} tirs synchronisés !`);
            loadShots();
        } catch (e) {
            alert('Erreur sync: ' + e.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header avec toggle */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setMode('input')} className={`px-6 py-2 rounded-md font-bold text-sm transition ${mode === 'input' ? 'bg-white text-emerald-600 shadow' : 'text-gray-500'}`}>
                        🎯 Saisie Terrain
                    </button>
                    <button onClick={() => setMode('analysis')} className={`px-6 py-2 rounded-md font-bold text-sm transition ${mode === 'analysis' ? 'bg-white text-purple-600 shadow' : 'text-gray-500'}`}>
                        📊 Visualisation
                    </button>
                </div>
                
                {/* Sélecteur Joueur/Équipe */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500">Afficher:</span>
                    <select 
                        value={selectedPlayer} 
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-bold text-sm outline-none focus:border-blue-500"
                    >
                        <option value="team">🏀 Équipe Complète</option>
                        {players.map(p => (
                            <option key={p.id} value={p.id.toString()}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* MODE SAISIE */}
            {mode === 'input' && (
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Panneau Contrôles */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h3 className="font-bold text-gray-700 text-sm mb-4">⚙️ Paramètres Tir</h3>
                            
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
                        </div>
                        
                        {/* Instructions */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-sm mb-2">💡 Instructions</h4>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• <strong>Clic gauche</strong> = Tir réussi ✅</li>
                                <li>• <strong>Clic droit</strong> = Tir raté ❌</li>
                                <li>• Sélectionnez distance et type avant</li>
                            </ul>
                        </div>
                        
                        {/* Stats rapides */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h4 className="font-bold text-gray-700 text-sm mb-3">📈 Session</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-gray-50 rounded-lg p-2">
                                    <div className="text-lg font-black text-gray-800">{shots.length}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Total</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2">
                                    <div className="text-lg font-black text-green-600">{shots.filter(s => s.result === 'made').length}</div>
                                    <div className="text-[10px] text-green-600 uppercase">Réussis</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-2">
                                    <div className="text-lg font-black text-red-500">{shots.filter(s => s.result === 'missed').length}</div>
                                    <div className="text-[10px] text-red-500 uppercase">Ratés</div>
                                </div>
                            </div>
                            
                            {shots.length > 0 && (
                                <button onClick={clearShots} className="w-full mt-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition">
                                    🗑️ Effacer session
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Terrain Interactif */}
                    <div className="lg:col-span-9">
                        <div 
                            ref={courtRef}
                            onClick={(e) => handleCourtClick(e, 'made')}
                            onContextMenu={(e) => { e.preventDefault(); handleCourtClick(e, 'missed'); }}
                            className="relative bg-gradient-to-b from-orange-800 to-orange-900 rounded-2xl shadow-2xl overflow-hidden cursor-crosshair aspect-[1.06]"
                            style={{ maxHeight: '600px' }}
                        >
                            {/* SVG Terrain */}
                            <svg viewBox="0 0 500 470" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                {/* Fond */}
                                <rect x="0" y="0" width="500" height="470" fill="#c2410c" />
                                
                                {/* Lignes */}
                                <g stroke="white" strokeWidth="3" fill="none">
                                    {/* Rectangle extérieur */}
                                    <rect x="20" y="20" width="460" height="430" />
                                    
                                    {/* Raquette */}
                                    <rect x="170" y="20" width="160" height="190" />
                                    
                                    {/* Cercle LF */}
                                    <circle cx="250" cy="210" r="60" />
                                    
                                    {/* Arc 3 points */}
                                    <path d="M 50 20 L 50 160 Q 50 390 250 390 Q 450 390 450 160 L 450 20" />
                                    
                                    {/* Zone restrictive */}
                                    <rect x="200" y="20" width="100" height="80" strokeDasharray="10,5" />
                                    
                                    {/* Panier */}
                                    <circle cx="250" cy="60" r="15" strokeWidth="4" />
                                    <rect x="220" y="40" width="60" height="5" fill="white" />
                                </g>
                            </svg>
                            
                            {/* Points des tirs */}
                            {shots.map((shot, idx) => (
                                <div 
                                    key={idx}
                                    className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg transition-all ${shot.result === 'made' ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ 
                                        left: `${shot.x}%`, 
                                        top: `${shot.y}%`,
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODE ANALYSE */}
            {mode === 'analysis' && (
                <div className="space-y-6">
                    {/* Contrôles Analyse */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setViewType('heatmap'); loadHeatmap(); }}
                                disabled={isLoading}
                                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition ${viewType === 'heatmap' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                🔥 Heatmap
                            </button>
                            <button 
                                onClick={() => { setViewType('shotchart'); loadShotChart(); }}
                                disabled={isLoading}
                                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition ${viewType === 'shotchart' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                📍 Shot Chart
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500">Filtrer:</span>
                            <select 
                                value={resultFilter} 
                                onChange={(e) => setResultFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                <option value="all">Tous les tirs</option>
                                <option value="made">✅ Réussis uniquement</option>
                                <option value="missed">❌ Ratés uniquement</option>
                            </select>
                        </div>
                        
                        <button 
                            onClick={syncFromHistory}
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition"
                        >
                            🔄 Sync depuis Historique
                        </button>
                    </div>

                    {/* Affichage Résultat */}
                    <div className="grid lg:grid-cols-12 gap-6">
                        {/* Graphique */}
                        <div className="lg:col-span-9">
                            <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden p-4">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-96">
                                        <div className="text-white text-center">
                                            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="font-bold">Génération en cours...</p>
                                        </div>
                                    </div>
                                ) : (heatmapImg || shotchartImg) ? (
                                    <img 
                                        src={viewType === 'heatmap' ? heatmapImg : shotchartImg} 
                                        alt="Shot Chart"
                                        className="w-full h-auto rounded-lg"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                                        <span className="text-6xl mb-4">📊</span>
                                        <p className="font-bold">Cliquez sur un bouton pour générer la visualisation</p>
                                        <p className="text-sm mt-2">Sélectionnez Équipe ou un joueur spécifique</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Stats Panel */}
                        <div className="lg:col-span-3 space-y-4">
                            {stats && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <h3 className="font-bold text-gray-700 text-sm mb-4 pb-2 border-b border-gray-100">
                                        📊 Statistiques {selectedPlayer === 'team' ? 'Équipe' : players.find(p => p.id.toString() === selectedPlayer)?.name}
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                                            <div className="text-4xl font-black text-blue-600">{stats.percentage}%</div>
                                            <div className="text-xs text-blue-500 font-bold uppercase mt-1">Réussite</div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="text-xl font-black text-gray-800">{stats.total}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">Total</div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="text-xl font-black text-green-600">{stats.made}</div>
                                                <div className="text-[10px] text-green-600 uppercase">Réussis</div>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-3">
                                                <div className="text-xl font-black text-red-500">{stats.missed}</div>
                                                <div className="text-[10px] text-red-500 uppercase">Ratés</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Légende */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <h4 className="font-bold text-gray-700 text-sm mb-3">🎨 Légende</h4>
                                {viewType === 'heatmap' ? (
                                    <div className="space-y-2">
                                        <div className="h-4 rounded bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600"></div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Faible densité</span>
                                            <span>Forte densité</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></span>
                                            <span className="text-sm text-gray-600">Tir réussi</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></span>
                                            <span className="text-sm text-gray-600">Tir raté</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- MODULE ANALYSE (Nouveau Départ) ---
function AnalysisModule({ players, historyData, setHistoryData }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- LOGIQUE CALCULS ---
    const calculateStats = () => {
        // 1. Initialisation des structures vides
        const initStat = () => ({ tt: 0, tr: 0 }); // tt = tentés, tr = réussis
        
        // Stats Équipe
        const team = {
            zones: {}, // Pour chaque zone (0G, 45G...)
            types: { 'arrêt': initStat(), 'mouvement': initStat() },
            total: initStat()
        };
        // Initialiser zones pour l'équipe
        ZONES_LIST.forEach(z => team.zones[z.key] = initStat());
        team.zones['LF'] = initStat(); // Ajouter LF

        // Stats Joueurs (Matrice)
        const playersStats = {};
        players.forEach(p => {
            playersStats[p.id] = {
                zones: {},
                types: { 'arrêt': initStat(), 'mouvement': initStat() },
                total: initStat()
            };
            ZONES_LIST.forEach(z => playersStats[p.id].zones[z.key] = initStat());
            playersStats[p.id].zones['LF'] = initStat();
        });

        // 2. Filtrage Temporel
        let filteredData = historyData;
        if (startDate) filteredData = filteredData.filter(d => d.date >= startDate);
        if (endDate) filteredData = filteredData.filter(d => d.date <= endDate);

        // 3. Agrégation
        filteredData.forEach(session => {
            const pid = session.playerId;
            const type = session.zones.types; // 'arrêt' ou 'mouvement'
            
            // On parcourt les zones enregistrées dans la session
            Object.keys(session.zones).forEach(key => {
                if (key === 'Distance' || key === 'types') return; // Ignorer métadonnées
                
                const data = session.zones[key]; // { made: x, attempted: y }
                if (!data || data.attempted === 0) return;

                const zoneKey = (key === 'Ligne') ? 'LF' : key; // Normaliser LF

                // -- Mise à jour Équipe --
                team.total.tt += data.attempted;
                team.total.tr += data.made;
                
                if (team.types[type]) {
                    team.types[type].tt += data.attempted;
                    team.types[type].tr += data.made;
                }
                
                if (team.zones[zoneKey]) {
                    team.zones[zoneKey].tt += data.attempted;
                    team.zones[zoneKey].tr += data.made;
                }

                // -- Mise à jour Joueur --
                if (playersStats[pid]) {
                    const pStat = playersStats[pid];
                    pStat.total.tt += data.attempted;
                    pStat.total.tr += data.made;

                    if (pStat.types[type]) {
                        pStat.types[type].tt += data.attempted;
                        pStat.types[type].tr += data.made;
                    }

                    if (pStat.zones[zoneKey]) {
                        pStat.zones[zoneKey].tt += data.attempted;
                        pStat.zones[zoneKey].tr += data.made;
                    }
                }
            });
        });

        // 4. Calcul des Meilleurs Performeurs par Zone
        const bestPerformers = {}; // { '0G': { pid: 1, pct: 55 }, ... }
        
        const allZoneKeys = [...ZONES_LIST.map(z => z.key), 'LF'];
        
        allZoneKeys.forEach(zKey => {
            let bestPid = null;
            let bestPct = -1;

            players.forEach(p => {
                const s = playersStats[p.id].zones[zKey];
                if (s.tt >= 5) { // Minimum 5 tirs pour être éligible (évite les 1/1 = 100%)
                    const pct = (s.tr / s.tt) * 100;
                    if (pct > bestPct) {
                        bestPct = pct;
                        bestPid = p.id;
                    }
                }
            });

            if (bestPid) bestPerformers[zKey] = { pid: bestPid, pct: bestPct };
        });

        return { team, playersStats, bestPerformers, recentSessions: filteredData.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)) };
    };

    const { team, playersStats, bestPerformers, recentSessions } = calculateStats();

    // Helper formatage
    const fmt = (stat) => stat.tt > 0 ? Math.round((stat.tr / stat.tt) * 100) + '%' : '-';
    const fmtDet = (stat) => stat.tt > 0 ? `${stat.tr}/${stat.tt}` : '';

    // Gestion Dates Rapides
    const setQuickRange = (type) => {
        const now = new Date();
        if(type==='all') { setStartDate(''); setEndDate(''); }
        if(type==='month') { const d = new Date(now.getFullYear(), now.getMonth(), 1); const iso = new Date(d.getTime()-(d.getTimezoneOffset()*60000)).toISOString().split('T')[0]; setStartDate(iso); setEndDate(''); }
        if(type==='season') { const startYear = now.getMonth()<8 ? now.getFullYear()-1 : now.getFullYear(); const d = new Date(startYear, 8, 1); const iso = new Date(d.getTime()-(d.getTimezoneOffset()*60000)).toISOString().split('T')[0]; setStartDate(iso); setEndDate(''); }
    };

    const deleteSession = (id) => { if(confirm("Supprimer ?")) setHistoryData(historyData.filter(d => d.id !== id)); };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* BARRE DE FILTRES */}
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

            {/* 1. TABLEAU GLOBAL ÉQUIPE (PAR ZONES & TYPES) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Global Par Types */}
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

                {/* Global Par Zones (Grid) */}
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

            {/* 2. TABLEAU DÉTAILLÉ JOUEURS */}
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
                                        
                                        {/* Types */}
                                        <td className="p-3 bg-blue-50/20 font-mono text-blue-700 font-bold">{fmt(s.types['arrêt'])}</td>
                                        <td className="p-3 bg-red-50/20 font-mono text-red-700 font-bold border-r border-gray-200">{fmt(s.types['mouvement'])}</td>

                                        {/* Zones */}
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

                                        {/* LF */}
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

            {/* HISTORIQUE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-sm mb-4 text-gray-600 uppercase">📜 Historique des séances (Période)</h3>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {recentSessions.length === 0 ? <p className="text-gray-400 italic text-sm">Aucune séance trouvée.</p> : 
                    recentSessions.map(sess => {
                        const pName = players.find(p=>p.id===sess.playerId)?.name || '?';
                        // Calcul rapide du total de la session pour affichage
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

ReactDOM.render(<App />, document.getElementById('root'));
