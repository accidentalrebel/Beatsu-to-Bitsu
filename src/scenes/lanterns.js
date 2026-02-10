export const name = 'lantern festival'

const LANTERN_COUNT = 28

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  const colorSets = [
    { body: '#ff8c42', glow: '255, 140, 66' },
    { body: '#ffc857', glow: '255, 200, 87' },
    { body: '#ff5e3a', glow: '255, 94, 58' },
    { body: '#ffaa55', glow: '255, 170, 85' },
    { body: '#e8c050', glow: '232, 192, 80' },
  ]

  function makeLantern(randomY) {
    const color = colorSets[Math.floor(Math.random() * colorSets.length)]
    return {
      x: 0.05 + Math.random() * 0.9,
      y: randomY ? Math.random() : 1.05 + Math.random() * 0.3,
      size: 12 + Math.random() * 18,
      riseSpeed: 15 + Math.random() * 25,
      swayAmp: 0.01 + Math.random() * 0.025,
      swaySpeed: 0.3 + Math.random() * 0.5,
      swayPhase: Math.random() * Math.PI * 2,
      flickerPhase: Math.random() * Math.PI * 2,
      flickerSpeed: 3 + Math.random() * 5,
      color,
      opacity: 0.6 + Math.random() * 0.4,
      depth: Math.random(),
    }
  }

  const lanterns = Array.from({ length: LANTERN_COUNT }, () => makeLantern(true))

  const trees = Array.from({ length: 12 }, () => ({
    x: Math.random(),
    height: 0.08 + Math.random() * 0.18,
    width: 0.02 + Math.random() * 0.025,
    type: Math.random() < 0.5 ? 'round' : 'pine',
  }))

  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.4,
    r: 0.3 + Math.random() * 1,
    phase: Math.random() * Math.PI * 2,
  }))

  return {
    animate(dt, elapsed) {
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
      skyGrad.addColorStop(0, '#080620')
      skyGrad.addColorStop(0.3, '#130c30')
      skyGrad.addColorStop(0.7, '#180e38')
      skyGrad.addColorStop(1, '#0d0820')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Stars
      for (const s of stars) {
        const twinkle = 0.3 + 0.7 * Math.sin(elapsed * 0.8 + s.phase)
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r * devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(230, 220, 250, ${twinkle * 0.4})`
        ctx.fill()
      }

      // Warm ambient glow from all lanterns
      const ambientGlow = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6)
      ambientGlow.addColorStop(0, `rgba(255, 160, 60, ${0.025 + 0.01 * Math.sin(elapsed * 0.5)})`)
      ambientGlow.addColorStop(1, 'rgba(255, 160, 60, 0)')
      ctx.fillStyle = ambientGlow
      ctx.fillRect(0, 0, w, h)

      // Sort by depth (far = small+dim drawn first)
      const sorted = [...lanterns].sort((a, b) => a.depth - b.depth)

      for (const l of sorted) {
        l.y -= (l.riseSpeed * dt) / h
        l.x += Math.sin(elapsed * l.swaySpeed + l.swayPhase) * l.swayAmp * dt

        if (l.y < -0.2) Object.assign(l, makeLantern(false))

        const px = l.x * w
        const py = l.y * h
        const size = l.size * devicePixelRatio * (0.5 + l.depth * 0.5)
        const flicker = 0.8 + 0.2 * Math.sin(elapsed * l.flickerSpeed + l.flickerPhase)
        const alpha = l.opacity * flicker * (l.depth * 0.4 + 0.6)
        const gl = l.color.glow

        // Outer glow
        const glowR = size * 4
        const glow = ctx.createRadialGradient(px, py, size * 0.3, px, py, glowR)
        glow.addColorStop(0, `rgba(${gl}, ${alpha * 0.18})`)
        glow.addColorStop(0.5, `rgba(${gl}, ${alpha * 0.04})`)
        glow.addColorStop(1, `rgba(${gl}, 0)`)
        ctx.fillStyle = glow
        ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2)

        // Lantern body
        const lw = size * 0.7
        const lh = size * 1.1
        ctx.beginPath()
        roundRect(ctx, px - lw / 2, py - lh / 2, lw, lh, size * 0.12)
        ctx.fillStyle = `rgba(35, 18, 8, ${alpha * 0.5})`
        ctx.fill()
        ctx.strokeStyle = `rgba(${gl}, ${alpha * 0.35})`
        ctx.lineWidth = 1 * devicePixelRatio
        ctx.stroke()

        // Inner glow
        const inner = ctx.createRadialGradient(px, py, 0, px, py, size * 0.55)
        inner.addColorStop(0, `rgba(${gl}, ${alpha * 0.6})`)
        inner.addColorStop(1, `rgba(${gl}, ${alpha * 0.08})`)
        ctx.fillStyle = inner
        ctx.beginPath()
        roundRect(ctx, px - lw / 2, py - lh / 2, lw, lh, size * 0.12)
        ctx.fill()

        // Dangling string
        const stringEnd = py + lh / 2 + size * 0.4
        const stringSwing = Math.sin(elapsed * l.swaySpeed * 2 + l.swayPhase) * size * 0.15
        ctx.beginPath()
        ctx.moveTo(px, py + lh / 2)
        ctx.quadraticCurveTo(px + stringSwing * 0.5, py + lh / 2 + size * 0.2, px + stringSwing, stringEnd)
        ctx.strokeStyle = `rgba(200, 180, 150, ${alpha * 0.25})`
        ctx.lineWidth = 0.5 * devicePixelRatio
        ctx.stroke()
      }

      // Tree silhouettes
      for (const t of trees) {
        const tx = t.x * w
        if (t.type === 'round') {
          ctx.fillStyle = '#050310'
          const crownR = t.width * w * 1.5
          ctx.beginPath()
          ctx.arc(tx, h - t.height * h * 0.5 - h * 0.03, crownR, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillRect(tx - t.width * w * 0.15, h - t.height * h * 0.35, t.width * w * 0.3, t.height * h * 0.35)
        } else {
          drawPine(ctx, tx, h, t.height * h, t.width * w)
        }
      }

      // Ground
      const groundGrad = ctx.createLinearGradient(0, h - h * 0.07, 0, h)
      groundGrad.addColorStop(0, '#050310')
      groundGrad.addColorStop(1, '#030208')
      ctx.fillStyle = groundGrad
      ctx.fillRect(0, h - h * 0.05, w, h * 0.05)
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

function drawPine(ctx, x, baseY, height, maxWidth) {
  ctx.fillStyle = '#050310'
  ctx.fillRect(x - maxWidth * 0.1, baseY - height * 0.12, maxWidth * 0.2, height * 0.12)
  for (let i = 0; i < 3; i++) {
    const layerBase = baseY - height * (i * 0.2 + 0.08)
    const layerTop = baseY - height * ((i + 1) * 0.25 + 0.08)
    const layerWidth = maxWidth * (1.2 - i * 0.3)
    ctx.beginPath()
    ctx.moveTo(x, layerTop)
    ctx.lineTo(x - layerWidth, layerBase)
    ctx.lineTo(x + layerWidth, layerBase)
    ctx.closePath()
    ctx.fill()
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
}
