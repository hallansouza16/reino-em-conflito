// ========================================
// RANK SYSTEM - Reino em Conflito Remaster
// MMR local via localStorage
// ========================================

const STORAGE_KEY = 'reino-em-conflito-ranks';

export default class RankSystem {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return { mmr: 0, wins: 0, losses: 0 };
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) { /* ignore */ }
    }

    addWin() {
        this.data.wins++;
        this.data.mmr = Math.max(0, this.data.mmr + 25);
        this.save();
    }

    addLoss() {
        this.data.losses++;
        this.data.mmr = Math.max(0, this.data.mmr - 15);
        this.save();
    }

    getMMR() { return this.data.mmr; }
    getWins() { return this.data.wins; }
    getLosses() { return this.data.losses; }

    getWinRate() {
        const total = this.data.wins + this.data.losses;
        if (total === 0) return 0;
        return Math.round((this.data.wins / total) * 100);
    }

    getRankName() {
        const mmr = this.data.mmr;
        if (mmr >= 800) return 'Mestre do Reino';
        if (mmr >= 500) return 'Ouro';
        if (mmr >= 300) return 'Prata';
        if (mmr >= 100) return 'Bronze';
        return 'Recruta';
    }
}
