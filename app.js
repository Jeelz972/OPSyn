// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBaA99che1oz9BHc23IhiFoY-nK0xvg4q4",
    authDomain: "statu18elite.firebaseapp.com",
    projectId: "statu18elite",
    storageBucket: "statu18elite.firebasestorage.app",
    messagingSenderId: "862850988986",
    appId: "1:862850988986:web:47a2b48477015506f6fb83",
    measurementId: "G-Y4ZDKZQ7F9"
};

let db = null;
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
            } catch (e) { console.error(e); }
        }

        const { useState, useEffect } = React;

        // --- DONNEES ---
        // On sépare LF des zones terrain pour la logique
        const ZONES_TERRAIN = [
            { id: 'axe', name: 'Axe', color: '#6366f1' },
            { id: 'gauche_0', name: 'G 0°', color: '#3b82f6' },
            { id: 'gauche_45', name: 'G 45°', color: '#10b981' },
            { id: 'gauche_70', name: 'G 70°', color: '#06b6d4' },
            { id: 'droit_0', name: 'D 0°', color: '#ec4899' },
            { id: 'droit_45', name: 'D 45°', color: '#f59e0b' },
            { id: 'droit_70', name: 'D 70°', color: '#ef4444' }
        ];

        // Pour la compatibilité des données, on garde une liste globale
        const ALL_ZONES_IDS = [...ZONES_TERRAIN.map(z=>z.id), 'zone_lf'];

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
                        alert("Sauvegardé !");
                    } else {
                        const doc = await docRef.get();
                        if(doc.exists) {
                            const d = doc.data();
                            updateData('basketball_history', JSON.parse(d.history), setHistoryData);
                            updateData('basketball_players', JSON.parse(d.players), setPlayers);
                            alert("Chargé !");
                        }
                    }
                } catch (e) { alert("Erreur: " + e.message); }
                setIsSyncing(false);
            };

            return (
                <div className="min-h-screen pb-10">
                    <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-lg">
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
                            <h1 className="text-xl font-bold flex items-center gap-2">🏀 StatElite U18 <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">v3.3</span></h1>
                            <div className="flex bg-slate-800 p-1 rounded-lg">
                                <button onClick={()=>setActiveModule('shooting')} className={`px-4 py-1.5 rounded transition ${activeModule==='shooting'?'bg-blue-600 text-white':'text-gray-400 hover:text-white'}`}>Saisie</button>
                                <button onClick={()=>setActiveModule('analysis')} className={`px-4 py-1.5 rounded transition ${activeModule==='analysis'?'bg-blue-600 text-white':'text-gray-400 hover:text-white'}`}>Analyse</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={()=>handleCloud('save')} disabled={isSyncing} className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm font-bold">{isSyncing?'...':'☁️'}</button>
                                <button onClick={()=>handleCloud('load')} disabled={isSyncing} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm font-bold">📥</button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto p-2 md:p-6">
                        {activeModule === 'shooting' && <ShootingModule players={players} setPlayers={(p)=>updateData('basketball_players',p,setPlayers)} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
                        {activeModule === 'analysis' && <AnalysisModule players={players} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
                    </div>
                </div>
            );
        }

        // --- SAISIE ---
        function ShootingModule({ players, setPlayers, historyData, setHistoryData }) {
            const [step, setStep] = useState('mode'); // mode, input
            const [mode, setMode] = useState(null); // 'field' or 'lf'
            
            const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id);
            const [selectedZone, setSelectedZone] = useState(null);
            const [selectedType, setSelectedType] = useState('2pt_arret');
            const [tentes, setTentes] = useState('');
            const [marques, setMarques] = useState('');
            const [newPlayer, setNewPlayer] = useState('');
            const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

            // Reset partiel quand on change de mode
            useEffect(() => {
                setSelectedZone(null);
                if(mode === 'lf') {
                    setSelectedZone('zone_lf');
                    setSelectedType('1pt_lancer');
                } else {
                    setSelectedType('2pt_arret');
                }
            }, [mode]);

            const saveShot = () => {
                const tt = parseInt(tentes), tr = parseInt(marques);
                if(!selectedPlayer || !selectedZone || isNaN(tt) || tt===0 || tr>tt) return alert("Erreur saisie");
                
                const rec = { id: Date.now(), date, playerId: parseInt(selectedPlayer), zoneId: selectedZone, type: selectedType, tentes: tt, marques: tr };
                setHistoryData([...historyData, rec]);
                setTentes(''); setMarques('');
                // Feedback
                const btn = document.getElementById('validBtn');
                if(btn) { btn.innerText = "✅ OK"; setTimeout(()=>btn.innerText="VALIDER", 800); }
            };

            const addPlayer = () => {
                if(newPlayer) { setPlayers([...players, {id: Date.now(), name: newPlayer}]); setNewPlayer(''); }
            }

            // --- ÉCRAN 1 : CHOIX DU MODE ---
            if (step === 'mode') {
                return (
                    <div className="flex flex-col items-center justify-center h-[70vh] gap-8 animate-fade-in">
                        <h2 className="text-2xl font-bold text-gray-700">Que voulez-vous saisir ?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                            <button onClick={() => { setMode('field'); setStep('input'); }} className="p-8 bg-white border-2 border-blue-200 rounded-2xl shadow-xl hover:scale-105 transition flex flex-col items-center gap-4 group">
                                <span className="text-6xl group-hover:scale-110 transition">🏀</span>
                                <span className="text-2xl font-bold text-blue-800">Tirs de Champ</span>
                                <span className="text-gray-500">Zones, 3pts, mi-distance...</span>
                            </button>
                            <button onClick={() => { setMode('lf'); setStep('input'); }} className="p-8 bg-white border-2 border-purple-200 rounded-2xl shadow-xl hover:scale-105 transition flex flex-col items-center gap-4 group">
                                <span className="text-6xl group-hover:scale-110 transition">⛹️</span>
                                <span className="text-2xl font-bold text-purple-800">Lancers Francs</span>
                                <span className="text-gray-500">Série de LF uniquement</span>
                            </button>
                        </div>
                    </div>
                );
            }

            // --- ÉCRAN 2 : SAISIE ---
            return (
                <div className="grid md:grid-cols-12 gap-4">
                    {/* GAUCHE : JOUEURS */}
                    <div className="md:col-span-3 bg-white p-4 rounded-lg shadow h-fit">
                        <button onClick={() => setStep('mode')} className="mb-4 text-sm text-gray-500 hover:text-black">← Retour choix</button>
                        <div className="flex gap-1 mb-2"><input value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} className="border p-1 w-full rounded" placeholder="Nouveau..."/><button onClick={addPlayer} className="bg-green-500 text-white px-2 rounded">+</button></div>
                        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {players.map(p => (
                                <button key={p.id} onClick={()=>setSelectedPlayer(p.id)} className={`w-full text-left p-2 rounded ${selectedPlayer===p.id ? 'bg-slate-800 text-white':'hover:bg-gray-100'}`}>{p.name}</button>
                            ))}
                        </div>
                    </div>

                    {/* DROITE : INPUTS */}
                    <div className="md:col-span-9 space-y-4">
                        <div className="bg-white p-3 rounded shadow flex justify-between items-center">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                {mode === 'field' ? <span className="text-blue-600">🎯 Tirs de Champ</span> : <span className="text-purple-600">⛹️ Lancers Francs</span>}
                            </h2>
                            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-1 rounded"/>
                        </div>

                        {/* ZONES (Seulement si Field) */}
                        {mode === 'field' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {ZONES_TERRAIN.map(z => (
                                    <button key={z.id} onClick={()=>setSelectedZone(z.id)} 
                                        className={`p-3 border-2 rounded-lg transition ${selectedZone===z.id?'bg-blue-600 text-white border-blue-600 shadow-lg':'bg-white hover:border-blue-300'}`}>
                                        <div className="font-bold">{z.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ZONE DE SAISIE */}
                        {(selectedZone || mode === 'lf') && (
                            <div className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-blue-500 animate-fade-in">
                                <div className="text-center mb-4 font-bold text-gray-500 uppercase tracking-widest">
                                    {mode === 'lf' ? 'Série Lancer Franc' : ZONES_TERRAIN.find(z=>z.id===selectedZone)?.name}
                                </div>

                                {mode === 'field' && (
                                    <div className="flex justify-center gap-2 mb-6">
                                        {SHOT_TYPES.filter(t=>t.cat !== 'lf').map(t => (
                                            <button key={t.id} onClick={()=>setSelectedType(t.id)} className={`px-3 py-2 rounded border flex flex-col items-center ${selectedType===t.id?'bg-slate-800 text-white':'bg-gray-50'}`}>
                                                <span className="text-xl">{t.icon}</span>
                                                <span className="text-xs">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-center gap-4 items-end mb-6">
                                    <div className="text-center">
                                        <label className="text-xs font-bold text-gray-400">TENTÉS</label>
                                        <input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} className="w-24 p-2 text-3xl font-bold text-center border-b-2 border-gray-300 focus:border-blue-500 outline-none" placeholder="0"/>
                                    </div>
                                    <div className="text-center">
                                        <label className="text-xs font-bold text-green-600">MARQUÉS</label>
                                        <input type="number" value={marques} onChange={e=>setMarques(e.target.value)} className="w-24 p-2 text-3xl font-bold text-center border-b-2 border-green-500 text-green-600 outline-none" placeholder="0"/>
                                    </div>
                                </div>

                                <button id="validBtn" onClick={saveShot} className="w-full py-4 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition shadow-lg">
                                    VALIDER
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // --- ANALYSE ---
        function AnalysisModule({ players, historyData, setHistoryData }) {
            // Logique de calcul complexe
            const calculateStats = () => {
                const matrix = {}; // { playerId: { zoneId: { tr:0, tt:0, pct:0 } } }
                const maxPerZone = {}; // { zoneId: { pct: 0, playerId: null } }

                players.forEach(p => {
                    matrix[p.id] = { 
                        'global_arret': {tt:0, tr:0}, 
                        'global_mouv': {tt:0, tr:0}, 
                        'lf': {tt:0, tr:0} 
                    };
                    ZONES_TERRAIN.forEach(z => matrix[p.id][z.id] = {tt:0, tr:0});
                });

                historyData.forEach(d => {
                    if(!matrix[d.playerId]) return;
                    const type = SHOT_TYPES.find(t=>t.id === d.type);
                    
                    // Stats LF
                    if(d.zoneId === 'zone_lf') {
                        matrix[d.playerId]['lf'].tt += d.tentes;
                        matrix[d.playerId]['lf'].tr += d.marques;
                    } 
                    // Stats Zones
                    else if (matrix[d.playerId][d.zoneId]) {
                        matrix[d.playerId][d.zoneId].tt += d.tentes;
                        matrix[d.playerId][d.zoneId].tr += d.marques;
                        
                        // Global Arrêt / Mouv
                        const key = type?.mouv ? 'global_mouv' : 'global_arret';
                        matrix[d.playerId][key].tt += d.tentes;
                        matrix[d.playerId][key].tr += d.marques;
                    }
                });

                // Calculs pourcentages et Max
                Object.keys(matrix).forEach(pid => {
                    Object.keys(matrix[pid]).forEach(zid => {
                        const cell = matrix[pid][zid];
                        cell.pct = cell.tt > 0 ? (cell.tr/cell.tt)*100 : 0;
                        
                        // Déterminer le meilleur shooter (min 1 tir pour éviter les 100% sur 0 tir si bug, ici min >0)
                        if(cell.tt > 0) {
                            if(!maxPerZone[zid] || cell.pct > maxPerZone[zid].pct) {
                                maxPerZone[zid] = { pct: cell.pct, playerId: pid };
                            } else if (cell.pct === maxPerZone[zid].pct) {
                                // Ex-aequo ? on peut garder le premier ou gérer une liste. Ici simple.
                            }
                        }
                    });
                });

                return { matrix, maxPerZone };
            };

            const { matrix, maxPerZone } = calculateStats();
            const formatPct = (n) => n.toFixed(0) + '%';

            // Fonction supression pour l'admin
            const deleteLast = () => { if(confirm("Supprimer dernier entré ?")) setHistoryData(historyData.slice(0, -1)); }

            return (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <h2 className="font-bold text-gray-700">🏆 Tableau des Shooters</h2>
                        <button onClick={deleteLast} className="text-xs text-red-400 underline">Annuler dernier ajout</button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th className="p-3 text-left sticky left-0 bg-slate-800 z-10">Joueur</th>
                                    <th className="p-3 bg-purple-900 border-l border-white/20">LF</th>
                                    <th className="p-3 bg-blue-900 border-l border-white/20">Arrêt (Tot)</th>
                                    <th className="p-3 bg-orange-900 border-l border-white/20">Mouv (Tot)</th>
                                    {ZONES_TERRAIN.map(z => (
                                        <th key={z.id} className="p-3 border-l border-white/20" style={{backgroundColor: z.color}}>{z.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map(p => {
                                    const stats = matrix[p.id];
                                    if(!stats) return null;
                                    return (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-bold text-left sticky left-0 bg-white shadow-r">{p.name}</td>
                                            
                                            {/* LF */}
                                            <td className="p-3 bg-purple-50 border-l font-mono">
                                                <div className="font-bold">{stats.lf.tr}/{stats.lf.tt}</div>
                                                <div className="text-xs text-purple-700">{formatPct(stats.lf.pct)}</div>
                                            </td>

                                            {/* Arrêt */}
                                            <td className="p-3 bg-blue-50 border-l font-mono">
                                                <div className="font-bold">{stats.global_arret.tr}/{stats.global_arret.tt}</div>
                                                <div className="text-xs text-blue-700">{formatPct(stats.global_arret.pct)}</div>
                                            </td>

                                            {/* Mouv */}
                                            <td className="p-3 bg-orange-50 border-l font-mono">
                                                <div className="font-bold">{stats.global_mouv.tr}/{stats.global_mouv.tt}</div>
                                                <div className="text-xs text-orange-700">{formatPct(stats.global_mouv.pct)}</div>
                                            </td>

                                            {/* Zones */}
                                            {ZONES_TERRAIN.map(z => {
                                                const s = stats[z.id];
                                                const isBest = maxPerZone[z.id]?.playerId == p.id && s.tt > 0 && maxPerZone[z.id].pct > 0;
                                                
                                                return (
                                                    <td key={z.id} className={`p-3 border-l ${isBest ? 'bg-yellow-200 ring-inset ring-2 ring-yellow-400' : ''}`}>
                                                        <div className={`font-bold ${isBest ? 'text-yellow-900 scale-110' : ''}`}>
                                                            {s.tr}/{s.tt}
                                                        </div>
                                                        <div className={`text-xs ${isBest ? 'font-bold text-yellow-800' : 'text-gray-500'}`}>
                                                            {s.tt > 0 ? formatPct(s.pct) : '-'}
                                                        </div>
                                                        {isBest && <span className="absolute top-0 right-0 text-[10px]">👑</span>}
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
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
