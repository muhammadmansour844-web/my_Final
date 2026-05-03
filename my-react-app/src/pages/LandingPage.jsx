import React from 'react'
import Landingheader from '../components/Landingcomp/Landingheader.jsx'
import Landingmain from '../components/Landingcomp/Landingmain.jsx'
import Landingfooter from '../components/Landingcomp/Landingfooter.jsx'
function LandingPage() {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <Landingheader/>
        <Landingmain/>
        <Landingfooter/>
    </div>
  )
}

export default LandingPage