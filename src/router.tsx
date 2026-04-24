import { Routes, Route } from 'react-router-dom'

import Homepage from './pages/homepage'
import BattlePass from './pages/battle_pass'


function Router() {
  return (
    <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/battle-pass" element={<BattlePass />} />
    </Routes>
  )
}

export default Router