export const name = 'aurora borealis'

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.45,
    r: 0.3 + Math.random() * 1.2,
    brightness: 0.3 + Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.5,
  }))

  const bands = Array.from({ length: 5 }, (_, i) => ({
    yBase: 0.12 + i * 0.055,
    amplitude: 0.02 + Math.random() * 0.04,
    frequency: 1.5 + Math.random() * 2,
    speed: 0.15 + Math.random() * 0.25,
    phase: Math.random() * Math.PI * 2,
    thickness: 0.04 + Math.random() * 0.07,
    color: i < 2 ? [60, 255, 140] : i < 4 ? [0, 230, 200] : [140, 80, 220],
    intensity: 0.5 + Math.random() * 0.5,
  }))

  const mountainPoints = generateMountain(128, 0.8, 0.72, 0.22)

  const snowflakes = Array.from({ length: 60 }, () => ({
    x: Math.random(),
    y: Math.random(),
    speed: 12 + Math.random() * 20,
    size: 0.5 + Math.random() * 1.5,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 1 + Math.random() * 2,
  }))

  return {
    animate(dt, elapsed) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72)
      skyGrad.addColorStop(0, '#020810')
      skyGrad.addColorStop(0.5, '#0a1225')
      skyGrad.addColorStop(1, '#101830')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      for (const s of stars) {
        const twinkle = s.brightness * (0.5 + 0.5 * Math.sin(elapsed * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r * devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 230, 255, ${twinkle})`
        ctx.fill()
      }

      // Aurora curtain bands
      for (const band of bands) {
        const segs = 100
        const [r, g, b] = band.color

        ctx.beginPath()
        for (let i = 0; i <= segs; i++) {
          const t = i / segs
          const x = t * w
          const wave1 = Math.sin(t * band.frequency * Math.PI * 2 + elapsed * band.speed + band.phase) * band.amplitude
          const wave2 = Math.sin(t * band.frequency * 1.7 * Math.PI * 2 + elapsed * band.speed * 0.7) * band.amplitude * 0.4
          const yTop = (band.yBase + wave1 + wave2) * h
          if (i === 0) ctx.moveTo(x, yTop)
          else ctx.lineTo(x, yTop)
        }
        for (let i = segs; i >= 0; i--) {
          const t = i / segs
          const x = t * w
          const wave1 = Math.sin(t * band.frequency * Math.PI * 2 + elapsed * band.speed + band.phase) * band.amplitude
          const wave2 = Math.sin(t * band.frequency * 1.7 * Math.PI * 2 + elapsed * band.speed * 0.7) * band.amplitude * 0.4
          const curtainLen = band.thickness * (0.8 + 0.4 * Math.sin(t * 8 + elapsed * 0.5))
          const yBot = (band.yBase + wave1 + wave2 + curtainLen) * h
          ctx.lineTo(x, yBot)
        }
        ctx.closePath()

        const localIntensity = band.intensity * (0.5 + 0.5 * Math.sin(elapsed * 0.3 + band.phase))
        const grad = ctx.createLinearGradient(0, band.yBase * h, 0, (band.yBase + band.thickness) * h)
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${localIntensity * 0.12})`)
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${localIntensity * 0.06})`)
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Horizon glow
      const horizonGlow = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.72)
      horizonGlow.addColorStop(0, 'rgba(40, 180, 120, 0)')
      horizonGlow.addColorStop(0.5, `rgba(40, 180, 120, ${0.025 + 0.015 * Math.sin(elapsed * 0.4)})`)
      horizonGlow.addColorStop(1, 'rgba(40, 180, 120, 0)')
      ctx.fillStyle = horizonGlow
      ctx.fillRect(0, h * 0.5, w, h * 0.25)

      // Mountains
      drawMountain(ctx, mountainPoints, w, h, '#0a1020')
      drawSnowCaps(ctx, mountainPoints, w, h)

      // Frozen lake
      const lakeY = 0.73 * h
      const lakeGrad = ctx.createLinearGradient(0, lakeY, 0, h)
      lakeGrad.addColorStop(0, '#0d1825')
      lakeGrad.addColorStop(0.4, '#081018')
      lakeGrad.addColorStop(1, '#050a10')
      ctx.fillStyle = lakeGrad
      ctx.fillRect(0, lakeY, w, h - lakeY)

      // Faint aurora reflection
      ctx.save()
      ctx.globalAlpha = 0.08
      for (const band of bands) {
        const [r, g, b] = band.color
        const reflY = lakeY + (lakeY - band.yBase * h) * 0.15
        const reflH = band.thickness * h * 0.5
        const grad = ctx.createLinearGradient(0, reflY, 0, reflY + reflH)
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`)
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(0, reflY, w, reflH)
      }
      ctx.restore()

      // Ice shimmer lines
      for (let i = 0; i < 8; i++) {
        const lineY = lakeY + (h - lakeY) * (0.1 + i * 0.1)
        const shimmerAlpha = 0.03 + 0.02 * Math.sin(elapsed * 0.5 + i)
        ctx.strokeStyle = `rgba(150, 180, 210, ${shimmerAlpha})`
        ctx.lineWidth = 0.5 * devicePixelRatio
        ctx.beginPath()
        ctx.moveTo(0, lineY)
        for (let px = 0; px <= w; px += 20) {
          ctx.lineTo(px, lineY + Math.sin(px * 0.01 + elapsed * 0.3 + i) * 2 * devicePixelRatio)
        }
        ctx.stroke()
      }

      // Snow
      ctx.fillStyle = 'rgba(220, 230, 250, 0.6)'
      for (const sf of snowflakes) {
        sf.y += sf.speed * dt / h
        sf.x += Math.sin(elapsed * sf.wobbleSpeed + sf.wobble) * 0.0003
        if (sf.y > 1) { sf.y = -0.02; sf.x = Math.random() }

        ctx.beginPath()
        ctx.arc(sf.x * w, sf.y * h, sf.size * devicePixelRatio, 0, Math.PI * 2)
        ctx.fill()
      }
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

function generateMountain(segments, roughness, baseY, peakY) {
  const points = new Float32Array(segments + 1)
  points[0] = baseY
  points[segments] = baseY
  let step = segments
  let scale = roughness
  while (step > 1) {
    const half = step / 2
    for (let i = half; i < segments; i += step) {
      points[i] = (points[i - half] + points[i + half]) / 2 + (Math.random() - 0.5) * scale
    }
    step = half
    scale *= 0.5
  }
  let min = Infinity
  for (let i = 0; i < points.length; i++) if (points[i] < min) min = points[i]
  for (let i = 0; i < points.length; i++) points[i] = baseY - (points[i] - min) * peakY
  return points
}

function drawMountain(ctx, points, w, h, color) {
  const len = points.length
  ctx.beginPath()
  ctx.moveTo(0, h)
  for (let px = 0; px <= w; px += 2) {
    const idx = (px / w) * (len - 1)
    const i0 = Math.floor(idx)
    const i1 = Math.min(i0 + 1, len - 1)
    const t = idx - i0
    ctx.lineTo(px, (points[i0] * (1 - t) + points[i1] * t) * h)
  }
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawSnowCaps(ctx, points, w, h) {
  const len = points.length
  let minY = 1
  for (let i = 0; i < len; i++) if (points[i] < minY) minY = points[i]
  const threshold = minY + 0.04

  ctx.strokeStyle = 'rgba(200, 215, 235, 0.12)'
  ctx.lineWidth = 2.5 * devicePixelRatio
  ctx.beginPath()
  let drawing = false
  for (let px = 0; px <= w; px += 2) {
    const idx = (px / w) * (len - 1)
    const i0 = Math.floor(idx)
    const i1 = Math.min(i0 + 1, len - 1)
    const t = idx - i0
    const y = points[i0] * (1 - t) + points[i1] * t
    if (y < threshold) {
      if (!drawing) { ctx.moveTo(px, y * h); drawing = true }
      else ctx.lineTo(px, y * h)
    } else {
      drawing = false
    }
  }
  ctx.stroke()
}
