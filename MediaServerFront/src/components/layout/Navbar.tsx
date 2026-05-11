import { useState, useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useScannerStore } from '../../store/useScannerStore'

const isTizen = import.meta.env.VITE_TIZEN === 'true'

function exitApp() {
  try {
    window.tizen?.application?.getCurrentApplication().exit()
  } catch {
    window.close()
  }
}

export function Navbar() {
  const { t, i18n } = useTranslation()
  const { triggering, trigger } = useScannerStore()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-lg md:text-xl font-medium transition-colors duration-200 ${
      isActive ? 'text-white' : 'text-gray-300 hover:text-white'
    }`

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-colors duration-300"
      style={{
        paddingLeft: '4vw',
        paddingRight: '4vw',
        height: 'var(--navbar-h)',
        backgroundColor: scrolled ? 'rgba(20,20,20,0.97)' : 'transparent',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.8)' : 'none',
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="text-2xl font-black tracking-tighter select-none"
        style={{ color: 'var(--netflix-red)', fontStyle: 'italic' }}
      >
        MEDIASERVER
      </Link>

      {/* Links centrales — usamos marginRight en lugar de gap para Tizen TV (Chrome ~69 sin soporte de gap en flex) */}
      <div className="hidden md:flex items-center">
        <NavLink to="/" end className={linkClass} style={{ marginRight: '1.5rem' }}>{t('nav.home')}</NavLink>
        <NavLink to="/movies" className={linkClass} style={{ marginRight: '1.5rem' }}>{t('nav.movies')}</NavLink>
        <NavLink to="/series" className={linkClass} style={{ marginRight: '1.5rem' }}>{t('nav.series')}</NavLink>
        <NavLink to="/documentaries" className={linkClass}>{t('nav.documentaries')}</NavLink>
      </div>

      {/* Acciones derechas */}
      <div className="flex items-center">
        {/* Búsqueda expandible */}
        <div className="flex items-center" style={{ marginRight: '0.75rem' }}>
          {searchOpen && (
            <input
              ref={searchRef}
              type="text"
              placeholder={t('search.placeholder')}
              onBlur={() => setSearchOpen(false)}
              className="w-48 px-3 py-1.5 text-sm rounded bg-black/80 border border-white/30 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all duration-200"
              style={{ marginRight: '0.5rem' }}
            />
          )}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="text-gray-300 hover:text-white transition-colors"
            aria-label="Buscar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
        </div>

        {/* Escanear */}
        <button
          onClick={() => trigger()}
          disabled={triggering}
          className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
          style={{
            backgroundColor: triggering ? '#555' : 'var(--netflix-red)',
            color: 'white',
            marginRight: '0.75rem',
          }}
        >
          {triggering ? '⏳ Escaneando...' : '🔄 Escanear'}
        </button>

        {/* Toggle idioma */}
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
          className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
          style={isTizen ? { marginRight: '0.75rem' } : undefined}
        >
          {i18n.language === 'es' ? 'EN' : 'ES'}
        </button>

        {/* Salir (solo Tizen) */}
        {isTizen && (
          <button
            onClick={exitApp}
            aria-label={t('nav.exit', 'Salir')}
            title={t('nav.exit', 'Salir')}
            className="text-gray-300 hover:text-white transition-colors"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        )}
      </div>
    </nav>
  )
}
