import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Navbar() {
  const { t, i18n } = useTranslation()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-white">
        🎬 MediaServer
      </Link>
      <div className="flex items-center gap-6">
        <NavLink to="/" end className={linkClass}>{t('nav.home')}</NavLink>
        <NavLink to="/movies" className={linkClass}>{t('nav.movies')}</NavLink>
        <NavLink to="/series" className={linkClass}>{t('nav.series')}</NavLink>
        <NavLink to="/documentaries" className={linkClass}>{t('nav.documentaries')}</NavLink>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
          className="text-xs text-gray-500 hover:text-gray-300 uppercase"
        >
          {i18n.language === 'es' ? 'EN' : 'ES'}
        </button>
      </div>
    </nav>
  )
}
