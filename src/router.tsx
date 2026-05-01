import { Routes, Route } from 'react-router-dom'

import Homepage from './pages/homepage'
import BattlePass from './pages/battle_pass'
import About from './pages/about'
import PrivacyPolicy from './pages/privacy_policy'


function Router() {
  return (
    <Routes>
        <Route path="/" element={<Homepage />} /> 
        <Route path="/battle-pass" element={<BattlePass />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </Routes>
  )
}

export default Router