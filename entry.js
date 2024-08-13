import { resize } from './lib/engine/utils.js'
import Game, { DEBUG_KEY } from './lib/engine/game.js'

window.onload = () => {
  const canvas = document.querySelector('canvas')
  resize(canvas)

  const gl = canvas.getContext('webgl2', {
    antialiasing: true
  })
  gl.enable(gl.BLEND)
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  let game,
    play = false,
    last = 0

  const render = timestamp => {
    timestamp *= 0.001
    const dt = Math.min(0.1, timestamp - last)
    last = timestamp

    const fps = (1 / dt).toFixed(1)
    document.querySelector('#fps').innerText = `${fps} FPS`

    game.processInput(gl, dt)
    game.update(gl, dt)
    game.render(gl, dt)

    if (play) requestAnimationFrame(render)
  }

  const keydown = event => (game.keys[event.key] = true)
  const keyup = event => {
    if (event.key !== DEBUG_KEY) game.keys[event.key] = false
  }
  const mousemove = event => {
    game.cursor.x =
      (game.cursor.x !== undefined ? game.cursor.x : game.cursor.lastX) +
      event.movementX
    game.cursor.y =
      (game.cursor.y !== undefined ? game.cursor.y : game.cursor.lastY) +
      event.movementY
  }
  const click = event => {
    game.cursor.clickX = event.x
    game.cursor.clickY = event.y
  }

  canvas.addEventListener('click', async event => {
    if (document.pointerLockElement === canvas) return

    if (!game) game = await Game.init(gl)
    game.cursor = {
      lastX: event.clientX,
      lastY: event.clientY,
      x: undefined,
      y: undefined
    }

    canvas.requestPointerLock({
      unadjustedMovement: true
    })
  })

  canvas.addEventListener('touchstart', event => {
    const touches = event.touches.length
  })

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      play = true
      last = 0

      window.addEventListener('keydown', keydown)
      window.addEventListener('keyup', keyup)
      window.addEventListener('mousemove', mousemove)
      window.addEventListener('click', click)
      requestAnimationFrame(render)
    } else {
      play = false
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('mousemove', mousemove)
      window.removeEventListener('click', click)
      cancelAnimationFrame(render)
    }
  })

  window.addEventListener('resize', () => resize(canvas))
}
