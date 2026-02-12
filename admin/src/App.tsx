import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import UsersList from './components/UsersList';
import RidersList from './components/RidersList';
import BookingsList from './components/BookingsList';
import './App.css';

// Placeholder for other pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
    <h1 className="text-3xl font-bold text-gray-300">{title}</h1>
    <p>This feature is coming soon.</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersList />} />
        <Route path="riders" element={<RidersList />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="live-map" element={<PlaceholderPage title="Live Map" />} />
        <Route path="allotment" element={<PlaceholderPage title="Dispatch / Allotment" />} />
        <Route path="ratings" element={<PlaceholderPage title="Ratings" />} />
        <Route path="coupons" element={<PlaceholderPage title="Coupons" />} />
        <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
