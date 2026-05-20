/**
 * 标准道行系统
 * 每个等级对应一个"标准道行"基准线，影响：
 *  - 异常状态命中率（超出标准时对怪物控制成功率提升）
 *  - 异常状态抵抗率（超出标准时被怪物控制几率降低）
 *  - 道行奖励倍率（未达标时全额，达标后逐渐衰减）
 */

/** 等级 L 对应的标准道行（总天数）：L × 90 天 ≈ L × 0.25 年 */
export function standardDaoTotalDays(level) {
  return Math.floor(Math.max(1, level) * 90)
}

/**
 * 相对标准道行的超出比例。
 *  < 0 = 未达标；0 = 恰好达标；> 0 = 超出标准
 */
export function calcDaoExcessRatio(level, daoYears, daoDays) {
  const totalDays = (daoYears ?? 0) * 365 + (daoDays ?? 0)
  const standard  = standardDaoTotalDays(level)
  return (totalDays - standard) / standard
}

/**
 * 道行奖励衰减倍率（超出标准后递减，未达标全额）。
 * ratio=0 → 1.0；ratio=1（2倍标准）→ ~0.29；ratio=2（3倍）→ ~0.17
 */
export function daoRewardMultiplier(excessRatio) {
  if (excessRatio <= 0) return 1.0
  return 1 / (1 + excessRatio * 2.5)
}

/**
 * 对怪物施加异常状态的命中率加成（超出标准时生效）。
 * 上限 +0.20（约 1.67 倍标准道行时触顶）
 */
export function daoStatusHitBonus(excessRatio) {
  if (excessRatio <= 0) return 0
  return Math.min(0.20, excessRatio * 0.12)
}

/**
 * 抵抗怪物异常状态的减免比例（超出标准时生效）。
 * 上限 35%（约 1.75 倍标准道行时触顶）
 */
export function daoStatusResistBonus(excessRatio) {
  if (excessRatio <= 0) return 0
  return Math.min(0.35, excessRatio * 0.20)
}
