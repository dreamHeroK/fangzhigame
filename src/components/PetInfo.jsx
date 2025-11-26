import { useGame } from '../context/GameContext'
import './PetInfo.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function PetInfo({ onOpenPetPanel }) {
  const { pets } = useGame()

  if (pets.length === 0) return null

  return (
    <div className="pet-info">
      <h3>宠物</h3>
      <div className="pet-display">
        <div>拥有 {pets.length} 只宠物</div>
        <div>
          {pets.map(p => `${elementIcons[p.element]} ${p.name}`).join(', ')}
        </div>
      </div>
      <button className="btn btn-secondary" onClick={onOpenPetPanel}>
        宠物管理
      </button>
    </div>
  )
}

export default PetInfo

