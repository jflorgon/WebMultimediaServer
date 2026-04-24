interface EmptyStateProps {
  message?: string
  title?: string
  subtitle?: string
}

export function EmptyState({ message, title, subtitle }: EmptyStateProps) {
  const displayMessage = title || message || 'Sin resultados'
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <p className="text-lg">{displayMessage}</p>
      {subtitle && <p className="text-sm mt-2 max-w-md text-center">{subtitle}</p>}
    </div>
  )
}
