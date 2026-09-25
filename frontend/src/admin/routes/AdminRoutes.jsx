import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from '../auth/pages/AdminLogin';
import AdminLayout from '../layout/AdminLayout';
import AdminDashboard from '../dashboard/pages/AdminDashboard';
import UsersList from '../users/pages/UsersList';
import UserDetails from '../users/pages/UserDetails';
import GroupsList from '../groups/pages/GroupsList';
import GroupDetails from '../groups/pages/GroupDetails';
import ReportsList from '../reports/pages/ReportsList';
import ReportDetails from '../reports/pages/ReportDetails';
import ReportedMessages from '../messages/pages/ReportedMessages';
import MessageDetails from '../messages/pages/MessageDetails';
import MediaManagement from '../media/pages/MediaManagement';
import StorageOverview from '../media/pages/StorageOverview';
import NotificationsList from '../notifications/pages/NotificationsList';
import CreateNotification from '../notifications/pages/CreateNotification';
import AdminsList from '../admins/pages/AdminsList';
import AdminDetails from '../admins/pages/AdminDetails';
import AuditLogs from '../logs/pages/AuditLogs';
import AdminSettings from '../settings/pages/AdminSettings';
import AdminChat from '../chat/pages/AdminChat';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/chat" element={<AdminChat />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="users/:userId" element={<UserDetails />} />
        <Route path="groups" element={<GroupsList />} />
        <Route path="groups/:groupId" element={<GroupDetails />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/:reportId" element={<ReportDetails />} />
        <Route path="messages" element={<ReportedMessages />} />
        <Route path="messages/:messageId" element={<MessageDetails />} />
        <Route path="media" element={<MediaManagement />} />
        <Route path="media/storage" element={<StorageOverview />} />
        <Route path="notifications" element={<NotificationsList />} />
        <Route path="notifications/create" element={<CreateNotification />} />
        <Route path="admins" element={<AdminsList />} />
        <Route path="admins/:adminId" element={<AdminDetails />} />
        <Route path="logs" element={<AuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
