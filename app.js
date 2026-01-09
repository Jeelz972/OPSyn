// --- CONFIGURATION FIREBASE ---
// v2
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
const API_BASE_URL = 'https://votre-api.onrender.com'; // ← REMPLACER PAR VOTRE URL

const { useState, useEffect, useMemo, useRef } = React;

// --- DONNÉES & CONSTANTES ---
const ZONES_CONFIG = [
    { id: 'gauche_0', key: '0G', label: '0° G', angle: 175, color: 'from-blue-500 to-blue-600' },
    { id: 'gauche_45', key: '45G', label: '45° G', angle: 135, color: 'from-emerald-400 to-emerald-600' },
    { id: 'gauche_70', key: '70G', label: '70° G', angle: 115, color: 'from-cyan-400 to-cyan-600' },
    { id: 'axe', key: 'Axe', label: 'Axe', angle: 90, color: 'from-indigo-500 to-indigo-600' },
    { id: 'droit_70', key: '70D', label: '70° D', angle: 65, color: 'from-red-500 to-red-600' },
    { id: 'droit_45', key: '45D', label: '45° D', angle: 45, color: 'from-amber-400 to-amber-600' },
    { id: 'droit_0', key: '0D', label: '0° D', angle: 5, color: 'from-pink-500 to-pink-600' }
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

// Rayons par distance (en % du terrain)
const DISTANCE_RADIUS = {
    '2pt': { min: 12, max: 32 },
    '3pt': { min: 44, max: 58 },
    'lf': { min: 19, max: 21 }
};

// Dispersion par type de zone
const ZONE_SPREAD = {
    'gauche_0': { angleSpread: 6, radiusSpread: 3 },
    'droit_0': { angleSpread: 6, radiusSpread: 3 },
    'gauche_45': { angleSpread: 10, radiusSpread: 5 },
    'droit_45': { angleSpread: 10, radiusSpread: 5 },
    'gauche_70': { angleSpread: 8, radiusSpread: 4 },
    'droit_70': { angleSpread: 8, radiusSpread: 4 },
    'axe': { angleSpread: 12, radiusSpread: 5 },
    'lf': { angleSpread: 4, radiusSpread: 2 }
};

// Récupère l'angle depuis le zoneId
function getZoneAngle(zoneId) {
    const zone = ZONES_CONFIG.find(z => z.id === zoneId);
    if (zone) return zone.angle;
    if (zoneId === 'lf' || zoneId === 'ligne') return 90;
    return 90;
}

// Parse le type pour extraire distance et shotType
function parseType(type) {
    if (!type) return { distance: '3pt', shotType: 'arret' };
    const t = type.toLowerCase();
    
    let distance = '3pt';
    if (t.includes('2pt') || t.includes('2pts')) distance = '2pt';
    else if (t.includes('lf') || t.includes('franc')) distance = 'lf';
    
    let shotType = 'arret';
    if (t.includes('mouv')) shotType = 'mouvement';
    
    return { distance, shotType };
}

function zoneToCoordinates(zoneId, type) {
    const baseAngle = getZoneAngle(zoneId);
    const { distance } = parseType(type);
    const distConfig = DISTANCE_RADIUS[distance] || DISTANCE_RADIUS['3pt'];
    const spread = ZONE_SPREAD[zoneId] || { angleSpread: 10, radiusSpread: 5 };
    
    // Variation d'angle
    const angleVariation = (Math.random() - 0.5) * 2 * spread.angleSpread;
    const angle = baseAngle + angleVariation;
    
    // Variation de rayon
    const baseRadius = distConfig.min + Math.random() * (distConfig.max - distConfig.min);
    const radiusVariation = (Math.random() - 0.5) * 2 * spread.radiusSpread;
    const radius = Math.max(10, baseRadius + radiusVariation);
    
    // Conversion polaire → cartésien
    const angleRad = (angle * Math.PI) / 180;
    const x = BASKET_POS.x + radius * Math.cos(angleRad);
    const y = BASKET_POS.y + radius * Math.sin(angleRad);
    
    return {
        x: Math.max(3, Math.min(97, x)),
        y: Math.max(3, Math.min(95, y))
    };
}

// Détecte le format des données (plat ou imbriqué)
function isNewFormat(record) {
    return record.hasOwnProperty('zoneId') && record.hasOwnProperty('tentes');
}

// Convertit l'ancien format (zones imbriquées) vers le nouveau format (plat)
function convertOldToNewFormat(historyData) {
    const newData = [];
    
    historyData.forEach(session => {
        // Si c'est déjà le nouveau format, on garde tel quel
        if (isNewFormat(session)) {
            newData.push(session);
            return;
        }
        
        // Ancien format avec zones imbriquées
        if (!session.zones) return;
        
        const distance = session.zones.Distance || session.zones.distance || '3pt';
        const shotType = session.zones.types || session.zones.type || 'arret';
        
        Object.keys(session.zones).forEach(key => {
            if (['Distance', 'distance', 'types', 'type'].includes(key)) return;
            
            const data = session.zones[key];
            if (!data || typeof data !== 'object') return;
            
            const attempted = data.attempted || data.tentes || 0;
            const made = data.made || data.marques || 0;
            if (attempted === 0) return;
            
            // Mapper les anciennes clés vers les nouveaux zoneId
            let zoneId = key;
            const zoneMapping = {
                '0G': 'gauche_0', '0D': 'droit_0',
                '45G': 'gauche_45', '45D': 'droit_45',
                '70G': 'gauche_70', '70D': 'droit_70',
                'Axe': 'axe', 'axe': 'axe',
                'Ligne': 'lf', 'LF': 'lf'
            };
            zoneId = zoneMapping[key] || key;
            
            newData.push({
                id: session.id + '_' + key,
                playerId: session.playerId,
                zoneId: zoneId,
                date: session.date,
                type: `${distance}_${shotType}`,
                tentes: attempted,
                marques: made
            });
        });
    });
    
    console.log(`🔄 Conversion format: ${historyData.length} entrées → ${newData.length} séries`);
    return newData;
}

// Convertit les données Firebase en tirs avec coordonnées (gère les 2 formats)
function convertHistoryToShots(historyData, playerFilter = null) {
    const shots = [];
    
    // D'abord, normaliser les données (convertir ancien format si nécessaire)
    const normalizedData = convertOldToNewFormat(historyData);
    
    normalizedData.forEach(record => {
        // Filtrer par joueur si spécifié
        if (playerFilter && playerFilter !== 'team' && record.playerId.toString() !== playerFilter) {
            return;
        }
        
        const { distance, shotType } = parseType(record.type);
        const zoneId = record.zoneId || 'axe';
        const tentes = record.tentes || 0;
        const marques = record.marques || 0;
        
        // Générer les tirs réussis
        for (let i = 0; i < marques; i++) {
            const coords = zoneToCoordinates(zoneId, record.type);
            shots.push({
                x: coords.x,
                y: coords.y,
                result: 'made',
                player_id: record.playerId.toString(),
                zone: zoneId,
                distance: distance,
                shot_type: shotType,
                date: record.date
            });
        }
        
        // Générer les tirs ratés
        const missed = tentes - marques;
        for (let i = 0; i < missed; i++) {
            const coords = zoneToCoordinates(zoneId, record.type);
            shots.push({
                x: coords.x,
                y: coords.y,
                result: 'missed',
                player_id: record.playerId.toString(),
                zone: zoneId,
                distance: distance,
                shot_type: shotType,
                date: record.date
            });
        }
    });
    
    // Log de debug
    const dist2 = shots.filter(s => s.distance === '2pt').length;
    const dist3 = shots.filter(s => s.distance === '3pt').length;
    const distLF = shots.filter(s => s.distance === 'lf').length;
    console.log(`📊 Conversion: ${shots.length} tirs | 2pts: ${dist2} | 3pts: ${dist3} | LF: ${distLF}`);
    
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
                    const loadedHistory = JSON.parse(d.history);
                    const loadedPlayers = JSON.parse(d.players);
                    
                    // Debug logs
                    console.log('📥 Données Firebase chargées:');
                    console.log('  - Nombre d\'entrées:', loadedHistory.length);
                    console.log('  - Premier élément:', loadedHistory[0]);
                    console.log('  - Format détecté:', loadedHistory[0]?.zoneId ? 'NOUVEAU (plat)' : 'ANCIEN (zones imbriquées)');
                    
                    updateHistory(loadedHistory);
                    updatePlayers(loadedPlayers);
                    alert("✅ Données chargées ! (" + loadedHistory.length + " entrées)");
                } else alert("Aucune sauvegarde trouvée.");
            }
        } catch (e) { 
            console.error('Erreur Firebase:', e);
            alert("Erreur: " + e.message); 
        }
        setIsSyncing(false);
    };

    return (
        <div className="min-h-screen pb-12 bg-gray-50 text-gray-800 font-sans">
            <div className="bg-white sticky top-0 z-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    🏀 StatElite <span className="text-xs text-white bg-slate-800 px-2 rounded-full font-normal">v9.0</span>
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
        if(!selectedPlayer || !selectedZoneId || isNaN(tt) || tt===0 || tr>tt) return alert("Vérifiez les scores");
        
        // Format plat : un enregistrement par série
        const newRecord = {
            id: Date.now() + Math.random(),
            playerId: parseInt(selectedPlayer),
            zoneId: selectedZoneId,
            date: date,
            type: `${distance}_${typeTir}`,
            tentes: tt,
            marques: tr
        };
        
        setHistoryData([...historyData, newRecord]);
        setTentes(''); setMarques('');
        
        const btn = document.getElementById('validBtn');
        if(btn) { btn.innerText = "✅ ENREGISTRÉ"; setTimeout(()=>btn.innerText = "VALIDER", 800); }
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
                                    <button onClick={()=>setTypeTir('arret')} className={`px-4 py-1 rounded font-bold text-sm ${typeTir==='arret'?'bg-white shadow text-green-600':'text-gray-400'}`}>Arrêt 🛑</button>
                                    <button onClick={()=>setTypeTir('mouv')} className={`px-4 py-1 rounded font-bold text-sm ${typeTir==='mouv'?'bg-white shadow text-orange-600':'text-gray-400'}`}>Mouv 🏃</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                {ZONES_CONFIG.map(z => (
                                    <button key={z.id} onClick={()=>setSelectedZoneId(z.id)} className={`py-4 rounded-xl border-2 transition relative overflow-hidden ${selectedZoneId===z.id ? `border-transparent bg-gradient-to-br ${z.color} text-white shadow-lg scale-105` : 'border-gray-100 text-gray-500 hover:border-blue-200 bg-white'}`}>
                                        <span className="relative z-10 font-bold text-sm">{z.label}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {(selectedZoneId || mode === 'lf') ? (
                        <div className="animate-fade-in">
                            <div className="text-center mb-4 text-xs uppercase font-bold text-gray-400 tracking-widest">
                                {mode==='lf' ? 'Lancer Franc' : `${distance.toUpperCase()} ${typeTir} - ${ZONES_CONFIG.find(z=>z.id===selectedZoneId)?.label || selectedZoneId}`}
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

    // Normaliser les données pour gérer les deux formats
    const normalizedData = useMemo(() => convertOldToNewFormat(historyData), [historyData]);

    const calculateStats = () => {
        const initStat = () => ({ tt: 0, tr: 0 });
        const team = { zones: {}, types: { 'arret': initStat(), 'mouv': initStat() }, total: initStat() };
        ZONES_CONFIG.forEach(z => team.zones[z.id] = initStat());
        team.zones['lf'] = initStat();

        const playersStats = {};
        players.forEach(p => {
            playersStats[p.id] = { zones: {}, types: { 'arret': initStat(), 'mouv': initStat() }, total: initStat() };
            ZONES_CONFIG.forEach(z => playersStats[p.id].zones[z.id] = initStat());
            playersStats[p.id].zones['lf'] = initStat();
        });

        let filteredData = normalizedData;
        if (startDate) filteredData = filteredData.filter(d => d.date >= startDate);
        if (endDate) filteredData = filteredData.filter(d => d.date <= endDate);

        filteredData.forEach(record => {
            const pid = record.playerId;
            const { shotType } = parseType(record.type);
            const zoneId = record.zoneId || 'axe';
            const tentes = record.tentes || 0;
            const marques = record.marques || 0;

            // Équipe
            team.total.tt += tentes;
            team.total.tr += marques;
            if (team.types[shotType]) {
                team.types[shotType].tt += tentes;
                team.types[shotType].tr += marques;
            }
            if (team.zones[zoneId]) {
                team.zones[zoneId].tt += tentes;
                team.zones[zoneId].tr += marques;
            }

            // Joueur
            if (playersStats[pid]) {
                playersStats[pid].total.tt += tentes;
                playersStats[pid].total.tr += marques;
                if (playersStats[pid].types[shotType]) {
                    playersStats[pid].types[shotType].tt += tentes;
                    playersStats[pid].types[shotType].tr += marques;
                }
                if (playersStats[pid].zones[zoneId]) {
                    playersStats[pid].zones[zoneId].tt += tentes;
                    playersStats[pid].zones[zoneId].tr += marques;
                }
            }
        });

        // Best performers
        const bestPerformers = {};
        const allZoneIds = [...ZONES_CONFIG.map(z => z.id), 'lf'];
        allZoneIds.forEach(zId => {
            let bestPid = null, bestPct = -1;
            players.forEach(p => {
                const s = playersStats[p.id].zones[zId];
                if (s && s.tt >= 5) {
                    const pct = (s.tr / s.tt) * 100;
                    if (pct > bestPct) { bestPct = pct; bestPid = p.id; }
                }
            });
            if (bestPid) bestPerformers[zId] = { pid: bestPid, pct: bestPct };
        });

        return { team, playersStats, bestPerformers, recentSessions: filteredData.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)) };
    };

    const { team, playersStats, bestPerformers, recentSessions } = calculateStats();
    const fmt = (stat) => stat.tt > 0 ? Math.round((stat.tr / stat.tt) * 100) + '%' : '-';
    const fmtDet = (stat) => stat.tt > 0 ? `${stat.tr}/${stat.tt}` : '';

    const setQuickRange = (type) => {
        const now = new Date();
        if(type==='all') { setStartDate(''); setEndDate(''); }
        if(type==='month') { setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]); setEndDate(''); }
        if(type==='season') { const y = now.getMonth()<8 ? now.getFullYear()-1 : now.getFullYear(); setStartDate(new Date(y, 8, 1).toISOString().split('T')[0]); setEndDate(''); }
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
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 outline-none"/>
                    <span className="font-bold text-gray-400">Au</span>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 outline-none"/>
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
                            <div className="text-2xl font-black text-slate-800">{fmt(team.types['arret'])}</div>
                            <div className="text-xs text-gray-500">{fmtDet(team.types['arret'])}</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Tirs Mouvement 🏃</div>
                            <div className="text-2xl font-black text-slate-800">{fmt(team.types['mouv'])}</div>
                            <div className="text-xs text-gray-500">{fmtDet(team.types['mouv'])}</div>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Lancers Francs 🏀</div>
                            <div className="text-2xl font-black text-orange-600">{fmt(team.zones['lf'])}</div>
                            <div className="text-xs text-gray-500">{fmtDet(team.zones['lf'])}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Performance par Zone (Équipe)</h3>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {ZONES_CONFIG.map(z => {
                            const stat = team.zones[z.id];
                            const pct = stat.tt > 0 ? (stat.tr/stat.tt)*100 : 0;
                            const color = stat.tt === 0 ? 'bg-gray-50' : pct >= 50 ? 'bg-green-100 text-green-800' : pct >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                            return (
                                <div key={z.id} className={`rounded p-2 ${color} flex flex-col justify-center`}>
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
                    <h3 className="font-bold text-slate-800">📊 Performance Individuelle</h3>
                    <div className="text-xs text-gray-500 flex gap-2 items-center"><span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-full block"></span> = Leader</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-gray-200">
                                <th className="p-3 text-left bg-white sticky left-0 z-10 shadow-sm min-w-[100px]">Joueur</th>
                                <th className="p-3 bg-blue-50/50">Arrêt</th>
                                <th className="p-3 bg-red-50/50 border-r border-gray-200">Mouv</th>
                                {ZONES_CONFIG.map(z => <th key={z.id} className="p-3 min-w-[55px]">{z.key}</th>)}
                                <th className="p-3 bg-orange-50 border-l border-gray-200">LF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {players.map(p => {
                                const s = playersStats[p.id];
                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-3 text-left font-bold text-slate-700 bg-white sticky left-0 z-10 shadow-sm border-r border-gray-100">{p.name}</td>
                                        <td className="p-3 bg-blue-50/20 font-mono text-blue-700 font-bold">{fmt(s.types['arret'])}</td>
                                        <td className="p-3 bg-red-50/20 font-mono text-red-700 font-bold border-r border-gray-200">{fmt(s.types['mouv'])}</td>
                                        {ZONES_CONFIG.map(z => {
                                            const stat = s.zones[z.id];
                                            const isBest = bestPerformers[z.id]?.pid === p.id;
                                            return (
                                                <td key={z.id} className={`p-2 relative ${isBest ? 'bg-yellow-100 ring-inset ring-2 ring-yellow-300' : ''}`}>
                                                    <div className={`font-bold ${isBest ? 'text-yellow-800' : 'text-gray-600'}`}>{fmt(stat)}</div>
                                                    <div className="text-[10px] text-gray-400">{fmtDet(stat)}</div>
                                                    {isBest && <span className="absolute top-0 right-0 text-[8px]">👑</span>}
                                                </td>
                                            );
                                        })}
                                        <td className={`p-3 border-l border-gray-200 ${bestPerformers['lf']?.pid === p.id ? 'bg-orange-100' : 'bg-orange-50/30'}`}>
                                            <div className="font-bold text-orange-700">{fmt(s.zones['lf'])}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-sm mb-4 text-gray-600 uppercase">📜 Historique ({recentSessions.length} séries)</h3>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {recentSessions.length === 0 ? <p className="text-gray-400 italic text-sm">Aucune séance.</p> : 
                    recentSessions.slice(0, 50).map(rec => {
                        const pName = players.find(p=>p.id===rec.playerId)?.name || '?';
                        const zone = ZONES_CONFIG.find(z=>z.id===rec.zoneId);
                        return (
                            <div key={rec.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 text-sm hover:bg-white hover:shadow-sm transition">
                                <div>
                                    <span className="font-bold text-slate-700">{pName}</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="text-gray-500">{rec.date}</span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="text-blue-500 text-xs font-bold uppercase">{zone?.key || rec.zoneId} {rec.type}</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="font-mono font-bold text-slate-800">{rec.marques}/{rec.tentes}</span>
                                    <button onClick={()=>deleteSession(rec.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition">🗑️</button>
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

    // Normaliser les données d'abord
    const normalizedData = useMemo(() => convertOldToNewFormat(historyData), [historyData]);
    
    const firebaseShots = useMemo(() => convertHistoryToShots(historyData, selectedPlayer), [historyData, selectedPlayer]);

    const filteredShots = useMemo(() => {
        let shots = firebaseShots;
        if (resultFilter === 'made') shots = shots.filter(s => s.result === 'made');
        else if (resultFilter === 'missed') shots = shots.filter(s => s.result === 'missed');
        if (distanceFilter !== 'all') shots = shots.filter(s => s.distance === distanceFilter);
        return shots;
    }, [firebaseShots, resultFilter, distanceFilter]);

    const localStats = useMemo(() => {
        const total = filteredShots.length;
        const made = filteredShots.filter(s => s.result === 'made').length;
        return { total, made, missed: total - made, percentage: total > 0 ? Math.round((made / total) * 1000) / 10 : 0 };
    }, [filteredShots]);

    // Compteur de tirs par joueur
    const getPlayerShotCount = (playerId) => {
        return normalizedData.filter(r => r.playerId === playerId).reduce((acc, r) => acc + (r.tentes || 0), 0);
    };

    const generateVisualization = async (type) => {
        setIsLoading(true);
        setViewType(type);
        
        if (filteredShots.length < 3) { alert('Il faut au moins 3 tirs'); setIsLoading(false); return; }
        
        try {
            await fetch(`${API_BASE_URL}/api/shots/team`, { method: 'DELETE' });
            await fetch(`${API_BASE_URL}/api/shots/bulk`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shots: filteredShots })
            });
            
            const endpoint = type === 'heatmap' ? 'heatmap' : 'shotchart';
            const res = await fetch(`${API_BASE_URL}/api/${endpoint}/${selectedPlayer}`);
            
            if (!res.ok) throw new Error('Erreur génération');
            const data = await res.json();
            setGeneratedImage(data.image);
        } catch (e) {
            console.error('Erreur API:', e);
            alert('API non disponible. Affichage local uniquement.');
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500">Joueur:</span>
                        <select value={selectedPlayer} onChange={(e) => { setSelectedPlayer(e.target.value); setGeneratedImage(null); }} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-bold text-sm outline-none">
                            <option value="team">🏀 Équipe ({firebaseShots.length} tirs)</option>
                            {players.map(p => (
                                <option key={p.id} value={p.id.toString()}>{p.name} ({getPlayerShotCount(p.id)})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                            <option value="all">Tous résultats</option>
                            <option value="made">✅ Réussis</option>
                            <option value="missed">❌ Ratés</option>
                        </select>
                        <select value={distanceFilter} onChange={(e) => setDistanceFilter(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                            <option value="all">Toutes distances</option>
                            <option value="2pt">2 Points</option>
                            <option value="3pt">3 Points</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={() => setViewType('points')} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewType === 'points' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>📍 Points</button>
                        <button onClick={() => generateVisualization('heatmap')} disabled={isLoading} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewType === 'heatmap' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>
                            {isLoading ? '⏳' : '🔥'} Heatmap
                        </button>
                        <button onClick={() => generateVisualization('shotchart')} disabled={isLoading} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewType === 'shotchart' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>
                            {isLoading ? '⏳' : '📊'} Chart API
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                {/* Stats Panel */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h3 className="font-bold text-gray-700 text-sm mb-3">📈 Statistiques</h3>
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
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h4 className="font-bold text-gray-700 text-sm mb-3">📋 Légende</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-500"></span><span className="text-sm text-gray-600">Réussi</span></div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-500"></span><span className="text-sm text-gray-600">Raté</span></div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="h-3 rounded bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600"></div>
                            <div className="flex justify-between text-[10px] text-gray-500 mt-1"><span>Faible</span><span>Haute densité</span></div>
                        </div>
                    </div>
                </div>
                
                {/* Court */}
                <div className="lg:col-span-9">
                    {viewType !== 'points' && generatedImage ? (
                        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden p-4">
                            <img src={generatedImage} alt="Shot Chart" className="w-full h-auto rounded-lg" />
                        </div>
                    ) : (
                        <div className="relative bg-gradient-to-b from-orange-700 to-orange-900 rounded-2xl shadow-2xl overflow-hidden" style={{ aspectRatio: '1.06' }}>
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
                                <g fontSize="3" fill="rgba(255,255,255,0.3)" textAnchor="middle" fontWeight="bold">
                                    <text x="8" y="20">0°G</text>
                                    <text x="18" y="50">45°G</text>
                                    <text x="32" y="68">70°G</text>
                                    <text x="50" y="78">Axe</text>
                                    <text x="68" y="68">70°D</text>
                                    <text x="82" y="50">45°D</text>
                                    <text x="92" y="20">0°D</text>
                                </g>
                            </svg>
                            
                            {filteredShots.map((shot, idx) => (
                                <div 
                                    key={idx}
                                    className={`absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 border border-white/50 ${shot.result === 'made' ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ left: `${shot.x}%`, top: `${shot.y}%`, opacity: 0.8 }}
                                />
                            ))}
                            
                            {filteredShots.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white/60 p-6">
                                        <span className="text-5xl mb-3 block">📊</span>
                                        <p className="font-bold">Aucune donnée</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                        <p className="text-xs text-indigo-700">
                            <strong>📊 {filteredShots.length} tirs affichés</strong> — Les coordonnées sont générées à partir des zones ({ZONES_CONFIG.map(z=>z.key).join(', ')}) et distances (2pt/3pt).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
