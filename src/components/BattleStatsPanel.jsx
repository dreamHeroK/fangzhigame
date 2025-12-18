import { useGame } from '../context/GameContext'
import { useBattle } from '../hooks/useBattle'
import { getAllMedicines } from '../utils/items'
import './BattleStatsPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function BattleStatsPanel() {
  const { player, playerRef, activePet, pets, inventory, inBattle, setPlayer, setInventory, addLog } = useGame()
  const { useMedicine } = useBattle()

  const displayedPlayer = playerRef?.current || player
  if (!displayedPlayer) return null

  const hpPercent = displayedPlayer.maxHp > 0 ? (displayedPlayer.hp / displayedPlayer.maxHp) * 100 : 0
  const mpPercent = displayedPlayer.maxMp > 0 ? (displayedPlayer.mp / displayedPlayer.maxMp) * 100 : 0
  const expPercent =
    displayedPlayer.expMax && displayedPlayer.expMax > 0
      ? (displayedPlayer.exp / displayedPlayer.expMax) * 100
      : 0

  // 获取最新的宠物数据
  const currentPet = activePet ? pets.find(p => p.id === activePet.id) || activePet : null
  const petHpPercent = currentPet ? (currentPet.hp / currentPet.maxHp) * 100 : 0
  const petMpPercent = currentPet ? (currentPet.mp / currentPet.maxMp) * 100 : 0
  const petTotalExp = currentPet ? (currentPet.exp || 0) + (currentPet.storedExp || 0) : 0
  const petExpPercent =
    currentPet && currentPet.expMax
      ? (petTotalExp / currentPet.expMax) * 100
      : 0

  // 点击玩家生命条时自动使用最佳回血药品（优先回血量高的）
  const handlePlayerHpClick = () => {
    if (!displayedPlayer) return
    if (displayedPlayer.hp >= displayedPlayer.maxHp) return

    const medicines = getAllMedicines().filter(
      (med) => med.type === 'hp' && (inventory?.[med.id] || 0) > 0
    )
    if (medicines.length === 0) return

    const bestMedicine = medicines.reduce((best, med) => {
      if (!best) return med
      const bestValue = best.value === 9999 ? displayedPlayer.maxHp : best.value
      const medValue = med.value === 9999 ? displayedPlayer.maxHp : med.value
      return medValue > bestValue ? med : best
    }, null)

    if (bestMedicine) {
      if (inBattle) {
        // 战斗中仍然走战斗用药逻辑（包含回合推进）
        useMedicine(bestMedicine)
      } else {
        // 非战斗状态下，直接恢复生命并扣减背包数量
        const healAmount = bestMedicine.value === 9999 ? displayedPlayer.maxHp : bestMedicine.value
        setPlayer(prev => {
          if (!prev) return prev
          const oldHp = prev.hp || 0
          const newHp = Math.min(prev.maxHp, oldHp + healAmount)
          return { ...prev, hp: newHp }
        })
        setInventory(prev => ({
          ...(prev || {}),
          [bestMedicine.id]: Math.max(0, ((prev || {})[bestMedicine.id] || 0) - 1),
        }))
        const oldHp = displayedPlayer.hp || 0
        const newHp = Math.min(displayedPlayer.maxHp, oldHp + healAmount)
        addLog(`使用了 ${bestMedicine.name}，恢复 ${newHp - oldHp} 点生命值`)
      }
    }
  }
  return (
    <div className="battle-stats-panel">
      <div className="battle-stats-header">
        <h3>战斗属性</h3>
      </div>
      <div className="battle-stats-content">
        {/* 玩家属性 */}
        <div className="unit-stats">
          <div className="unit-name">
            <span className="unit-name-text">{player.name || '玩家'}</span>
            <span className="unit-level">
              Lv.{displayedPlayer.level !== undefined ? displayedPlayer.level : 1}
            </span>
          </div>
          <div className="stat-bars">
            <div className="stat-bar-item">
              <span className="stat-label">生命:</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar clickable-hp-bar"
                  onClick={handlePlayerHpClick}
                  title="点击自动使用最佳回血药品"
                >
                  <div className="stat-fill hp" style={{ width: `${hpPercent}%` }}></div>
                  <span className="stat-value">
                    {displayedPlayer.hp}/{displayedPlayer.maxHp}
                  </span>
                </div>
              </div>
            </div>
            <div className="stat-bar-item">
              <span className="stat-label">法力:</span>
              <div className="stat-bar-container">
                <div className="stat-bar">
                  <div className="stat-fill mp" style={{ width: `${mpPercent}%` }}></div>
                    <span className="stat-value">
                      {displayedPlayer.mp}/{displayedPlayer.maxMp}
                    </span>
                </div>
              </div>
            </div>
            <div className="stat-bar-item">
              <span className="stat-label">经验:</span>
              <div className="stat-bar-container">
                <div className="stat-bar">
                  <div className="stat-fill exp" style={{ width: `${expPercent}%` }}></div>
                    <span className="stat-value">
                      {displayedPlayer.exp !== undefined ? displayedPlayer.exp : 0}/
                      {displayedPlayer.expMax !== undefined ? displayedPlayer.expMax : 0}
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 宠物属性 */}
        {currentPet && (
          <div className="unit-stats pet-stats">
            <div className="unit-name">
              <span className="unit-name-text">
                {elementIcons[currentPet.element]} {currentPet.name}
              </span>
              <span className="unit-level">Lv.{currentPet.level}</span>
            </div>
            <div className="stat-bars">
              <div className="stat-bar-item">
                <span className="stat-label">生命:</span>
                <div className="stat-bar-container">
                  <div className="stat-bar">
                    <div className="stat-fill hp" style={{ width: `${petHpPercent}%` }}></div>
                    <span className="stat-value">{currentPet.hp}/{currentPet.maxHp}</span>
                  </div>
                </div>
              </div>
              <div className="stat-bar-item">
                <span className="stat-label">法力:</span>
                <div className="stat-bar-container">
                  <div className="stat-bar">
                    <div className="stat-fill mp" style={{ width: `${petMpPercent}%` }}></div>
                    <span className="stat-value">{currentPet.mp}/{currentPet.maxMp}</span>
                  </div>
                </div>
              </div>
              <div className="stat-bar-item">
                <span className="stat-label">经验:</span>
                <div className="stat-bar-container">
                  <div className="stat-bar">
                    <div className="stat-fill exp" style={{ width: `${petExpPercent}%` }}></div>
                    <span className="stat-value">
                      {petTotalExp}/{currentPet.expMax}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BattleStatsPanel

