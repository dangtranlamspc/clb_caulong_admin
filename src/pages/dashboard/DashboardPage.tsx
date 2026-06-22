import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, UserCheck, UserX, TrendingUp, Shield, Shirt } from 'lucide-react';
import { usersApi } from '../../api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const SHIRT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.dashboard()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = data?.monthly_registrations?.map((m: any) => ({
    month: format(new Date(m.month), 'MM/yyyy', { locale: vi }),
    'Thành viên mới': Number(m.count),
  })) || [];

  const shirtData = data?.shirt_size_distribution?.map((s: any) => ({
    name: s.shirt_size,
    value: Number(s.count),
  })) || [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống quản lý thành viên</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Tổng thành viên" value={stats?.total_members} color="bg-blue-500" />
        <StatCard icon={Shield} label="Tổng Admin" value={stats?.total_admins} color="bg-purple-500" />
        <StatCard icon={UserCheck} label="Đang hoạt động" value={stats?.active_members} color="bg-green-500" />
        <StatCard icon={UserX} label="Vô hiệu hóa" value={stats?.inactive_members} color="bg-red-400" />
        <StatCard icon={TrendingUp} label="Mới tháng này" value={stats?.new_members_this_month} color="bg-amber-500" />
        <StatCard
          icon={Users}
          label="Giới tính"
          value={`${stats?.male_members}N / ${stats?.female_members}Nữ`}
          color="bg-cyan-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly registrations */}
        <div className="card xl:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Đăng ký theo tháng (12 tháng gần nhất)</h3>
          {monthlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Thành viên mới" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Shirt size distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-800">Phân bổ size áo</h3>
          </div>
          {shirtData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={shirtData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                  {shirtData.map((_: any, i: number) => (
                    <Cell key={i} fill={SHIRT_COLORS[i % SHIRT_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
