/**
 * 人物属性面板与战斗同步用数值（文字版简化）。
 *
 * **属性点裸收益（无相性时）**
 * - 体：+5 气血 / +1.5 防御
 * - 灵：+5 法伤 / +7.5 法力
 * - 力：+5 物伤 / +1 命中
 * - 敏：+2 速度
 *
 * **相性放大（与说明一致的简化式）**
 * - 金：1 灵 ≈ 5 + (金相/6) 法伤
 * - 木：1 体 ≈ 5 + (木相/6) 气血；1 灵 ≈ 7.5 + (木相/8) 法力
 * - 水：1 体 ≈ 1.5 + (水相/6) 防御
 * - 火：1 敏 ≈ 2 + (火相/42) 速度
 * - 土：1 力 ≈ 5 + (土相/2.1) 物伤
 *
 * **抗性**：五系抗五行法术；障碍抗遗忘/冰冻/中毒/昏睡/混乱（道行额外加成障碍侧）。
 */
import {
  CHARACTER_MAX_LEVEL,
  getAffinityPointsTotal,
  getFreeAttributePointsTotal,
} from './characterLevelConfig.js'

export const AFFINITY_CAP_PER_ELEMENT = 30

/** 每升一级，四维各有 1 点固定成长（重置时保留） */
export function getFixedStatFloor(level) {
  const L = Math.min(CHARACTER_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)))
  return L
}

/** 四维可分配总点数（与图例 Lv.65≈270 对齐：14 + 每级前累计自由点） */
export function getAttributePointBudget(level) {
  const L = Math.min(CHARACTER_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)))
  return 14 + getFreeAttributePointsTotal(L)
}

/** 相性点总预算（与 characterLevelConfig 一致） */
export function getAffinityPointBudget(level) {
  const L = Math.min(CHARACTER_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)))
  return getAffinityPointsTotal(L)
}

/**
 * @typedef {{
 *   displayName: string,
 *   school: string,
 *   vit: number,
 *   int: number,
 *   str: number,
 *   agi: number,
 *   affMetal: number,
 *   affWood: number,
 *   affWater: number,
 *   affFire: number,
 *   affEarth: number,
 *   daoYears: number,
 *   daoDays: number,
 *   potential: number,
 *   fame: number,
 *   staminaCur: number,
 *   staminaMax: number,
 *   meritRecord: number,
 * }} HeroSheet
 */

/** @param {number} level */
export function createDefaultHeroSheet(level) {
  const L = Math.min(CHARACTER_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)))
  const budget = getAttributePointBudget(L)
  const affBudget = getAffinityPointBudget(L)
  // 法金：比例贴近图例，再缩放到当前等级总点
  const ref = { vit: 30, int: 150, str: 10, agi: 80 }
  const refSum = ref.vit + ref.int + ref.str + ref.agi
  let vit = Math.max(1, Math.round((ref.vit * budget) / refSum))
  let int = Math.max(1, Math.round((ref.int * budget) / refSum))
  let str = Math.max(1, Math.round((ref.str * budget) / refSum))
  let agi = Math.max(1, Math.round((ref.agi * budget) / refSum))
  let drift = budget - (vit + int + str + agi)
  while (drift > 0) {
    int++
    drift--
  }
  while (drift < 0 && int > 1) {
    int--
    drift++
  }
  while (drift < 0 && vit > 1) {
    vit--
    drift++
  }
  const metal = Math.min(AFFINITY_CAP_PER_ELEMENT, affBudget)
  const fire = Math.min(AFFINITY_CAP_PER_ELEMENT, Math.max(0, affBudget - metal))
  const wood = Math.max(0, affBudget - metal - fire)
  const water = 0
  const earth = 0

  return {
    displayName: '天行健',
    school: '法金',
    vit,
    int,
    str,
    agi,
    affMetal: metal,
    affWood: wood,
    affWater: water,
    affFire: fire,
    affEarth: earth,
    daoYears: 85,
    daoDays: 123,
    potential: 2500,
    fame: 850,
    staminaCur: 85,
    staminaMax: 100,
    meritRecord: 120,
  }
}

/** @param {HeroSheet} sheet */
export function sumAffinity(sheet) {
  return (
    (sheet.affMetal ?? 0) +
    (sheet.affWood ?? 0) +
    (sheet.affWater ?? 0) +
    (sheet.affFire ?? 0) +
    (sheet.affEarth ?? 0)
  )
}

/** @param {HeroSheet} sheet */
export function sumFour(sheet) {
  return (sheet.vit ?? 0) + (sheet.int ?? 0) + (sheet.str ?? 0) + (sheet.agi ?? 0)
}

function clampAffVal(n) {
  return Math.max(0, Math.min(AFFINITY_CAP_PER_ELEMENT, Number(n) || 0))
}

/**
 * 当前相性下的「每点属性」有效转化率（用于面板展示，与 computeHeroDerived 一致）。
 * @param {HeroSheet} sheet
 */
export function getEffectiveAttributeRates(sheet) {
  const affMetal = clampAffVal(sheet.affMetal)
  const affWood = clampAffVal(sheet.affWood)
  const affWater = clampAffVal(sheet.affWater)
  const affFire = clampAffVal(sheet.affFire)
  const affEarth = clampAffVal(sheet.affEarth)
  return {
    hpPerVit: 5 + affWood / 6,
    defPerVit: 1.5 + affWater / 6,
    mpPerInt: 7.5 + affWood / 8,
    magPerInt: 5 + affMetal / 6,
    phyPerStr: 5 + affEarth / 2.1,
    accPerStr: 1,
    spdPerAgi: 2 + affFire / 42,
  }
}

/** 道行对抗障碍类抗性的简化加成（年为主） */
export function daoToBarrierResBonus(sheet) {
  const y = Math.max(0, Number(sheet.daoYears) || 0)
  const d = Math.max(0, Number(sheet.daoDays) || 0)
  const score = y + d / 365
  return Math.min(22, Math.round(score * 0.12 * 10) / 10)
}

/**
 * @param {number} level
 * @param {HeroSheet} sheet
 */
export function computeHeroDerived(level, sheet) {
  const L = Math.min(CHARACTER_MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)))
  const vit = Math.max(0, Number(sheet.vit) || 0)
  const int = Math.max(0, Number(sheet.int) || 0)
  const str = Math.max(0, Number(sheet.str) || 0)
  const agi = Math.max(0, Number(sheet.agi) || 0)
  const affMetal = clampAffVal(sheet.affMetal)
  const affWood = clampAffVal(sheet.affWood)
  const affWater = clampAffVal(sheet.affWater)
  const affFire = clampAffVal(sheet.affFire)
  const affEarth = clampAffVal(sheet.affEarth)

  const r = getEffectiveAttributeRates({
    ...sheet,
    affMetal,
    affWood,
    affWater,
    affFire,
    affEarth,
  })

  /** 等级底盘（与属性点公式分离，保证低等级也有可玩数值） */
  const chassisHp = 100 + L * 14
  const chassisMp = 70 + L * 9
  const chassisMag = 8 + L * 3
  const chassisPhy = 6 + L * 2.5
  const chassisDef = 10 + L * 1.8
  const chassisSpd = 8 + L * 1.2

  const maxHp = Math.round(chassisHp + vit * r.hpPerVit)
  const maxMp = Math.round(chassisMp + int * r.mpPerInt)
  const magDmg = Math.round(chassisMag + int * r.magPerInt)
  const phyDmg = Math.round(chassisPhy + str * r.phyPerStr)
  const def = Math.round(chassisDef + vit * r.defPerVit)
  const speed = Math.round(chassisSpd + agi * r.spdPerAgi)
  const acc = Math.round(36 + L * 0.55 + str * r.accPerStr + agi * 0.15)

  const dodgePct = Math.min(45, Math.round((agi * 0.12 + vit * 0.04) * 10) / 10)
  const critPct = Math.min(40, Math.round((str * 0.06 + agi * 0.04) * 10) / 10)
  const comboPct = Math.min(35, Math.round((agi * 0.05 + str * 0.03) * 10) / 10)
  const counterPct = Math.min(25, Math.round(vit * 0.08 * 10) / 10)
  const reflectPct = Math.min(20, Math.round(vit * 0.06 * 10) / 10)

  const strongMetal = Math.min(8, affMetal * 0.22)
  const strongWood = Math.min(8, affWood * 0.22)
  const strongWater = Math.min(8, affWater * 0.22)
  const strongFire = Math.min(8, affFire * 0.22)
  const strongEarth = Math.min(8, affEarth * 0.22)

  /** 五系法术抗性（对抗金木水火土法伤） */
  const resElem = (a, b, c) =>
    Math.min(40, Math.round((4 + L * 0.07 + vit * 0.06 + a * 0.28 + b * 0.12 + c * 0.12) * 10) / 10)
  const resJin = resElem(affWood, affEarth, affWater)
  const resMu = resElem(affMetal, affEarth, affWater)
  const resShui = resElem(affFire, affWood, affMetal)
  const resHuo = resElem(affWater, affMetal, affWood)
  const resTu = resElem(affMetal, affWood, affFire)

  const daoB = daoToBarrierResBonus(sheet)
  /** 障碍抗性：对抗遗忘/冰冻/中毒/昏睡/混乱 */
  const resCtrl = (seed) =>
    Math.min(
      42,
      Math.round((3.5 + L * 0.06 + vit * 0.05 + seed * 0.18 + daoB) * 10) / 10
    )
  const resYi = resCtrl(affWood + affWater * 0.6)
  const resBing = resCtrl(affWater + affEarth * 0.55)
  const resDu = resCtrl(affWood + affEarth * 0.45)
  const resHunLuan = resCtrl(affMetal + affFire * 0.5)
  const resShuiMian = resCtrl(affWater + affWood * 0.4)

  return {
    maxHp,
    maxMp,
    phyDmg,
    magDmg,
    def,
    speed,
    acc,
    dodgePct,
    critPct,
    comboPct,
    counterPct,
    reflectPct,
    strongMetal,
    strongWood,
    strongWater,
    strongFire,
    strongEarth,
    resJin,
    resMu,
    resShui,
    resHuo,
    resTu,
    resYi,
    resBing,
    resDu,
    resHunLuan,
    resShuiMian,
    /** 道行对障碍抗的加成值（已并入上列障碍抗） */
    daoBarrierBonus: daoB,
    /** 当前每点属性有效收益（展示） */
    rates: r,
  }
}

/** @param {object} ally 战斗单位 @param {HeroSheet} sheet */
export function allyPatchFromHeroSheet(ally, sheet) {
  const level = ally.level ?? 1
  const d = computeHeroDerived(level, sheet)
  const hpRatio = ally.maxHp > 0 ? ally.hp / ally.maxHp : 1
  const mpRatio = ally.maxMp > 0 ? ally.mp / ally.maxMp : 1
  return {
    ...ally,
    maxHp: d.maxHp,
    hp: Math.max(1, Math.min(d.maxHp, Math.round(d.maxHp * hpRatio))),
    maxMp: d.maxMp,
    mp: Math.max(0, Math.min(d.maxMp, Math.round(d.maxMp * mpRatio))),
    atk: d.phyDmg,
    mAtk: d.magDmg,
    def: d.def,
    speed: d.speed,
    heroSheet: sheet,
  }
}

/** 自动分配：剩余自由点按 3 体 : 2 灵 投入 */
export function autoAllocateVitInt(sheet, level) {
  const budget = getAttributePointBudget(level)
  let vit = sheet.vit
  let int = sheet.int
  const str = sheet.str
  const agi = sheet.agi
  let rem = budget - (vit + int + str + agi)
  let tick = 0
  while (rem > 0) {
    if (tick % 5 < 3) vit++
    else int++
    tick++
    rem--
  }
  return { ...sheet, vit, int, str, agi }
}

/** 将四维总和拉回预算（多退少补，优先动灵力/体质） */
export function clampFourStats(sheet, level) {
  const budget = getAttributePointBudget(level)
  const floor = getFixedStatFloor(level)
  let { vit, int, str, agi } = sheet
  vit = Math.max(floor, Math.floor(Number(vit) || 0))
  int = Math.max(floor, Math.floor(Number(int) || 0))
  str = Math.max(floor, Math.floor(Number(str) || 0))
  agi = Math.max(floor, Math.floor(Number(agi) || 0))
  let sum = vit + int + str + agi
  while (sum > budget) {
    if (int > floor) int--
    else if (agi > floor) agi--
    else if (vit > floor) vit--
    else if (str > floor) str--
    else break
    sum--
  }
  return { ...sheet, vit, int, str, agi }
}

/** 相性每项 [0,30]，总和不超过等级预算 */
export function clampAffinity(sheet, level) {
  const cap = getAffinityPointBudget(level)
  const keys = ['affMetal', 'affWood', 'affWater', 'affFire', 'affEarth']
  let next = { ...sheet }
  for (const k of keys) {
    next[k] = Math.max(0, Math.min(AFFINITY_CAP_PER_ELEMENT, Math.floor(Number(next[k]) || 0)))
  }
  let total = keys.reduce((s, k) => s + next[k], 0)
  while (total > cap) {
    let best = 'affWood'
    let bestVal = -1
    for (const k of keys) {
      if (next[k] > bestVal) {
        bestVal = next[k]
        best = k
      }
    }
    if (next[best] <= 0) break
    next[best]--
    total--
  }
  return next
}

export function formatNumber(n) {
  const x = Math.round(Number(n) || 0)
  return x.toLocaleString('zh-CN')
}
