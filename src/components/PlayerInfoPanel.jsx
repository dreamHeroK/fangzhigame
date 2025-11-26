import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { updatePlayerBattleStats } from '../utils/attributeCalc'
import { getAllEquipmentStats } from '../utils/equipment'
import './PlayerInfoPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function PlayerInfoPanel({ onClose, onOpenPlayerAttributePanel, onOpenSectPanel, onOpenEquipmentPanel, onOpenPetPanel }) {
  const { player, setPlayer, money, pets, elementPoints, setElementPoints, equippedItems, resetGame } = useGame()
  const [allocatingAttr, setAllocatingAttr] = useState(null)
  const [allocatingElement, setAllocatingElement] = useState(null)

  const handleLogout = () => {
    if (window.confirm('确定要注销当前角色吗？这将清除所有游戏数据并返回角色选择界面。')) {
      resetGame()
      onClose()
    }
  }

  if (!player) return null

  const handleQuickAllocate = (attr) => {
    if (player.points <= 0) {
      alert('没有可分配的属性点！')
      return
    }

    const newPlayer = { ...player }
    
    // 增加对应属性
    if (attr === 'strength') newPlayer.strength = (newPlayer.strength || 0) + 1
    else if (attr === 'constitution') newPlayer.constitution = (newPlayer.constitution || 0) + 1
    else if (attr === 'spirit') newPlayer.spirit = (newPlayer.spirit || 0) + 1
    else if (attr === 'agility') newPlayer.agility = (newPlayer.agility || 0) + 1
    
    // 减少可分配点数
    newPlayer.points = (newPlayer.points || 0) - 1

    // 重新计算战斗属性
    const equipmentStats = getAllEquipmentStats(equippedItems)
    const updatedPlayer = updatePlayerBattleStats(newPlayer, elementPoints, equipmentStats)
    
    setPlayer(updatedPlayer)
    
    // 显示反馈
    setAllocatingAttr(attr)
    setTimeout(() => setAllocatingAttr(null), 500)
  }

  const handleQuickAllocateElement = (element) => {
    const totalPoints = Object.values(elementPoints).reduce((sum, val) => sum + val, 0)
    const maxPoints = player.level * 2 // 每级2点相性点

    if (totalPoints >= maxPoints) {
      alert(`相性点已达上限（${maxPoints}点）！`)
      return
    }

    const newElementPoints = { ...elementPoints }
    newElementPoints[element] = (newElementPoints[element] || 0) + 1
    setElementPoints(newElementPoints)

    // 重新计算战斗属性
    const equipmentStats = getAllEquipmentStats(equippedItems)
    const updatedPlayer = updatePlayerBattleStats(player, newElementPoints, equipmentStats)
    setPlayer(updatedPlayer)

    // 显示反馈
    setAllocatingElement(element)
    setTimeout(() => setAllocatingElement(null), 500)
  }

  const attributeConfig = [
    { key: 'strength', label: '力量', desc: '影响物理攻击和命中' },
    { key: 'constitution', label: '体质', desc: '影响气血和防御' },
    { key: 'spirit', label: '灵力', desc: '影响法力和法术伤害' },
    { key: 'agility', label: '敏捷', desc: '影响攻击顺序' },
  ]

  const elementConfig = [
    { key: 'gold', label: '金', icon: '⚡', desc: '法术伤害+2%, 法术抗性+1%' },
    { key: 'wood', label: '木', icon: '🌲', desc: '法术伤害+2%, 法术抗性+1%' },
    { key: 'water', label: '水', icon: '💧', desc: '法术伤害+2%, 法术抗性+1%' },
    { key: 'fire', label: '火', icon: '🔥', desc: '法术伤害+2%, 法术抗性+1%' },
    { key: 'earth', label: '土', icon: '⛰️', desc: '法术伤害+2%, 法术抗性+1%' },
  ]

  const totalElementPoints = Object.values(elementPoints || {}).reduce((sum, val) => sum + val, 0)
  const maxElementPoints = player.level * 2

  return (
    <div 
      className="modal active" 
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div 
        className="modal-content player-info-panel-modern" 
        onClick={(e) => e.stopPropagation()}
      >
        <span className="close" onClick={onClose}>&times;</span>
        
        {/* 头部 */}
        <div className="player-info-header-modern">
          <h2>
            {elementIcons[player.element]} {player.name}
          </h2>
        </div>

        {/* 内容区域 - 参考问道布局：左侧信息，右侧属性 */}
        <div className="player-info-body">
          <div className="player-info-grid">
            {/* 左侧：基本信息 */}
            <div className="player-info-left">
              <div className="info-card">
                <h3>基本信息</h3>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-label">等级:</span>
                    <span className="info-value">{player.level}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">经验:</span>
                    <span className="info-value">{player.exp}/{player.expMax}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">系别:</span>
                    <span className="info-value highlight">{player.element}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">门派:</span>
                    <span className="info-value">{player.sect || '未拜入'}</span>
                  </div>
                </div>
              </div>

              {pets.length > 0 && (
                <div className="info-card">
                  <h3>宠物</h3>
                  <div className="pet-info-content">
                    <div className="pet-count">拥有 {pets.length} 只</div>
                    <div className="pet-tags">
                      {pets.map(p => (
                        <span key={p.id} className="pet-tag">
                          {elementIcons[p.element]} {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="info-card money-card">
                <div className="info-row">
                  <span className="info-label">金钱:</span>
                  <span className="info-value money">{money} 文</span>
                </div>
              </div>
            </div>

            {/* 右侧：基础属性和相性点 */}
            <div className="player-info-right">
              <div className="info-card">
                <h3>基础属性</h3>
                <div className="attributes-list-modern">
                  {attributeConfig.map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className={`attribute-row ${allocatingAttr === key ? 'allocating' : ''}`}
                    >
                      <div className="attribute-info">
                        <span className="attribute-label">{label}:</span>
                        <span className="attribute-value">{player[key] || 0}</span>
                        <span className="attribute-desc">{desc}</span>
                      </div>
                      <button
                        className="btn-allocate-small"
                        onClick={() => handleQuickAllocate(key)}
                        disabled={player.points <= 0}
                        title={player.points > 0 ? `分配1点属性到${label} - ${desc}` : '没有可分配的属性点'}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
                <div className="points-display-modern">
                  <span className="points-label">可分配点数:</span>
                  <span className={`points-value ${player.points > 0 ? 'has-points' : ''}`}>
                    {player.points}
                  </span>
                </div>
              </div>

              <div className="info-card">
                <h3>相性点</h3>
                <div className="attributes-list-modern">
                  {elementConfig.map(({ key, label, icon, desc }) => (
                    <div
                      key={key}
                      className={`attribute-row ${allocatingElement === key ? 'allocating' : ''}`}
                    >
                      <div className="attribute-info">
                        <span className="attribute-label">{icon} {label}:</span>
                        <span className="attribute-value">{elementPoints[key] || 0}</span>
                        <span className="attribute-desc">{desc}</span>
                      </div>
                      <button
                        className="btn-allocate-small"
                        onClick={() => handleQuickAllocateElement(key)}
                        disabled={totalElementPoints >= maxElementPoints}
                        title={totalElementPoints < maxElementPoints ? `分配1点相性到${label}相性` : `相性点已达上限（${maxElementPoints}点）`}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
                <div className="points-display-modern element-points">
                  <span className="points-label">已分配相性点:</span>
                  <span className={`points-value ${totalElementPoints > 0 ? 'has-points' : ''}`}>
                    {totalElementPoints} / {maxElementPoints}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="player-info-actions">
          <button className="btn btn-primary-modern" onClick={onOpenPlayerAttributePanel}>
            人物属性
          </button>
          <button className="btn btn-secondary-modern" onClick={onOpenSectPanel}>
            {player.sect ? '门派技能' : player.level >= 10 ? '拜入门派' : '门派(需10级)'}
          </button>
          <button className="btn btn-secondary-modern" onClick={onOpenEquipmentPanel}>
            装备
          </button>
          {pets.length > 0 && (
            <button className="btn btn-secondary-modern" onClick={onOpenPetPanel}>
              宠物管理
            </button>
          )}
          <button className="btn btn-danger-modern" onClick={handleLogout}>
            注销角色
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerInfoPanel

