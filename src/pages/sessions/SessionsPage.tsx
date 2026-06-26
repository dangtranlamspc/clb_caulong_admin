import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, CalendarDays, MapPin, Users, Clock,
    ChevronLeft, ChevronRight, Pencil, Trash2,
    CheckCircle, XCircle, PlayCircle, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { sessionsApi } from '../../api';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    open: { label: 'Mở đăng ký', cls: 'bg-green-100 text-green-700' },
    full: { label: 'Đã đầy', cls: 'bg-amber-100 text-amber-700' },
    waiting_payment: { label: 'Chờ thanh toán', cls: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-600' },
    completed: { label: 'Hoàn thành', cls: 'bg-slate-100 text-slate-600' },
};

const STATUS_NEXT: Record<string, { label: string; next?: string; to?: string; cls: string }[]> = {
    open: [
        { label: 'Kết thúc', to: 'finish', cls: 'bg-green-500 hover:bg-green-600 text-white' },
        { label: 'Hủy buổi', next: 'cancelled', cls: 'bg-red-50 hover:bg-red-100 text-red-600' },
    ],
    full: [
        { label: 'Mở lại', next: 'open', cls: 'bg-blue-50 hover:bg-blue-100 text-blue-600' },
        { label: 'Kết thúc', to: 'finish', cls: 'bg-green-500 hover:bg-green-600 text-white' },
    ],
    waiting_payment: [
        { label: 'Đánh dấu hoàn thành', next: 'completed', cls: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' },
    ],
    cancelled: [],
    completed: [],
};

export default function SessionsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState({ status: '', page: 1, limit: 15 });
    const [actionId, setActionId] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== ''));
            const { data } = await sessionsApi.list(params);
            const sorted = [...(data.data ?? [])].sort((a: any, b: any) => {
                const aTime = new Date(a.created_at ?? a.scheduled_at).getTime();
                const bTime = new Date(b.created_at ?? b.scheduled_at).getTime();
                return bTime - aTime;
            });
            setSessions(sorted);
            setMeta(data.meta);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => { fetch(); }, [fetch]);

    const handleStatusChange = async (id: string, next: string) => {
        setActionId(id);
        try {
            await sessionsApi.updateStatus(id, next);
            toast.success('Đã cập nhật trạng thái');
            fetch();
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Xóa buổi "${title}"? Hành động này không thể hoàn tác.`)) return;
        setActionId(id);
        try {
            await sessionsApi.delete(id);
            toast.success('Đã xóa buổi');
            fetch();
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Buổi đánh cầu</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{meta.total ?? 0} buổi</p>
                </div>
                <div className="flex-1" />

                {/* Status filter */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {[['', 'Tất cả'], ['open', 'Mở'], ['full', 'Đầy'], ['completed', 'Xong'], ['cancelled', 'Hủy']].map(
                        ([val, lbl]) => (
                            <button
                                key={val}
                                onClick={() => setQuery(q => ({ ...q, status: val, page: 1 }))}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${query.status === val
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {lbl}
                            </button>
                        )
                    )}
                </div>

                <Link to="/sessions/create" className="btn-primary flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Tạo buổi</span>
                </Link>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card h-44 animate-pulse bg-gray-100" />
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <div className="card py-16 text-center text-gray-400">
                    <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Chưa có buổi đánh nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sessions.map((s) => {
                        const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.open;
                        const nextActions = STATUS_NEXT[s.status] ?? [];
                        const busy = actionId === s.id;

                        return (
                            <div key={s.id} className="card flex flex-col gap-3">
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-gray-900 leading-tight">{s.title}</h3>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="space-y-1.5 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                        <span>{format(new Date(s.scheduled_at), 'EEEE, dd/MM/yyyy HH:mm', { locale: vi })}</span>
                                    </div>
                                    {s.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                            <span className="truncate">{s.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1 flex-wrap">
                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                            <span className={s.available_slots <= 0 ? 'text-red-500 font-medium' : ''}>
                                                {s.available_slots ?? s.max_slots}/{s.max_slots} chỗ trống
                                            </span>
                                            {(s.male_count > 0 || s.female_count > 0) && (
                                                <span className="text-gray-400 text-xs">
                                                    · 👨 {s.male_count ?? 0} · 👩 {s.female_count ?? 0}
                                                </span>
                                            )}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            {s.duration_minutes} phút
                                        </span>
                                    </div>
                                </div>

                                {/* Price + confirmed count */}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                                    <span className="text-xs text-gray-400">
                                        {s.confirmed_count ?? 0} đã xác nhận · {s.pending_count ?? 0} chờ
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-1.5 pt-1">
                                    {/* Row 1: Xem + Sửa + Xóa */}
                                    <div className="flex gap-1">
                                        <Link
                                            to={`/sessions/${s.id}`}
                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Xem
                                        </Link>
                                        {s.status !== 'completed' && (
                                            <>
                                                <Link
                                                    to={`/sessions/${s.id}/edit`}
                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-600 text-xs font-medium transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Sửa
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(s.id, s.title)}
                                                    disabled={busy}
                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium transition-colors disabled:opacity-40"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Row 2: Status actions */}
                                    {nextActions.length > 0 && (
                                        <div className="flex gap-1">
                                            {nextActions.map(({ label, next, to, cls }) => (
                                                to ? (
                                                    <Link key={to} to={`/sessions/${s.id}/${to}`} className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${cls}`}>
                                                        {label}
                                                    </Link>
                                                ) : (
                                                    <button key={next} onClick={() => handleStatusChange(s.id, next!)} disabled={busy}
                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${cls}`}>
                                                        {label}
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {meta.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Trang {meta.page}/{meta.total_pages}
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
    );
}



// open/full
//    ↓
// Kết thúc
//    ↓
// SessionFinishPage
//    ↓
// Gửi bill
//    ↓
// waiting_payment
//    ↓
// Member chuyển khoản
//    ↓
// Admin xác nhận từng bill
//    ↓
// paid (từng registration)
//    ↓
// Tất cả member đã paid
//    ↓
// completed