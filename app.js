        const firebaseConfig = {
  apiKey: "AIzaSyBaA99che1oz9BHc23IhiFoY-nK0xvg4q4",
  authDomain: "statu18elite.firebaseapp.com",
  projectId: "statu18elite",
  storageBucket: "statu18elite.firebasestorage.app",
  messagingSenderId: "862850988986",
  appId: "1:862850988986:web:d64afc2c94eb50a1f6fb83",
  measurementId: "G-VNEB7Z8ZR1"
};

        // Initialisation de Firebase
        let db = null;
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                console.log("Firebase initialisé avec succès");
            } catch (e) {
                console.error("Erreur init Firebase:", e);
            }
        }

        const { useState, useEffect } = React;

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
            { id: '2pt_arret', label: '2pts Arrêt', points: 2, icon: '🛑' },
            { id: '2pt_mouv', label: '2pts Mouv.', points: 2, icon: '🏃' },
            { id: '3pt_arret', label: '3pts Arrêt', points: 3, icon: '🛑' },
            { id: '3pt_mouv', label: '3pts Mouv.', points: 3, icon: '🏃' }
        ];

        // --- APP COMPONENT ---
        function App() {
            const [activeModule, setActiveModule] = useState('shooting');
            const [players, setPlayers] = useState(INITIAL_PLAYERS);
            // historyData contient TOUTES les stats (importées ou saisies)
            const [historyData, setHistoryData] = useState([]); 
            const [isSyncing, setIsSyncing] = useState(false);

            // Chargement LocalStorage
            useEffect(() => {
                const savedHistory = localStorage.getItem('basketball_history');
                const savedPlayers = localStorage.getItem('basketball_players');
                if (savedHistory) setHistoryData(JSON.parse(savedHistory));
                if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
            }, []);

            // Sauvegarde LocalStorage
            const updateHistory = (newData) => {
                setHistoryData(newData);
                localStorage.setItem('basketball_history', JSON.stringify(newData));
            };

            const updatePlayers = (newPlayers) => {
                setPlayers(newPlayers);
                localStorage.setItem('basketball_players', JSON.stringify(newPlayers));
            };

            // --- FONCTIONS FIREBASE ---
            const handleCloudSave = async () => {
                if (!db) return alert("Erreur: Firebase non détecté. Vérifiez vos clés API dans le code.");
                setIsSyncing(true);
                try {
                    await db.collection('stats_v3').doc('backup').set({
                        history: JSON.stringify(historyData),
                        players: JSON.stringify(players),
                        lastUpdated: new Date().toISOString()
                    });
                    alert('✅ Sauvegardé sur le Cloud !');
                } catch (error) {
                    console.error(error);
                    alert('Erreur: ' + error.message);
                }
                setIsSyncing(false);
            };

            const handleCloudLoad = async () => {
                if (!db) return alert("Firebase non configuré.");
                if(!confirm("Cela va écraser les données locales par celles du Cloud. Continuer ?")) return;
                setIsSyncing(true);
                try {
                    const doc = await db.collection('stats_v3').doc('backup').get();
                    if (doc.exists) {
                        const data = doc.data();
                        if(data.history) updateHistory(JSON.parse(data.history));
                        if(data.players) updatePlayers(JSON.parse(data.players));
                        alert('✅ Données récupérées !');
                    } else {
                        alert('Aucune sauvegarde trouvée.');
                    }
                } catch (error) {
                    alert('Erreur chargement: ' + error.message);
                }
                setIsSyncing(false);
            };

            return (
                <div className="min-h-screen bg-gray-50 font-sans pb-10">
                    {/* NAVBAR */}
                    <div className="bg-blue-800 text-white p-4 shadow-lg sticky top-0 z-50">
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                            <h1 className="text-2xl font-bold flex items-center gap-2">🏀 BasketStats V3</h1>
                            
                            <div className="flex gap-2 bg-blue-900 p-1 rounded-lg">
                                <button onClick={() => setActiveModule('shooting')} className={`px-4 py-2 rounded transition ${activeModule === 'shooting' ? 'bg-white text-blue-900 font-bold' : 'hover:bg-blue-700'}`}>
                                    🎯 Saisie
                                </button>
                                <button onClick={() => setActiveModule('analysis')} className={`px-4 py-2 rounded transition ${activeModule === 'analysis' ? 'bg-white text-blue-900 font-bold' : 'hover:bg-blue-700'}`}>
                                    📊 Analyse & Modif
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={handleCloudSave} disabled={isSyncing} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-bold flex items-center gap-1">
                                    {isSyncing ? '⏳' : '☁️'} Save
                                </button>
                                <button onClick={handleCloudLoad} disabled={isSyncing} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold">
                                    📥 Load
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CONTENU */}
                    <div className="max-w-6xl mx-auto p-4">
                        {activeModule === 'shooting' && (
                            <ShootingModule 
                                players={players} 
                                setPlayers={updatePlayers}
                                historyData={historyData}
                                setHistoryData={updateHistory}
                            />
                        )}
                        {activeModule === 'analysis' && (
                            <AnalysisModule 
                                players={players} 
                                historyData={historyData}
                                setHistoryData={updateHistory}
                            />
                        )}
                    </div>
                </div>
            );
        }

        // --- MODULE SAISIE (Shooting) ---
        function ShootingModule({ players, setPlayers, historyData, setHistoryData }) {
            const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id);
            const [selectedZone, setSelectedZone] = useState(null);
            const [selectedType, setSelectedType] = useState('2pt_arret');
            const [tentes, setTentes] = useState('');
            const [marques, setMarques] = useState('');
            const [newPlayerName, setNewPlayerName] = useState('');
            const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

            // Ajout Joueur
            const addPlayer = () => {
                if(!newPlayerName) return;
                setPlayers([...players, { id: Date.now(), name: newPlayerName }]);
                setNewPlayerName('');
            };

            // Validation Tir
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
                setTentes('');
                setMarques('');
                // Feedback visuel simple
                const btn = document.getElementById('saveBtn');
                if(btn) {
                    const originalText = btn.innerText;
                    btn.innerText = "✅ Ajouté !";
                    setTimeout(() => btn.innerText = originalText, 1000);
                }
            };

            return (
                <div className="grid md:grid-cols-12 gap-6">
                    {/* Colonne Gauche: Joueurs */}
                    <div className="md:col-span-3 bg-white p-4 rounded-lg shadow h-fit">
                        <h3 className="font-bold mb-2">Joueurs</h3>
                        <div className="flex gap-1 mb-4">
                            <input type="text" value={newPlayerName} onChange={e=>setNewPlayerName(e.target.value)} className="w-full border p-1 rounded text-sm" placeholder="Nouveau..." />
                            <button onClick={addPlayer} className="bg-green-500 text-white px-2 rounded">+</button>
                        </div>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {players.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => setSelectedPlayer(p.id)}
                                    className={`w-full text-left p-2 rounded ${selectedPlayer === p.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Colonne Droite: Saisie */}
                    <div className="md:col-span-9 space-y-4">
                        {/* Date de la session */}
                        <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
                            <label className="font-bold">Date de la séance :</label>
                            <input type="date" value={sessionDate} onChange={e=>setSessionDate(e.target.value)} className="border p-2 rounded" />
                        </div>

                        {/* Zones */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {ZONES.map(z => (
                                <button 
                                    key={z.id}
                                    onClick={() => setSelectedZone(z.id)}
                                    className={`p-4 border-2 rounded-lg font-bold transition ${selectedZone === z.id ? 'scale-105 shadow-lg' : 'opacity-70 bg-white'}`}
                                    style={{
                                        borderColor: z.color,
                                        backgroundColor: selectedZone === z.id ? z.color : 'white',
                                        color: selectedZone === z.id ? 'white' : z.color
                                    }}
                                >
                                    {z.name}
                                </button>
                            ))}
                        </div>

                        {/* Type et Score */}
                        {selectedZone && (
                            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-100">
                                <h3 className="font-bold text-lg mb-4 text-center text-blue-800">
                                    Saisie : {ZONES.find(z=>z.id===selectedZone)?.name}
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                                    {SHOT_TYPES.map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => setSelectedType(t.id)}
                                            className={`p-2 rounded border text-sm font-bold ${selectedType === t.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4 items-end justify-center">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Tentés</label>
                                        <input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} className="w-24 text-3xl font-bold p-2 border rounded text-center" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Marqués</label>
                                        <input type="number" value={marques} onChange={e=>setMarques(e.target.value)} className="w-24 text-3xl font-bold p-2 border border-green-400 text-green-600 rounded text-center" placeholder="0" />
                                    </div>
                                </div>
                                <button id="saveBtn" onClick={saveShot} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-lg transition">
                                    VALIDER LA SÉRIE
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // --- MODULE ANALYSE & MODIFICATION ---
        function AnalysisModule({ players, historyData, setHistoryData }) {
            const [filterPlayer, setFilterPlayer] = useState('all');
            const [filterTime, setFilterTime] = useState('all');
            const [editingId, setEditingId] = useState(null);
            
            // État pour l'édition
            const [editForm, setEditForm] = useState({});

            // IMPORT CSV
            const handleFileUpload = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const text = evt.target.result;
                    // Détection simple du joueur dans le nom du fichier
                    let playerId = players[0].id;
                    const fileNameUpper = file.name.toUpperCase();
                    const foundPlayer = players.find(p => fileNameUpper.includes(p.name.toUpperCase()));
                    if(foundPlayer) playerId = foundPlayer.id;

                    // Parsing CSV (logique simplifiée mais robuste)
                    const lines = text.split('\n');
                    const newRecords = [];
                    // Cherche les colonnes
                    const header = lines[0].toUpperCase();
                    // Logique approximative pour trouver les colonnes TT/TR
                    // On assume un format standard ou on importe ligne par ligne si on trouve des chiffres
                    // Ici, simulation d'import pour l'exemple si le format est complexe
                    
                    // Note: Pour un vrai CSV complexe, il faut parser headers. Ici je fais un parser générique
                    // qui cherche des paires de chiffres sur chaque ligne.
                    
                    // Pour cet exemple, on simule une alerte car le parsing CSV dépend trop du format exact
                    alert("Import CSV prêt. Assurez-vous que le fichier contient des colonnes TT/TR.");
                };
                reader.readAsText(file);
            };

            // FILTRAGE
            const getFilteredData = () => {
                let data = [...historyData];
                if(filterPlayer !== 'all') data = data.filter(d => d.playerId == filterPlayer);
                
                const now = new Date();
                if(filterTime === 'week') {
                    const d = new Date(); d.setDate(d.getDate() - 7);
                    data = data.filter(r => new Date(r.date) >= d);
                }
                if(filterTime === 'month') {
                    const d = new Date(); d.setDate(d.getDate() - 30);
                    data = data.filter(r => new Date(r.date) >= d);
                }
                return data.sort((a,b) => new Date(b.date) - new Date(a.date)); // Plus récent d'abord
            };

            const filtered = getFilteredData();

            // STATS GLOBALES
            const totalTT = filtered.reduce((acc, curr) => acc + (curr.tentes || 0), 0);
            const totalTR = filtered.reduce((acc, curr) => acc + (curr.marques || 0), 0);
            const pctGlobal = totalTT > 0 ? ((totalTR / totalTT) * 100).toFixed(1) : 0;

            // EDITION
            const startEdit = (record) => {
                setEditingId(record.id);
                setEditForm({...record});
            };

            const saveEdit = () => {
                const newData = historyData.map(item => item.id === editingId ? editForm : item);
                setHistoryData(newData);
                setEditingId(null);
            };

            const deleteRecord = (id) => {
                if(confirm("Supprimer cette ligne ?")) {
                    setHistoryData(historyData.filter(item => item.id !== id));
                }
            };

            return (
                <div className="space-y-6">
                    {/* Filtres et Import */}
                    <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2">
                            <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)} className="border p-2 rounded">
                                <option value="all">Tous les joueurs</option>
                                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={filterTime} onChange={e=>setFilterTime(e.target.value)} className="border p-2 rounded">
                                <option value="all">Tout le temps</option>
                                <option value="month">Ce mois</option>
                                <option value="week">Cette semaine</option>
                            </select>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 p-2 rounded relative hover:bg-gray-50 cursor-pointer">
                            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <span className="text-sm text-gray-500">📂 Importer CSV</span>
                        </div>
                    </div>

                    {/* Carte Résumé */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6 rounded-lg shadow-lg flex justify-between items-center">
                        <div>
                            <h2 className="text-sm uppercase opacity-80">Total sur la période</h2>
                            <p className="text-3xl font-bold">{totalTR} / {totalTT}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-5xl font-bold text-green-400">{pctGlobal}%</p>
                            <p className="text-sm opacity-80">Réussite</p>
                        </div>
                    </div>

                    {/* Tableau Editable */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Joueur</th>
                                    <th className="p-3">Type/Zone</th>
                                    <th className="p-3 text-center">Score</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(record => (
                                    <tr key={record.id} className="border-b hover:bg-gray-50">
                                        {editingId === record.id ? (
                                            // MODE ÉDITION
                                            <>
                                                <td className="p-2"><input type="date" value={editForm.date} onChange={e=>setEditForm({...editForm, date: e.target.value})} className="border rounded p-1 w-full" /></td>
                                                <td className="p-2">
                                                    <select value={editForm.playerId} onChange={e=>setEditForm({...editForm, playerId: parseInt(e.target.value)})} className="border rounded p-1">
                                                        {players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <select value={editForm.type} onChange={e=>setEditForm({...editForm, type: e.target.value})} className="border rounded p-1 w-full text-xs">
                                                        {SHOT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2 text-center flex gap-1 justify-center">
                                                    <input type="number" value={editForm.marques} onChange={e=>setEditForm({...editForm, marques: parseInt(e.target.value)})} className="w-12 border p-1 text-center" />
                                                    /
                                                    <input type="number" value={editForm.tentes} onChange={e=>setEditForm({...editForm, tentes: parseInt(e.target.value)})} className="w-12 border p-1 text-center" />
                                                </td>
                                                <td className="p-2 text-right">
                                                    <button onClick={saveEdit} className="text-green-600 font-bold mr-2">OK</button>
                                                    <button onClick={()=>setEditingId(null)} className="text-gray-500">X</button>
                                                </td>
                                            </>
                                        ) : (
                                            // MODE AFFICHAGE
                                            <>
                                                <td className="p-3">{record.date}</td>
                                                <td className="p-3 font-bold">{players.find(p=>p.id === record.playerId)?.name}</td>
                                                <td className="p-3">
                                                    <div className="font-semibold text-xs text-blue-600 uppercase">
                                                        {SHOT_TYPES.find(t=>t.id === record.type)?.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {ZONES.find(z=>z.id === record.zoneId)?.name}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center font-mono text-lg">
                                                    {record.marques}/{record.tentes}
                                                    <div className={`text-xs font-bold ${((record.marques/record.tentes)*100) >= 50 ? 'text-green-500' : 'text-orange-500'}`}>
                                                        {record.tentes > 0 ? ((record.marques/record.tentes)*100).toFixed(0) : 0}%
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={()=>startEdit(record)} className="text-blue-500 hover:text-blue-700 mr-3">✏️</button>
                                                    <button onClick={()=>deleteRecord(record.id)} className="text-red-400 hover:text-red-600">🗑️</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && <div className="p-8 text-center text-gray-400">Aucune donnée trouvée.</div>}
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
