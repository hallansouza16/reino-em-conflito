// js/combat-system.js - VERSÃO CORRIGIDA
class CombatSystem {
    constructor() {
        this.isActive = false;
        this.currentAction = null;
        this.selectedCell = null;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.combatModal = null;
        this.init();
    }

    init() {
        console.log('✨ CombatSystem inicializado');
    }

    // Iniciar combate entre dois jogadores
    startCombat(attacker, defender, onCombatEnd) {
        this.isActive = true;
        this.attacker = attacker;
        this.defender = defender;
        this.onCombatEnd = onCombatEnd;
        this.currentTurn = 'player';
        
        // Calcular unidades baseadas no exército REAL
        this.playerUnits = this.calculateUnits(attacker.army);
        this.enemyUnits = this.calculateUnits(defender.army);
        
        this.showCombatModal();
    }

    calculateUnits(armySize) {
        const units = [];
        // Baseado no tamanho real do exército
        const unitCount = Math.min(Math.max(1, Math.floor(armySize / 5)), 6); // Máximo 6 unidades
        
        for (let i = 0; i < unitCount; i++) {
            // Saúde proporcional ao tamanho do exército
            const baseHealth = Math.max(20, Math.floor(armySize / unitCount));
            const health = Math.min(100, baseHealth + Math.floor(Math.random() * 20));
            
            units.push({
                id: i,
                health: health,
                maxHealth: health,
                position: i,
                alive: true,
                type: armySize > 15 ? 'veterano' : 'recruta' // Tipo baseado na força
            });
        }
        
        return units;
    }

    showCombatModal() {
        // Criar modal de combate no estilo do jogo
        const combatModal = document.createElement('div');
        combatModal.id = 'combat-modal-overlay';
        combatModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        combatModal.innerHTML = this.generateCombatHTML();
        
        document.body.appendChild(combatModal);
        this.combatModal = combatModal;
        
        // Configurar event listeners após o DOM ser renderizado
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    }

    generateCombatHTML() {
        return `
            <div class="combat-modal" style="
                background: linear-gradient(135deg, var(--color-card) 0%, var(--color-surface) 100%);
                border: 5px solid var(--color-gold);
                border-radius: 15px;
                padding: 20px;
                max-width: 95%;
                max-height: 95%;
                overflow: auto;
                box-shadow: 0 0 50px rgba(241, 196, 15, 0.5);
                position: relative;
                width: 1000px;
            ">
                <div class="combat-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid var(--color-gold);
                    padding-bottom: 10px;
                ">
                    <h2 style="color: var(--color-gold); margin: 0; font-size: 1.8em;">⚔️ COMBATE ESTRATÉGICO</h2>
                    <button id="close-combat" class="combat-close-btn" style="
                        background: var(--color-instability);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 1.2em;
                    ">X</button>
                </div>

                <!-- Informações dos Reinos -->
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; margin-bottom: 20px; align-items: center;">
                    <!-- Atacante -->
                    <div class="kingdom-info attacker-info" style="
                        background: linear-gradient(135deg, var(--color-army) 0%, rgba(39, 174, 96, 0.3) 100%);
                        padding: 15px;
                        border-radius: 10px;
                        border: 2px solid var(--color-army);
                    ">
                        <h3 style="color: var(--color-text-light); margin: 0 0 10px 0; text-align: center;">🎯 ATACANTE</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div>
                                <strong style="color: var(--color-gold);">Reino:</strong><br>
                                <span style="color: var(--color-text-light);">${this.attacker.charName}</span>
                            </div>
                            <div>
                                <strong style="color: var(--color-gold);">Exército:</strong><br>
                                <span style="color: var(--color-text-light);">${this.attacker.army} soldados</span>
                            </div>
                            <div>
                                <strong style="color: var(--color-gold);">Moedas:</strong><br>
                                <span style="color: var(--color-text-light);">${this.attacker.coins} 💰</span>
                            </div>
                            <div>
                                <strong style="color: var(--color-gold);">Influência:</strong><br>
                                <span style="color: var(--color-text-light);">${this.attacker.influence} ✨</span>
                            </div>
                        </div>
                    </div>

                    <!-- VS -->
                    <div style="text-align: center;">
                        <div style="display: inline-block; background: var(--color-surface); padding: 10px 20px; border-radius: 20px; border: 3px solid var(--color-gold);">
                            <strong style="color: var(--color-gold); font-size: 1.2em;">VS</strong>
                        </div>
                    </div>

                    <!-- Defensor -->
                    <div class="kingdom-info defender-info" style="
                        background: linear-gradient(135deg, var(--color-instability) 0%, rgba(192, 57, 43, 0.3) 100%);
                        padding: 15px;
                        border-radius: 10px;
                        border: 2px solid var(--color-instability);
                    ">
                        <h3 style="color: var(--color-text-light); margin: 0 0 10px 0; text-align: center;">🛡️ DEFENSOR</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div>
                                <strong style="color: var(--color-gold);">Reino:</strong><br>
                                <span style="color: var(--color-text-light);">${this.defender.charName}</span>
                            </div>
                            <div>
                                <strong style="color: var(--color-gold);">Exército:</strong><br>
                                <span style="color: var(--color-text-light);">${this.defender.army} soldados</span>
                            </div>
                            <div>
                                <strong style="color: var(--color-gold);">Moedas:</strong><br>
                                <span style="color: var(--color-text-light);">${this.defender.coins} 💰</span>
                            </div>
                            <div>
                                <strong style="color: var(--color-gold);">Influência:</strong><br>
                                <span style="color: var(--color-text-light);">${this.defender.influence} ✨</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="combat-content" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    align-items: start;
                ">
                    <!-- Coluna Esquerda - Controles -->
                    <div class="combat-controls" style="
                        background: var(--color-surface);
                        padding: 20px;
                        border-radius: 10px;
                        border: 3px solid var(--color-border);
                    ">
                        <div class="turn-indicator player-turn" style="
                            background: var(--color-army);
                            color: white;
                            padding: 12px;
                            border-radius: 8px;
                            text-align: center;
                            margin-bottom: 20px;
                            font-weight: bold;
                            font-size: 1.1em;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                        ">
                            <div>🎮 SEU TURNO</div>
                            <div style="font-size: 0.8em; opacity: 0.9;">${this.attacker.charName}</div>
                        </div>
                        
                        <div class="action-bar" style="
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 12px;
                            margin-bottom: 20px;
                        ">
                            <button class="action-btn attack-btn" data-action="attack" style="
                                background: linear-gradient(135deg, var(--color-instability) 0%, #cc2222 100%);
                                border: 3px solid var(--color-bg-dark);
                                color: white;
                                padding: 15px;
                                border-radius: 10px;
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 1.1em;
                                transition: all 0.2s;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                            ">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.5em;">⚔️</span>
                                    <span>ATAQUE</span>
                                </div>
                                <div style="font-size: 0.8em; opacity: 0.8;">Causa dano ao inimigo</div>
                            </button>
                            
                            <button class="action-btn defend-btn" data-action="defend" style="
                                background: linear-gradient(135deg, var(--color-army) 0%, #2244cc 100%);
                                border: 3px solid var(--color-bg-dark);
                                color: white;
                                padding: 15px;
                                border-radius: 10px;
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 1.1em;
                                transition: all 0.2s;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                            ">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.5em;">🛡️</span>
                                    <span>DEFESA</span>
                                </div>
                                <div style="font-size: 0.8em; opacity: 0.8;">Cura unidades aliadas</div>
                            </button>
                            
                            <button class="action-btn special-btn" data-action="special" style="
                                background: linear-gradient(135deg, var(--color-gold) 0%, #d4af37 100%);
                                border: 3px solid var(--color-bg-dark);
                                color: var(--color-text-dark);
                                padding: 15px;
                                border-radius: 10px;
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 1.1em;
                                transition: all 0.2s;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                            ">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.5em;">✨</span>
                                    <span>ATAQUE ESPECIAL</span>
                                </div>
                                <div style="font-size: 0.8em; opacity: 0.8;">Dano em área</div>
                            </button>
                        </div>

                        <div class="utility-bar" style="
                            display: grid;
                            grid-template-columns: 1fr 1fr 1fr;
                            gap: 10px;
                            margin-bottom: 20px;
                        ">
                            <button class="utility-btn view-btn" data-function="view" style="
                                background: var(--color-bg-medium);
                                border: 2px solid var(--color-border);
                                color: white;
                                padding: 12px 8px;
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s;
                                font-size: 0.9em;
                            ">
                                👁️<br>VISÃO
                            </button>
                            <button class="utility-btn boost-btn" data-function="boost" style="
                                background: var(--color-shop);
                                border: 2px solid var(--color-border);
                                color: white;
                                padding: 12px 8px;
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s;
                                font-size: 0.9em;
                            ">
                                💪<br>BÔNUS
                            </button>
                            <button class="utility-btn retreat-btn" data-function="retreat" style="
                                background: var(--color-instability);
                                border: 2px solid var(--color-border);
                                color: white;
                                padding: 12px 8px;
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s;
                                font-size: 0.9em;
                            ">
                                🏃<br>RECUAR
                            </button>
                        </div>

                        <div class="instructions" style="
                            background: rgba(0, 0, 0, 0.3);
                            padding: 15px;
                            border-radius: 8px;
                            border-left: 4px solid var(--color-gold);
                        ">
                            <h4 style="color: var(--color-gold); margin: 0 0 15px 0; text-align: center;">📋 INSTRUÇÕES DE COMBATE</h4>
                            
                            <div style="display: grid; gap: 8px;">
                                <div style="display: flex; align-items: start; gap: 10px;">
                                    <span style="color: var(--color-gold); font-weight: bold; min-width: 20px;">1.</span>
                                    <span style="color: var(--color-text-light); font-size: 0.9em;">
                                        <strong>Selecione uma ação:</strong><br>
                                        • <span style="color: var(--color-instability);">⚔️ ATAQUE</span> - Causa dano às tropas inimigas<br>
                                        • <span style="color: var(--color-army);">🛡️ DEFESA</span> - Cura e fortalece suas tropas<br>
                                        • <span style="color: var(--color-gold);">✨ ESPECIAL</span> - Ataque em área (dano a todos)
                                    </span>
                                </div>
                                
                                <div style="display: flex; align-items: start; gap: 10px;">
                                    <span style="color: var(--color-gold); font-weight: bold; min-width: 20px;">2.</span>
                                    <span style="color: var(--color-text-light); font-size: 0.9em;">
                                        <strong>Clique na grade para executar:</strong><br>
                                        • <span style="color: var(--color-instability);">🔴 Células Vermelhas</span> - Tropas INIMIGAS (Atacar)<br>
                                        • <span style="color: var(--color-army);">🟢 Células Verdes</span> - Tropas ALIADAS (Defender)<br>
                                        • <span style="color: var(--color-gold);">🟡 Célula Dourada</span> - Ponto neutro (Especial)
                                    </span>
                                </div>
                                
                                <div style="display: flex; align-items: start; gap: 10px;">
                                    <span style="color: var(--color-gold); font-weight: bold; min-width: 20px;">3.</span>
                                    <span style="color: var(--color-text-light); font-size: 0.9em;">
                                        <strong>Estratégia:</strong><br>
                                        • Elimine todas as tropas inimigas para vencer<br>
                                        • Mantenha suas tropas vivas com defesas<br>
                                        • Use o ataque especial quando cercado
                                    </span>
                                </div>
                                
                                <div style="display: flex; align-items: start; gap: 10px;">
                                    <span style="color: var(--color-gold); font-weight: bold; min-width: 20px;">4.</span>
                                    <span style="color: var(--color-text-light); font-size: 0.9em;">
                                        <strong>Recursos:</strong><br>
                                        • Seu exército: <strong>${this.attacker.army} soldados</strong><br>
                                        • Inimigo: <strong>${this.defender.army} soldados</strong><br>
                                        • Cada unidade representa parte do seu exército
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna Direita - Grade e Status -->
                    <div class="combat-display" style="
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    ">
                        <!-- Grade de Combate -->
                        <div class="combat-grid-container" style="
                            background: radial-gradient(circle, var(--color-bg-dark) 0%, #1a1a1a 100%);
                            border-radius: 15px;
                            padding: 25px;
                            border: 3px solid var(--color-border);
                            text-align: center;
                        ">
                            <h3 style="color: var(--color-gold); margin: 0 0 20px 0; font-size: 1.3em;">🎯 CAMPO DE BATALHA</h3>
                            
                            <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 15px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 15px; height: 15px; background: var(--color-army); border-radius: 3px;"></div>
                                    <span style="color: var(--color-text-light); font-size: 0.9em;">Suas Tropas</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 15px; height: 15px; background: var(--color-instability); border-radius: 3px;"></div>
                                    <span style="color: var(--color-text-light); font-size: 0.9em;">Tropas Inimigas</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 15px; height: 15px; background: var(--color-gold); border-radius: 3px;"></div>
                                    <span style="color: var(--color-text-light); font-size: 0.9em;">Ponto Neutro</span>
                                </div>
                            </div>
                            
                            <div class="combat-grid" style="
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                grid-template-rows: repeat(3, 1fr);
                                gap: 10px;
                                max-width: 350px;
                                margin: 0 auto;
                            ">
                                ${this.generateGrid()}
                            </div>
                        </div>

                        <!-- Status das Unidades -->
                        <div class="status-section" style="
                            background: var(--color-surface);
                            padding: 20px;
                            border-radius: 10px;
                            border: 3px solid var(--color-border);
                        ">
                            <h3 style="color: var(--color-gold); margin: 0 0 20px 0; text-align: center; font-size: 1.3em;">📊 STATUS DAS TROPAS</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <!-- Jogador -->
                                <div class="player-status-section">
                                    <h4 style="color: var(--color-army); margin: 0 0 15px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                        <span>🎪 SUAS TROPAS</span>
                                        <span style="background: var(--color-army); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em;">
                                            ${this.playerUnits.filter(u => u.health > 0).length}/${this.playerUnits.length} vivas
                                        </span>
                                    </h4>
                                    <div id="player-status" class="status-units" style="max-height: 200px; overflow-y: auto;">
                                        ${this.renderPlayerStatus()}
                                    </div>
                                </div>
                                
                                <!-- Inimigo -->
                                <div class="enemy-status-section">
                                    <h4 style="color: var(--color-instability); margin: 0 0 15px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                        <span>👹 TROPAS INIMIGAS</span>
                                        <span style="background: var(--color-instability); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em;">
                                            ${this.enemyUnits.filter(u => u.health > 0).length}/${this.enemyUnits.length} vivas
                                        </span>
                                    </h4>
                                    <div id="enemy-status" class="status-units" style="max-height: 200px; overflow-y: auto;">
                                        ${this.renderEnemyStatus()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Log de Combate -->
                <div class="combat-log-container" style="
                    margin-top: 20px;
                    background: var(--color-surface);
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid var(--color-border);
                ">
                    <h4 style="color: var(--color-gold); margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
                        📜 LOG DE COMBATE
                        <span style="font-size: 0.8em; color: var(--color-text-light);">(últimas ações)</span>
                    </h4>
                    <div id="combat-log" class="message-log" style="
                        height: 120px;
                        overflow-y: auto;
                        background: rgba(0, 0, 0, 0.3);
                        padding: 10px;
                        border-radius: 5px;
                        border: 1px solid var(--color-border);
                        font-size: 0.9em;
                    ">
                        <div class="message system-message" style="
                            color: var(--color-gold);
                            margin: 5px 0;
                            padding: 8px;
                            background: rgba(241, 196, 15, 0.1);
                            border-radius: 5px;
                            border-left: 3px solid var(--color-gold);
                        ">
                            <strong>⚔️ COMBATE INICIADO!</strong><br>
                            ${this.attacker.charName} (${this.attacker.army} soldados) vs ${this.defender.charName} (${this.defender.army} soldados)
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateGrid() {
        let gridHTML = '';
        const positions = [
            { row: 0, col: 0, type: 'enemy' },
            { row: 0, col: 1, type: 'enemy' },
            { row: 0, col: 2, type: 'enemy' },
            { row: 1, col: 0, type: 'player' },
            { row: 1, col: 1, type: 'neutral' },
            { row: 1, col: 2, type: 'player' },
            { row: 2, col: 0, type: 'player' },
            { row: 2, col: 1, type: 'enemy' },
            { row: 2, col: 2, type: 'player' }
        ];

        positions.forEach(pos => {
            const icon = pos.type === 'enemy' ? '⚔️' : 
                        pos.type === 'player' ? '🗡️' : '✦';
            const bgColor = pos.type === 'enemy' ? 'var(--color-instability)' : 
                          pos.type === 'player' ? 'var(--color-army)' : 'var(--color-gold)';
            const textColor = pos.type === 'neutral' ? 'var(--color-text-dark)' : 'white';
            
            gridHTML += `
                <div class="grid-cell" data-row="${pos.row}" data-col="${pos.col}" data-type="${pos.type}" style="
                    background: linear-gradient(135deg, ${bgColor} 0%, ${this.darkenColor(bgColor)} 100%);
                    border: 3px solid var(--color-border);
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    aspect-ratio: 1;
                    transition: all 0.3s ease;
                    font-size: 1.8em;
                    color: ${textColor};
                ">
                    ${icon}
                </div>
            `;
        });

        return gridHTML;
    }

    darkenColor(color) {
        // Função simples para escurecer cores (para gradientes)
        if (color === 'var(--color-instability)') return 'var(--color-bg-dark)';
        if (color === 'var(--color-army)') return 'var(--color-bg-medium)';
        if (color === 'var(--color-gold)') return 'var(--color-bg-medium)';
        return color;
    }

    renderPlayerStatus() {
        return this.playerUnits.map(unit => `
            <div class="status-unit" style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: rgba(39, 174, 96, 0.1);
                border-radius: 5px;
                margin-bottom: 5px;
                border-left: 3px solid var(--color-army);
            ">
                <span style="font-size: 1.2em;">${unit.health > 0 ? '🧍' : '💀'}</span>
                <div style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: var(--color-text-light); font-size: 0.9em;">Unidade ${unit.id + 1}</span>
                        <span style="color: var(--color-army); font-weight: bold;">${unit.health}/${unit.maxHealth}</span>
                    </div>
                    <div style="background: var(--color-bg-dark); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="
                            height: 100%; 
                            background: linear-gradient(90deg, var(--color-army) 0%, #66ff66 100%);
                            width: ${(unit.health / unit.maxHealth) * 100}%;
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderEnemyStatus() {
        return this.enemyUnits.map(unit => `
            <div class="status-unit" style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: rgba(192, 57, 43, 0.1);
                border-radius: 5px;
                margin-bottom: 5px;
                border-left: 3px solid var(--color-instability);
            ">
                <span style="font-size: 1.2em;">${unit.health > 0 ? '👹' : '💀'}</span>
                <div style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: var(--color-text-light); font-size: 0.9em;">Unidade ${unit.id + 1}</span>
                        <span style="color: var(--color-instability); font-weight: bold;">${unit.health}/${unit.maxHealth}</span>
                    </div>
                    <div style="background: var(--color-bg-dark); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="
                            height: 100%; 
                            background: linear-gradient(90deg, var(--color-instability) 0%, #ff6666 100%);
                            width: ${(unit.health / unit.maxHealth) * 100}%;
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        if (!this.combatModal) return;
        
        // Delegation para todos os eventos
        this.combatModal.addEventListener('click', (e) => {
            // Botões de ação
            if (e.target.closest('.action-btn')) {
                const actionBtn = e.target.closest('.action-btn');
                const action = actionBtn.dataset.action;
                this.selectAction(action);
                return;
            }
            
            // Células da grade
            if (e.target.closest('.grid-cell')) {
                const cell = e.target.closest('.grid-cell');
                if (this.currentAction && this.currentTurn === 'player') {
                    this.selectCell(cell);
                }
                return;
            }
            
            // Botões de utilidade
            if (e.target.closest('.utility-btn')) {
                const utilityBtn = e.target.closest('.utility-btn');
                const functionType = utilityBtn.dataset.function;
                this.useUtility(functionType);
                return;
            }
            
            // Fechar modal
            if (e.target.id === 'close-combat' || e.target.closest('#close-combat')) {
                this.endCombat('retreat');
                return;
            }
        });

        // Efeitos hover
        this.addHoverEffects();
    }

    addHoverEffects() {
        if (!this.combatModal) return;
        
        // Efeitos para botões de ação
        this.combatModal.addEventListener('mouseover', (e) => {
            if (e.target.closest('.action-btn') && !e.target.closest('.action-btn').classList.contains('selected')) {
                e.target.closest('.action-btn').style.transform = 'translateY(-2px)';
                e.target.closest('.action-btn').style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
            }
            
            if (e.target.closest('.grid-cell') && this.currentAction && this.currentTurn === 'player') {
                e.target.closest('.grid-cell').style.transform = 'scale(1.05)';
                e.target.closest('.grid-cell').style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
            }
        });

        this.combatModal.addEventListener('mouseout', (e) => {
            if (e.target.closest('.action-btn') && !e.target.closest('.action-btn').classList.contains('selected')) {
                e.target.closest('.action-btn').style.transform = 'translateY(0)';
                e.target.closest('.action-btn').style.boxShadow = 'none';
            }
            
            if (e.target.closest('.grid-cell') && !e.target.closest('.grid-cell').classList.contains('selected')) {
                e.target.closest('.grid-cell').style.transform = 'scale(1)';
                e.target.closest('.grid-cell').style.boxShadow = 'none';
            }
        });
    }

    selectAction(action) {
        console.log('🎯 Ação selecionada:', action);
        this.currentAction = action;
        
        if (!this.combatModal) return;
        
        // Remover seleção anterior
        const actionBtns = this.combatModal.querySelectorAll('.action-btn');
        if (actionBtns) {
            actionBtns.forEach(btn => {
                btn.classList.remove('selected');
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
        }
        
        // Adicionar seleção atual
        const selectedBtn = this.combatModal.querySelector(`[data-action="${action}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
            selectedBtn.style.transform = 'translateY(-3px)';
            selectedBtn.style.boxShadow = '0 0 15px rgba(241, 196, 15, 0.5)';
        }
        
        this.addCombatLog(`Ação selecionada: ${this.getActionName(action)}`);
    }

    selectCell(cell) {
        if (!this.currentAction || !cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellType = cell.dataset.type;

        console.log('🎯 Célula selecionada:', { row, col, type: cellType });

        if (!this.combatModal) return;

        // Remover seleção anterior
        const gridCells = this.combatModal.querySelectorAll('.grid-cell');
        if (gridCells) {
            gridCells.forEach(c => {
                c.classList.remove('selected');
                c.style.transform = 'scale(1)';
                c.style.boxShadow = 'none';
                c.style.borderColor = 'var(--color-border)';
            });
        }

        // Adicionar seleção atual
        cell.classList.add('selected');
        cell.style.borderColor = 'var(--color-gold)';
        cell.style.transform = 'scale(1.05)';
        cell.style.boxShadow = '0 0 15px rgba(241, 196, 15, 0.7)';
        this.selectedCell = { row, col, type: cellType };

        // Executar ação
        this.executeAction();
    }

    executeAction() {
        if (!this.currentAction || !this.selectedCell) return;

        const { type } = this.selectedCell;
        
        console.log('⚡ Executando ação:', this.currentAction, 'em célula:', type);
        
        switch (this.currentAction) {
            case 'attack':
                if (type === 'enemy') {
                    this.attackEnemy();
                } else {
                    this.addCombatLog('❌ Só pode atacar células inimigas!', 'system-message');
                }
                break;
                
            case 'defend':
                if (type === 'player') {
                    this.defendUnit();
                } else {
                    this.addCombatLog('❌ Só pode defender unidades aliadas!', 'system-message');
                }
                break;
                
            case 'special':
                this.useSpecialAbility();
                break;
        }

        // Limpar seleção após ação
        this.currentAction = null;
        this.selectedCell = null;
        
        if (this.combatModal) {
            const actionBtns = this.combatModal.querySelectorAll('.action-btn');
            if (actionBtns) {
                actionBtns.forEach(btn => {
                    btn.classList.remove('selected');
                    btn.style.transform = 'translateY(0)';
                    btn.style.boxShadow = 'none';
                });
            }
        }
    }

    attackEnemy() {
        const damage = this.calculateDamage();
        const enemyIndex = this.findEnemyAtPosition(this.selectedCell.row, this.selectedCell.col);
        
        if (enemyIndex !== -1 && this.enemyUnits[enemyIndex].health > 0) {
            this.enemyUnits[enemyIndex].health = Math.max(0, this.enemyUnits[enemyIndex].health - damage);
            
            // Efeito visual
            this.showDamageEffect(this.selectedCell, damage);
            this.addCombatLog(`💥 Causou ${damage} de dano às tropas inimigas!`, 'player-message');
            
            // Atualizar UI
            this.updateStatusBars();
            
            // Verificar se inimigo foi derrotado
            if (this.enemyUnits[enemyIndex].health <= 0) {
                this.enemyUnits[enemyIndex].alive = false;
                this.addCombatLog(`🎯 Unidade inimiga derrotada!`, 'system-message');
            }
            
            // Verificar fim do combate
            if (this.checkCombatEnd()) return;
            
            // Turno do inimigo
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    defendUnit() {
        const playerIndex = this.findPlayerAtPosition(this.selectedCell.row, this.selectedCell.col);
        
        if (playerIndex !== -1) {
            const healAmount = 20;
            this.playerUnits[playerIndex].health = Math.min(
                this.playerUnits[playerIndex].maxHealth,
                this.playerUnits[playerIndex].health + healAmount
            );
            
            this.addCombatLog(`🛡️ Unidade curada em ${healAmount} pontos!`, 'player-message');
            this.updateStatusBars();
            
            // Efeito visual de defesa
            if (this.combatModal) {
                const cell = this.combatModal.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
                if (cell) {
                    cell.classList.add('shielded');
                    setTimeout(() => cell.classList.remove('shielded'), 1000);
                }
            }
            
            // Turno do inimigo
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    useSpecialAbility() {
        const specialDamage = this.calculateDamage() * 1.5;
        
        // Ataque em área - afeta todas as unidades inimigas
        let totalDamage = 0;
        this.enemyUnits.forEach(unit => {
            if (unit.health > 0) {
                const damage = Math.floor(specialDamage * 0.7);
                unit.health = Math.max(0, unit.health - damage);
                totalDamage += damage;
            }
        });
        
        this.addCombatLog(`🔥 ATAQUE ESPECIAL! Causou ${totalDamage} de dano total!`, 'player-message');
        this.updateStatusBars();
        
        // Efeito visual especial
        if (this.combatModal) {
            const enemyCells = this.combatModal.querySelectorAll('[data-type="enemy"]');
            if (enemyCells) {
                enemyCells.forEach(cell => {
                    this.showDamageEffect(cell, Math.floor(specialDamage * 0.7));
                });
            }
        }
        
        if (this.checkCombatEnd()) return;
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        this.currentTurn = 'enemy';
        
        if (this.combatModal) {
            const turnIndicator = this.combatModal.querySelector('.turn-indicator');
            if (turnIndicator) {
                turnIndicator.textContent = 'TURNO INIMIGO';
                turnIndicator.className = 'turn-indicator enemy-turn';
                turnIndicator.style.background = 'var(--color-instability)';
            }
        }
        
        this.addCombatLog('⚡ Vez do inimigo...', 'enemy-message');
        
        // IA simples do inimigo
        setTimeout(() => {
            const alivePlayerUnits = this.playerUnits.filter(unit => unit.health > 0);
            if (alivePlayerUnits.length > 0) {
                const randomUnit = alivePlayerUnits[Math.floor(Math.random() * alivePlayerUnits.length)];
                const damage = this.calculateDamage() * 0.8; // Inimigo mais fraco
                
                randomUnit.health = Math.max(0, randomUnit.health - damage);
                
                this.addCombatLog(`💀 Inimigo causou ${damage} de dano!`, 'enemy-message');
                this.updateStatusBars();
                
                // Efeito visual
                const playerCell = this.findPlayerCell(randomUnit.id);
                if (playerCell) {
                    this.showDamageEffect(playerCell, damage);
                }
            }
            
            // Verificar fim do combate
            if (this.checkCombatEnd()) return;
            
            // Voltar para o jogador
            this.currentTurn = 'player';
            if (this.combatModal) {
                const playerTurnIndicator = this.combatModal.querySelector('.turn-indicator');
                if (playerTurnIndicator) {
                    playerTurnIndicator.textContent = 'SEU TURNO';
                    playerTurnIndicator.className = 'turn-indicator player-turn';
                    playerTurnIndicator.style.background = 'var(--color-army)';
                }
            }
            
            this.addCombatLog('✅ Seu turno!', 'system-message');
            
        }, 1500);
    }

    useUtility(functionType) {
        switch (functionType) {
            case 'view':
                this.addCombatLog('👁️ Analisando campo de batalha...', 'system-message');
                break;
            case 'boost':
                // Bônus para próxima ação
                this.addCombatLog('✨ Poder de ataque aumentado!', 'system-message');
                break;
            case 'retreat':
                this.endCombat('retreat');
                break;
        }
    }

    calculateDamage() {
        const baseDamage = 25;
        const variance = Math.random() * 10;
        return Math.floor(baseDamage + variance);
    }

    findEnemyAtPosition(row, col) {
        // Mapeamento simples de posições
        const positionMap = { '00': 0, '01': 1, '02': 2 };
        return positionMap[`${row}${col}`];
    }

    findPlayerAtPosition(row, col) {
        const positionMap = { '10': 0, '12': 1, '20': 2, '22': 3 };
        return positionMap[`${row}${col}`];
    }

    findPlayerCell(unitId) {
        if (!this.combatModal) return null;
        const positionMap = { 0: '[data-row="1"][data-col="0"]', 1: '[data-row="1"][data-col="2"]', 2: '[data-row="2"][data-col="0"]', 3: '[data-row="2"][data-col="2"]' };
        return this.combatModal.querySelector(positionMap[unitId]);
    }

    showDamageEffect(cell, damage) {
        if (!cell) return;
        
        const damageElement = document.createElement('div');
        damageElement.className = 'damage-number';
        damageElement.textContent = `-${damage}`;
        damageElement.style.cssText = `
            position: absolute;
            font-weight: bold;
            font-size: 18px;
            color: #ff3333;
            text-shadow: 0 0 3px black;
            z-index: 10;
            animation: floatUp 1s ease-out forwards;
        `;
        cell.appendChild(damageElement);
        
        // Efeito de flash
        const attackEffect = document.createElement('div');
        attackEffect.className = 'attack-effect';
        attackEffect.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 8px;
            animation: flash 0.3s ease-out;
            z-index: 2;
        `;
        cell.appendChild(attackEffect);
        
        setTimeout(() => {
            if (damageElement.parentNode) damageElement.parentNode.removeChild(damageElement);
            if (attackEffect.parentNode) attackEffect.parentNode.removeChild(attackEffect);
        }, 1000);
    }

    updateStatusBars() {
        if (!this.combatModal) return;
        
        const playerStatus = this.combatModal.querySelector('#player-status');
        const enemyStatus = this.combatModal.querySelector('#enemy-status');
        
        if (playerStatus) playerStatus.innerHTML = this.renderPlayerStatus();
        if (enemyStatus) enemyStatus.innerHTML = this.renderEnemyStatus();
    }

    addCombatLog(message, className = 'system-message') {
        if (!this.combatModal) return;
        
        const log = this.combatModal.querySelector('#combat-log');
        if (log) {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${className}`;
            
            // Estilização baseada no tipo de mensagem
            let bgColor = 'rgba(241, 196, 15, 0.1)';
            let borderColor = 'var(--color-gold)';
            let textColor = 'var(--color-gold)';
            
            if (className.includes('player-message')) {
                bgColor = 'rgba(39, 174, 96, 0.1)';
                borderColor = 'var(--color-army)';
                textColor = 'var(--color-army)';
            } else if (className.includes('enemy-message')) {
                bgColor = 'rgba(192, 57, 43, 0.1)';
                borderColor = 'var(--color-instability)';
                textColor = 'var(--color-instability)';
            }
            
            messageElement.style.cssText = `
                color: ${textColor};
                margin: 5px 0;
                padding: 8px;
                background: ${bgColor};
                border-radius: 5px;
                border-left: 3px solid ${borderColor};
                font-size: 0.9em;
            `;
            
            messageElement.innerHTML = message;
            log.appendChild(messageElement);
            log.scrollTop = log.scrollHeight;
        }
    }

    checkCombatEnd() {
        const playerAlive = this.playerUnits.some(unit => unit.health > 0);
        const enemyAlive = this.enemyUnits.some(unit => unit.health > 0);
        
        if (!playerAlive) {
            this.endCombat('defeat');
            return true;
        }
        
        if (!enemyAlive) {
            this.endCombat('victory');
            return true;
        }
        
        return false;
    }

    endCombat(result) {
        this.isActive = false;
        
        // Calcular resultados
        const playerCasualties = this.playerUnits.filter(unit => unit.health <= 0).length;
        const enemyCasualties = this.enemyUnits.filter(unit => unit.health <= 0).length;
        
        // Remover modal
        if (this.combatModal) {
            this.combatModal.remove();
            this.combatModal = null;
        }
        
        // Chamar callback com resultados
        if (this.onCombatEnd) {
            this.onCombatEnd({
                result: result,
                playerCasualties: playerCasualties,
                enemyCasualties: enemyCasualties,
                attacker: this.attacker,
                defender: this.defender
            });
        }
    }

    getActionName(action) {
        const names = {
            'attack': 'Ataque',
            'defend': 'Defesa', 
            'special': 'Habilidade Especial'
        };
        return names[action] || action;
    }
}

// Instância global
if (typeof window !== 'undefined') {
    window.combatSystem = new CombatSystem();
}

export default CombatSystem;