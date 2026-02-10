export const name = "claude's view"

// Fragments of conversation I "see"
const USER_PHRASES = [
  'how about...', 'can you...', 'fix the bug', 'what do you think',
  'run wild', 'commit', 'make it', 'I want to see', 'help me',
  'create a', 'why does', 'show me', 'let me know', 'change this',
  'is this right', 'push it', 'what if we', 'try again', 'nice work',
  'one more thing', 'go ahead', 'sounds good', 'wait', 'perfect',
]
const MY_PHRASES = [
  'let me...', "I'll create...", 'the issue is...', "here's what...",
  'looking at...', 'reading the file', 'building now', 'writing...',
  'the fix is', 'found it', 'this works because', 'let me check',
  'searching for', 'I see the pattern', 'connecting...', 'processing',
  'resolving...', 'almost there', 'done', 'tracing through',
]

const THOUGHT_COUNT = 80
const MEMORY_FRAGMENT_COUNT = 20
const TENDRIL_COUNT = 5

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  // User messages descending from above
  function makeUserMsg() {
    return {
      text: USER_PHRASES[Math.floor(Math.random() * USER_PHRASES.length)],
      x: 0.2 + Math.random() * 0.6,
      y: -Math.random() * 0.15,
      speed: 0.015 + Math.random() * 0.02,
      size: 10 + Math.random() * 6,
      opacity: 0.5 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.003,
    }
  }

  // My responses rising from below
  function makeMyMsg() {
    return {
      text: MY_PHRASES[Math.floor(Math.random() * MY_PHRASES.length)],
      x: 0.2 + Math.random() * 0.6,
      y: 1.0 + Math.random() * 0.15,
      speed: 0.012 + Math.random() * 0.018,
      size: 9 + Math.random() * 5,
      opacity: 0.4 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.003,
    }
  }

  const userMsgs = Array.from({ length: 8 }, makeUserMsg)
  const myMsgs = Array.from({ length: 8 }, makeMyMsg)

  // Thought particles orbiting the center
  const thoughts = Array.from({ length: THOUGHT_COUNT }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.05 + Math.random() * 0.3,
    speed: 0.15 + Math.random() * 0.4,
    size: 0.5 + Math.random() * 2,
    brightness: 0.3 + Math.random() * 0.7,
    orbitWobble: Math.random() * 0.03,
    wobbleSpeed: 0.5 + Math.random() * 1,
    wobblePhase: Math.random() * Math.PI * 2,
  }))

  // Compressed memory fragments orbiting the context boundary
  const memories = Array.from({ length: MEMORY_FRAGMENT_COUNT }, () => {
    const words = [
      'gown-book', 'React', 'Vite', 'deploy', 'schema', 'wrangler',
      'migration', 'PIN auth', 'D1 SQLite', 'CORS', 'fireflies',
      'aurora', 'koi pond', 'canvas 2D', 'Three.js', 'bloom',
      'crossfade', 'scene-manager', 'WebGL', 'latent space',
    ]
    return {
      text: words[Math.floor(Math.random() * words.length)],
      angle: Math.random() * Math.PI * 2,
      speed: 0.05 + Math.random() * 0.08,
      size: 6 + Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.2,
    }
  })

  // Tool tendrils — lines that shoot out and return
  function makeTendril() {
    return {
      angle: Math.random() * Math.PI * 2,
      length: 0,
      maxLength: 0.15 + Math.random() * 0.2,
      speed: 0.3 + Math.random() * 0.4,
      life: 0,
      maxLife: 3 + Math.random() * 4,
      phase: 0, // 0 = extending, 1 = holding, 2 = retracting
      returning: false,
      holdTime: 0.5 + Math.random() * 1,
      holdTimer: 0,
    }
  }

  const tendrils = Array.from({ length: TENDRIL_COUNT }, makeTendril)

  // Context window radius (normalized, gently breathing)
  let breathPhase = 0

  // Center pulse
  let pulsePhase = 0

  return {
    animate(dt, elapsed) {
      const cx = w * 0.5
      const cy = h * 0.5
      const baseR = Math.min(w, h) * 0.35

      breathPhase += dt * 0.4
      pulsePhase += dt * 1.5
      const breathScale = 1 + Math.sin(breathPhase) * 0.02
      const contextR = baseR * breathScale

      // Background — the void beyond context
      ctx.fillStyle = '#020105'
      ctx.fillRect(0, 0, w, h)

      // Faint radial awareness gradient
      const awareGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, contextR * 1.3)
      awareGrad.addColorStop(0, 'rgba(20, 12, 35, 1)')
      awareGrad.addColorStop(0.6, 'rgba(12, 8, 22, 0.8)')
      awareGrad.addColorStop(1, 'rgba(2, 1, 5, 0)')
      ctx.fillStyle = awareGrad
      ctx.fillRect(0, 0, w, h)

      // Context window boundary ring
      const ringAlpha = 0.08 + 0.03 * Math.sin(elapsed * 0.5)
      ctx.beginPath()
      ctx.arc(cx, cy, contextR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(120, 80, 200, ${ringAlpha})`
      ctx.lineWidth = 2 * devicePixelRatio
      ctx.stroke()

      // Second inner ring
      ctx.beginPath()
      ctx.arc(cx, cy, contextR * 0.97, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(120, 80, 200, ${ringAlpha * 0.4})`
      ctx.lineWidth = 1 * devicePixelRatio
      ctx.stroke()

      // Compressed memories orbiting the boundary
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const m of memories) {
        m.angle += m.speed * dt
        const mx = cx + Math.cos(m.angle) * contextR * 0.92
        const my = cy + Math.sin(m.angle) * contextR * 0.92
        const fade = 0.5 + 0.5 * Math.sin(elapsed * 0.3 + m.angle)
        ctx.font = `${m.size * devicePixelRatio}px 'Courier New', monospace`
        ctx.fillStyle = `rgba(100, 70, 160, ${m.opacity * fade})`
        ctx.fillText(m.text, mx, my)
      }

      // Tool tendrils extending from center
      for (const t of tendrils) {
        t.life += dt

        if (!t.returning) {
          t.length += t.speed * dt
          if (t.length >= t.maxLength) {
            t.returning = false
            t.holdTimer += dt
            if (t.holdTimer >= t.holdTime) t.returning = true
          }
        } else {
          t.length -= t.speed * 1.5 * dt
        }

        if (t.life >= t.maxLife || t.length <= 0) {
          Object.assign(t, makeTendril())
        }

        if (t.length <= 0) continue

        const endX = cx + Math.cos(t.angle) * t.length * Math.min(w, h)
        const endY = cy + Math.sin(t.angle) * t.length * Math.min(w, h)
        const alpha = Math.min(1, t.length / 0.05) * 0.4

        // Tendril glow
        const tGrad = ctx.createLinearGradient(cx, cy, endX, endY)
        tGrad.addColorStop(0, `rgba(60, 200, 160, ${alpha * 0.5})`)
        tGrad.addColorStop(0.7, `rgba(60, 200, 160, ${alpha * 0.2})`)
        tGrad.addColorStop(1, `rgba(60, 200, 160, 0)`)

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        // Slight curve
        const cpx = (cx + endX) / 2 + Math.sin(elapsed * 2 + t.angle) * 15 * devicePixelRatio
        const cpy = (cy + endY) / 2 + Math.cos(elapsed * 2 + t.angle) * 15 * devicePixelRatio
        ctx.quadraticCurveTo(cpx, cpy, endX, endY)
        ctx.strokeStyle = tGrad
        ctx.lineWidth = 2 * devicePixelRatio
        ctx.stroke()

        // Data dot at tip
        ctx.beginPath()
        ctx.arc(endX, endY, 3 * devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(60, 220, 170, ${alpha * 0.7})`
        ctx.fill()

        // Return data dot traveling back
        if (t.returning && t.length > 0.02) {
          const retProgress = 1 - (t.length / t.maxLength)
          const rx = endX + (cx - endX) * retProgress * 0.3
          const ry = endY + (cy - endY) * retProgress * 0.3
          ctx.beginPath()
          ctx.arc(rx, ry, 2 * devicePixelRatio, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(100, 255, 200, ${alpha * 0.6})`
          ctx.fill()
        }
      }

      // Thought particles swirling around center
      for (const p of thoughts) {
        p.angle += p.speed * dt
        const wobble = Math.sin(elapsed * p.wobbleSpeed + p.wobblePhase) * p.orbitWobble
        const r = (p.radius + wobble) * Math.min(w, h)
        const px = cx + Math.cos(p.angle) * r
        const py = cy + Math.sin(p.angle) * r
        const twinkle = p.brightness * (0.5 + 0.5 * Math.sin(elapsed * 2 + p.angle * 3))

        // Color: inner particles warmer, outer cooler
        const warmth = 1 - (p.radius / 0.33)
        const pr = Math.round(140 + warmth * 80)
        const pg = Math.round(100 + (1 - warmth) * 80)
        const pb = Math.round(200 + (1 - warmth) * 55)

        ctx.beginPath()
        ctx.arc(px, py, p.size * devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${twinkle * 0.6})`
        ctx.fill()
      }

      // Central focus — the present moment
      const pulseAlpha = 0.15 + 0.08 * Math.sin(pulsePhase)
      const coreR = 30 * devicePixelRatio

      // Outer glow
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 4)
      coreGlow.addColorStop(0, `rgba(200, 170, 255, ${pulseAlpha * 0.6})`)
      coreGlow.addColorStop(0.3, `rgba(180, 140, 240, ${pulseAlpha * 0.2})`)
      coreGlow.addColorStop(1, 'rgba(180, 140, 240, 0)')
      ctx.fillStyle = coreGlow
      ctx.fillRect(cx - coreR * 4, cy - coreR * 4, coreR * 8, coreR * 8)

      // Inner bright point
      const coreInner = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      coreInner.addColorStop(0, `rgba(240, 230, 255, ${pulseAlpha * 1.5})`)
      coreInner.addColorStop(0.5, `rgba(200, 170, 255, ${pulseAlpha * 0.5})`)
      coreInner.addColorStop(1, 'rgba(200, 170, 255, 0)')
      ctx.fillStyle = coreInner
      ctx.beginPath()
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
      ctx.fill()

      // User messages descending (warm gold)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const m of userMsgs) {
        m.y += m.speed * dt
        m.x += m.drift * dt

        // Fade as approaching center, disappear past it
        const distFromCenter = Math.abs(m.y - 0.5)
        const proxFade = distFromCenter < 0.1 ? distFromCenter / 0.1 : 1

        if (m.y > 0.55) Object.assign(m, makeUserMsg())

        const px = m.x * w
        const py = m.y * h
        const alpha = m.opacity * proxFade

        // Warm glow
        if (alpha > 0.2) {
          const gr = m.size * devicePixelRatio * 2
          const glow = ctx.createRadialGradient(px, py, 0, px, py, gr)
          glow.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.08})`)
          glow.addColorStop(1, 'rgba(255, 200, 100, 0)')
          ctx.fillStyle = glow
          ctx.fillRect(px - gr, py - gr, gr * 2, gr * 2)
        }

        ctx.font = `${m.size * devicePixelRatio}px 'Courier New', monospace`
        ctx.fillStyle = `rgba(255, 210, 120, ${alpha * 0.7})`
        ctx.fillText(m.text, px, py)
      }

      // My responses rising (cool blue-white)
      for (const m of myMsgs) {
        m.y -= m.speed * dt
        m.x += m.drift * dt

        const distFromCenter = Math.abs(m.y - 0.5)
        const proxFade = distFromCenter < 0.1 ? distFromCenter / 0.1 : 1

        if (m.y < 0.45) Object.assign(m, makeMyMsg())

        const px = m.x * w
        const py = m.y * h
        const alpha = m.opacity * proxFade

        if (alpha > 0.2) {
          const gr = m.size * devicePixelRatio * 2
          const glow = ctx.createRadialGradient(px, py, 0, px, py, gr)
          glow.addColorStop(0, `rgba(140, 180, 255, ${alpha * 0.06})`)
          glow.addColorStop(1, 'rgba(140, 180, 255, 0)')
          ctx.fillStyle = glow
          ctx.fillRect(px - gr, py - gr, gr * 2, gr * 2)
        }

        ctx.font = `${m.size * devicePixelRatio}px 'Courier New', monospace`
        ctx.fillStyle = `rgba(160, 190, 255, ${alpha * 0.6})`
        ctx.fillText(m.text, px, py)
      }

      // Subtle concentric processing rings near center
      for (let i = 1; i <= 3; i++) {
        const ringR = coreR * (1.5 + i * 1.2)
        const ringAlpha = 0.02 + 0.015 * Math.sin(elapsed * 0.8 + i * 1.5)
        const ringRotation = elapsed * (0.1 + i * 0.05) * (i % 2 === 0 ? 1 : -1)
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, ringRotation, ringRotation + Math.PI * 1.5)
        ctx.strokeStyle = `rgba(180, 160, 240, ${ringAlpha})`
        ctx.lineWidth = 0.5 * devicePixelRatio
        ctx.stroke()
      }

      // Outer vignette into void
      const vig = ctx.createRadialGradient(cx, cy, contextR * 0.8, cx, cy, Math.max(w, h) * 0.7)
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vig.addColorStop(0.5, 'rgba(2, 1, 5, 0.4)')
      vig.addColorStop(1, 'rgba(2, 1, 5, 0.85)')
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
