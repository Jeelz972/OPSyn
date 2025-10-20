# OPSyn
Plateform Basket Poussez
basketball-tactics-platform/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Court/
│   │   │   │   ├── Court.jsx          # Canvas principal
│   │   │   │   ├── Player.jsx         # Composant joueur draggable
│   │   │   │   ├── Ball.jsx           # Composant ballon
│   │   │   │   └── Arrow.jsx          # Flèches de mouvement
│   │   │   ├── Toolbar/
│   │   │   │   ├── Toolbar.jsx        # Barre d'outils
│   │   │   │   └── ToolButton.jsx     # Boutons d'outils
│   │   │   ├── PlayLibrary/
│   │   │   │   ├── PlayList.jsx       # Liste des plays
│   │   │   │   └── PlayCard.jsx       # Carte de play
│   │   │   └── Layout/
│   │   │       ├── Header.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Editor.jsx             # Page principale éditeur
│   │   │   ├── Library.jsx            # Bibliothèque de plays
│   │   │   └── Share.jsx              # Page de partage
│   │   ├── hooks/
│   │   │   ├── usePlay.js             # Logique de gestion des plays
│   │   │   └── useCanvas.js           # Logique canvas
│   │   ├── utils/
│   │   │   ├── export.js              # Export PNG/PDF
│   │   │   └── storage.js             # LocalStorage/API
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                            # (Phase 2)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── plays.js
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   └── Play.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── README.md
