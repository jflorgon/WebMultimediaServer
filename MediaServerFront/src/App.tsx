import { AppRouter } from './routes/AppRouter'
import { useTizenRemote } from './hooks/useTizenRemote'

const isTizen = import.meta.env.VITE_TIZEN === 'true'

export default function App() {
  useTizenRemote(isTizen)
  return <AppRouter />
}
