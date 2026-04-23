import { useTranslation } from 'react-i18next'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600 transition-colors"
      >
        {t('pagination.previous')}
      </button>
      <span className="text-gray-400 text-sm">
        {page} {t('pagination.of')} {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600 transition-colors"
      >
        {t('pagination.next')}
      </button>
    </div>
  )
}
