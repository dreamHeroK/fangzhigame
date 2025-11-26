import { maps } from './maps'
import { getAllMedicines } from './items'
import { getMonsterTemplates } from './monsters'
import { calculateBattleStats } from './attributeCalc'

export function generateMonsters(player, currentMap = '揽仙镇外') {
  const count = Math.floor(Math.random() * 10) + 1 // 1-10随机
  const monsters = []

  const mapData = maps[currentMap]
  let levelRange = { min: 1, max: 5 }
  
  if (mapData && mapData.monsterLevel) {
    levelRange = mapData.monsterLevel
  }

  // 获取该地图的怪物模板
  const templates = getMonsterTemplates(currentMap)
  
  // 如果没有特定模板，使用默认生成（兼容其他地图）
  if (templates.length === 0) {
    return generateDefaultMonsters(player, currentMap, count, levelRange)
  }

  for (let i = 0; i < count; i++) {
    // 随机选择一个模板
    const template = templates[Math.floor(Math.random() * templates.length)]
    // 如果模板有固定等级，使用固定等级；否则随机等级
    const baseLevel = template.fixedLevel || 
      Math.max(1, levelRange.min + Math.floor(Math.random() * (levelRange.max - levelRange.min + 1)))

    // 根据基础属性计算战斗属性（确保包含所有四个属性）
    const monsterBaseAttrs = {
      strength: template.baseStats.strength || 0,
      constitution: template.baseStats.constitution || 0,
      spirit: template.baseStats.spirit || 0,
      agility: template.baseStats.agility || 0,
    }
    const battleStats = calculateBattleStats(monsterBaseAttrs, baseLevel)

    const monster = {
      id: i,
      type: template.type,
      element: template.element,
      name: `${template.name}${i + 1}`,
      icon: template.icon,
      level: baseLevel,
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

    // 使用默认基础属性
    const baseStats = {
      strength: 3,
      constitution: 3,
      spirit: 3,
      agility: 4,
    }

    const battleStats = calculateBattleStats(baseStats, baseLevel)

    const monster = {
      id: i,
      type: 'default',
      element: element,
      name: `${element}系怪物${i + 1}`,
      icon: '👹',
      level: baseLevel,
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

