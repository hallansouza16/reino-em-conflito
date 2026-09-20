# Reino em Conflito - Atualização: Ranks & Tutorial

Esta documentação resume as novidades implementadas na versão mais recente, com foco em retenção de jogadores e escalabilidade do metajogo. O objetivo foi criar uma curva de aprendizado suave (Tutorial) e um sistema de retenção e recompensa (Ranks) local.

## 🏆 1. Sistema de Patentes e Histórico (Ranks)

Um novo módulo `js/rank-system.js` foi adicionado à raiz do jogo mantendo uma arquitetura de metadados simples através de `localStorage` do HTML5.

### Como funciona?
Sempre que uma partida no modo **Singleplayer** ou **Multiplayer** acaba, o motor de jogo intercepta a declaração de vitória ou derrota e emite um evento local que processa o ganho ou perda do seu "Rating Mismatch Rate" (MMR/PDL).

### Sistema de Escalada:
- **Vitórias**: +25 pontos.
- **Derrotas**: -15 pontos.

### Patentes Disponíveis:
Dependendo de sua pontuação local acumulada, você ostentará um título visível no "Menu Principal":
1. **🪵 Recruta** (0 a 99 Pontos)
2. **🥉 Bronze** (100 a 299 Pontos)
3. **🥈 Prata** (300 a 499 Pontos)
4. **🥇 Ouro** (500 a 799 Pontos)
5. **👑 Mestre do Reino** (Acima de 800 Pontos)

Além do Raking, o modal exibe a **Taxa de Vitória** exata de todas as suas partidas registradas.

## 📜 2. Tutorial In-Game

A tela de entrada (`index.html`) recebeu, além do botão de Ranks, um botão prático de **Tutorial**.
O Layout de Botões agora lista:
- 👑 `Singleplayer`
- ⚔️ `Multiplayer`
- 📜 `Tutorial`
- 🏆 `Ranks`

## 📜 2. Interfaces Dedicadas e Componentização

Seguindo o altíssimo padrão de arquitetura modular do seu projeto, removemos a poluição que poderia nascer no `index.html`. Em vez de usar modais simples da web na tela principal, construímos páginas separadas, no mesmo estilo de `singleplayer.html` e `multiplayer.html`:
- **`tutorial.html`**: A página estática que hospeda o Guia do Mestre de Jogo.
- **`ranks.html`**: A nova tela interativa que lê e popula os dados visuais do jogador (o seu Local Storage injetado pela raiz via `rank-system.js`).

Agora os botões navegam por `window.location.href`, criando aquele estilo de carregamento fluido de menus reais do seu projeto. Além disso, reajustamos o eixo visual, dando a essas telas exclusivas uma prioridade no plano 3D (através do CSS `position: relative` e `z-index: 1`) para evitar que a capa escura (`background-overlay`) escurecesse as conquistas.

## 🛠️ Detalhes Estilísticos e de Código
- Tudo foi injetado de maneira "não-destrutiva". A classe `RankSystem` atua de forma global como `window.RankSystem` para ser chamada com segurança até nas âncoras locais do modo multiplayer!
- Elementos importaram CSS nativo `btn-icon`, classes `.menu-btn` e o mesmo cabeçalho que você implementou, impedindo distorções visuais do Reino em Conflito!
