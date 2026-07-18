export class Input {
  private held = new Map<string, boolean>()
  private pressed = new Set<string>()

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.held.get(e.code)) this.pressed.add(e.code)
      this.held.set(e.code, true)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
    })
    window.addEventListener('keyup', (e) => this.held.set(e.code, false))
  }

  down(code: string) {
    return !!this.held.get(code)
  }

  just(code: string) {
    return this.pressed.has(code)
  }

  endFrame() {
    this.pressed.clear()
  }

  moveX() {
    let x = 0
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1
    return x
  }

  /** Aim up — separate from jump (Contra-style). */
  aimUp() {
    return this.down('KeyW') || this.down('ArrowUp')
  }

  aimDown() {
    return this.down('KeyS') || this.down('ArrowDown')
  }

  jump() {
    return this.just('Space') || this.just('KeyK')
  }

  jumpHeld() {
    return this.down('Space') || this.down('KeyK')
  }

  duck() {
    return (this.down('KeyS') || this.down('ArrowDown')) && !this.aimUp()
  }

  fire() {
    return this.down('KeyJ') || this.down('KeyZ')
  }

  confirm() {
    return this.just('Enter') || this.just('Space')
  }
}
