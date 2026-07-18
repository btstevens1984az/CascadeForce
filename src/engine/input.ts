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

  /** Arrow keys only for movement. */
  moveX() {
    let x = 0
    if (this.down('ArrowLeft')) x -= 1
    if (this.down('ArrowRight')) x += 1
    return x
  }

  aimUp() {
    return this.down('ArrowUp')
  }

  aimDown() {
    return this.down('ArrowDown')
  }

  /** Jump — X / C / Shift (Space is fire). */
  jump() {
    return this.just('KeyX') || this.just('KeyC') || this.just('ShiftLeft') || this.just('ShiftRight')
  }

  jumpHeld() {
    return this.down('KeyX') || this.down('KeyC') || this.down('ShiftLeft') || this.down('ShiftRight')
  }

  /** Hold Z to duck and let high shots miss. */
  duck() {
    return this.down('KeyZ')
  }

  /** Spacebar fires. */
  fire() {
    return this.down('Space')
  }

  confirm() {
    return this.just('Enter')
  }
}
