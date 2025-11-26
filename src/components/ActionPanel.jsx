import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { useBattle } from '../hooks/useBattle'
import { getAllMedicines } from '../utils/items'
import './ActionPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function ActionPanel() {
  const { inBattle, playerTurn, selectedMonster, player, inventory, setInventory } = useGame()
  const { startBattle, playerAttack, playerDefend, playerSkill, captureMonster, useMedicine } = useBattle()
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedMedicine, setSelectedMedicine] = useState(null)

  const handleSkillClick = () => {
    if (!selectedSkill && player?.skills && player.skills.length > 0) {
      setSelectedSkill(player.skills[0])
    }
    if (selectedSkill) {
      playerSkill(selectedSkill)
    }
  }

  const learnedSkills = player?.skills || []
  const availableMedicines = getAllMedicines().filter(med => (inventory[med.id] || 0) > 0)

  return (
    <div className="action-panel">
      {!inBattle ? (
        <button className="btn btn-primary" onClick={startBattle}>
          开始战斗
        </button>
      ) : (
        <>
          <button
            className="btn btn-attack"
            onClick={playerAttack}
            disabled={!playerTurn || !selectedMonster}
          >
            攻击
          </button>
          <button
            className="btn btn-defend"
            onClick={playerDefend}
            disabled={!playerTurn}
          >
            防御
          </button>
          {learnedSkills.length > 0 ? (
            <div className="skill-selector">
              <select
                className="skill-select"
                value={selectedSkill?.id || ''}
                onChange={(e) => {
                  const skill = learnedSkills.find(s => s.id === parseInt(e.target.value))
                  setSelectedSkill(skill)
                }}
                disabled={!playerTurn}
              >
                <option value="">选择技能</option>
                {learnedSkills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {elementIcons[skill.element]} {skill.name} ({skill.mpCost}MP)
                  </option>
                ))}
              </select>
              <button
                className="btn btn-skill"
                onClick={handleSkillClick}
                disabled={!playerTurn || !selectedMonster || !selectedSkill || player.mp < (selectedSkill?.mpCost || 0)}
              >
                使用技能
              </button>
            </div>
          ) : (
            <button
              className="btn btn-skill"
              disabled
              title="未学习技能"
            >
              技能(未学习)
            </button>
          )}
          <button
            className="btn btn-capture"
            onClick={captureMonster}
            disabled={!playerTurn || !selectedMonster}
          >
            捕捉
          </button>
          {availableMedicines.length > 0 && (
            <div className="medicine-selector">
              <select
                className="medicine-select"
                value={selectedMedicine?.id || ''}
                onChange={(e) => {
                  const med = availableMedicines.find(m => m.id === e.target.value)
                  setSelectedMedicine(med)
                }}
                disabled={!playerTurn}
              >
                <option value="">选择药品</option>
                {availableMedicines.map(med => (
                  <option key={med.id} value={med.id}>
                    {med.icon} {med.name} (拥有: {inventory[med.id]})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-medicine"
                onClick={() => {
                  if (selectedMedicine) {
                    useMedicine(selectedMedicine)
                    setSelectedMedicine(null)
                  }
                }}
                disabled={!playerTurn || !selectedMedicine}
              >
                使用药品
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ActionPanel

