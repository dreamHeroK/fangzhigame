import { useState } from 'react'
import { useGame } from '../context/GameContext'
import MapPanel from './MapPanel'
import BattleArea from './BattleArea'
import BattleStatsPanel from './BattleStatsPanel'
import ActionPanel from './ActionPanel'
import BattleLog from './BattleLog'
import PlayerInfoPanel from './PlayerInfoPanel'
import PetPanel from './PetPanel'
import PetDexPanel from './PetDexPanel'
import SectPanel from './SectPanel'
import MedicineShop from './MedicineShop'
import EquipmentPanel from './EquipmentPanel'
import SaveLoadPanel from './SaveLoadPanel'
import BagPanel from './BagPanel'
import RedeemCodeModal from './RedeemCodeModal'
import NpcPanel from './NpcPanel'
import './GameScreen.css'

function GameScreen() {
  const { resetGame } = useGame()
  const [showPlayerInfoPanel, setShowPlayerInfoPanel] = useState(false)
  const [showPetPanel, setShowPetPanel] = useState(false)
  const [showPetDexPanel, setShowPetDexPanel] = useState(false)
  const [showSectPanel, setShowSectPanel] = useState(false)
  const [showMedicineShop, setShowMedicineShop] = useState(false)
  const [showEquipmentPanel, setShowEquipmentPanel] = useState(false)
  const [showSaveLoadPanel, setShowSaveLoadPanel] = useState(false)
  const [showBagPanel, setShowBagPanel] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showNpcPanel, setShowNpcPanel] = useState(false)

  const handleLogout = () => {
    if (window.confirm('确定要注销当前角色吗？这将清除所有游戏数据并返回角色选择界面。')) {
      resetGame()
    }
  }

  return (
    <div className="game-screen">
      {/* 顶部：地图、战斗区域、战斗属性和战斗操作 */}
      <div className="game-top-section">
        <div className="map-battle-container">
          <MapPanel 
            onOpenShop={() => setShowMedicineShop(true)} 
            onOpenNpc={() => setShowNpcPanel(true)}
          />
          <BattleArea />
          <BattleStatsPanel />
        </div>
        <div className="battle-control-container">
          <ActionPanel />
          <BattleLog />
        </div>
      </div>

      {/* 底部固定按钮 */}
      <div className="fixed-bottom-buttons">
        <button className="btn btn-info" onClick={() => setShowPlayerInfoPanel(true)}>
          人物信息
        </button>
        <button className="btn btn-bag" onClick={() => setShowBagPanel(true)}>
          背包
        </button>
        <button className="btn btn-bag" onClick={() => setShowPetDexPanel(true)}>
          宠物图鉴
        </button>
        <button className="btn btn-shop" onClick={() => setShowMedicineShop(true)}>
          药品商店
        </button>
        <button className="btn btn-code" onClick={() => setShowRedeemModal(true)}>
          兑换码
        </button>
        <button className="btn btn-save" onClick={() => setShowSaveLoadPanel(true)}>
          存档管理
        </button>
        <button 
          className="btn btn-danger" 
          onClick={handleLogout}
        >
          注销
        </button>
      </div>

      {showPlayerInfoPanel && (
        <PlayerInfoPanel 
          onClose={() => setShowPlayerInfoPanel(false)}
          onOpenSectPanel={() => {
            setShowPlayerInfoPanel(false)
            setShowSectPanel(true)
          }}
          onOpenEquipmentPanel={() => {
            setShowPlayerInfoPanel(false)
            setShowEquipmentPanel(true)
          }}
          onOpenPetPanel={() => {
            setShowPlayerInfoPanel(false)
            setShowPetPanel(true)
          }}
        />
      )}

      {showPetPanel && (
        <PetPanel onClose={() => setShowPetPanel(false)} />
      )}

      {showPetDexPanel && (
        <PetDexPanel onClose={() => setShowPetDexPanel(false)} />
      )}

      {showSectPanel && (
        <SectPanel onClose={() => setShowSectPanel(false)} />
      )}

      {showMedicineShop && (
        <MedicineShop onClose={() => setShowMedicineShop(false)} />
      )}

      {showEquipmentPanel && (
        <EquipmentPanel onClose={() => setShowEquipmentPanel(false)} />
      )}

      {showSaveLoadPanel && (
        <SaveLoadPanel onClose={() => setShowSaveLoadPanel(false)} />
      )}

      {showBagPanel && (
        <BagPanel onClose={() => setShowBagPanel(false)} />
      )}

      {showRedeemModal && (
        <RedeemCodeModal onClose={() => setShowRedeemModal(false)} />
      )}

      {showNpcPanel && (
        <NpcPanel onClose={() => setShowNpcPanel(false)} />
      )}
    </div>
  )
}

export default GameScreen

