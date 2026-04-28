import { describe, expect, it } from 'vitest'
import {
  SCHOOLS,
  canLearnSkill,
  getAllSchoolSkills,
  getSkillById,
  getSkillsBySchool,
  maxSkillLevelForChar,
  prereqSkillId,
} from './schoolSkills.js'

describe('schoolSkills', () => {
  it('exports 5 schools × 3 branches × 5 tiers', () => {
    const all = getAllSchoolSkills()
    expect(all.length).toBe(75)
    expect(new Set(all.map((s) => s.school)).size).toBe(5)
    for (const school of SCHOOLS) {
      expect(getSkillsBySchool(school).length).toBe(15)
    }
  })

  it('金系 B 线名称与阶位', () => {
    const jin = getSkillsBySchool('金').filter((s) => s.branch === 'B')
    expect(jin.map((s) => s.name)).toEqual([
      '金光乍现',
      '刀光剑影',
      '金虹贯日',
      '流光异彩',
      '逆天残刃',
    ])
    expect(jin[0].learnCharLevel).toBe(10)
    expect(jin[1].prereq).toEqual({ branch: 'B', tier: 1, minSkillLevel: 30 })
  })

  it('canLearnSkill 攻击二阶需人物≥19 且 B1≥30', () => {
    const id = 'jin_B2'
    expect(canLearnSkill(18, { jin_B1: 40 }, id).ok).toBe(false)
    expect(canLearnSkill(19, { jin_B1: 29 }, id).ok).toBe(false)
    expect(canLearnSkill(19, { jin_B1: 30 }, id).ok).toBe(true)
  })

  it('障碍二阶需 C1≥40 且人物≥25（与技能上限一致）', () => {
    const id = 'jin_C2'
    expect(canLearnSkill(24, { jin_C1: 40 }, id).ok).toBe(false)
    expect(canLearnSkill(25, { jin_C1: 40 }, id).ok).toBe(true)
  })

  it('辅助二阶需 D1≥30 且人物≥40', () => {
    const id = 'jin_D2'
    expect(canLearnSkill(39, { jin_D1: 40 }, id).ok).toBe(false)
    expect(canLearnSkill(40, { jin_D1: 30 }, id).ok).toBe(true)
  })

  it('prereqSkillId 指向上一阶', () => {
    const sk = getSkillById('jin_B3')
    expect(sk?.prereq).toBeTruthy()
    expect(prereqSkillId(sk)).toBe('jin_B2')
  })

  it('maxSkillLevelForChar', () => {
    expect(maxSkillLevelForChar(100)).toBe(160)
    expect(maxSkillLevelForChar(25)).toBe(40)
  })
})
