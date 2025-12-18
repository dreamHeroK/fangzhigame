import { useCallback, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { generateMonsters, generateDrops } from '../utils/gameUtils'
import { calculateElementBonus } from '../utils/elements'
import { getAllEquipmentStats } from '../utils/equipment'
import { updatePlayerBattleStats } from '../utils/attributeCalc'
import { getMedicineById } from '../utils/items'

// 统一控制战斗节奏的时间常量（毫秒）
// 相比之前整体更快，但仍保留一定动画感
const TURN_DELAY = 220            // 普通行动间隔
const FAST_TURN_DELAY = 120       // 逻辑快速轮转（空行动等）
const ACTION_ANIMATION_DELAY = 180 // 攻击/施法前的小等待
const CHAIN_BATTLE_DELAY = 280    // 连续战斗之间的等待

/**
 * 回合制战斗Hook
 * 实现完整的回合制战斗逻辑，包括：
 * - 按速度属性分配行动顺序
 * - 人物、宠物、怪物的行动
 * - 怪物AI（有几率使用技能或普通攻击）
 * - 战斗结算（掉落和经验奖励）
 */
export function useBattle() {
  const {
    player,
    setPlayer,
    monsters,
    setMonsters,
    pets,
    setPets,
    activePet,
    setActivePet,
    inBattle,
    setInBattle,
    playerTurn,
    setPlayerTurn,
    selectedMonster,
    setSelectedMonster,
    battleLog,
    addLog,
    currentMap,
    money,
    setMoney,
    inventory,
    setInventory,
    elementPoints,
    equippedItems,
    autoSettings,
    setAutoSettings,
    playerRef,
  } = useGame()

  // 战斗状态
  const battleStateRef = useRef({
    turnOrder: [], // 行动顺序
    currentTurnIndex: 0,
    round: 1,
    isProcessing: false,
    pendingAction: null,
    defending: { player: false, pet: false },
    stopped: true,
    timeoutId: null,
    chainMode: false,
  })
  
  // 使用 ref 存储函数引用，避免循环依赖
  const processNextTurnRef = useRef(null)
  const startBattleRef = useRef(null)
  const stopBattleRef = useRef(null)

  // 计算经验值奖励
  const calculateExpReward = useCallback((monsterLevel, playerLevel) => {
    const levelDiff = monsterLevel - playerLevel
    let baseExp = 50 + monsterLevel * 10
    
    // 等级差修正
    if (levelDiff > 0) {
      baseExp = Math.floor(baseExp * (1 + levelDiff * 0.1))
    } else if (levelDiff < 0) {
      baseExp = Math.floor(baseExp * Math.max(0.5, 1 + levelDiff * 0.05))
    }
    
    return Math.max(10, baseExp)
  }, [])

  // 计算经验值上限
  const calculateExpMax = useCallback((level) => {
    return Math.floor(100 * Math.pow(1.2, level - 1))
  }, [])

  // 处理升级
  const handleLevelUp = useCallback((entity, isPlayer = false) => {
    if (isPlayer) {
      const newLevel = entity.level + 1
      const newExpMax = calculateExpMax(newLevel)
      const newPlayer = {
        ...entity,
        level: newLevel,
        exp: entity.exp - entity.expMax,
        expMax: newExpMax,
        points: (entity.points || 0) + 5, // 每级5点属性点
      }
      
      // 更新战斗属性
      const equipmentStats = getAllEquipmentStats(equippedItems)
      console.log('handleLevelUp: before updatePlayerBattleStats, newPlayer.exp=', newPlayer.exp)
      const updatedPlayer = updatePlayerBattleStats(newPlayer, elementPoints, equipmentStats)
      console.log('handleLevelUp: after updatePlayerBattleStats, updatedPlayer.exp=', updatedPlayer.exp)
      addLog(`🎉 ${updatedPlayer.name} 升级了！达到 ${newLevel} 级！`)
      return updatedPlayer
    } else {
      // 宠物升级
      const newLevel = entity.level + 1
      const newExpMax = calculateExpMax(newLevel)
      const newPet = {
        ...entity,
        level: newLevel,
        exp: entity.exp - entity.expMax,
        expMax: newExpMax,
        // 每级获得 3 点可分配属性点，用于在宠物面板中加点
        points: (entity.points || 0) + 3,
      }
      
      addLog(`🎉 ${newPet.name} 升级了！达到 ${newLevel} 级！`)
      return newPet
    }
  }, [calculateExpMax, equippedItems, elementPoints, addLog])

  // 检查宠物是否可以升级（使用存储的经验）
  const checkPetLevelUp = useCallback((pet, playerLevel) => {
    if (!pet || !pet.storedExp || pet.storedExp <= 0) return
    
    const maxPetLevel = playerLevel + 5
    if (pet.level >= maxPetLevel) return
    
    let currentEntity = { ...pet }
    if (!currentEntity.expMax) {
      currentEntity.expMax = calculateExpMax(currentEntity.level || 1)
    }
    let newExp = (currentEntity.exp || 0) + pet.storedExp
    let remainingStoredExp = 0
    
    // 尝试使用存储的经验升级
    while (newExp >= currentEntity.expMax && currentEntity.level < 100) {
      // 检查是否超过等级限制
      if (currentEntity.level >= maxPetLevel) {
        remainingStoredExp = newExp
        break
      }
      
      currentEntity = handleLevelUp(currentEntity, false)
      newExp = currentEntity.exp || 0
      
      if (currentEntity.level >= maxPetLevel) {
        remainingStoredExp = newExp
        break
      }
    }
    
    // 更新宠物
    const updatedPet = { 
      ...currentEntity, 
      exp: newExp < currentEntity.expMax ? newExp : 0,
      storedExp: remainingStoredExp
    }
    setPets(prev => prev.map(p => p.id === pet.id ? updatedPet : p))
  }, [handleLevelUp, setPets])

  // 添加经验值
  const addExperience = useCallback((entity, exp, isPlayer = false) => {
    if (isPlayer) {
      // 始终基于 playerRef.current 作为经验的单一数据源，避免使用过期的 prev 快照
      setPlayer(() => {
        const base = playerRef?.current
        if (!base) return base

        let currentEntity = { ...base }
        if (!currentEntity.expMax) {
          currentEntity.expMax = calculateExpMax(currentEntity.level || 1)
        }
        let newExp = (currentEntity.exp || 0) + exp
        console.log('addExperience: prevExp=', currentEntity.exp, 'adding=', exp, 'newExp will be=', newExp)
        
        while (newExp >= currentEntity.expMax && currentEntity.level < 100) {
          currentEntity.exp = newExp
          currentEntity = handleLevelUp(currentEntity, true)
          newExp = currentEntity.exp
          
          if (activePet) {
            const pet = pets.find(p => p.id === activePet.id) || activePet
            if (pet && pet.storedExp && pet.storedExp > 0) {
              checkPetLevelUp(pet, currentEntity.level)
            }
          }
        }
        console.log('addExperience: final newExp=', newExp, 'returning player with exp=', newExp)
        return { ...currentEntity, exp: newExp }
      })
    } else {
      const maxPetLevel = player ? player.level + 5 : 100
      let updatedActivePet = null
      
      setPets(prevPets => {
        if (!entity) return prevPets
        const petIndex = prevPets.findIndex(p => p.id === entity.id)
        const basePet = petIndex !== -1 ? prevPets[petIndex] : entity
        if (!basePet) return prevPets
        
        let currentEntity = { ...basePet }
        if (!currentEntity.expMax) {
          currentEntity.expMax = calculateExpMax(currentEntity.level || 1)
        }
        let currentStoredExp = currentEntity.storedExp || 0
        let newExp = (currentEntity.exp || 0) + exp
        
        if (currentEntity.level >= maxPetLevel) {
          if (petIndex === -1) return prevPets
          const updatedPet = { ...currentEntity, storedExp: currentStoredExp + exp }
          updatedActivePet = updatedPet
          const nextPets = [...prevPets]
          nextPets[petIndex] = updatedPet
          return nextPets
        }
        
        while (newExp >= currentEntity.expMax && currentEntity.level < 100) {
          if (currentEntity.level >= maxPetLevel) {
            currentStoredExp += newExp
            newExp = 0
            break
          }
          
          currentEntity.exp = newExp
          currentEntity = handleLevelUp(currentEntity, false)
          newExp = currentEntity.exp || 0
          
          if (currentEntity.level >= maxPetLevel) {
            currentStoredExp += newExp
            newExp = 0
            break
          }
        }
        
        if (currentEntity.level < maxPetLevel && currentStoredExp > 0) {
          let expToUse = newExp + currentStoredExp
          while (expToUse >= currentEntity.expMax && currentEntity.level < 100) {
            if (currentEntity.level >= maxPetLevel) {
              currentStoredExp = expToUse
              expToUse = 0
              break
            }
            
            currentEntity.exp = expToUse
            currentEntity = handleLevelUp(currentEntity, false)
            expToUse = currentEntity.exp || 0
            
            if (currentEntity.level >= maxPetLevel) {
              currentStoredExp = expToUse
              expToUse = 0
              break
            }
          }
          
          if (expToUse > 0) {
            newExp = expToUse
            currentStoredExp = 0
          }
        }
        
        if (petIndex === -1) {
          return prevPets
        }
        
        const updatedPet = {
          ...currentEntity,
          exp: newExp < currentEntity.expMax ? newExp : 0,
          storedExp: currentStoredExp
        }
        updatedActivePet = updatedPet
        
        const nextPets = [...prevPets]
        nextPets[petIndex] = updatedPet
        return nextPets
      })
      
      if (updatedActivePet && activePet?.id === updatedActivePet.id) {
        setActivePet(updatedActivePet)
      }
    }
  }, [handleLevelUp, setPlayer, setPets, player, activePet, pets, checkPetLevelUp, setActivePet])

  // 计算伤害
  const calculateDamage = useCallback((attacker, defender, isSkill = false, skill = null) => {
    let baseDamage = 0
    let isPhysical = true
    
    if (isSkill && skill) {
      // 技能伤害（法术）
      const baseAttack = attacker.attack || 0
      const magicMultiplier = attacker.magicDamage || 1
      const skillMultiplier = skill.damage || 1
      baseDamage = Math.floor(baseAttack * skillMultiplier * magicMultiplier)
      isPhysical = false
      
      // 元素相性加成
      if (attacker.element && skill.element && attacker.spellDamageBonus) {
        const elementKey = {
          '金': 'gold',
          '木': 'wood',
          '水': 'water',
          '火': 'fire',
          '土': 'earth'
        }[skill.element]
        if (elementKey && attacker.spellDamageBonus[elementKey]) {
          baseDamage = Math.floor(baseDamage * attacker.spellDamageBonus[elementKey])
        }
      }
    } else {
      // 物理攻击
      baseDamage = attacker.attack || 0
    }
    
    // 防御减免
    const defense = defender.defense || 0
    let finalDamage = Math.max(1, baseDamage - Math.floor(defense * (isPhysical ? 0.5 : 0.3)))
    
    // 随机波动（90%-110%）
    const variance = 0.9 + Math.random() * 0.2
    finalDamage = Math.floor(finalDamage * variance)
    
    // 法术抗性（仅对法术伤害）
    if (!isPhysical && defender.spellResistance) {
      const elementKey = {
        '金': 'gold',
        '木': 'wood',
        '水': 'water',
        '火': 'fire',
        '土': 'earth'
      }[skill?.element]
      if (elementKey && defender.spellResistance[elementKey]) {
        const resistance = defender.spellResistance[elementKey]
        finalDamage = Math.floor(finalDamage * (1 - resistance))
      }
    }
    
    return Math.max(1, finalDamage)
  }, [])

  // 检查命中
  const checkHit = useCallback((attacker, defender) => {
    const hitRate = attacker.hitRate || 80
    return Math.random() * 100 < hitRate
  }, [])

  // 执行攻击
  const executeAttack = useCallback((attacker, defender, isSkill = false, skill = null) => {
    if (!checkHit(attacker, defender)) {
      return { hit: false, damage: 0 }
    }
    
    const damage = calculateDamage(attacker, defender, isSkill, skill)
    const newHp = Math.max(0, defender.hp - damage)
    
    return { hit: true, damage, newHp }
  }, [checkHit, calculateDamage])

  // 初始化行动顺序
  const initializeTurnOrder = useCallback(() => {
    const turnOrder = []
    
    // 添加玩家（使用最新的player状态）
    const currentPlayer = player
    if (currentPlayer && currentPlayer.hp > 0) {
      turnOrder.push({
        type: 'player',
        entity: currentPlayer,
        speed: currentPlayer.speed || 0,
        index: -1
      })
    }
    
    // 添加宠物（使用最新的pets状态）
    if (activePet) {
      const currentPets = pets
      const pet = currentPets.find(p => p.id === activePet.id) || activePet
      if (pet && pet.hp > 0) {
        turnOrder.push({
          type: 'pet',
          entity: pet,
          speed: pet.speed || 0,
          index: -1
        })
      }
    }
    
    // 添加怪物（使用最新的monsters状态）
    const currentMonsters = monsters
    currentMonsters.forEach((monster, index) => {
      if (monster && monster.hp > 0) {
        turnOrder.push({
          type: 'monster',
          entity: monster,
          speed: monster.speed || 0,
          index: index
        })
      }
    })
    
    // 按速度排序（速度相同则随机）
    turnOrder.sort((a, b) => {
      if (b.speed !== a.speed) {
        return b.speed - a.speed
      }
      return Math.random() - 0.5
    })
    
    return turnOrder
  }, [player, activePet, pets, monsters])

  // 检查战斗是否结束（可以传入自定义怪物列表）
  const checkBattleEnd = useCallback((customMonsters = null) => {
    const monstersToCheck = customMonsters || monsters
    const aliveMonsters = monstersToCheck.filter(m => m && m.hp > 0)
    const playerAlive = player && player.hp > 0
    const petAlive = activePet && (pets.find(p => p.id === activePet.id) || activePet).hp > 0
    
    // 所有怪物死亡 - 胜利
    if (aliveMonsters.length === 0) {
      return 'victory'
    }
    
    // 玩家和宠物都死亡 - 失败
    if (!playerAlive && !petAlive) {
      return 'defeat'
    }
    
    return null
  }, [monsters, player, activePet, pets])

  // 战斗结算
  const settleBattle = useCallback((result, customMonsters = null) => {
    // 防止重复调用
    if (battleStateRef.current.stopped) {
      return
    }
    // 立即停止战斗处理
    battleStateRef.current.stopped = true
    battleStateRef.current.isProcessing = false
    
    // 清除所有定时器
    if (battleStateRef.current.timeoutId) {
      clearTimeout(battleStateRef.current.timeoutId)
      battleStateRef.current.timeoutId = null
    }
    
    if (result === 'victory') {
      // 使用传入的怪物列表或当前状态中的怪物列表
      const monstersToSettle = customMonsters || monsters
      
      // 计算经验和掉落
      let totalExp = 0
      const allDrops = []
      
      // 计算经验和掉落（使用最新的 player 状态）
      monstersToSettle.forEach(monster => {
        if (monster && monster.hp <= 0) {
          // 注意：这里使用闭包中的 player.level，但会在 setPlayer 中使用最新状态
          const expReward = calculateExpReward(monster.level, player?.level || 1)
          totalExp += expReward
          
          const drops = generateDrops(monster)
          drops.forEach(drop => {
            const existing = allDrops.find(d => d.id === drop.id)
            if (existing) {
              existing.count += drop.count
            } else {
              allDrops.push({ ...drop })
            }
          })
        }
      })
      
      // 分配经验：统一走 addExperience，避免和单独逻辑不一致
      if (totalExp > 0) {
        addExperience(player, totalExp, true)
        addLog(`获得 ${totalExp} 点经验值`)
        if (activePet) {
          const petExp = Math.floor(totalExp * 0.8) // 宠物获得80%经验
          addExperience(activePet, petExp, false)
          addLog(`${activePet.name} 获得 ${petExp} 点经验值`)
        }
      }
      
      // 分配掉落
      if (allDrops.length > 0) {
        allDrops.forEach(drop => {
          setInventory(prev => ({
            ...prev,
            [drop.id]: (prev[drop.id] || 0) + drop.count
          }))
          addLog(`获得 ${drop.name} x${drop.count}`)
        })
      }
      
      // 金钱奖励（只计算死亡的怪物）
      const deadMonstersCount = monstersToSettle.filter(m => m && m.hp <= 0).length
      const moneyReward = deadMonstersCount * 50
      if (moneyReward > 0) {
        setMoney(prev => prev + moneyReward)
        addLog(`获得 ${moneyReward} 文金钱`)
      }
      
      addLog('战斗胜利！')
      
      const shouldChain = battleStateRef.current.chainMode && autoSettings.autoChainBattle
      battleStateRef.current.chainMode = shouldChain

      if (shouldChain) {
        setTimeout(() => {
          if (startBattleRef.current) {
            startBattleRef.current(true)
          }
        }, CHAIN_BATTLE_DELAY)
      } else if (stopBattleRef.current) {
        battleStateRef.current.chainMode = false
        // 立即重置按钮状态
        stopBattleRef.current()
      }
    } else if (result === 'defeat') {
      addLog('战斗失败！')
      battleStateRef.current.chainMode = false
      if (stopBattleRef.current) {
        stopBattleRef.current()
      }
    }
  }, [monsters, player, activePet, calculateExpReward, addExperience, addLog, setInventory, setMoney, autoSettings.autoChainBattle, setPlayer, handleLevelUp, pets, checkPetLevelUp])

  // 辅助函数：安全地调度下一个行动
  const scheduleNextTurn = useCallback((delay = FAST_TURN_DELAY) => {
    const state = battleStateRef.current
    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
    }
    state.timeoutId = setTimeout(() => {
      state.timeoutId = null
      if (inBattle && !state.stopped && processNextTurnRef.current) {
        processNextTurnRef.current()
      }
    }, delay)
  }, [inBattle])

  // 处理下一个行动
  const processNextTurn = useCallback(() => {
    // 检查战斗是否已停止（优先检查stopped标志）
    if (battleStateRef.current.stopped || !inBattle) {
      return
    }
    
    if (battleStateRef.current.isProcessing) return
    
    const state = battleStateRef.current
    // 使用最新状态更新turnOrder中的实体引用
    const updatedTurnOrder = state.turnOrder.map(item => {
      if (item.type === 'player') {
        return { ...item, entity: player }
      } else if (item.type === 'pet') {
        const pet = pets.find(p => p.id === activePet?.id) || activePet
        return { ...item, entity: pet }
      } else if (item.type === 'monster') {
        return { ...item, entity: monsters[item.index] }
      }
      return item
    }).filter(item => {
      if (item.type === 'player') {
        return item.entity && item.entity.hp > 0
      } else if (item.type === 'pet') {
        return item.entity && item.entity.hp > 0
      } else if (item.type === 'monster') {
        return item.entity && item.entity.hp > 0
      }
      return false
    })
    
    // 更新state中的turnOrder
    state.turnOrder = updatedTurnOrder
    const turnOrder = updatedTurnOrder
    
    // 如果行动顺序为空或所有单位都已行动，开始新回合
    if (state.currentTurnIndex >= turnOrder.length || turnOrder.length === 0) {
      // 先检查战斗是否结束
      const battleResult = checkBattleEnd(monsters)
      if (battleResult) {
        settleBattle(battleResult, monsters)
        return
      }
      
      state.currentTurnIndex = 0
      state.round++
      state.defending = { player: false, pet: false }
      
      // 重新初始化行动顺序
      state.turnOrder = initializeTurnOrder()
      
      // 再次检查战斗是否结束（可能在初始化过程中状态变化）
      const battleResult2 = checkBattleEnd(monsters)
      if (battleResult2) {
        settleBattle(battleResult2, monsters)
        return
      }
      
      if (state.turnOrder.length === 0) {
        // 如果战斗没有结束但turnOrder为空，说明有问题，停止处理
        addLog('错误：无法初始化行动顺序')
        state.isProcessing = false
        return
      }
      
      addLog(`--- 第 ${state.round} 回合 ---`)
    }
    
    // 再次检查战斗是否结束（防止在更新过程中状态变化）
    const battleResult = checkBattleEnd(monsters)
    if (battleResult) {
      settleBattle(battleResult, monsters)
      return
    }
    
    if (state.turnOrder.length === 0) {
      // 如果战斗没有结束但turnOrder为空，停止处理
      addLog('错误：行动顺序为空')
      state.isProcessing = false
      return
    }
    
    const currentActor = state.turnOrder[state.currentTurnIndex]
    if (!currentActor) {
      // 如果当前行动者不存在，增加索引并继续
      state.currentTurnIndex++
      if (state.currentTurnIndex >= state.turnOrder.length) {
        // 如果索引超出范围，开始新回合
        state.isProcessing = false
        scheduleNextTurn(FAST_TURN_DELAY)
        return
      }
      scheduleNextTurn(FAST_TURN_DELAY)
      return
    }
    
    // 再次检查战斗是否结束（防止在获取行动者时状态变化）
    const battleResultBeforeAction = checkBattleEnd(monsters)
    if (battleResultBeforeAction) {
      settleBattle(battleResultBeforeAction, monsters)
      return
    }
    
    state.isProcessing = true
    
    // 根据行动者类型执行行动
    if (currentActor.type === 'monster') {
      // 怪物AI行动
      executeMonsterAction(currentActor.entity, currentActor.index)
    } else if (currentActor.type === 'player') {
      // 玩家行动（如果是自动战斗，自动执行）
      if (autoSettings.autoBattle || autoSettings.autoChainBattle) {
        executeAutoPlayerAction()
      } else {
        // 等待玩家手动操作，停止自动处理
        state.isProcessing = false
        setPlayerTurn(true)
        return // 停止处理，等待玩家操作
      }
    } else if (currentActor.type === 'pet') {
      // 宠物行动（如果是自动战斗，自动执行）
      if (autoSettings.autoBattle || autoSettings.autoChainBattle) {
        executeAutoPetAction()
      } else {
        // 等待玩家手动操作，停止自动处理
        state.isProcessing = false
        setPlayerTurn(true)
        return // 停止处理，等待玩家操作
      }
    } else {
      // 未知类型，跳过
      state.isProcessing = false
      state.currentTurnIndex++
      scheduleNextTurn(FAST_TURN_DELAY)
      state.currentTurnIndex++
      scheduleNextTurn(FAST_TURN_DELAY)
    }
  }, [inBattle, player, activePet, pets, monsters, autoSettings, initializeTurnOrder, checkBattleEnd, settleBattle, addLog, setPlayerTurn, scheduleNextTurn])
  
  // 将 processNextTurn 赋值给 ref，供 scheduleNextTurn 使用
  processNextTurnRef.current = processNextTurn

  // 开始战斗
  const startBattle = useCallback((isChainBattle = false) => {
    // 防止重复调用
    if (inBattle && !isChainBattle) {
      return
    }
    
    if (!player) {
      addLog('错误：玩家不存在')
      return
    }
    
    const newMonsters = generateMonsters(player, currentMap)
    if (newMonsters.length === 0) {
      addLog('当前地图无法生成怪物')
      return
    }
    
    // 重置战斗状态
    battleStateRef.current.stopped = false
    battleStateRef.current.isProcessing = false
    battleStateRef.current.currentTurnIndex = 0
    battleStateRef.current.round = 1
    battleStateRef.current.defending = { player: false, pet: false }
    battleStateRef.current.chainMode = !!isChainBattle
    
    setMonsters(newMonsters)
    setSelectedMonster(newMonsters[0])
    setInBattle(true)
    setPlayerTurn(false) // 回合制不需要这个，但保留兼容性
    
    if (!isChainBattle && autoSettings.autoChainBattle) {
      setAutoSettings(prev => ({ ...prev, autoChainBattle: false }))
    }
    
    addLog(`战斗开始！遇到 ${newMonsters.length} 只怪物`)
    
    // 如果是自动战斗，开始自动战斗循环
    // if (autoSettings.autoBattle || isChainBattle) {
    //   if (isChainBattle) {
    //     setAutoSettings(prev => ({ ...prev, autoChainBattle: true }))
    //   }
    //   // 自动战斗逻辑将在回合循环中处理
    // }
    
    // 初始化战斗状态（直接使用 newMonsters，不依赖状态）
    const turnOrder = []
    
    // 添加玩家
    if (player && player.hp > 0) {
      turnOrder.push({
        type: 'player',
        entity: player,
        speed: player.speed || 0,
        index: -1
      })
    }
    
    // 添加宠物
    if (activePet) {
      const pet = pets.find(p => p.id === activePet.id) || activePet
      if (pet && pet.hp > 0) {
        turnOrder.push({
          type: 'pet',
          entity: pet,
          speed: pet.speed || 0,
          index: -1
        })
      }
    }
    
    // 添加怪物（使用 newMonsters）
    newMonsters.forEach((monster, index) => {
      if (monster && monster.hp > 0) {
        turnOrder.push({
          type: 'monster',
          entity: monster,
          speed: monster.speed || 0,
          index: index
        })
      }
    })
    
    // 按速度排序（速度相同则随机）
    turnOrder.sort((a, b) => {
      if (b.speed !== a.speed) {
        return b.speed - a.speed
      }
      return Math.random() - 0.5
    })
    
    battleStateRef.current = {
      turnOrder,
      currentTurnIndex: 0,
      round: 1,
      isProcessing: false,
      pendingAction: null,
      defending: { player: false, pet: false },
      stopped: false,
      timeoutId: null,
      chainMode: !!isChainBattle,
    }
    
    // 使用 setTimeout 确保状态更新后再执行
    setTimeout(() => {
      if (processNextTurnRef.current) {
        processNextTurnRef.current()
      }
    }, 0)
  }, [player, currentMap, setMonsters, setInBattle, setPlayerTurn, setSelectedMonster, addLog, autoSettings, setAutoSettings])
  
  // 将 startBattle 赋值给 ref
  startBattleRef.current = startBattle

  // 停止战斗
  const stopBattle = useCallback(() => {
    // 清除所有定时器
    if (battleStateRef.current.timeoutId) {
      clearTimeout(battleStateRef.current.timeoutId)
      battleStateRef.current.timeoutId = null
    }
    
    setInBattle(false)
    setMonsters([])
    setPlayerTurn(true)
    setSelectedMonster(null)
    battleStateRef.current = {
      turnOrder: [],
      currentTurnIndex: 0,
      round: 1,
      isProcessing: false,
      pendingAction: null,
      defending: { player: false, pet: false },
      stopped: true,
      timeoutId: null,
      chainMode: false,
    }
    setAutoSettings(prev => ({ ...prev, autoChainBattle: false }))
    addLog('战斗已停止')
  }, [setInBattle, setMonsters, setPlayerTurn, setSelectedMonster, addLog, setAutoSettings])
  
  // 将 stopBattle 赋值给 ref
  stopBattleRef.current = stopBattle

  // 执行怪物行动
  const executeMonsterAction = useCallback((monster, monsterIndex) => {
    const aliveTargets = []
    
    // 收集可攻击目标（玩家和宠物）
    if (player && player.hp > 0) {
      aliveTargets.push({ type: 'player', entity: player })
    }
    
    if (activePet) {
      const pet = pets.find(p => p.id === activePet.id) || activePet
      if (pet && pet.hp > 0) {
        aliveTargets.push({ type: 'pet', entity: pet })
      }
    }
    
    if (aliveTargets.length === 0) {
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(FAST_TURN_DELAY)
      return
    }
    
    // 随机选择目标
    const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)]
    
    // 决定使用技能还是普通攻击
    let useSkill = false
    let selectedSkill = null
    
    if (monster.skills && monster.skills.length > 0 && monster.mp > 0) {
      // 30%几率使用技能
      if (Math.random() < 0.3) {
        const availableSkills = monster.skills.filter(skill => 
          monster.mp >= (skill.mpCost || 0)
        )
        if (availableSkills.length > 0) {
          useSkill = true
          selectedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
        }
      }
    }
    
    // 执行攻击（稍微延迟以便玩家感知动作）
    setTimeout(() => {
      // 检查战斗是否已停止
      if (battleStateRef.current.stopped) {
        return
      }
      
      if (useSkill && selectedSkill) {
        // 使用技能
        const result = executeAttack(monster, target.entity, true, selectedSkill)
        monster.mp = Math.max(0, monster.mp - (selectedSkill.mpCost || 0))
        
        if (result.hit) {
          if (target.type === 'player') {
            setPlayer(prev => {
              // 再次检查战斗是否已停止
              if (battleStateRef.current.stopped) return prev
              const newHp = Math.max(0, (prev?.hp || 0) - result.damage)
              return { ...prev, hp: newHp }
            })
            console.log(2)
            addLog(`${monster.name} 对 ${player.name} 使用了 ${selectedSkill.name}，造成 ${result.damage} 点伤害`)
          } else {
            const pet = pets.find(p => p.id === activePet.id) || activePet
            const newHp = Math.max(0, pet.hp - result.damage)
            setPets(prev => prev.map(p => p.id === pet.id ? { ...p, hp: newHp } : p))
            addLog(`${monster.name} 对 ${pet.name} 使用了 ${selectedSkill.name}，造成 ${result.damage} 点伤害`)
          }
        } else {
          addLog(`${monster.name} 对 ${target.entity.name} 使用了 ${selectedSkill.name}，但未命中`)
        }
      } else {
        // 普通攻击
        const result = executeAttack(monster, target.entity, false)
        
        if (result.hit) {
          if (target.type === 'player') {
            setPlayer(prev => {
              // 再次检查战斗是否已停止
              if (battleStateRef.current.stopped) return prev
              const newHp = Math.max(0, (prev?.hp || 0) - result.damage)
              return { ...prev, hp: newHp }
            })
            console.log(3)
            addLog(`${monster.name} 攻击了 ${player.name}，造成 ${result.damage} 点伤害`)
          } else {
            const pet = pets.find(p => p.id === activePet.id) || activePet
            const newHp = Math.max(0, pet.hp - result.damage)
            setPets(prev => prev.map(p => p.id === pet.id ? { ...p, hp: newHp } : p))
            addLog(`${monster.name} 攻击了 ${pet.name}，造成 ${result.damage} 点伤害`)
          }
        } else {
          addLog(`${monster.name} 攻击了 ${target.entity.name}，但未命中`)
        }
      }
      
      // 再次检查战斗是否已停止（可能在setPlayer期间被停止）
      if (battleStateRef.current.stopped) {
        return
      }
      
      // 更新怪物MP（使用最新的monsters状态）
      let battleEnded = false
      setMonsters(prev => {
        // 再次检查战斗是否已停止
        if (battleStateRef.current.stopped) return prev
        
        const updated = prev.map((m, idx) => 
          idx === monsterIndex ? { ...m, mp: Math.max(0, monster.mp) } : m
        )
        // 检查战斗是否结束
        const battleResult = checkBattleEnd(updated)
        if (battleResult) {
          settleBattle(battleResult, updated)
          battleStateRef.current.isProcessing = false
          battleEnded = true
        }
        return updated
      })
      
      // 如果战斗已结束，直接返回
      if (battleEnded) {
        return
      }
      
      // 继续下一行动
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(TURN_DELAY)
    }, ACTION_ANIMATION_DELAY)
  }, [inBattle, player, activePet, pets, executeAttack, addLog, setPlayer, setPets, setMonsters, checkBattleEnd, settleBattle, scheduleNextTurn])

  // 捕捉怪物
  const captureMonster = useCallback((targetMonster = null) => {
    if (!player || player.hp <= 0) return
    
    const monster = targetMonster || selectedMonster
    if (!monster || monster.hp <= 0) return
    
    // 捕捉成功率：血量越低，成功率越高
    const captureRate = Math.max(0.1, 1 - (monster.hp / monster.maxHp))
    
    if (Math.random() < captureRate) {
      // 捕捉成功
      const newPet = {
        id: Date.now(),
        name: monster.name,
        element: monster.element,
        level: monster.level,
        hp: monster.hp,
        maxHp: monster.maxHp,
        mp: monster.mp,
        maxMp: monster.maxMp,
        strength: monster.strength,
        constitution: monster.constitution,
        spirit: monster.spirit,
        agility: monster.agility,
        attack: monster.attack,
        defense: monster.defense,
        speed: monster.speed,
        hitRate: monster.hitRate,
        magicDamage: monster.magicDamage,
        skills: monster.skills || [],
        exp: 0,
        expMax: calculateExpMax(monster.level),
        storedExp: 0,
        isBaby: monster.isBaby,
        rarity: monster.rarity,
        growth: monster.isBaby ? 1400 : 1000,
        attackAptitude: 1000,
        defenseAptitude: 1000,
        magicAptitude: 1000,
      }
      
      setPets(prev => [...prev, newPet])
      addLog(`成功捕捉了 ${monster.name}！`)
      
      // 移除怪物并检查战斗是否结束
      let battleEnded = false
      setMonsters(prev => {
        const updated = prev.filter(m => m.id !== monster.id)
        const battleResult = checkBattleEnd(updated)
        if (battleResult) {
          settleBattle(battleResult, updated)
          battleStateRef.current.isProcessing = false
          battleEnded = true
        }
        return updated
      })
      
      // 如果战斗已结束，直接返回
      if (battleEnded) {
        return
      }
    } else {
      addLog(`捕捉 ${monster.name} 失败`)
    }
    
    // 继续下一行动
    battleStateRef.current.isProcessing = false
    battleStateRef.current.currentTurnIndex++
    setPlayerTurn(false)
    scheduleNextTurn(TURN_DELAY)
  }, [player, selectedMonster, calculateExpMax, addLog, setPets, setMonsters, checkBattleEnd, settleBattle, setPlayerTurn, scheduleNextTurn])

  // 玩家攻击
  const playerAttack = useCallback((targetMonster = null) => {
    if (!player || player.hp <= 0) return
    
    const monster = targetMonster || selectedMonster
    if (!monster || monster.hp <= 0) return
    
    // 检查防御状态
    const isDefending = battleStateRef.current.defending.player
    const defenseMultiplier = isDefending ? 0.5 : 1
    
    const result = executeAttack(player, monster, false)
    
    if (result.hit) {
      const damage = Math.floor(result.damage * defenseMultiplier)
      const newHp = Math.max(0, monster.hp - damage)
      
      setMonsters(prev => {
        const updated = prev.map(m => 
          m.id === monster.id ? { ...m, hp: newHp } : m
        )
        // 直接使用更新后的数组检查战斗是否结束
        const battleResult = checkBattleEnd(updated)
        if (battleResult) {
          settleBattle(battleResult, updated)
          battleStateRef.current.isProcessing = false
        }
        return updated
      })
      
      addLog(`${player.name} 攻击了 ${monster.name}，造成 ${damage} 点伤害`)
    } else {
      addLog(`${player.name} 攻击了 ${monster.name}，但未命中`)
    }
    
    // 清除防御状态
    battleStateRef.current.defending.player = false
    
    // 继续下一行动（如果战斗未结束）
    if (!battleStateRef.current.stopped) {
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      setPlayerTurn(false)
      scheduleNextTurn(TURN_DELAY)
    }
  }, [player, selectedMonster, executeAttack, addLog, setMonsters, setPlayerTurn, scheduleNextTurn, checkBattleEnd, settleBattle])

  // 玩家使用技能
  const playerSkill = useCallback((skill, targetMonster = null) => {
    if (!player || player.hp <= 0) return
    if (player.mp < (skill.mpCost || 0)) {
      addLog('法力不足，无法使用技能')
      return
    }
    
    const monster = targetMonster || selectedMonster
    if (!monster || monster.hp <= 0) return
    
    const result = executeAttack(player, monster, true, skill)
    
    if (result.hit) {
      const newHp = Math.max(0, monster.hp - result.damage)
      
      setMonsters(prev => {
        const updated = prev.map(m => 
          m.id === monster.id ? { ...m, hp: newHp } : m
        )
        // 直接使用更新后的数组检查战斗是否结束
        const battleResult = checkBattleEnd(updated)
        if (battleResult) {
          settleBattle(battleResult, updated)
          battleStateRef.current.isProcessing = false
        }
        return updated
      })
      
      addLog(`${player.name} 对 ${monster.name} 使用了 ${skill.name}，造成 ${result.damage} 点伤害`)
    } else {
      addLog(`${player.name} 对 ${monster.name} 使用了 ${skill.name}，但未命中`)
    }
    
    // 消耗MP（仅在战斗未结束时）
    if (!battleStateRef.current.stopped) {
      setPlayer(prev => {
        if (!prev) return prev
        return { ...prev, mp: Math.max(0, prev.mp - (skill.mpCost || 0)) }
      })
      console.log(4)
      // 继续下一行动（如果战斗未结束）
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      setPlayerTurn(false)
      scheduleNextTurn(TURN_DELAY)
    }
  }, [player, selectedMonster, executeAttack, addLog, setMonsters, setPlayer, setPlayerTurn, scheduleNextTurn, checkBattleEnd, settleBattle])

  // 执行自动玩家行动
  const executeAutoPlayerAction = useCallback(() => {
    const aliveMonsters = monsters.filter(m => m.hp > 0)
    if (aliveMonsters.length === 0) {
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(FAST_TURN_DELAY)
      return
    }
    
    // 选择目标（优先选择血量最少的）
    const target = aliveMonsters.reduce((min, m) => 
      (m.hp < min.hp) ? m : min
    )
    
    // 决定行动
    let action = 'attack'
    let skill = null
    
    // 检查是否自动捕捉
    if (autoSettings.autoCapture && target.hp <= target.maxHp * 0.3) {
      captureMonster(target)
      return
    }
    
    // 检查是否使用技能
    if (autoSettings.autoSkillId && player.skills) {
      skill = player.skills.find(s => s.id === autoSettings.autoSkillId)
      if (skill && player.mp >= (skill.mpCost || 0)) {
        action = 'skill'
      }
    }
    
    // 执行行动
    if (action === 'skill' && skill) {
      playerSkill(skill, target)
    } else {
      playerAttack(target)
    }
  }, [monsters, player, autoSettings, captureMonster, playerSkill, playerAttack, scheduleNextTurn])

  // 宠物攻击
  const petAttack = useCallback((pet, targetMonster) => {
    if (!pet || pet.hp <= 0) return
    if (!targetMonster || targetMonster.hp <= 0) return
    
    const isDefending = battleStateRef.current.defending.pet
    const defenseMultiplier = isDefending ? 0.5 : 1
    
    const result = executeAttack(pet, targetMonster, false)
    
    if (result.hit) {
      const damage = Math.floor(result.damage * defenseMultiplier)
      const newHp = Math.max(0, targetMonster.hp - damage)
      
      setMonsters(prev => {
        const updated = prev.map(m => 
          m.id === targetMonster.id ? { ...m, hp: newHp } : m
        )
        // 直接使用更新后的数组检查战斗是否结束
        const battleResult = checkBattleEnd(updated)
        if (battleResult) {
          settleBattle(battleResult, updated)
          battleStateRef.current.isProcessing = false
        }
        return updated
      })
      
      addLog(`${pet.name} 攻击了 ${targetMonster.name}，造成 ${damage} 点伤害`)
    } else {
      addLog(`${pet.name} 攻击了 ${targetMonster.name}，但未命中`)
    }
    
    battleStateRef.current.defending.pet = false
    
    // 继续下一行动（如果战斗未结束）
    if (!battleStateRef.current.stopped) {
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(500)
    }
  }, [executeAttack, addLog, setMonsters, scheduleNextTurn, checkBattleEnd, settleBattle])

  // 宠物使用技能
  const petSkill = useCallback((pet, skill, targetMonster) => {
    if (!pet || pet.hp <= 0) return
    if (pet.mp < (skill.mpCost || 0)) {
      addLog(`${pet.name} 法力不足，无法使用技能`)
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(FAST_TURN_DELAY)
      return
    }
    
    if (!targetMonster || targetMonster.hp <= 0) return
    
    const result = executeAttack(pet, targetMonster, true, skill)
    
    if (result.hit) {
      const newHp = Math.max(0, targetMonster.hp - result.damage)
      
      setMonsters(prev => {
        const updated = prev.map(m => 
          m.id === targetMonster.id ? { ...m, hp: newHp } : m
        )
        // 直接使用更新后的数组检查战斗是否结束
        const battleResult = checkBattleEnd(updated)
        if (battleResult) {
          settleBattle(battleResult, updated)
          battleStateRef.current.isProcessing = false
        }
        return updated
      })
      
      addLog(`${pet.name} 对 ${targetMonster.name} 使用了 ${skill.name}，造成 ${result.damage} 点伤害`)
    } else {
      addLog(`${pet.name} 对 ${targetMonster.name} 使用了 ${skill.name}，但未命中`)
    }
    
    // 消耗MP
    setPets(prev => prev.map(p => 
      p.id === pet.id ? { ...p, mp: Math.max(0, p.mp - (skill.mpCost || 0)) } : p
    ))
    
    // 继续下一行动（如果战斗未结束）
    if (!battleStateRef.current.stopped) {
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(500)
    }
  }, [executeAttack, addLog, setMonsters, setPets, scheduleNextTurn, checkBattleEnd, settleBattle])

    // 执行自动宠物行动
  const executeAutoPetAction = useCallback(() => {
    const pet = pets.find(p => p.id === activePet?.id) || activePet
    if (!pet) {
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(FAST_TURN_DELAY)
      return
    }
    
    const aliveMonsters = monsters.filter(m => m.hp > 0)
    if (aliveMonsters.length === 0) {
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(FAST_TURN_DELAY)
      return
    }
    
    // 选择目标：默认优先血量最低；激进模式也使用这一策略
    const target = aliveMonsters.reduce((min, m) =>
      (m.hp < min.hp) ? m : min
    )

    const hpRatio = pet.maxHp > 0 ? pet.hp / pet.maxHp : 1
    const aiMode = pet.aiMode || 'balanced'

    // 防守型：血量较低时优先防御，暂不攻击
    if (aiMode === 'defensive' && hpRatio <= 0.3) {
      addLog(`${pet.name} 选择防守，暂不进攻`)
      battleStateRef.current.defending.pet = true
      battleStateRef.current.isProcessing = false
      battleStateRef.current.currentTurnIndex++
      scheduleNextTurn(TURN_DELAY)
      return
    }
    
    // 决定行动
    let action = 'attack'
    let skill = null
    
    // 检查是否使用技能
    if (autoSettings.autoPetSkillId && pet.skills) {
      skill = pet.skills.find(s => s.id === autoSettings.autoPetSkillId)
      if (skill && pet.mp >= (skill.mpCost || 0)) {
        action = 'skill'
      }
    }
    
    // 执行动作（保留一点延迟感）
    setTimeout(() => {
      if (action === 'skill' && skill) {
        petSkill(pet, skill, target)
      } else {
        petAttack(pet, target)
      }
    }, ACTION_ANIMATION_DELAY)
  }, [activePet, pets, monsters, autoSettings, petSkill, petAttack, scheduleNextTurn])

  // 玩家防御
  const playerDefend = useCallback(() => {
    if (!player || player.hp <= 0) return
    
    battleStateRef.current.defending.player = true
    addLog(`${player.name} 进入防御状态`)
    
    // 继续下一行动
    battleStateRef.current.isProcessing = false
    battleStateRef.current.currentTurnIndex++
    setPlayerTurn(false)
    scheduleNextTurn(TURN_DELAY)
  }, [player, addLog, setPlayerTurn, scheduleNextTurn])

  // 使用药品
  const useMedicine = useCallback((medicine) => {
    if (!player || player.hp <= 0) return
    if (battleStateRef.current.stopped) return // 战斗已结束，不允许使用药品
    if ((inventory[medicine.id] || 0) <= 0) {
      addLog('药品不足')
      return
    }
    
    const med = getMedicineById(medicine.id)
    if (!med) return
    
    if (med.type === 'hp') {
      setPlayer(prev => {
        if (!prev || battleStateRef.current.stopped) return prev
        const healAmount = med.value === 9999 ? prev.maxHp : med.value
        const oldHp = prev.hp || 0
        const newHp = Math.min(prev.maxHp, oldHp + healAmount)
        return { ...prev, hp: newHp }
      })
      // 计算恢复量用于日志（使用当前player状态）
      const healAmount = med.value === 9999 ? player.maxHp : med.value
      const oldHp = player.hp || 0
      const newHp = Math.min(player.maxHp, oldHp + healAmount)
      addLog(`使用了 ${med.name}，恢复 ${newHp - oldHp} 点生命值`)
    } else if (med.type === 'mp') {
      setPlayer(prev => {
        if (!prev || battleStateRef.current.stopped) return prev
        const restoreAmount = med.value === 9999 ? prev.maxMp : med.value
        const oldMp = prev.mp || 0
        const newMp = Math.min(prev.maxMp, oldMp + restoreAmount)
        return { ...prev, mp: newMp }
      })
      // 计算恢复量用于日志（使用当前player状态）
      const restoreAmount = med.value === 9999 ? player.maxMp : med.value
      const oldMp = player.mp || 0
      const newMp = Math.min(player.maxMp, oldMp + restoreAmount)
      addLog(`使用了 ${med.name}，恢复 ${newMp - oldMp} 点法力值`)
    }
    console.log(5)
    
    // 消耗药品
    setInventory(prev => ({
      ...prev,
      [medicine.id]: Math.max(0, (prev[medicine.id] || 0) - 1)
    }))
    
    // 继续下一行动
    battleStateRef.current.isProcessing = false
    battleStateRef.current.currentTurnIndex++
    setPlayerTurn(false)
    scheduleNextTurn(TURN_DELAY)
  }, [player, inventory, addLog, setPlayer, setInventory, setPlayerTurn, scheduleNextTurn])

  return {
    startBattle,
    stopBattle,
    playerAttack,
    playerDefend,
    playerSkill,
    captureMonster,
    useMedicine,
  }
}

