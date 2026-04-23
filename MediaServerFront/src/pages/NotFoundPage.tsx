import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-gray-700 mb-4">404</p>
      <p className="text-xl text-gray-400 mb-8">{t('errors.notFound')}</p>
      <Link to="/" className="px-6 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
        Ir al inicio
      </Link>
    </div>
  )
}
