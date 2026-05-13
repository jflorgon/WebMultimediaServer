import { useCallback, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { sendKeepAlive } from '../../services/streaming'

const isTizen = import.meta.env.VITE_TIZEN === 'true'

const HIDE_DELAY_MS = 4000

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

interface VideoPlayerProps {
  src: string
  title: string
  /** 'hls' (default) usa hls.js; 'direct' asigna directamente video.src para Range. */
  mode?: 'hls' | 'direct'
  /** Id del recurso (movie/episode/documentary) para enviar heartbeat HLS. */
  keepAliveId?: string
  onClose: () => void
}

export function VideoPlayer({ src, title, mode = 'hls', keepAliveId, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<number | null>(null)

  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      const v = videoRef.current
      if (v && !v.paused) setControlsVisible(false)
    }, HIDE_DELAY_MS)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // ---- Direct play: el navegador hace Range sobre el fichero original. ----
    if (mode === 'direct') {
      video.src = src
      const onLoaded = () => {
        setReady(true)
        video.play().catch(() => {})
        if (!isTizen) {
          try { video.requestFullscreen?.() } catch { /* no-op */ }
        }
      }
      const onErr = () => {
        console.error('[direct] error cargando fuente directa', video.error)
        setError(true)
      }
      video.addEventListener('loadedmetadata', onLoaded)
      video.addEventListener('error', onErr)
      return () => {
        video.removeEventListener('loadedmetadata', onLoaded)
        video.removeEventListener('error', onErr)
        video.removeAttribute('src')
        video.load()
      }
    }

    // ---- HLS ----
    if (Hls.isSupported()) {
      const hls = new Hls({ manifestLoadingTimeOut: 120000, manifestLoadingMaxRetry: 3 })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setReady(true)
        video.play().catch(() => {})
        if (!isTizen) {
          try { video.requestFullscreen?.() } catch { /* no-op */ }
        }
      })
      hls.on(Hls.Events.ERROR, (_e, data) => {
        console.error('[HLS] error:', data.type, data.details, 'fatal:', data.fatal, data)
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
          } else {
            setError(true)
          }
        }
      })
      return () => hls.destroy()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.addEventListener('loadedmetadata', () => {
        setReady(true)
        video.play().catch(() => {})
        if (!isTizen) {
          try { video.requestFullscreen?.() } catch { /* no-op */ }
        }
      })
    }
  }, [src, mode])

  // Eventos del <video> para alimentar la UI
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime)
    const onMeta = () => setDuration(v.duration || 0)
    const onPlay = () => { setPlaying(true); showControls() }
    const onPause = () => { setPlaying(false); setControlsVisible(true) }
    const onWaiting = () => setBuffering(true)
    const onCanPlay = () => setBuffering(false)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('durationchange', onMeta)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('waiting', onWaiting)
    v.addEventListener('canplay', onCanPlay)
    v.addEventListener('playing', onCanPlay)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('durationchange', onMeta)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('playing', onCanPlay)
    }
  }, [showControls])

  // Auto-hide inicial cuando empieza a reproducir
  useEffect(() => {
    if (ready && playing) showControls()
  }, [ready, playing, showControls])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      // Cualquier tecla revela los controles
      showControls()
      // Escape / botón Return de Tizen → cerrar
      if (e.key === 'Escape' || e.keyCode === 10009) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'ArrowLeft' || e.keyCode === 37) {
        e.preventDefault()
        e.stopPropagation()
        video.currentTime = Math.max(0, video.currentTime - 10)
        return
      }
      if (e.key === 'ArrowRight' || e.keyCode === 39) {
        e.preventDefault()
        e.stopPropagation()
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10)
        return
      }
      if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13) {
        e.preventDefault()
        e.stopPropagation()
        if (video.paused) video.play().catch(() => {})
        else video.pause()
        return
      }
      if (e.key === 'ArrowUp' || e.keyCode === 38) {
        e.preventDefault()
        e.stopPropagation()
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 60)
        return
      }
      if (e.key === 'ArrowDown' || e.keyCode === 40) {
        e.preventDefault()
        e.stopPropagation()
        video.currentTime = Math.max(0, video.currentTime - 60)
        return
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose, showControls])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  // Heartbeat: mientras el player esté montado y en modo HLS, avisamos al servidor
  // cada 30 s para que no mate el FFmpeg por inactividad (pausas, buffering, etc.).
  // En direct play no hace falta: no hay proceso FFmpeg que mantener vivo.
  useEffect(() => {
    if (mode !== 'hls' || !keepAliveId) return
    sendKeepAlive(keepAliveId)
    const handle = window.setInterval(() => sendKeepAlive(keepAliveId), 30_000)
    return () => window.clearInterval(handle)
  }, [mode, keepAliveId])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  const seekRelative = (delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || Infinity, v.currentTime + delta))
    showControls()
  }

  const onSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    v.currentTime = Math.max(0, Math.min(duration, ratio * duration))
    showControls()
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseMove={isTizen ? undefined : showControls}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {!ready && !error && (
        <div style={{ position: 'absolute', color: '#ccc', fontSize: 14, textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>Preparando stream…</div>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#e50914', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      )}

      {error ? (
        <div style={{ color: '#e50914', textAlign: 'center' }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>Error al cargar el vídeo</p>
          <p style={{ color: '#999', fontSize: 13 }}>Comprueba que el fichero está disponible</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: '#000',
              display: 'block',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.3s',
              objectFit: 'contain',
            }}
          />

          {ready && buffering && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 56,
                height: 56,
                border: '4px solid rgba(255,255,255,0.18)',
                borderTopColor: '#e50914',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Controles inferiores */}
          {ready && (
            <div
              data-controls
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: isTizen ? '0 4vw 2.2rem' : '0 3vw 1.4rem',
                paddingTop: isTizen ? '6rem' : '4rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)',
                opacity: controlsVisible ? 1 : 0,
                transition: 'opacity 0.25s ease',
                pointerEvents: controlsVisible ? 'auto' : 'none',
                color: '#fff',
              }}
            >
              {title && (
                <div
                  style={{
                    fontSize: isTizen ? '1.6rem' : '1.1rem',
                    fontWeight: 600,
                    marginBottom: isTizen ? '1rem' : '0.6rem',
                    textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                  }}
                >
                  {title}
                </div>
              )}

              {/* Barra de progreso */}
              <div
                onClick={isTizen ? undefined : onSeekClick}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: isTizen ? 10 : 6,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderRadius: 999,
                  cursor: isTizen ? 'default' : 'pointer',
                  marginBottom: isTizen ? '0.7rem' : '0.5rem',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${progress}%`,
                    backgroundColor: '#e50914',
                    borderRadius: 999,
                    transition: 'width 0.1s linear',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${progress}%`,
                    width: isTizen ? 20 : 14,
                    height: isTizen ? 20 : 14,
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 6px rgba(0,0,0,0.6)',
                  }}
                />
              </div>

              {/* Fila tiempos + botones */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: isTizen ? '1.1rem' : '0.85rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ControlButton onClick={() => seekRelative(-60)} ariaLabel="-60s">
                    <span style={{ fontSize: '0.85em' }}>−60s</span>
                  </ControlButton>
                  <ControlButton onClick={() => seekRelative(-10)} ariaLabel="-10s">
                    <span style={{ fontSize: '0.85em' }}>−10s</span>
                  </ControlButton>
                  <ControlButton onClick={togglePlay} ariaLabel={playing ? 'Pausa' : 'Reproducir'} primary>
                    {playing ? (
                      <svg width={isTizen ? 28 : 20} height={isTizen ? 28 : 20} viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width={isTizen ? 28 : 20} height={isTizen ? 28 : 20} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </ControlButton>
                  <ControlButton onClick={() => seekRelative(10)} ariaLabel="+10s">
                    <span style={{ fontSize: '0.85em' }}>+10s</span>
                  </ControlButton>
                  <ControlButton onClick={() => seekRelative(60)} ariaLabel="+60s">
                    <span style={{ fontSize: '0.85em' }}>+60s</span>
                  </ControlButton>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {isTizen && (
                <div
                  style={{
                    marginTop: '0.6rem',
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.55)',
                    letterSpacing: '0.02em',
                  }}
                >
                  ◀ ▶ ±10s · ▲ ▼ ±60s · OK pausa · RETURN salir
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        video::-webkit-media-controls,
        video::-webkit-media-controls-enclosure,
        video::-webkit-media-controls-panel,
        video::-webkit-media-controls-overlay-play-button,
        video::-webkit-media-controls-start-playback-button,
        video::-internal-media-controls-overlay-cast-button { display: none !important; -webkit-appearance: none !important; }
      `}</style>
    </div>
  )
}

function ControlButton({
  onClick, ariaLabel, primary, children,
}: {
  onClick: () => void
  ariaLabel: string
  primary?: boolean
  children: React.ReactNode
}) {
  const size = isTizen ? (primary ? 56 : 44) : (primary ? 40 : 32)
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        marginRight: isTizen ? '0.9rem' : '0.5rem',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: primary ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.18)',
        color: primary ? '#000' : '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  )
}
