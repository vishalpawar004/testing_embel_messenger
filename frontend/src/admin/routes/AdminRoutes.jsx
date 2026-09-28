import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from '../auth/pages/AdminLogin';



import AdminChat from '../chat/pages/AdminChat';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/chat" element={<AdminChat />} >
     
      <Route index element={<Navigate to="dashboard" replace />} />
    
   
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
