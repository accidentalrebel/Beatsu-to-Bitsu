import { palette } from '../palette.js'

export const name = 'fireflies'

const FIREFLY_COUNT = 40
const TREE_COUNT = 14

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  const trees = Array.from({ length: TREE_COUNT }, () => ({
    x: Math.random(),
    height: 0.25 + Math.random() * 0.4,
    width: 0.03 + Math.random() * 0.04,
    layer: Math.random() < 0.4 ? 0 : 1,
  })).sort((a, b) => a.layer - b.layer)

  const fireflies = Array.from({ length: FIREFLY_COUNT }, () => ({
    x: Math.random(),
    y: 0.25 + Math.random() * 0.55,
    r: 2 + Math.random() * 3,
    phase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.5 + Math.random() * 1.5,
    driftX: (Math.random() - 0.5) * 0.015,
    driftY: (Math.random() - 0.5) * 0.008,
    wobbleAmpX: 0.005 + Math.random() * 0.015,
    wobbleAmpY: 0.003 + Math.random() * 0.01,
    wobbleSpeedX: 0.3 + Math.random() * 0.5,
    wobbleSpeedY: 0.2 + Math.random() * 0.4,
  }))

  const fogParticles = Array.from({ length: 25 }, () => ({
    x: Math.random(),
    y: 0.72 + Math.random() * 0.15,
    width: 0.1 + Math.random() * 0.2,
    speed: 0.003 + Math.random() * 0.006,
    opacity: 0.04 + Math.random() * 0.08,
  }))

  // Deterministic star positions
  const starSeeds = Array.from({ length: 50 }, (_, i) => ({
    x: ((i * 137.508) % 997) / 997,
    y: ((i * 73.137) % 499) / 499 * 0.3,
    speedIdx: i % 5,
  }))

  return {
    animate(dt, elapsed) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
      skyGrad.addColorStop(0, '#050a14')
      skyGrad.addColorStop(0.35, '#0a1520')
      skyGrad.addColorStop(0.65, '#0e1f15')
      skyGrad.addColorStop(1, '#071a0a')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Faint stars
      for (const s of starSeeds) {
        const twinkle = 0.3 + 0.7 * Math.sin(elapsed * (0.5 + s.speedIdx * 0.3) + s.x * 100)
        ctx.fillStyle = `rgba(200, 210, 220, ${twinkle * 0.35})`
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, 1 * devicePixelRatio, 0, Math.PI * 2)
        ctx.fill()
      }

      // Moonlight filtering through canopy
      const moonGlow = ctx.createRadialGradient(w * 0.7, h * 0.15, 0, w * 0.7, h * 0.15, w * 0.3)
      moonGlow.addColorStop(0, 'rgba(140, 160, 180, 0.04)')
      moonGlow.addColorStop(1, 'rgba(140, 160, 180, 0)')
      ctx.fillStyle = moonGlow
      ctx.fillRect(0, 0, w, h)

      // Back trees
      for (const t of trees) {
        if (t.layer !== 0) continue
        drawPine(ctx, t.x * w, h - h * 0.13, t.height * h, t.width * w, '#0a1f10')
      }

      // Fireflies
      for (const f of fireflies) {
        f.x += f.driftX * dt + Math.sin(elapsed * f.wobbleSpeedX + f.phase) * f.wobbleAmpX * dt
        f.y += f.driftY * dt + Math.cos(elapsed * f.wobbleSpeedY + f.phase) * f.wobbleAmpY * dt

        if (f.x < -0.05) f.x = 1.05
        if (f.x > 1.05) f.x = -0.05
        if (f.y < 0.15) f.y = 0.82
        if (f.y > 0.88) f.y = 0.2

        const pulse = Math.max(0, Math.sin(elapsed * f.pulseSpeed + f.phase))
        const px = f.x * w
        const py = f.y * h
        const glowR = f.r * devicePixelRatio

        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR * 8)
        glow.addColorStop(0, `rgba(255, 230, 100, ${pulse * 0.2})`)
        glow.addColorStop(0.4, `rgba(200, 255, 100, ${pulse * 0.06})`)
        glow.addColorStop(1, 'rgba(200, 255, 100, 0)')
        ctx.fillStyle = glow
        ctx.fillRect(px - glowR * 8, py - glowR * 8, glowR * 16, glowR * 16)

        ctx.beginPath()
        ctx.arc(px, py, glowR * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 240, 130, ${pulse * 0.9})`
        ctx.fill()
      }

      // Front trees
      for (const t of trees) {
        if (t.layer !== 1) continue
        drawPine(ctx, t.x * w, h - h * 0.06, t.height * h * 1.2, t.width * w * 1.3, '#040d06')
      }

      // Ground fog
      for (const fp of fogParticles) {
        fp.x += fp.speed * dt
        if (fp.x > 1.3) fp.x = -0.3

        const fogGrad = ctx.createRadialGradient(
          fp.x * w, fp.y * h, 0,
          fp.x * w, fp.y * h, fp.width * w
        )
        fogGrad.addColorStop(0, `rgba(140, 170, 150, ${fp.opacity})`)
        fogGrad.addColorStop(1, 'rgba(140, 170, 150, 0)')
        ctx.fillStyle = fogGrad
        ctx.fillRect(
          fp.x * w - fp.width * w, fp.y * h - fp.width * w * 0.3,
          fp.width * w * 2, fp.width * w * 0.6
        )
      }

      // Bottom vignette
      const vig = ctx.createLinearGradient(0, h * 0.78, 0, h)
      vig.addColorStop(0, 'rgba(5, 10, 5, 0)')
      vig.addColorStop(1, 'rgba(5, 10, 5, 0.7)')
      ctx.fillStyle = vig
      ctx.fillRect(0, h * 0.7, w, h * 0.3)
    },

    resize(newW, newH) {
      w = newW * devicePixelRatio
      h = newH * devicePixelRatio
      canvas.width = w
      canvas.height = h
    },

    destroy() {},
  }
}

function drawPine(ctx, x, baseY, height, maxWidth, color) {
  ctx.fillStyle = color
  ctx.fillRect(x - maxWidth * 0.12, baseY - height * 0.05, maxWidth * 0.24, height * 0.05)
  for (let i = 0; i < 4; i++) {
    const layerBase = baseY - height * (i * 0.2)
    const layerTop = baseY - height * ((i + 1) * 0.22 + 0.05)
    const layerWidth = maxWidth * (1.1 - i * 0.2)
    ctx.beginPath()
    ctx.moveTo(x, layerTop)
    ctx.lineTo(x - layerWidth, layerBase)
    ctx.lineTo(x + layerWidth, layerBase)
    ctx.closePath()
    ctx.fill()
  }
}
