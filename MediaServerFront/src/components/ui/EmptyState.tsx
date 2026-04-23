interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = 'Sin resultados' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <p className="text-lg">{message}</p>
    </div>
  )
}
