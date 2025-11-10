// src/modules/TeamStatsModule.jsx
import React, { useState, useEffect } from "react";
import { PLAYERS } from "../data/constants.js";

export default function TeamStatsModule({ teamStats, currentMatchStats, setCurrentMatchStats, saveTeamStats }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showRecap, setShowRecap] = useState(false);

  const activeQuarter = currentMatchStats.quartersData[currentMatchStats.activeQuarter];
  const totalScoreNous = currentMatchStats.quartersData.reduce((sum, q) => sum + q.nous, 0);
  const totalScoreAdv = currentMatchStats.quartersData.reduce((sum, q) => sum + q.adversaire, 0);

  const addAction = (type, team, points = 0) => {
    const action = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      team,
      points,
      player: selectedPlayer?.name || null,
      quarter: currentMatchStats.activeQuarter + 1
    };

    const newStats = { ...currentMatchStats };
    const quarter = newStats.quartersData[currentMatchStats.activeQuarter];
    quarter.actions.push(action);

    if (team === "nous") quarter.nous += points;
    else quarter.adversaire += points;

    setCurrentMatchStats(newStats);
  };

  const undoLastAction = () => {
    const newStats = { ...currentMatchStats };
    const quarter = newStats.quartersData[currentMatchStats.activeQuarter];
    if (quarter.actions.length === 0) return;

    const lastAction = quarter.actions.pop();
    if (lastAction.team === "nous") quarter.nous -= lastAction.points;
    else quarter.adversaire -= lastAction.points;

    setCurrentMatchStats(newStats);
  };

  const saveMatch = () => {
    if (!currentMatchStats.adversaire.nom) {
      alert("Veuillez entrer le nom de l'adversaire");
      return;
    }

    const newTeamStats = [...teamStats, { ...currentMatchStats }];
    saveTeamStats(newTeamStats);

    setCurrentMatchStats({
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      adversaire: { nom: "" },
      lieu: "domicile",
      quartersData: [
        { quarter: 1, nous: 0, adversaire: 0, actions: [] },
        { quarter: 2, nous: 0, adversaire: 0, actions: [] },
        { quarter: 3, nous: 0, adversaire: 0, actions: [] },
        { quarter: 4, nous: 0, adversaire: 0, actions: [] }
      ],
      overtime: null,
      activeQuarter: 0
    });

    localStorage.removeItem("basketball_current_match");
    alert("Match enregistré avec succès !");
  };

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-4">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">🏀 Match en cours</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input
          type="date"
          value={currentMatchStats.date}
          onChange={(e) => setCurrentMatchStats({ ...currentMatchStats, date: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="time"
          value={currentMatchStats.time}
          onChange={(e) => setCurrentMatchStats({ ...currentMatchStats, time: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Nom de l'adversaire"
          value={currentMatchStats.adversaire.nom}
          onChange={(e) => {
            const updated = { ...currentMatchStats };
            updated.adversaire.nom = e.target.value;
            setCurrentMatchStats(updated);
          }}
          className="px-3 py-2 border rounded-lg"
        />
        <select
          value={currentMatchStats.lieu}
          onChange={(e) => setCurrentMatchStats({ ...currentMatchStats, lieu: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="domicile">🏠 Domicile</option>
          <option value="exterieur">✈️ Extérieur</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-600 text-white text-center p-4 rounded-lg">
          <div className="text-sm font-semibold">NOUS</div>
          <div className="text-4xl font-bold">{totalScoreNous}</div>
        </div>
        <div className="bg-red-600 text-white text-center p-4 rounded-lg">
          <div className="text-sm font-semibold">{currentMatchStats.adversaire.nom || "ADVERSAIRE"}</div>
          <div className="text-4xl font-bold">{totalScoreAdv}</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Joueur actif</label>
        <select
          value={selectedPlayer?.id || ""}
          onChange={(e) => setSelectedPlayer(PLAYERS.find(p => p.id === parseInt(e.target.value)))}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Sélectionner un joueur</option>
          {PLAYERS.map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <button onClick={() => addAction('panier_2pts', 'nous', 2)} className="bg-green-500 text-white px-3 py-2 rounded">✓ Panier 2pts</button>
        <button onClick={() => addAction('panier_3pts', 'nous', 3)} className="bg-green-600 text-white px-3 py-2 rounded">✓ Panier 3pts</button>
        <button onClick={() => addAction('faute', 'adversaire')} className="bg-yellow-500 text-white px-3 py-2 rounded">🟡 Faute ADV</button>
        <button onClick={undoLastAction} className="bg-red-500 text-white px-3 py-2 rounded">↶ Annuler</button>
      </div>

      <button onClick={saveMatch} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">💾 Enregistrer le match</button>
    </div>
  );
}
