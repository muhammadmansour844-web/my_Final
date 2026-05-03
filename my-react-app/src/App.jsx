import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDash from './pages/AdminDash'
import CompanyDash from './pages/CompanyDash'
import PharmacyDash from './pages/PharmacyDash'
import PaymentPage from './pages/PaymentPage'
import ProductDetailLayout from './components/PharmacyComp/products/ProductDetailLayout'
import ProductBrowsingLayout from './components/PharmacyComp/products/ProductBrowsingLayout'
import DeliveryDash from './pages/DeliveryDash'

function App() {
  return (

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminDash />} />
        <Route path="/company" element={<CompanyDash />} />
        <Route path="/pharmacy-dashboard" element={<PharmacyDash />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/product-details" element={<ProductDetailLayout />} />
        <Route path="/product-browsing" element={<ProductBrowsingLayout />} />
        <Route path="/delivery-dashboard" element={<DeliveryDash />} />
      </Routes>

  )
}

export default App