export const name = 'koi pond'

const KOI_COUNT = 7
const LILY_PAD_COUNT = 8

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  const koiColors = ['#ff6b35', '#c9302c', '#f0ede8', '#ffaa55', '#e88040', '#cc4444', '#f5f0e0']

  const koi = Array.from({ length: KOI_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    angle: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.03,
    targetAngle: Math.random() * Math.PI * 2,
    turnTimer: 2 + Math.random() * 5,
    size: 14 + Math.random() * 14,
    color: koiColors[Math.floor(Math.random() * koiColors.length)],
    tailPhase: Math.random() * Math.PI * 2,
    tailSpeed: 3 + Math.random() * 2,
    depth: 0.4 + Math.random() * 0.6,
  }))

  const pads = Array.from({ length: LILY_PAD_COUNT }, () => ({
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.8,
    r: 14 + Math.random() * 18,
    rotation: Math.random() * Math.PI * 2,
    hasFlower: Math.random() > 0.55,
    flowerColor: Math.random() > 0.5 ? '#e890a0' : '#f0f0e0',
  }))

  const ripples = []
  let nextRipple = 1.5

  // Caustic seed positions
  const causticSeeds = Array.from({ length: 15 }, (_, i) => ({
    phaseX: i * 1.3,
    phaseY: i * 1.7,
  }))

  return {
    animate(dt, elapsed) {
      // Dark water background
      const waterGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7)
      waterGrad.addColorStop(0, '#0c2a1a')
      waterGrad.addColorStop(0.5, '#081f15')
      waterGrad.addColorStop(1, '#051510')
      ctx.fillStyle = waterGrad
      ctx.fillRect(0, 0, w, h)

      // Water caustics
      for (const c of causticSeeds) {
        const cx = (Math.sin(elapsed * 0.2 + c.phaseX) * 0.3 + 0.5) * w
        const cy = (Math.cos(elapsed * 0.15 + c.phaseY) * 0.3 + 0.5) * h
        const cr = (40 + Math.sin(elapsed * 0.5 + c.phaseX) * 20) * devicePixelRatio
        const caustic = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr)
        caustic.addColorStop(0, `rgba(30, 80, 50, ${0.06 + 0.03 * Math.sin(elapsed * 0.3 + c.phaseX)})`)
        caustic.addColorStop(1, 'rgba(30, 80, 50, 0)')
        ctx.fillStyle = caustic
        ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2)
      }

      // Ripples
      nextRipple -= dt
      if (nextRipple <= 0) {
        ripples.push({
          x: Math.random(), y: Math.random(),
          r: 0, maxR: 30 + Math.random() * 40,
          speed: 20 + Math.random() * 15,
          life: 0, maxLife: 2.5 + Math.random(),
        })
        nextRipple = 0.8 + Math.random() * 2
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i]
        rip.life += dt
        rip.r += rip.speed * dt * devicePixelRatio
        const alpha = 0.15 * (1 - rip.life / rip.maxLife)
        if (alpha <= 0) { ripples.splice(i, 1); continue }

        ctx.beginPath()
        ctx.arc(rip.x * w, rip.y * h, rip.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(100, 160, 120, ${alpha})`
        ctx.lineWidth = 1.5 * devicePixelRatio
        ctx.stroke()

        if (rip.r > 10) {
          ctx.beginPath()
          ctx.arc(rip.x * w, rip.y * h, rip.r * 0.6, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(100, 160, 120, ${alpha * 0.5})`
          ctx.stroke()
        }
      }

      // Koi fish (deeper first)
      const sortedKoi = [...koi].sort((a, b) => a.depth - b.depth)

      for (const k of sortedKoi) {
        k.turnTimer -= dt
        if (k.turnTimer <= 0) {
          k.targetAngle = k.angle + (Math.random() - 0.5) * Math.PI * 1.5
          k.turnTimer = 3 + Math.random() * 6
        }

        let diff = k.targetAngle - k.angle
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        k.angle += diff * dt * 0.8

        k.x += Math.cos(k.angle) * k.speed * dt
        k.y += Math.sin(k.angle) * k.speed * dt

        if (k.x < -0.1) k.x = 1.1
        if (k.x > 1.1) k.x = -0.1
        if (k.y < -0.1) k.y = 1.1
        if (k.y > 1.1) k.y = -0.1

        const px = k.x * w
        const py = k.y * h
        const size = k.size * devicePixelRatio * (0.7 + k.depth * 0.3)
        const tailWag = Math.sin(elapsed * k.tailSpeed + k.tailPhase) * 0.3
        const fishAlpha = 0.35 + k.depth * 0.55

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(k.angle)

        // Shadow
        ctx.save()
        ctx.translate(3 * devicePixelRatio, 3 * devicePixelRatio)
        ctx.fillStyle = `rgba(0, 10, 5, ${fishAlpha * 0.18})`
        ctx.beginPath()
        ctx.ellipse(0, 0, size, size * 0.38, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Body
        ctx.globalAlpha = fishAlpha
        ctx.fillStyle = k.color
        ctx.beginPath()
        ctx.ellipse(0, 0, size, size * 0.35, 0, 0, Math.PI * 2)
        ctx.fill()

        // Head
        ctx.beginPath()
        ctx.ellipse(size * 0.6, 0, size * 0.28, size * 0.22, 0, 0, Math.PI * 2)
        ctx.fill()

        // Tail
        ctx.save()
        ctx.translate(-size * 0.85, 0)
        ctx.rotate(tailWag)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-size * 0.5, -size * 0.3)
        ctx.quadraticCurveTo(-size * 0.3, 0, -size * 0.5, size * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // White spots on colored fish
        if (k.color !== '#f0ede8' && k.color !== '#f5f0e0') {
          ctx.fillStyle = '#f0ede8'
          ctx.globalAlpha = fishAlpha * 0.5
          for (let s = 0; s < 3; s++) {
            const sx = (s - 1) * size * 0.3
            const sy = ((s * 31 + 7) % 11 - 5) / 5 * size * 0.12
            ctx.beginPath()
            ctx.ellipse(sx, sy, size * 0.1, size * 0.07, s * 0.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        ctx.globalAlpha = 1
        ctx.restore()
      }

      // Lily pads
      for (const pad of pads) {
        const px = pad.x * w
        const py = pad.y * h
        const pr = pad.r * devicePixelRatio

        // Shadow
        ctx.fillStyle = 'rgba(0, 10, 5, 0.12)'
        ctx.beginPath()
        ctx.arc(px + 2 * devicePixelRatio, py + 2 * devicePixelRatio, pr, 0, Math.PI * 2)
        ctx.fill()

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(pad.rotation)

        // Pad with notch
        ctx.fillStyle = '#1a4a28'
        ctx.beginPath()
        ctx.arc(0, 0, pr, 0.12, Math.PI * 2 - 0.12)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.fill()

        // Veins
        ctx.strokeStyle = 'rgba(40, 100, 50, 0.25)'
        ctx.lineWidth = 0.5 * devicePixelRatio
        for (let v = 0; v < 6; v++) {
          const va = (v / 6) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(va) * pr * 0.85, Math.sin(va) * pr * 0.85)
          ctx.stroke()
        }

        // Flower
        if (pad.hasFlower) {
          const fx = pr * 0.3
          const fy = -pr * 0.2
          ctx.fillStyle = pad.flowerColor
          for (let p = 0; p < 5; p++) {
            const pa = (p / 5) * Math.PI * 2 + elapsed * 0.04
            ctx.beginPath()
            ctx.ellipse(
              fx + Math.cos(pa) * pr * 0.18,
              fy + Math.sin(pa) * pr * 0.18,
              pr * 0.1, pr * 0.05, pa, 0, Math.PI * 2
            )
            ctx.fill()
          }
          ctx.fillStyle = '#f5d060'
          ctx.beginPath()
          ctx.arc(fx, fy, pr * 0.05, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      // Surface shimmer
      ctx.fillStyle = `rgba(80, 140, 110, ${0.02 + 0.008 * Math.sin(elapsed * 0.4)})`
      ctx.fillRect(0, 0, w, h)

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7)
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vig.addColorStop(1, 'rgba(0, 12, 6, 0.5)')
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
