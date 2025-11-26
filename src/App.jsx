import { useState } from 'react'
import CharacterSelect from './components/CharacterSelect'
import GameScreen from './components/GameScreen'
import { GameProvider, useGame } from './context/GameContext'

function AppContent() {
  const { player } = useGame()

  return !player ? (
    <CharacterSelect />
  ) : (
    <GameScreen />
  )
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}

export default App

