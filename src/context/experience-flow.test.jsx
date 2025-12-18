import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { GameProvider, useGame } from './GameContext'
import { getAllEquipmentStats } from '../utils/equipment'
import { updatePlayerBattleStats } from '../utils/attributeCalc'

function ExperienceFlowHarness({ onReady }) {
  const game = useGame()

  useEffect(() => {
    if (!game.player) {
      // 初始化一个玩家
      game.setPlayer({
        name: '测试玩家',
        level: 10,
        exp: 1314,
        expMax: 2000,
        points: 0,
        strength: 10,
        constitution: 10,
        spirit: 10,
        agility: 10,
        maxHp: 100,
        hp: 100,
        maxMp: 50,
        mp: 50,
      })
    } else if (onReady) {
      onReady(game)
    }
  }, [game, onReady])

  return null
}

describe('人物经验在战斗结算与后续界面操作之间保持一致', () => {
  test('先增加经验，再通过属性/装备重算属性后不会回滚经验', async () => {
    let ctx = null

    render(
      <GameProvider>
        <ExperienceFlowHarness
          onReady={(game) => {
            ctx = game
          }}
        />
      </GameProvider>
    )

    await waitFor(() => {
      expect(ctx?.player).toBeTruthy()
    })

    // 模拟战斗结算给人物增加经验
    const initialExp = ctx.player.exp
    const gained = 500
    ctx.setPlayer((prev) => {
      if (!prev) return prev
      return { ...prev, exp: (prev.exp || 0) + gained }
    })

    await waitFor(() => {
      expect(ctx.player.exp).toBe(initialExp + gained)
    })

    // 模拟后续某个 UI（如背包/人物信息）重算属性的行为
    ctx.setPlayer((prev) => {
      const base = ctx.playerRef?.current || prev
      if (!base) return base
      const equipmentStats = getAllEquipmentStats(ctx.equippedItems || {})
      return updatePlayerBattleStats(base, ctx.elementPoints, equipmentStats)
    })

    await waitFor(() => {
      // 经验应该保持战斗后数值，不应被回滚
      expect(ctx.player.exp).toBe(initialExp + gained)
    })
  })
})


