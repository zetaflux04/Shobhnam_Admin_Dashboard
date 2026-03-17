import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Artists from './pages/Artists';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Categories from './pages/Categories';
import BankVerifications from './pages/BankVerifications';
import Reviews from './pages/Reviews';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="artists" element={<Artists />} />
        <Route path="bank-verifications" element={<BankVerifications />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="reviews" element={<Reviews />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
