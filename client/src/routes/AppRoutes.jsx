import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/common/Landing';
import Login from '../pages/common/Login';
import AdminLogin from '../pages/common/AdminLogin';
import HospitalLogin from '../pages/common/HospitalLogin';
import PatientLogin from '../pages/common/PatientLogin';
import Unauthorized from '../pages/common/Unauthorized';
import HospitalDashboard from '../pages/hospital/HospitalDashboard';
import CreateRequest from '../pages/hospital/CreateRequest';
import RequestStatus from '../pages/hospital/RequestStatus';
import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientCreateRequest from '../pages/patient/CreateRequest';
import Repayment from '../pages/patient/Repayment';
import AdminDashboard from '../pages/admin/AdminDashboard';
import HospitalVerification from '../pages/admin/HospitalVerification';
import CreditMonitor from '../pages/admin/CreditMonitor';
import ProtectedRoute from '../auth/ProtectedRoute';

export default function AppRoutes(){
  return (
    <Routes>
      <Route path="/" element={<Landing/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/login/admin" element={<AdminLogin/>} />
      <Route path="/login/hospital" element={<HospitalLogin/>} />
      <Route path="/login/patient" element={<PatientLogin/>} />
      <Route path="/unauthorized" element={<Unauthorized/>} />

      <Route path="/hospital" element={<ProtectedRoute role="hospital"><HospitalDashboard/></ProtectedRoute>} />
      <Route path="/hospital/create" element={<ProtectedRoute role="hospital"><CreateRequest/></ProtectedRoute>} />
      <Route path="/hospital/status" element={<ProtectedRoute role="hospital"><RequestStatus/></ProtectedRoute>} />

      <Route path="/patient" element={<ProtectedRoute role="patient"><PatientDashboard/></ProtectedRoute>} />
      <Route path="/patient/create-request" element={<ProtectedRoute role="patient"><PatientCreateRequest/></ProtectedRoute>} />
      <Route path="/patient/repayment" element={<ProtectedRoute role="patient"><Repayment/></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard/></ProtectedRoute>} />
      <Route path="/admin/verify" element={<ProtectedRoute role="admin"><HospitalVerification/></ProtectedRoute>} />
      <Route path="/admin/credit" element={<ProtectedRoute role="admin"><CreditMonitor/></ProtectedRoute>} />

      <Route path="*" element={<div>Not found</div>} />
    </Routes>
  )
}
