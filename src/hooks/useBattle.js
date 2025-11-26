import { useGame } from '../context/GameContext'
import { generateMonsters, generateDrops } from '../utils/gameUtils'
import { isAdvantageous } from '../utils/sects'
import { updatePlayerBattleStats } from '../utils/attributeCalc'
import { getAllEquipmentStats } from '../utils/equipment'
import { maps } from '../utils/maps'

export function useBattle() {
  const {
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
    addLog,
    currentMap,
    inventory,
    setInventory,
    money,
    setMoney,
    elementPoints,
    equippedItems,
  } = useGame()

  const startBattle = () => {
    if (inBattle) return
    const mapData = maps[currentMap]
    if (!mapData || mapData.type === 'safe') {
      addLog('这里是安全区，无法战斗！')
      return
    }

    const newMonsters = generateMonsters(player, currentMap)
    if (!newMonsters.length) {
      addLog('这里没有怪物可以挑战。')
      return
    }
    setMonsters(newMonsters)
    setInBattle(true)
    setPlayerTurn(true)
    setSelectedMonster(null)

    // 恢复玩家生命和法力，并重新计算属性（包含相性点和装备）
    const equipmentStats = getAllEquipmentStats(equippedItems)
    const updatedPlayer = updatePlayerBattleStats(
      { ...player, hp: player.maxHp, mp: player.maxMp },
      elementPoints,
      equipmentStats
    )
    setPlayer(updatedPlayer)

    addLog('战斗开始！')
    addLog(`出现了 ${newMonsters.length} 只怪物！`)
  }

  const playerAttack = () => {
    if (!inBattle || !playerTurn || !selectedMonster) {
      addLog('请先选择目标怪物！')
      return
    }

    const monster = selectedMonster
    let damage = player.attack

    // 属性相克：普通攻击使用玩家系别
    if (isAdvantageous(player.element, monster.element)) {
      damage = Math.floor(damage * 1.5)
      addLog(`${player.name} 对 ${monster.name} 造成克制伤害！`)
    }

    damage = Math.max(1, damage - Math.floor(monster.defense * 0.5))
    const newHp = Math.max(0, monster.hp - damage)

    const updatedMonsters = monsters.map(m =>
      m.id === monster.id ? { ...m, hp: newHp } : m
    )
    setMonsters(updatedMonsters)

    addLog(`${player.name} 攻击 ${monster.name}，造成 ${damage} 点伤害！`)

    let finalPlayer = player
    if (newHp <= 0) {
      addLog(`${monster.name} 被击败！`)
      const expGain = monster.level * 10
      finalPlayer = {
        ...player,
        exp: player.exp + expGain,
      }
      setPlayer(finalPlayer)
      addLog(`获得 ${expGain} 点经验！`)
      checkLevelUp(finalPlayer)
    }

    checkBattleEnd(updatedMonsters)
    if (inBattle) {
      setPlayerTurn(false)
      setTimeout(() => monstersTurn(updatedMonsters, finalPlayer), 1000)
    }
  }

  const playerDefend = () => {
    if (!inBattle || !playerTurn) return

    addLog(`${player.name} 进入防御状态！`)
    setPlayerTurn(false)
    setTimeout(() => monstersTurn(monsters, player), 1000)
  }

  const playerSkill = (skill) => {
    if (!inBattle || !playerTurn) {
      addLog('不在你的回合！')
      return
    }

    if (!skill) {
      addLog('请先选择技能！')
      return
    }

    if (player.mp < skill.mpCost) {
      addLog(`法力不足！需要 ${skill.mpCost} MP`)
      return
    }

    if (!selectedMonster) {
      addLog('请先选择目标怪物！')
      return
    }

    const monster = selectedMonster
    const updatedPlayer = { ...player, mp: player.mp - skill.mpCost }
    setPlayer(updatedPlayer)

    // 基础伤害 = 攻击力 * 技能倍率 * 法术伤害加成 * 相性点法术伤害加成
    let damage = Math.floor(player.attack * skill.damage * (player.magicDamage || 1.0))
    
    // 相性点对对应系别法术的伤害加成
    const elementKey = {
      '金': 'gold',
      '木': 'wood',
      '水': 'water',
      '火': 'fire',
      '土': 'earth',
    }[skill.element]
    
    if (elementKey && player.spellDamageBonus && player.spellDamageBonus[elementKey]) {
      damage = Math.floor(damage * player.spellDamageBonus[elementKey])
    }

    // 属性相克：技能属性克制怪物属性时，伤害增加50%
    if (isAdvantageous(skill.element, monster.element)) {
      damage = Math.floor(damage * 1.5)
      addLog(`${skill.name} 对 ${monster.name} 造成克制伤害！`)
    }

    damage = Math.max(1, damage - Math.floor(monster.defense * 0.3))
    const newHp = Math.max(0, monster.hp - damage)

    const updatedMonsters = monsters.map(m =>
      m.id === monster.id ? { ...m, hp: newHp } : m
    )
    setMonsters(updatedMonsters)

    addLog(`${player.name} 使用 ${skill.name} 攻击 ${monster.name}，造成 ${damage} 点伤害！`)

    let finalPlayer = updatedPlayer
    if (newHp <= 0) {
      addLog(`${monster.name} 被击败！`)
      const expGain = monster.level * 10
      finalPlayer = {
        ...updatedPlayer,
        exp: updatedPlayer.exp + expGain,
      }
      setPlayer(finalPlayer)
      addLog(`获得 ${expGain} 点经验！`)
      checkLevelUp(finalPlayer)
    }

    checkBattleEnd(updatedMonsters)
    if (inBattle) {
      setPlayerTurn(false)
      setTimeout(() => monstersTurn(updatedMonsters, finalPlayer), 1000)
    }
  }

  const captureMonster = () => {
    if (!inBattle || !playerTurn || !selectedMonster) {
      addLog('请先选择目标怪物！')
      return
    }

    const monster = selectedMonster

    if (monster.hp <= 0) {
      addLog('无法捕捉已死亡的怪物！')
      return
    }

    // 捕捉成功率
    const captureRate = (1 - monster.hp / monster.maxHp) * 0.5 + 0.3
    const success = Math.random() < captureRate

    if (success) {
      // 使用怪物的基础属性
      const pet = {
        id: pets.length,
        element: monster.element,
        name: monster.name.replace('怪物', '宠物').replace(/\d+$/, ''),
        level: monster.level,
        strength: monster.strength || 3,
        constitution: monster.constitution || 3,
        spirit: monster.spirit || 3,
        agility: monster.agility || 4,
        points: 3,
        baseAttrs: {
          strength: monster.strength || 3,
          constitution: monster.constitution || 3,
          spirit: monster.spirit || 3,
          agility: monster.agility || 4,
        },
        // 战斗属性（由基础属性计算）
        attack: monster.attack,
        defense: monster.defense,
        speed: monster.speed,
        hp: monster.hp,
        maxHp: monster.maxHp,
        mp: monster.mp || 0,
        maxMp: monster.maxMp || 0,
      }

      setPets([...pets, pet])
      const updatedMonsters = monsters.map(m =>
        m.id === monster.id ? { ...m, hp: 0, captured: true } : m
      )
      setMonsters(updatedMonsters)

      addLog(`成功捕捉 ${pet.name}！`)
      checkBattleEnd(updatedMonsters)
    } else {
      addLog(`捕捉 ${monster.name} 失败！`)
      setPlayerTurn(false)
      setTimeout(() => monstersTurn(monsters, player), 1000)
    }
  }

  const monstersTurn = (currentMonsters, currentPlayer = player) => {
    if (!inBattle) return

    const aliveMonsters = currentMonsters.filter(m => m.hp > 0)
    if (aliveMonsters.length === 0) {
      endBattle(true)
      return
    }

    let newPlayerHp = currentPlayer.hp
    let newPlayerMp = currentPlayer.mp

    aliveMonsters.forEach(monster => {
      let damage = 0
      let useSkill = false

      // 判断是否使用技能（青蛙有技能且MP足够时，30%概率使用技能）
      if (monster.skills && monster.skills.length > 0 && monster.mp > 0) {
        const skill = monster.skills[0] // 使用第一个技能
        if (monster.mp >= skill.mpCost && Math.random() < 0.3) {
          useSkill = true
          // 使用技能攻击
          damage = Math.floor(monster.attack * skill.damage)
          
          // 技能属性相克
          if (isAdvantageous(skill.element, currentPlayer.element)) {
            damage = Math.floor(damage * 1.5)
            addLog(`${monster.name} 使用 ${skill.name}，造成克制伤害！`)
          } else {
            addLog(`${monster.name} 使用 ${skill.name}！`)
          }
          
          // 消耗MP
          const updatedMonsters = currentMonsters.map(m =>
            m.id === monster.id ? { ...m, mp: m.mp - skill.mpCost } : m
          )
          setMonsters(updatedMonsters)
        }
      }

      // 物理攻击
      if (!useSkill) {
        damage = monster.attack
        
        // 怪物属性克制玩家时，伤害增加
        if (isAdvantageous(monster.element, currentPlayer.element)) {
          damage = Math.floor(damage * 1.5)
        }
      }

      damage = Math.max(1, damage - Math.floor(currentPlayer.defense * 0.5))
      newPlayerHp = Math.max(0, newPlayerHp - damage)

      if (useSkill) {
        addLog(`${monster.name} 的 ${monster.skills[0].name} 对 ${currentPlayer.name} 造成 ${damage} 点伤害！`)
      } else {
        addLog(`${monster.name} 攻击 ${currentPlayer.name}，造成 ${damage} 点伤害！`)
      }
    })

    const updatedPlayer = { ...currentPlayer, hp: newPlayerHp, mp: newPlayerMp }
    setPlayer(updatedPlayer)

    if (newPlayerHp <= 0) {
      addLog(`${currentPlayer.name} 被击败！战斗失败！`)
      endBattle(false)
    } else {
      setPlayerTurn(true)
      addLog('轮到你了！')
    }
  }

  const checkBattleEnd = (currentMonsters) => {
    const aliveMonsters = currentMonsters.filter(m => m.hp > 0)

    if (aliveMonsters.length === 0) {
      endBattle(true)
    }
  }

  const endBattle = (victory) => {
    setInBattle(false)
    setPlayerTurn(false)
    setSelectedMonster(null)

    if (victory) {
      addLog('战斗胜利！')
    }
  }

  const checkLevelUp = (currentPlayer) => {
    let updatedPlayer = { ...currentPlayer }

    while (updatedPlayer.exp >= updatedPlayer.expMax) {
      updatedPlayer.exp -= updatedPlayer.expMax
      updatedPlayer.level++
      updatedPlayer.expMax = Math.floor(updatedPlayer.expMax * 1.5)
      updatedPlayer.points += 5

      // 升级提升基础属性
      updatedPlayer.maxHp += 20
      updatedPlayer.hp = updatedPlayer.maxHp
      updatedPlayer.maxMp += 10
      updatedPlayer.mp = updatedPlayer.maxMp
      updatedPlayer.attack += 2
      updatedPlayer.defense += 1
      updatedPlayer.speed += 1

      addLog(`${updatedPlayer.name} 升级到 ${updatedPlayer.level} 级！`)
      addLog('获得 5 点属性点！')
    }

    setPlayer(updatedPlayer)
  }

  const useMedicine = (medicine) => {
    if (!inBattle || !playerTurn) {
      addLog('不在你的回合！')
      return
    }

    const count = inventory[medicine.id] || 0
    if (count <= 0) {
      addLog('没有该药品！')
      return
    }

    const updatedPlayer = { ...player }
    let used = false

    if (medicine.type === 'hp') {
      if (medicine.value >= 9999) {
        updatedPlayer.hp = updatedPlayer.maxHp
        used = true
        addLog(`${player.name} 使用 ${medicine.name}，完全恢复生命值！`)
      } else if (updatedPlayer.hp < updatedPlayer.maxHp) {
        updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + medicine.value)
        used = true
        addLog(`${player.name} 使用 ${medicine.name}，恢复 ${medicine.value} 点生命值！`)
      } else {
        addLog('生命值已满，无需使用！')
        return
      }
    } else if (medicine.type === 'mp') {
      if (medicine.value >= 9999) {
        updatedPlayer.mp = updatedPlayer.maxMp
        used = true
        addLog(`${player.name} 使用 ${medicine.name}，完全恢复法力值！`)
      } else if (updatedPlayer.mp < updatedPlayer.maxMp) {
        updatedPlayer.mp = Math.min(updatedPlayer.maxMp, updatedPlayer.mp + medicine.value)
        used = true
        addLog(`${player.name} 使用 ${medicine.name}，恢复 ${medicine.value} 点法力值！`)
      } else {
        addLog('法力值已满，无需使用！')
        return
      }
    }

    if (used) {
      setPlayer(updatedPlayer)
      const newInventory = { ...inventory }
      newInventory[medicine.id] = count - 1
      if (newInventory[medicine.id] <= 0) {
        delete newInventory[medicine.id]
      }
      setInventory(newInventory)
      
      // 使用药品后结束回合
      setPlayerTurn(false)
      setTimeout(() => monstersTurn(monsters, updatedPlayer), 1000)
    }
  }

  return {
    startBattle,
    playerAttack,
    playerDefend,
    playerSkill,
    captureMonster,
    useMedicine,
  }
}

