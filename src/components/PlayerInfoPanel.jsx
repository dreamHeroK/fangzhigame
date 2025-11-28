import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { updatePlayerBattleStats } from '../utils/attributeCalc'
import { getAllEquipmentStats } from '../utils/equipment'
import { calculateElementBonus } from '../utils/elements'
import './PlayerInfoPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function PlayerInfoPanel({ onClose, onOpenSectPanel, onOpenEquipmentPanel, onOpenPetPanel }) {
  const { player, setPlayer, money, pets, elementPoints, setElementPoints, equippedItems, resetGame } = useGame()
  const [allocatingAttr, setAllocatingAttr] = useState(null)
  const [allocatingElement, setAllocatingElement] = useState(null)
  const [attrAssignStep, setAttrAssignStep] = useState(1)
  const [elementAssignStep, setElementAssignStep] = useState(1)
  const [activeDetailTab, setActiveDetailTab] = useState('attributes')

  const handleLogout = () => {
    if (window.confirm('确定要注销当前角色吗？这将清除所有游戏数据并返回角色选择界面。')) {
      resetGame()
      onClose()
    }
  }

  if (!player) return null

  const normalizeAmount = (value) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric) || numeric <= 0) return 1
    return Math.floor(numeric)
  }

  const quickAssignSteps = [1, 5, 10]

  const handleQuickAllocate = (attr, amount = attrAssignStep) => {
    if (player.points <= 0) {
      alert('没有可分配的属性点！')
      return
    }

    const pointsToUse = Math.min(normalizeAmount(amount), player.points)
    if (pointsToUse <= 0) return

    const newPlayer = { ...player }
    newPlayer[attr] = (newPlayer[attr] || 0) + pointsToUse
    newPlayer.points = (newPlayer.points || 0) - pointsToUse

    const equipmentStats = getAllEquipmentStats(equippedItems)
    const updatedPlayer = updatePlayerBattleStats(newPlayer, elementPoints, equipmentStats)

    setPlayer(updatedPlayer)
    setAllocatingAttr(attr)
    setTimeout(() => setAllocatingAttr(null), 500)
  }

  const handleQuickAllocateElement = (element, amount = elementAssignStep) => {
    const totalPoints = Object.values(elementPoints).reduce((sum, val) => sum + val, 0)
    const maxPoints = player.level * 2
    const remainingPoints = maxPoints - totalPoints

    if (remainingPoints <= 0) {
      alert(`相性点已达上限（${maxPoints}点）！`)
      return
    }

    const pointsToUse = Math.min(normalizeAmount(amount), remainingPoints)
    if (pointsToUse <= 0) return

    const newElementPoints = { ...elementPoints }
    newElementPoints[element] = (newElementPoints[element] || 0) + pointsToUse
    setElementPoints(newElementPoints)

    const equipmentStats = getAllEquipmentStats(equippedItems)
    const updatedPlayer = updatePlayerBattleStats(player, newElementPoints, equipmentStats)
    setPlayer(updatedPlayer)

    setAllocatingElement(element)
    setTimeout(() => setAllocatingElement(null), 500)
  }

  const handleAttrAssignStepChange = (value) => {
    const parsed = parseInt(value, 10)
    setAttrAssignStep(Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed)
  }

  const handleElementAssignStepChange = (value) => {
    const parsed = parseInt(value, 10)
    setElementAssignStep(Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed)
  }

  const attributeConfig = [
    { key: 'strength', label: '力量' },
    { key: 'constitution', label: '体质' },
    { key: 'spirit', label: '灵力' },
    { key: 'agility', label: '敏捷' },
  ]

  const elementConfig = [
    { key: 'gold', label: '金', icon: '⚡' },
    { key: 'wood', label: '木', icon: '🌲' },
    { key: 'water', label: '水', icon: '💧' },
    { key: 'fire', label: '火', icon: '🔥' },
    { key: 'earth', label: '土', icon: '⛰️' },
  ]

  const totalElementPoints = Object.values(elementPoints || {}).reduce((sum, val) => sum + val, 0)
  const maxElementPoints = player.level * 2
  const remainingElementPoints = Math.max(0, maxElementPoints - totalElementPoints)
  const elementBonus = calculateElementBonus(elementPoints || {})
  const detailTabs = [
    { key: 'attributes', label: '属性' },
    { key: 'elements', label: '相性' },
  ]

  const getPercent = (value = 0, max = 0) => {
    if (!max || max <= 0) return 0
    return Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  }

  const statBars = [
    { key: 'hp', label: '气血', current: player.hp || 0, max: player.maxHp || 0, percent: getPercent(player.hp, player.maxHp), tone: 'hp' },
    { key: 'mp', label: '法力', current: player.mp || 0, max: player.maxMp || 0, percent: getPercent(player.mp, player.maxMp), tone: 'mp' },
    { key: 'exp', label: '经验', current: player.exp || 0, max: player.expMax || 0, percent: getPercent(player.exp, player.expMax), tone: 'exp' },
  ]

  const basicInfoRows = [
    { label: '名称', value: player.name },
    { label: '称谓', value: player.title || '无' },
    { label: '等级', value: player.level },
    { label: '经验', value: `${player.exp}/${player.expMax}` },
    { label: '系别', value: player.element },
    { label: '门派', value: player.sect || '未拜入' },
    { label: '金钱', value: `${money} 文` },
    { label: '宠物', value: `${pets.length} 只` },
  ]

  const elementDetails = elementConfig.map(({ key, label, icon }) => ({
    key,
    label,
    icon,
    points: elementPoints[key] || 0,
    damage: `+${Math.round(((elementBonus.spellDamageBonus?.[key] || 1) - 1) * 100)}%`,
    resist: `+${Math.round((elementBonus.spellResistance?.[key] || 0) * 100)}%`,
  }))

  const attributeDetail = (
    <>
      <div className="batch-assign-controls vintage">
        <label>批量分配</label>
        <input
          type="number"
          min="1"
          value={attrAssignStep}
          onChange={(e) => handleAttrAssignStepChange(e.target.value)}
        />
        <div className="batch-step-buttons">
          {quickAssignSteps.map((step) => (
            <button
              key={step}
              type="button"
              className={`batch-step-btn${attrAssignStep === step ? ' active' : ''}`}
              onClick={() => setAttrAssignStep(step)}
            >
              +{step}
            </button>
          ))}
          <button
            type="button"
            className="batch-step-btn"
            onClick={() => player.points > 0 && setAttrAssignStep(player.points)}
            disabled={player.points <= 0}
          >
            全部
          </button>
        </div>
      </div>
      <div className="attributes-list-modern compact">
        {attributeConfig.map(({ key, label }) => (
          <div
            key={key}
            className={`attribute-row ${allocatingAttr === key ? 'allocating' : ''}`}
          >
            <div className="attribute-info">
              <span className="attribute-label">{label}:</span>
              <span className="attribute-value">{player[key] || 0}</span>
            </div>
            <button
              className="btn-allocate-small"
              onClick={() => handleQuickAllocate(key)}
              disabled={player.points <= 0}
              title={player.points > 0 ? `批量分配到${label}` : '没有可分配的属性点'}
            >
              +
            </button>
          </div>
        ))}
      </div>
      <div className="points-display-modern">
        <span className="points-label">可分配点数</span>
        <span className={`points-value ${player.points > 0 ? 'has-points' : ''}`}>
          {player.points}
        </span>
      </div>
    </>
  )

  const elementDetail = (
    <>
      <div className="batch-assign-controls vintage">
        <label>批量分配</label>
        <input
          type="number"
          min="1"
          value={elementAssignStep}
          onChange={(e) => handleElementAssignStepChange(e.target.value)}
        />
        <div className="batch-step-buttons">
          {quickAssignSteps.map((step) => (
            <button
              key={step}
              type="button"
              className={`batch-step-btn${elementAssignStep === step ? ' active' : ''}`}
              onClick={() => setElementAssignStep(step)}
            >
              +{step}
            </button>
          ))}
          <button
            type="button"
            className="batch-step-btn"
            onClick={() => remainingElementPoints > 0 && setElementAssignStep(remainingElementPoints)}
            disabled={remainingElementPoints <= 0}
          >
            全部
          </button>
        </div>
      </div>
      <div className="element-detail-list">
        {elementDetails.map(({ key, label, icon, points, damage, resist }) => (
          <div key={key} className={`element-detail-row ${allocatingElement === key ? 'allocating' : ''}`}>
            <div className="element-badge">
              <span>{icon}</span>
              <strong>{label}</strong>
            </div>
            <div className="element-points-count">{points}</div>
            <div className="element-bonus">伤害 {damage}</div>
            <div className="element-bonus">抗性 {resist}</div>
            <button
              className="btn-allocate-small"
              onClick={() => handleQuickAllocateElement(key)}
              disabled={remainingElementPoints <= 0}
            >
              +
            </button>
          </div>
        ))}
      </div>
      <div className="points-display-modern element-points">
        <span className="points-label">相性点</span>
        <span className={`points-value ${totalElementPoints > 0 ? 'has-points' : ''}`}>
          {totalElementPoints} / {maxElementPoints}
        </span>
      </div>
    </>
  )

  return (
    <div className="modal active player-status-overlay" onClick={onClose}>
      <div className="modal-content player-status-window" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <div className="status-layout">
          <div className="status-left">
            <div className="portrait-card">
              <div className="avatar-ring">
                <div className="avatar-circle">
                  {elementIcons[player.element]}
                </div>
              </div>
              <div className="avatar-caption">
                <h3>{player.name}</h3>
                <p>{player.title || '无称号'}</p>
              </div>
            </div>
            <div className="basic-info-card">
              <h3>人物信息</h3>
              <div className="basic-info-grid">
                {basicInfoRows.map(({ label, value }) => (
                  <div key={label} className="basic-info-row">
                    <span className="info-label">{label}</span>
                    <span className="info-value">{value}</span>
                  </div>
                ))}
              </div>
              <div className="basic-info-note">
                修为: {player.merit || 0}　历练: {player.practiceYears || 0}年
              </div>
            </div>
          </div>
          <div className="status-right">
            <div className="stat-bars-card">
              <div className="level-display">
                <span className="level-label">等级</span>
                <span className="level-value">{player.level}</span>
              </div>
              {statBars.map((bar) => (
                <div key={bar.key} className="stat-bar">
                  <div className={`stat-bar-track ${bar.tone}`}>
                    <div className="stat-bar-fill" style={{ width: `${bar.percent}%` }} />
                    <span className="stat-bar-text">
                      {bar.current}/{bar.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="detail-box">
              <div className="detail-tabs">
                {detailTabs.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`detail-tab${activeDetailTab === key ? ' active' : ''}`}
                    onClick={() => setActiveDetailTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="detail-content">
                {activeDetailTab === 'attributes' ? attributeDetail : elementDetail}
              </div>
            </div>
          </div>
        </div>
        <div className="player-status-actions">
          <button className="btn legacy" onClick={onOpenSectPanel}>
            {player.sect ? '门派技能' : player.level >= 10 ? '拜入门派' : '门派(需10级)'}
          </button>
          <button className="btn legacy" onClick={onOpenEquipmentPanel}>
            装备
          </button>
          <button className="btn legacy" onClick={onOpenPetPanel}>
            宠物管理
          </button>
          <button className="btn danger" onClick={handleLogout}>
            注销角色
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerInfoPanel

