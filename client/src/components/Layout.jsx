import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  TreePine,
  Megaphone,
  Laptop,
  Briefcase,
  GraduationCap,
  Target,
  Star,
  FolderKanban,
  DollarSign,
  FileText,
  Settings,
  Users as UsersIcon,
  Bell,
  ScrollText,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import dayjs from 'dayjs';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', admin: false },
  { to: '/employees', icon: Users, label: 'Employees', admin: false },
  { to: '/departments', icon: Building2, label: 'Departments', admin: false },
  { to: '/attendance', icon: Clock, label: 'Attendance', admin: false },
  { to: '/leaves', icon: CalendarDays, label: 'Leaves', admin: false },
  { to: '/holidays', icon: CalendarDays, label: 'Holidays', admin: false },
  { to: '/org-chart', icon: TreePine, label: 'Org Chart', admin: false },
  { to: '/announcements', icon: Megaphone, label: 'Announcements', admin: false },
  { to: '/assets', icon: Laptop, label: 'Assets', admin: false },
  { to: '/recruitment', icon: Briefcase, label: 'Recruitment', admin: false },
  { to: '/training', icon: GraduationCap, label: 'Training', admin: false },
  { to: '/goals', icon: Target, label: 'Goals', admin: false },
  { to: '/performance', icon: Star, label: 'Performance', admin: false },
  { to: '/projects', icon: FolderKanban, label: 'Projects', admin: false },
  { to: '/payroll', icon: DollarSign, label: 'Payroll', admin: false },
  { to: '/timesheets', icon: FileText, label: 'Timesheets', admin: false },
  { to: '/settings', icon: Settings, label: 'Settings', admin: false },
  { to: '/users', icon: UsersIcon, label: 'Users', admin: true },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Logs', admin: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/api/leaves/calendar/upcoming?mine=true').then((res) => {
      // could use for upcoming leave display
    }).catch(() => {});
  }, [api]);

  useEffect(() => {
    api
      .get('/api/auth/me', { auth: false })
      .then((res) => {
        setNotifCount(res.data?.notifications?.length || 0);
      })
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    api
      .get('/api/leaves/calendar/upcoming?mine=true')
      .then((res) => {
        if (res.data?.data) {
          setNotifications(
            res.data.data.slice(0, 5).map((l) => ({
              id: l._id,
              title: 'Leave: ' + l.leaveType?.name,
              message: `${l.employee?.fullName}: ${dayjs(l.startDate).format('MMM D')} – ${dayjs(l.endDate).format('MMM D')}`,
              type: 'leave',
              link: '/leaves',
              read: false,
            }))
          );
        }
      })
      .catch(() => {});
  }, [api]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarWidth = 260;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200
          transition-transform duration-200 ease-in-out lg:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-gray-900">EMS</span>
          </div>
          <button
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Main Menu
          </p>
          {navItems
            .filter((item) => !item.admin || (user?.role === 'admin' || user?.role === 'hr'))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                    transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </NavLink>
              );
            })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
              {user?.employee?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.employee?.fullName || user?.email}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navItems.find((n) => location.pathname === n.to)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NavLink
              to="/notifications"
              className="relative rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Bell className="h-5 w-5" />
              {notifCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </NavLink>

            {/* Settings quick */}
            <NavLink
              to="/settings"
              className="hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:block"
            >
              <Settings className="h-5 w-5" />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Notifications panel */}
      {notifications.length > 0 && (
        <div className="fixed right-4 top-20 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => navigate('/notifications')}
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 ${
                  n.read ? 'bg-white' : 'bg-primary/5'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
