import './style.css'
import { Game } from './game'

const canvas = document.getElementById('game') as HTMLCanvasElement
const game = new Game(canvas)

document.getElementById('startBtn')?.addEventListener('click', () => game.onStartClick())
document.getElementById('storyBtn')?.addEventListener('click', () => game.onStoryClick())
document.getElementById('overlayBtn')?.addEventListener('click', () => game.onOverlayClick())

declare global {
  interface Window {
    cascadeForce?: Game
  }
}
window.cascadeForce = game

game.start()