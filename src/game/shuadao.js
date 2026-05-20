/**
 * 刷道任务配置 — 除暴/降妖/伏魔三类元数据
 * 实际战斗由 shuadaoEncounter.js 生成敌方阵容，进入真实战斗画面
 */

export const SHUADAO_TYPES = {
  chubao: {
    id: 'chubao',
    label: '除暴',
    tag: '初级',
    desc: '讨伐山贼野匪，除地方之害，维护一方安宁。',
    enemyDesc: '山贼头目（首领）× 1、山贼 × 3',
    color: 'var(--bamboo)',
    tagColor: 'bamboo',
  },
  jiangyao: {
    id: 'jiangyao',
    label: '降妖',
    tag: '中级',
    desc: '降服修为深厚的妖兽，消除危害修士之妖患。',
    enemyDesc: '妖王（首领）× 1、妖兵 × 3',
    color: 'var(--gold-2)',
    tagColor: 'rust',
  },
  fomo: {
    id: 'fomo',
    label: '伏魔',
    tag: '高级',
    desc: '深入魔窟，斩除兴风作浪的魔头，此战凶险万分。',
    enemyDesc: '魔尊（首领）× 1、魔兵 × 3',
    color: 'var(--vermilion)',
    tagColor: 'vermilion',
  },
}

export const SHUADAO_ORDER = ['chubao', 'jiangyao', 'fomo']
