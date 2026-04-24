interface CarouselNavigationProps {
  onPrevClick: () => void
  onNextClick: () => void
}

const btnClass =
  'absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center ' +
  'w-[3.5vw] min-w-[28px] max-w-[44px] h-16 ' +
  'bg-black/60 hover:bg-black/80 text-white text-2xl font-bold ' +
  'transition-colors cursor-pointer select-none'

export function CarouselNavigation({ onPrevClick, onNextClick }: CarouselNavigationProps) {
  return (
    <>
      <button
        onClick={onPrevClick}
        className={`${btnClass} left-0`}
        aria-label="Anterior"
      >
        ‹
      </button>
      <button
        onClick={onNextClick}
        className={`${btnClass} right-0`}
        aria-label="Siguiente"
      >
        ›
      </button>
    </>
  )
}
