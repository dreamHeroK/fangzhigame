// 怪物配置
export const monsterTemplates = {
  '揽仙镇外': [
    {
      name: '松鼠',
      type: 'squirrel',
      element: '木',
      icon: '🐿️',
      attackType: 'physical', // 只有物理攻击
      baseStats: {
        strength: 3,
        constitution: 4,
        spirit: 2,
        agility: 5,
      },
      skills: [], // 无技能
    },
    {
      name: '青蛙',
      type: 'frog',
      element: '水',
      icon: '🐸',
      attackType: 'mixed', // 物理和法术
      baseStats: {
        strength: 2,
        constitution: 3,
        spirit: 4,
        agility: 4,
      },
      skills: [
        {
          id: 'frog_water_skill',
          name: '水弹术',
          element: '水',
          mpCost: 10,
          damage: 1.3,
          desc: '水系单体法术',
        }
      ],
    },
  ],
  '揽仙谷': [
    {
      name: '兔子',
      type: 'rabbit',
      element: '木',
      icon: '🐰',
      attackType: 'physical', // 只有物理攻击
      fixedLevel: 6, // 固定等级
      baseStats: {
        strength: 5,
        constitution: 5,
        spirit: 3,
        agility: 7,
      },
      skills: [], // 无技能
    },
    {
      name: '蛇',
      type: 'snake',
      element: '火',
      icon: '🐍',
      attackType: 'mixed', // 物理和法术
      fixedLevel: 8, // 固定等级
      baseStats: {
        strength: 6,
        constitution: 4,
        spirit: 5,
        agility: 6,
      },
      skills: [
        {
          id: 'snake_fire_skill',
          name: '火球术',
          element: '火',
          mpCost: 15,
          damage: 1.5,
          desc: '火系单体法术',
        }
      ],
    },
  ],
}

// 根据地图获取怪物模板
export function getMonsterTemplates(mapName) {
  return monsterTemplates[mapName] || []
}

