import { useGame } from '../context/GameContext'
import './PlayerInfo.css'

function PlayerInfo({ onOpenSectPanel, onOpenEquipmentPanel }) {
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
      <div className="player-basic-info">
        <div className="info-item">
          <span className="info-label">等级:</span>
          <span className="info-value">{player.level}</span>
        </div>
        <div className="info-item">
          <span className="info-label">经验:</span>
          <span className="info-value">{player.exp}/{player.expMax}</span>
        </div>
        <div className="info-item">
          <span className="info-label">系别:</span>
          <span className="info-value">{player.element}</span>
        </div>
        <div className="info-item">
          <span className="info-label">门派:</span>
          <span className="info-value">{player.sect || '未拜入'}</span>
        </div>
      </div>
      <div className="attributes">
        <div className="attr-item">力量: {player.strength || 0}</div>
        <div className="attr-item">体质: {player.constitution || 0}</div>
        <div className="attr-item">灵力: {player.spirit || 0}</div>
        <div className="attr-item">敏捷: {player.agility || 0}</div>
        <div className="attr-item">可分配点数: {player.points}</div>
        <div className="attr-item money-display">金钱: <span className="money-value">{money}</span> 文</div>
      </div>
      <div className="player-actions">
        <button className="btn btn-secondary" onClick={onOpenSectPanel}>
          {player.sect ? '门派技能' : player.level >= 10 ? '拜入门派' : '门派(需10级)'}
        </button>
        <button className="btn btn-secondary" onClick={onOpenEquipmentPanel}>
          装备
        </button>
      </div>
    </div>
  )
}

export default PlayerInfo

