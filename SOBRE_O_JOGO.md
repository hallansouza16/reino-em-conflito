# 👑 REINO EM CONFLITO

**Reino em Conflito** é um jogo de estratégia medieval baseado em turnos, onde o jogador assume o papel de um monarca que deve gerenciar recursos, expandir seu exército e manter a estabilidade de seu reino enquanto enfrenta rivais em busca do domínio total.

---

## 🎮 Modos de Jogo

### ⚔️ Multiplayer Real-Time
Enfrente outros jogadores em batalhas estratégicas. O sistema utiliza **Socket.io** para garantir uma experiência fluida e sincronizada, com um sistema de salas (lobbies) e reconexão automática.

### 👤 Singleplayer
Aperfeiçoe suas táticas jogando contra uma Inteligência Artificial (IA) desafiadora. Ideal para treinar a gestão de recursos e entender as mecânicas antes de ir para o campo de batalha real.

---

## ⚙️ Mecânicas Principais

### 💎 Gestão de Recursos
Para prosperar, você precisará equilibrar quatro pilares fundamentais:
*   **Moedas:** Usadas para contratar tropas e construir fortificações.
*   **Comida:** Essencial para sustentar seu exército (o upkeep consome comida por turno).
*   **Exército:** Sua força militar para atacar e se defender.
*   **Influência:** Mantém a ordem e reduz a instabilidade.

### ⚡ Pontos de Ação (AP)
Cada turno é limitado por **Pontos de Ação**. Você deve escolher sabiamente entre:
*   **Minerar:** Coletar moedas e comida (possui cooldown).
*   **Recrutar:** Aumentar o tamanho das suas tropas.
*   **Fortificar:** Reduzir a instabilidade do reino.
*   **Guerra:** Lançar um ataque direto contra o oponente.

### 📉 Sistema de Instabilidade e Manutenção
Ter um exército gigante ou um reino desorganizado gera custos:
*   **Fome:** Se a comida acabar, seus soldados começarão a desertar.
*   **Instabilidade:** Se a instabilidade atingir o limite máximo, seu reino entra em colapso e o jogo termina.

---

## 🏆 Condições de Vitória
Vencer o seu oponente exige estratégia:
1.  **Conquista Militar:** Derrote o exército inimigo e saqueie seus tesouros.
2.  **Colapso Político:** Force o oponente a atingir o limite de **Instabilidade**, causando uma rebelião em suas terras.

---

## 🛠️ Tecnologias Utilizadas
*   **Frontend:** HTML5, CSS3, JavaScript (ES6+ Modules).
*   **Backend:** Node.js, Express.
*   **Comunicação:** Socket.io (WebSockets).
*   **Design:** Tema medieval minimalista com efeitos visuais e sonoros imersivos.

---

> *"No Reino em Conflito, a espada é afiada, mas a mente estratégica é a verdadeira arma do rei."*
