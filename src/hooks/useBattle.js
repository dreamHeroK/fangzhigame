import { useGame } from '../context/GameContext'
import { generateMonsters, generateDrops } from '../utils/gameUtils'
import { isAdvantageous } from '../utils/sects'
import { updatePlayerBattleStats, calculateBattleStats } from '../utils/attributeCalc'
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
    redeemStatus,
    activePet,
    setActivePet,
    autoSettings,
  } = useGame()

  // ========== 通用工具函数 ==========
  
  /**
   * 计算物理攻击伤害
   * @param {Object} attacker - 攻击者（玩家/宠物/怪物）
   * @param {Object} target - 目标（怪物/玩家）
   * @param {number} defenseMultiplier - 防御减免系数（默认0.5）
   * @returns {number} 伤害值
   */
  const calculatePhysicalDamage = (attacker, target, defenseMultiplier = 0.5) => {
    let damage = attacker.attack || 0
    
    // 属性相克
    if (isAdvantageous(attacker.element, target.element)) {
      damage = Math.floor(damage * 1.5)
    }
    
    // 防御减免
    damage = Math.max(1, damage - Math.floor((target.defense || 0) * defenseMultiplier))
    
    return damage
  }

  /**
   * 计算技能攻击伤害
   * @param {Object} attacker - 攻击者（玩家/宠物/怪物）
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标（怪物/玩家）
   * @param {number} defenseMultiplier - 防御减免系数（默认0.3）
   * @returns {number} 伤害值
   */
  const calculateSkillDamage = (attacker, skill, target, defenseMultiplier = 0.3) => {
    // 基础伤害 = 攻击力 * 技能倍率 * 法术伤害加成
    let damage = Math.floor(attacker.attack * skill.damage * (attacker.magicDamage || 1.0))
    
    // 玩家特有的相性点法术伤害加成
    if (attacker.spellDamageBonus) {
      const elementKey = {
        '金': 'gold',
        '木': 'wood',
        '水': 'water',
        '火': 'fire',
        '土': 'earth',
      }[skill.element]
      
      if (elementKey && attacker.spellDamageBonus[elementKey]) {
        damage = Math.floor(damage * attacker.spellDamageBonus[elementKey])
      }
    }
    
    // 属性相克
    if (isAdvantageous(skill.element, target.element)) {
      damage = Math.floor(damage * 1.5)
    }
    
    // 防御减免
    damage = Math.max(1, damage - Math.floor((target.defense || 0) * defenseMultiplier))
    
    return damage
  }

  /**
   * 更新怪物状态并处理 selectedMonster
   * @param {Array} currentMonsters - 当前怪物列表
   * @param {Object} targetMonster - 目标怪物
   * @param {number} newHp - 新的HP值
   * @returns {Array} 更新后的怪物列表
   */
  const updateMonsterHp = (currentMonsters, targetMonster, newHp) => {
    const updatedMonsters = currentMonsters.map(m =>
      m.id === targetMonster.id ? { ...m, hp: newHp } : m
    )
    setMonsters(updatedMonsters)
    
    // 更新 selectedMonster 以保持同步
    const updatedSelectedMonster = updatedMonsters.find(m => m.id === targetMonster.id)
    if (updatedSelectedMonster && updatedSelectedMonster.hp > 0) {
      setSelectedMonster(updatedSelectedMonster)
    } else {
      setSelectedMonster(null)
    }
    
    return updatedMonsters
  }

  /**
   * 处理攻击结果（检查战斗结束、继续回合等）
   * @param {Array} updatedMonsters - 更新后的怪物列表
   * @param {boolean} isPlayerTurn - 是否是玩家回合
   * @param {Function} onContinue - 继续回合的回调函数
   */
  const handleAttackResult = (updatedMonsters, isPlayerTurn = false, onContinue = null) => {
    const battleEnded = checkBattleEnd(updatedMonsters)
    if (!battleEnded && inBattle) {
      if (isPlayerTurn) {
        setPlayerTurn(false)
      }
      setTimeout(() => {
        if (onContinue) {
          onContinue()
        } else {
          continueTurn()
        }
      }, 1000)
    }
  }

  const getPetExpRequirement = (level = 1) => Math.max(25, Math.floor(30 + level * 20))

  const recalcPetStats = (pet) => {
    const petStats = pet.growth ? {
      growth: pet.growth,
      attackAptitude: pet.attackAptitude || 1000,
      defenseAptitude: pet.defenseAptitude || 1000,
      magicAptitude: pet.magicAptitude || 1000,
    } : null

    const battleStats = calculateBattleStats(
      {
        strength: pet.strength || 0,
        constitution: pet.constitution || 0,
        spirit: pet.spirit || 0,
        agility: pet.agility || 0,
      },
      pet.level || 1,
      null,
      {},
      petStats
    )

    const updatedPet = {
      ...pet,
      attack: battleStats.attack,
      defense: battleStats.defense,
      speed: battleStats.speed,
      maxHp: battleStats.maxHp,
      maxMp: battleStats.maxMp,
      hitRate: battleStats.hitRate,
      magicDamage: battleStats.magicDamage,
      exp: pet.exp ?? 0,
      expMax: pet.expMax ?? getPetExpRequirement(pet.level || 1),
      storedExp: pet.storedExp ?? 0,
    }

    updatedPet.hp = Math.min(battleStats.maxHp, pet.hp ?? battleStats.maxHp)
    updatedPet.mp = Math.min(battleStats.maxMp, pet.mp ?? battleStats.maxMp)

    return updatedPet
  }

  const applyPetExperience = (pet, petExpGain) => {
    const maxPetLevel = (player?.level || 1) + 5
    let leveledUp = false
    let storedExpAdded = 0

    let updated = {
      ...pet,
      exp: pet.exp ?? 0,
      expMax: pet.expMax ?? getPetExpRequirement(pet.level || 1),
      storedExp: pet.storedExp ?? 0,
      level: pet.level || 1,
      points: pet.points || 0,
    }

    let availableExp = updated.exp + petExpGain

    if (updated.level >= maxPetLevel) {
      storedExpAdded += availableExp
      updated.storedExp += availableExp
      availableExp = 0
    } else if (updated.storedExp > 0) {
      availableExp += updated.storedExp
      updated.storedExp = 0
    }

    while (availableExp >= updated.expMax && updated.level < maxPetLevel) {
      availableExp -= updated.expMax
      updated.level += 1
      updated.points += 3
      updated.expMax = getPetExpRequirement(updated.level)
      leveledUp = true

      if (updated.level >= maxPetLevel) {
        storedExpAdded += availableExp
        updated.storedExp += availableExp
        availableExp = 0
        break
      }
    }

    updated.exp = availableExp

    let recalculated = recalcPetStats(updated)
    recalculated.exp = updated.exp
    recalculated.expMax = updated.expMax
    recalculated.storedExp = updated.storedExp
    recalculated.points = updated.points
    recalculated.level = updated.level

    if (leveledUp) {
      recalculated.hp = recalculated.maxHp
      recalculated.mp = recalculated.maxMp
    }

    return { updatedPet: recalculated, leveledUp, storedExpAdded }
  }

  const grantPetExperience = (playerExpGain) => {
    if (!activePet || playerExpGain <= 0) return

    const petExpGain = Math.floor(playerExpGain * 1.5)
    if (petExpGain <= 0) return

    const petInList = pets.find(p => p.id === activePet.id)
    const basePet = petInList || activePet

    const { updatedPet, leveledUp, storedExpAdded } = applyPetExperience(basePet, petExpGain)

    if (petInList) {
      setPets(prevPets => prevPets.map(p => p.id === basePet.id ? updatedPet : p))
    }

    setActivePet(updatedPet)
    addLog(`${updatedPet.name} 获得 ${petExpGain} 点宠物经验！`)

    const levelCap = (player?.level || 1) + 5
    if (storedExpAdded > 0 || updatedPet.storedExp > 0) {
      if (updatedPet.level >= levelCap) {
        addLog(`${updatedPet.name} 等级领先，额外经验已储存，总储存 ${updatedPet.storedExp} 点`)
      } else if (storedExpAdded > 0) {
        addLog(`${updatedPet.name} 使用储存经验并继续升级！`)
      }
    }

    if (leveledUp) {
      addLog(`${updatedPet.name} 升级到 ${updatedPet.level} 级！`)
    }
  }

  // ========== 战斗流程函数 ==========

  // 获取所有战斗单位并按速度排序
  const getBattleUnits = (currentPlayer, currentMonsters, currentPets) => {
    const units = []
    
    // 添加玩家
    if (currentPlayer && currentPlayer.hp > 0) {
      units.push({ 
        type: 'player', 
        data: currentPlayer, 
        speed: currentPlayer.speed || 0,
        name: currentPlayer.name 
      })
    }
    
    // 添加参战宠物（使用最新的宠物数据）
    // 优先使用 activePet 的 id 来查找，但确保使用 currentPets 中最新的数据
    if (activePet) {
      const pet = currentPets.find(p => p.id === activePet.id)
      if (pet && pet.hp > 0) {
        // 确保使用最新的速度值（从 pets 数组中获取，而不是 activePet）
        const petSpeed = pet.speed !== undefined ? pet.speed : 0
        units.push({ 
          type: 'pet', 
          data: pet, 
          speed: petSpeed,
          name: pet.name || '宠物'
        })
      }
    }
    
    // 添加怪物（只添加活着的怪物）
    currentMonsters.forEach(monster => {
      if (monster.hp > 0) {
        units.push({ 
          type: 'monster', 
          data: monster, 
          speed: monster.speed || 0,
          name: monster.name 
        })
      }
    })
    
    // 注意：这里只添加活着的怪物，所以 units 中不会包含已死亡的怪物
    
    // 按速度降序排序（速度高的先行动），如果速度相同，则按类型排序（玩家 > 宠物 > 怪物）
    return units.sort((a, b) => {
      if (b.speed !== a.speed) {
        return b.speed - a.speed
      }
      // 速度相同时，玩家优先，然后是宠物，最后是怪物
      const typeOrder = { player: 0, pet: 1, monster: 2 }
      return typeOrder[a.type] - typeOrder[b.type]
    })
  }

  const startBattle = (forceStart = false) => {
    // 如果 forceStart 为 true（连续战斗模式），跳过 inBattle 检查
    // 因为状态更新可能有延迟
    if (!forceStart && inBattle) return
    
    const mapData = maps[currentMap]
    if (!mapData || mapData.type === 'safe') {
      addLog('这里是安全区，无法战斗！')
      return
    }

    // 使用函数式更新获取最新的 player 数据并更新
    setPlayer(prevPlayer => {
      const newMonsters = generateMonsters(prevPlayer, currentMap)
      if (!newMonsters.length) {
        addLog('这里没有怪物可以挑战。')
        return prevPlayer
      }
      
      setMonsters(() => newMonsters)
      setSelectedMonster(() => null)
      // 先设置 inBattle，确保状态已更新
      setInBattle(() => true)
      setPlayerTurn(() => false) // 初始设置为 false，由 startTurn 根据速度顺序决定

      // 先更新属性（包含相性点和装备），这会重新计算 maxHp 和 maxMp
      const equipmentStats = getAllEquipmentStats(equippedItems)
      const updatedPlayer = updatePlayerBattleStats(
        { ...prevPlayer },
        elementPoints,
        equipmentStats
      )
      
      // 只有领取了兑换码的用户才在战斗开始前补满血蓝，否则保持之前的血量和法力值
      if (redeemStatus?.godMode) {
        updatedPlayer.hp = updatedPlayer.maxHp
        updatedPlayer.mp = updatedPlayer.maxMp
      }
      // 否则保持当前的血量和法力值（不修改 updatedPlayer.hp 和 updatedPlayer.mp）

      // 更新参战宠物的属性（如果有）- 使用函数式更新获取最新的 pets
      setPets(prevPets => {
        let updatedPetsList = prevPets
        if (activePet) {
          const petIndex = prevPets.findIndex(p => p.id === activePet.id)
          if (petIndex >= 0) {
            let updatedPet = recalcPetStats(prevPets[petIndex])
            if (redeemStatus?.godMode) {
              updatedPet.hp = updatedPet.maxHp
              updatedPet.mp = updatedPet.maxMp
            }
            updatedPetsList = prevPets.map((pet, idx) => idx === petIndex ? updatedPet : pet)
            setActivePet(() => updatedPet)
          }
        }

        // 在 setTimeout 中处理需要同时使用更新后的 player 和 pets 的逻辑
        setTimeout(() => {
          addLog('战斗开始！')
          addLog(`出现了 ${newMonsters.length} 只怪物！`)
          
          // 先获取出手顺序并输出（使用更新后的数据）
          // 注意：这里需要在 setTimeout 中重新获取最新的状态，或者直接使用计算好的值
          const battleUnits = getBattleUnits(updatedPlayer, newMonsters, updatedPetsList)
          if (battleUnits.length > 0) {
            const orderInfo = battleUnits.map((u, i) => `${i + 1}. ${u.name || u.data.name} (速度: ${u.speed})`).join(', ')
            addLog(`行动顺序: ${orderInfo}`)
          }
          
          // 直接开始第一回合（使用更新后的数据）
          if (battleUnits.length > 0) {
            processTurn(battleUnits, 0, newMonsters)
          }
        }, 300)

        return updatedPetsList
      })

      return updatedPlayer
    })
  }

  // 开始新回合
  const startTurn = () => {
    if (!inBattle) return
    
    const battleUnits = getBattleUnits(player, monsters, pets)
    if (battleUnits.length === 0) {
      endBattle(true)
      return
    }
    
    // 检查是否所有怪物都死了
    const aliveMonsters = monsters.filter(m => m.hp > 0)
    if (aliveMonsters.length === 0) {
      endBattle(true)
      return
    }
    
    // 检查玩家是否死了
    if (player.hp <= 0) {
      endBattle(false)
      return
    }
    
    // 检查 selectedMonster 是否还活着，如果已死亡则清除
    if (selectedMonster) {
      const monster = monsters.find(m => m.id === selectedMonster.id)
      if (!monster || monster.hp <= 0) {
        setSelectedMonster(null)
      }
    }
    
    // 按速度排序，开始行动
    processTurn(battleUnits, 0)
  }

  // 处理回合中的行动
  const processTurn = (units, currentIndex, currentMonstersList = null) => {
    // 不检查 inBattle，因为我们已经确保在战斗状态下调用
    // if (!inBattle) {
    //   console.log('processTurn: 战斗未开始，返回')
    //   return
    // }
    
    if (currentIndex >= units.length) {
      // 所有单位行动完毕，开始下一回合
      startTurn()
      return
    }
    
    // 使用传入的怪物列表，如果没有则使用状态中的 monsters
    const monstersToUse = currentMonstersList || monsters
    
    const unit = units[currentIndex]
    if (!unit) {
      // 单位不存在，继续下一个
      processTurn(units, currentIndex + 1, currentMonstersList)
      return
    }
    
    // 检查单位是否还活着（因为可能在之前的行动中被击败）
    if (unit.type === 'player') {
      if (!player || player.hp <= 0) {
        // 玩家已死亡，跳过
        processTurn(units, currentIndex + 1, currentMonstersList)
        return
      }
      // 玩家回合 - 设置玩家回合标志，等待玩家操作
      setPlayerTurn(true)
      // 注意：这里不继续下一个单位，等待玩家操作后调用 continueTurn
    } else if (unit.type === 'pet') {
      // 检查宠物是否还活着（优先使用 unit.data，如果找不到再从 pets 状态中查找）
      let currentPet = unit.data
      if (!currentPet || currentPet.hp <= 0) {
        // 尝试从 pets 状态中查找最新的数据
        currentPet = pets.find(p => p.id === unit.data.id)
        if (!currentPet || currentPet.hp <= 0) {
          // 宠物已死亡，跳过
          processTurn(units, currentIndex + 1, currentMonstersList)
          return
        }
      }
      // 宠物回合（自动行动）
      // 使用传入的怪物列表，避免闭包问题
      // 传递 units 和 currentIndex，以便 petTurn 可以继续下一个单位
      petTurn(currentPet, monstersToUse, units, currentIndex, () => {
        // petTurn 内部已经处理了继续逻辑，这里不需要做任何事
      })
    } else if (unit.type === 'monster') {
      // 检查怪物是否还活着（使用传入的怪物列表）
      const currentMonster = monstersToUse.find(m => m.id === unit.data.id)
      if (!currentMonster || currentMonster.hp <= 0) {
        // 怪物已死亡，跳过，继续下一个单位
        processTurn(units, currentIndex + 1, currentMonstersList)
        return
      }
      // 怪物回合（自动行动）
      monsterTurn(currentMonster, () => {
        processTurn(units, currentIndex + 1, currentMonstersList)
      })
    }
  }

  // 继续下一个单位的行动（玩家行动后调用）
  const continueTurn = () => {
    if (!inBattle) return
    
    // 重新获取战斗单位列表（因为怪物列表可能已更新）
    const battleUnits = getBattleUnits(player, monsters, pets)
    
    // 检查战斗是否结束
    const aliveMonsters = monsters.filter(m => m.hp > 0)
    if (aliveMonsters.length === 0) {
      endBattle(true)
      return
    }
    
    if (player.hp <= 0) {
      endBattle(false)
      return
    }
    
    // 找到玩家在列表中的位置，继续下一个单位
    const currentPlayerIndex = battleUnits.findIndex(u => u.type === 'player')
    if (currentPlayerIndex >= 0 && currentPlayerIndex + 1 < battleUnits.length) {
      // 继续下一个单位（玩家之后的单位）
      processTurn(battleUnits, currentPlayerIndex + 1)
    } else {
      // 如果玩家是最后一个，开始下一回合
      startTurn()
    }
  }

  const playerAttack = () => {
    if (!inBattle || !playerTurn || !selectedMonster) {
      addLog('请先选择目标怪物！')
      return
    }

    // 从 monsters 数组中获取最新的怪物数据，而不是使用 selectedMonster（可能是旧引用）
    const monster = monsters.find(m => m.id === selectedMonster.id)
    if (!monster || monster.hp <= 0) {
      addLog('目标怪物不存在或已死亡！')
      return
    }

    // 计算伤害
    let damage = calculatePhysicalDamage(player, monster, 0.5)
    
    // 属性相克提示
    if (isAdvantageous(player.element, monster.element)) {
      addLog(`${player.name} 对 ${monster.name} 造成克制伤害！`)
    }

    const newHp = Math.max(0, monster.hp - damage)
    const updatedMonsters = updateMonsterHp(monsters, monster, newHp)

    addLog(`${player.name} 攻击 ${monster.name}，造成 ${damage} 点伤害！`)

    if (newHp <= 0) {
      addLog(`${monster.name} 被击败！`)
      // 经验和掉落将在战斗结束时统一计算，这里只记录击败
    }

    handleAttackResult(updatedMonsters, true)
  }

  const playerDefend = () => {
    if (!inBattle || !playerTurn) return

    addLog(`${player.name} 进入防御状态！`)
    setPlayerTurn(false)
    setTimeout(() => continueTurn(), 1000)
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

    // 从 monsters 数组中获取最新的怪物数据，而不是使用 selectedMonster（可能是旧引用）
    const monster = monsters.find(m => m.id === selectedMonster.id)
    if (!monster || monster.hp <= 0) {
      addLog('目标怪物不存在或已死亡！')
      return
    }

    const updatedPlayer = { ...player, mp: player.mp - skill.mpCost }
    setPlayer(updatedPlayer)

    // 计算技能伤害
    let damage = calculateSkillDamage(player, skill, monster, 0.3)
    
    // 属性相克提示
    if (isAdvantageous(skill.element, monster.element)) {
      addLog(`${skill.name} 对 ${monster.name} 造成克制伤害！`)
    }

    const newHp = Math.max(0, monster.hp - damage)
    const updatedMonsters = updateMonsterHp(monsters, monster, newHp)

    addLog(`${player.name} 使用 ${skill.name} 攻击 ${monster.name}，造成 ${damage} 点伤害！`)

    if (newHp <= 0) {
      addLog(`${monster.name} 被击败！`)
      // 经验和掉落将在战斗结束时统一计算，这里只记录击败
    }

    handleAttackResult(updatedMonsters, true)
  }

  // 宠物行动
  const petTurn = (pet, currentMonsters = monsters, units = null, currentIndex = -1, callback = null) => {
    if (!pet || pet.hp <= 0) {
      if (callback) callback()
      return
    }

    const aliveMonsters = currentMonsters.filter(m => m.hp > 0)
    if (aliveMonsters.length === 0) {
      if (callback) callback()
      return
    }

    // 选择目标（选择第一个活着的怪物）
    const target = aliveMonsters[0]
    if (!target) {
      if (callback) callback()
      return
    }
    
    let damage = 0
    let useSkill = false
    let updatedPet = { ...pet }

    // 判断是否使用技能
    try {
      if (pet.skills && pet.skills.length > 0 && pet.mp > 0) {
        const autoSkillId = autoSettings?.autoPetSkillId
        const skill = autoSkillId 
          ? pet.skills.find(s => s.id === autoSkillId) || pet.skills[0]
          : pet.skills[0]
        
        if (skill && pet.mp >= skill.mpCost) {
          useSkill = true
          updatedPet.mp = pet.mp - skill.mpCost
          
          // 计算技能伤害
          damage = calculateSkillDamage(pet, skill, target, 0.3)
          
          // 属性相克提示
          if (isAdvantageous(skill.element, target.element)) {
            addLog(`${pet.name} 使用 ${skill.name}，对 ${target.name} 造成克制伤害！`)
          } else {
            addLog(`${pet.name} 使用 ${skill.name}！`)
          }
        }
      }
    } catch (error) {
      console.error('petTurn: 技能判断出错:', error)
      // 如果技能判断出错，使用物理攻击
      useSkill = false
    }

    // 物理攻击
    if (!useSkill) {
      try {
        damage = calculatePhysicalDamage(pet, target, 0.5)
        addLog(`${pet.name} 攻击 ${target.name}！`)
      } catch (error) {
        console.error('petTurn: 物理攻击计算出错:', error)
        damage = calculatePhysicalDamage(pet, target, 0.5)
        addLog(`${pet.name} 攻击 ${target.name}！`)
      }
    }

    const newHp = Math.max(0, target.hp - damage)
    const updatedMonsters = currentMonsters.map(m =>
      m.id === target.id ? { ...m, hp: newHp } : m
    )
    setMonsters(updatedMonsters)
    
    // 更新 selectedMonster（如果目标被选中）
    if (selectedMonster && selectedMonster.id === target.id) {
      const updatedSelectedMonster = updatedMonsters.find(m => m.id === target.id)
      if (updatedSelectedMonster && updatedSelectedMonster.hp > 0) {
        setSelectedMonster(updatedSelectedMonster)
      } else {
        setSelectedMonster(null)
      }
    }

    if (useSkill) {
      addLog(`${pet.name} 的 ${pet.skills[0].name} 对 ${target.name} 造成 ${damage} 点伤害！`)
    } else {
      addLog(`${pet.name} 对 ${target.name} 造成 ${damage} 点伤害！`)
    }

    // 更新宠物状态
    const updatedPets = pets.map(p => p.id === pet.id ? updatedPet : p)
    setPets(updatedPets)
    if (activePet && activePet.id === pet.id) {
      setActivePet(updatedPet)
    }

    // 检查怪物是否被击败
    if (newHp <= 0) {
      addLog(`${target.name} 被击败！`)
      // 经验和掉落将在战斗结束时统一计算，这里只记录击败
      
      // 如果被击败的怪物是当前选中的目标，清除选择
      if (selectedMonster && selectedMonster.id === target.id) {
        setSelectedMonster(null)
      }
    }

    // 检查战斗是否结束
    const battleEnded = checkBattleEnd(updatedMonsters)
    if (battleEnded) {
      // 战斗结束，不需要继续
      if (callback) callback()
      return
    }
    
    // 战斗未结束，继续下一个单位
    // 不检查 inBattle，因为 checkBattleEnd 已经处理了战斗结束的情况
    // 如果战斗没有结束，就应该继续执行
    setTimeout(() => {
      // 如果传入了 units 和 currentIndex，直接使用它们继续下一个单位
      if (units && currentIndex !== undefined && currentIndex >= 0) {
        const nextIndex = currentIndex + 1
        if (nextIndex < units.length) {
          // 直接继续下一个单位，传递更新后的怪物列表和更新后的宠物列表
          processTurn(units, nextIndex, updatedMonsters)
        } else {
          // 如果已经是最后一个，重新开始回合
          startTurn()
        }
      } else {
        // 如果没有传入 units 和 currentIndex，重新获取战斗单位列表
        const newBattleUnits = getBattleUnits(player, updatedMonsters, updatedPets)
        
        // 找到当前宠物在列表中的位置，继续下一个
        const petIndex = newBattleUnits.findIndex(u => u.type === 'pet' && u.data.id === pet.id)
        
        if (petIndex >= 0 && petIndex + 1 < newBattleUnits.length) {
          // 继续下一个单位，传递更新后的怪物列表
          processTurn(newBattleUnits, petIndex + 1, updatedMonsters)
        } else {
          // 如果找不到或已经是最后一个，重新开始回合
          startTurn()
        }
      }
    }, 1000)
  }

  const captureMonster = () => {
    if (!inBattle || !playerTurn || !selectedMonster) {
      addLog('请先选择目标怪物！')
      return
    }

    // 从 monsters 数组中获取最新的怪物数据，而不是使用 selectedMonster（可能是旧引用）
    const monster = monsters.find(m => m.id === selectedMonster.id)
    if (!monster) {
      addLog('目标怪物不存在！')
      return
    }

    if (monster.hp <= 0) {
      addLog('无法捕捉已死亡的怪物！')
      return
    }

    // 捕捉成功率
    const captureRate = (1 - monster.hp / monster.maxHp) * 0.5 + 0.3
    const success = Math.random() < captureRate

    if (success) {
      // 使用怪物的基础属性
      let pet = {
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

      pet.exp = 0
      pet.expMax = getPetExpRequirement(pet.level || 1)
      pet.storedExp = 0
      pet = recalcPetStats(pet)
      pet.hp = pet.maxHp
      pet.mp = pet.maxMp

      setPets([...pets, pet])
      const updatedMonsters = monsters.map(m =>
        m.id === monster.id ? { ...m, hp: 0, captured: true } : m
      )
      setMonsters(updatedMonsters)

      addLog(`成功捕捉 ${pet.name}！`)
      handleAttackResult(updatedMonsters, true)
    } else {
      addLog(`捕捉 ${monster.name} 失败！`)
      setPlayerTurn(false)
      setTimeout(() => continueTurn(), 1000)
    }
  }

  // 单个怪物行动
  const monsterTurn = (monster, callback) => {
    if (!inBattle || !monster || monster.hp <= 0) {
      if (callback) callback()
      return
    }

    const currentPlayer = player
    if (!currentPlayer || currentPlayer.hp <= 0) {
      if (callback) callback()
      return
    }

      let damage = 0
      let useSkill = false
      let updatedMonster = { ...monster }

      // 判断是否使用技能（30%概率使用技能）
      if (monster.skills && monster.skills.length > 0 && monster.mp > 0) {
        const skill = monster.skills[0]
        if (monster.mp >= skill.mpCost && Math.random() < 0.3) {
          useSkill = true
          updatedMonster.mp = monster.mp - skill.mpCost
          
          // 计算技能伤害
          damage = calculateSkillDamage(monster, skill, currentPlayer, 0.3)
          
          // 属性相克提示
          if (isAdvantageous(skill.element, currentPlayer.element)) {
            addLog(`${monster.name} 使用 ${skill.name}，造成克制伤害！`)
          } else {
            addLog(`${monster.name} 使用 ${skill.name}！`)
          }
        }
      }

      // 物理攻击
      if (!useSkill) {
        damage = calculatePhysicalDamage(monster, currentPlayer, 0.5)
      }

    const newPlayerHp = Math.max(0, currentPlayer.hp - damage)
    const updatedPlayer = { ...currentPlayer, hp: newPlayerHp }

    // 更新怪物MP（如果使用了技能）
    if (useSkill) {
      const updatedMonsters = monsters.map(m =>
        m.id === monster.id ? updatedMonster : m
      )
      setMonsters(updatedMonsters)
    }

    setPlayer(updatedPlayer)

      if (useSkill) {
        addLog(`${monster.name} 的 ${monster.skills[0].name} 对 ${currentPlayer.name} 造成 ${damage} 点伤害！`)
      } else {
        addLog(`${monster.name} 攻击 ${currentPlayer.name}，造成 ${damage} 点伤害！`)
      }

    if (newPlayerHp <= 0) {
      addLog(`${currentPlayer.name} 被击败！战斗失败！`)
      endBattle(false)
    } else {
      // 检查战斗是否结束
      const aliveMonsters = monsters.filter(m => m.hp > 0)
      if (aliveMonsters.length === 0) {
        endBattle(true)
        return
      }
      
      setTimeout(() => {
        if (callback) callback()
      }, 1000)
    }
  }

  const checkBattleEnd = (currentMonsters) => {
    const aliveMonsters = currentMonsters.filter(m => m.hp > 0)

    if (aliveMonsters.length === 0) {
      endBattle(true, currentMonsters)
      return true // 返回 true 表示战斗已结束
    }
    return false // 返回 false 表示战斗未结束
  }

  const endBattle = (victory, finalMonsters = monsters) => {
    setInBattle(false)
    setPlayerTurn(false)
    setSelectedMonster(null)

    if (victory) {
      addLog('战斗胜利！')
      
      // 计算所有被击败怪物的经验和掉落
      const defeatedMonsters = finalMonsters.filter(m => m.hp <= 0 && !m.captured)
      let totalExp = 0
      const drops = []
      
      defeatedMonsters.forEach(monster => {
        const expGain = monster.level * 10
        totalExp += expGain
        
        // 生成掉落
        const monsterDrops = generateDrops(monster)
        drops.push(...monsterDrops)
      })
      
      let updatedPlayer = player
      if (totalExp > 0) {
        updatedPlayer = {
          ...player,
          exp: player.exp + totalExp,
        }
        setPlayer(updatedPlayer)
        addLog(`${player.name} 获得 ${totalExp} 点经验！`)
        // checkLevelUp 会更新玩家状态，但我们需要在它之后检查连续战斗
        checkLevelUp(updatedPlayer)
        grantPetExperience(totalExp)
      }
      
      // 处理掉落
      if (drops.length > 0) {
        const newInventory = { ...inventory }
        let totalMoney = money
        
        drops.forEach(drop => {
          if (drop.type === 'money') {
            totalMoney += drop.amount
            addLog(`获得 ${drop.amount} 金钱！`)
          } else {
            newInventory[drop.id] = (newInventory[drop.id] || 0) + (drop.count || 1)
            addLog(`获得 ${drop.name}！`)
          }
        })
        
        setInventory(newInventory)
        setMoney(totalMoney)
      }
      
      // 检查是否启用连续战斗
      // 保存当前的 autoChainBattle 值，避免闭包问题
      const shouldChainBattle = autoSettings.autoChainBattle
      if (shouldChainBattle) {
        // 延迟一下，确保状态更新完成（包括升级），然后自动开启下一场战斗
        setTimeout(() => {
          const mapData = maps[currentMap]
          if (mapData && mapData.type !== 'safe') {
            startBattle(true)
          }
        }, 2000) // 延迟2秒，让玩家看到战斗结果和升级信息
      }
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
      setTimeout(() => continueTurn(), 1000)
    }
  }

  // 停止战斗
  const stopBattle = () => {
    if (!inBattle) return
    
    setInBattle(false)
    setPlayerTurn(false)
    setSelectedMonster(null)
    setMonsters([])
    addLog('战斗已停止')
  }

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

