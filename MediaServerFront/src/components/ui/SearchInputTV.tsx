import { useEffect, useRef, useState } from 'react'

const isTizen = import.meta.env.VITE_TIZEN === 'true'

interface SearchInputTVProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

// En Tizen el IME se despliega automáticamente al recibir foco un <input>.
// Para evitarlo cuando solo se navega con flechas, mostramos un botón con
// aspecto de input y solo intercambiamos a <input> real cuando el usuario
// pulsa Enter (botón central). Al perder foco volvemos al botón.
export function SearchInputTV({ value, onChange, placeholder, className }: SearchInputTVProps) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  if (!isTizen) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault()
            inputRef.current?.blur()
          }
        }}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={className}
      style={{ textAlign: 'left' }}
    >
      {value || <span style={{ color: '#9ca3af' }}>{placeholder}</span>}
    </button>
  )
}
