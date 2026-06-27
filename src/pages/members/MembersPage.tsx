import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Download, Filter, ChevronLeft, ChevronRight,
  Trash2, ToggleLeft, ToggleRight, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api';
import { format } from 'date-fns';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const LEVEL_LABEL: Record<string, string> = {
  yeu: 'Yếu',
  tb_yeu: 'TB yếu',
  tb: 'TB',
  tb_plus: 'TB+',
  ban_chuyen: 'BC',
  chuyen_nghiep: 'Chuyên nghiệp',
};

const LEVEL_OPTIONS = [
  { value: '', label: 'Tất cả trình độ' },
  { value: 'yeu', label: 'Yếu' },
  { value: 'tb_yeu', label: 'TB yếu' },
  { value: 'tb', label: 'TB' },
  { value: 'tb_plus', label: 'TB+' },
  { value: 'ban_chuyen', label: 'Bán chuyên (BC)' },
  { value: 'chuyen_nghiep', label: 'Chuyên nghiệp' },
];

function Avatar({ user, sizeClass = 'w-10 h-10 text-sm' }: { user: any; sizeClass?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = user.full_name?.[0]?.toUpperCase() ?? '?';

  if (user.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0 ${sizeClass}`}>
      {initial}
    </div>
  );
}

function MemberTypeBadge({ user }: { user: any }) {
  if (user.member_type === 'co_dinh') {
    const isVip = user.member_subtype === 'vip';
    return (
      <div className="flex flex-col gap-1">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 w-fit">
          Thành viên
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${isVip ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
          }`}>
          {isVip ? '⭐ VIP' : 'Thường'}
        </span>
      </div>
    );
  }

  const isQuen = user.vang_lai_status === 'khach_quen';
  return (
    <div className="flex flex-col gap-1">
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 w-fit">
        Vãng lai
      </span>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${isQuen ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600'
        }`}>
        {user.vang_lai_label ?? (isQuen ? 'Khách quen' : 'Khách mới')}
        {typeof user.attendance_count === 'number' && (
          <span className="opacity-60"> · {user.attendance_count}</span>
        )}
      </span>
    </div>
  );
}

function RowActions({
  user,
  actionLoading,
  onToggleActive,
  onDelete,
  variant = 'table',
}: {
  user: any;
  actionLoading: string | null;
  onToggleActive: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  variant?: 'table' | 'mobile';
}) {
  const busy = actionLoading === user.id;

  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-2">
        <Link
          to={`/members/${user.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Xem
        </Link>
        <button
          onClick={() => onToggleActive(user.id)}
          disabled={busy}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors disabled:opacity-50 ${user.is_active
            ? 'bg-amber-500 hover:bg-amber-600'
            : 'bg-green-500 hover:bg-green-600'
            }`}
        >
          {user.is_active
            ? <ToggleRight className="w-3.5 h-3.5" />
            : <ToggleLeft className="w-3.5 h-3.5" />
          }
          {user.is_active ? 'Tạm ẩn' : 'Kích hoạt'}
        </button>
        <button
          onClick={() => onDelete(user.id, user.full_name)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> Xóa
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        to={`/members/${user.id}`}
        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Xem / Sửa"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <button
        onClick={() => onToggleActive(user.id)}
        disabled={busy}
        className={`p-1.5 rounded-lg transition-colors ${user.is_active
          ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          }`}
        title={user.is_active ? 'Tạm ẩn' : 'Kích hoạt'}
      >
        {user.is_active
          ? <ToggleRight className="w-4 h-4" />
          : <ToggleLeft className="w-4 h-4" />
        }
      </button>
      <button
        onClick={() => onDelete(user.id, user.full_name)}
        disabled={busy}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Xóa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function MembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({
    search: '', role: '', gender: '', shirt_size: '', is_active: '', member_type: '', level: '',
    page: 1, limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== ''));
      const { data } = await usersApi.list(params);
      setUsers(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setQuery(q => ({ ...q, search: e.target.value, page: 1 }));

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== ''));
      const { data } = await usersApi.export(params);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `members_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất Excel thành công!');
    } finally {
      setExporting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setActionLoading(id);
    try {
      const { data } = await usersApi.toggleActive(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: data.is_active } : u));
      toast.success(`Đã ${data.is_active ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa thành viên "${name}"? Hành động này không thể hoàn tác.`)) return;
    setActionLoading(id);
    try {
      await usersApi.delete(id);
      toast.success('Đã xóa thành viên');
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thành viên</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {meta.total ?? 0} người dùng
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
        </button>
        <Link to="/members/create" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Thêm mới</span>
        </Link>
      </div>

      {/* Search + Filter bar */}
      <div className="card !p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query.search}
              onChange={handleSearch}
              className="input-field pl-9"
              placeholder="Tìm kiếm tên, email, SĐT..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Bộ lọc</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-gray-100">
            <select
              value={query.role}
              onChange={e => setQuery(q => ({ ...q, role: e.target.value, page: 1 }))}
              className="input-field text-sm"
            >
              <option value="">Tất cả vai trò</option>
              <option value="member">Thành viên</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={query.gender}
              onChange={e => setQuery(q => ({ ...q, gender: e.target.value, page: 1 }))}
              className="input-field text-sm"
            >
              <option value="">Tất cả giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
            <select
              value={query.shirt_size}
              onChange={e => setQuery(q => ({ ...q, shirt_size: e.target.value, page: 1 }))}
              className="input-field text-sm"
            >
              <option value="">Tất cả size</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={query.member_type}
              onChange={e => setQuery(q => ({ ...q, member_type: e.target.value, page: 1 }))}
              className="input-field text-sm"
            >
              <option value="">Tất cả phân cấp</option>
              <option value="vang_lai">Vãng lai</option>
              <option value="co_dinh">Thành viên</option>
            </select>

            <select
              value={query.level}
              onChange={e => setQuery(q => ({ ...q, level: e.target.value, page: 1 }))}
              className="input-field text-sm"
            >
              {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select
              value={query.is_active}
              onChange={e => setQuery(q => ({ ...q, is_active: e.target.value, page: 1 }))}
              className="input-field text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Vô hiệu hóa</option>
            </select>
          </div>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="md:hidden bg-gray-50 p-3 space-y-3">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="p-4 space-y-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
              Không tìm thấy dữ liệu
            </div>
          ) : users.map((user) => (
            <div key={user.id} className="p-4 space-y-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={user} sizeClass="w-10 h-10 text-sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                  </div>
                </div>
                <span className={`flex-shrink-0 ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={user.role === 'admin' ? 'badge-admin' : 'badge-member'}>
                    {user.role === 'admin' ? 'Admin' : 'Thành viên'}
                  </span>
                  {user.level ? (
                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                      {LEVEL_LABEL[user.level] ?? user.level}
                    </span>
                  ) : null}
                </div>
                <MemberTypeBadge user={user} />
              </div>

              {/* Thao tác */}
              <div className="pt-2 border-t border-gray-100">
                <RowActions
                  user={user}
                  actionLoading={actionLoading}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  variant="mobile"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Họ và tên</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">SĐT</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Trình độ</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vai trò</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Phân cấp</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Không tìm thấy dữ liệu
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} sizeClass="w-9 h-9 text-sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-400 md:hidden truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{user.phone}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {user.level ? (
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                        {LEVEL_LABEL[user.level] ?? user.level}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.role === 'admin' ? 'badge-admin' : 'badge-member'}>
                      {user.role === 'admin' ? 'Admin' : 'Thành viên'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <MemberTypeBadge user={user} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.is_active ? 'badge-active' : 'badge-inactive'}>
                      {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      user={user}
                      actionLoading={actionLoading}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination — chung cho cả mobile & desktop */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Trang {meta.page} / {meta.total_pages} ({meta.total} kết quả)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}
                disabled={meta.page >= meta.total_pages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}