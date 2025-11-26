// 属性计算工具
// 根据力量、体质、灵力、敏捷计算战斗属性
// 参考问道游戏属性系统

import { calculateElementBonus } from './elements'
import { getAllEquipmentStats } from './equipment'

/**
 * 计算战斗属性
 * @param {Object} baseAttrs - 基础属性 {strength, constitution, spirit, agility}
 * @param {number} level - 等级
 * @param {Object} elementPoints - 相性点 {gold, wood, water, fire, earth}
 * @param {Object} equipmentStats - 装备属性
 * @returns {Object} 战斗属性 {attack, defense, speed, maxHp, maxMp, hitRate, magicDamage, spellDamageBonus, spellResistance}
 */
export function calculateBattleStats(baseAttrs, level = 1, elementPoints = null, equipmentStats = {}) {
  const { 
    strength = 0,      // 力量：影响物理攻击力和命中率
    constitution = 0,  // 体质：影响气血和防御力
    spirit = 0,        // 灵力：影响法力和法术伤害
    agility = 0        // 敏捷：影响攻击顺序（速度）
  } = baseAttrs
  
  // 基础物理攻击力 = 基础攻击 + 力量 * 2.5 + 等级加成
  let attack = 10 + strength * 2.5 + level * 1
  
  // 基础防御力 = 基础防御 + 体质 * 2 + 等级加成
  let defense = 5 + Math.floor(constitution * 2) + level * 0.5
  
  // 基础速度 = 基础速度 + 敏捷 * 2 + 等级加成
  let speed = 5 + Math.floor(agility * 2) + level * 0.5
  
  // 基础生命值（气血）= 基础生命 + 体质 * 12 + 等级 * 20
  let maxHp = 100 + constitution * 12 + level * 20
  
  // 基础法力值 = 基础法力 + 灵力 * 3 + 等级 * 10
  let maxMp = 50 + spirit * 3 + level * 10
  
  // 基础命中率 = 基础命中 + 力量 * 0.5（百分比）
  let hitRate = 80 + strength * 0.5
  
  // 基础法术伤害加成 = 基础 + 灵力 * 1.5%
  let magicDamage = 1.0 + spirit * 0.015
  
  // 加上装备属性
  attack += (equipmentStats.attack || 0) + (equipmentStats.strength || 0) * 2.5
  defense += (equipmentStats.defense || 0) + (equipmentStats.constitution || 0) * 2
  speed += (equipmentStats.speed || 0) + (equipmentStats.agility || 0) * 2
  maxHp += (equipmentStats.maxHp || 0) + (equipmentStats.constitution || 0) * 12
  maxMp += (equipmentStats.maxMp || 0) + (equipmentStats.spirit || 0) * 3
  
  // 相性点加成
  if (elementPoints) {
    const elementBonus = calculateElementBonus(elementPoints)
    
    // 相性点对属性的影响
    attack += elementBonus.attackBonus
    defense += elementBonus.defenseBonus
    speed += elementBonus.speedBonus
    maxHp += elementBonus.hpBonus
    magicDamage *= elementBonus.spellAttackBonus
  }
  
  return {
    attack: Math.floor(attack),
    defense: Math.floor(defense),
    speed: Math.floor(speed),
    maxHp: Math.floor(maxHp),
    maxMp: Math.floor(maxMp),
    hitRate: Math.min(100, Math.floor(hitRate)), // 命中率最高100%
    magicDamage: magicDamage, // 法术伤害倍率
    spellDamageBonus: elementPoints ? calculateElementBonus(elementPoints).spellDamageBonus : null,
    spellResistance: elementPoints ? calculateElementBonus(elementPoints).spellResistance : null,
  }
}

/**
 * 更新玩家的战斗属性
 * @param {Object} player - 玩家对象
 * @param {Object} elementPoints - 相性点
 * @param {Object} equipmentStats - 装备属性
 * @returns {Object} 更新后的玩家对象
 */
export function updatePlayerBattleStats(player, elementPoints = null, equipmentStats = {}) {
  const battleStats = calculateBattleStats(
    {
      strength: player.strength || 0,
      constitution: player.constitution || 0,
      spirit: player.spirit || 0,
      agility: player.agility || 0,
    },
    player.level,
    elementPoints,
    equipmentStats
  )
  
  return {
    ...player,
    attack: battleStats.attack,
    defense: battleStats.defense,
    speed: battleStats.speed,
    maxHp: battleStats.maxHp,
    maxMp: battleStats.maxMp,
    hitRate: battleStats.hitRate,
    magicDamage: battleStats.magicDamage,
    spellDamageBonus: battleStats.spellDamageBonus,
    spellResistance: battleStats.spellResistance,
    // 确保当前HP/MP不超过最大值
    hp: Math.min(player.hp || battleStats.maxHp, battleStats.maxHp),
    mp: Math.min(player.mp || battleStats.maxMp, battleStats.maxMp),
  }
}
