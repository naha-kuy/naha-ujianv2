import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../views/pages/LoginPage";
import RegisterPage from "../views/pages/RegisterPage";
import AdminDashboard from "../views/pages/AdminDashboard";
import GuruDashboard from "../views/pages/GuruDashboard";
import SiswaDashboard from "../views/pages/SiswaDashboard";
import ProtectedRoute from "../views/components/ProtectedRoute";

export default function RouteController() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guru"
          element={
            <ProtectedRoute role="guru">
              <GuruDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/siswa"
          element={
            <ProtectedRoute role="siswa">
              <SiswaDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
