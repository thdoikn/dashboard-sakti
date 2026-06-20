import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import SatkerDetail from './pages/SatkerDetail'
import SatkerManagement from './pages/SatkerManagement'

// No authentication — internal tool, access restricted via OIKN network only
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="satker-detail" element={<SatkerDetail />} />
          <Route path="satker-management" element={<SatkerManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
