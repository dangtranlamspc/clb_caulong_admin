import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Menu, X, LogOut,
  ChevronRight, Bell, User,
  CalendarDays, Trophy, Swords,
  ChevronDown,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import { useAuthStore } from '../../stores/auth.store';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Thành viên', path: '/members', icon: Users },
  { label: 'Buổi đánh cầu', path: '/sessions', icon: CalendarDays },
  { label: 'Trận giao hữu', path: '/matches', icon: Swords },
  { label: 'BXH', path: '/rankings/win-rate', icon: Trophy },
  {
    label: 'Ví',
    icon: Wallet,
    children: [
      { label: 'Duyệt nạp tiền', path: '/wallets/deposits' },
      { label: 'Tổng hợp', path: '/wallets/summary' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { }
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isChildActive = (children?: { path: string }[]) =>
    children?.some(c => location.pathname === c.path || location.pathname.startsWith(c.path)) ?? false;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full bg-[#0f1420] ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
          <img
            src="https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782199056/icon_home-fn_z1thtm.png"
            alt="Logo CLB"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight tracking-tight">Admin Panel</p>
          <p className="text-slate-500 text-[11px] font-medium">CLB Cầu Lông</p>
        </div>
      </div>

      {/* Court-line style divider */}
      <div className="mx-5 border-t border-dashed border-slate-700/60" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Điều hướng
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            const childActive = isChildActive(item.children);
            const isOpen = openMenus[item.label] ?? childActive;

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${childActive
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${childActive ? 'text-emerald-400' : ''}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="mt-0.5 ml-[22px] pl-4 border-l border-slate-700/60 space-y-0.5 py-0.5">
                      {item.children.map((child) => {
                        const active =
                          location.pathname === child.path ||
                          location.pathname.startsWith(child.path);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${active
                              ? 'text-white font-semibold'
                              : 'text-slate-500 hover:text-slate-200'
                              }`}
                          >
                            {active && (
                              <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                            <span className="flex-1">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const active =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path!));
          return (
            <Link
              key={item.path}
              to={item.path!}
              onClick={() => setSidebarOpen(false)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
                ? 'bg-emerald-400 text-[#0f1420] font-semibold shadow-sm shadow-emerald-900/30'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? '' : 'group-hover:text-slate-200'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 pb-4 pt-3">
        <div className="mx-2 mb-3 border-t border-dashed border-slate-700/60" />
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-[#f4d35e]/70">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
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
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay - luôn render, dùng transition để trượt vào/ra */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ease-out ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`relative flex flex-col w-72 h-full shadow-2xl transform transition-transform duration-300 ease-out will-change-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          <Sidebar mobile />
        </div>
      </div>

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
          <button className="relative text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
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