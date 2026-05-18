/**
 * 技能定义（问道风格命名，数值为文字版简化）
 * kind: physical | magic | heal | buff
 * school skill IDs (jin_B1 etc.) are derived on-demand via getSkillById from schoolSkills.js
 */
import { getSkillById as getSchoolSkillDef } from './schoolSkills.js'

const SCHOOL_ELEM = { 金: '金', 木: '木', 水: '水', 火: '火', 土: '土' }
const B_MP  = [36,  56,  80,  112, 160]
const B_PWR = [1.20, 1.35, 1.55, 1.75, 2.00]
const C_MP  = [30,  42,  65,  88,  130]
const C_PWR = [0.65, 0.78, 0.90, 1.00, 1.10]
const D_MP  = [28,  40,  60,  80,  120]

/** 五系障碍状态：金→遗忘 木→中毒 水→冰冻 火→昏睡 土→混乱 */
const STATUS_BY_SCHOOL = { 金: 'forget', 木: 'poison', 水: 'freeze', 火: 'sleep', 土: 'confuse' }
/** 各阶持续回合数 */
const STATUS_DURATION  = [2, 2, 3, 3, 4]
/** 中毒每回合掉血百分比（木系专用） */
const POISON_PCT       = [0.05, 0.06, 0.08, 0.10, 0.13]

/** 从 targetNote 解析最大攻击目标数：取字串中最大数字，"单体…" → 1 */
function parseMaxTargets(targetNote) {
  if (!targetNote || /单体/.test(targetNote) || /强控/.test(targetNote) || /辅助/.test(targetNote)) return 1
  const nums = targetNote.match(/\d+/g)?.map(Number)
  return nums?.length ? Math.max(...nums) : 1
}

function deriveSkill(sk) {
  const t = sk.tier - 1
  const elem = SCHOOL_ELEM[sk.school] ?? null
  const maxTargets = parseMaxTargets(sk.targetNote)
  if (sk.branch === 'B') {
    return { id: sk.id, name: sk.name, kind: 'magic', branch: 'B', mpCost: B_MP[t], power: B_PWR[t], element: elem, desc: sk.targetNote, maxTargets }
  }
  if (sk.branch === 'C') {
    const statusType = STATUS_BY_SCHOOL[sk.school] ?? 'forget'
    return {
      id: sk.id, name: sk.name, kind: 'control', branch: 'C', tier: sk.tier,
      mpCost: C_MP[t], power: 0, element: elem, desc: sk.targetNote, maxTargets,
      statusEffect: { type: statusType, duration: STATUS_DURATION[t], tickPct: POISON_PCT[t] },
    }
  }
  // D 辅助：按物理处理，伤害低，主要用于 MP 消耗展示
  return { id: sk.id, name: sk.name, kind: 'physical', branch: 'D', mpCost: D_MP[t], power: 0.30, element: null, desc: sk.targetNote, maxTargets: 1 }
}

export const SKILLS = {
  normal_attack: {
    id: 'normal_attack',
    name: '普通攻击',
    kind: 'physical',
    mpCost: 0,
    power: 1,
    element: null,
    desc: '单体物理伤害',
  },
  liehuo: {
    id: 'liehuo',
    name: '烈火咒',
    kind: 'magic',
    mpCost: 8,
    power: 1.35,
    element: '火',
    desc: '单体火系法术',
  },
  bingdong: {
    id: 'bingdong',
    name: '冰冻术',
    kind: 'magic',
    mpCost: 10,
    power: 1.15,
    element: '水',
    desc: '单体水系法术，略减目标出手（文字版合并为伤害）',
  },
  duci: {
    id: 'duci',
    name: '毒刺',
    kind: 'magic',
    mpCost: 6,
    power: 0.95,
    element: '土',
    desc: '带毒系表现的法术伤害',
  },
  lipojun: {
    id: 'lipojun',
    name: '力破千钧',
    kind: 'physical',
    mpCost: 15,
    power: 1.55,
    element: null,
    desc: '强力单体物理',
  },
  yaofeng: {
    id: 'yaofeng',
    name: '妖风',
    kind: 'magic',
    mpCost: 12,
    power: 1.2,
    element: '木',
    desc: '木系法术',
  },
  leiji: {
    id: 'leiji',
    name: '天雷咒',
    kind: 'magic',
    mpCost: 14,
    power: 1.3,
    element: '金',
    desc: '金系法术',
  },
  shuiyan: {
    id: 'shuiyan',
    name: '水之波澜',
    kind: 'magic',
    mpCost: 11,
    power: 1.22,
    element: '水',
    desc: '水浪冲击',
  },
  chuangji: {
    id: 'chuangji',
    name: '野蛮冲撞',
    kind: 'physical',
    mpCost: 5,
    power: 1.25,
    element: null,
    desc: '野兽系物理',
  },
  gutu: {
    id: 'gutu',
    name: '骨刺',
    kind: 'physical',
    mpCost: 4,
    power: 1.12,
    element: null,
    desc: '亡灵系物理',
  },
  shixin: {
    id: 'shixin',
    name: '撕咬',
    kind: 'physical',
    mpCost: 0,
    power: 1.08,
    element: null,
    desc: '犬狼系普攻强化',
  },
  shidu: {
    id: 'shidu',
    name: '尸毒',
    kind: 'magic',
    mpCost: 9,
    power: 1.05,
    element: '土',
    desc: '阴腐伤害',
  },
}

/**
 * 按技能修炼等级缩放功率与法力消耗（参考问道端游成长曲线）。
 *
 * B 攻击法术：power × (1 + lv*0.008 + (lv/100)²×0.5)，MP × (1 + lv*0.004)
 * C 障碍法术：power × (1 + lv*0.005 + (lv/100)²×0.25)，MP 同 B
 * D / 物理：   power × (1 + lv*0.003)，MP 微增
 *
 * lv = 0（未习得）时返回原始 base，保证怪物技能不受影响。
 */
function applySkillLevelScaling(sk, lv) {
  if (!lv || lv <= 0) return sk
  const t = lv / 100
  const mpMul = 1 + lv * 0.004
  if (sk.kind === 'magic') {
    const isBranch = sk.branch  // deriveSkill 保留了 branch 字段
    const isC = isBranch === 'C'
    const pwrMul = isC
      ? 1 + lv * 0.005 + t * t * 0.25
      : 1 + lv * 0.008 + t * t * 0.50
    return {
      ...sk,
      power:  sk.power  * pwrMul,
      mpCost: Math.min(sk.mpCost * 2.5, Math.round(sk.mpCost * mpMul)),
    }
  }
  // 物理 / D 辅助
  return {
    ...sk,
    power:  sk.power  * (1 + lv * 0.003),
    mpCost: Math.min(sk.mpCost * 2.0, Math.round(sk.mpCost * (1 + lv * 0.003))),
  }
}

/**
 * 获取技能定义；传入 skillLevel 时返回按等级缩放后的副本。
 * @param {string} id
 * @param {number} [skillLevel=0]
 */
export function getSkill(id, skillLevel = 0) {
  let base
  if (SKILLS[id]) {
    base = SKILLS[id]
  } else {
    const schoolSk = getSchoolSkillDef(id)
    base = schoolSk ? deriveSkill(schoolSk) : SKILLS.normal_attack
  }
  return applySkillLevelScaling(base, skillLevel)
}
