import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { palette } from '../palette.js'

export const name = 'neon city'

const CHUNK_DEPTH = 120
const CHUNK_COUNT = 3
const ROWS_PER_CHUNK = 8
const COLS_PER_SIDE = 4
const STREET_HALF_WIDTH = 8
const COL_SPACING = 12
const ROW_SPACING = 14
const NEON_COLORS = ['#ff2d95', '#ff6eb4', '#4de8e0', '#00fff5', '#ffb347', '#c77dba']

export function init(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
  renderer.setPixelRatio(devicePixelRatio)
  renderer.toneMapping = THREE.ReinhardToneMapping
  renderer.toneMappingExposure = 1.2

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(palette.deepVoid)
  scene.fog = new THREE.FogExp2(palette.deepVoid, 0.012)

  const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 500)
  camera.position.set(0, 8, 0)

  // Bloom
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.5, 0.4, 0.2)
  composer.addPass(bloom)

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(400, 600)
  const groundMat = new THREE.MeshBasicMaterial({ color: '#050010' })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0
  ground.position.z = -200
  scene.add(ground)

  // Building chunks
  const chunks = []
  const geoCache = new Map()
  const matCache = new THREE.MeshBasicMaterial({ color: '#0d0520' })

  function getBoxGeo(w, h, d) {
    const key = `${w},${h},${d}`
    if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(w, h, d))
    return geoCache.get(key)
  }

  function createChunk(zOffset) {
    const group = new THREE.Group()
    group.position.z = zOffset

    // Place buildings on both sides of the street
    for (let side = -1; side <= 1; side += 2) {
      for (let row = 0; row < ROWS_PER_CHUNK; row++) {
        for (let col = 0; col < COLS_PER_SIDE; col++) {
          const bw = 4 + Math.random() * 5
          const bh = 5 + Math.random() * 35
          const bd = 4 + Math.random() * 5
          const x = side * (STREET_HALF_WIDTH + col * COL_SPACING + bw / 2) + (Math.random() - 0.5) * 2
          const z = -row * ROW_SPACING + (Math.random() - 0.5) * 4

          const mesh = new THREE.Mesh(getBoxGeo(bw, bh, bd), matCache)
          mesh.position.set(x, bh / 2, z)
          group.add(mesh)

          if (Math.random() > 0.4) {
            const edgeGeo = new THREE.EdgesGeometry(getBoxGeo(bw + 0.1, bh + 0.1, bd + 0.1))
            const edgeColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
            const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor })
            const lines = new THREE.LineSegments(edgeGeo, edgeMat)
            lines.position.copy(mesh.position)
            group.add(lines)
          }

          // Window lights face inward toward the street
          if (bh > 15 && Math.random() > 0.5) {
            const winColor = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
            const winMat = new THREE.MeshBasicMaterial({ color: winColor })
            const winCount = Math.floor(2 + Math.random() * 4)
            for (let j = 0; j < winCount; j++) {
              const ww = 0.8 + Math.random() * 1.5
              const wh = 0.5 + Math.random() * 1
              const win = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), winMat)
              win.position.set(
                x - side * (bw / 2 + 0.05),
                3 + Math.random() * (bh - 6),
                z + (Math.random() - 0.5) * bd * 0.6
              )
              win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
              group.add(win)
            }
          }
        }
      }
    }

    scene.add(group)
    return { group, z: zOffset }
  }

  for (let i = 0; i < CHUNK_COUNT; i++) {
    chunks.push(createChunk(-i * CHUNK_DEPTH))
  }

  let cameraZ = 0
  let contextLost = false

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    contextLost = true
  }, false)

  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false
  }, false)

  return {
    animate(dt, elapsed) {
      if (contextLost) return

      // Camera drift
      cameraZ -= 15 * dt
      camera.position.z = cameraZ
      camera.position.y = 8 + Math.sin(elapsed * 0.3) * 1.5
      camera.position.x = Math.sin(elapsed * 0.15) * 2
      camera.lookAt(camera.position.x * 0.3, 6, cameraZ - 40)

      // Recycle chunks that fall behind camera
      for (const chunk of chunks) {
        if (chunk.group.position.z > cameraZ + CHUNK_DEPTH) {
          const farthest = Math.min(...chunks.map(c => c.group.position.z))
          chunk.group.position.z = farthest - CHUNK_DEPTH
          chunk.z = chunk.group.position.z
        }
      }

      composer.render()
    },

    resize(newW, newH) {
      renderer.setSize(newW, newH)
      composer.setSize(newW, newH)
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
    },

    destroy() {
      // Dispose all geometries and materials
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      geoCache.clear()
      composer.dispose()
      renderer.dispose()
    },
  }
}
