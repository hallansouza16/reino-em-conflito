// ============================================================
//  combat.js — Reino em Conflito Remaster
//  Sistema de combate: resolução automática e helpers de dano
// ============================================================

import { GAME_CONSTANTS } from './constants.js';

// ============================================================
//  Helpers internos
// ============================================================

function rollDice(sides = 6) {
  return Math.floor(Math.random() * sides) + 1;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calcula o poder de ataque de um lado do combate.
 * Considera exércitos + base + bônus de upgrade.
 */
function calculatePower(fighter) {
  let power = GAME_CONSTANTS.WAR_ARMY_BASE_ATTACK + fighter.army * 2;

  // Upgrade: espada de ferro +3
  if (fighter.upgrades && fighter.upgrades.includes('iron_sword')) power += 3;

  // Upgrade: muralha de pedra +4 (só defesa, aplicado em quem defende)
  // A chamada aplica isso via parâmetro 'isDefender'

  return power;
}

function calculateDefense(defender) {
  let defense = defender.army * 1.5;

  if (defender.upgrades && defender.upgrades.includes('stone_wall')) defense += 4;
  if (defender.buildings && defender.buildings.includes('barracks'))  defense += 2;

  return defense;
}

// ============================================================
//  resolveAutoCombat
// ============================================================

/**
 * Resolve combate automaticamente (usado pela IA ou por combate rápido).
 *
 * @param {object} attacker - jogador atacante
 * @param {object} defender - jogador defensor
 * @returns {{ result: 'victory'|'defeat'|'retreat', playerCasualties: number, enemyCasualties: number }}
 */
export function resolveAutoCombat(attacker, defender) {
  const atkPower = calculatePower(attacker)  + rollDice(6);
  const defPower = calculateDefense(defender) + rollDice(6);

  // Baixas proporcionais ao poder adversário
  const atkBaseCasualties = Math.max(0, Math.round((defPower / (atkPower + 1)) * 1.5));
  const defBaseCasualties = Math.max(0, Math.round((atkPower / (defPower + 1)) * 1.5));

  // Aleatoriedade extra
  const extraRng = rollDice(3) - 1; // 0, 1 ou 2

  let playerCasualties = clamp(atkBaseCasualties + (Math.random() < 0.3 ? extraRng : 0), 0, attacker.army);
  let enemyCasualties  = clamp(defBaseCasualties + (Math.random() < 0.3 ? extraRng : 0), 0, defender.army);

  // Determina resultado
  let result;

  if (atkPower > defPower * 1.3) {
    // Vitória decisiva — atacante perde menos
    result = 'victory';
    playerCasualties = clamp(playerCasualties - 1, 0, attacker.army);
    enemyCasualties  = clamp(enemyCasualties  + 1, 0, defender.army);
  } else if (defPower > atkPower * 1.3) {
    // Derrota — atacante sofre mais
    result = 'defeat';
    playerCasualties = clamp(playerCasualties + 1, 0, attacker.army);
    enemyCasualties  = clamp(enemyCasualties  - 1, 0, defender.army);
  } else {
    // Equilíbrio — recuo possível
    const retreatChance = 0.25;
    if (Math.random() < retreatChance) {
      result = 'retreat';
      playerCasualties = clamp(Math.floor(playerCasualties / 2), 0, attacker.army);
    } else if (atkPower >= defPower) {
      result = 'victory';
    } else {
      result = 'defeat';
    }
  }

  return { result, playerCasualties, enemyCasualties };
}

// ============================================================
//  resolvePlayerCombat — para combate manual (UI envia resultado)
// ============================================================

/**
 * Valida e normaliza o resultado de um combate manual enviado pela UI.
 *
 * @param {object} rawResult - { result, playerCasualties, enemyCasualties }
 * @param {object} attacker
 * @param {object} defender
 * @returns {{ result, playerCasualties, enemyCasualties }}
 */
export function resolvePlayerCombat(rawResult, attacker, defender) {
  return {
    result:           rawResult.result || 'retreat',
    playerCasualties: clamp(rawResult.playerCasualties ?? 0, 0, attacker.army),
    enemyCasualties:  clamp(rawResult.enemyCasualties  ?? 0, 0, defender.army),
  };
}

// ============================================================
//  getCombatPreview — preview das probabilidades (para a UI)
// ============================================================

/**
 * Retorna uma estimativa das probabilidades de vitória para exibir na UI
 * antes do combate acontecer.
 *
 * @param {object} attacker
 * @param {object} defender
 * @returns {{ winChance: number, loseChance: number, retreatChance: number }}
 */
export function getCombatPreview(attacker, defender) {
  const atkPower = calculatePower(attacker);
  const defPower = calculateDefense(defender);

  const ratio = atkPower / (atkPower + defPower);

  const winChance     = clamp(Math.round(ratio * 100), 10, 90);
  const retreatChance = 15;
  const loseChance    = clamp(100 - winChance - retreatChance, 5, 80);

  return { winChance, loseChance, retreatChance };
}
