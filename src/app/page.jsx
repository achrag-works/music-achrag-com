'use client'
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

const AudioVisualizer = dynamic(() => import('@/components/AudioVisualizer'), {
  ssr: false,
  loading: () => null,
})

const MV_FILE = '/tracks/mv/Bakt_nt_Djehuty_Complete_Archive.mp4'
const TRACK_TITLE = 'Bakt nt Djehuty'
const TRACK_DURATION = '5:07'
const TRACK_GENRE = 'ACHRAG'

export default function Home() {
  const [analyzer, setAnalyzer]     = useState(null)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [mode, setMode]             = useState('particle')
  const [currentTime, setCurrentTime] = useState(0)
  const [overlayOn, setOverlayOn]   = useState(true)
  const [overlayOpacity, setOverlayOpacity] = useState(0.55)

  const videoRef    = useRef(null)
  const audioCtxRef = useRef(null)
  const analyzerRef = useRef(null)
  const sourceRef   = useRef(null)
  const rafRef      = useRef(null)

  // currentTime トラッキング
  useEffect(() => {
    const tick = () => {
      if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // AudioContext を動画に接続
  const initAudio = () => {
    if (analyzerRef.current) return  // 既に初期化済み
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    const analyzerNode = ctx.createAnalyser()
    analyzerNode.fftSize = 512
    analyzerRef.current = analyzerNode
    const source = ctx.createMediaElementSource(videoRef.current)
    source.connect(analyzerNode)
    analyzerNode.connect(ctx.destination)
    sourceRef.current = source
    setAnalyzer(analyzerNode)
  }

  const togglePlay = async () => {
    initAudio()
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume()
    }
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      await videoRef.current.play()
      setIsPlaying(true)
    }
  }

  // 動画クリックで再生/停止
  const handleVideoClick = () => togglePlay()

  return (
    <main
      className="w-full min-h-screen bg-black text-white"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {/* ── メインビュー: 動画 + オーバーレイ ── */}
      <div className="relative mx-auto" style={{ aspectRatio: '16/9', width: '100%', maxWidth: '1280px', maxHeight: '72vh' }}>

        {/* 動画レイヤー */}
        <video
          ref={videoRef}
          src={MV_FILE}
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          onClick={handleVideoClick}
          onEnded={() => setIsPlaying(false)}
          playsInline
          preload="metadata"
        />

        {/* グラフィックオーバーレイ */}
        {overlayOn && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: overlayOpacity }}
          >
            <AudioVisualizer
              analyzer={analyzer}
              mode={mode}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          </div>
        )}

        {/* 再生前のオーバーレイ表示 */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handleVideoClick}
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <div
              className="flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
              style={{
                width: 72, height: 72,
                background: 'rgba(103,232,249,0.15)',
                border: '1px solid rgba(103,232,249,0.4)',
              }}
            >
              <span style={{ color: '#67e8f9', fontSize: 28, marginLeft: 4 }}>▶</span>
            </div>
          </div>
        )}

        {/* 左下: トラック情報 */}
        <div className="absolute bottom-4 left-5 pointer-events-none">
          <p className="text-[9px] tracking-[0.3em] text-zinc-500">{TRACK_GENRE}</p>
          <p className="text-sm tracking-wider text-zinc-200 mt-0.5">{TRACK_TITLE}</p>
        </div>

        {/* 右下: コントロール */}
        <div className="absolute bottom-4 right-5 flex items-center gap-4">
          {/* オーバーレイ透明度スライダー */}
          {overlayOn && (
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={overlayOpacity}
              onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
              className="w-20 cursor-pointer"
              style={{ accentColor: '#67e8f9' }}
            />
          )}
          {/* オーバーレイ ON/OFF */}
          <button
            onClick={() => setOverlayOn(v => !v)}
            className="text-[9px] tracking-[0.2em] transition-all duration-300 px-2 py-1"
            style={{
              color: overlayOn ? '#67e8f9' : '#52525b',
              border: `1px solid ${overlayOn ? 'rgba(103,232,249,0.4)' : 'rgba(82,82,91,0.4)'}`,
            }}
          >
            VIZ
          </button>
        </div>
      </div>

      {/* ── 下部コントロールバー ── */}
      <div className="w-full px-8 py-4 flex items-center gap-6"
        style={{ borderTop: '1px solid rgba(103,232,249,0.08)' }}>

        {/* 再生/停止 */}
        <button
          onClick={togglePlay}
          className="text-[11px] tracking-[0.2em] transition-all duration-300 px-4 py-2"
          style={{
            color: '#67e8f9',
            border: '1px solid rgba(103,232,249,0.3)',
            background: isPlaying ? 'rgba(103,232,249,0.08)' : 'transparent',
          }}
        >
          {isPlaying ? '■  PAUSE' : '▶  PLAY'}
        </button>

        {/* モード切替 */}
        <div className="flex gap-4">
          {[
            { id: 'particle', label: 'PARTICLE' },
            { id: 'wave',     label: 'WAVE' },
            { id: 'bar',      label: 'RING BAR' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="text-[9px] tracking-[0.2em] transition-all duration-300 pb-1"
              style={{
                color: mode === m.id ? '#67e8f9' : '#52525b',
                borderBottom: mode === m.id ? '1px solid #67e8f9' : '1px solid transparent',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 時間表示 */}
        <div className="ml-auto text-[10px] text-zinc-600 tracking-widest">
          {Math.floor(currentTime / 60).toString().padStart(2,'0')}:
          {Math.floor(currentTime % 60).toString().padStart(2,'0')}
          <span className="mx-1 opacity-40">/</span>
          {TRACK_DURATION}
        </div>
      </div>

      {/* ── 下部: ライナーノーツ ── */}
      <div className="w-full px-8 pb-12 pt-4 text-center">
        <p className="text-[9px] tracking-[0.3em] text-zinc-700 mb-4">LINER NOTES</p>
        <p className="text-xs leading-7 text-zinc-600 max-w-xl mx-auto" style={{ letterSpacing: '0.04em' }}>
          ACHRAG — 実験的電子音楽ユニット。音と霊響の境界を探求する。
        </p>
      </div>

      {/* hidden audio element は不要 — videoから直接取得 */}
    </main>
  )
}
