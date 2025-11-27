import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { calculateBattleStats } from '../utils/attributeCalc'
import './RedeemCodeModal.css'

const GOD_MODE_CODE = 'K神无敌'
const SPEED_CODE = '996'
const DIVINE_PET_CODE = '我爱K神'

function RedeemCodeModal({ onClose }) {
  const { redeemStatus, setRedeemStatus, pets, setPets } = useGame()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleRedeem = () => {
    const trimmed = code.trim()
    if (trimmed === GOD_MODE_CODE) {
      if (redeemStatus?.godMode) {
        setMessage({ text: '该兑换码已激活，无需重复输入。', type: 'info' })
      } else {
        setRedeemStatus({ ...redeemStatus, godMode: true })
        setMessage({ text: '兑换成功！每场战斗结束后将自动补满生命和法力。', type: 'success' })
      }
    } else if (trimmed === SPEED_CODE) {
      if (redeemStatus?.tripleSpeed) {
        setMessage({ text: '三倍速已激活，无需重复输入。', type: 'info' })
      } else {
        setRedeemStatus({ ...redeemStatus, tripleSpeed: true })
        setMessage({ text: '兑换成功！自动战斗将以三倍速度进行。', type: 'success' })
      }
    } else if (trimmed === DIVINE_PET_CODE) {
      // 检查是否已经拥有孙悟空
      const hasSunWukong = pets.some(pet => pet.name === '孙悟空')
      if (hasSunWukong) {
        setMessage({ text: '您已经拥有孙悟空，无需重复兑换。', type: 'info' })
      } else {
        // 创建孙悟空宠物
        const sunWukong = {
          id: pets.length,
          element: '金',
          name: '孙悟空',
          level: 1,
          strength: 10,
          constitution: 10,
          spirit: 10,
          agility: 10,
          points: 50, // 初始属性点
          baseAttrs: {
            strength: 10,
            constitution: 10,
            spirit: 10,
            agility: 10,
          },
          // 神兽属性
          isDivine: true,
          growth: 10000, // 成长性
          attackAptitude: 10000, // 攻击资质
          defenseAptitude: 10000, // 防御资质
          magicAptitude: 10000, // 法力资质
          skills: [
            {
              id: 'sunwukong_skill_1',
              name: '如意金箍棒',
              element: '金',
              mpCost: 20,
              damage: 2.0,
              desc: '神兽专属技能，造成大量物理伤害',
            }
          ],
        }
        
        // 计算初始战斗属性
        const petStats = {
          growth: sunWukong.growth,
          attackAptitude: sunWukong.attackAptitude,
          defenseAptitude: sunWukong.defenseAptitude,
          magicAptitude: sunWukong.magicAptitude,
        }
        const battleStats = calculateBattleStats(
          {
            strength: sunWukong.strength,
            constitution: sunWukong.constitution,
            spirit: sunWukong.spirit,
            agility: sunWukong.agility,
          },
          sunWukong.level,
          null,
          {},
          petStats
        )
        
        sunWukong.attack = battleStats.attack
        sunWukong.defense = battleStats.defense
        sunWukong.speed = battleStats.speed
        sunWukong.maxHp = battleStats.maxHp
        sunWukong.maxMp = battleStats.maxMp
        sunWukong.hp = battleStats.maxHp
        sunWukong.mp = battleStats.maxMp
        sunWukong.hitRate = battleStats.hitRate
        sunWukong.magicDamage = battleStats.magicDamage
        
        setPets([...pets, sunWukong])
        setMessage({ text: '兑换成功！获得神兽孙悟空！', type: 'success' })
      }
    } else {
      setMessage({ text: '兑换码无效，请重新输入。', type: 'error' })
    }
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content redeem-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>兑换码</h2>
        <p>输入兑换码以激活特殊效果。</p>
        <div className="redeem-form">
          <input
            type="text"
            placeholder="请输入兑换码"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleRedeem}>
            兑换
          </button>
        </div>
        {message.text && (
          <div className={`redeem-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default RedeemCodeModal

