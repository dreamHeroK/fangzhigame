// 相性点系统
// 相性点影响各系法术伤害、法术抗性以及人物属性

export const elements = ['金', '木', '水', '火', '土']

// 相性点对属性的影响
export function calculateElementBonus(elementPoints) {
  const { gold = 0, wood = 0, water = 0, fire = 0, earth = 0 } = elementPoints || {}
  
  // 各系法术伤害提升（每点相性 +2%）
  const spellDamageBonus = {
    gold: 1 + gold * 0.02,
    wood: 1 + wood * 0.02,
    water: 1 + water * 0.02,
    fire: 1 + fire * 0.02,
    earth: 1 + earth * 0.02,
  }
  
  // 各系法术抗性提升（每点相性 +1%）
  const spellResistance = {
    gold: gold * 0.01,
    wood: wood * 0.01,
    water: water * 0.01,
    fire: fire * 0.01,
    earth: earth * 0.01,
  }
  
  // 人物属性提升
  // 总相性点影响基础属性
  const totalPoints = gold + wood + water + fire + earth
  
  // 法术攻击提升（每点总相性 +0.5%）
  const spellAttackBonus = 1 + totalPoints * 0.005

  // 物理攻击提升（每点总相性 +0.5%）
  const attackPercentBonus = 1 + totalPoints * 0.005
  
  // 气血上限提升（每点总相性 +10）
  const hpBonus = totalPoints * 10
  
  // 防御能力提升（每点总相性 +0.3）
  const defenseBonus = totalPoints * 0.3
  
  // 攻击速度提升（每点总相性 +0.2）
  const speedBonus = totalPoints * 0.2
  
  return {
    spellDamageBonus,
    spellResistance,
    spellAttackBonus,
    attackPercentBonus,
    hpBonus,
    defenseBonus,
    speedBonus,
  }
}

