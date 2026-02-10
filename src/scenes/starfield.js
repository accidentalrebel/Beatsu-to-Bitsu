import { palette } from '../palette.js'

export const name = 'starfield'

const STAR_COUNT = 300
const SHOOTING_MIN_INTERVAL = 10
const SHOOTING_MAX_INTERVAL = 20

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  // Stars
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random(),
    y: Math.random() * 0.55,
    r: 0.5 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 2,
    brightness: 0.4 + Math.random() * 0.6,
  }))

  // Mountain ranges via midpoint displacement
  function generateMountain(segments, roughness, baseY, peakY) {
    const points = new Float32Array(segments + 1)
    points[0] = baseY
    points[segments] = baseY

    let step = segments
    let scale = roughness
    while (step > 1) {
      const half = step / 2
      for (let i = half; i < segments; i += step) {
        const avg = (points[i - half] + points[i + half]) / 2
        points[i] = avg + (Math.random() - 0.5) * scale
      }
      step = half
      scale *= 0.5
    }

    // Normalize to peakY range
    let min = Infinity
    for (let i = 0; i < points.length; i++) if (points[i] < min) min = points[i]
    for (let i = 0; i < points.length; i++) {
      points[i] = baseY - (points[i] - min) * peakY
    }
    return points
  }

  const backMtn = generateMountain(256, 1.0, 0.75, 0.25)
  const frontMtn = generateMountain(256, 0.8, 0.85, 0.2)

  // Moon
  const moonX = 0.75 + Math.random() * 0.15
  const moonY = 0.12 + Math.random() * 0.1
  const moonR = 20 + Math.random() * 15

  // Shooting stars
  let nextShootAt = SHOOTING_MIN_INTERVAL + Math.random() * (SHOOTING_MAX_INTERVAL - SHOOTING_MIN_INTERVAL)
  let shootingStar = null

  // Parallax offset
  let panOffset = 0

  return {
    animate(dt, elapsed) {
      panOffset += dt

      // Layer 1: sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75)
      skyGrad.addColorStop(0, '#0a0a2e')
      skyGrad.addColorStop(0.5, palette.nightPurple)
      skyGrad.addColorStop(1, palette.midPurple)
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Layer 2: stars
      for (const s of stars) {
        const twinkle = s.brightness * (0.5 + 0.5 * Math.sin(elapsed * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r * devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(232, 224, 240, ${twinkle})`
        ctx.fill()
      }

      // Layer 3: shooting star
      nextShootAt -= dt
      if (nextShootAt <= 0 && !shootingStar) {
        shootingStar = {
          x: Math.random() * 0.6 * w,
          y: Math.random() * 0.3 * h,
          vx: (300 + Math.random() * 200) * devicePixelRatio,
          vy: (100 + Math.random() * 100) * devicePixelRatio,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.5,
        }
        nextShootAt = SHOOTING_MIN_INTERVAL + Math.random() * (SHOOTING_MAX_INTERVAL - SHOOTING_MIN_INTERVAL)
      }

      if (shootingStar) {
        const ss = shootingStar
        ss.life += dt
        ss.x += ss.vx * dt
        ss.y += ss.vy * dt

        const progress = ss.life / ss.maxLife
        const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7

        const tailLen = 60 * devicePixelRatio
        const grad = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - tailLen * (ss.vx / Math.abs(ss.vx)),
          ss.y - tailLen * (ss.vy / Math.abs(ss.vy))
        )
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`)
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`)

        ctx.beginPath()
        ctx.moveTo(ss.x, ss.y)
        ctx.lineTo(
          ss.x - tailLen * (ss.vx / Math.abs(ss.vx)),
          ss.y - tailLen * (ss.vy / Math.abs(ss.vy))
        )
        ctx.strokeStyle = grad
        ctx.lineWidth = 2 * devicePixelRatio
        ctx.lineCap = 'round'
        ctx.stroke()

        if (ss.life >= ss.maxLife) shootingStar = null
      }

      // Layer 4: moon
      const mx = moonX * w
      const my = moonY * h
      const mr = moonR * devicePixelRatio

      // Outer glow
      const moonGlow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4)
      moonGlow.addColorStop(0, 'rgba(212, 197, 232, 0.15)')
      moonGlow.addColorStop(1, 'rgba(212, 197, 232, 0)')
      ctx.fillStyle = moonGlow
      ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10)

      // Moon body
      ctx.beginPath()
      ctx.arc(mx, my, mr, 0, Math.PI * 2)
      ctx.fillStyle = palette.moonGlow
      ctx.fill()

      // Inner gradient for depth
      const innerGlow = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr)
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
      innerGlow.addColorStop(1, 'rgba(212, 197, 232, 0)')
      ctx.fillStyle = innerGlow
      ctx.fill()

      // Layer 5: back mountains
      drawMountain(ctx, backMtn, w, h, palette.mountainMid, panOffset * 2, 0.85)

      // Layer 6: front mountains
      drawMountain(ctx, frontMtn, w, h, palette.mountainDark, panOffset * 5, 0.95)

      // Layer 7: foreground haze
      const hazeGrad = ctx.createLinearGradient(0, h * 0.75, 0, h)
      hazeGrad.addColorStop(0, 'rgba(30, 15, 60, 0)')
      hazeGrad.addColorStop(1, 'rgba(30, 15, 60, 0.8)')
      ctx.fillStyle = hazeGrad
      ctx.fillRect(0, h * 0.6, w, h * 0.4)
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

function drawMountain(ctx, points, w, h, color, scrollOffset, baseYFrac) {
  const len = points.length
  const pixelsPerSeg = w / (len * 0.6)
  const offset = (scrollOffset * devicePixelRatio) % (len * pixelsPerSeg)

  ctx.beginPath()
  ctx.moveTo(0, h)

  for (let px = 0; px <= w; px += 2) {
    const idx = ((px + offset) / pixelsPerSeg) % len
    const i0 = Math.floor(idx) % len
    const i1 = (i0 + 1) % len
    const t = idx - Math.floor(idx)
    const y = points[i0] * (1 - t) + points[i1] * t
    ctx.lineTo(px, y * h)
  }

  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}
