import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Crown, User, UserRound, CalendarDays, Wallet, ChevronDown,
  Megaphone, Trophy, Banknote, CalendarCheck2, MapPin, Flame, BadgeCheck,
} from 'lucide-react';
import { usersApi, sessionsApi, walletAdminApi, rankingsApi } from '../../api';
import { useAuthStore } from '../../stores/auth.store';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type LeaderRow = {
  id: string;
  full_name: string;
  rank_label: string;
  points: number;
  badge: 'fire' | 'verified' | null;
};

type NotificationRow = {
  id: string;
  icon: 'megaphone' | 'trophy' | 'money' | 'calendar';
  title: string;
  message: string;
  is_new: boolean;
};

type EventRow = {
  id: string;
  day: string;
  month: string;
  color: 'orange' | 'green' | 'purple';
  title: string;
  time: string;
  location: string;
};

const NOTIF_ICON_STYLE: Record<NotificationRow['icon'], { bg: string; icon: any }> = {
  megaphone: { bg: 'bg-blue-50 text-blue-500', icon: Megaphone },
  trophy: { bg: 'bg-purple-50 text-purple-500', icon: Trophy },
  money: { bg: 'bg-emerald-50 text-emerald-500', icon: Banknote },
  calendar: { bg: 'bg-cyan-50 text-cyan-500', icon: CalendarCheck2 },
};

const EVENT_COLOR_STYLE: Record<EventRow['color'], string> = {
  orange: 'bg-orange-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
};

const FINANCE_PERIOD_OPTIONS = [
  { value: 1, label: '1 tháng' },
  { value: 3, label: '3 tháng' },
  { value: 6, label: '6 tháng' },
  { value: 9, label: '9 tháng' },
  { value: 12, label: '1 năm' },
];

function StatCard({ icon: Icon, iconBg, label, value, deltaLabel }: {
  icon: any; iconBg: string; label: string; value: number | string; deltaLabel?: string;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1 leading-tight">{value}</p>
        {deltaLabel && (
          <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <span>▲</span>
            <span>{deltaLabel}</span>
            <span className="text-gray-400 font-normal">so với tháng trước</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [totalMembers, setTotalMembers] = useState(0);

  const [memberBreakdown, setMemberBreakdown] = useState({
    vip: 0, thuong: 0, vang_lai: 0,
  });

  const [sessionCounts, setSessionCounts] = useState({ today: 0, this_week: 0, this_month: 0 });
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [monthlyFinance, setMonthlyFinance] = useState({ income: 0, expense: 0 });

  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);

  const [notifications] = useState<NotificationRow[]>([
    { id: '1', icon: 'megaphone', title: 'Lịch đánh cuối tuần', message: 'Lịch đánh thứ 7 & chủ nhật (18-19/05) đã được cập nhật.', is_new: true },
    { id: '2', icon: 'trophy', title: 'Giải nội bộ tháng 6', message: 'Giải đấu nội bộ sẽ diễn ra vào ngày 08/06...', is_new: true },
    { id: '3', icon: 'money', title: 'Thông báo thu phí tháng 6', message: 'Phí sinh hoạt tháng 6 sẽ được thu từ 01/06 - 05/06...', is_new: false },
    { id: '4', icon: 'calendar', title: 'Sân mới được đặt', message: 'Sân Tada 3 & 4 đã được đặt vào các khung giờ tối...', is_new: false },
  ]);

  const [events] = useState<EventRow[]>([
    { id: '1', day: '25', month: 'MAY', color: 'orange', title: 'Giải cầu lông mở rộng CLB', time: '07:30 - 17:00', location: 'Nhà thi đấu Quận Tân Bình' },
    { id: '2', day: '01', month: 'JUN', color: 'green', title: 'Tiệc sinh nhật CLB tháng 6', time: '18:00 - 22:00', location: 'Nhà hàng Hoa Sứ' },
    { id: '3', day: '08', month: 'JUN', color: 'purple', title: 'Giải nội bộ tháng 6', time: '07:30 - 17:00', location: 'Sân cầu lông Khang An' },
  ]);

  const [leaderTab, setLeaderTab] = useState<'points' | 'revice'>('points');


  const [financePeriod, setFinancePeriod] = useState(6);
  const [financeYear, setFinanceYear] = useState(new Date().getFullYear());
  const [financeYears, setFinanceYears] = useState<number[]>([new Date().getFullYear()]);
  const [financeChartData, setFinanceChartData] = useState<{ month: string; Thu: number; Chi: number }[]>([]);
  const [financeChartLoading, setFinanceChartLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const iso = (d: Date) => format(d, 'yyyy-MM-dd');

    Promise.allSettled([
      usersApi.dashboard(),
      usersApi.memberTypeCounts(),
      sessionsApi.list({ from_date: iso(startOfDay), to_date: iso(startOfDay), limit: 1, page: 1 }),
      sessionsApi.list({ from_date: iso(startOfWeek), to_date: iso(endOfWeek), limit: 1, page: 1 }),
      sessionsApi.list({ from_date: iso(startOfMonth), to_date: iso(endOfMonth), limit: 1, page: 1 }),
      walletAdminApi.getSummary(),
      rankingsApi.rankLeaderboard(),
      walletAdminApi.getMonthlyFinance(),
    ]).then((results) => {
      const [
        dashboardRes, countsRes,
        todayRes, weekRes, monthRes, walletRes, leaderboardRes, financeRes,
      ] = results;

      if (dashboardRes.status === 'fulfilled') setStats((dashboardRes.value as any).data);
      else console.error('usersApi.dashboard() failed:', (dashboardRes as any).reason);

      if (countsRes.status === 'fulfilled') {
        const c = (countsRes.value as any).data;
        setMemberBreakdown({ vip: c.vip ?? 0, thuong: c.thuong ?? 0, vang_lai: c.vang_lai ?? 0 });
        setTotalMembers(c.total ?? 0);
      } else {
        console.error('memberTypeCounts() failed:', (countsRes as any).reason);
      }

      setSessionCounts({
        today: todayRes.status === 'fulfilled' ? (todayRes.value as any)?.data?.meta?.total ?? 0 : 0,
        this_week: weekRes.status === 'fulfilled' ? (weekRes.value as any)?.data?.meta?.total ?? 0 : 0,
        this_month: monthRes.status === 'fulfilled' ? (monthRes.value as any)?.data?.meta?.total ?? 0 : 0,
      });

      if (walletRes.status === 'fulfilled') setWalletSummary((walletRes.value as any).data);

      if (leaderboardRes.status === 'fulfilled') {
        const rows = ((leaderboardRes.value as any).data ?? []) as any[];
        setLeaderboard(
          rows.slice(0, 5).map((r) => ({
            id: r.id,
            full_name: r.full_name ?? 'Chưa rõ tên',
            rank_label: r.tier ?? '—',
            points: r.total_points ?? 0,
            badge: null,
          })),
        );
      }

      if (financeRes.status === 'fulfilled') {
        const f = (financeRes.value as any).data;
        setMonthlyFinance({ income: f?.income ?? 0, expense: f?.expense ?? 0 });
      }
    }).finally(() => setLoading(false));
  }, []);

  // Danh sách năm có dữ liệu — nạp 1 lần
  useEffect(() => {
    walletAdminApi.getFinanceYears()
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) setFinanceYears(data);
      })
      .catch(() => { });
  }, []);

  // Lịch sử thu/chi theo tháng — nạp lại mỗi khi đổi kỳ hạn hoặc năm
  useEffect(() => {
    setFinanceChartLoading(true);
    walletAdminApi.getFinanceHistory({ months: financePeriod, year: financeYear })
      .then(({ data }) => {
        const rows = Array.isArray(data) ? data : [];
        setFinanceChartData(
          rows.map((r: any) => ({
            month: `Th.${r.month}`,
            Thu: r.income ?? 0,
            Chi: r.expense ?? 0,
          })),
        );
      })
      .catch(() => setFinanceChartData([]))
      .finally(() => setFinanceChartLoading(false));
  }, [financePeriod, financeYear]);

  const todayLabel = format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {user?.full_name ?? 'Admin'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Chúc bạn một ngày thi đấu hiệu quả!</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors capitalize">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          {todayLabel}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconBg="bg-blue-500"
          label="Tổng thành viên"
          value={totalMembers}
          deltaLabel={stats?.new_members_this_month ? `${stats.new_members_this_month} thành viên mới` : undefined}
        />
        <StatCard
          icon={Crown}
          iconBg="bg-emerald-500"
          label="Thành viên VIP"
          value={memberBreakdown.vip}
          deltaLabel={undefined}
        />
        <StatCard
          icon={User}
          iconBg="bg-violet-400"
          label="Thành viên thường"
          value={memberBreakdown.thuong}
        />
        <StatCard
          icon={UserRound}
          iconBg="bg-orange-400"
          label="Thành viên vãng lai"
          value={memberBreakdown.vang_lai}
        />
      </div>

      {/* Middle row: Buổi đánh / Tài chính / Biểu đồ thu chi */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Buổi đánh */}
        <div className="card relative overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Buổi đánh</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 relative z-10">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium">Hôm nay</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">{sessionCounts.today}</p>
              <p className="text-xs text-gray-400">buổi</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium">Tuần này</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{sessionCounts.this_week}</p>
              <p className="text-xs text-gray-400">buổi</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium">Tháng này</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{sessionCounts.this_month}</p>
              <p className="text-xs text-gray-400">buổi</p>
            </div>
          </div>

          <span className="absolute -bottom-2 -right-2 text-6xl opacity-10 select-none pointer-events-none">🏸</span>

          <p className="text-xs text-emerald-500 font-medium mt-5 flex items-center gap-1">
            <span>▲</span> 10% so với tháng trước
          </p>
        </div>

        {/* Tài chính */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tài chính</h3>
            </div>
            <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-50">
              {format(new Date(), 'MM/yyyy')}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium">Thu tháng này</p>
              <p className="text-lg font-bold text-emerald-500 mt-1">
                {monthlyFinance.income.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium">Chi tháng này</p>
              <p className="text-lg font-bold text-red-500 mt-1">
                {monthlyFinance.expense.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-dashed border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-medium">Quỹ còn lại</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">
                {(walletSummary?.club_balance ?? 0).toLocaleString('vi-VN')}đ
              </p>
            </div>
            <span className="text-3xl select-none">💰</span>
          </div>
        </div>

        {/* Biểu đồ thu chi */}
        <div className="card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Biểu đồ thu chi</h3>
            <div className="flex items-center gap-2">
              <select
                value={financePeriod}
                onChange={(e) => setFinancePeriod(Number(e.target.value))}
                className="text-[11px] font-medium text-gray-600 border border-gray-200 rounded-full pl-2.5 pr-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {FINANCE_PERIOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={financeYear}
                onChange={(e) => setFinanceYear(Number(e.target.value))}
                className="text-[11px] font-medium text-gray-600 border border-gray-200 rounded-full pl-2.5 pr-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {financeYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Thu</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Chi</span>
          </div>

          {financeChartLoading ? (
            <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">Đang tải...</div>
          ) : financeChartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={financeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`}
                />
                <Tooltip formatter={(v: number) => v.toLocaleString('vi-VN') + 'đ'} />
                <Line type="monotone" dataKey="Thu" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Chi" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: Bảng xếp hạng / Thông báo / Sự kiện */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bảng xếp hạng */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Bảng xếp hạng</h3>
          </div>
          <div className="flex items-center gap-4 border-b border-gray-100 mb-3 text-sm">
            <button
              onClick={() => setLeaderTab('points')}
              className={`pb-2 -mb-px border-b-2 font-medium transition-colors ${leaderTab === 'points' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              Top điểm
            </button>
            <button
              onClick={() => setLeaderTab('revice')}
              className={`pb-2 -mb-px border-b-2 font-medium transition-colors ${leaderTab === 'revice' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              Top chuyền cần
            </button>
          </div>

          <div className="space-y-1 flex-1">
            {leaderboard.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 py-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'text-gray-400'
                    }`}
                >
                  {idx === 0 ? <Flame className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1">
                    {p.full_name}
                    {p.badge === 'verified' && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  </p>
                  <p className="text-[11px] text-gray-400">Rank: {p.rank_label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{p.points.toLocaleString('vi-VN')}</p>
                  <p className="text-[10px] text-gray-400">điểm</p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Xem đầy đủ bảng xếp hạng →
          </button>
        </div>

        {/* Thông báo mới nhất */}
        <div className="card flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Thông báo mới nhất</h3>
          <div className="space-y-3 flex-1">
            {notifications.map((n) => {
              const style = NOTIF_ICON_STYLE[n.icon];
              const Icon = style.icon;
              return (
                <div key={n.id} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-400 truncate">{n.message}</p>
                  </div>
                  {n.is_new && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
          <button className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Xem tất cả thông báo →
          </button>
        </div>

        {/* Sự kiện sắp tới */}
        <div className="card flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Sự kiện sắp tới</h3>
          <div className="space-y-5 flex-1">
            {events.map((e, idx) => (
              <div key={e.id} className="flex gap-3 relative">
                {idx !== events.length - 1 && (
                  <span className="absolute left-[19px] top-10 bottom-[-20px] w-px bg-gray-100" />
                )}
                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0 ${EVENT_COLOR_STYLE[e.color]}`}>
                  <span className="text-sm font-bold leading-none">{e.day}</span>
                  <span className="text-[9px] leading-none mt-0.5">{e.month}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{e.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{e.time}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {e.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Xem tất cả sự kiện →
          </button>
        </div>
      </div>
    </div>
  );
}