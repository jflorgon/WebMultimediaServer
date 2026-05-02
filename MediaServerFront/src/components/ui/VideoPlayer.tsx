import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  src: string
  title: string
  onClose: () => void
}

export function VideoPlayer({ src, title: _title, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls({ manifestLoadingTimeOut: 120000, manifestLoadingMaxRetry: 3 })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setReady(true)
        video.play().catch(() => {})
        // Pantalla completa automática al iniciar la reproducción
        try { video.requestFullscreen?.() } catch { /* no-op */ }
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
        try { video.requestFullscreen?.() } catch { /* no-op */ }
      })
    }
  }, [src])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      // Escape / botón Return de Tizen → cerrar
      if (e.key === 'Escape' || e.keyCode === 10009) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      // Flecha izq/der → ±10s
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
      // OK / Enter / Espacio → play/pause
      if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13) {
        e.preventDefault()
        e.stopPropagation()
        if (video.paused) video.play().catch(() => {})
        else video.pause()
        return
      }
      // Flecha arriba/abajo → ±60s (saltos largos)
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
    // Captura para interceptar antes que useTizenRemote
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) document.exitFullscreen()
    else video.requestFullscreen()
  }

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
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 12, zIndex: 1 }}>
        <button
          onClick={toggleFullscreen}
          title="Pantalla completa"
          style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 18 }}
        >
          ⛶
        </button>
        <button
          onClick={onClose}
          title="Cerrar"
          style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 18 }}
        >
          ✕
        </button>
      </div>

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
            controls
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
            }}
          />
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
