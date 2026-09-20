# REINO EM CONFLITO

> *"No Reino em Conflito, a espada e afiada, mas a mente estrategica e a verdadeira arma do rei."*

Jogo de estrategia medieval por turnos com modos **Singleplayer** (contra IA) e **Multiplayer** online em tempo real.

Gerencie recursos, recrute exercitos, compre cartas no mercado e force seu oponente ao colapso politico. Vence quem forcar o adversario a atingir o limite de Instabilidade.

---

## Como Jogar

### Pre-requisitos

- [Node.js](https://nodejs.org/) 14 ou superior

### Iniciar o jogo

**Opcao 1 — Duplo clique:**
```
jogar.bat
```

**Opcao 2 — Terminal:**
```bash
npm install
npm start
```

Acesse **http://localhost:4000** no navegador.

---

## Mecanicas

### Recursos

| Recurso | Funcao |
|---------|--------|
| Moedas | Recrutar tropas, comprar cartas, construir edificacoes |
| Comida | Sustentar o exercito (upkeep por turno) |
| Exercito | Forca militar para ataque e defesa |
| Influencia | Manter a ordem e reduzir instabilidade |
| Instabilidade | Chegou a 10? Rebeliao. Game over. |
| Briks | Moeda de upgrade, ganha em guerras |

### Acoes por Turno (2 AP)

- **Minerar** — +4 Moedas, +5 Comida (cooldown de 3 turnos)
- **Recrutar** — Gasta moedas e comida, ganha exercito
- **Fortificar** — Gasta moedas e influencia, reduz instabilidade
- **Guerrear** — Combate tatico contra o oponente

### Sistema de Cartas

5 cartas aleatorias no mercado a cada turno, em 4 categorias:

- **Self** — Buffs no seu reino
- **Opponent** — Debuffs no adversario
- **Gamble** — Apostas 50/50
- **Status** — Efeitos passivos (Inspiracao, Boom Economico, Impostos Altos)

### Estacoes do Ano

A cada 5 turnos o clima muda, afetando a gameplay:

- **Primavera** — Equilibrio, sem bonus ou penalidades
- **Verao** — +1 Moeda em mineracao
- **Outono** — Transicao
- **Inverno** — Consumo extra de comida (50% do exercito)

### Edificacoes

Compre com Briks ganhos em guerras:

- **Quartel** — Bonus militar
- **Moinho** — Bonus de producao
- **Academia** — Bonus de influencia

### Ultimates

Cada personagem tem uma habilidade suprema. A barra carrega durante a partida (0-10) e quando cheia, libera um poder devastador.

---

## Personagens

9 lideres unicos, cada um com stats iniciais e passivas diferentes:

| Personagem | Passiva |
|-----------|---------|
| **Rei** | +1 Moeda extra por turno |
| **Rainha** | -1 Instabilidade no inicio do turno |
| **Ferreiro** | Recrutamento custa 1 Moeda a menos |
| **Ladrao** | Minerar da +1 Moeda, mas +1 Instabilidade |
| **Amante** | Cartas de oponente custam 1 a menos |
| **Soldado** | Limite de exercito para rebeliao aumenta para 6 |
| **Mestre Programador** | Cartas custam -2 Moedas e +1 AP extra |
| **Princesa Real** | +2 Influencia e Fortificacao com 50% de desconto |
| **Bruxa Sabia** | Efeitos de cartas podem duplicar (25% de chance) |

---

## Modos de Jogo

### Singleplayer

Jogue contra uma IA com 4 arquetipos de comportamento:

- **Economico** (Rainha/Princesa) — Prioriza recursos e cartas
- **Militar** (Ferreiro/Soldado) — Foco agressivo em exercito
- **Diplomatico** (Amante) — Estabilidade e influencia
- **Estrategico** (Mestre Programador) — Jogo equilibrado

### Multiplayer

Batalhas online em tempo real via WebSocket:

- Crie ou entre em salas
- Reconexao automatica
- Servidor autoritativo (anti-cheat)

---

## Sistema de Ranks

Progressao local baseada em MMR:

| Patente | Pontos |
|---------|--------|
| Recruta | 0 — 99 |
| Bronze | 100 — 299 |
| Prata | 300 — 499 |
| Ouro | 500 — 799 |
| Mestre do Reino | 800+ |

Vitoria: **+25 pts** | Derrota: **-15 pts**

---

## Estrutura do Projeto

```
reino-em-conflito/
├── index.html              # Menu principal
├── singleplayer.html       # Modo singleplayer
├── multiplayer.html        # Modo multiplayer
├── tutorial.html           # Guia do jogo
├── ranks.html              # Patentes e historico
├── jogar.bat               # Launcher automatico
│
├── server/
│   └── server.js           # Servidor Node.js + Socket.IO
│
├── js/
│   ├── main.js             # Logica do menu
│   ├── singleplayer.js     # Engine do singleplayer + IA
│   ├── multiplayer.js      # Cliente Socket.IO
│   ├── combat-system.js    # Combate tatico (grid 3x3)
│   ├── rank-system.js      # Sistema de patentes (MMR)
│   ├── audio-system.js     # Web Audio API
│   ├── music-system.js     # Trilhas sonoras
│   ├── visual-effects.js   # Particulas, auras, clima
│   ├── game-integration.js # Orquestrador de sistemas
│   ├── settings.js         # Painel de configuracoes
│   └── shared/
│       ├── characters.js   # 9 personagens
│       ├── cards.js         # Sistema de cartas
│       ├── constants.js     # Constantes do jogo
│       ├── utils.js         # Utilitarios
│       └── server-utils.js  # Bridge servidor
│
├── css/                    # Estilos e efeitos
├── images/                 # Assets visuais
│   ├── characters/         # Artes dos personagens
│   └── cartas/             # Artes das cartas
└── music/                  # Trilhas sonoras
```

## Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript ES6+ (sem frameworks)
- **Backend:** Node.js + Express
- **Tempo Real:** Socket.IO 4.7
- **Audio:** Web Audio API (osciladores sintetizados + MP3)
- **Persistencia:** localStorage (ranks)

---

## Licenca

MIT
