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
// Init Firebase
        let db = null;
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try { firebase.initializeApp(firebaseConfig); db = firebase.firestore(); } 
            catch (e) { console.error(e); }
        }

        const { useState, useEffect } = React;

        // --- DONNÉES ---
        const ZONES_TERRAIN = [
            { id: 'axe', name: 'Axe', color: 'from-indigo-500 to-indigo-600' },
            { id: 'gauche_0', name: 'G 0°', color: 'from-blue-500 to-blue-600' },
            { id: 'gauche_45', name: 'G 45°', color: 'from-emerald-400 to-emerald-600' },
            { id: 'gauche_70', name: 'G 70°', color: 'from-cyan-400 to-cyan-600' },
            { id: 'droit_0', name: 'D 0°', color: 'from-pink-500 to-pink-600' },
            { id: 'droit_45', name: 'D 45°', color: 'from-amber-400 to-amber-600' },
            { id: 'droit_70', name: 'D 70°', color: 'from-red-500 to-red-600' }
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

        // --- COMPOSANT APP ---
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
                    {/* HEADER MODERNE */}
                    <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
                            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2">
                                🏀 StatElite <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border">v3.4</span>
                            </h1>
                            
                            <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                                <button onClick={()=>setActiveModule('shooting')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeModule==='shooting'?'bg-white text-blue-600 shadow-md scale-105':'text-gray-500 hover:text-gray-800'}`}>🎯 Saisie</button>
                                <button onClick={()=>setActiveModule('analysis')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeModule==='analysis'?'bg-white text-blue-600 shadow-md scale-105':'text-gray-500 hover:text-gray-800'}`}>📊 Analyse</button>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={()=>handleCloud('save')} disabled={isSyncing} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition active:scale-95 flex items-center gap-1">
                                    {isSyncing ? '⏳' : '☁️ Save'}
                                </button>
                                <button onClick={()=>handleCloud('load')} disabled={isSyncing} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition active:scale-95">
                                    📥
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
                        {activeModule === 'shooting' && <ShootingModule players={players} setPlayers={(p)=>updateData('basketball_players',p,setPlayers)} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
                        {activeModule === 'analysis' && <AnalysisModule players={players} historyData={historyData} />}
                    </div>
                </div>
            );
        }

        // --- SAISIE (Shooting) ---
        function ShootingModule({ players, setPlayers, historyData, setHistoryData }) {
            const [mode, setMode] = useState('field'); // 'field' | 'lf'
            
            // État du formulaire
            const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id);
            const [selectedZone, setSelectedZone] = useState(null);
            const [selectedType, setSelectedType] = useState('2pt_arret');
            const [tentes, setTentes] = useState('');
            const [marques, setMarques] = useState('');
            const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
            
            // État pour l'édition et ajout joueur
            const [editingId, setEditingId] = useState(null);
            const [newPlayer, setNewPlayer] = useState('');

            // Reset des sélections lors du changement de mode
            useEffect(() => {
                if(mode === 'lf') {
                    setSelectedZone('zone_lf');
                    setSelectedType('1pt_lancer');
                } else {
                    setSelectedZone(null);
                    setSelectedType('2pt_arret');
                }
                setEditingId(null);
                setTentes('');
                setMarques('');
            }, [mode]);

            // Validation (Création OU Modification)
            const saveShot = () => {
                const tt = parseInt(tentes), tr = parseInt(marques);
                if(!selectedPlayer || !selectedZone || isNaN(tt) || tt===0 || tr>tt) return alert("Erreur dans la saisie (Vérifiez les scores).");

                const record = {
                    id: editingId || Date.now(),
                    date,
                    playerId: parseInt(selectedPlayer),
                    zoneId: selectedZone,
                    type: selectedType,
                    tentes: tt,
                    marques: tr
                };

                if (editingId) {
                    // Modification
                    setHistoryData(historyData.map(item => item.id === editingId ? record : item));
                    setEditingId(null);
                    alert("✅ Modification enregistrée");
                } else {
                    // Création
                    setHistoryData([...historyData, record]);
                    // Feedback visuel
                    const btn = document.getElementById('validBtn');
                    if(btn) { 
                        btn.classList.add('bg-green-600'); 
                        btn.innerText = "✅ ENREGISTRÉ"; 
                        setTimeout(()=>{
                            btn.classList.remove('bg-green-600'); 
                            btn.innerText = editingId ? "MODIFIER" : "VALIDER LA SÉRIE";
                        }, 1000); 
                    }
                }
                // Reset champs score uniquement
                setTentes(''); setMarques('');
            };

            // Charger une entrée pour modification
            const loadForEdit = (record) => {
                setEditingId(record.id);
                setMode(record.zoneId === 'zone_lf' ? 'lf' : 'field');
                // Timeout pour laisser le temps au state mode de changer
                setTimeout(() => {
                    setSelectedPlayer(record.playerId);
                    setSelectedZone(record.zoneId);
                    setSelectedType(record.type);
                    setTentes(record.tentes);
                    setMarques(record.marques);
                    setDate(record.date);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 50);
            };

            const deleteRecord = (id) => {
                if(confirm("Supprimer cette série ?")) {
                    setHistoryData(historyData.filter(i => i.id !== id));
                    if(editingId === id) { setEditingId(null); setTentes(''); setMarques(''); }
                }
            };

            const addPlayer = () => {
                if(newPlayer.trim()) { setPlayers([...players, {id:Date.now(), name: newPlayer}]); setNewPlayer(''); }
            };

            // Filtrer l'historique récent (les 10 derniers)
            const recentHistory = [...historyData].sort((a,b) => b.id - a.id).slice(0, 10);

            return (
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* COLONNE GAUCHE : JOUEURS */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit sticky top-24">
                            <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 tracking-wider">Effectif</h3>
                            <div className="flex gap-2 mb-3">
                                <input value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ajouter joueur..."/>
                                <button onClick={addPlayer} className="bg-blue-600 text-white rounded-lg px-3 hover:bg-blue-700 font-bold text-xl leading-none">+</button>
                            </div>
                            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                                {players.map(p => (
                                    <button 
                                        key={p.id} 
                                        onClick={()=>setSelectedPlayer(p.id)} 
                                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${selectedPlayer===p.id ? 'bg-slate-800 text-white shadow-lg scale-105 font-semibold':'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        <span>{p.name}</span>
                                        {selectedPlayer===p.id && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Actif</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COLONNE DROITE : SAISIE + HISTORIQUE */}
                    <div className="lg:col-span-9 space-y-6">
                        
                        {/* 1. TOP BAR : MODE SWITCHER + DATE */}
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            {/* Switcher Mode */}
                            <div className="flex bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
                                <button 
                                    onClick={()=>setMode('field')} 
                                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode==='field' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span>🏀</span> Tirs de Champ
                                </button>
                                <button 
                                    onClick={()=>setMode('lf')} 
                                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode==='lf' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span>⛹️</span> Lancers Francs
                                </button>
                            </div>
                            
                            {/* Date Picker */}
                            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-gray-50 border-none font-semibold text-gray-600 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"/>
                        </div>

                        {/* 2. ZONE DE SAISIE PRINCIPALE */}
                        <div className={`bg-white rounded-3xl shadow-xl border-4 transition-colors duration-500 overflow-hidden ${mode==='lf' ? 'border-purple-100' : 'border-blue-100'}`}>
                            
                            {/* En-tête de la carte */}
                            <div className={`p-4 text-center ${mode==='lf' ? 'bg-purple-50' : 'bg-blue-50'} border-b border-gray-100`}>
                                <h2 className={`text-lg font-bold uppercase tracking-widest ${mode==='lf' ? 'text-purple-800' : 'text-blue-800'}`}>
                                    {editingId ? "✏️ Modification en cours" : (mode==='lf' ? "Série de Lancers Francs" : "Nouvelle Série de Tirs")}
                                </h2>
                            </div>

                            <div className="p-6 md:p-8">
                                {/* GRILLE DES ZONES (Si Mode Field) */}
                                {mode === 'field' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-slide-up">
                                        {ZONES_TERRAIN.map(z => (
                                            <button key={z.id} onClick={()=>setSelectedZone(z.id)} 
                                                className={`py-4 px-2 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group ${selectedZone===z.id ? `border-transparent bg-gradient-to-br ${z.color} text-white shadow-lg scale-105` : 'border-gray-100 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50'}`}>
                                                <span className="relative z-10 font-bold">{z.name}</span>
                                                {selectedZone===z.id && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* FORMULAIRE (Si Zone sélectionnée ou Mode LF) */}
                                {(selectedZone || mode === 'lf') ? (
                                    <div className="animate-fade-in space-y-8">
                                        {/* Types de tirs (Si Field) */}
                                        {mode === 'field' && (
                                            <div className="flex flex-wrap justify-center gap-3">
                                                {SHOT_TYPES.filter(t=>t.cat !== 'lf').map(t => (
                                                    <button key={t.id} onClick={()=>setSelectedType(t.id)} 
                                                        className={`px-4 py-3 rounded-xl border-2 flex flex-col items-center transition-all ${selectedType===t.id ? 'border-slate-800 bg-slate-800 text-white shadow-lg scale-105' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}>
                                                        <span className="text-xl mb-1">{t.icon}</span>
                                                        <span className="text-xs font-bold uppercase">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Inputs Score */}
                                        <div className="flex justify-center items-end gap-6 md:gap-12">
                                            <div className="flex flex-col items-center group">
                                                <label className="text-xs font-bold text-gray-400 mb-2 group-focus-within:text-blue-500 transition-colors">TENTÉS</label>
                                                <input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} 
                                                    className="w-28 h-20 text-5xl font-black text-center bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 focus:shadow-xl focus:scale-110 transition-all outline-none text-gray-800 placeholder-gray-200" placeholder="0"/>
                                            </div>
                                            <div className="text-4xl text-gray-300 font-light pb-4">/</div>
                                            <div className="flex flex-col items-center group">
                                                <label className="text-xs font-bold text-gray-400 mb-2 group-focus-within:text-green-500 transition-colors">MARQUÉS</label>
                                                <input type="number" value={marques} onChange={e=>setMarques(e.target.value)} 
                                                    className="w-28 h-20 text-5xl font-black text-center bg-green-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-green-500 focus:shadow-xl focus:scale-110 transition-all outline-none text-green-600 placeholder-green-100" placeholder="0"/>
                                            </div>
                                        </div>

                                        {/* Bouton Action */}
                                        <button id="validBtn" onClick={saveShot} 
                                            className={`w-full py-4 rounded-xl text-white font-black text-lg tracking-wider shadow-lg transform transition-all active:scale-95 hover:shadow-xl ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                            {editingId ? "MODIFIER LA SÉRIE" : "VALIDER LA SÉRIE"}
                                        </button>
                                        
                                        {editingId && (
                                            <button onClick={() => { setEditingId(null); setTentes(''); setMarques(''); }} className="w-full text-sm text-gray-400 hover:text-gray-600 font-semibold underline">
                                                Annuler la modification
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        👈 Sélectionnez une zone pour commencer
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. HISTORIQUE RÉCENT (MODIFIABLE) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-600 text-sm">🕒 Dernières Saisies</h3>
                                <span className="text-xs text-gray-400">{historyData.length} total</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {recentHistory.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-400">Aucune donnée récente</div>
                                ) : (
                                    recentHistory.map(item => {
                                        const pName = players.find(p=>p.id===item.playerId)?.name || 'Inconnu';
                                        const zName = item.zoneId === 'zone_lf' ? 'LF' : ZONES_TERRAIN.find(z=>z.id===item.zoneId)?.name;
                                        const tLabel = SHOT_TYPES.find(t=>t.id===item.type)?.label;
                                        const isEditing = editingId === item.id;
                                        
                                        return (
                                            <div key={item.id} className={`p-3 flex items-center justify-between hover:bg-blue-50 transition-colors ${isEditing ? 'bg-orange-50 ring-2 ring-inset ring-orange-200' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm ${item.zoneId==='zone_lf'?'bg-purple-500':'bg-blue-500'}`}>
                                                        {zName}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-800 text-sm">{pName}</div>
                                                        <div className="text-xs text-gray-500">{tLabel} • {item.date}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="font-black text-gray-800 text-lg leading-none">{item.marques}/{item.tentes}</div>
                                                        <div className={`text-[10px] font-bold ${item.tentes>0 && (item.marques/item.tentes)>=0.5 ? 'text-green-500':'text-orange-500'}`}>
                                                            {item.tentes > 0 ? Math.round((item.marques/item.tentes)*100) : 0}%
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={()=>loadForEdit(item)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Modifier">✏️</button>
                                                        <button onClick={()=>deleteRecord(item.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-lg transition" title="Supprimer">🗑️</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // --- ANALYSE ---
        function AnalysisModule({ players, historyData }) {
            // (Même logique de calcul que v3.3 mais avec un design amélioré)
            const calculateStats = () => {
                const matrix = {}; 
                const maxPerZone = {}; 

                players.forEach(p => {
                    matrix[p.id] = { 'global_arret': {tt:0, tr:0}, 'global_mouv': {tt:0, tr:0}, 'lf': {tt:0, tr:0} };
                    ZONES_TERRAIN.forEach(z => matrix[p.id][z.id] = {tt:0, tr:0});
                });

                historyData.forEach(d => {
                    if(!matrix[d.playerId]) return;
                    const type = SHOT_TYPES.find(t=>t.id === d.type);
                    if(d.zoneId === 'zone_lf') {
                        matrix[d.playerId]['lf'].tt += d.tentes;
                        matrix[d.playerId]['lf'].tr += d.marques;
                    } else if (matrix[d.playerId][d.zoneId]) {
                        matrix[d.playerId][d.zoneId].tt += d.tentes;
                        matrix[d.playerId][d.zoneId].tr += d.marques;
                        const key = type?.mouv ? 'global_mouv' : 'global_arret';
                        matrix[d.playerId][key].tt += d.tentes;
                        matrix[d.playerId][key].tr += d.marques;
                    }
                });

                Object.keys(matrix).forEach(pid => {
                    Object.keys(matrix[pid]).forEach(zid => {
                        const cell = matrix[pid][zid];
                        cell.pct = cell.tt > 0 ? (cell.tr/cell.tt)*100 : 0;
                        if(cell.tt > 0) {
                            if(!maxPerZone[zid] || cell.pct > maxPerZone[zid].pct) {
                                maxPerZone[zid] = { pct: cell.pct, playerId: pid };
                            }
                        }
                    });
                });
                return { matrix, maxPerZone };
            };

            const { matrix, maxPerZone } = calculateStats();
            const formatPct = (n) => n.toFixed(0) + '%';

            return (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="font-black text-xl text-gray-800">🏆 Leaderboard des Shooters</h2>
                        <div className="flex gap-2 text-xs">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-full"></span> Leader Zone</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-900 text-white shadow-lg">
                                    <th className="p-4 text-left sticky left-0 bg-slate-900 z-10 font-bold">Joueur</th>
                                    <th className="p-4 bg-purple-900/50 border-l border-white/10 text-purple-200">LF</th>
                                    <th className="p-4 bg-blue-900/50 border-l border-white/10 text-blue-200">Arrêt</th>
                                    <th className="p-4 bg-orange-900/50 border-l border-white/10 text-orange-200">Mouv</th>
                                    {ZONES_TERRAIN.map(z => (
                                        <th key={z.id} className="p-4 border-l border-white/10 bg-gradient-to-b from-transparent to-white/5">{z.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {players.map(p => {
                                    const stats = matrix[p.id];
                                    if(!stats) return null;
                                    return (
                                        <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="p-4 font-bold text-left sticky left-0 bg-white group-hover:bg-blue-50 transition-colors shadow-lg border-r border-gray-100 text-gray-700">{p.name}</td>
                                            
                                            <td className="p-3 bg-purple-50/30 border-l border-gray-100 font-mono text-gray-600">
                                                <div className="font-bold">{stats.lf.tr}/{stats.lf.tt}</div>
                                                <div className="text-xs text-purple-600 font-bold">{formatPct(stats.lf.pct)}</div>
                                            </td>
                                            <td className="p-3 bg-blue-50/30 border-l border-gray-100 font-mono text-gray-600">
                                                <div className="font-bold">{stats.global_arret.tr}/{stats.global_arret.tt}</div>
                                                <div className="text-xs text-blue-600 font-bold">{formatPct(stats.global_arret.pct)}</div>
                                            </td>
                                            <td className="p-3 bg-orange-50/30 border-l border-gray-100 font-mono text-gray-600">
                                                <div className="font-bold">{stats.global_mouv.tr}/{stats.global_mouv.tt}</div>
                                                <div className="text-xs text-orange-600 font-bold">{formatPct(stats.global_mouv.pct)}</div>
                                            </td>

                                            {ZONES_TERRAIN.map(z => {
                                                const s = stats[z.id];
                                                const isBest = maxPerZone[z.id]?.playerId == p.id && s.tt > 0 && maxPerZone[z.id].pct > 0;
                                                return (
                                                    <td key={z.id} className={`p-3 border-l border-gray-100 relative ${isBest ? 'bg-yellow-50' : ''}`}>
                                                        {isBest && <div className="absolute inset-0 border-2 border-yellow-400 opacity-50 pointer-events-none"></div>}
                                                        <div className={`font-bold ${isBest ? 'text-yellow-700 scale-110 transform' : 'text-gray-700'}`}>
                                                            {s.tr}/{s.tt}
                                                        </div>
                                                        <div className={`text-xs ${isBest ? 'font-black text-yellow-600' : 'text-gray-400'}`}>
                                                            {s.tt > 0 ? formatPct(s.pct) : '-'}
                                                        </div>
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
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
