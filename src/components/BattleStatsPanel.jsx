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

  const hpPercent = (player.hp / player.maxHp) * 100
  const mpPercent = (player.mp / player.maxMp) * 100

  // 获取最新的宠物数据
  const currentPet = activePet ? pets.find(p => p.id === activePet.id) || activePet : null
  const petHpPercent = currentPet ? (currentPet.hp / currentPet.maxHp) * 100 : 0
  const petMpPercent = currentPet ? (currentPet.mp / currentPet.maxMp) * 100 : 0

  return (
    <div className="battle-stats-panel">
      <div className="battle-stats-header">
        <h3>战斗属性</h3>
      </div>
      <div className="battle-stats-content">
        {/* 玩家属性 */}
        <div className="unit-stats">
          <div className="unit-name">{player.name}</div>
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
          </div>
          <div className="battle-attributes">
            <div className="battle-attr-item">
              <span className="attr-label">攻击:</span>
              <span className="attr-value">{player.attack}</span>
            </div>
            <div className="battle-attr-item">
              <span className="attr-label">防御:</span>
              <span className="attr-value">{player.defense}</span>
            </div>
            <div className="battle-attr-item">
              <span className="attr-label">速度:</span>
              <span className="attr-value">{player.speed}</span>
            </div>
            <div className="battle-attr-item">
              <span className="attr-label">命中:</span>
              <span className="attr-value">{player.hitRate}%</span>
            </div>
          </div>
        </div>

        {/* 宠物属性 */}
        {currentPet && (
          <div className="unit-stats pet-stats">
            <div className="unit-name">
              {elementIcons[currentPet.element]} {currentPet.name}
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
            </div>
            <div className="battle-attributes">
              <div className="battle-attr-item">
                <span className="attr-label">攻击:</span>
                <span className="attr-value">{currentPet.attack}</span>
              </div>
              <div className="battle-attr-item">
                <span className="attr-label">防御:</span>
                <span className="attr-value">{currentPet.defense}</span>
              </div>
              <div className="battle-attr-item">
                <span className="attr-label">速度:</span>
                <span className="attr-value">{currentPet.speed}</span>
              </div>
              <div className="battle-attr-item">
                <span className="attr-label">命中:</span>
                <span className="attr-value">{currentPet.hitRate}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BattleStatsPanel

