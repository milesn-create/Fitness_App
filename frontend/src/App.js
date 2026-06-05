import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Schedule from './pages/Schedule';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import TrainerDashboard from './pages/TrainerDashboard';
import TrainerProfile from './pages/TrainerProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfile from './pages/AdminProfile';
import Trainers from './pages/Trainers';
import About from './pages/About';
import './index.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Schedule />} />
        <Route path="/login" element={<Auth defaultTab="login" />} />
        <Route path="/register" element={<Auth defaultTab="register" />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<PrivateRoute roles={['client']}><Profile /></PrivateRoute>} />
        <Route path="/trainer" element={<PrivateRoute roles={['trainer','admin']}><TrainerDashboard /></PrivateRoute>} />
        <Route path="/trainer/profile" element={<PrivateRoute roles={['trainer','admin']}><TrainerProfile /></PrivateRoute>} />
        <Route path="/admin/profile" element={<PrivateRoute roles={['admin']}><AdminProfile /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/workouts" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/schedule" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/stats" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
