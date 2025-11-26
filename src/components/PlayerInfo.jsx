import { useGame } from '../context/GameContext'
import './PlayerInfo.css'

function PlayerInfo({ onOpenAttrPanel, onOpenSectPanel, onOpenElementPanel, onOpenEquipmentPanel }) {
  const { player, money, elementPoints } = useGame()

  if (!player) return null

  const hpPercent = (player.hp / player.maxHp) * 100
  const mpPercent = (player.mp / player.maxMp) * 100

  const elementIcons = {
    '金': '⚡',
    '木': '🌲',
    '水': '💧',
    '火': '🔥',
    '土': '⛰️'
  }

  return (
    <div className="player-info">
      <h2>{elementIcons[player.element]} {player.name}</h2>
      <div className="stats">
        <div className="stat-item">
          <span className="stat-label">生命:</span>
          <div className="stat-bar">
            <div className="stat-fill hp" style={{ width: `${hpPercent}%` }}></div>
          </div>
          <span>{player.hp}/{player.maxHp}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">法力:</span>
          <div className="stat-bar">
            <div className="stat-fill mp" style={{ width: `${mpPercent}%` }}></div>
          </div>
          <span>{player.mp}/{player.maxMp}</span>
        </div>
        <div className="stat-item">
          <span>等级: {player.level}</span>
          <span>经验: {player.exp}/{player.expMax}</span>
        </div>
      </div>
      <div className="attributes">
        <div className="attr-item">系别: {player.element}</div>
        <div className="attr-item">门派: {player.sect || '未拜入'}</div>
        <div className="attr-item">力量: {player.strength || 0}</div>
        <div className="attr-item">体质: {player.constitution || 0}</div>
        <div className="attr-item">灵力: {player.spirit || 0}</div>
        <div className="attr-item">敏捷: {player.agility || 0}</div>
        <div className="attr-item">攻击: {player.attack}</div>
        <div className="attr-item">防御: {player.defense}</div>
        <div className="attr-item">速度: {player.speed}</div>
        <div className="attr-item">可分配点数: {player.points}</div>
        <div className="attr-item money-display">金钱: <span className="money-value">{money}</span> 文</div>
      </div>
      <div className="player-actions">
        <button className="btn btn-secondary" onClick={onOpenAttrPanel}>
          属性加点
        </button>
        <button className="btn btn-secondary" onClick={onOpenSectPanel}>
          {player.sect ? '门派技能' : player.level >= 10 ? '拜入门派' : '门派(需10级)'}
        </button>
        <button className="btn btn-secondary" onClick={onOpenElementPanel}>
          相性点
        </button>
        <button className="btn btn-secondary" onClick={onOpenEquipmentPanel}>
          装备
        </button>
      </div>
    </div>
  )
}

export default PlayerInfo

