// ========================================
// VISUAL EFFECTS - Reino em Conflito Remaster
// Floating numbers, shake, particles
// ========================================

export function floatingNumber(element, value, color = '#f1c40f') {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const num = document.createElement('div');
    num.className = 'floating-number';
    num.textContent = (value > 0 ? '+' : '') + value;
    num.style.left = `${rect.left + rect.width / 2}px`;
    num.style.top = `${rect.top}px`;
    num.style.color = color;
    document.body.appendChild(num);
    setTimeout(() => num.remove(), 1100);
}

export function shakeElement(el) {
    if (!el) return;
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}

export function showAIThinking(container, text = 'IA pensando...') {
    removeAIThinking();
    const div = document.createElement('div');
    div.className = 'ai-thinking';
    div.id = 'ai-thinking';
    div.textContent = text;
    container.appendChild(div);
}

export function removeAIThinking() {
    const el = document.getElementById('ai-thinking');
    if (el) el.remove();
}

export function applySeason(season) {
    const game = document.getElementById('screen-game');
    if (!game) return;
    game.className = 'screen active';
    const seasonClass = {
        'Primavera': 'season-spring',
        'Verao': 'season-summer',
        'Outono': 'season-autumn',
        'Inverno': 'season-winter'
    }[season];
    if (seasonClass) game.classList.add(seasonClass);
}

export function instabilityWarning(panelEl, instability) {
    if (!panelEl) return;
    if (instability >= 7) {
        panelEl.classList.add('instability-danger');
    } else {
        panelEl.classList.remove('instability-danger');
    }
}
