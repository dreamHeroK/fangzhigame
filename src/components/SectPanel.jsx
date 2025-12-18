import { useGame } from '../context/GameContext'
import { sects } from '../utils/sects'
import './SectPanel.css'

const elementIcons = {
  '金': '⚡',
  '木': '🌲',
  '水': '💧',
  '火': '🔥',
  '土': '⛰️'
}

function SectPanel({ onClose }) {
  const { player, setPlayer, playerRef } = useGame()

  if (!player) return null

  // 如果已经拜入门派，显示技能列表
  if (player.sect) {
    const sect = sects[player.element]
    const availableSkills = sect.skills.filter(skill => player.level >= skill.level)
    const learnedSkills = player.skills || []

    const learnSkill = (skill) => {
      if (learnedSkills.find(s => s.id === skill.id)) {
        alert('你已经学会了这个技能！')
        return
      }
      if (player.level < skill.level) {
        alert(`需要等级 ${skill.level} 才能学习此技能！`)
        return
      }
      // 基于最新的 playerRef 更新，避免用旧快照覆盖经验/等级
      setPlayer(prev => {
        const base = playerRef?.current || prev
        if (!base) return base
        const currentSkills = base.skills || []
        if (currentSkills.find(s => s.id === skill.id)) return base
        return {
          ...base,
          skills: [...currentSkills, skill],
        }
      })
    }

    return (
      <div className="modal active" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={onClose}>&times;</span>
          <h2>门派: {sect.name}</h2>
          <div className="sect-content">
            <div className="learned-skills">
              <h3>已学技能:</h3>
              {learnedSkills.length === 0 ? (
                <p className="no-skills">暂无技能</p>
              ) : (
                <div className="skills-list">
                  {learnedSkills.map(skill => (
                    <div key={skill.id} className="skill-item learned">
                      <div className="skill-name">{elementIcons[skill.element]} {skill.name}</div>
                      <div className="skill-desc">{skill.desc}</div>
                      <div className="skill-info">消耗: {skill.mpCost} MP</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="available-skills">
              <h3>可学技能:</h3>
              {availableSkills.length === 0 ? (
                <p className="no-skills">暂无新技能可学</p>
              ) : (
                <div className="skills-list">
                  {availableSkills.map(skill => {
                    const isLearned = learnedSkills.find(s => s.id === skill.id)
                    return (
                      <div key={skill.id} className={`skill-item ${isLearned ? 'learned' : ''}`}>
                        <div className="skill-name">{elementIcons[skill.element]} {skill.name}</div>
                        <div className="skill-desc">{skill.desc}</div>
                        <div className="skill-info">
                          需要等级: {skill.level} | 消耗: {skill.mpCost} MP
                        </div>
                        {!isLearned && (
                          <button
                            className="btn-learn"
                            onClick={() => learnSkill(skill)}
                          >
                            学习
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 如果未拜入门派，显示拜入界面
  if (player.level < 10) {
    return (
      <div className="modal active" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={onClose}>&times;</span>
          <h2>拜入门派</h2>
          <div className="sect-content">
            <p>需要达到 10 级才能拜入门派！</p>
            <p>当前等级: {player.level}</p>
          </div>
        </div>
      </div>
    )
  }

  // 10级后可以拜入
  const sect = sects[player.element]

  const joinSect = () => {
    // 同样基于最新 playerRef，避免覆盖经验
    setPlayer(prev => {
      const base = playerRef?.current || prev
      if (!base) return base
      return {
        ...base,
        sect: sect.name,
        skills: [],
      }
    })
    alert(`恭喜拜入 ${sect.name}！`)
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>拜入门派</h2>
        <div className="sect-content">
          <div className="sect-info">
            <h3>{elementIcons[player.element]} {sect.name}</h3>
            <p>你的系别可以拜入此门派</p>
            <div className="sect-skills-preview">
              <h4>门派技能:</h4>
              {sect.skills.map(skill => (
                <div key={skill.id} className="skill-preview">
                  {elementIcons[skill.element]} {skill.name} (需要等级 {skill.level})
                </div>
              ))}
            </div>
            <button className="btn-join" onClick={joinSect}>
              拜入门派
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SectPanel

