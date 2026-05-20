/**
 * 端游经典版地图配置 — 包含地理坐标、区域、类型供 WorldMapScreen 使用
 */

/** @typedef {{ key: string, name: string, level: number, tags?: string[], skillPool?: string[] }} WendaoSpawn */
/** @typedef {{ id: string, name: string, levelRange: [number, number], blurb?: string, region: string, type: string, pos: {x:number,y:number}, spawns: WendaoSpawn[] }} WendaoMap */

export const MAP_TYPES = {
  野外: { color: 'var(--bamboo)',    label: '野外' },
  副本: { color: 'var(--vermilion)', label: '副本' },
  阵法: { color: 'var(--ink)',       label: '阵法' },
  海域: { color: '#4a7ea0',          label: '海域' },
  秘境: { color: '#8a5ab0',          label: '秘境' },
}

export const WENDAO_MAPS = /** @type {WendaoMap[]} */ ([
  // ── 中原初期 ──────────────────────────────────────────────────────────
  {
    id: 'lanxian_wai',
    name: '揽仙镇外',
    levelRange: [1, 20],
    blurb: '揽仙镇周边荒野，初入江湖的起点，野兽出没，适合磨砺新人。',
    region: '中原',
    type: '野外',
    pos: { x: 10, y: 68 },
    spawns: [
      { key: 'qingwa',  name: '青蛙',  level: 2,  tags: ['aquatic'] },
      { key: 'songshu', name: '松鼠',  level: 3,  tags: ['beast'] },
    ],
  },
  {
    id: 'wolong_po',
    name: '卧龙坡',
    levelRange: [1, 20],
    blurb: '地势平缓的山坡，兔与蛇共生，新手修炼的第一块试炼场。',
    region: '中原',
    type: '野外',
    pos: { x: 17, y: 56 },
    spawns: [
      { key: 'tuzi', name: '兔子', level: 6,  tags: ['beast'] },
      { key: 'she',  name: '蛇',   level: 8,  tags: ['beast', 'venom'] },
    ],
  },
  {
    id: 'guandao_nanbei',
    name: '官道南/北',
    levelRange: [1, 20],
    blurb: '连接中原各地的官道，狐狸、野狗横行，是升级的必经之路。',
    region: '中原',
    type: '野外',
    pos: { x: 24, y: 63 },
    spawns: [
      { key: 'houzi',       name: '猴子',  level: 10, tags: ['beast'] },
      { key: 'shanmao',     name: '山猫',  level: 11, tags: ['beast'] },
      { key: 'huli_guandao',name: '狐狸',  level: 13, tags: ['beast', 'fox'] },
      { key: 'yegou',       name: '野狗',  level: 14, tags: ['beast'] },
    ],
  },
  {
    id: 'taoliulin',
    name: '桃柳林',
    levelRange: [1, 20],
    blurb: '桃树柳树交织的幽静林地，桃精与柳鬼在此修炼，宠物宝宝时有出没。',
    region: '中原',
    type: '野外',
    pos: { x: 14, y: 76 },
    spawns: [
      { key: 'taojing', name: '桃精', level: 17, tags: ['wood', 'spirit'] },
      { key: 'liugui',  name: '柳鬼', level: 18, tags: ['wood', 'ghost'] },
    ],
  },
  // ── 中原中期 ──────────────────────────────────────────────────────────
  {
    id: 'xuanyuan_miao',
    name: '轩辕庙',
    levelRange: [21, 40],
    blurb: '古老的轩辕神庙，白猿与猛鹰盘踞庙宇内外，是中级修士的历练之所。',
    region: '中原',
    type: '副本',
    pos: { x: 33, y: 50 },
    spawns: [
      { key: 'baiyuan', name: '白猿', level: 22, tags: ['beast'] },
      { key: 'ying',    name: '鹰',   level: 23, tags: ['bird'] },
    ],
  },
  {
    id: 'beiha_shatan',
    name: '北海沙滩',
    levelRange: [21, 40],
    blurb: '北海之滨，海浪拍打金黄沙滩，海龟与水鸟守护此地，防御型灵兽多出于此。',
    region: '北海',
    type: '野外',
    pos: { x: 27, y: 30 },
    spawns: [
      { key: 'haigui',  name: '海龟', level: 25, tags: ['aquatic', 'tank'] },
      { key: 'ying_bh', name: '鹰',   level: 26, tags: ['bird'] },
    ],
  },
  {
    id: 'xuanyuan_fen',
    name: '轩辕坟',
    levelRange: [21, 40],
    blurb: '轩辕上古战场遗址，阴气浓重，蝙蝠、僵尸、鬼火盘踞多层墓穴。',
    region: '中原',
    type: '副本',
    pos: { x: 40, y: 64 },
    spawns: [
      { key: 'bianfu',    name: '蝙蝠',   level: 27, tags: ['beast', 'dark'] },
      { key: 'mang',      name: '蟒',     level: 30, tags: ['beast', 'venom'] },
      { key: 'jiangshi',  name: '僵尸',   level: 33, tags: ['undead'] },
      { key: 'guihuoying',name: '鬼火萤', level: 38, tags: ['insect', 'ghost'] },
    ],
  },
  {
    id: 'shilipo',
    name: '十里坡',
    levelRange: [21, 40],
    blurb: '绵延十里的丘陵，狼群与虎啸之声不绝，是中原最凶险的野外之一。',
    region: '中原',
    type: '野外',
    pos: { x: 43, y: 54 },
    spawns: [
      { key: 'lang_slp', name: '狼',   level: 30, tags: ['beast'] },
      { key: 'laohu',    name: '老虎', level: 32, tags: ['beast'] },
    ],
  },
  {
    id: 'wupai_shantou',
    name: '五派山头',
    levelRange: [21, 40],
    blurb: '五大门派各据一处山头，山中灵兽众多，常有师门任务在此展开。',
    region: '北海',
    type: '野外',
    pos: { x: 50, y: 37 },
    spawns: [
      { key: 'lang_wp',  name: '狼',   level: 35, tags: ['beast'] },
      { key: 'laohu_wp', name: '老虎', level: 35, tags: ['beast'] },
    ],
  },
  // ── 中期洞窟 ──────────────────────────────────────────────────────────
  {
    id: 'wulong_ku',
    name: '五龙窟',
    levelRange: [41, 60],
    blurb: '五条巨龙盘踞的深邃洞窟，共五层，五行各属龙脉之气充盈，核心练级圣地。',
    region: '东域',
    type: '副本',
    pos: { x: 56, y: 62 },
    spawns: [
      { key: 'wulong',     name: '乌龙',   level: 42, tags: ['dragon', 'aquatic'] },
      { key: 'huayao',     name: '花妖',   level: 42, tags: ['wood', 'spirit'] },
      { key: 'yanlong',    name: '炎龙',   level: 45, tags: ['dragon', 'fire'] },
      { key: 'yuren',      name: '鱼人',   level: 45, tags: ['aquatic', 'humanoid'] },
      { key: 'binglong',   name: '冰龙',   level: 48, tags: ['dragon', 'ice'] },
      { key: 'dilieshou',  name: '地裂兽', level: 48, tags: ['beast', 'earth'] },
      { key: 'qinglong',   name: '青龙',   level: 51, tags: ['dragon', 'wood'] },
      { key: 'jintoutuo',  name: '金头陀', level: 51, tags: ['humanoid', 'metal'] },
      { key: 'huanglong',  name: '黄龙',   level: 54, tags: ['dragon', 'earth'] },
      { key: 'huoya',      name: '火鸦',   level: 54, tags: ['bird', 'fire'] },
    ],
  },
  {
    id: 'penglai_dao',
    name: '蓬莱岛',
    levelRange: [41, 60],
    blurb: '仙雾缭绕的东海神岛，巨蜥与石魔守护岛上秘宝，风景绝美却危机四伏。',
    region: '东海',
    type: '野外',
    pos: { x: 79, y: 56 },
    spawns: [
      { key: 'juxi',  name: '巨蜥', level: 50, tags: ['beast', 'venom'] },
      { key: 'shimo', name: '石魔', level: 52, tags: ['element', 'earth'] },
    ],
  },
  {
    id: 'youming_jian',
    name: '幽冥涧',
    levelRange: [41, 60],
    blurb: '阴气汇聚的深涧，屈魂怨鬼徘徊其中，是处理魂魄类任务的关键地点。',
    region: '东域',
    type: '秘境',
    pos: { x: 61, y: 74 },
    spawns: [
      { key: 'quhun',   name: '屈魂', level: 57, tags: ['ghost'] },
      { key: 'yuangui', name: '怨鬼', level: 58, tags: ['ghost', 'dark'] },
    ],
  },
  // ── 高级地图 ──────────────────────────────────────────────────────────
  {
    id: 'baihua_gu',
    name: '百花谷',
    levelRange: [61, 80],
    blurb: '七层奇幻花谷，五色衣仙子栖居，灵兽宝宝稀有率极高，是后期养宠圣地。',
    region: '百花谷',
    type: '副本',
    pos: { x: 51, y: 23 },
    spawns: [
      { key: 'fengyi',   name: '粉衣仙子', level: 62, tags: ['humanoid', 'wood'] },
      { key: 'dianjing', name: '电精',     level: 63, tags: ['spirit', 'thunder'] },
      { key: 'qingyi',   name: '青衣仙子', level: 65, tags: ['humanoid', 'wood'] },
      { key: 'yushou',   name: '雨兽',     level: 66, tags: ['beast', 'aquatic'] },
      { key: 'huangyi',  name: '黄衣仙子', level: 68, tags: ['humanoid', 'earth'] },
      { key: 'fengguai', name: '风怪',     level: 69, tags: ['spirit', 'wind'] },
      { key: 'hongyi',   name: '红衣仙子', level: 71, tags: ['humanoid', 'fire'] },
      { key: 'hongyao',  name: '虹妖',     level: 72, tags: ['spirit'] },
      { key: 'ziyi',     name: '紫衣仙子', level: 74, tags: ['humanoid', 'thunder'] },
      { key: 'xuenv',    name: '雪女',     level: 75, tags: ['humanoid', 'ice'] },
      { key: 'lanyi',    name: '蓝衣仙子', level: 77, tags: ['humanoid', 'water'] },
      { key: 'yunshou',  name: '云兽',     level: 78, tags: ['beast', 'cloud'] },
      { key: 'baiyi',    name: '白衣仙子', level: 80, tags: ['humanoid', 'ghost'] },
      { key: 'leiguai',  name: '雷怪',     level: 81, tags: ['spirit', 'thunder'] },
    ],
  },
  // ── 阵法禁地 ──────────────────────────────────────────────────────────
  {
    id: 'jueren_zhen',
    name: '绝人阵',
    levelRange: [61, 100],
    blurb: '上古封印阵法，石牛妖与骷髅战将镇守，凶险异常，高手方可涉足。',
    region: '阵法',
    type: '阵法',
    pos: { x: 66, y: 41 },
    spawns: [
      { key: 'shiniuyao',      name: '石牛妖',   level: 82, tags: ['element', 'earth'] },
      { key: 'kulou_zhanjiang',name: '骷髅战将', level: 83, tags: ['undead'] },
    ],
  },
  {
    id: 'juexian_zhen',
    name: '绝仙阵',
    levelRange: [81, 100],
    blurb: '传说中连仙人也难以逃脱的阵法，蓝毛巨兽与螳螂怪分布其中。',
    region: '阵法',
    type: '阵法',
    pos: { x: 73, y: 29 },
    spawns: [
      { key: 'lanmaojushou', name: '蓝毛巨兽', level: 87, tags: ['beast'] },
      { key: 'tanglangguai', name: '螳螂怪',   level: 88, tags: ['insect'] },
    ],
  },
  {
    id: 'dijue_zhen',
    name: '地绝阵',
    levelRange: [81, 100],
    blurb: '地底深处的封印阵，三头巨犬与嗜血巨人守卫禁地核心，堪称地狱副本。',
    region: '阵法',
    type: '阵法',
    pos: { x: 79, y: 41 },
    spawns: [
      { key: 'santouquanan', name: '三头巨犬', level: 92, tags: ['beast', 'dark'] },
      { key: 'shixuejuren',  name: '嗜血巨人', level: 93, tags: ['humanoid', 'blood'] },
    ],
  },
  {
    id: 'tianjue_zhen',
    name: '天绝阵',
    levelRange: [81, 100],
    blurb: '天穹之上的至高阵法，炎魔与寒冰怪对峙，是问道后期最高难度地图之一。',
    region: '阵法',
    type: '阵法',
    pos: { x: 80, y: 28 },
    spawns: [
      { key: 'lianmo',     name: '炼魔',   level: 97, tags: ['demon', 'fire'] },
      { key: 'hanbingguai',name: '寒冰怪', level: 98, tags: ['element', 'ice'] },
    ],
  },
  // ── 远域后期 ──────────────────────────────────────────────────────────
  {
    id: 'haidi_migong',
    name: '海底迷宫',
    levelRange: [100, 120],
    blurb: '深海龙宫外围迷宫，虾兵蟹将层层把守，传说迷宫深处藏有龙族秘宝。',
    region: '东海',
    type: '海域',
    pos: { x: 87, y: 62 },
    spawns: [
      { key: 'xiabing',  name: '虾兵', level: 102, tags: ['aquatic', 'humanoid'] },
      { key: 'xiejiang', name: '蟹将', level: 103, tags: ['aquatic', 'humanoid'] },
    ],
  },
  {
    id: 'kunlun_yunhai',
    name: '昆仑云海',
    levelRange: [100, 120],
    blurb: '西北昆仑山脉之巅，云雾缭绕，冰晶龙鳞兽与金翅鸢翱翔云间。',
    region: '远域',
    type: '秘境',
    pos: { x: 37, y: 13 },
    spawns: [
      { key: 'bingjinglonglinshou', name: '冰晶龙鳞兽', level: 107, tags: ['dragon', 'ice'] },
      { key: 'jinchiyuan',          name: '金翅鸢',     level: 108, tags: ['bird', 'metal'] },
    ],
  },
  {
    id: 'xueyu_bingyuan',
    name: '雪域冰原',
    levelRange: [100, 120],
    blurb: '极北冰原，朔风凛冽，雪狐与剑魂在漫天大雪中修炼，堪称人间绝境。',
    region: '远域',
    type: '野外',
    pos: { x: 22, y: 17 },
    spawns: [
      { key: 'xuehu',   name: '雪狐', level: 112, tags: ['beast', 'ice', 'fox'] },
      { key: 'jianhun', name: '剑魂', level: 113, tags: ['ghost', 'metal'] },
    ],
  },
])

// ── 世界 BOSS ──────────────────────────────────────────────────────────────
export const WENDAO_WORLD_BOSSES = [
  { key: 'yangtouguai',      name: '羊头怪',     level: 20,  mapId: 'wolong_po',      mapName: '卧龙坡',    partyMin: 3, notes: '约8小时刷新' },
  { key: 'niutouguai',       name: '牛头怪',     level: 30,  mapId: 'guandao_nanbei', mapName: '官道南',    partyMin: 3, notes: '稀有首饰等' },
  { key: 'bainian_heixiong', name: '百年黑熊精', level: 40,  mapId: 'wupai_shantou',  mapName: '五派山头',  partyMin: 3 },
  { key: 'bainian_kuangshi', name: '百年狂狮怪', level: 50,  mapId: 'wulong_ku',      mapName: '五龙窟五层', partyMin: 3 },
  { key: 'bainian_ciwei',    name: '百年刺猬精', level: 60,  mapId: 'penglai_dao',    mapName: '蓬莱岛',    partyMin: 3 },
  { key: 'bainian_zhuyao',   name: '百年猪妖',   level: 70,  mapId: 'baihua_gu',      mapName: '百花谷三',  partyMin: 3 },
  { key: 'baihuaxiu',        name: '百花羞',     level: 90,  mapId: 'baihua_gu',      mapName: '百花谷七',  partyMin: 3 },
  { key: 'niumowang',        name: '牛魔王',     level: 100, mapId: 'jueren_zhen',    mapName: '绝人阵',    partyMin: 3 },
  { key: 'yechawang',        name: '夜叉王',     level: 110, mapId: 'juexian_zhen',   mapName: '绝仙阵',    partyMin: 3 },
]

export const DEFAULT_MAP_ID = 'lanxian_wai'

export function getMapById(id) {
  return WENDAO_MAPS.find(m => m.id === id) ?? WENDAO_MAPS.find(m => m.id === DEFAULT_MAP_ID)
}

export function listMapSummaries() {
  return WENDAO_MAPS.map(m => ({
    id: m.id, name: m.name, levelRange: m.levelRange, blurb: m.blurb,
    region: m.region, type: m.type, pos: m.pos, spawnCount: m.spawns.length,
  }))
}

export function getWorldBossByKey(key) {
  return WENDAO_WORLD_BOSSES.find(b => b.key === key) ?? null
}

/** 按推荐等级挑练级图（落在 levelRange 内优先） */
export function suggestMapIdForLevel(level) {
  const L = Math.max(1, level)
  const scored = WENDAO_MAPS.map(m => {
    const [lo, hi] = m.levelRange
    if (L >= lo && L <= hi) return { id: m.id, score: 0 }
    return { id: m.id, score: L < lo ? lo - L : L - hi }
  })
  scored.sort((a, b) => a.score - b.score)
  return scored[0]?.id ?? DEFAULT_MAP_ID
}

/** 推断怪物主属性（供 UI 显示元素图标） */
export function inferSpawnElement(tags = []) {
  const T = new Set(tags)
  if (T.has('fire'))    return '火'
  if (T.has('ice'))     return '冰'
  if (T.has('aquatic') || T.has('water')) return '水'
  if (T.has('wood') || T.has('spirit') || T.has('wind')) return '木'
  if (T.has('metal') || T.has('thunder')) return '金'
  if (T.has('earth') || T.has('element')) return '土'
  if (T.has('dark') || T.has('ghost') || T.has('undead')) return '暗'
  return '无'
}
