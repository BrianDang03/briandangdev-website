import { useEffect, useRef } from 'react'

const COUNT = 110
const CONNECT_DIST = 160
const MOUSE_RADIUS = 130

// Reference CSS variable names — no hardcoded colors
const PALETTE_VARS = [
  '--accent',
  '--accent-dark',
  '--canvas-secondary',
  '--canvas-secondary-bright',
  '--text',
  '--text-muted',
]

const WAVE_CONFIGS = [
  { yFrac: 0.18, amp: 38, freq: 0.0042, speed: 0.007,  colorVar: '--accent',                   baseAlpha: 0.28, fadeSpeed: 0.011, fadeOffset: 0.0 },
  { yFrac: 0.32, amp: 28, freq: 0.0031, speed: 0.005,  colorVar: '--accent-dark',              baseAlpha: 0.22, fadeSpeed: 0.009, fadeOffset: 1.2 },
  { yFrac: 0.50, amp: 52, freq: 0.0025, speed: 0.004,  colorVar: '--canvas-secondary-bright',  baseAlpha: 0.26, fadeSpeed: 0.013, fadeOffset: 2.5 },
  { yFrac: 0.65, amp: 34, freq: 0.0038, speed: 0.006,  colorVar: '--canvas-secondary',         baseAlpha: 0.22, fadeSpeed: 0.008, fadeOffset: 0.8 },
  { yFrac: 0.80, amp: 44, freq: 0.0028, speed: 0.0045, colorVar: '--accent',                   baseAlpha: 0.24, fadeSpeed: 0.012, fadeOffset: 3.8 },
  { yFrac: 0.92, amp: 22, freq: 0.0055, speed: 0.009,  colorVar: '--text',                     baseAlpha: 0.18, fadeSpeed: 0.010, fadeOffset: 1.9 },
]

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function resolveVar(name) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return hexToRgb(val)
}

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function makeParticle(w, h, palette) {
  const color = palette[Math.floor(Math.random() * palette.length)]
  const isGlowing = Math.random() > 0.45
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: rand(-0.12, 0.12),
    vy: rand(-0.12, 0.12),
    baseVx: 0,
    baseVy: 0,
    size: isGlowing ? rand(1.5, 3.0) : rand(0.6, 1.4),
    color,
    alpha: rand(0.35, 0.9),
    glow: isGlowing,
    pulse: rand(0, Math.PI * 2),
    pulseSpeed: rand(0.008, 0.025),
  }
}

export default function Background() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    let t = 0

    // Resolve all colors from CSS variables once on mount
    const palette = PALETTE_VARS.map(resolveVar)
    const waveDefs = WAVE_CONFIGS.map(w => ({ ...w, color: resolveVar(w.colorVar) }))

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function init() {
      particles = Array.from({ length: COUNT }, () =>
        makeParticle(canvas.width, canvas.height, palette)
      )
      particles.forEach(p => {
        p.baseVx = p.vx
        p.baseVy = p.vy
      })
    }

    function drawWaves() {
      waveDefs.forEach(w => {
        const cy = canvas.height * w.yFrac
        const phase = t * w.speed
        const fade = 0.5 + 0.5 * Math.sin(t * w.fadeSpeed + w.fadeOffset)
        const alpha = w.baseAlpha * fade
        const { r, g, b } = w.color

        ctx.save()
        ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 4})`
        ctx.shadowBlur = 32
        ctx.beginPath()
        for (let x = 0; x <= canvas.width; x += 3) {
          const y = cy + Math.sin(x * w.freq + phase) * w.amp
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.lineWidth = 1.6
        ctx.stroke()
        ctx.restore()
      })
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist >= CONNECT_DIST) continue
          const opacity = (1 - dist / CONNECT_DIST) * 0.4
          const c = a.color
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${opacity})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }
    }

    function updateParticle(p) {
      const mx = mouse.current.x
      const my = mouse.current.y
      const dx = p.x - mx
      const dy = p.y - my
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < MOUSE_RADIUS && dist > 0) {
        const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 0.9
        p.vx += (dx / dist) * force * 0.06
        p.vy += (dy / dist) * force * 0.06
      }

      p.vx = p.vx * 0.97 + p.baseVx * 0.03
      p.vy = p.vy * 0.97 + p.baseVy * 0.03

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      if (speed > 0.7) {
        p.vx = (p.vx / speed) * 0.7
        p.vy = (p.vy / speed) * 0.7
      }

      p.x += p.vx
      p.y += p.vy

      if (p.x < -8) p.x = canvas.width + 8
      if (p.x > canvas.width + 8) p.x = -8
      if (p.y < -8) p.y = canvas.height + 8
      if (p.y > canvas.height + 8) p.y = -8
    }

    function drawParticle(p) {
      const pulse = Math.sin(t * p.pulseSpeed + p.pulse)
      const alpha = p.glow ? p.alpha * (0.65 + 0.35 * pulse) : p.alpha
      const size = p.glow ? p.size * (1 + 0.25 * pulse) : p.size
      const { r, g, b } = p.color

      ctx.save()
      if (p.glow) {
        ctx.shadowColor = `rgba(${r},${g},${b},1)`
        ctx.shadowBlur = 24
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
      ctx.fill()
      ctx.restore()
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t++
      drawWaves()
      drawConnections()
      particles.forEach(p => {
        updateParticle(p)
        drawParticle(p)
      })
      animId = requestAnimationFrame(render)
    }

    resize()
    init()
    render()

    function onResize() { resize(); init() }
    function onMouseMove(e) { mouse.current.x = e.clientX; mouse.current.y = e.clientY }
    function onMouseLeave() { mouse.current.x = -9999; mouse.current.y = -9999 }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}
