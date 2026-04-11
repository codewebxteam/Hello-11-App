import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import UsersList from './components/UsersList';
import RidersList from './components/RidersList';
import BookingsList from './components/BookingsList';
import LiveMapPage from './components/LiveMapPage';
import DispatchPage from './components/DispatchPage';
import RatingsPage from './components/RatingsPage';
import CouponsPage from './components/CouponsPage';
import AnalyticsPage from './components/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import FinanceReport from './components/FinanceReport';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersList />} />
        <Route path="riders" element={<RidersList />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="live-map" element={<LiveMapPage />} />
        <Route path="allotment" element={<DispatchPage />} />
        <Route path="ratings" element={<RatingsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="finance" element={<FinanceReport />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
