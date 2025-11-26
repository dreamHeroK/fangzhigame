# 问道 - 回合制游戏

一个基于 React + Vite 开发的网页回合制游戏，类似"问道"游戏。

## 功能特性

- 🎮 **角色选择系统**：5种属性角色（金、木、水、火、土）
- ⚔️ **回合制战斗**：每场战斗随机生成 1-10 只怪物
- 🎯 **属性相克系统**：金克木、木克土、土克水、水克火、火克金
- 🐾 **宠物捕捉系统**：战斗中可捕捉怪物成为宠物
- 📈 **属性加点系统**：人物和宠物都可以进行属性加点
- 📊 **升级系统**：击败怪物获得经验，升级提升属性

## 技术栈

- React 18
- Vite 5
- CSS3

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 游戏玩法

1. **选择角色**：游戏开始时选择你的角色属性
2. **开始战斗**：点击"开始战斗"按钮进入战斗
3. **战斗操作**：
   - 点击怪物选择目标
   - 使用"攻击"进行普通攻击
   - 使用"防御"减少受到的伤害
   - 使用"技能"消耗法力造成更高伤害
   - 使用"捕捉"尝试捕捉怪物成为宠物
4. **属性管理**：
   - 点击"属性加点"分配属性点
   - 点击"宠物管理"查看和管理宠物
5. **升级成长**：击败怪物获得经验，升级后获得属性点

## 项目结构

```
wendao/
├── src/
│   ├── components/      # React 组件
│   │   ├── CharacterSelect.jsx
│   │   ├── GameScreen.jsx
│   │   ├── PlayerInfo.jsx
│   │   ├── PetInfo.jsx
│   │   ├── BattleArea.jsx
│   │   ├── ActionPanel.jsx
│   │   ├── BattleLog.jsx
│   │   ├── AttributePanel.jsx
│   │   └── PetPanel.jsx
│   ├── context/         # React Context
│   │   └── GameContext.jsx
│   ├── hooks/           # 自定义 Hooks
│   │   └── useBattle.js
│   ├── utils/           # 工具函数
│   │   └── gameUtils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 开发说明

- 使用 React Context 进行状态管理
- 使用自定义 Hooks 封装战斗逻辑
- 组件化设计，易于维护和扩展

