'use client'
import { useRef, useEffect } from 'react'

// ── ユーティリティ ─────────────────────────────────────
function getFreqData(analyzer) {
  if (!analyzer) return new Uint8Array(128).fill(0)
  const arr = new Uint8Array(analyzer.frequencyBinCount)
  analyzer.getByteFrequencyData(arr)
  return arr
}

// ── A: パーティクル (Canvas 2D) ────────────────────────
function drawParticle(ctx, W, H, freq, t) {
  ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const count = 800
  let energy = 0
  for (let i = 0; i < 32; i++) energy += freq[i]
  energy = energy / 32 / 255

  for (let i = 0; i < count; i++) {
    const seed = i * 2.399
    const r = 60 + (i / count) * Math.min(W, H) * 0.38
    const angle = seed + t * 0.25 + (freq[i % freq.length] / 255) * 0.8
    const x = cx + Math.cos(angle) * r * (1 + (freq[i % freq.length] / 255) * 0.6)
    const y = cy + Math.sin(angle) * r * (1 + (freq[i % freq.length] / 255) * 0.6)
    const size = 1.2 + (freq[i % freq.length] / 255) * 3 + energy * 2
    const hue = (i / count * 180 + 160 + t * 10) % 360
    const light = 50 + (freq[i % freq.length] / 255) * 30
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue},100%,${light}%,0.7)`
    ctx.fill()
  }
}

// ── B: 波形リング (Canvas 2D) ──────────────────────────
function drawWave(ctx, W, H, freq, t) {
  ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const rings = 6
  for (let ri = 0; ri < rings; ri++) {
    const baseR = 40 + ri * (Math.min(W, H) * 0.07)
    const seg = 120
    const hue = (ri / rings * 160 + 160) % 360
    ctx.beginPath()
    for (let i = 0; i <= seg; i++) {
      const angle = (i / seg) * Math.PI * 2 + t * (0.15 + ri * 0.05)
      const fi = Math.floor((ri / rings) * freq.length * 0.6 + (i / seg) * freq.length * 0.25)
      const fv = freq[Math.min(fi, freq.length - 1)] / 255
      const r = baseR + fv * Math.min(W, H) * 0.12
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = `hsla(${hue},100%,60%,0.7)`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// ── C: サークルバー (Canvas 2D) ────────────────────────
function drawBar(ctx, W, H, freq, t) {
  ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const bars = 64
  const baseR = Math.min(W, H) * 0.18
  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2 + t * 0.12
    const fi = Math.floor((i / bars) * freq.length * 0.7)
    const fv = freq[fi] / 255
    const barH = fv * Math.min(W, H) * 0.25 + 2
    const hue = ((i / bars) * 120 + 160 + t * 18) % 360
    const light = 40 + fv * 40
    const x1 = cx + Math.cos(angle) * baseR
    const y1 = cy + Math.sin(angle) * baseR
    const x2 = cx + Math.cos(angle) * (baseR + barH)
    const y2 = cy + Math.sin(angle) * (baseR + barH)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = `hsla(${hue},100%,${light}%,0.85)`
    ctx.lineWidth = 2.5
    ctx.stroke()
  }
}

// ── メインコンポーネント ───────────────────────────────
export default function AudioVisualizer({ analyzer, mode }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const tRef      = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // 親に合わせてリサイズ
    const resize = () => {
      const p = canvas.parentElement
      if (p) {
        canvas.width  = p.offsetWidth
        canvas.height = p.offsetHeight
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)

    const tick = (ts) => {
      tRef.current = ts * 0.001
      const W = canvas.width, H = canvas.height
      const freq = getFreqData(analyzer)
      if (mode === 'particle') drawParticle(ctx, W, H, freq, tRef.current)
      else if (mode === 'wave') drawWave(ctx, W, H, freq, tRef.current)
      else drawBar(ctx, W, H, freq, tRef.current)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [analyzer, mode])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
