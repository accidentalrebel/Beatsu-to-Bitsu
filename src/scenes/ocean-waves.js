export const name = 'ocean waves'

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.35,
    r: 0.3 + Math.random() * 1.2,
    brightness: 0.3 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
  }))

  const moonX = 0.3 + Math.random() * 0.4
  const moonY = 0.08 + Math.random() * 0.08
  const moonR = 15 + Math.random() * 10

  const waveLayers = [
    { y: 0.45, amp: 8,  freq: 0.8, speed: 0.3,  color: '#0a2040' },
    { y: 0.51, amp: 10, freq: 1.0, speed: 0.4,  color: '#0d2850' },
    { y: 0.57, amp: 12, freq: 1.2, speed: 0.55, color: '#103060' },
    { y: 0.63, amp: 14, freq: 1.0, speed: 0.65, color: '#0f2848' },
    { y: 0.70, amp: 16, freq: 1.4, speed: 0.8,  color: '#0c2040' },
    { y: 0.77, amp: 12, freq: 1.6, speed: 0.9,  color: '#0a1830' },
    { y: 0.85, amp: 10, freq: 1.8, speed: 1.0,  color: '#081428' },
  ]

  const lighthouseX = 0.85
  let beamPhase = 0

  return {
    animate(dt, elapsed) {
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5)
      skyGrad.addColorStop(0, '#040810')
      skyGrad.addColorStop(0.6, '#0a1828')
      skyGrad.addColorStop(1, '#0d2040')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Stars
      for (const s of stars) {
        const twinkle = s.brightness * (0.5 + 0.5 * Math.sin(elapsed * 0.8 + s.phase))
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r * devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 215, 240, ${twinkle})`
        ctx.fill()
      }

      // Moon
      const mx = moonX * w
      const my = moonY * h
      const mr = moonR * devicePixelRatio

      const mGlow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5)
      mGlow.addColorStop(0, 'rgba(200, 210, 240, 0.12)')
      mGlow.addColorStop(1, 'rgba(200, 210, 240, 0)')
      ctx.fillStyle = mGlow
      ctx.fillRect(mx - mr * 6, my - mr * 6, mr * 12, mr * 12)

      ctx.beginPath()
      ctx.arc(mx, my, mr, 0, Math.PI * 2)
      ctx.fillStyle = '#d8d0e8'
      ctx.fill()

      // Moon reflection shimmer column
      const reflTop = 0.46 * h
      for (let ry = reflTop; ry < h; ry += 4 * devicePixelRatio) {
        const shimmer = Math.sin(ry * 0.05 + elapsed * 2) * 10 * devicePixelRatio
        const dist = (ry - reflTop) / (h - reflTop)
        const alpha = 0.12 * (1 - dist * 0.7) * (0.6 + 0.4 * Math.sin(elapsed * 1.5 + ry * 0.03))
        const rw = (3 + dist * 20) * devicePixelRatio
        ctx.fillStyle = `rgba(200, 210, 240, ${alpha})`
        ctx.fillRect(mx + shimmer - rw / 2, ry, rw, 3 * devicePixelRatio)
      }

      // Wave layers
      for (const layer of waveLayers) {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let px = 0; px <= w; px += 2) {
          const t = px / w
          const w1 = Math.sin(t * layer.freq * Math.PI * 6 + elapsed * layer.speed) * layer.amp * devicePixelRatio
          const w2 = Math.sin(t * layer.freq * Math.PI * 3 + elapsed * layer.speed * 0.7 + 1.5) * layer.amp * 0.5 * devicePixelRatio
          ctx.lineTo(px, layer.y * h + w1 + w2)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fillStyle = layer.color
        ctx.fill()

        // Foam highlights on crests
        ctx.strokeStyle = 'rgba(180, 200, 220, 0.06)'
        ctx.lineWidth = 1 * devicePixelRatio
        ctx.beginPath()
        let inCrest = false
        for (let px = 0; px <= w; px += 3) {
          const t = px / w
          const w1 = Math.sin(t * layer.freq * Math.PI * 6 + elapsed * layer.speed) * layer.amp * devicePixelRatio
          const w1n = Math.sin((t + 0.01) * layer.freq * Math.PI * 6 + elapsed * layer.speed) * layer.amp * devicePixelRatio
          const y = layer.y * h + w1
          if (w1 < w1n && !inCrest) {
            ctx.moveTo(px, y)
            inCrest = true
          } else if (inCrest && w1 >= w1n) {
            inCrest = false
          } else if (inCrest) {
            ctx.lineTo(px, y)
          }
        }
        ctx.stroke()
      }

      // Lighthouse silhouette
      const lhX = lighthouseX * w
      const lhBaseY = 0.44 * h
      const lhW = 6 * devicePixelRatio
      const lhH = 35 * devicePixelRatio

      ctx.fillStyle = '#060606'
      ctx.beginPath()
      ctx.moveTo(lhX - lhW, lhBaseY)
      ctx.lineTo(lhX - lhW * 0.6, lhBaseY - lhH)
      ctx.lineTo(lhX + lhW * 0.6, lhBaseY - lhH)
      ctx.lineTo(lhX + lhW, lhBaseY)
      ctx.closePath()
      ctx.fill()

      ctx.fillRect(lhX - lhW * 0.8, lhBaseY - lhH - 5 * devicePixelRatio, lhW * 1.6, 5 * devicePixelRatio)

      // Lighthouse beam
      beamPhase += dt * 0.8
      const beamAngle = Math.sin(beamPhase) * 0.6 - 0.3
      const beamOriginX = lhX
      const beamOriginY = lhBaseY - lhH - 2 * devicePixelRatio
      const beamLen = 300 * devicePixelRatio

      ctx.save()
      ctx.translate(beamOriginX, beamOriginY)
      ctx.rotate(beamAngle)
      const beamGrad = ctx.createLinearGradient(0, 0, -beamLen, 0)
      beamGrad.addColorStop(0, 'rgba(255, 250, 200, 0.22)')
      beamGrad.addColorStop(0.3, 'rgba(255, 250, 200, 0.05)')
      beamGrad.addColorStop(1, 'rgba(255, 250, 200, 0)')
      ctx.fillStyle = beamGrad
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-beamLen, -beamLen * 0.15)
      ctx.lineTo(-beamLen, beamLen * 0.15)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // Lamp glow
      const lampGlow = ctx.createRadialGradient(beamOriginX, beamOriginY, 0, beamOriginX, beamOriginY, 15 * devicePixelRatio)
      lampGlow.addColorStop(0, 'rgba(255, 250, 200, 0.5)')
      lampGlow.addColorStop(1, 'rgba(255, 250, 200, 0)')
      ctx.fillStyle = lampGlow
      ctx.fillRect(beamOriginX - 20 * devicePixelRatio, beamOriginY - 20 * devicePixelRatio, 40 * devicePixelRatio, 40 * devicePixelRatio)

      // Bottom dark
      const bottomGrad = ctx.createLinearGradient(0, h * 0.88, 0, h)
      bottomGrad.addColorStop(0, 'rgba(4, 8, 16, 0)')
      bottomGrad.addColorStop(1, 'rgba(4, 8, 16, 0.5)')
      ctx.fillStyle = bottomGrad
      ctx.fillRect(0, h * 0.8, w, h * 0.2)
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
