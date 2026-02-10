import { showOverlay } from './overlay.js'

const SCENE_DURATION = 60
const MAX_DT = 0.1

export class SceneManager {
  constructor(sceneModules) {
    this.modules = sceneModules
    this.currentIndex = -1
    this.elapsed = 0
    this.sceneTime = 0
    this.transitioning = false
    this.activeCanvas = null
    this.activeScene = null
    this.nextCanvas = null
    this.nextScene = null
    this.lastTime = 0
    this.raf = null

    window.addEventListener('resize', this._onResize.bind(this))
    document.getElementById('skip-btn').addEventListener('click', () => this.skip())
  }

  start() {
    this.currentIndex = Math.floor(Math.random() * this.modules.length)
    this.activeCanvas = this._createCanvas()
    this.activeCanvas.style.opacity = '1'
    this.activeCanvas.style.zIndex = '1'
    this.activeScene = this._initScene(this.activeCanvas, this.currentIndex)
    showOverlay(this.modules[this.currentIndex].name)
    this.lastTime = performance.now()
    this._loop(this.lastTime)
  }

  skip() {
    if (this.transitioning) return
    this._beginTransition()
  }

  _pickNext() {
    if (this.modules.length <= 1) return 0
    let next
    do {
      next = Math.floor(Math.random() * this.modules.length)
    } while (next === this.currentIndex)
    return next
  }

  _createCanvas() {
    const c = document.createElement('canvas')
    c.className = 'scene-canvas'
    document.body.appendChild(c)
    return c
  }

  _loop(now) {
    this.raf = requestAnimationFrame((t) => this._loop(t))

    let dt = (now - this.lastTime) / 1000
    this.lastTime = now
    if (dt > MAX_DT) dt = MAX_DT

    this.elapsed += dt
    this.sceneTime += dt

    if (this.activeScene) this.activeScene.animate(dt, this.elapsed)
    if (this.nextScene) this.nextScene.animate(dt, this.elapsed)

    if (!this.transitioning && this.sceneTime >= SCENE_DURATION) {
      this._beginTransition()
    }
  }

  _beginTransition() {
    if (this.transitioning) return
    this.transitioning = true

    const nextIndex = this._pickNext()

    // Fresh canvas avoids WebGL/2D context conflicts
    const newCanvas = this._createCanvas()
    newCanvas.style.zIndex = '2'
    newCanvas.style.opacity = '0'
    this.nextCanvas = newCanvas
    this.nextScene = this._initScene(newCanvas, nextIndex)
    this._nextIndex = nextIndex

    showOverlay(this.modules[nextIndex].name)

    // Trigger fade-in on next frame so the transition fires
    requestAnimationFrame(() => {
      newCanvas.style.opacity = '1'
    })

    const onEnd = () => {
      newCanvas.removeEventListener('transitionend', onEnd)
      this._finishTransition()
    }
    newCanvas.addEventListener('transitionend', onEnd)

    setTimeout(() => {
      if (this.transitioning) {
        newCanvas.removeEventListener('transitionend', onEnd)
        this._finishTransition()
      }
    }, 3000)
  }

  _finishTransition() {
    if (this.activeScene) this.activeScene.destroy()
    if (this.activeCanvas) this.activeCanvas.remove()

    this.activeCanvas = this.nextCanvas
    this.activeScene = this.nextScene
    this.activeCanvas.style.zIndex = '1'
    this.currentIndex = this._nextIndex

    this.nextCanvas = null
    this.nextScene = null
    this._nextIndex = null
    this.sceneTime = 0
    this.transitioning = false
  }

  _initScene(canvas, index) {
    const mod = this.modules[index]
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * devicePixelRatio
    canvas.height = h * devicePixelRatio
    const scene = mod.init(canvas)
    scene.resize(w, h)
    return scene
  }

  _resizeCanvases() {
    const w = window.innerWidth
    const h = window.innerHeight
    if (this.activeScene) this.activeScene.resize(w, h)
    if (this.nextScene) this.nextScene.resize(w, h)
  }

  _onResize() {
    clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(() => this._resizeCanvases(), 150)
  }
}
