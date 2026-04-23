import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: 'var(--netflix-black)' }}
    >
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
