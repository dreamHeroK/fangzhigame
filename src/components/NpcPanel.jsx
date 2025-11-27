import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { equipmentTypes, generateEquipment } from '../utils/equipment'
import './NpcPanel.css'

function NpcPanel({ onClose }) {
  const {
    player,
    equipmentInventory,
    setEquipmentInventory,
    beginnerRewardClaimed,
    setBeginnerRewardClaimed,
  } = useGame()
  const [message, setMessage] = useState('')

  if (!player) return null

  const handleClaim = () => {
    if (beginnerRewardClaimed) {
      setMessage('你已经领取过新手装备啦，好好使用它们吧！')
      return
    }

    const newSet = Object.keys(equipmentTypes).map(type =>
      generateEquipment(type, 'green', Math.max(player.level, 1))
    )

    setEquipmentInventory([...(equipmentInventory || []), ...newSet])
    setBeginnerRewardClaimed(true)
    setMessage('领取成功！已发放整套新手装备，请在背包中查看。')
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content npc-panel" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <div className="npc-header">
          <div className="npc-avatar">🧙‍♂️</div>
          <div>
            <h2>新手大使</h2>
            <p>欢迎来到揽仙镇！我可以赠送你一套入门装备，助你踏上修行之路。</p>
          </div>
        </div>
        <ul className="npc-tips">
          <li>领取奖励：绿色品质全套装备（武器、护甲、头盔、靴子、饰品）。</li>
          <li>每个角色只能领取一次。</li>
        </ul>
        <button className="btn btn-primary" onClick={handleClaim} disabled={beginnerRewardClaimed}>
          {beginnerRewardClaimed ? '已领取' : '领取新手装备'}
        </button>
        {message && <div className="npc-message">{message}</div>}
      </div>
    </div>
  )
}

export default NpcPanel

