# Reino em Conflito

Um jogo de estratégia medieval turn-based com modos Singleplayer e Multiplayer online.

## 🎮 Sobre o Jogo

**Reino em Conflito** é um jogo de estratégia onde você controla um reino medieval e compete contra outro jogador (ou IA) para dominar o território.

### Mecânicas Principais:

- **Turnos alternados** com Pontos de Ação (AP)
- **4 Ações disponíveis:**
  - ⛏️ **Minerar** - Gera Moedas e Comida
  - ⚔️ **Recrutar** - Aumenta seu exército
  - 🏰 **Fortificar** - Reduz instabilidade
  - ⚔️ **Guerrear** - Conquiste seu oponente!
- **Sistema de cartas** - compre no mercado para ganhar vantagens
- **Recursos:** Moedas, Comida, Exército, Influência, Instabilidade
- **Condições de vitória:** Alcançar limite de instabilidade ou ter exército superior durante rebelião

## 🎭 Personagens

Escolha entre 8 líderes únicos, cada um com habilidades passivas especiais:

- **Rei** - +1 Moeda extra por turno
- **Rainha** - -1 Instabilidade no início do turno
- **Ferreiro** - Recrutamento custa 1 Moeda a menos
- **Ladrão** - Minerar dá +1 Moeda, mas +1 Instabilidade
- **Amante** - Cartas de oponente custam 1 a menos
- **Soldado** - Limite de exército para rebelião aumenta para 6
- **Mestre Programador** - Cartas custam -2 Moedas e +1 AP extra
- **Princesa Real** - +2 Influência e Fortificação com 50% de desconto
- **Bruxa Sábia** - Pode comprar 2 cartas por ação e efeitos podem duplicar

## 🚀 Como Executar

### Pré-requisitos

- Node.js 14+ instalado
- npm ou yarn

### Instalação

```bash
npm install
# ou
yarn install
```

### Modo Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

O servidor iniciará em `http://localhost:4000`

### Modo Produção

```bash
npm start
# ou
yarn start
```

### Acessando o Jogo

1. Abra `http://localhost:4000` no navegador
2. Escolha **Singleplayer** para jogar contra a IA
3. Escolha **Multiplayer** para criar/entrar em salas online

## 📁 Estrutura do Projeto

```
├── index.html          # Menu principal
├── singleplayer.html   # Tela do modo singleplayer
├── multiplayer.html    # Tela do modo multiplayer
├── server/
│   └── server.js       # Servidor Node.js + Socket.io
├── js/
│   ├── main.js         # Lógica do menu
│   ├── singleplayer.js # Lógica do singleplayer
│   ├── multiplayer.js  # Lógica do multiplayer
│   ├── audio-system.js # Sistema de áudio
│   ├── music-system.js # Sistema de música
│   ├── visual-effects.js # Efeitos visuais
│   ├── settings.js     # Sistema de configurações
│   ├── combat-system.js # Sistema de combate
│   ├── game-integration.js # Integração dos sistemas
│   ├── shared/         # Módulos compartilhados
│   │   ├── characters.js   # Definição de personagens
│   │   ├── cards.js       # Definição de cartas
│   │   ├── constants.js   # Constantes do jogo
│   │   ├── utils.js       # Funções utilitárias
│   │   └── server-utils.js # Utilitários do servidor
│   ├── sounds.js
│   └── sounds-fixed.js
├── css/
│   ├── style.css       # Estilos principais
│   ├── settings.css    # Estilos de configurações
│   └── effects.css     # Estilos de efeitos
├── images/             # Assets visuais
│   ├── characters/
│   └── cartas/
├── music/              # Trilhas sonoras
├── node_modules/
├── package.json
├── yarn.lock
└── package-lock.json
```

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js + Express
- **Tempo real:** Socket.io
- **Gerenciador de pacotes:** npm/yarn

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

**Divirta-se jogando!** 🎲👑
