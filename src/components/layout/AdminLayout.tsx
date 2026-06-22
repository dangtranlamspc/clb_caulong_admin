import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Menu, X, LogOut,
  ChevronRight, Shield, Bell, User,
  CalendarDays, ClipboardCheck, Trophy, Swords, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import { useAuthStore } from '../../stores/auth.store';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Thành viên', path: '/members', icon: Users },
  { label: 'Buổi đánh cầu', path: '/sessions', icon: CalendarDays },
  { label: 'Xác nhận TT', path: '/registrations', icon: ClipboardCheck },
  { label: 'Trận giao hữu', path: '/matches', icon: Swords },
  { label: 'Bảng xếp hạng level', path: '/leaderboard', icon: Trophy },
  { label: 'Rank', path: '/rankings/win-rate', icon: TrendingUp },
  { label: 'Báo cáo', path: '/reports', icon: TrendingUp },
  { label: 'Báo cáo guest', path: '/sessions/guest', icon: TrendingUp },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { }
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Admin Panel</p>
          <p className="text-slate-400 text-xs">CLB Cầu lông</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => {
          const active =
            location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 pb-4 border-t border-slate-700 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors p-1"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-slate-800 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-72 bg-slate-800 h-full shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative text-gray-400 hover:text-gray-600 p-1">
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user?.full_name}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}