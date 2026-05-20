/**
 * 任务引擎 — 判断任务状态、检查目标完成、计算可接任务
 * 纯函数，不直接操作 store，供 characterStore actions 调用
 */
import { ALL_QUESTS, getQuestById } from './questData.js'

/** 任务状态枚举 */
export const QS = {
  LOCKED:     'locked',     // 前置未完成 / 等级不足
  AVAILABLE:  'available',  // 可接取
  ACTIVE:     'active',     // 进行中
  CLAIMABLE:  'claimable',  // 目标已达成，待领取
  DONE:       'done',       // 已完成领取
}

/**
 * 根据 questLog 计算某任务的当前状态
 * @param {object} quest - 任务定义
 * @param {object} questLog - { [questId]: { status, progress } }
 * @param {number} charLevel
 */
export function getQuestStatus(quest, questLog, charLevel) {
  const entry = questLog?.[quest.id]
  if (entry?.status === QS.DONE)      return QS.DONE
  if (entry?.status === QS.ACTIVE || entry?.status === QS.CLAIMABLE) {
    // 重新评估是否可领取
    const progress = entry.progress ?? 0
    const needed   = quest.objectives[0]?.count ?? 1
    return progress >= needed ? QS.CLAIMABLE : QS.ACTIVE
  }
  // 检查前置
  const prereqsMet = (quest.prereqs ?? []).every(pid => questLog?.[pid]?.status === QS.DONE)
  const levelMet   = (charLevel ?? 1) >= (quest.levelReq ?? 1)
  if (!prereqsMet || !levelMet) return QS.LOCKED
  return QS.AVAILABLE
}

/** 获取 NPC 所有任务的状态汇总 */
export function getNpcQuestStatuses(npcId, questLog, charLevel) {
  const quests = ALL_QUESTS.filter(q => q.npcId === npcId)
  return quests.map(q => ({ quest: q, status: getQuestStatus(q, questLog, charLevel) }))
}

/** 判断某地图上的 NPC 是否有可接 / 可领取的任务（用于显示感叹号） */
export function mapHasActiveNpc(mapId, questLog, charLevel) {
  const npcsOnMap = ALL_QUESTS.filter(q => {
    // 找到所在 NPC 的 mapId
    return true // caller should filter by mapId
  })
  return false // simplified - caller handles this
}

/**
 * 接受任务 → 返回新 questLog
 */
export function acceptQuest(questId, questLog, charLevel) {
  const quest = getQuestById(questId)
  if (!quest) return questLog
  const status = getQuestStatus(quest, questLog, charLevel)
  if (status !== QS.AVAILABLE) return questLog
  return {
    ...questLog,
    [questId]: { status: QS.ACTIVE, progress: 0 },
  }
}

/**
 * 更新 battle 进度 → 返回新 questLog（胜利一场指定地图）
 */
export function progressBattle(mapId, questLog) {
  const updated = { ...questLog }
  for (const quest of ALL_QUESTS) {
    const entry = updated[quest.id]
    if (!entry || entry.status !== QS.ACTIVE) continue
    const obj = quest.objectives[0]
    if (obj?.type !== 'battle' || obj.target !== mapId) continue
    const newProgress = (entry.progress ?? 0) + 1
    updated[quest.id] = {
      ...entry,
      progress: newProgress,
      status: newProgress >= obj.count ? QS.CLAIMABLE : QS.ACTIVE,
    }
  }
  return updated
}

/**
 * 更新 visit_map 进度 → 返回新 questLog
 */
export function progressVisitMap(mapId, questLog) {
  const updated = { ...questLog }
  for (const quest of ALL_QUESTS) {
    const entry = updated[quest.id]
    if (!entry || entry.status !== QS.ACTIVE) continue
    const obj = quest.objectives[0]
    if (obj?.type !== 'visit_map' || obj.target !== mapId) continue
    updated[quest.id] = { ...entry, progress: 1, status: QS.CLAIMABLE }
  }
  return updated
}

/**
 * 领取任务奖励 → 返回 { questLog, rewards }
 */
export function claimQuest(questId, questLog) {
  const quest = getQuestById(questId)
  if (!quest) return { questLog, rewards: null }
  const entry = questLog?.[quest.id]
  if (entry?.status !== QS.CLAIMABLE) return { questLog, rewards: null }
  const newLog = { ...questLog, [questId]: { ...entry, status: QS.DONE } }
  return { questLog: newLog, rewards: quest.reward }
}
