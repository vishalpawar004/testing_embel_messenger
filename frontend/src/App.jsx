import './App.css'
import { BrowserRouter } from 'react-router-dom'
import AdminRoutes from './admin/routes/AdminRoutes'

function App() {
  return (
    <BrowserRouter>
      <AdminRoutes />
    </BrowserRouter>
  )
}

export default App
