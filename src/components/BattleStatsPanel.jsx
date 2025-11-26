import { useGame } from '../context/GameContext'
import './BattleStatsPanel.css'

function BattleStatsPanel() {
  const { player } = useGame()

  if (!player) return null

  const hpPercent = (player.hp / player.maxHp) * 100
  const mpPercent = (player.mp / player.maxMp) * 100

  return (
    <div className="battle-stats-panel">
      <div className="battle-stats-header">
        <h3>战斗属性</h3>
      </div>
      <div className="battle-stats-content">
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
    </div>
  )
}

export default BattleStatsPanel

