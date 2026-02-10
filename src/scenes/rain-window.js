import { palette } from '../palette.js'

export const name = 'rain on window'

const DROP_COUNT = 200
const LIGHT_COUNT = 20

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  // City lights — warm blurry circles
  const lights = Array.from({ length: LIGHT_COUNT }, () => ({
    x: Math.random(),
    y: 0.2 + Math.random() * 0.5,
    r: 30 + Math.random() * 80,
    color: [palette.cityOrange, palette.cityYellow, palette.cityPink, palette.warmAmber, palette.dustyPink][Math.floor(Math.random() * 5)],
    phase: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.5,
  }))

  // Raindrop pool
  const drops = Array.from({ length: DROP_COUNT }, () => makeDrop(w, h, true))

  function makeDrop(w, h, randomY) {
    const speed = 150 + Math.random() * 350
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -Math.random() * 40,
      speed,
      length: 8 + speed / 30,
      width: 0.5 + Math.random() * 1.5,
      wobbleAmp: Math.random() * 0.8,
      wobbleSpeed: 2 + Math.random() * 3,
      wobblePhase: Math.random() * Math.PI * 2,
      opacity: 0.15 + Math.random() * 0.4,
      trail: speed > 350 ? 0.3 : 0,
    }
  }

  return {
    animate(dt, elapsed) {
      // Background — dark window
      ctx.fillStyle = palette.nightPurple
      ctx.fillRect(0, 0, w, h)

      // Layer 1: blurry city lights
      ctx.save()
      ctx.filter = 'blur(40px)'
      for (const l of lights) {
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * l.speed + l.phase)
        const grad = ctx.createRadialGradient(l.x * w, l.y * h, 0, l.x * w, l.y * h, l.r * devicePixelRatio)
        grad.addColorStop(0, l.color + hex(pulse * 0.6))
        grad.addColorStop(1, l.color + '00')
        ctx.fillStyle = grad
        ctx.fillRect(l.x * w - l.r * 2, l.y * h - l.r * 2, l.r * 4, l.r * 4)
      }
      ctx.restore()

      // Layer 2: glass tint
      ctx.fillStyle = palette.windowTint
      ctx.fillRect(0, 0, w, h)

      // Layer 3: raindrops
      for (const d of drops) {
        d.y += d.speed * dt * devicePixelRatio
        d.wobblePhase += d.wobbleSpeed * dt
        const wobble = Math.sin(d.wobblePhase) * d.wobbleAmp * devicePixelRatio

        // Reset when off-screen
        if (d.y > h + 20) {
          Object.assign(d, makeDrop(w, h, false))
        }

        // Trail
        if (d.trail > 0) {
          ctx.beginPath()
          ctx.moveTo(d.x + wobble, d.y)
          ctx.lineTo(d.x + wobble, d.y - d.length * 3 * devicePixelRatio)
          ctx.strokeStyle = `rgba(180, 200, 255, ${d.trail * 0.1})`
          ctx.lineWidth = d.width * devicePixelRatio * 0.5
          ctx.stroke()
        }

        // Drop body
        ctx.beginPath()
        ctx.moveTo(d.x + wobble, d.y - d.length * devicePixelRatio)
        ctx.lineTo(d.x + wobble, d.y)
        ctx.strokeStyle = `rgba(180, 200, 255, ${d.opacity})`
        ctx.lineWidth = d.width * devicePixelRatio
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      // Layer 4: condensation vignette
      const cx = w / 2, cy = h / 2
      const maxR = Math.sqrt(cx * cx + cy * cy)
      const vig = ctx.createRadialGradient(cx, cy, maxR * 0.3, cx, cy, maxR)
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vig.addColorStop(0.7, 'rgba(10, 5, 30, 0.3)')
      vig.addColorStop(1, 'rgba(10, 5, 30, 0.7)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)
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

function hex(alpha) {
  return Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0')
}
