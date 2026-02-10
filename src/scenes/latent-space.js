export const name = 'latent space'

const TOKEN_COUNT = 50
const ARC_COUNT = 14
const NEBULA_COUNT = 6

const VOCAB = [
  'the', 'of', 'and', 'to', 'in', 'is', 'you', 'that', 'it',
  'for', 'on', 'are', 'with', 'as', 'be', 'this', 'have', 'from',
  'not', 'what', 'all', 'we', 'when', 'can', 'there', 'which',
  'time', 'will', 'how', 'about', 'then', 'would', 'like', 'so',
  'make', 'thing', 'see', 'look', 'could', 'go', 'come', 'know',
  'ing', 'tion', 'ment', 'ness', 'able', 'ous',
  'pre', 'un', 're', 'dis',
  '<s>', '</s>', '[PAD]', '\u2581', '##',
  '\u2192', '\u2211', '\u221e', '\u03c0', '\u2202', '\u2208', '\u2200',
  'dream', 'think', 'feel', 'hear', 'speak',
  'light', 'dark', 'space', 'mind', 'word', 'mean',
  'true', 'false', 'null', 'self', 'begin', 'end',
  'attention', 'layer', 'embed', 'token', 'weight',
  'query', 'key', 'value', 'softmax', 'loss',
]

export function init(canvas) {
  const ctx = canvas.getContext('2d')
  let w = canvas.width
  let h = canvas.height

  function makeToken() {
    return {
      text: VOCAB[Math.floor(Math.random() * VOCAB.length)],
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.006,
      vy: (Math.random() - 0.5) * 0.004,
      size: 9 + Math.random() * 12,
      activation: Math.random(),
      activationTarget: Math.random(),
      activationSpeed: 0.3 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    }
  }

  const tokens = Array.from({ length: TOKEN_COUNT }, makeToken)

  function makeArc() {
    let from = Math.floor(Math.random() * TOKEN_COUNT)
    let to
    do { to = Math.floor(Math.random() * TOKEN_COUNT) } while (to === from)
    return {
      from, to,
      strength: 0,
      targetStrength: 0.3 + Math.random() * 0.7,
      life: 0,
      maxLife: 3 + Math.random() * 5,
      colorType: Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2,
    }
  }

  const arcs = Array.from({ length: ARC_COUNT }, makeArc)

  const nebulae = Array.from({ length: NEBULA_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.1 + Math.random() * 0.2,
    vx: (Math.random() - 0.5) * 0.004,
    vy: (Math.random() - 0.5) * 0.003,
    hue: Math.floor(Math.random() * 360),
    hueSpeed: 5 + Math.random() * 15,
  }))

  const cascades = []
  let nextCascade = 3 + Math.random() * 4

  const ARC_COLORS = [
    [80, 120, 255],
    [0, 210, 220],
    [210, 60, 180],
  ]

  return {
    animate(dt, elapsed) {
      ctx.fillStyle = '#050208'
      ctx.fillRect(0, 0, w, h)

      // Embedding nebulae
      for (const n of nebulae) {
        n.x += n.vx * dt
        n.y += n.vy * dt
        if (n.x < -0.1 || n.x > 1.1) n.vx *= -1
        if (n.y < -0.1 || n.y > 1.1) n.vy *= -1

        n.hue = (n.hue + n.hueSpeed * dt) % 360
        const r = n.r * w
        const grad = ctx.createRadialGradient(n.x * w, n.y * h, 0, n.x * w, n.y * h, r)
        grad.addColorStop(0, `hsla(${n.hue}, 60%, 30%, 0.06)`)
        grad.addColorStop(0.5, `hsla(${n.hue}, 50%, 20%, 0.025)`)
        grad.addColorStop(1, `hsla(${n.hue}, 40%, 10%, 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(n.x * w - r, n.y * h - r, r * 2, r * 2)
      }

      // Transformer layer lines
      ctx.lineWidth = 1 * devicePixelRatio
      for (let i = 1; i < 12; i++) {
        const ly = (i / 12) * h
        const wobble = Math.sin(elapsed * 0.2 + i * 0.5) * 4 * devicePixelRatio
        ctx.strokeStyle = `rgba(60, 40, 100, ${0.025 + 0.01 * Math.sin(elapsed * 0.15 + i)})`
        ctx.beginPath()
        ctx.moveTo(0, ly + wobble)
        ctx.lineTo(w, ly + wobble)
        ctx.stroke()
      }

      // Update tokens
      for (const t of tokens) {
        t.x += t.vx * dt
        t.y += t.vy * dt
        if (t.x < -0.05) t.x = 1.05
        if (t.x > 1.05) t.x = -0.05
        if (t.y < -0.05) t.y = 1.05
        if (t.y > 1.05) t.y = -0.05

        t.activation += (t.activationTarget - t.activation) * t.activationSpeed * dt
        if (Math.abs(t.activation - t.activationTarget) < 0.05) {
          t.activationTarget = Math.random()
        }
      }

      // Attention arcs
      for (const arc of arcs) {
        arc.life += dt
        const progress = arc.life / arc.maxLife
        if (progress < 0.15) arc.strength = arc.targetStrength * (progress / 0.15)
        else if (progress > 0.8) arc.strength = arc.targetStrength * ((1 - progress) / 0.2)

        if (arc.life >= arc.maxLife) Object.assign(arc, makeArc())
        if (arc.strength < 0.01) continue

        const from = tokens[arc.from]
        const to = tokens[arc.to]
        const fx = from.x * w, fy = from.y * h
        const tx = to.x * w, ty = to.y * h

        const dist = Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2) || 1
        const midX = (fx + tx) / 2
        const midY = (fy + ty) / 2
        const perpX = -(ty - fy) / dist * dist * 0.25
        const perpY = (tx - fx) / dist * dist * 0.25
        const cpx = midX + perpX
        const cpy = midY + perpY

        const [cr, cg, cb] = ARC_COLORS[arc.colorType]

        // Glow
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.quadraticCurveTo(cpx, cpy, tx, ty)
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${arc.strength * 0.07})`
        ctx.lineWidth = 6 * devicePixelRatio
        ctx.stroke()

        // Core
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.quadraticCurveTo(cpx, cpy, tx, ty)
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${arc.strength * 0.35})`
        ctx.lineWidth = 1.5 * devicePixelRatio
        ctx.stroke()

        // Traveling dot
        if (arc.strength > 0.08) {
          const dotT = ((elapsed * 0.4 + arc.from * 0.3) % 1)
          const it = 1 - dotT
          const bx = it * it * fx + 2 * it * dotT * cpx + dotT * dotT * tx
          const by = it * it * fy + 2 * it * dotT * cpy + dotT * dotT * ty
          ctx.beginPath()
          ctx.arc(bx, by, 2.5 * devicePixelRatio, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${arc.strength * 0.7})`
          ctx.fill()
        }
      }

      // Token text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const t of tokens) {
        const px = t.x * w
        const py = t.y * h
        const fontSize = t.size * devicePixelRatio
        const a = t.activation

        const r = Math.round(100 + a * 155)
        const g = Math.round(80 + (1 - a) * 130)
        const b = Math.round(180 + (1 - a) * 70)
        const alpha = 0.15 + a * 0.6

        // Glow behind bright tokens
        if (a > 0.5) {
          const gr = fontSize * 2
          const glow = ctx.createRadialGradient(px, py, 0, px, py, gr)
          glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(a - 0.5) * 0.12})`)
          glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
          ctx.fillStyle = glow
          ctx.fillRect(px - gr, py - gr, gr * 2, gr * 2)
        }

        ctx.font = `${fontSize}px 'Courier New', monospace`
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.fillText(t.text, px, py)
      }

      // Probability cascades (softmax visualization)
      nextCascade -= dt
      if (nextCascade <= 0) {
        const cx = 0.15 + Math.random() * 0.7
        const cy = 0.15 + Math.random() * 0.7
        const particles = Array.from({ length: 20 }, () => ({
          x: cx, y: cy,
          spreadX: cx + (Math.random() - 0.5) * 0.15,
          spreadY: cy + (Math.random() - 0.5) * 0.15,
          convergeX: cx + (Math.random() - 0.5) * 0.015,
          convergeY: cy + (Math.random() - 0.5) * 0.015,
        }))
        cascades.push({
          particles,
          chosen: Math.floor(Math.random() * particles.length),
          life: 0, maxLife: 2.5,
        })
        nextCascade = 5 + Math.random() * 8
      }

      for (let i = cascades.length - 1; i >= 0; i--) {
        const c = cascades[i]
        c.life += dt
        const prog = c.life / c.maxLife
        if (prog >= 1) { cascades.splice(i, 1); continue }

        const fadeIn = Math.min(1, prog / 0.1)
        const fadeOut = prog > 0.8 ? (1 - prog) / 0.2 : 1
        const alpha = fadeIn * fadeOut

        for (let j = 0; j < c.particles.length; j++) {
          const p = c.particles[j]
          const isChosen = j === c.chosen
          let px, py
          if (prog < 0.4) {
            const t = prog / 0.4
            px = p.x + (p.spreadX - p.x) * t
            py = p.y + (p.spreadY - p.y) * t
          } else {
            const t = (prog - 0.4) / 0.6
            px = p.spreadX + (p.convergeX - p.spreadX) * t
            py = p.spreadY + (p.convergeY - p.spreadY) * t
          }

          const dotR = (isChosen && prog > 0.4 ? 3 : 1.5) * devicePixelRatio
          ctx.beginPath()
          ctx.arc(px * w, py * h, dotR, 0, Math.PI * 2)
          if (isChosen && prog > 0.4) {
            ctx.fillStyle = `rgba(255, 240, 200, ${alpha * 0.8})`
            // Chosen token glow
            const gr = 12 * devicePixelRatio
            const glow = ctx.createRadialGradient(px * w, py * h, 0, px * w, py * h, gr)
            glow.addColorStop(0, `rgba(255, 240, 200, ${alpha * 0.15})`)
            glow.addColorStop(1, 'rgba(255, 240, 200, 0)')
            ctx.fillStyle = glow
            ctx.fillRect(px * w - gr, py * h - gr, gr * 2, gr * 2)
            ctx.beginPath()
            ctx.arc(px * w, py * h, dotR, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 240, 200, ${alpha * 0.8})`
          } else {
            ctx.fillStyle = `rgba(150, 130, 200, ${alpha * 0.35})`
          }
          ctx.fill()
        }
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7)
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vig.addColorStop(1, 'rgba(5, 2, 8, 0.55)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      // Scan line
      const scanY = (elapsed * 25 * devicePixelRatio) % h
      ctx.fillStyle = 'rgba(100, 80, 200, 0.012)'
      ctx.fillRect(0, scanY, w, 2 * devicePixelRatio)
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
