"""
Shot Chart & Heatmap API - Backend FastAPI
Déploiement: Render/Railway
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Literal, Optional
import matplotlib
matplotlib.use('Agg')  # Backend non-interactif
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import seaborn as sns
import pandas as pd
import numpy as np
import io
import base64
from datetime import datetime
from collections import defaultdict

app = FastAPI(title="Basketball Shot Chart API", version="1.0.0")

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Stockage en mémoire (remplacer par DB en production) ---
shots_db: dict[str, list] = defaultdict(list)

# --- Modèles Pydantic ---
class ShotInput(BaseModel):
    x: float  # 0-100 (pourcentage largeur)
    y: float  # 0-100 (pourcentage hauteur)
    result: Literal["made", "missed"]
    player_id: str
    distance: Optional[str] = "2pt"
    shot_type: Optional[str] = "arret"
    date: Optional[str] = None

class ShotResponse(BaseModel):
    success: bool
    message: str
    total_shots: int

class BulkShotsInput(BaseModel):
    shots: list[ShotInput]

# --- Fonctions de dessin du terrain ---
def draw_half_court(ax, line_color='white', court_color='#1a365d', line_width=2):
    """Dessine un demi-terrain de basket aux dimensions standard"""
    # Dimensions terrain (en pieds, échelle 0-100)
    court_width, court_height = 50, 47
    
    # Fond du terrain
    ax.set_facecolor(court_color)
    
    # Rectangle extérieur
    outer = patches.Rectangle((0, 0), court_width, court_height, 
                               linewidth=line_width, edgecolor=line_color, facecolor=court_color)
    ax.add_patch(outer)
    
    # Panier (cercle)
    hoop = plt.Circle((25, 5.25), 0.75, linewidth=line_width, 
                      edgecolor=line_color, facecolor='none')
    ax.add_patch(hoop)
    
    # Planche
    ax.plot([22, 28], [4, 4], linewidth=line_width, color=line_color)
    
    # Zone restrictive (raquette)
    paint = patches.Rectangle((17, 0), 16, 19, linewidth=line_width, 
                               edgecolor=line_color, facecolor='none')
    ax.add_patch(paint)
    
    # Cercle LF
    ft_circle = patches.Arc((25, 19), 12, 12, theta1=0, theta2=180,
                            linewidth=line_width, edgecolor=line_color)
    ax.add_patch(ft_circle)
    
    # Arc 3 points
    three_arc = patches.Arc((25, 5.25), 47.5, 47.5, theta1=22, theta2=158,
                            linewidth=line_width, edgecolor=line_color)
    ax.add_patch(three_arc)
    
    # Lignes corners 3pts
    ax.plot([3, 3], [0, 14], linewidth=line_width, color=line_color)
    ax.plot([47, 47], [0, 14], linewidth=line_width, color=line_color)
    
    # Configuration axes
    ax.set_xlim(-2, 52)
    ax.set_ylim(-2, 49)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return ax

def convert_coords(x_pct, y_pct):
    """Convertit les coordonnées pourcentage en coordonnées terrain"""
    court_x = (x_pct / 100) * 50
    court_y = (y_pct / 100) * 47
    return court_x, court_y

# --- Endpoints API ---
@app.get("/")
async def root():
    return {"status": "online", "api": "Basketball Shot Chart", "version": "1.0.0"}

@app.post("/api/shot", response_model=ShotResponse)
async def add_shot(shot: ShotInput):
    """Enregistre un tir"""
    shot_data = {
        "x": shot.x,
        "y": shot.y,
        "result": shot.result,
        "distance": shot.distance,
        "shot_type": shot_type,
        "date": shot.date or datetime.now().isoformat(),
        "court_x": convert_coords(shot.x, shot.y)[0],
        "court_y": convert_coords(shot.x, shot.y)[1]
    }
    
    shots_db[shot.player_id].append(shot_data)
    
    return ShotResponse(
        success=True,
        message=f"Tir enregistré pour {shot.player_id}",
        total_shots=len(shots_db[shot.player_id])
    )

@app.post("/api/shots/bulk", response_model=ShotResponse)
async def add_bulk_shots(data: BulkShotsInput):
    """Enregistre plusieurs tirs en une fois"""
    count = 0
    for shot in data.shots:
        shot_data = {
            "x": shot.x,
            "y": shot.y,
            "result": shot.result,
            "distance": shot.distance,
            "shot_type": shot.shot_type,
            "date": shot.date or datetime.now().isoformat(),
            "court_x": convert_coords(shot.x, shot.y)[0],
            "court_y": convert_coords(shot.x, shot.y)[1]
        }
        shots_db[shot.player_id].append(shot_data)
        count += 1
    
    return ShotResponse(success=True, message=f"{count} tirs enregistrés", total_shots=count)

@app.get("/api/shots/{player_id}")
async def get_shots(player_id: str):
    """Récupère tous les tirs d'un joueur"""
    if player_id == "team":
        all_shots = []
        for pid, shots in shots_db.items():
            for s in shots:
                all_shots.append({**s, "player_id": pid})
        return {"player_id": "team", "shots": all_shots, "count": len(all_shots)}
    
    return {
        "player_id": player_id,
        "shots": shots_db.get(player_id, []),
        "count": len(shots_db.get(player_id, []))
    }

@app.delete("/api/shots/{player_id}")
async def clear_shots(player_id: str):
    """Supprime tous les tirs d'un joueur"""
    if player_id == "team":
        shots_db.clear()
        return {"success": True, "message": "Tous les tirs supprimés"}
    
    if player_id in shots_db:
        del shots_db[player_id]
    return {"success": True, "message": f"Tirs de {player_id} supprimés"}

@app.get("/api/heatmap/{player_id}")
async def generate_heatmap(
    player_id: str,
    result_filter: Optional[str] = None,  # "made", "missed", ou None pour tous
    opacity: float = 0.6
):
    """Génère une heatmap des tirs"""
    
    # Récupérer les tirs
    if player_id == "team":
        shots = []
        for pid, player_shots in shots_db.items():
            shots.extend(player_shots)
    else:
        shots = shots_db.get(player_id, [])
    
    if not shots:
        raise HTTPException(status_code=404, detail="Aucun tir trouvé")
    
    # Filtrer par résultat si spécifié
    if result_filter:
        shots = [s for s in shots if s["result"] == result_filter]
        if not shots:
            raise HTTPException(status_code=404, detail=f"Aucun tir '{result_filter}' trouvé")
    
    # Créer DataFrame
    df = pd.DataFrame(shots)
    
    # Créer la figure
    fig, ax = plt.subplots(figsize=(10, 9.4))
    draw_half_court(ax)
    
    # Générer la heatmap avec KDE
    if len(df) >= 3:  # Minimum pour KDE
        try:
            sns.kdeplot(
                x=df['court_x'],
                y=df['court_y'],
                cmap='YlOrRd',
                fill=True,
                alpha=opacity,
                levels=15,
                thresh=0.05,
                ax=ax
            )
        except Exception:
            # Fallback si KDE échoue
            ax.scatter(df['court_x'], df['court_y'], c='red', alpha=0.5, s=100)
    else:
        # Pas assez de points pour KDE, afficher les points
        colors = ['#22c55e' if r == 'made' else '#ef4444' for r in df['result']]
        ax.scatter(df['court_x'], df['court_y'], c=colors, s=150, edgecolors='white', linewidth=2)
    
    # Stats overlay
    made = len([s for s in shots if s['result'] == 'made'])
    total = len(shots)
    pct = (made / total * 100) if total > 0 else 0
    
    title = "Équipe" if player_id == "team" else f"Joueur {player_id}"
    ax.set_title(f"{title} - {made}/{total} ({pct:.1f}%)", 
                 fontsize=14, fontweight='bold', color='white', pad=10)
    
    plt.tight_layout()
    
    # Encoder en base64
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png', dpi=150, bbox_inches='tight', 
                facecolor='#1a365d', edgecolor='none')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close(fig)
    
    return {
        "image": f"data:image/png;base64,{img_base64}",
        "stats": {
            "total": total,
            "made": made,
            "missed": total - made,
            "percentage": round(pct, 1)
        }
    }

@app.get("/api/shotchart/{player_id}")
async def generate_shotchart(player_id: str, result_filter: Optional[str] = None):
    """Génère un shot chart avec les points individuels"""
    
    if player_id == "team":
        shots = []
        for pid, player_shots in shots_db.items():
            shots.extend(player_shots)
    else:
        shots = shots_db.get(player_id, [])
    
    if not shots:
        raise HTTPException(status_code=404, detail="Aucun tir trouvé")
    
    if result_filter:
        shots = [s for s in shots if s["result"] == result_filter]
    
    df = pd.DataFrame(shots)
    
    fig, ax = plt.subplots(figsize=(10, 9.4))
    draw_half_court(ax)
    
    # Points individuels
    made_shots = df[df['result'] == 'made']
    missed_shots = df[df['result'] == 'missed']
    
    if not made_shots.empty:
        ax.scatter(made_shots['court_x'], made_shots['court_y'], 
                  c='#22c55e', s=120, marker='o', edgecolors='white', 
                  linewidth=2, label='Réussis', zorder=5)
    
    if not missed_shots.empty:
        ax.scatter(missed_shots['court_x'], missed_shots['court_y'], 
                  c='#ef4444', s=120, marker='X', edgecolors='white', 
                  linewidth=2, label='Ratés', zorder=5)
    
    ax.legend(loc='upper right', facecolor='#1a365d', edgecolor='white', 
              labelcolor='white', fontsize=10)
    
    made = len(made_shots)
    total = len(df)
    pct = (made / total * 100) if total > 0 else 0
    
    title = "Équipe" if player_id == "team" else f"Joueur {player_id}"
    ax.set_title(f"{title} - {made}/{total} ({pct:.1f}%)", 
                 fontsize=14, fontweight='bold', color='white', pad=10)
    
    plt.tight_layout()
    
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png', dpi=150, bbox_inches='tight',
                facecolor='#1a365d', edgecolor='none')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close(fig)
    
    return {
        "image": f"data:image/png;base64,{img_base64}",
        "stats": {"total": total, "made": made, "missed": total - made, "percentage": round(pct, 1)}
    }

@app.get("/api/stats/{player_id}")
async def get_player_stats(player_id: str):
    """Statistiques détaillées d'un joueur"""
    if player_id == "team":
        shots = []
        for pid, player_shots in shots_db.items():
            shots.extend(player_shots)
    else:
        shots = shots_db.get(player_id, [])
    
    if not shots:
        return {"player_id": player_id, "stats": None}
    
    total = len(shots)
    made = len([s for s in shots if s['result'] == 'made'])
    
    # Stats par distance
    by_distance = defaultdict(lambda: {"made": 0, "total": 0})
    for s in shots:
        d = s.get('distance', '2pt')
        by_distance[d]["total"] += 1
        if s['result'] == 'made':
            by_distance[d]["made"] += 1
    
    # Stats par type
    by_type = defaultdict(lambda: {"made": 0, "total": 0})
    for s in shots:
        t = s.get('shot_type', 'arret')
        by_type[t]["total"] += 1
        if s['result'] == 'made':
            by_type[t]["made"] += 1
    
    return {
        "player_id": player_id,
        "stats": {
            "total": total,
            "made": made,
            "missed": total - made,
            "percentage": round((made / total * 100), 1) if total > 0 else 0,
            "by_distance": dict(by_distance),
            "by_type": dict(by_type)
        }
    }

# --- Point d'entrée ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
