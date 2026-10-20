import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Holidays from './pages/Holidays';
import OrgChart from './pages/OrgChart';
import Announcements from './pages/Announcements';
import Assets from './pages/Assets';
import Recruitment from './pages/Recruitment';
import Training from './pages/Training';
import Goals from './pages/Goals';
import PerformanceReviews from './pages/PerformanceReviews';
import Projects from './pages/Projects';
import Payroll from './pages/Payroll';
import Timesheets from './pages/Timesheets';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(useAuth().user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected routes */}
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
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="org-chart" element={<OrgChart />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="assets" element={<Assets />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="training" element={<Training />} />
        <Route path="goals" element={<Goals />} />
        <Route path="performance" element={<PerformanceReviews />} />
        <Route path="projects" element={<Projects />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<ProtectedRoute roles={['admin', 'hr']}><Users /></ProtectedRoute>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
