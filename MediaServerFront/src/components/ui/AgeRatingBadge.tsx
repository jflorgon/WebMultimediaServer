interface Parsed {
  label?: string
  age?: string
  ageSuffix?: string
}

/**
 * Mapea el código de TMDB (ES o US, ver ITmdbClientService) a una descripción
 * en castellano más una "edad" visualizable en badge cuando aplica.
 */
function parseAgeRating(raw: string): Parsed | null {
  const v = raw.trim().toUpperCase()
  if (!v) return null

  // Apta para todos
  if (['APTA', 'TP', 'A', 'G', 'U'].includes(v)) {
    return { label: 'Apta para todos los públicos' }
  }

  // Numérico estilo español: "7", "+7", "12", "+12", "16", "+16", "18", "+18"
  const num = v.match(/^\+?(\d+)$/)
  if (num) {
    return { age: num[1], ageSuffix: '+' }
  }

  // PG-13, TV-14, TV-MA, etc.
  const pg = v.match(/^(?:PG-|TV-)?(\d+)$/)
  if (pg) {
    return { age: pg[1], ageSuffix: '+' }
  }

  if (v === 'PG') return { label: 'Se sugiere supervisión paterna' }
  if (v === 'R') return { label: 'Restringida (menores acompañados)' }
  if (v === 'NC-17') return { label: 'Solo adultos' }
  if (v === 'NR' || v === 'UR') return null

  // Formato desconocido → mostrar tal cual como código
  return { age: raw }
}

interface Props {
  ageRating?: string | null
}

export function AgeRatingBadge({ ageRating }: Props) {
  if (!ageRating) return null
  const parsed = parseAgeRating(ageRating)
  if (!parsed) return null

  const ariaParts = [
    parsed.label,
    parsed.age ? `${parsed.age}${parsed.ageSuffix ?? ''}` : null,
  ].filter(Boolean)

  return (
    <span
      className="inline-flex items-center text-gray-300"
      style={{ gap: '0.4rem' }}
      aria-label={`Clasificación por edad: ${ariaParts.join(' ')}`}
    >
      {parsed.label && <span>{parsed.label}</span>}
      {parsed.age && (
        <span
          className="inline-flex items-center text-white font-bold border border-white/60 rounded"
          style={{ padding: '0.05rem 0.45rem', letterSpacing: '0.05em' }}
        >
          {parsed.age}{parsed.ageSuffix ?? ''}
        </span>
      )}
    </span>
  )
}
