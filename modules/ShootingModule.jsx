// src/modules/ShootingModule.jsx
import React, { useState } from "react";
import { ZONES, PLAYERS } from "../data/constants.js";

export default function ShootingModule({ shots, saveShots, exportToCSV, resetData }) {
  const [selectedPlayer, setSelectedPlayer] = useState(PLAYERS[0]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [inputTentes, setInputTentes] = useState("");
  const [inputMarques, setInputMarques] = useState("");
  const [viewStats, setViewStats] = useState(false);

  const validateEntry = () => {
    if (!selectedPlayer || !selectedZone) return;
    const tentes = parseInt(inputTentes) || 0;
    const marques = parseInt(inputMarques) || 0;
    if (tentes === 0 || marques > tentes) return alert("Valeurs invalides");

    const playerShots = shots[selectedPlayer.id] || {};
    const zoneShots = playerShots[selectedZone] || { tentes: 0, marques: 0 };
    const newShots = {
      ...shots,
      [selectedPlayer.id]: {
        ...playerShots,
        [selectedZone]: {
          tentes: zoneShots.tentes + tentes,
          marques: zoneShots.marques + marques,
        },
      },
    };
    saveShots(newShots);
    setInputTentes("");
    setInputMarques("");
  };

  const getPlayerStats = (playerId) => {
    const playerShots = shots[playerId] || {};
    let tentes = 0, marques = 0;
    ZONES.forEach((z) => {
      const data = playerShots[z.id] || { tentes: 0, marques: 0 };
      tentes += data.tentes;
      marques += data.marques;
    });
    return { tentes, marques, pct: tentes > 0 ? ((marques / tentes) * 100).toFixed(1) : "0" };
  };

  if (viewStats) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">📊 Tableau des Statistiques</h2>
          <button
            onClick={() => setViewStats(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >Retour</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Joueur</th>
                {ZONES.map((z) => (
                  <th key={z.id} className="p-2 border" style={{ color: z.color }}>{z.name}</th>
                ))}
                <th className="p-2 border bg-gray-50">Total</th>
              </tr>
            </thead>
            <tbody>
              {PLAYERS.map((p) => {
                const playerShots = shots[p.id] || {};
                const stats = getPlayerStats(p.id);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="border p-2 font-semibold">{p.name}</td>
                    {ZONES.map((z) => {
                      const d = playerShots[z.id] || { tentes: 0, marques: 0 };
                      const pct = d.tentes > 0 ? ((d.marques / d.tentes) * 100).toFixed(0) : "-";
                      return (
                        <td key={z.id} className="border p-2 text-center">
                          {d.marques}/{d.tentes}
                          <div className="text-xs text-gray-500">{pct !== "-" ? `${pct}%` : "-"}</div>
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center font-bold bg-gray-100">
                      {stats.marques}/{stats.tentes} ({stats.pct}%)
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
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">🎯 Statistiques de Tir</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="font-semibold">Joueur :</label>
          <select
            value={selectedPlayer?.id || ""}
            onChange={(e) => setSelectedPlayer(PLAYERS.find(p => p.id === parseInt(e.target.value)))}
            className="w-full border rounded px-2 py-1"
          >
            {PLAYERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="font-semibold">Zone :</label>
          <select
            value={selectedZone || ""}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">Choisir une zone</option>
            {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
      </div>

      {selectedZone && (
        <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg mb-4">
          <h3 className="font-bold mb-2">Zone : {ZONES.find(z => z.id === selectedZone)?.name}</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold">Tirs tentés</label>
              <input
                type="number"
                min="0"
                value={inputTentes}
                onChange={(e) => setInputTentes(e.target.value)}
                className="border px-3 py-2 rounded-lg w-24 text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Tirs marqués</label>
              <input
                type="number"
                min="0"
                value={inputMarques}
                onChange={(e) => setInputMarques(e.target.value)}
                className="border px-3 py-2 rounded-lg w-24 text-center"
              />
            </div>
            <button
              onClick={validateEntry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
            >Valider</button>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setViewStats(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">📊 Voir Tableau</button>
        <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">💾 Exporter CSV</button>
        <button onClick={resetData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">🗑️ Réinitialiser</button>
      </div>
    </div>
  );
}
