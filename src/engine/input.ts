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
    // Keep focus-friendly: blur shouldn't leave keys stuck
    window.addEventListener('blur', () => {
      this.held.clear()
      this.pressed.clear()
    })
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
    if (this.down('ArrowLeft')) x -= 1
    if (this.down('ArrowRight')) x += 1
    return x
  }

  /** Aim up — arrow only (W is jump). */
  aimUp() {
    return this.down('ArrowUp')
  }

  aimDown() {
    return this.down('ArrowDown') && !this.duck()
  }

  /**
   * Jump — W / X / C / Ctrl / Shift.
   * Uses held edge via just(), plus jump buffer in Game.
   */
  jumpPressed() {
    return (
      this.just('KeyW') ||
      this.just('KeyX') ||
      this.just('KeyC') ||
      this.just('ControlLeft') ||
      this.just('ControlRight') ||
      this.just('ShiftLeft') ||
      this.just('ShiftRight')
    )
  }

  jumpHeld() {
    return (
      this.down('KeyW') ||
      this.down('KeyX') ||
      this.down('KeyC') ||
      this.down('ControlLeft') ||
      this.down('ControlRight') ||
      this.down('ShiftLeft') ||
      this.down('ShiftRight')
    )
  }

  /** Duck — hold Z or Arrow Down while grounded. */
  duck() {
    return this.down('KeyZ') || this.down('ArrowDown')
  }

  fire() {
    return this.down('Space')
  }

  confirm() {
    return this.just('Enter')
  }
}
