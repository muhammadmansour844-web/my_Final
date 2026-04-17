import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDash from './pages/AdminDash'
import CompanyDash from './pages/CompanyDash'
import PharmacyDash from './pages/PharmacyDash'

function App() {
  return (
    
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDash />} />
        <Route path="/company" element={<CompanyDash />} />
        <Route path="/pharmacy-dashboard" element={<PharmacyDash />} />
      </Routes>
    
  )
}

export default App