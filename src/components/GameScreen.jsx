import { useState } from 'react'
import { useGame } from '../context/GameContext'
import MapPanel from './MapPanel'
import BattleArea from './BattleArea'
import BattleStatsPanel from './BattleStatsPanel'
import ActionPanel from './ActionPanel'
import BattleLog from './BattleLog'
import PlayerInfoPanel from './PlayerInfoPanel'
import PetPanel from './PetPanel'
import SectPanel from './SectPanel'
import MedicineShop from './MedicineShop'
import EquipmentPanel from './EquipmentPanel'
import SaveLoadPanel from './SaveLoadPanel'
import PlayerAttributePanel from './PlayerAttributePanel'
import './GameScreen.css'

function GameScreen() {
  const { resetGame } = useGame()
  const [showPlayerInfoPanel, setShowPlayerInfoPanel] = useState(false)
  const [showPetPanel, setShowPetPanel] = useState(false)
  const [showSectPanel, setShowSectPanel] = useState(false)
  const [showMedicineShop, setShowMedicineShop] = useState(false)
  const [showEquipmentPanel, setShowEquipmentPanel] = useState(false)
  const [showSaveLoadPanel, setShowSaveLoadPanel] = useState(false)
  const [showPlayerAttributePanel, setShowPlayerAttributePanel] = useState(false)

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
          <MapPanel onOpenShop={() => setShowMedicineShop(true)} />
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
        <button className="btn btn-shop" onClick={() => setShowMedicineShop(true)}>
          药品商店
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
          onOpenPlayerAttributePanel={() => {
            setShowPlayerInfoPanel(false)
            setShowPlayerAttributePanel(true)
          }}
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

      {showPlayerAttributePanel && (
        <PlayerAttributePanel onClose={() => setShowPlayerAttributePanel(false)} />
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

      {showEquipmentPanel && (
        <EquipmentPanel onClose={() => setShowEquipmentPanel(false)} />
      )}

      {showSaveLoadPanel && (
        <SaveLoadPanel onClose={() => setShowSaveLoadPanel(false)} />
      )}
    </div>
  )
}

export default GameScreen

