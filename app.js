        const firebaseConfig = {
  apiKey: "AIzaSyBaA99che1oz9BHc23IhiFoY-nK0xvg4q4",
  authDomain: "statu18elite.firebaseapp.com",
  projectId: "statu18elite",
  storageBucket: "statu18elite.firebasestorage.app",
  messagingSenderId: "862850988986",
  appId: "1:862850988986:web:d64afc2c94eb50a1f6fb83",
  measurementId: "G-VNEB7Z8ZR1"
};

let db = null;
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                console.log("Firebase connecté");
            } catch (e) {
                console.error("Erreur Firebase:", e);
            }
        }

        const { useState, useEffect, useMemo } = React;

        // --- CONSTANTES ---
        const ZONES = [
            { id: 'gauche_0', name: 'Gauche 0°', color: '#3b82f6' },
            { id: 'droit_0', name: 'Droit 0°', color: '#ec4899' },
            { id: 'gauche_45', name: 'Gauche 45°', color: '#10b981' },
            { id: 'droit_45', name: 'Droit 45°', color: '#f59e0b' },
            { id: 'gauche_70', name: 'Gauche 70°', color: '#06b6d4' },
            { id: 'droit_70', name: 'Droit 70°', color: '#ef4444' },
            { id: 'axe', name: 'Axe', color: '#6366f1' }
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

        // --- APP PRINCIPALE ---
        function App() {
            const [activeModule, setActiveModule] = useState('shooting');
            const [players, setPlayers] = useState(INITIAL_PLAYERS);
            const [historyData, setHistoryData] = useState([]); 
            const [isSyncing, setIsSyncing] = useState(false);

            useEffect(() => {
                const savedHistory = localStorage.getItem('basketball_history');
                const savedPlayers = localStorage.getItem('basketball_players');
                if (savedHistory) setHistoryData(JSON.parse(savedHistory));
                if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
            }, []);

            const updateHistory = (newData) => {
                setHistoryData(newData);
                localStorage.setItem('basketball_history', JSON.stringify(newData));
            };

            const updatePlayers = (newPlayers) => {
                setPlayers(newPlayers);
                localStorage.setItem('basketball_players', JSON.stringify(newPlayers));
            };

            // Sauvegarde Cloud
            const handleCloudSave = async () => {
                if (!db) return alert("Firebase non configuré.");
                setIsSyncing(true);
                try {
                    await db.collection('stats_v3').doc('backup').set({
                        history: JSON.stringify(historyData),
                        players: JSON.stringify(players),
                        lastUpdated: new Date().toISOString()
                    });
                    alert('✅ Sauvegardé !');
                } catch (error) { alert('Erreur: ' + error.message); }
                setIsSyncing(false);
            };

            const handleCloudLoad = async () => {
                if (!db) return alert("Firebase non configuré.");
                if(!confirm("Écraser les données locales ?")) return;
                setIsSyncing(true);
                try {
                    const doc = await db.collection('stats_v3').doc('backup').get();
                    if (doc.exists) {
                        const data = doc.data();
                        if(data.history) updateHistory(JSON.parse(data.history));
                        if(data.players) updatePlayers(JSON.parse(data.players));
                        alert('✅ Données récupérées !');
                    }
                } catch (error) { alert('Erreur: ' + error.message); }
                setIsSyncing(false);
            };

            return (
                <div className="min-h-screen bg-gray-50 font-sans pb-10">
                    <div className="bg-blue-800 text-white p-4 shadow-lg sticky top-0 z-50">
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                            <h1 className="text-2xl font-bold flex items-center gap-2">🏀 BasketStats V3.1</h1>
                            <div className="flex gap-2 bg-blue-900 p-1 rounded-lg">
                                <button onClick={() => setActiveModule('shooting')} className={`px-4 py-2 rounded transition ${activeModule === 'shooting' ? 'bg-white text-blue-900 font-bold' : 'hover:bg-blue-700'}`}>🎯 Saisie</button>
                                <button onClick={() => setActiveModule('analysis')} className={`px-4 py-2 rounded transition ${activeModule === 'analysis' ? 'bg-white text-blue-900 font-bold' : 'hover:bg-blue-700'}`}>📊 Analyse</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleCloudSave} disabled={isSyncing} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-bold">{isSyncing ? '⏳' : '☁️'} Save</button>
                                <button onClick={handleCloudLoad} disabled={isSyncing} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold">📥 Load</button>
                            </div>
                        </div>
                    </div>
                    <div className="max-w-6xl mx-auto p-4">
                        {activeModule === 'shooting' && <ShootingModule players={players} setPlayers={updatePlayers} historyData={historyData} setHistoryData={updateHistory} />}
                        {activeModule === 'analysis' && <AnalysisModule players={players} historyData={historyData} setHistoryData={updateHistory} />}
                    </div>
                </div>
            );
        }

        // --- MODULE SAISIE ---
        function ShootingModule({ players, setPlayers, historyData, setHistoryData }) {
            const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id);
            const [selectedZone, setSelectedZone] = useState(null);
            const [selectedType, setSelectedType] = useState('2pt_arret');
            const [tentes, setTentes] = useState('');
            const [marques, setMarques] = useState('');
            const [newPlayerName, setNewPlayerName] = useState('');
            const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
            const [showTable, setShowTable] = useState(false);

            // Calcul des stats pour les boutons de zone
            const getZoneStats = (zoneId) => {
                const stats = historyData
                    .filter(d => d.playerId === selectedPlayer && d.zoneId === zoneId)
                    .reduce((acc, curr) => ({ tt: acc.tt + curr.tentes, tr: acc.tr + curr.marques }), { tt: 0, tr: 0 });
                return stats;
            };

            const addPlayer = () => {
                if(!newPlayerName) return;
                setPlayers([...players, { id: Date.now(), name: newPlayerName }]);
                setNewPlayerName('');
            };

            const saveShot = () => {
                const tt = parseInt(tentes);
                const tr = parseInt(marques);
                if(!selectedPlayer || !selectedZone || isNaN(tt) || tt === 0) return alert("Données incomplètes");
                if(tr > tt) return alert("Marqués > Tentés impossible");

                const newRecord = {
                    id: Date.now(),
                    date: sessionDate,
                    playerId: parseInt(selectedPlayer),
                    zoneId: selectedZone,
                    type: selectedType,
                    tentes: tt,
                    marques: tr
                };

                setHistoryData([...historyData, newRecord]);
                setTentes(''); setMarques('');
            };

            if (showTable) {
                return (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">Tableau Global</h2>
                            <button onClick={() => setShowTable(false)} className="px-4 py-2 bg-gray-600 text-white rounded">Retour Saisie</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2">Joueur</th>
                                        {ZONES.map(z => <th key={z.id} className="border p-2" style={{color: z.color}}>{z.name}</th>)}
                                        <th className="border p-2 bg-gray-200">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map(p => {
                                        let pTotT = 0, pTotM = 0;
                                        return (
                                            <tr key={p.id}>
                                                <td className="border p-2 font-bold">{p.name}</td>
                                                {ZONES.map(z => {
                                                    const s = historyData.filter(d => d.playerId === p.id && d.zoneId === z.id)
                                                        .reduce((acc, curr) => ({ t: acc.t + curr.tentes, m: acc.m + curr.marques }), { t: 0, m: 0 });
                                                    pTotT += s.t; pTotM += s.m;
                                                    return (
                                                        <td key={z.id} className="border p-2 text-center">
                                                            <div>{s.m}/{s.t}</div>
                                                            <div className="text-xs text-gray-500">{s.t > 0 ? Math.round((s.m/s.t)*100) : '-'}%</div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="border p-2 text-center font-bold bg-gray-50">
                                                    {pTotM}/{pTotT} ({pTotT > 0 ? Math.round((pTotM/pTotT)*100) : 0}%)
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }

            return (
                <div className="grid md:grid-cols-12 gap-6">
                    {/* Liste Joueurs */}
                    <div className="md:col-span-3 bg-white p-4 rounded-lg shadow h-fit">
                        <div className="flex gap-1 mb-4">
                            <input type="text" value={newPlayerName} onChange={e=>setNewPlayerName(e.target.value)} className="w-full border p-1 rounded text-sm" placeholder="Nouveau..." />
                            <button onClick={addPlayer} className="bg-green-500 text-white px-2 rounded">+</button>
                        </div>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {players.map(p => (
                                <button key={p.id} onClick={() => setSelectedPlayer(p.id)} className={`w-full text-left p-2 rounded flex justify-between ${selectedPlayer === p.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                                    <span>{p.name}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowTable(true)} className="w-full mt-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700">👀 Voir Tableau Global</button>
                    </div>

                    {/* Zone Saisie */}
                    <div className="md:col-span-9 space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
                            <label className="font-bold">Date :</label>
                            <input type="date" value={sessionDate} onChange={e=>setSessionDate(e.target.value)} className="border p-2 rounded" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {ZONES.map(z => {
                                const stats = getZoneStats(z.id);
                                const pct = stats.tt > 0 ? Math.round((stats.tr / stats.tt) * 100) : 0;
                                return (
                                    <button key={z.id} onClick={() => setSelectedZone(z.id)} 
                                        className={`p-3 border-2 rounded-lg transition relative overflow-hidden ${selectedZone === z.id ? 'scale-105 shadow-xl' : 'opacity-80 bg-white'}`}
                                        style={{ borderColor: z.color, backgroundColor: selectedZone === z.id ? z.color : 'white' }}>
                                        <div className={`font-bold ${selectedZone === z.id ? 'text-white' : 'text-gray-800'}`}>{z.name}</div>
                                        <div className={`text-sm ${selectedZone === z.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {stats.tr}/{stats.tt} <span className="font-bold">({pct}%)</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedZone && (
                            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-100 animate-fade-in">
                                <h3 className="font-bold text-lg mb-4 text-center text-blue-800">
                                    Saisie : {ZONES.find(z=>z.id===selectedZone)?.name}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                                    {SHOT_TYPES.map(t => (
                                        <button key={t.id} onClick={() => setSelectedType(t.id)} className={`p-2 rounded border text-sm font-bold flex flex-col items-center justify-center ${selectedType === t.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            <span className="text-xl">{t.icon}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-4 items-end justify-center">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase">Tentés</label><input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} className="w-24 text-3xl font-bold p-2 border rounded text-center" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase">Marqués</label><input type="number" value={marques} onChange={e=>setMarques(e.target.value)} className="w-24 text-3xl font-bold p-2 border border-green-400 text-green-600 rounded text-center" /></div>
                                </div>
                                <button onClick={saveShot} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-lg transition">VALIDER</button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // --- MODULE ANALYSE ---
        function AnalysisModule({ players, historyData, setHistoryData }) {
            const [filterPlayer, setFilterPlayer] = useState('all');
            const [filterTime, setFilterTime] = useState('all');
            const [editingId, setEditingId] = useState(null);
            const [editForm, setEditForm] = useState({});

            const getFilteredData = () => {
                let data = [...historyData];
                if(filterPlayer !== 'all') data = data.filter(d => d.playerId == filterPlayer);
                const now = new Date();
                if(filterTime === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); data = data.filter(r => new Date(r.date) >= d); }
                if(filterTime === 'month') { const d = new Date(); d.setDate(d.getDate() - 30); data = data.filter(r => new Date(r.date) >= d); }
                return data.sort((a,b) => new Date(b.date) - new Date(a.date));
            };

            const filtered = getFilteredData();
            
            // Calcul du Résumé par Catégorie
            const summary = {
                '2pt': { tt: 0, tr: 0 },
                '3pt': { tt: 0, tr: 0 },
                'arret': { tt: 0, tr: 0 },
                'mouv': { tt: 0, tr: 0 },
                'lf': { tt: 0, tr: 0 }
            };

            filtered.forEach(d => {
                const type = SHOT_TYPES.find(t => t.id === d.type);
                if (type) {
                    if (type.cat === 'lf') {
                        summary.lf.tt += d.tentes; summary.lf.tr += d.marques;
                    } else {
                        // Par points
                        if (summary[type.cat]) { summary[type.cat].tt += d.tentes; summary[type.cat].tr += d.marques; }
                        // Par mouvement
                        const mouvKey = type.mouv ? 'mouv' : 'arret';
                        summary[mouvKey].tt += d.tentes; summary[mouvKey].tr += d.marques;
                    }
                }
            });

            const getPct = (tr, tt) => tt > 0 ? ((tr/tt)*100).toFixed(1) : 0;

            // Fonctions d'édition
            const startEdit = (r) => { setEditingId(r.id); setEditForm({...r}); };
            const saveEdit = () => { setHistoryData(historyData.map(i => i.id === editingId ? editForm : i)); setEditingId(null); };
            const deleteRecord = (id) => { if(confirm("Supprimer ?")) setHistoryData(historyData.filter(i => i.id !== id)); };

            return (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow flex gap-4">
                        <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)} className="border p-2 rounded bg-gray-50 font-bold">
                            <option value="all">Tous les joueurs</option>
                            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={filterTime} onChange={e=>setFilterTime(e.target.value)} className="border p-2 rounded bg-gray-50">
                            <option value="all">Tout le temps</option>
                            <option value="month">Ce mois</option>
                            <option value="week">Cette semaine</option>
                        </select>
                    </div>

                    {/* TABLEAU RÉCAPITULATIF DEMANDÉ */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">📊 Récapitulatif par Catégorie</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                            {[
                                { k: '2pt', l: '2 Points', c: 'bg-blue-100 text-blue-800' },
                                { k: '3pt', l: '3 Points', c: 'bg-indigo-100 text-indigo-800' },
                                { k: 'arret', l: 'Tirs Arrêt', c: 'bg-green-100 text-green-800' },
                                { k: 'mouv', l: 'Tirs Mouv.', c: 'bg-orange-100 text-orange-800' },
                                { k: 'lf', l: 'Lancers Francs', c: 'bg-yellow-100 text-yellow-800' }
                            ].map(cat => (
                                <div key={cat.k} className={`p-4 rounded-lg ${cat.c}`}>
                                    <div className="text-xs font-bold uppercase opacity-70">{cat.l}</div>
                                    <div className="text-2xl font-bold">{summary[cat.k].tr}/{summary[cat.k].tt}</div>
                                    <div className="text-sm font-bold">{getPct(summary[cat.k].tr, summary[cat.k].tt)}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TABLEAU DÉTAILLÉ AVEC ÉDITION */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">📋 Détail des Séries (Modifiable)</div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Joueur</th>
                                    <th className="p-3">Détail</th>
                                    <th className="p-3 text-center">Score</th>
                                    <th className="p-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <tr key={r.id} className="border-b hover:bg-gray-50">
                                        {editingId === r.id ? (
                                            <>
                                                <td className="p-2"><input type="date" value={editForm.date} onChange={e=>setEditForm({...editForm, date: e.target.value})} className="border rounded p-1" /></td>
                                                <td className="p-2"><select value={editForm.playerId} onChange={e=>setEditForm({...editForm, playerId: parseInt(e.target.value)})} className="border rounded p-1">{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                                                <td className="p-2"><select value={editForm.type} onChange={e=>setEditForm({...editForm, type: e.target.value})} className="border rounded p-1 text-xs">{SHOT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></td>
                                                <td className="p-2 text-center"><input type="number" value={editForm.marques} onChange={e=>setEditForm({...editForm, marques: parseInt(e.target.value)})} className="w-10 border text-center"/> / <input type="number" value={editForm.tentes} onChange={e=>setEditForm({...editForm, tentes: parseInt(e.target.value)})} className="w-10 border text-center"/></td>
                                                <td className="p-2 text-right"><button onClick={saveEdit} className="text-green-600 font-bold mr-2">OK</button></td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-3 text-gray-600">{r.date}</td>
                                                <td className="p-3 font-bold">{players.find(p=>p.id === r.playerId)?.name}</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-1 bg-gray-200 rounded text-xs font-bold mr-1">{SHOT_TYPES.find(t=>t.id === r.type)?.label}</span>
                                                    <span className="text-xs text-gray-500">{ZONES.find(z=>z.id === r.zoneId)?.name}</span>
                                                </td>
                                                <td className="p-3 text-center font-mono font-bold">
                                                    {r.marques}/{r.tentes} <span className={((r.marques/r.tentes)>=0.5 ? 'text-green-500' : 'text-orange-500') + " text-xs ml-1"}>{Math.round((r.marques/r.tentes)*100)}%</span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={()=>startEdit(r)} className="text-blue-500 hover:text-blue-700 mr-2">✏️</button>
                                                    <button onClick={()=>deleteRecord(r.id)} className="text-red-400 hover:text-red-600">🗑️</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
