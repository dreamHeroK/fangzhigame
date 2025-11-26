// 地图配置
export const maps = {
  '揽仙镇': {
    name: '揽仙镇',
    type: 'safe', // 安全区
    level: 1,
    description: '新手村，安全区域',
    connectedMaps: ['揽仙镇外'],
    monsterLevel: null, // 安全区无怪物
    monsterGroupSize: { min: 0, max: 0 },
  },
  '揽仙镇外': {
    name: '揽仙镇外',
    type: 'wild', // 野外
    level: 1,
    description: '揽仙镇外的野外地图',
    connectedMaps: ['揽仙镇', '揽仙谷'],
    monsterLevel: { min: 1, max: 5 },
    monsterGroupSize: { min: 1, max: 2 },
  },
  '揽仙谷': {
    name: '揽仙谷',
    type: 'wild', // 野外
    level: 2,
    description: '更高等级的野外地图',
    connectedMaps: ['揽仙镇外'],
    monsterLevel: { min: 5, max: 10 },
    monsterGroupSize: { min: 1, max: 2 },
  },
}

