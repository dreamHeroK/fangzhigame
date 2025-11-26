import { maps } from './maps'
import { getAllMedicines } from './items'
import { getMonsterTemplates } from './monsters'
import { calculateBattleStats } from './attributeCalc'

const BABY_CHANCE = 0.15
const BABY_GROWTH = 1.4

const applyGrowth = (value = 0, multiplier = 1) => Math.max(1, Math.round(value * multiplier))

export function generateMonsters(player, currentMap = '揽仙镇外') {
  const monsters = []

  const mapData = maps[currentMap]
  if (!mapData || mapData.type === 'safe') {
    return monsters
  }

  let levelRange = { min: 1, max: 5 }
  
  if (mapData && mapData.monsterLevel) {
    levelRange = mapData.monsterLevel
  }

  const groupSize = mapData.monsterGroupSize || { min: 1, max: 2 }
  const groupCountRange = Math.max(groupSize.max - groupSize.min + 1, 1)
  const count = groupSize.min + Math.floor(Math.random() * groupCountRange)

  // 获取该地图的怪物模板
  const templates = getMonsterTemplates(currentMap)
  
  // 如果没有特定模板，使用默认生成（兼容其他地图）
  if (templates.length === 0) {
    return generateDefaultMonsters(player, currentMap, count, levelRange)
  }

  for (let i = 0; i < count; i++) {
    // 随机选择一个模板
    const template = templates[Math.floor(Math.random() * templates.length)]
    const isBaby = Math.random() < BABY_CHANCE
    // 如果模板有固定等级，使用固定等级；否则随机等级
    const baseLevel = template.fixedLevel || 
      Math.max(1, levelRange.min + Math.floor(Math.random() * (levelRange.max - levelRange.min + 1)))
    const finalLevel = isBaby ? 1 : baseLevel
    const growthMultiplier = isBaby ? BABY_GROWTH : 1

    // 根据基础属性计算战斗属性（确保包含所有四个属性）
    const monsterBaseAttrs = {
      strength: applyGrowth(template.baseStats.strength, growthMultiplier),
      constitution: applyGrowth(template.baseStats.constitution, growthMultiplier),
      spirit: applyGrowth(template.baseStats.spirit, growthMultiplier),
      agility: applyGrowth(template.baseStats.agility, growthMultiplier),
    }
    const battleStats = calculateBattleStats(monsterBaseAttrs, finalLevel)

    const monster = {
      id: i,
      type: template.type,
      element: template.element,
      name: isBaby ? `宝宝${template.name}` : `${template.name}${i + 1}`,
      icon: template.icon,
      level: finalLevel,
      attackType: template.attackType,
      skills: template.skills ? [...template.skills] : [],
      mp: battleStats.maxMp,
      maxMp: battleStats.maxMp,
      // 基础属性
      strength: monsterBaseAttrs.strength,
      constitution: monsterBaseAttrs.constitution,
      spirit: monsterBaseAttrs.spirit,
      agility: monsterBaseAttrs.agility,
      // 战斗属性
      ...battleStats,
      hp: battleStats.maxHp,
      captured: false,
      isBaby,
      rarity: isBaby ? 'baby' : 'normal',
    }

    monsters.push(monster)
  }

  return monsters
}

// 默认怪物生成（用于其他地图）
function generateDefaultMonsters(player, currentMap, count, levelRange) {
  const elements = ['金', '木', '水', '火', '土']
  const monsters = []

  for (let i = 0; i < count; i++) {
    const element = elements[Math.floor(Math.random() * elements.length)]
    const level = levelRange.min + Math.floor(Math.random() * (levelRange.max - levelRange.min + 1))
    const baseLevel = Math.max(1, level)
    const isBaby = Math.random() < BABY_CHANCE
    const finalLevel = isBaby ? 1 : baseLevel
    const growthMultiplier = isBaby ? BABY_GROWTH : 1

    // 使用默认基础属性
    const baseStats = {
      strength: applyGrowth(3, growthMultiplier),
      constitution: applyGrowth(3, growthMultiplier),
      spirit: applyGrowth(3, growthMultiplier),
      agility: applyGrowth(4, growthMultiplier),
    }

    const battleStats = calculateBattleStats(baseStats, finalLevel)

    const monster = {
      id: i,
      type: 'default',
      element: element,
      name: isBaby ? `宝宝${element}兽` : `${element}系怪物${i + 1}`,
      icon: '👹',
      level: finalLevel,
      attackType: 'physical',
      skills: [],
      mp: battleStats.maxMp,
      maxMp: battleStats.maxMp,
      strength: baseStats.strength,
      constitution: baseStats.constitution,
      spirit: baseStats.spirit,
      agility: baseStats.agility,
      ...battleStats,
      hp: battleStats.maxHp,
      captured: false,
      isBaby,
      rarity: isBaby ? 'baby' : 'normal',
    }

    monsters.push(monster)
  }

  return monsters
}

// 生成掉落物品
export function generateDrops(monster) {
  const drops = []
  const dropChance = 0.3 // 30%掉落率
  
  if (Math.random() < dropChance) {
    const medicines = getAllMedicines()
    const dropableMedicines = medicines.filter(med => 
      med.id === 'small_hp' || med.id === 'small_mp'
    )
    
    if (dropableMedicines.length > 0) {
      const randomMed = dropableMedicines[Math.floor(Math.random() * dropableMedicines.length)]
      drops.push({
        id: randomMed.id,
        name: randomMed.name,
        count: 1
      })
    }
  }
  
  return drops
}

