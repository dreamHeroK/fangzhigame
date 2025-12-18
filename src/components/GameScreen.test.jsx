import { render, screen } from '@testing-library/react'
import React from 'react'
import { GameProvider } from '../context/GameContext'
import GameScreen from './GameScreen'

function renderWithGameProvider(ui) {
  return render(<GameProvider>{ui}</GameProvider>)
}

describe('GameScreen', () => {
  test('渲染底部常用按钮', () => {
    renderWithGameProvider(<GameScreen />)

    expect(screen.getByRole('button', { name: '人物信息' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '背包' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '药品商店' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '兑换码' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '存档管理' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '注销' })).toBeInTheDocument()
  })
})


