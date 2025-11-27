import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { useBattle } from '../hooks/useBattle'
import { getAllMedicines } from '../utils/items'
import { maps } from '../utils/maps'
import './ActionPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function ActionPanel() {
  const {
    inBattle,
    playerTurn,
    selectedMonster,
    setSelectedMonster,
    player,
    inventory,
    autoSettings,
    setAutoSettings,
    currentMap,
    monsters,
    activePet,
    pets,
  } = useGame()
  const { startBattle, playerAttack, playerDefend, playerSkill, captureMonster, useMedicine } = useBattle()
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const playerAttackRef = useRef(playerAttack)
  const playerSkillRef = useRef(playerSkill)
  const captureMonsterRef = useRef(captureMonster)

  useEffect(() => {
    playerAttackRef.current = playerAttack
  }, [playerAttack])

  useEffect(() => {
    playerSkillRef.current = playerSkill
  }, [playerSkill])

  useEffect(() => {
    captureMonsterRef.current = captureMonster
  }, [captureMonster])

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
  const isSafeZone = maps[currentMap]?.type === 'safe'

  useEffect(() => {
    if (!autoSettings.autoBattle || !inBattle || !playerTurn || !player) return

    const aliveMonsters = (monsters || []).filter(m => m.hp > 0)
    if (!aliveMonsters.length) return

    if (!selectedMonster || selectedMonster.hp <= 0) {
      setSelectedMonster(aliveMonsters[0])
      return
    }

    if (
      autoSettings.autoCapture &&
      selectedMonster.hp > 0 &&
      selectedMonster.maxHp > 0 &&
      selectedMonster.hp / selectedMonster.maxHp <= 0.3
    ) {
      captureMonsterRef.current()
      return
    }

    const autoSkill = learnedSkills.find(skill => skill.id === autoSettings.autoSkillId)
    if (autoSkill && player.mp >= autoSkill.mpCost) {
      playerSkillRef.current(autoSkill)
    } else {
      playerAttackRef.current()
    }
  }, [
    autoSettings,
    inBattle,
    playerTurn,
    selectedMonster,
    monsters,
    learnedSkills,
    player,
    setSelectedMonster,
  ])

  const handleAutoSettingsChange = (key, value) => {
    setAutoSettings(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="action-panel">
      {!inBattle ? (
        <div className="pre-battle-actions">
          <button
            className="btn btn-primary"
            onClick={startBattle}
            disabled={isSafeZone}
            title={isSafeZone ? '安全区无法战斗' : ''}
          >
            开始战斗
          </button>
          {isSafeZone && (
            <div className="safe-hint">
              安全区无法战斗，请前往野外地图。
            </div>
          )}
        </div>
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
      <div className="auto-settings-panel">
        <div className="auto-settings-header">自动战斗设置</div>
        <label className="auto-checkbox">
          <input
            type="checkbox"
            checked={autoSettings.autoBattle}
            onChange={(e) => handleAutoSettingsChange('autoBattle', e.target.checked)}
          />
          启用自动战斗
        </label>
        <label className="auto-checkbox">
          <input
            type="checkbox"
            checked={autoSettings.autoChainBattle}
            onChange={(e) => handleAutoSettingsChange('autoChainBattle', e.target.checked)}
          />
          连续战斗（每场结束后自动开战）
        </label>
        <label className="auto-checkbox">
          <input
            type="checkbox"
            checked={autoSettings.autoCapture}
            onChange={(e) => handleAutoSettingsChange('autoCapture', e.target.checked)}
          />
          自动捕捉（血量≤30%）
        </label>
        <div className="auto-skill-selector">
          <span>优先技能:</span>
          <select
            className="skill-select"
            value={autoSettings.autoSkillId ?? ''}
            onChange={(e) =>
              handleAutoSettingsChange(
                'autoSkillId',
                e.target.value ? parseInt(e.target.value, 10) : null
              )
            }
            disabled={learnedSkills.length === 0}
          >
            <option value="">普通攻击</option>
            {learnedSkills.map(skill => (
              <option key={skill.id} value={skill.id}>
                {elementIcons[skill.element]} {skill.name} ({skill.mpCost}MP)
              </option>
            ))}
          </select>
        </div>
        <div className="auto-tip">若法力不足，自动改用物理攻击。</div>
        {activePet && (() => {
          // 从 pets 数组中获取最新的宠物数据
          const latestActivePet = pets.find(p => p.id === activePet.id) || activePet
          return (
            <div className="auto-pet-info">
              <div className="auto-pet-label">上阵宠物:</div>
              <div className="auto-pet-name">
                {elementIcons[latestActivePet.element]} {latestActivePet.name}
                {latestActivePet.isDivine && <span className="divine-badge" style={{ fontSize: '0.6em', marginLeft: '5px' }}>神兽</span>}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default ActionPanel

