import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';

import Login from './pages/Login';
import Register from './pages/Register';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import AboutPage from './pages/public/AboutPage';
import FAQPage from './pages/public/FAQPage';
import ContactPage from './pages/public/ContactPage';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import FarmerDashboard from './pages/dashboards/FarmerDashboard';
import BuyerDashboard from './pages/dashboards/BuyerDashboard';
import TransporterDashboard from './pages/dashboards/TransporterDashboard';

// Sub-pages
import FarmForm from './pages/farmer/FarmForm';
import ProductForm from './pages/farmer/ProductForm';
import OrderList from './pages/farmer/OrderList';
import HarvestRecords from './pages/farmer/HarvestRecords';
import OrderHistory from './pages/buyer/OrderHistory';
import CategoryManager from './pages/admin/CategoryManager';
import PriceManager from './pages/admin/PriceManager';
import CatalogManager from './pages/admin/CatalogManager';
import VehicleSettings from './pages/transporter/VehicleSettings';
import ZoneSettings from './pages/transporter/ZoneSettings';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      {/* Auth Routes - No Layout wrap or custom wrap inside components */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public Pages - Wrapped in PublicLayout */}
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/faq" element={<PublicLayout><FAQPage /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
      
      {/* Protected Routes - Wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard/catalog" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CatalogManager />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard/categories" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CategoryManager />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard/prices" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PriceManager />
          </ProtectedRoute>
        } />
        <Route path="/farmer-dashboard" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/farmer/orders" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <OrderList />
          </ProtectedRoute>
        } />
        <Route path="/farmer-dashboard/farm/new" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmForm />
          </ProtectedRoute>
        } />
        <Route path="/farmer-dashboard/product/new" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <ProductForm />
          </ProtectedRoute>
        } />
        <Route path="/farmer-dashboard/harvests" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <HarvestRecords />
          </ProtectedRoute>
        } />
        <Route path="/buyer-dashboard" element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <BuyerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/buyer-dashboard/orders" element={
          <ProtectedRoute allowedRoles={['buyer']}>
            <OrderHistory />
          </ProtectedRoute>
        } />
        <Route path="/transporter-dashboard" element={
          <ProtectedRoute allowedRoles={['transporter']}>
            <TransporterDashboard />
          </ProtectedRoute>
        } />
        <Route path="/transporter-dashboard/vehicles" element={
          <ProtectedRoute allowedRoles={['transporter']}>
            <VehicleSettings />
          </ProtectedRoute>
        } />
        <Route path="/transporter-dashboard/zones" element={
          <ProtectedRoute allowedRoles={['transporter']}>
            <ZoneSettings />
          </ProtectedRoute>
        } />

        {/* Common */}
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
