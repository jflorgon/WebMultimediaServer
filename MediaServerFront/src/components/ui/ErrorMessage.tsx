interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded-md bg-red-900/40 border border-red-700 p-4 text-red-300 text-sm">
      {message}
    </div>
  )
}
