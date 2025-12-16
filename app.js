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

        // --- MAPPING ZONES ---
        const ZONES_DISPLAY = [
            { key: '0G', name: '0° G', color: 'from-blue-500 to-blue-600', id:'gauche_0' },
            { key: '45G', name: '45° G', color: 'from-emerald-400 to-emerald-600', id:'gauche_45' },
            { key: '70G', name: '70° G', color: 'from-cyan-400 to-cyan-600', id:'gauche_70' },
            { key: 'Axe', name: 'Axe', color: 'from-indigo-500 to-indigo-600', id:'axe' },
            { key: '70D', name: '70° D', color: 'from-red-500 to-red-600', id:'droit_70' },
            { key: '45D', name: '45° D', color: 'from-amber-400 to-amber-600', id:'droit_45' },
            { key: '0D', name: '0° D', color: 'from-pink-500 to-pink-600', id:'droit_0' }
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
                    const docRef = db.collection('stats_v3').doc('backup_v5');
                    if(mode === 'save') {
                        await docRef.set({ history: JSON.stringify(historyData), players: JSON.stringify(players), last: new Date().toISOString() });
                        alert("✅ Sauvegardé !");
                    } else {
                        const doc = await docRef.get();
                        if(doc.exists) {
                            const d = doc.data();
                            updateData('basketball_history', JSON.parse(d.history), setHistoryData);
                            updateData('basketball_players', JSON.parse(d.players), setPlayers);
                            alert("✅ Chargé !");
                        }
                    }
                } catch (e) { alert("Erreur: " + e.message); }
                setIsSyncing(false);
            };

            return (
                <div className="min-h-screen pb-12 bg-gradient-to-br from-slate-50 to-slate-200">
                    <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
                            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-2">
                                🏀 StatElite <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border">v5.1 Full</span>
                            </h1>
                            <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                                <button onClick={()=>setActiveModule('shooting')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeModule==='shooting'?'bg-white text-blue-600 shadow':'text-gray-500'}`}>🎯 Saisie</button>
                                <button onClick={()=>setActiveModule('analysis')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeModule==='analysis'?'bg-white text-blue-600 shadow':'text-gray-500'}`}>📊 Analyse</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={()=>handleCloud('save')} disabled={isSyncing} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition">{isSyncing?'...':'☁️ Save'}</button>
                                <button onClick={()=>handleCloud('load')} disabled={isSyncing} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition">📥</button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
                        {activeModule === 'shooting' && <ShootingModule players={players} setPlayers={(p)=>updateData('basketball_players',p,setPlayers)} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
                        {activeModule === 'analysis' && <AnalysisModule players={players} historyData={historyData} setHistoryData={(h)=>updateData('basketball_history',h,setHistoryData)} />}
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
                    newData.push({
                        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                        playerId: parseInt(selectedPlayer),
                        date: date,
                        zones: { Distance: distance, types: typeTir, [selectedZoneKey]: { made: tr, attempted: tt } }
                    });
                }
                setHistoryData(newData);
                setTentes(''); setMarques('');
                const btn = document.getElementById('validBtn');
                if(btn) { btn.innerText = "✅ ENREGISTRÉ"; setTimeout(()=>btn.innerText = "VALIDER", 800); }
            };

            const addPlayer = () => { if(newPlayer.trim()) { setPlayers([...players, {id:Date.now(), name: newPlayer}]); setNewPlayer(''); } };

            return (
                <div className="grid lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <div className="flex gap-2 mb-3"><input value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} className="bg-gray-50 border p-2 w-full rounded" placeholder="Nouveau..."/><button onClick={addPlayer} className="bg-blue-600 text-white rounded px-3">+</button></div>
                            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                                {players.map(p => (
                                    <button key={p.id} onClick={()=>setSelectedPlayer(p.id)} className={`w-full text-left p-3 rounded-xl transition flex justify-between ${selectedPlayer===p.id ? 'bg-slate-800 text-white':'hover:bg-gray-50'}`}>
                                        <span>{p.name}</span>{selectedPlayer===p.id && <span>●</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-9 space-y-6">
                        <div className="bg-white p-2 rounded-2xl shadow-sm border flex justify-between items-center">
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button onClick={()=>setMode('field')} className={`px-6 py-2 rounded-lg font-bold transition ${mode==='field'?'bg-white text-blue-600 shadow':'text-gray-500'}`}>Tirs Champ</button>
                                <button onClick={()=>setMode('lf')} className={`px-6 py-2 rounded-lg font-bold transition ${mode==='lf'?'bg-white text-purple-600 shadow':'text-gray-500'}`}>Lancers Francs</button>
                            </div>
                            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-gray-50 font-bold text-gray-600 rounded-xl px-4 py-2 outline-none"/>
                        </div>
                        <div className={`bg-white rounded-3xl shadow-xl border-4 p-6 ${mode==='lf'?'border-purple-100':'border-blue-100'}`}>
                            {mode === 'field' && (
                                <div className="flex justify-center gap-4 mb-6">
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button onClick={()=>setDistance('2pt')} className={`px-4 py-1 rounded font-bold ${distance==='2pt'?'bg-white shadow text-blue-600':'text-gray-400'}`}>2 Pts</button>
                                        <button onClick={()=>setDistance('3pt')} className={`px-4 py-1 rounded font-bold ${distance==='3pt'?'bg-white shadow text-purple-600':'text-gray-400'}`}>3 Pts</button>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button onClick={()=>setTypeTir('arrêt')} className={`px-4 py-1 rounded font-bold ${typeTir==='arrêt'?'bg-white shadow text-green-600':'text-gray-400'}`}>Arrêt 🛑</button>
                                        <button onClick={()=>setTypeTir('mouvement')} className={`px-4 py-1 rounded font-bold ${typeTir==='mouvement'?'bg-white shadow text-orange-600':'text-gray-400'}`}>Mouv 🏃</button>
                                    </div>
                                </div>
                            )}
                            {mode === 'field' && (
                                <div className="grid grid-cols-4 gap-3 mb-8">
                                    {ZONES_DISPLAY.map(z => (
                                        <button key={z.key} onClick={()=>setSelectedZoneKey(z.key)} className={`py-4 rounded-xl border-2 transition relative overflow-hidden ${selectedZoneKey===z.key ? `border-transparent bg-gradient-to-br ${z.color} text-white shadow-lg scale-105` : 'border-gray-100 text-gray-500 hover:border-blue-200'}`}>
                                            <span className="relative z-10 font-bold">{z.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {(selectedZoneKey || mode === 'lf') ? (
                                <div className="animate-fade-in">
                                    <div className="text-center mb-4 text-sm uppercase font-bold text-gray-400 tracking-widest">Saisie : {mode==='lf' ? 'Lancer Franc' : `${distance} ${typeTir} - Zone ${selectedZoneKey}`}</div>
                                    <div className="flex justify-center items-end gap-8 mb-6">
                                        <div className="text-center"><label className="text-xs font-bold text-gray-400">TENTÉS</label><input type="number" value={tentes} onChange={e=>setTentes(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-gray-50 rounded-xl outline-none"/></div>
                                        <div className="text-center"><label className="text-xs font-bold text-green-500">MARQUÉS</label><input type="number" value={marques} onChange={e=>setMarques(e.target.value)} className="w-24 h-16 text-4xl font-black text-center bg-green-50 text-green-600 rounded-xl outline-none"/></div>
                                    </div>
                                    <button id="validBtn" onClick={saveShot} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition">VALIDER</button>
                                </div>
                            ) : <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">👈 Choisissez une zone</div>}
                        </div>
                    </div>
                </div>
            );
        }

        // --- MODULE ANALYSE ---
        function AnalysisModule({ players, historyData, setHistoryData }) {
            const [filterPlayer, setFilterPlayer] = useState('all');
            const [startDate, setStartDate] = useState('');
            const [endDate, setEndDate] = useState('');

            // FONCTIONS DE DATES
            const setQuickRange = (type) => {
                const now = new Date();
                if(type==='all') { setStartDate(''); setEndDate(''); }
                if(type==='month') { 
                    const d = new Date(now.getFullYear(), now.getMonth(), 1); 
                    // Ajuster le décalage horaire pour avoir YYYY-MM-DD correct
                    const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    setStartDate(iso); setEndDate(''); 
                }
                if(type==='season') { 
                    const startYear = now.getMonth() < 8 ? now.getFullYear()-1 : now.getFullYear();
                    const d = new Date(startYear, 8, 1); 
                    const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    setStartDate(iso); setEndDate(''); 
                }
            };

            // SUPPRESSION
            const deleteSession = (id) => {
                if(confirm("Supprimer cette séance ?")) {
                    setHistoryData(historyData.filter(d => d.id !== id));
                }
            };

            // CALCULS
            const calculateStats = () => {
                const matrix = {}; 
                const teamStats = { '2pt':{tt:0,tr:0}, '3pt':{tt:0,tr:0}, 'LF':{tt:0,tr:0}, total:{tt:0,tr:0} };
                
                players.forEach(p => {
                    matrix[p.id] = { '2pt':{tt:0,tr:0}, '3pt':{tt:0,tr:0}, 'LF':{tt:0,tr:0} };
                    ZONES_DISPLAY.forEach(z => matrix[p.id][z.key] = {tt:0,tr:0});
                });

                let filtered = historyData;
                if(startDate) filtered = filtered.filter(d => d.date >= startDate);
                if(endDate) filtered = filtered.filter(d => d.date <= endDate);

                filtered.forEach(session => {
                    const dist = session.zones.Distance;
                    const pid = session.playerId;

                    Object.keys(session.zones).forEach(key => {
                        if(key === 'Distance' || key === 'types') return;
                        const stats = session.zones[key];
                        if(!stats || stats.attempted === 0) return;

                        teamStats.total.tt += stats.attempted;
                        teamStats.total.tr += stats.made;
                        if(teamStats[dist]) { teamStats[dist].tt += stats.attempted; teamStats[dist].tr += stats.made; }

                        if(matrix[pid]) {
                            if(matrix[pid][dist]) { matrix[pid][dist].tt += stats.attempted; matrix[pid][dist].tr += stats.made; }
                            if(matrix[pid][key]) { matrix[pid][key].tt += stats.attempted; matrix[pid][key].tr += stats.made; }
                        }
                    });
                });

                // Trier l'historique récent (filtré) pour affichage
                const recentSessions = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));

                return { matrix, teamStats, recentSessions };
            };

            const { matrix, teamStats, recentSessions } = calculateStats();
            const formatPct = (tr, tt) => tt > 0 ? Math.round((tr/tt)*100)+'%' : '-';

            return (
                <div className="space-y-6">
                    {/* FILTRES COMPLETS */}
                    <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 items-center">
                            <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)} className="font-bold bg-gray-50 p-2 rounded">
                                <option value="all">Tous les joueurs</option>
                                {players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-3 items-center">
                            {/* BOUTONS RAPIDES AJOUTÉS */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={()=>setQuickRange('all')} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded">TOUT</button>
                                <button onClick={()=>setQuickRange('month')} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded">MOIS</button>
                                <button onClick={()=>setQuickRange('season')} className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-white rounded">SAISON</button>
                            </div>
                            
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-gray-400">Du</span>
                                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border p-1 rounded text-sm"/>
                                <span className="text-xs font-bold text-gray-400">Au</span>
                                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border p-1 rounded text-sm"/>
                            </div>
                        </div>
                    </div>

                    {/* CARTES GLOBALES */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
                            <div className="text-gray-400 text-xs font-bold uppercase">Total Tirs</div>
                            <div className="text-2xl font-black text-gray-800">{teamStats.total.tr}/{teamStats.total.tt}</div>
                            <div className="text-sm font-bold text-blue-500">{formatPct(teamStats.total.tr, teamStats.total.tt)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
                            <div className="text-gray-400 text-xs font-bold uppercase">2 Points</div>
                            <div className="text-xl font-black text-gray-800">{teamStats['2pt'].tr}/{teamStats['2pt'].tt}</div>
                            <div className="text-sm font-bold text-yellow-500">{formatPct(teamStats['2pt'].tr, teamStats['2pt'].tt)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
                            <div className="text-gray-400 text-xs font-bold uppercase">3 Points</div>
                            <div className="text-xl font-black text-gray-800">{teamStats['3pt'].tr}/{teamStats['3pt'].tt}</div>
                            <div className="text-sm font-bold text-purple-500">{formatPct(teamStats['3pt'].tr, teamStats['3pt'].tt)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-500">
                            <div className="text-gray-400 text-xs font-bold uppercase">Lancers Francs</div>
                            <div className="text-xl font-black text-gray-800">{teamStats['LF'].tr}/{teamStats['LF'].tt}</div>
                            <div className="text-sm font-bold text-orange-500">{formatPct(teamStats['LF'].tr, teamStats['LF'].tt)}</div>
                        </div>
                    </div>

                    {/* TABLEAU */}
                    <div className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="p-3 text-left sticky left-0 bg-slate-900">Joueur</th>
                                    <th className="p-3 bg-white/10">LF</th>
                                    <th className="p-3 bg-white/10">2pts</th>
                                    <th className="p-3 bg-white/10">3pts</th>
                                    {ZONES_DISPLAY.map(z => <th key={z.key} className="p-3 border-l border-white/20">{z.key}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map(p => {
                                    if(filterPlayer !== 'all' && p.id != filterPlayer) return null;
                                    const s = matrix[p.id];
                                    return (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 text-left font-bold sticky left-0 bg-white shadow-lg">{p.name}</td>
                                            <td className="p-3 bg-orange-50 text-orange-700 font-mono font-bold">{formatPct(s['LF'].tr, s['LF'].tt)}</td>
                                            <td className="p-3 bg-yellow-50 text-yellow-700 font-mono font-bold">{formatPct(s['2pt'].tr, s['2pt'].tt)}</td>
                                            <td className="p-3 bg-purple-50 text-purple-700 font-mono font-bold">{formatPct(s['3pt'].tr, s['3pt'].tt)}</td>
                                            {ZONES_DISPLAY.map(z => (
                                                <td key={z.key} className="p-3 border-l text-gray-600">
                                                    {s[z.key].tt > 0 ? (
                                                        <div>
                                                            <span className="font-bold text-gray-800">{s[z.key].tr}/{s[z.key].tt}</span>
                                                            <div className="text-[10px]">{Math.round(s[z.key].tr/s[z.key].tt*100)}%</div>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* HISTORIQUE DÉTAILLÉ (AJOUTÉ) */}
                    <div className="bg-white rounded-xl shadow p-4">
                        <h3 className="font-bold text-lg mb-4 text-gray-700">📜 Historique des Entrées (Période affichée)</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {recentSessions.length === 0 ? <p className="text-gray-400 text-sm">Aucune donnée sur cette période.</p> :
                            recentSessions.map(session => {
                                const pName = players.find(p=>p.id===session.playerId)?.name || 'Inconnu';
                                // Calcul total session pour affichage
                                let totM=0, totA=0;
                                Object.keys(session.zones).forEach(k=>{
                                    if(k!=='Distance' && k!=='types') { totM+=session.zones[k].made; totA+=session.zones[k].attempted; }
                                });
                                
                                return (
                                    <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100">
                                        <div>
                                            <div className="font-bold text-sm">{pName} <span className="font-normal text-gray-500">- {session.date}</span></div>
                                            <div className="text-xs text-blue-600 font-bold uppercase">{session.zones.Distance} {session.zones.types}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-gray-800">{totM}/{totA}</div>
                                                <div className="text-[10px] text-gray-500">{totA>0?Math.round((totM/totA)*100):0}%</div>
                                            </div>
                                            <button onClick={()=>deleteSession(session.id)} className="text-red-400 hover:text-red-600 px-2">🗑️</button>
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
