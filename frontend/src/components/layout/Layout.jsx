import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-ikn-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
