# Reino em Conflito - Remaster v2.0

Remaster em Electron do jogo de estrategia medieval por turnos.

## Status: Em Desenvolvimento

Estrutura e engine prontos. Wiring do JS em andamento.

## Rodar (dev)

```bash
npm install
npm start
```

## Empacotar

```bash
npm run dist
```

## Requisitos

- Node.js 18+
- npm 9+

## Estrutura

```
reino-em-conflito-remaster/
├── electron/main.js              # Electron main process
├── src/
│   ├── index.html                # SPA com 7 telas
│   ├── css/game.css              # Tema medieval completo
│   ├── js/
│   │   ├── app.js                # Entry point
│   │   ├── engine/               # Logica do jogo (sem DOM)
│   │   │   ├── constants.js      # Personagens, cartas, buildings
│   │   │   ├── state.js          # GameState + EventEmitter
│   │   │   ├── ai.js             # IA com 7 comportamentos
│   │   │   └── combat.js         # Sistema de combate
│   │   └── ui/                   # Interface
│   │       ├── renderer.js       # Renderiza DOM
│   │       ├── audio.js          # Web Audio API (22 sons)
│   │       ├── effects.js        # Efeitos visuais
│   │       └── ranks.js          # Sistema de MMR
│   └── assets/images/            # Artes originais
├── ONDE_PARAMOS.md               # Estado atual do desenvolvimento
└── package.json
```

## Tecnologias

- Electron 33
- JavaScript ES Modules (sem framework)
- Web Audio API (sons sintetizados)
- CSS Grid/Flexbox (layout responsivo)

## Versao Original

Repo da versao HTML: https://github.com/hallansouza16/reino-em-conflito
