// src/App.jsx
import React, { useState, useEffect } from "react";
import ShootingModule from "./modules/ShootingModule.jsx";
import TeamStatsModule from "./modules/TeamStatsModule.jsx";
import HistoryModule from "./modules/HistoryModule.jsx";
import { ZONES, PLAYERS } from "./data/constants.js";

export default function BasketballStatsApp() {
  const [activeModule, setActiveModule] = useState("team");
  const [shots, setShots] = useState({});
  const [teamStats, setTeamStats] = useState([]);
  const [currentMatchStats, setCurrentMatchStats] = useState({
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

  useEffect(() => {
    try {
      const savedShots = JSON.parse(localStorage.getItem("basketball_shots") || "{}");
      const savedTeamStats = JSON.parse(localStorage.getItem("basketball_team_stats") || "[]");
      setShots(savedShots);
      setTeamStats(savedTeamStats);
    } catch (error) {
      console.warn("Erreur de chargement localStorage", error);
    }
  }, []);

  const saveShots = (newShots) => {
    setShots(newShots);
    localStorage.setItem("basketball_shots", JSON.stringify(newShots));
  };

  const saveTeamStats = (newStats) => {
    setTeamStats(newStats);
    localStorage.setItem("basketball_team_stats", JSON.stringify(newStats));
  };

  const exportAllDataToCSV = () => {
    let csv = "=== STATISTIQUES DE TIR ===\n";
    csv += "Joueur,Zone,Tirs Tentés,Tirs Marqués,Pourcentage\n";

    PLAYERS.forEach((player) => {
      const playerShots = shots[player.id] || {};
      ZONES.forEach((zone) => {
        const zoneData = playerShots[zone.id] || { tentes: 0, marques: 0 };
        if (zoneData.tentes > 0) {
          const pct = ((zoneData.marques / zoneData.tentes) * 100).toFixed(1);
          csv += `${player.name},${zone.name},${zoneData.tentes},${zoneData.marques},${pct}%\n`;
        }
      });
    });

    csv += "\n=== STATISTIQUES D'ÉQUIPE PAR MATCH ===\n";
    csv += "Date,Heure,Adversaire,Lieu,Score Final Nous,Score Final Adv,Q1 Nous,Q1 Adv,Q2 Nous,Q2 Adv,Q3 Nous,Q3 Adv,Q4 Nous,Q4 Adv\n";

    teamStats.forEach((match) => {
      const scoreNous = match.quartersData.reduce((sum, q) => sum + q.nous, 0);
      const scoreAdv = match.quartersData.reduce((sum, q) => sum + q.adversaire, 0);
      const lieu = match.lieu === "domicile" ? "Domicile" : "Exterieur";
      csv += `${match.date},${match.time},${match.adversaire.nom || "N/A"},${lieu},${scoreNous},${scoreAdv},`;
      match.quartersData.forEach((q) => {
        csv += `${q.nous},${q.adversaire},`;
      });
      csv += "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stats_basketball_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const resetAllData = () => {
    if (confirm("Êtes-vous sûr de vouloir effacer TOUTES les données ?")) {
      setShots({});
      setTeamStats([]);
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
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="bg-gradient-to-r from-orange-600 to-blue-600 p-4 text-white shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">🏀 Stats Basketball Pro</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveModule("team")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeModule === "team" ? "bg-white text-blue-600 shadow-lg" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              🏀 Match en Cours
            </button>
            <button
              onClick={() => setActiveModule("shooting")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeModule === "shooting" ? "bg-white text-blue-600 shadow-lg" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              🎯 Stats de Tir
            </button>
            <button
              onClick={() => setActiveModule("history")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeModule === "history" ? "bg-white text-blue-600 shadow-lg" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              📊 Historique
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {activeModule === "shooting" && (
          <ShootingModule shots={shots} saveShots={saveShots} exportToCSV={exportAllDataToCSV} resetData={resetAllData} />
        )}
        {activeModule === "team" && (
          <TeamStatsModule teamStats={teamStats} currentMatchStats={currentMatchStats} setCurrentMatchStats={setCurrentMatchStats} saveTeamStats={saveTeamStats} />
        )}
        {activeModule === "history" && (
          <HistoryModule shots={shots} teamStats={teamStats} exportToCSV={exportAllDataToCSV} saveTeamStats={saveTeamStats} />
        )}
      </div>
    </div>
  );
}
