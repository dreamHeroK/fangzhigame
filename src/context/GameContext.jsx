import { createContext, useContext, useState } from 'react'

const GameContext = createContext()

export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null)
  const [monsters, setMonsters] = useState([])
  const [pets, setPets] = useState([])
  const [inBattle, setInBattle] = useState(false)
  const [playerTurn, setPlayerTurn] = useState(true)
  const [selectedMonster, setSelectedMonster] = useState(null)
  const [battleLog, setBattleLog] = useState([])
  const [currentMap, setCurrentMap] = useState('揽仙镇') // 当前地图
  const [money, setMoney] = useState(1000) // 金钱
  const [inventory, setInventory] = useState({}) // 物品库存 {itemId: count}
  const [elementPoints, setElementPoints] = useState({ gold: 0, wood: 0, water: 0, fire: 0, earth: 0 }) // 相性点
  const [equipmentInventory, setEquipmentInventory] = useState([]) // 装备背包
  const [equippedItems, setEquippedItems] = useState({}) // 已装备 {slot: equipment}

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setBattleLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  return (
    <GameContext.Provider
      value={{
        player,
        setPlayer,
        monsters,
        setMonsters,
        pets,
        setPets,
        inBattle,
        setInBattle,
        playerTurn,
        setPlayerTurn,
        selectedMonster,
        setSelectedMonster,
        battleLog,
        addLog,
        currentMap,
        setCurrentMap,
        money,
        setMoney,
        inventory,
        setInventory,
        elementPoints,
        setElementPoints,
        equipmentInventory,
        setEquipmentInventory,
        equippedItems,
        setEquippedItems,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

