// 装备系统

// 装备品质
export const equipmentQuality = {
  'white': { name: '普通', color: '#ffffff', multiplier: 1.0 },
  'green': { name: '优秀', color: '#00ff00', multiplier: 1.2 },
  'blue': { name: '精良', color: '#0080ff', multiplier: 1.5 },
  'purple': { name: '史诗', color: '#8000ff', multiplier: 2.0 },
  'orange': { name: '传说', color: '#ff8000', multiplier: 2.5 },
}

// 装备类型
export const equipmentTypes = {
  'weapon': { name: '武器', slot: 'weapon', icon: '⚔️' },
  'armor': { name: '护甲', slot: 'armor', icon: '🛡️' },
  'helmet': { name: '头盔', slot: 'helmet', icon: '⛑️' },
  'boots': { name: '靴子', slot: 'boots', icon: '👢' },
  'accessory': { name: '饰品', slot: 'accessory', icon: '💍' },
}

// 生成装备
export function generateEquipment(type, quality = 'white', level = 1) {
  const typeData = equipmentTypes[type]
  const qualityData = equipmentQuality[quality]
  
  if (!typeData || !qualityData) return null
  
  // 基础属性（根据装备类型）
  const baseStats = {
    weapon: { attack: 10, strength: 2 },
    armor: { defense: 8, constitution: 2 },
    helmet: { defense: 5, constitution: 1, maxHp: 20 },
    boots: { speed: 3, agility: 1 },
    accessory: { spirit: 2, maxMp: 15 },
  }
  
  const base = baseStats[type] || {}
  const multiplier = qualityData.multiplier * (1 + (level - 1) * 0.1)
  
  // 基本属性
  const mainStats = {}
  Object.keys(base).forEach(key => {
    if (key !== 'maxHp' && key !== 'maxMp') {
      mainStats[key] = Math.floor(base[key] * multiplier)
    } else {
      mainStats[key] = Math.floor(base[key] * multiplier)
    }
  })
  
  // 附加属性（随机1-3条）
  const possibleBonusStats = [
    { strength: 1 },
    { constitution: 1 },
    { spirit: 1 },
    { agility: 1 },
    { attack: 3 },
    { defense: 2 },
    { speed: 1 },
    { maxHp: 10 },
    { maxMp: 5 },
  ]
  
  const bonusCount = Math.floor(Math.random() * 3) + 1
  const bonusStats = {}
  const usedStats = new Set()
  
  for (let i = 0; i < bonusCount; i++) {
    let attempts = 0
    let statKey
    do {
      const randomStat = possibleBonusStats[Math.floor(Math.random() * possibleBonusStats.length)]
      statKey = Object.keys(randomStat)[0]
      attempts++
    } while (usedStats.has(statKey) && attempts < 10)
    
    if (!usedStats.has(statKey)) {
      usedStats.add(statKey)
      const baseValue = possibleBonusStats.find(s => Object.keys(s)[0] === statKey)[statKey]
      bonusStats[statKey] = Math.floor(baseValue * multiplier)
    }
  }
  
  return {
    id: `equip_${Date.now()}_${Math.random()}`,
    name: `${qualityData.name}${typeData.name}`,
    type: type,
    slot: typeData.slot,
    quality: quality,
    level: level,
    icon: typeData.icon,
    mainStats: mainStats,
    bonusStats: bonusStats,
  }
}

// 获取装备总属性
export function getEquipmentStats(equipment) {
  if (!equipment) return {}
  
  const stats = { ...equipment.mainStats }
  Object.keys(equipment.bonusStats || {}).forEach(key => {
    stats[key] = (stats[key] || 0) + equipment.bonusStats[key]
  })
  
  return stats
}

// 获取所有装备的总属性
export function getAllEquipmentStats(equippedItems) {
  const totalStats = {}
  
  Object.values(equippedItems).forEach(equip => {
    if (equip) {
      const stats = getEquipmentStats(equip)
      Object.keys(stats).forEach(key => {
        totalStats[key] = (totalStats[key] || 0) + stats[key]
      })
    }
  })
  
  return totalStats
}

