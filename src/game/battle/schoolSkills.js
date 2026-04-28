/**
 * 《问道》风五系技能配置：攻击(B) / 障碍(C) / 辅助(D)，阶位与等级、前置关系。
 * 技能等级上限 ≈ 人物等级×1.6（100 级后可突破为玩法备注，此处用系数上限）。
 */

export const SCHOOLS = /** @type {const} */ (['金', '木', '水', '火', '土'])

/** @typedef {'B'|'C'|'D'} SkillBranch */
/** @typedef {{ tier: number, learnCharLevel: number, prereq: null | { branch: SkillBranch, tier: number, minSkillLevel: number }, targetNote: string }} TierRule */

/** 技能等级上限系数（满级前） */
export const SKILL_LEVEL_CAP_MULT = 1.6

/** 100 级后可突破上限（玩法备注，数值仍可用 cap 或传入 override） */
export const SKILL_CAP_BREAKTHROUGH_NOTE = '100级后可突破上限（玩法备注）'

export function maxSkillLevelForChar(charLevel, opts = {}) {
  const L = Math.max(1, charLevel)
  const mult = opts.mult ?? SKILL_LEVEL_CAP_MULT
  let cap = Math.floor(L * mult)
  if (opts.after100Breakthrough && L >= 100) cap += opts.breakthroughBonus ?? 0
  return Math.max(1, cap)
}

/** 各系攻击技能名 B1~B5 */
export const ATTACK_NAMES = {
  金: ['金光乍现', '刀光剑影', '金虹贯日', '流光异彩', '逆天残刃'],
  木: ['摘叶飞花', '飞柳仙矢', '盘根错节', '落英缤纷', '鬼舞枯藤'],
  水: ['滴水穿石', '雨恨云愁', '悬河泻水', '怒波狂涛', '搅海翻江'],
  火: ['举火焚天', '星火燎原', '焰天火雨', '焦金砾石', '炼狱火海'],
  土: ['落土飞岩', '土没尘埋', '山崩地裂', '天塌地陷', '石破天惊'],
}

/** 障碍 C1~C5 */
export const OBSTACLE_NAMES = {
  金: ['流连忘返', '得意忘形', '如痴如醉', '如梦初醒', '恍若隔世'],
  木: ['见血封喉', '蛇口蜂针', '鹤顶红粉', '蝎尾蛇涎', '万蚁噬心'],
  水: ['三九严寒', '天寒地冻', '冰冻三尺', '极地冰寒', '包罗万象'],
  火: ['心醉神迷', '神魂颠倒', '魂不守舍', '魂牵梦萦', '魂不附体'],
  土: ['有心无力', '顾此失彼', '六神无主', '地束七魄', '天定三魂'],
}

/** 辅助 D1~D5 */
export const ASSIST_NAMES = {
  金: ['天生神力', '气冲斗牛', '九牛二虎', '如虎添翼', '力挽狂澜'],
  木: ['拔苗助长', '火上浇油', '水涨船高', '红花绿叶', '锦上添花'],
  水: ['防微杜渐', '铁骨铮铮', '兵来将挡', '铜墙铁壁', '天地混元'],
  火: ['十万火急', '先声夺人', '疾风迅雷', '风驰电掣', '兵贵神速'],
  土: ['鞭长莫及', '望风扑影', '化险为夷', '避实就虚', '移形换影'],
}

/** 五系障碍/辅助特色（文案，供 UI / 战报） */
export const SCHOOL_THEME = {
  金: {
    obstacle: '遗忘：无法施法，可能普攻敌人',
    assist: '辅助：提高物理攻击',
  },
  木: {
    obstacle: '中毒：持续掉血',
    assist: '辅助：回复气血',
  },
  水: {
    obstacle: '冰冻：无法行动且无敌',
    assist: '辅助：提高防御',
  },
  火: {
    obstacle: '昏睡：受击苏醒',
    assist: '辅助：提高速度',
  },
  土: {
    obstacle: '混乱：敌我不分攻击',
    assist: '辅助：提高躲闪',
  },
}

/** B 攻击线阶位规则 */
export const TIER_RULES_ATTACK = /** @type {TierRule[]} */ ([
  { tier: 1, learnCharLevel: 10, prereq: null, targetNote: '单体' },
  { tier: 2, learnCharLevel: 19, prereq: { branch: 'B', tier: 1, minSkillLevel: 30 }, targetNote: '1→2人' },
  { tier: 3, learnCharLevel: 38, prereq: { branch: 'B', tier: 2, minSkillLevel: 50 }, targetNote: '2→5人（核心群攻）' },
  { tier: 4, learnCharLevel: 60, prereq: { branch: 'B', tier: 3, minSkillLevel: 80 }, targetNote: '单体高伤' },
  { tier: 5, learnCharLevel: 100, prereq: { branch: 'B', tier: 4, minSkillLevel: 80 }, targetNote: '3→5人（后期爆发）' },
])

/** C 障碍线（二阶需 C1≥40，人物技能上限≈等级×1.6，故人物至少 25 级才能练满 C1=40） */
export const TIER_RULES_OBSTACLE = /** @type {TierRule[]} */ ([
  { tier: 1, learnCharLevel: 25, prereq: null, targetNote: '单体' },
  { tier: 2, learnCharLevel: 25, prereq: { branch: 'C', tier: 1, minSkillLevel: 40 }, targetNote: '1→2人' },
  { tier: 3, learnCharLevel: 38, prereq: { branch: 'C', tier: 2, minSkillLevel: 60 }, targetNote: '2→5人' },
  { tier: 4, learnCharLevel: 60, prereq: { branch: 'C', tier: 3, minSkillLevel: 80 }, targetNote: '强控' },
  { tier: 5, learnCharLevel: 100, prereq: { branch: 'C', tier: 4, minSkillLevel: 80 }, targetNote: '大范围控制（满级可达秒7，玩法备注）' },
])

/** D 辅助线（二阶需 D1≥30；D1 本身 40 级才学，故二阶人物门槛与一阶对齐为 40） */
export const TIER_RULES_ASSIST = /** @type {TierRule[]} */ ([
  { tier: 1, learnCharLevel: 40, prereq: null, targetNote: '单体' },
  { tier: 2, learnCharLevel: 40, prereq: { branch: 'D', tier: 1, minSkillLevel: 30 }, targetNote: '1→2人' },
  { tier: 3, learnCharLevel: 38, prereq: { branch: 'D', tier: 2, minSkillLevel: 50 }, targetNote: '2→5人' },
  { tier: 4, learnCharLevel: 60, prereq: { branch: 'D', tier: 3, minSkillLevel: 80 }, targetNote: '强化辅助' },
  { tier: 5, learnCharLevel: 100, prereq: { branch: 'D', tier: 4, minSkillLevel: 80 }, targetNote: '3→5人' },
])

function schoolSlug(school) {
  const m = { 金: 'jin', 木: 'mu', 水: 'shui', 火: 'huo', 土: 'tu' }
  return m[school] ?? 'jin'
}

/**
 * @typedef {{
 *   id: string,
 *   school: string,
 *   branch: SkillBranch,
 *   tier: number,
 *   name: string,
 *   learnCharLevel: number,
 *   prereq: TierRule['prereq'],
 *   targetNote: string,
 * }} SchoolSkillDef
 */

function buildBranch(school, branch, names, rules) {
  /** @type {SchoolSkillDef[]} */
  const out = []
  for (let i = 0; i < 5; i++) {
    const r = rules[i]
    const slug = schoolSlug(school)
    out.push({
      id: `${slug}_${branch}${r.tier}`,
      school,
      branch,
      tier: r.tier,
      name: names[i],
      learnCharLevel: r.learnCharLevel,
      prereq: r.prereq,
      targetNote: r.targetNote,
    })
  }
  return out
}

let _allCache = null

/** 全技能扁平列表（75 条） */
export function getAllSchoolSkills() {
  if (_allCache) return _allCache
  const list = []
  for (const school of SCHOOLS) {
    list.push(
      ...buildBranch(school, 'B', ATTACK_NAMES[school], TIER_RULES_ATTACK),
      ...buildBranch(school, 'C', OBSTACLE_NAMES[school], TIER_RULES_OBSTACLE),
      ...buildBranch(school, 'D', ASSIST_NAMES[school], TIER_RULES_ASSIST)
    )
  }
  _allCache = Object.freeze(list)
  return _allCache
}

export function getSkillById(id) {
  return getAllSchoolSkills().find((s) => s.id === id) ?? null
}

export function getSkillsBySchool(school) {
  return getAllSchoolSkills().filter((s) => s.school === school)
}

/**
 * @param {string} prereqId - 前置技能 id（同系同支上一阶）
 */
export function prereqSkillId(skill) {
  if (!skill.prereq) return null
  const slug = schoolSlug(skill.school)
  return `${slug}_${skill.prereq.branch}${skill.prereq.tier}`
}

/**
 * skillLevels: Record<skillId, number> 已修炼等级
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canLearnSkill(charLevel, skillLevels, skillId) {
  const sk = getSkillById(skillId)
  if (!sk) return { ok: false, reason: '未知技能' }
  if (charLevel < sk.learnCharLevel) {
    return { ok: false, reason: `需要人物≥${sk.learnCharLevel}级` }
  }
  if (!sk.prereq) return { ok: true }
  const prevId = prereqSkillId(sk)
  const prevLv = skillLevels[prevId] ?? 0
  if (prevLv < sk.prereq.minSkillLevel) {
    return {
      ok: false,
      reason: `需要前置【${getSkillById(prevId)?.name ?? prevId}】≥${sk.prereq.minSkillLevel}级（当前${prevLv}）`,
    }
  }
  return { ok: true }
}

/** 里程碑文案（实战指南） */
export const SKILL_MILESTONES = [
  { level: 10, title: '入门', desc: '拜师后可学一阶单体法术（如金光乍现）与师门遁术。' },
  { level: 38, title: '质变', desc: '二阶攻击≥50 级后可学三阶群攻（如金虹贯日），秒 3~5，练级效率大增。' },
  { level: 60, title: '进阶', desc: '拜师解锁四阶单体高伤与高级障碍。' },
  { level: 100, title: '毕业', desc: '百级任务后解锁五阶终极技能（如逆天残刃），最高爆发/大范围控制。' },
]
