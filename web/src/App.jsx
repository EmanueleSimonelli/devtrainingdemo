import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DealList from './pages/DealList.jsx'
import DealDetail from './pages/DealDetail.jsx'
import AddDeal from './pages/AddDeal.jsx'
import Layout from './components/Layout.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DealList />} />
          <Route path="/deals/new" element={<AddDeal />} />
          <Route path="/deals/:dealId" element={<DealDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
