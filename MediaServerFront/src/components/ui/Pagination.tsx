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
    <div className="flex items-center justify-center gap-3 mt-12">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="w-10 h-10 rounded-full border border-gray-600 text-white disabled:opacity-30 hover:border-white hover:text-white transition-colors disabled:cursor-not-allowed flex items-center justify-center"
      >
        ←
      </button>
      <span className="text-gray-400 text-sm px-4">
        {page} {t('pagination.of')} {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="w-10 h-10 rounded-full border border-gray-600 text-white disabled:opacity-30 hover:border-white hover:text-white transition-colors disabled:cursor-not-allowed flex items-center justify-center"
      >
        →
      </button>
    </div>
  )
}
