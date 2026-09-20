# Reino em Conflito Remaster - Onde Paramos

**Data:** 2026-09-19
**Sessao:** Primeira sessao de remaster

---

## O que foi feito

### Versao HTML (correcoes de bugs)
- Repo: https://github.com/hallansouza16/reino-em-conflito
- Renomeado de `fictional-palm-tree` para `reino-em-conflito`
- README profissional com descricao completa do jogo
- 12 bugs criticos corrigidos:
  - Cartas de Status agora aplicam o efeito de verdade
  - Aposta Arriscada corrigida (falha pune quem apostou)
  - Passivas funcionam pra ambos jogadores (removido playerNumber === 1)
  - IA nao abre mais modal de combate
  - IA seleciona cartas inteligentemente por comportamento
  - calculateCost aplica desconto pra todos os tipos de carta
  - Ultimates unicos pra todos os 9 personagens
  - Ultimate carrega em mais acoes (nao so mineracao)
  - rank-system.js carregado no singleplayer.html
  - Condicao de vitoria rebeliao militar checada corretamente
  - Variavel indicator declarada no updateUI
  - URLs de imagem corrigidas (relativo em vez de localhost)

### Remaster Electron (em progresso)
- Projeto em: `D:\reino em conflito\reino-em-conflito-remaster\`
- Electron 33 instalado e funcionando

#### Arquivos PRONTOS:
- `electron/main.js` — janela 1280x720, sem menu bar
- `src/index.html` — 7 telas separadas (Menu, Selecao, Jogo, Lobby, Espera, Tutorial, Ranks)
- `src/css/game.css` — CSS completo baseado no original (paleta, fire-glow, botoes 3D, barras coloridas)
- `src/js/engine/constants.js` — 9 personagens, 9 cartas, buildings, status, upgrades, achievements, events
- `src/js/engine/state.js` — GameState com EventEmitter, todas as mecanicas
- `src/js/engine/ai.js` — IA com 9 personagens e 7 comportamentos
- `src/js/engine/combat.js` — combate automatico
- `src/js/ui/audio.js` — 22 sons sintetizados via Web Audio API (medievais, suaves)
- `src/js/ui/renderer.js` — renderiza stats, mercado, log (PRECISA ATUALIZAR pros novos IDs)
- `src/js/ui/effects.js` — floating numbers, shake, seasons
- `src/js/ui/ranks.js` — MMR localStorage
- `src/js/app.js` — conecta engine + renderer + audio (PRECISA ATUALIZAR pros novos IDs)
- `src/assets/images/` — todas as artes originais copiadas

---

## O que FALTA fazer

### Prioridade 1: Fazer o SP funcionar
1. **Atualizar `renderer.js`** para usar os novos IDs do HTML (ex: `p1-army-fill` -> `p1-army-fill`, `p1-coins` -> `p1-coins-badge`, etc.)
2. **Atualizar `app.js`** para usar a API correta do `state.js` (getPlayer/getOpponent, retornos {success, message}, etc.)
3. **Implementar navegacao SPA** — data-goto nos botoes, transicoes entre telas
4. **Testar selecao de personagem** — grid renderiza, preview mostra, botao iniciar funciona
5. **Testar turno completo** — minerar, recrutar, fortificar, comprar carta, passar vez, IA joga
6. **Testar game over** — popup aparece, MMR atualiza, botoes funcionam

### Prioridade 2: Polish visual
7. **Floating numbers** nas mudancas de stat (ex: +4 Moedas aparece subindo)
8. **Shake** nos paineis durante combate
9. **Toast de conquista** com animacao bounce
10. **Screen flash** nos ultimates
11. **Season indicators** mudando cor do header
12. **Instability warning** painel pulsando vermelho quando >= 7

### Prioridade 3: Audio
13. **Sons nas acoes** — cada botao toca som correspondente
14. **Musica de fundo** — menu theme, battle theme
15. **Mute funciona** — para musica de verdade e nao volta
16. **Settings** — sliders de volume funcionais

### Prioridade 4: Multiplayer
17. **Socket.IO** integrado no Electron
18. **Lobby** — criar/entrar salas
19. **Jogo MP** — mesma tela do SP mas com Socket.IO
20. **Reconexao automatica**

### Prioridade 5: Extras
21. **Tela de combate dedicada** (em vez de auto-resolve)
22. **Historico de partidas** na tela de ranks
23. **Mais cartas** (expandir de 9 para 15+)
24. **Mais eventos** (expandir de 4 para 10+)
25. **Tutorial interativo** (em vez de texto estatico)

---

## Notas tecnicas

### API do GameState (state.js)
- `game.initGame(characterId, AI_CHARACTERS)` — inicia jogo
- `game.getPlayer()` / `game.getOpponent()` — acessa jogadores
- `game.mineAction(player)` — retorna `{ success, message }`
- `game.recruitAction(player)` — retorna `{ success, message }`
- `game.fortifyAction(player)` — retorna `{ success, message }`
- `game.warAction(playerIndex)` — retorna `{ needsCombat }` ou `{ success }`
- `game.buyCard(index, player)` — retorna `{ success, message }`
- `game.endTurn()` — processa upkeep, troca turno
- `game.useUltimate(player, opponent)` — retorna `{ success, message }`
- `game.calculateCost(base, player, isCard, cardType)` — custo com modificadores
- `game.checkGameOver()` — verifica fim de jogo
- `game.triggerChoiceEvent(player)` — retorna evento ou null
- `game.applyEventChoice(player, event, choiceKey)` — aplica escolha
- Propriedades: `game.turn` (0 ou 1), `game.round`, `game.season`, `game.market`, `game.gameOver`, `game.actionPoints`
- Eventos: 'log', 'gameOver', 'stateChanged', 'seasonChanged', 'achievementUnlocked', 'eventTriggered'

### IDs de elementos no novo HTML
- Stats P1: `p1-ap-fill/val`, `p1-army-fill/val`, `p1-food-fill/val`, `p1-inf-fill/val`, `p1-inst-fill/val`, `p1-cd-fill/val`
- Stats P2: mesma estrutura com `p2-`
- Moedas: `p1-coins-badge`, `p2-coins-badge`
- Briks: `p1-briks`, `p2-briks`
- Avatar: `p1-avatar`, `p2-avatar`
- Nome: `p1-name`, `p2-name`
- Status: `p1-status`, `p2-status`
- Ultimate: `p1-ult-fill`, `p2-ult-fill`, `btn-ultimate`
- Buildings: `p1-buildings`, `p2-buildings`
- Acoes: `btn-mine`, `btn-recruit`, `btn-fortify`, `btn-war`, `btn-special`, `btn-shop`, `btn-endturn`
- Mercado: `market-cards`
- Log: `log-inner`
- HUD: `hud-season`, `hud-turn`, `hud-whose`, `hud-condition`
- Popups: `popup-event`, `popup-shop`, `popup-gameover`, `ai-overlay`
