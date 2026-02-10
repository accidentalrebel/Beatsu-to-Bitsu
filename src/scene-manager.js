import { showOverlay } from './overlay.js'

const SCENE_DURATION = 60
const MAX_DT = 0.1

export class SceneManager {
  constructor(canvasA, canvasB, sceneModules) {
    this.canvasA = canvasA
    this.canvasB = canvasB
    this.modules = sceneModules
    this.currentIndex = 0
    this.elapsed = 0
    this.sceneTime = 0
    this.transitioning = false
    this.activeScene = null
    this.nextScene = null
    this.lastTime = 0
    this.raf = null

    this._resizeCanvases()
    window.addEventListener('resize', this._onResize.bind(this))

    document.getElementById('skip-btn').addEventListener('click', () => this.skip())

    // Fullscreen on first interaction
    const goFullscreen = () => {
      document.documentElement.requestFullscreen?.().catch(() => {})
      document.removeEventListener('click', goFullscreen)
      document.removeEventListener('touchstart', goFullscreen)
    }
    document.addEventListener('click', goFullscreen)
    document.addEventListener('touchstart', goFullscreen)
  }

  async start() {
    this.activeScene = await this._initScene(this.canvasA, this.currentIndex)
    showOverlay(this.modules[this.currentIndex].name)
    this.lastTime = performance.now()
    this._loop(this.lastTime)
  }

  skip() {
    if (this.transitioning) return
    this._beginTransition()
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

  async _beginTransition() {
    if (this.transitioning) return
    this.transitioning = true

    const nextIndex = (this.currentIndex + 1) % this.modules.length
    this.nextScene = await this._initScene(this.canvasB, nextIndex)

    showOverlay(this.modules[nextIndex].name)

    this.canvasB.classList.add('visible')

    const onEnd = () => {
      this.canvasB.removeEventListener('transitionend', onEnd)
      this._finishTransition(nextIndex)
    }
    this.canvasB.addEventListener('transitionend', onEnd)

    // Safety fallback if transitionend doesn't fire
    setTimeout(() => {
      if (this.transitioning) {
        this.canvasB.removeEventListener('transitionend', onEnd)
        this._finishTransition(nextIndex)
      }
    }, 3000)
  }

  _finishTransition(nextIndex) {
    if (this.activeScene) this.activeScene.destroy()

    const oldA = this.canvasA
    this.canvasA = this.canvasB
    this.canvasB = oldA

    // Disable transition during swap to avoid unwanted fades
    this.canvasA.style.transition = 'none'
    this.canvasB.style.transition = 'none'

    // Active canvas: behind, fully visible
    this.canvasA.style.zIndex = '1'
    this.canvasA.style.opacity = '1'
    this.canvasA.classList.remove('visible')

    // Next canvas: on top, hidden, ready for crossfade
    this.canvasB.style.zIndex = '2'
    this.canvasB.style.opacity = '0'
    this.canvasB.classList.remove('visible')

    // Re-enable transition after a frame
    requestAnimationFrame(() => {
      this.canvasB.style.transition = ''
    })

    this.activeScene = this.nextScene
    this.nextScene = null
    this.currentIndex = nextIndex
    this.sceneTime = 0
    this.transitioning = false
  }

  async _initScene(canvas, index) {
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
    // Only resize scenes — they manage their own canvas dimensions
    // (Three.js scenes use renderer.setSize, Canvas2D scenes set w/h in resize)
    if (this.activeScene) this.activeScene.resize(w, h)
    if (this.nextScene) this.nextScene.resize(w, h)
  }

  _onResize() {
    clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(() => this._resizeCanvases(), 150)
  }
}
