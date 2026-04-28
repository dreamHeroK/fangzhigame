/**
 * 端游经典版为基准的地图·等级·出没怪速查（文字游戏原创数值与技能池由引擎推导）
 * 手游若地图名有差异，仅作展示用 id/name 区分即可。
 */

/** @typedef {{ key: string, name: string, level: number, tags?: string[], skillPool?: string[], notes?: string }} WendaoSpawn */

/** @typedef {{ id: string, name: string, levelRange: [number, number], blurb?: string, spawns: WendaoSpawn[] }} WendaoMap */

/** 野外 / 迷宫 / 阵法 — 按你提供的梯队整理 */
export const WENDAO_MAPS = /** @type {WendaoMap[]} */ ([
  {
    id: 'lanxian_wai',
    name: '揽仙镇外',
    levelRange: [1, 20],
    blurb: '初期任务',
    spawns: [
      { key: 'qingwa', name: '青蛙', level: 2, tags: ['aquatic'] },
      { key: 'songshu', name: '松鼠', level: 3, tags: ['beast'] },
    ],
  },
  {
    id: 'wolong_po',
    name: '卧龙坡',
    levelRange: [1, 20],
    blurb: '新手练功',
    spawns: [
      { key: 'tuzi', name: '兔子', level: 6, tags: ['beast'] },
      { key: 'she', name: '蛇', level: 8, tags: ['beast', 'venom'] },
    ],
  },
  {
    id: 'guandao_nanbei',
    name: '官道南/北',
    levelRange: [1, 20],
    blurb: '过渡野怪',
    spawns: [
      { key: 'houzi', name: '猴子', level: 10, tags: ['beast'] },
      { key: 'shanmao', name: '山猫', level: 11, tags: ['beast'] },
      { key: 'huli_guandao', name: '狐狸', level: 13, tags: ['beast', 'fox'] },
      { key: 'yegou', name: '野狗', level: 14, tags: ['beast'] },
    ],
  },
  {
    id: 'taoliulin',
    name: '桃柳林',
    levelRange: [1, 20],
    blurb: '经典法宠区',
    spawns: [
      { key: 'taojing', name: '桃精', level: 17, tags: ['wood', 'spirit'] },
      { key: 'liugui', name: '柳鬼', level: 18, tags: ['wood', 'ghost'] },
    ],
  },
  {
    id: 'xuanyuan_miao',
    name: '轩辕庙',
    levelRange: [21, 40],
    blurb: '可携带宠物相关',
    spawns: [
      { key: 'baiyuan', name: '白猿', level: 22, tags: ['beast'] },
      { key: 'ying', name: '鹰', level: 23, tags: ['bird'] },
    ],
  },
  {
    id: 'beiha_shatan',
    name: '北海沙滩',
    levelRange: [21, 40],
    blurb: '防御型宠物',
    spawns: [
      { key: 'haigui', name: '海龟', level: 25, tags: ['aquatic', 'tank'] },
      { key: 'ying_bh', name: '鹰', level: 26, tags: ['bird'] },
    ],
  },
  {
    id: 'xuanyuan_fen',
    name: '轩辕坟（1-3层）',
    levelRange: [21, 40],
    blurb: '任务材料',
    spawns: [
      { key: 'bianfu', name: '蝙蝠', level: 27, tags: ['beast', 'dark'] },
      { key: 'mang', name: '蟒', level: 30, tags: ['beast', 'venom'] },
      { key: 'jiangshi', name: '僵尸', level: 33, tags: ['undead'] },
      { key: 'guihuoying', name: '鬼火萤', level: 38, tags: ['insect', 'ghost'] },
    ],
  },
  {
    id: 'shilipo',
    name: '十里坡',
    levelRange: [21, 40],
    blurb: '过渡练级',
    spawns: [
      { key: 'lang_slp', name: '狼', level: 30, tags: ['beast'] },
      { key: 'laohu', name: '老虎', level: 32, tags: ['beast'] },
    ],
  },
  {
    id: 'wupai_shantou',
    name: '五派山头',
    levelRange: [21, 40],
    blurb: '五龙山/乾元山等山头练功',
    spawns: [
      { key: 'lang_wp', name: '狼', level: 35, tags: ['beast'] },
      { key: 'laohu_wp', name: '老虎', level: 35, tags: ['beast'] },
    ],
  },
  {
    id: 'wulong_ku',
    name: '五龙窟（1-5层）',
    levelRange: [41, 60],
    blurb: '核心练级区',
    spawns: [
      { key: 'wulong', name: '乌龙', level: 42, tags: ['dragon', 'aquatic'] },
      { key: 'huayao', name: '花妖', level: 42, tags: ['wood', 'spirit'] },
      { key: 'yanlong', name: '炎龙', level: 45, tags: ['dragon', 'fire'] },
      { key: 'yuren', name: '鱼人', level: 45, tags: ['aquatic', 'humanoid'] },
      { key: 'binglong', name: '冰龙', level: 48, tags: ['dragon', 'ice'] },
      { key: 'dilieshou', name: '地裂兽', level: 48, tags: ['beast', 'earth'] },
      { key: 'qinglong', name: '青龙', level: 51, tags: ['dragon', 'wood'] },
      { key: 'jintoutuo', name: '金头陀', level: 51, tags: ['humanoid', 'metal'] },
      { key: 'huanglong', name: '黄龙', level: 54, tags: ['dragon', 'earth'] },
      { key: 'huoya', name: '火鸦', level: 54, tags: ['bird', 'fire'] },
    ],
  },
  {
    id: 'penglai_dao',
    name: '蓬莱岛',
    levelRange: [41, 60],
    blurb: '中期地图',
    spawns: [
      { key: 'juxi', name: '巨蜥', level: 50, tags: ['beast', 'venom'] },
      { key: 'shimo', name: '石魔', level: 52, tags: ['element', 'earth'] },
    ],
  },
  {
    id: 'youming_jian',
    name: '幽冥涧',
    levelRange: [41, 60],
    blurb: '任务怪',
    spawns: [
      { key: 'quhun', name: '屈魂', level: 57, tags: ['ghost'] },
      { key: 'yuangui', name: '怨鬼', level: 58, tags: ['ghost', 'dark'] },
    ],
  },
  {
    id: 'baihua_gu',
    name: '百花谷（1-7层）',
    levelRange: [61, 80],
    blurb: '神宠大本营',
    spawns: [
      { key: 'fengyi', name: '粉衣仙子', level: 62, tags: ['humanoid', 'wood'] },
      { key: 'dianjing', name: '电精', level: 63, tags: ['spirit', 'thunder'] },
      { key: 'qingyi', name: '青衣仙子', level: 65, tags: ['humanoid', 'wood'] },
      { key: 'yushou', name: '雨兽', level: 66, tags: ['beast', 'aquatic'] },
      { key: 'huangyi', name: '黄衣仙子', level: 68, tags: ['humanoid', 'earth'] },
      { key: 'fengguai', name: '风怪', level: 69, tags: ['spirit', 'wind'] },
      { key: 'hongyi', name: '红衣仙子', level: 71, tags: ['humanoid', 'fire'] },
      { key: 'hongyao', name: '虹妖', level: 72, tags: ['spirit'] },
      { key: 'ziyi', name: '紫衣仙子', level: 74, tags: ['humanoid', 'thunder'] },
      { key: 'xuenv', name: '雪女', level: 75, tags: ['humanoid', 'ice'] },
      { key: 'lanyi', name: '蓝衣仙子', level: 77, tags: ['humanoid', 'water'] },
      { key: 'yunshou', name: '云兽', level: 78, tags: ['beast', 'cloud'] },
      { key: 'baiyi', name: '白衣仙子', level: 80, tags: ['humanoid', 'ghost'] },
      { key: 'leiguai', name: '雷怪', level: 81, tags: ['spirit', 'thunder'] },
    ],
  },
  {
    id: 'jueren_zhen',
    name: '绝人阵',
    levelRange: [61, 100],
    blurb: '石牛妖、骷髅战将',
    spawns: [
      { key: 'shiniuyao', name: '石牛妖', level: 82, tags: ['element', 'earth'] },
      { key: 'kulou_zhanjiang', name: '骷髅战将', level: 83, tags: ['undead'] },
    ],
  },
  {
    id: 'juexian_zhen',
    name: '绝仙阵',
    levelRange: [81, 100],
    blurb: '高级阵法',
    spawns: [
      { key: 'lanmaojushou', name: '蓝毛巨兽', level: 87, tags: ['beast'] },
      { key: 'tanglangguai', name: '螳螂怪', level: 88, tags: ['insect'] },
    ],
  },
  {
    id: 'dijue_zhen',
    name: '地绝阵',
    levelRange: [81, 100],
    blurb: '高级练级',
    spawns: [
      { key: 'santouquanan', name: '三头巨犬', level: 92, tags: ['beast', 'dark'] },
      { key: 'shixuejuren', name: '嗜血巨人', level: 93, tags: ['humanoid', 'blood'] },
    ],
  },
  {
    id: 'tianjue_zhen',
    name: '天绝阵',
    levelRange: [81, 100],
    blurb: '高级练级',
    spawns: [
      { key: 'lianmo', name: '炼魔', level: 97, tags: ['demon', 'fire'] },
      { key: 'hanbingguai', name: '寒冰怪', level: 98, tags: ['element', 'ice'] },
    ],
  },
  {
    id: 'haidi_migong',
    name: '海底迷宫',
    levelRange: [100, 120],
    blurb: '海底任务',
    spawns: [
      { key: 'xiabing', name: '虾兵', level: 102, tags: ['aquatic', 'humanoid'] },
      { key: 'xiejiang', name: '蟹将', level: 103, tags: ['aquatic', 'humanoid'] },
    ],
  },
  {
    id: 'kunlun_yunhai',
    name: '昆仑云海',
    levelRange: [100, 120],
    blurb: '后期地图',
    spawns: [
      { key: 'bingjinglonglinshou', name: '冰晶龙鳞兽', level: 107, tags: ['dragon', 'ice'] },
      { key: 'jinchiyuan', name: '金翅鸢', level: 108, tags: ['bird', 'metal'] },
    ],
  },
  {
    id: 'xueyu_bingyuan',
    name: '雪域冰原',
    levelRange: [100, 120],
    blurb: '后期地图',
    spawns: [
      { key: 'xuehu', name: '雪狐', level: 112, tags: ['beast', 'ice', 'fox'] },
      { key: 'jianhun', name: '剑魂', level: 113, tags: ['ghost', 'metal'] },
    ],
  },
])

/**
 * 世界 BOSS（定时刷新、组队≥3 等为玩法备注，战斗引擎仅标记 isWorldBoss）
 */
export const WENDAO_WORLD_BOSSES = [
  { key: 'yangtouguai', name: '羊头怪', level: 20, mapId: 'wolong_po', mapName: '卧龙坡', partyMin: 3, notes: '约8小时刷新（玩法备注）' },
  { key: 'niutouguai', name: '牛头怪', level: 30, mapId: 'guandao_nanbei', mapName: '官道南', partyMin: 3, notes: '稀有首饰等（玩法备注）' },
  { key: 'bainian_heixiong', name: '百年黑熊精', level: 40, mapId: 'wupai_shantou', mapName: '五派山头', partyMin: 3, notes: '五龙山/乾元山等随机（玩法备注）' },
  { key: 'bainian_kuangshi', name: '百年狂狮怪', level: 50, mapId: 'wulong_ku', mapName: '五龙窟五层', partyMin: 3 },
  { key: 'bainian_ciwei', name: '百年刺猬精', level: 60, mapId: 'penglai_dao', mapName: '蓬莱岛', partyMin: 3 },
  { key: 'bainian_zhuyao', name: '百年猪妖', level: 70, mapId: 'baihua_gu', mapName: '百花谷三', partyMin: 3 },
  { key: 'baihuaxiu', name: '百花羞', level: 90, mapId: 'baihua_gu', mapName: '百花谷七', partyMin: 3 },
  { key: 'niumowang', name: '牛魔王', level: 100, mapId: 'jueren_zhen', mapName: '绝人阵', partyMin: 3 },
  { key: 'yechawang', name: '夜叉王', level: 110, mapId: 'juexian_zhen', mapName: '绝仙阵', partyMin: 3 },
]

export const DEFAULT_MAP_ID = 'lanxian_wai'

export function getMapById(id) {
  return WENDAO_MAPS.find((m) => m.id === id) ?? WENDAO_MAPS.find((m) => m.id === DEFAULT_MAP_ID)
}

export function listMapSummaries() {
  return WENDAO_MAPS.map((m) => ({
    id: m.id,
    name: m.name,
    levelRange: m.levelRange,
    blurb: m.blurb,
    spawnCount: m.spawns.length,
  }))
}

export function getWorldBossByKey(key) {
  return WENDAO_WORLD_BOSSES.find((b) => b.key === key) ?? null
}

/** 按推荐等级挑一张练级图（落在 levelRange 内优先，否则取最接近区间） */
export function suggestMapIdForLevel(level) {
  const L = Math.max(1, level)
  const scored = WENDAO_MAPS.map((m) => {
    const [lo, hi] = m.levelRange
    if (L >= lo && L <= hi) return { id: m.id, score: 0 }
    const dist = L < lo ? lo - L : L - hi
    return { id: m.id, score: dist }
  })
  scored.sort((a, b) => a.score - b.score)
  return scored[0]?.id ?? DEFAULT_MAP_ID
}