/**
 * 刷道遭遇战生成 — 除暴/降妖/伏魔随机敌方阵容 + 沉浸式随机命名
 */
import { deriveStatsFromLevel, inferSkillPool, spawnMonster, rollFoeCount } from './monsters.js'

// ── 除暴：山贼强盗 ────────────────────────────────────────────────────────
const BANDIT_ROLES        = ['强盗', '山贼', '悍匪', '响马', '劫匪', '草寇']
const BANDIT_BOSS_TITLES  = ['寨主', '匪首', '大当家', '山大王', '头领']
const SURNAMES            = ['陈', '李', '张', '王', '赵', '孙', '周', '吴', '郑', '钱', '魏', '冯', '褚', '卫', '蒋', '沈', '韩', '杨']
const BANDIT_WEAPONS      = ['大刀', '铁锤', '断枪', '飞斧', '铁棍', '猎弓', '双钩', '流星锤', '铁鞭', '板斧']
const BANDIT_NICKNAMES    = ['飞燕', '铁拳', '独眼', '断臂', '黑虎', '赤须', '鬼手', '豹眼', '刀疤', '铁背', '狼牙', '霸刀']

// ── 降妖：妖兽妖将 ────────────────────────────────────────────────────────
const DEMON_COLORS        = ['赤', '青', '黑', '幽', '金', '碧', '紫', '银', '血', '翠', '苍']
const DEMON_MIDS          = ['焰', '面', '煞', '魂', '羽', '鳞', '爪', '牙', '雾', '影', '芒']
const DEMON_BOSS_RANKS    = ['妖王', '妖帅', '妖君', '妖圣']
const DEMON_MINION_RANKS  = ['妖兵', '妖将', '妖卒', '妖卫']

// ── 伏魔：魔头魔将 ────────────────────────────────────────────────────────
const DEVIL_POWERS        = ['黑煞', '幽冥', '炎天', '血月', '九幽', '暗渊', '混沌', '冥火', '天煞', '魔云']
const DEVIL_BOSS_RANKS    = ['魔尊', '魔君', '魔帅', '大魔头']
const DEVIL_MINION_RANKS  = ['魔兵', '魔将', '魔卒', '魔卫']

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)]
}

function genBanditMinion(rng) {
  const role    = pick(BANDIT_ROLES, rng)
  const surname = pick(SURNAMES, rng)
  const nick    = pick([...BANDIT_WEAPONS, ...BANDIT_NICKNAMES], rng)
  return `${role}${surname}${nick}`
}

function genBanditBoss(rng) {
  const title   = pick(BANDIT_BOSS_TITLES, rng)
  const surname = pick(SURNAMES, rng)
  const weapon  = pick(BANDIT_WEAPONS, rng)
  return `${title}${surname}${weapon}`
}

function genDemonMinion(rng) {
  const color = pick(DEMON_COLORS, rng)
  const mid   = pick(DEMON_MIDS, rng)
  const rank  = pick(DEMON_MINION_RANKS, rng)
  return `${color}${mid}${rank}`
}

function genDemonBoss(rng) {
  const color = pick(DEMON_COLORS, rng)
  const mid   = pick(DEMON_MIDS, rng)
  const rank  = pick(DEMON_BOSS_RANKS, rng)
  return `${color}${mid}${rank}`
}

function genDevilMinion(rng) {
  const power = pick(DEVIL_POWERS, rng)
  const rank  = pick(DEVIL_MINION_RANKS, rng)
  return `${power}${rank}`
}

function genDevilBoss(rng) {
  const power = pick(DEVIL_POWERS, rng)
  const rank  = pick(DEVIL_BOSS_RANKS, rng)
  return `${power}${rank}`
}

function makeUnit(name, level, isBoss, tags) {
  const stats    = deriveStatsFromLevel(level, { isBoss })
  const skillPool = inferSkillPool({ tags, level }, isBoss)
  return spawnMonster({
    key:       isBoss ? 'shuadao_boss' : 'shuadao_minion',
    name:      isBoss ? `${name}（首领）` : name,
    level,
    hp:        stats.hp,
    mp:        stats.mp,
    atk:       stats.atk,
    def:       stats.def,
    speed:     stats.speed,
    skillPool,
    affinity:  null,
  })
}

/**
 * 生成刷道敌方阵容。敌方总数按 rollFoeCount(partySize) 同野怪规则。
 * @param {'chubao'|'jiangyao'|'fomo'} typeId
 * @param {number} charLevel
 * @param {number} partySize  我方出战人数（含宠物）
 * @param {Function} rng
 * @returns {object[]}
 */
export function buildShuadaoFoes(typeId, charLevel, partySize = 1, rng = Math.random) {
  const L        = Math.max(1, charLevel)
  const total    = rollFoeCount(Math.max(1, partySize), rng)
  const minionCount = Math.max(0, total - 1)  // 首领固定 1 只，其余为小兵

  if (typeId === 'chubao') {
    const boss    = makeUnit(genBanditBoss(rng),    L + 3, true,  ['humanoid'])
    const minions = Array.from({ length: minionCount }, () =>
      makeUnit(genBanditMinion(rng), L, false, ['humanoid']))
    return [boss, ...minions]
  }

  if (typeId === 'jiangyao') {
    const boss    = makeUnit(genDemonBoss(rng),    L + 5, true,  ['demon'])
    const minions = Array.from({ length: minionCount }, () =>
      makeUnit(genDemonMinion(rng), L + 2, false, ['demon']))
    return [boss, ...minions]
  }

  // fomo
  const boss    = makeUnit(genDevilBoss(rng),    Math.floor(L * 1.1), true,  ['dark', 'demon'])
  const minions = Array.from({ length: minionCount }, () =>
    makeUnit(genDevilMinion(rng), L + 5, false, ['dark']))
  return [boss, ...minions]
}

/**
 * 生成刷道开场战报文本。
 */
export function shuadaoOpeningMsg(typeId, foes) {
  const LABEL = { chubao: '除暴', jiangyao: '降妖', fomo: '伏魔' }
  const boss    = foes.find(f => f.name.includes('首领')) ?? foes[0]
  const minions = foes.filter(f => f !== boss)
  const minionNames = minions.map(f => f.name).join('、')
  return `【刷道·${LABEL[typeId] ?? typeId}】${boss.name} Lv${boss.level} 率众来袭！另有 ${minionNames}等随行。`
}
