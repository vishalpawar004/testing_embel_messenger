import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { AdminChatFloatingButton } from './AdminHeader';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#F8F7F5]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <AdminChatFloatingButton />
    </div>
  );
}
