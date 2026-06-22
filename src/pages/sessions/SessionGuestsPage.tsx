import { useState, useEffect, useCallback } from 'react';
import {
    UserPlus, RefreshCw, Trash2, Pencil, Check, X,
    CalendarDays, ChevronDown, Hourglass, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { guestsApi, sessionsApi } from '../../api';

const GENDER_OPTS = [
    { value: '', label: '— Không rõ —' },
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
];

interface GuestForm {
    session_id: string;
    full_name: string;
    gender: string;
    amount: string;
    payment_status: 'pending' | 'confirmed';
    notes: string;
}

const EMPTY_FORM: GuestForm = {
    session_id: '',
    full_name: '',
    gender: '',
    amount: '',
    payment_status: 'pending',
    notes: '',
};

export default function SessionGuestsPage() {
    const [guests, setGuests] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionFilter, setSessionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<GuestForm>>({});

    const fetchSessions = useCallback(async () => {
        const { data } = await sessionsApi.list({ limit: 100 });
        setSessions(data.data ?? []);
    }, []);

    const fetchGuests = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (sessionFilter) params.session_id = sessionFilter;
            if (statusFilter) params.payment_status = statusFilter;
            const { data } = await guestsApi.list(params);
            setGuests(data.data ?? []);
        } finally {
            setLoading(false);
        }
    }, [sessionFilter, statusFilter]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);
    useEffect(() => { fetchGuests(); }, [fetchGuests]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setShowForm(false);
    };

    const handleCreate = async () => {
        if (!form.session_id) return toast.error('Chọn buổi đánh');
        if (!form.full_name.trim()) return toast.error('Nhập tên khách');
        if (!form.amount || Number(form.amount) < 0) return toast.error('Nhập số tiền hợp lệ');

        setSubmitting(true);
        try {
            await guestsApi.create({
                session_id: form.session_id,
                full_name: form.full_name.trim(),
                gender: form.gender || undefined,
                amount: Number(form.amount),
                payment_status: form.payment_status,
                notes: form.notes || undefined,
            });
            toast.success('Đã thêm khách vãng lai');
            resetForm();
            fetchGuests();
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (g: any) => {
        setEditingId(g.id);
        setEditForm({
            full_name: g.full_name,
            gender: g.gender ?? '',
            amount: String(g.amount),
            payment_status: g.payment_status,
            notes: g.notes ?? '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id: string) => {
        setSubmitting(true);
        try {
            await guestsApi.update(id, {
                full_name: editForm.full_name?.trim(),
                gender: editForm.gender || undefined,
                amount: editForm.amount !== undefined ? Number(editForm.amount) : undefined,
                payment_status: editForm.payment_status,
                notes: editForm.notes || undefined,
            });
            toast.success('Đã cập nhật');
            cancelEdit();
            fetchGuests();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa khách vãng lai này? Hành động không thể hoàn tác.')) return;
        try {
            await guestsApi.remove(id);
            toast.success('Đã xóa');
            fetchGuests();
        } catch { }
    };

    const toggleConfirm = async (g: any) => {
        const next = g.payment_status === 'confirmed' ? 'pending' : 'confirmed';
        try {
            await guestsApi.update(g.id, { payment_status: next });
            toast.success(next === 'confirmed' ? 'Đã xác nhận thanh toán' : 'Đã chuyển về chờ xác nhận');
            fetchGuests();
        } catch { }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-amber-600" /> Khách vãng lai
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Người chơi không có tài khoản, admin nhập tay theo từng buổi
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowForm(s => !s)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        <UserPlus className="w-4 h-4" /> Thêm khách
                    </button>
                    <button
                        onClick={fetchGuests}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="card space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Thêm khách vãng lai mới</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Buổi đánh *</label>
                            <div className="relative">
                                <select
                                    value={form.session_id}
                                    onChange={e => setForm(f => ({ ...f, session_id: e.target.value }))}
                                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">— Chọn buổi —</option>
                                    {sessions.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.title} — {format(new Date(s.scheduled_at), 'dd/MM HH:mm', { locale: vi })}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Họ tên *</label>
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                                className="input-field text-sm w-full"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Giới tính</label>
                            <div className="relative">
                                <select
                                    value={form.gender}
                                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {GENDER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Số tiền *</label>
                            <input
                                type="number"
                                min={0}
                                value={form.amount}
                                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                className="input-field text-sm w-full"
                                placeholder="50000"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Trạng thái thanh toán</label>
                            <div className="relative">
                                <select
                                    value={form.payment_status}
                                    onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as any }))}
                                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="pending">Chờ xác nhận</option>
                                    <option value="confirmed">Đã xác nhận</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
                            <input
                                type="text"
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="input-field text-sm w-full"
                                placeholder="Tuỳ chọn"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleCreate}
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? 'Đang lưu...' : 'Lưu khách'}
                        </button>
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <select
                        value={sessionFilter}
                        onChange={e => setSessionFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 max-w-xs"
                    >
                        <option value="">Tất cả buổi</option>
                        {sessions.map((s: any) => (
                            <option key={s.id} value={s.id}>
                                {s.title} — {format(new Date(s.scheduled_at), 'dd/MM', { locale: vi })}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="card h-16 animate-pulse bg-gray-100" />
                    ))
                ) : guests.length === 0 ? (
                    <div className="card py-16 text-center text-gray-400">
                        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Chưa có khách vãng lai nào</p>
                    </div>
                ) : (
                    guests.map((g: any) => {
                        const isEditing = editingId === g.id;
                        return (
                            <div key={g.id} className="card">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            <input
                                                type="text"
                                                value={editForm.full_name ?? ''}
                                                onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                                                className="input-field text-sm"
                                                placeholder="Họ tên"
                                            />
                                            <div className="relative">
                                                <select
                                                    value={editForm.gender ?? ''}
                                                    onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                                                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                >
                                                    {GENDER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                            <input
                                                type="number"
                                                min={0}
                                                value={editForm.amount ?? ''}
                                                onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                                                className="input-field text-sm"
                                                placeholder="Số tiền"
                                            />
                                            <div className="relative">
                                                <select
                                                    value={editForm.payment_status ?? 'pending'}
                                                    onChange={e => setEditForm(f => ({ ...f, payment_status: e.target.value as any }))}
                                                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                >
                                                    <option value="pending">Chờ xác nhận</option>
                                                    <option value="confirmed">Đã xác nhận</option>
                                                </select>
                                                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveEdit(g.id)}
                                                disabled={submitting}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Lưu
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
                                            >
                                                <X className="w-3.5 h-3.5" /> Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-amber-700 font-semibold text-sm">
                                                {g.full_name?.[0]?.toUpperCase() ?? '?'}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center flex-wrap gap-2">
                                                <span className="font-semibold text-gray-900">{g.full_name}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                    Khách vãng lai
                                                </span>
                                                {g.payment_status === 'confirmed' ? (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                                                        <Hourglass className="w-3 h-3" /> Chờ xác nhận
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs">
                                                {g.sessions && (
                                                    <span className="flex items-center gap-1 text-blue-600">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {g.sessions.title} —{' '}
                                                        {format(new Date(g.sessions.scheduled_at), 'dd/MM HH:mm', { locale: vi })}
                                                    </span>
                                                )}
                                                <span className="font-semibold text-gray-700">
                                                    {Number(g.amount).toLocaleString('vi-VN')}đ
                                                </span>
                                                {g.notes && <span className="text-gray-400">📝 {g.notes}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => toggleConfirm(g)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${g.payment_status === 'confirmed'
                                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    }`}
                                            >
                                                {g.payment_status === 'confirmed' ? 'Bỏ xác nhận' : 'Xác nhận'}
                                            </button>
                                            <button
                                                onClick={() => startEdit(g)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Sửa"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(g.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}