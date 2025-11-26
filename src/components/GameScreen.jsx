import { useState } from 'react'
import PlayerInfo from './PlayerInfo'
import PetInfo from './PetInfo'
import MapPanel from './MapPanel'
import BattleArea from './BattleArea'
import ActionPanel from './ActionPanel'
import BattleLog from './BattleLog'
import AttributePanel from './AttributePanel'
import PetPanel from './PetPanel'
import SectPanel from './SectPanel'
import MedicineShop from './MedicineShop'
import ElementPanel from './ElementPanel'
import EquipmentPanel from './EquipmentPanel'
import './GameScreen.css'

function GameScreen() {
  const [showAttrPanel, setShowAttrPanel] = useState(false)
  const [showPetPanel, setShowPetPanel] = useState(false)
  const [showSectPanel, setShowSectPanel] = useState(false)
  const [showMedicineShop, setShowMedicineShop] = useState(false)
  const [showElementPanel, setShowElementPanel] = useState(false)
  const [showEquipmentPanel, setShowEquipmentPanel] = useState(false)

  return (
    <div className="game-screen">
      <div className="game-header">
        <PlayerInfo 
          onOpenAttrPanel={() => setShowAttrPanel(true)}
          onOpenSectPanel={() => setShowSectPanel(true)}
          onOpenElementPanel={() => setShowElementPanel(true)}
          onOpenEquipmentPanel={() => setShowEquipmentPanel(true)}
        />
        <PetInfo onOpenPetPanel={() => setShowPetPanel(true)} />
      </div>

      <MapPanel />

      <div className="shop-button-container">
        <button className="btn btn-shop" onClick={() => setShowMedicineShop(true)}>
          药品商店
        </button>
      </div>

      <BattleArea />

      <ActionPanel />

      <BattleLog />

      {showAttrPanel && (
        <AttributePanel onClose={() => setShowAttrPanel(false)} />
      )}

      {showPetPanel && (
        <PetPanel onClose={() => setShowPetPanel(false)} />
      )}

      {showSectPanel && (
        <SectPanel onClose={() => setShowSectPanel(false)} />
      )}

      {showMedicineShop && (
        <MedicineShop onClose={() => setShowMedicineShop(false)} />
      )}

      {showElementPanel && (
        <ElementPanel onClose={() => setShowElementPanel(false)} />
      )}

      {showEquipmentPanel && (
        <EquipmentPanel onClose={() => setShowEquipmentPanel(false)} />
      )}
    </div>
  )
}

export default GameScreen

