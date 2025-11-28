import { useGame } from '../context/GameContext'
import './BattleStatsPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function BattleStatsPanel() {
  const { player, activePet, pets } = useGame()

  if (!player) return null

  const hpPercent = player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0
  const mpPercent = player.maxMp > 0 ? (player.mp / player.maxMp) * 100 : 0
  const expPercent = (player.expMax && player.expMax > 0) ? (player.exp / player.expMax) * 100 : 0

  // 获取最新的宠物数据
  const currentPet = activePet ? pets.find(p => p.id === activePet.id) || activePet : null
  const petHpPercent = currentPet ? (currentPet.hp / currentPet.maxHp) * 100 : 0
  const petMpPercent = currentPet ? (currentPet.mp / currentPet.maxMp) * 100 : 0
  const petExpPercent = currentPet ? (currentPet.exp / currentPet.expMax) * 100 : 0

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
            <span className="unit-level">Lv.{player.level !== undefined ? player.level : 1}</span>
          </div>
          <div className="stat-bars">
            <div className="stat-bar-item">
              <span className="stat-label">生命:</span>
              <div className="stat-bar-container">
                <div className="stat-bar">
                  <div className="stat-fill hp" style={{ width: `${hpPercent}%` }}></div>
                  <span className="stat-value">{player.hp}/{player.maxHp}</span>
                </div>
              </div>
            </div>
            <div className="stat-bar-item">
              <span className="stat-label">法力:</span>
              <div className="stat-bar-container">
                <div className="stat-bar">
                  <div className="stat-fill mp" style={{ width: `${mpPercent}%` }}></div>
                  <span className="stat-value">{player.mp}/{player.maxMp}</span>
                </div>
              </div>
            </div>
            <div className="stat-bar-item">
              <span className="stat-label">经验:</span>
              <div className="stat-bar-container">
                <div className="stat-bar">
                  <div className="stat-fill exp" style={{ width: `${expPercent}%` }}></div>
                  <span className="stat-value">{player.exp !== undefined ? player.exp : 0}/{player.expMax !== undefined ? player.expMax : 0}</span>
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
                    <span className="stat-value">{currentPet.exp}/{currentPet.expMax}</span>
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

