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
    return { id: sk.id, name: sk.name, kind: 'magic', mpCost: B_MP[t], power: B_PWR[t], element: elem, desc: sk.targetNote, maxTargets }
  }
  if (sk.branch === 'C') {
    return { id: sk.id, name: sk.name, kind: 'magic', mpCost: C_MP[t], power: C_PWR[t], element: elem, desc: sk.targetNote, maxTargets }
  }
  // D 辅助：按物理处理，伤害低，主要用于 MP 消耗展示
  return { id: sk.id, name: sk.name, kind: 'physical', mpCost: D_MP[t], power: 0.30, element: null, desc: sk.targetNote, maxTargets: 1 }
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

export function getSkill(id) {
  if (SKILLS[id]) return SKILLS[id]
  const schoolSk = getSchoolSkillDef(id)
  if (schoolSk) return deriveSkill(schoolSk)
  return SKILLS.normal_attack
}
