/**
 * 人物升级经验、自由属性点、相性点（累计）配置。
 *
 * **人物经验规范表示：`{ level, expIntoLevel }`**
 * - `level`：当前人物等级。
 * - `expIntoLevel`：本级已积累、尚未触发升级的经验（进度条当前值）；上限为 `expRequiredToNextLevel(level)`（满级为 0）。
 * - 与生涯总经验的换算：`totalExpFromLevelBar(level, expIntoLevel)` / `getLevelFromTotalExp` + `expIntoCurrentLevel`。
 *
 * - 「升级所需经验」：从当前等级升到下一级所需经验（端游表 + 中间等级线性插值）。
 * - 属性点：每升一级 4 点自由点；1 级无累计自由点 → 累计 = (等级 - 1) × 4。
 * - 相性点：1～60 级为奇数级 3～59 各 1 点 + 达 10 级里程碑 +1；61 级不增；62 级起每升一级 +1。
 */

/** 当前版本人物满级 */
export const CHARACTER_MAX_LEVEL = 140

/**
 * 表列等级 → 从该级升到下一级所需经验（稀疏节点，中间等级线性插值）
 * 数值与用户提供表一致（去千分位逗号）
 */
export const EXP_TO_NEXT_KNOTS = Object.freeze([
  [1, 120],
  [2, 230],
  [3, 369],
  [4, 553],
  [5, 774],
  [10, 2375],
  [15, 6421],
  [20, 18188],
  [25, 45258],
  [30, 119968],
  [40, 674161],
  [50, 2771697],
  [55, 4886677],
  [60, 8605726],
  [65, 15150000],
  [70, 26650000],
  [75, 46900000],
  [80, 82500000],
  [85, 145000000],
  [90, 255000000],
  [95, 448000000],
  [100, 147960000],
  [105, 215000000],
  [110, 312000000],
  [115, 453000000],
  [120, 658000000],
  [125, 955000000],
  [130, 1387000000],
  [135, 2014000000],
  /** 表末行：作为 139→140 插值终点；满级后不再消耗经验（见 expRequiredToNextLevel） */
  [140, 2923000000],
])

/** 里程碑：等级段说明（与属性/相性累计对照） */
export const LEVEL_SEGMENT_NOTES = Object.freeze([
  { level: 1, note: '刚创建角色，无自由属性点' },
  { level: 10, note: '10 级前相性按奇数级；达 10 级里程碑 +1 相性' },
  { level: 30, note: '开始接触修山，相性初具规模' },
  { level: 60, note: '分水岭：60 级时相性点达 30' },
  { level: 61, note: '61 级仍按旧规则收尾，本段不新增相性' },
  { level: 62, note: '从 62 级起每级 +1 相性' },
  { level: 80, note: '可开始点满第二相性' },
  { level: 100, note: '元婴/血婴阶段，相性开始溢出' },
  { level: 120, note: '后期，相性点富余' },
  { level: 140, note: '当前版本满级常态' },
])

function clampLevel(level) {
  return Math.min(CHARACTER_MAX_LEVEL, Math.max(1, Math.floor(level)))
}

/**
 * 从等级 `level` 升到 `level+1` 所需经验（整数）。
 * @param {number} level 当前人物等级
 */
export function expRequiredToNextLevel(level) {
  const L = Math.floor(level)
  if (L < 1) return EXP_TO_NEXT_KNOTS[0][1]
  if (L >= CHARACTER_MAX_LEVEL) return 0

  const knots = EXP_TO_NEXT_KNOTS
  let i = 0
  while (i + 1 < knots.length && knots[i + 1][0] <= L) i++

  const [la, va] = knots[i]
  if (L === la) return va

  const nextK = knots[i + 1]
  if (!nextK) return va

  const [lb, vb] = nextK
  if (L <= la || lb <= la) return va

  const t = (L - la) / (lb - la)
  return Math.round(va + (vb - va) * t)
}

/**
 * 从 1 级累计到 `targetLevel` 级所需总经验（不含「待在 targetLevel」本身），
 * 即升到 targetLevel 至少需要多少经验（sum of exp 1→2 ... (targetLevel-1)→targetLevel）。
 */
export function totalExpToReachLevel(targetLevel) {
  const T = Math.floor(targetLevel)
  if (T <= 1) return 0
  let sum = 0
  for (let lv = 1; lv < T; lv++) sum += expRequiredToNextLevel(lv)
  return sum
}

/**
 * 给定生涯累计总经验，计算当前等级（满级封顶）。
 * totalExpToReachLevel(L) ≤ totalExp < totalExpToReachLevel(L+1) 时为 L 级。
 */
export function getLevelFromTotalExp(totalExp) {
  const x = Math.max(0, Number(totalExp) || 0)
  let level = 1
  while (level < CHARACTER_MAX_LEVEL) {
    const nextThreshold = totalExpToReachLevel(level + 1)
    if (x < nextThreshold) break
    level++
  }
  return level
}

/**
 * 当前等级内已填充的经验（用于进度条）：总经验 - 升到本级门槛。
 */
export function expIntoCurrentLevel(totalExp) {
  const lv = getLevelFromTotalExp(totalExp)
  return Math.max(0, totalExp - totalExpToReachLevel(lv))
}

/**
 * 升到下一级还需经验；已满级返回 0。
 */
export function expRemainingToNext(totalExp) {
  const lv = getLevelFromTotalExp(totalExp)
  if (lv >= CHARACTER_MAX_LEVEL) return 0
  const need = expRequiredToNextLevel(lv)
  const cur = expIntoCurrentLevel(totalExp)
  return Math.max(0, need - cur)
}

/** 累计自由属性点（1 级为 0，之后每升一级 +4） */
export function getFreeAttributePointsTotal(level) {
  const L = clampLevel(level)
  return Math.max(0, (L - 1) * 4)
}

/**
 * 累计相性点（与里程碑表：10→5、30→15、60→30、61→30、62→31、80→49、100→69、120→89、140→109 一致）
 */
export function getAffinityPointsTotal(level) {
  const L = clampLevel(level)
  if (L <= 1) return 0
  if (L <= 61) {
    const hi = Math.min(L, 59)
    let n = 0
    for (let k = 3; k <= hi; k += 2) n++
    const milestone10 = L >= 10 ? 1 : 0
    return n + milestone10
  }
  return 30 + (L - 61)
}

/**
 * 将溢出经验折算为连升，得到规范 `{ level, expIntoLevel }`。
 * @returns {{ level: number, expIntoLevel: number }}
 */
export function normalizeLevelBar(level, expIntoLevel) {
  const r = consumeExpThroughLevels(level, expIntoLevel)
  return { level: r.newLevel, expIntoLevel: r.expIntoLevel }
}

/**
 * 由 `level + expIntoLevel` 得到等价的生涯累计总经验。
 */
export function totalExpFromLevelBar(level, expIntoLevel) {
  const { level: L, expIntoLevel: e } = normalizeLevelBar(level, expIntoLevel)
  return totalExpToReachLevel(L) + e
}

/**
 * 本级进度条剩余经验（升到下一级还差多少）。
 */
export function remainingExpToNextLevel(level, expIntoLevel) {
  const { level: L, expIntoLevel: e } = normalizeLevelBar(level, expIntoLevel)
  const need = expRequiredToNextLevel(L)
  if (need <= 0) return 0
  return Math.max(0, need - e)
}

/**
 * 本级升级所需经验（即经验条 `max`）；满级为 0。
 */
export function expBarCapacity(level) {
  return expRequiredToNextLevel(level)
}

/**
 * 在 `level + expIntoLevel` 上增加经验，返回新等级、新条上经验、连升次数。
 */
export function applyExpTowardLevelUp(currentLevel, currentExpIntoLevel, gainedExp) {
  const pool = (Number(currentExpIntoLevel) || 0) + (Number(gainedExp) || 0)
  return consumeExpThroughLevels(currentLevel, pool)
}

/**
 * @returns {{ newLevel: number, expIntoLevel: number, levelsGained: number }}
 */
function consumeExpThroughLevels(level, expPool) {
  let lv = clampLevel(level)
  let pool = Math.max(0, Number(expPool) || 0)
  let levelsGained = 0

  while (lv < CHARACTER_MAX_LEVEL) {
    const need = expRequiredToNextLevel(lv)
    if (need <= 0) break
    if (pool < need) break
    pool -= need
    lv++
    levelsGained++
  }

  return { newLevel: lv, expIntoLevel: pool, levelsGained }
}
