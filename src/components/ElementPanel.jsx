import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { updatePlayerBattleStats } from '../utils/attributeCalc'
import { getAllEquipmentStats } from '../utils/equipment'
import './ElementPanel.css'

const elementNames = {
  gold: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
}

const elementIcons = {
  gold: '⚡',
  wood: '🌲',
  water: '💧',
  fire: '🔥',
  earth: '⛰️',
}

function ElementPanel({ onClose, embedded = false }) {
  const { player, setPlayer, elementPoints, setElementPoints, equippedItems, playerRef } = useGame()
  const [tempPoints, setTempPoints] = useState(null)

  useEffect(() => {
    if (elementPoints) {
      setTempPoints({ ...elementPoints })
    }
  }, [elementPoints])

  if (!player || !tempPoints) return null

  const adjustElementPoint = (element, increase) => {
    const newPoints = { ...tempPoints }
    const totalPoints = Object.values(newPoints).reduce((sum, val) => sum + val, 0)
    const maxPoints = player.level * 2 // 每级2点相性点

    if (increase) {
      if (totalPoints >= maxPoints) {
        alert(`相性点已达上限（${maxPoints}点）！`)
        return
      }
      newPoints[element] = (newPoints[element] || 0) + 1
    } else {
      if (newPoints[element] <= 0) return
      newPoints[element]--
    }

    setTempPoints(newPoints)
  }

  const saveElementPoints = () => {
    setElementPoints(tempPoints)

    // 更新玩家属性（使用函数式更新确保使用最新状态）
    setPlayer(prev => {
      const base = playerRef?.current || prev
      if (!base) return base
      const equipmentStats = getAllEquipmentStats(equippedItems)
      return updatePlayerBattleStats(base, tempPoints, equipmentStats)
    })

    if (!embedded) {
      onClose()
    }
  }

  const totalPoints = Object.values(tempPoints).reduce((sum, val) => sum + val, 0)
  const maxPoints = player.level * 2

  const content = (
    <>
      {!embedded && (
        <>
          <span className="close" onClick={onClose}>&times;</span>
          <h2>相性点分配</h2>
        </>
      )}
        <div className="element-panel-content">
          <p className="points-info">
            已分配: {totalPoints} / {maxPoints} 点
          </p>
          {Object.keys(elementNames).map(element => (
            <div key={element} className="element-control">
              <label>
                {elementIcons[element]} {elementNames[element]}相性:
              </label>
              <button
                className="attr-btn"
                onClick={() => adjustElementPoint(element, false)}
                disabled={tempPoints[element] <= 0}
              >
                -
              </button>
              <span>{tempPoints[element] || 0}</span>
              <button
                className="attr-btn"
                onClick={() => adjustElementPoint(element, true)}
                disabled={totalPoints >= maxPoints}
              >
                +
              </button>
              <span className="element-desc">
                (法术伤害+{tempPoints[element] * 2}%, 法术抗性+{tempPoints[element]}%)
              </span>
            </div>
          ))}
          <div className="element-bonus">
            <h4>相性点总加成:</h4>
            <div className="bonus-list">
              <div>物理攻击: +{(totalPoints * 0.5).toFixed(1)}%</div>
              <div>防御: +{totalPoints * 0.3}</div>
              <div>速度: +{totalPoints * 0.2}</div>
              <div>气血: +{totalPoints * 10}</div>
              <div>法术攻击: +{(totalPoints * 0.5).toFixed(1)}%</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveElementPoints}>
            保存
          </button>
        </div>
    </>
  )

  if (embedded) {
    return <div className="element-panel-embedded">{content}</div>
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  )
}

export default ElementPanel

