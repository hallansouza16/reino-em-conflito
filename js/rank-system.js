const RankSystem = {
    // Retorna os status guardados localmente
    getStats() {
        const defaultStats = { wins: 0, losses: 0, mmr: 0 };
        try {
            const data = localStorage.getItem('reinoConflito_ranks');
            if (data) return JSON.parse(data);
            return defaultStats;
        } catch (e) {
            console.error("Erro ao ler ranks", e);
            return defaultStats;
        }
    },
    // Salva o status
    saveStats(stats) {
        try {
            localStorage.setItem('reinoConflito_ranks', JSON.stringify(stats));
        } catch(e) {
            console.error("Erro ao salvar ranks", e);
        }
    },
    // Incrementa uma vitória e ganha pontos
    addWin() {
        const stats = this.getStats();
        stats.wins += 1;
        stats.mmr += 25;
        this.saveStats(stats);
    },
    // Incrementa uma derrota e perde pontos
    addLoss() {
        const stats = this.getStats();
        stats.losses += 1;
        stats.mmr = Math.max(0, stats.mmr - 15);
        this.saveStats(stats);
    },
    // Avalia o nome da patente baseada no MMR
    getRankName(mmr) {
        if (mmr < 100) return '🪵 Recruta';
        if (mmr < 300) return '🥉 Bronze';
        if (mmr < 500) return '🥈 Prata';
        if (mmr < 800) return '🥇 Ouro';
        return '👑 Mestre do Reino';
    },
    // Abre a UI do Rank
    showRankModal() {
        const stats = this.getStats();
        const rankName = this.getRankName(stats.mmr);
        
        document.getElementById('rank-modal-mmr').textContent = stats.mmr;
        document.getElementById('rank-modal-name').textContent = rankName;
        document.getElementById('rank-modal-wins').textContent = stats.wins;
        document.getElementById('rank-modal-losses').textContent = stats.losses;
        
        let winrate = 0;
        let total = stats.wins + stats.losses;
        if(total > 0) winrate = Math.round((stats.wins / total) * 100);
        document.getElementById('rank-modal-winrate').textContent = winrate + '%';
        
        document.getElementById('rank-modal').style.display = 'flex';
    },
    // Fecha a UI do Rank
    closeRankModal() {
        document.getElementById('rank-modal').style.display = 'none';
    }
};

// Deixa o módulo no escopo global para acesso fácil no index.html e outras partes do jogo
window.RankSystem = RankSystem;
