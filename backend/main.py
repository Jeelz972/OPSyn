"""
Shot Chart & Heatmap API - Backend FastAPI
Compatible avec données Firebase (zones angulaires)
Déploiement: Render/Railway
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import seaborn as sns
import pandas as pd
import numpy as np
import io
import base64
from datetime import datetime
from collections import defaultdict

app = FastAPI(title="Basketball Shot Chart API", version="2.0.0")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Stockage en mémoire ---
shots_db: dict[str, list] = defaultdict(list)

# --- Modèles Pydantic ---
class ShotInput(BaseModel):
    x: float
    y: float
    result: Literal["made", "missed"]
    player_id: str
    zone: Optional[str] = None
    distance: Optional[str] = "2pt"
    shot_type: Optional[str] = "arret"
    date: Optional[str] = None

class ShotResponse(BaseModel):
    success: bool
    message: str
    total_shots: int

class BulkShotsInput(BaseModel):
    shots: list[ShotInput]

# --- Dessin du terrain ---
def draw_half_court(ax, line_color='white', court_color='#1a365d', lw=2):
    """Dessine un demi-terrain de basket"""
    W, H = 50, 47
    
    ax.set_facecolor(court_color)
    
    # Rectangle extérieur
    ax.add_patch(patches.Rectangle((0, 0), W, H, lw=lw, ec=line_color, fc=court_color))
    
    # Panier
    ax.add_patch(plt.Circle((25, 5.25), 0.75, lw=lw, ec=line_color, fc='none'))
    ax.plot([22, 28], [4, 4], lw=lw, color=line_color)
    
    # Raquette
    ax.add_patch(patches.Rectangle((17, 0), 16, 19, lw=lw, ec=line_color, fc='none'))
    
    # Cercle LF
    ax.add_patch(patches.Arc((25, 19), 12, 12, theta1=0, theta2=180, lw=lw, ec=line_color))
    
    # Arc 3pts
    ax.add_patch(patches.Arc((25, 5.25), 47.5, 47.5, theta1=22, theta2=158, lw=lw, ec=line_color))
    ax.plot([3, 3], [0, 14], lw=lw, color=line_color)
    ax.plot([47, 47], [0, 14], lw=lw, color=line_color)
    
    # Zone restrictive
    ax.add_patch(patches.Rectangle((19, 0), 12, 8, lw=1, ec=line_color, fc='none', ls='--'))
    
    ax.set_xlim(-2, 52)
    ax.set_ylim(-2, 49)
    ax.set_aspect('equal')
    ax.axis('off')
    
    return ax

def convert_pct_to_court(x_pct, y_pct):
    """Convertit pourcentage (0-100) en coordonnées terrain (0-50, 0-47)"""
    return (x_pct / 100) * 50, (y_pct / 100) * 47

# --- Endpoints ---
@app.get("/")
async def root():
    return {"status": "online", "api": "Basketball Shot Chart", "version": "2.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/shot", response_model=ShotResponse)
async def add_shot(shot: ShotInput):
    """Enregistre un tir"""
    cx, cy = convert_pct_to_court(shot.x, shot.y)
    
    shot_data = {
        "x": shot.x,
        "y": shot.y,
        "court_x": cx,
        "court_y": cy,
        "result": shot.result,
        "zone": shot.zone,
        "distance": shot.distance,
        "shot_type": shot.shot_type,
        "date": shot.date or datetime.now().strftime("%Y-%m-%d"),
        "player_id": shot.player_id
    }
    
    shots_db[shot.player_id].append(shot_data)
    
    return ShotResponse(
        success=True,
        message=f"Tir enregistré pour joueur {shot.player_id}",
        total_shots=len(shots_db[shot.player_id])
    )

@app.post("/api/shots/bulk", response_model=ShotResponse)
async def add_bulk_shots(data: BulkShotsInput):
    """Enregistre plusieurs tirs"""
    count = 0
    for shot in data.shots:
        cx, cy = convert_pct_to_court(shot.x, shot.y)
        
        shot_data = {
            "x": shot.x,
            "y": shot.y,
            "court_x": cx,
            "court_y": cy,
            "result": shot.result,
            "zone": shot.zone,
            "distance": shot.distance,
            "shot_type": shot.shot_type,
            "date": shot.date or datetime.now().strftime("%Y-%m-%d"),
            "player_id": shot.player_id
        }
        
        shots_db[shot.player_id].append(shot_data)
        count += 1
    
    return ShotResponse(success=True, message=f"{count} tirs enregistrés", total_shots=count)

@app.get("/api/shots/{player_id}")
async def get_shots(player_id: str):
    """Récupère les tirs d'un joueur ou de l'équipe"""
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
    """Supprime les tirs"""
    if player_id == "team":
        shots_db.clear()
        return {"success": True, "message": "Tous les tirs supprimés"}
    
    if player_id in shots_db:
        del shots_db[player_id]
    return {"success": True, "message": f"Tirs de {player_id} supprimés"}

@app.get("/api/heatmap/{player_id}")
async def generate_heatmap(
    player_id: str,
    result_filter: Optional[str] = None,
    opacity: float = 0.65
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
    
    # Filtrer
    if result_filter and result_filter in ["made", "missed"]:
        shots = [s for s in shots if s["result"] == result_filter]
        if not shots:
            raise HTTPException(status_code=404, detail=f"Aucun tir '{result_filter}' trouvé")
    
    df = pd.DataFrame(shots)
    
    # Créer la figure
    fig, ax = plt.subplots(figsize=(10, 9.4))
    draw_half_court(ax)
    
    # Heatmap KDE
    if len(df) >= 5:
        try:
            sns.kdeplot(
                x=df['court_x'],
                y=df['court_y'],
                cmap='YlOrRd',
                fill=True,
                alpha=opacity,
                levels=20,
                thresh=0.05,
                bw_adjust=0.6,
                ax=ax
            )
        except Exception as e:
            # Fallback: scatter
            colors = ['#22c55e' if r == 'made' else '#ef4444' for r in df['result']]
            ax.scatter(df['court_x'], df['court_y'], c=colors, s=80, alpha=0.6, edgecolors='white')
    else:
        colors = ['#22c55e' if r == 'made' else '#ef4444' for r in df['result']]
        ax.scatter(df['court_x'], df['court_y'], c=colors, s=150, edgecolors='white', linewidth=2)
    
    # Stats
    made = len([s for s in shots if s['result'] == 'made'])
    total = len(shots)
    pct = (made / total * 100) if total > 0 else 0
    
    title = "Équipe" if player_id == "team" else f"Joueur {player_id}"
    filter_txt = f" ({result_filter})" if result_filter else ""
    ax.set_title(f"{title}{filter_txt} - {made}/{total} ({pct:.1f}%)", 
                 fontsize=14, fontweight='bold', color='white', pad=10)
    
    plt.tight_layout()
    
    # Encoder
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='#1a365d')
    buf.seek(0)
    img_b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    
    return {
        "image": f"data:image/png;base64,{img_b64}",
        "stats": {"total": total, "made": made, "missed": total - made, "percentage": round(pct, 1)}
    }

@app.get("/api/shotchart/{player_id}")
async def generate_shotchart(player_id: str, result_filter: Optional[str] = None):
    """Génère un shot chart avec points individuels"""
    
    if player_id == "team":
        shots = []
        for pid, player_shots in shots_db.items():
            shots.extend(player_shots)
    else:
        shots = shots_db.get(player_id, [])
    
    if not shots:
        raise HTTPException(status_code=404, detail="Aucun tir trouvé")
    
    if result_filter and result_filter in ["made", "missed"]:
        shots = [s for s in shots if s["result"] == result_filter]
    
    df = pd.DataFrame(shots)
    
    fig, ax = plt.subplots(figsize=(10, 9.4))
    draw_half_court(ax)
    
    # Points
    made_df = df[df['result'] == 'made']
    miss_df = df[df['result'] == 'missed']
    
    if not made_df.empty:
        ax.scatter(made_df['court_x'], made_df['court_y'], 
                  c='#22c55e', s=100, marker='o', edgecolors='white', 
                  linewidth=2, label='Réussis', zorder=5, alpha=0.85)
    
    if not miss_df.empty:
        ax.scatter(miss_df['court_x'], miss_df['court_y'], 
                  c='#ef4444', s=100, marker='X', edgecolors='white', 
                  linewidth=2, label='Ratés', zorder=5, alpha=0.85)
    
    ax.legend(loc='upper right', facecolor='#1a365d', edgecolor='white', 
              labelcolor='white', fontsize=10)
    
    made = len(made_df)
    total = len(df)
    pct = (made / total * 100) if total > 0 else 0
    
    title = "Équipe" if player_id == "team" else f"Joueur {player_id}"
    ax.set_title(f"{title} - {made}/{total} ({pct:.1f}%)", 
                 fontsize=14, fontweight='bold', color='white', pad=10)
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='#1a365d')
    buf.seek(0)
    img_b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    
    return {
        "image": f"data:image/png;base64,{img_b64}",
        "stats": {"total": total, "made": made, "missed": total - made, "percentage": round(pct, 1)}
    }

@app.get("/api/stats/zones/{player_id}")
async def get_zone_stats(player_id: str):
    """Stats par zone pour un joueur"""
    if player_id == "team":
        shots = []
        for pid, player_shots in shots_db.items():
            shots.extend(player_shots)
    else:
        shots = shots_db.get(player_id, [])
    
    if not shots:
        return {"player_id": player_id, "zones": {}}
    
    zones = defaultdict(lambda: {"made": 0, "total": 0})
    
    for s in shots:
        z = s.get('zone') or 'Autre'
        zones[z]["total"] += 1
        if s['result'] == 'made':
            zones[z]["made"] += 1
    
    # Calculer pourcentages
    for z in zones:
        t = zones[z]["total"]
        m = zones[z]["made"]
        zones[z]["percentage"] = round((m / t * 100), 1) if t > 0 else 0
    
    return {"player_id": player_id, "zones": dict(zones)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
