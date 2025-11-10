// src/modules/HistoryModule.jsx
import React, { useState } from "react";

export default function HistoryModule({ teamStats, exportToCSV, saveTeamStats }) {
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [lieuFilter, setLieuFilter] = useState("tous");

  const deleteMatch = (matchIndex) => {
    if (confirm("Supprimer ce match ?")) {
      const newStats = teamStats.filter((_, idx) => idx !== matchIndex);
      saveTeamStats(newStats);
      alert("Match supprimé !");
    }
  };

  const filteredMatches = lieuFilter === "tous" ? teamStats : teamStats.filter(m => m.lieu === lieuFilter);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">📊 Historique des matchs</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={lieuFilter}
          onChange={(e) => setLieuFilter(e.target.value)}
          className="px-3 py-2 border-2 border-gray-300 rounded-lg"
        >
          <option value="tous">Tous les matchs</option>
          <option value="domicile">🏠 Domicile</option>
          <option value="exterieur">✈️ Extérieur</option>
        </select>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          💾 Exporter CSV
        </button>
      </div>

      {filteredMatches.length === 0 ? (
        <p className="text-gray-600 text-center py-6">Aucun match enregistré.</p>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match, idx) => {
            const totalNous = match.quartersData.reduce((sum, q) => sum + q.nous, 0);
            const totalAdv = match.quartersData.reduce((sum, q) => sum + q.adversaire, 0);

            return (
              <div
                key={idx}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">
                      {match.date} • {match.adversaire.nom || "Adversaire"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {match.lieu === "domicile" ? "🏠 Domicile" : "✈️ Extérieur"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-700">
                      {totalNous} - {totalAdv}
                    </div>
                    <button
                      onClick={() => deleteMatch(idx)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedMatch(expandedMatch === idx ? null : idx)}
                  className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  {expandedMatch === idx ? "Masquer détails" : "Voir détails"}
                </button>

                {expandedMatch === idx && (
                  <div className="mt-3 bg-white border rounded-lg p-3">
                    <h4 className="font-semibold mb-2 text-gray-700">Scores par quart-temps :</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {match.quartersData.map((q) => (
                        <div key={q.quarter} className="bg-gray-100 text-center p-2 rounded">
                          <div className="text-xs text-gray-500">Q{q.quarter}</div>
                          <div className="font-bold text-blue-700">{q.nous}</div>
                          <div className="text-xs">-</div>
                          <div className="font-bold text-red-600">{q.adversaire}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
