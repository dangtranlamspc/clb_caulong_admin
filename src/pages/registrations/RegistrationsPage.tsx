import { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2, XCircle, Hourglass, Phone, Mail,
    CalendarDays, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { registrationsApi } from '../../api';

const STATUS_TABS = [
    { value: 'pending', label: 'Chờ xác nhận', icon: Hourglass, cls: 'text-amber-600' },
    { value: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle2, cls: 'text-green-600' },
    { value: 'rejected', label: 'Từ chối', icon: XCircle, cls: 'text-red-500' },
    { value: '', label: 'Tất cả', icon: RefreshCw, cls: 'text-gray-500' },
];

const BADGE: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    refunded: 'bg-slate-50 text-slate-600 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận',
    rejected: 'Từ chối', refunded: 'Hoàn tiền',
};

export default function RegistrationsPage() {
    const [regs, setRegs] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setTab] = useState('pending');
    const [page, setPage] = useState(1);
    const [actionId, setActionId] = useState<string | null>(null);
    const [showReject, setShowReject] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

    const fetchRegs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (activeTab) params.payment_status = activeTab;
            const { data } = await registrationsApi.list(params);
            setRegs(data.data);
            setMeta(data.meta);
        } finally {
            setLoading(false);
        }
    }, [activeTab, page]);

    useEffect(() => { fetchRegs(); }, [fetchRegs]);
    useEffect(() => { setPage(1); }, [activeTab]);

    const handleConfirm = async (id: string) => {
        setActionId(id);
        try {
            await registrationsApi.confirm(id);
            toast.success('✅ Xác nhận thành công — đã cộng 1 cầu lông!');
            fetchRegs();
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionId(id);
        try {
            await registrationsApi.reject(id, rejectNotes[id]);
            toast.success('Đã từ chối');
            setShowReject(null);
            fetchRegs();
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Xác nhận thanh toán</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    Kiểm tra và xác nhận chuyển khoản của thành viên
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
                {STATUS_TABS.map(({ value, label, icon: Icon, cls }) => (
                    <button
                        key={value}
                        onClick={() => setTab(value)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === value
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon className={`w-4 h-4 ${activeTab === value ? 'text-blue-600' : cls}`} />
                        {label}
                    </button>
                ))}
                <div className="flex-1" />
                <span className="self-center text-sm text-gray-400 pr-2">
                    {meta.total ?? 0} kết quả
                </span>
            </div>

            {/* List */}
            <div className="space-y-2">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="card h-20 animate-pulse bg-gray-100" />
                    ))
                ) : regs.length === 0 ? (
                    <div className="card py-16 text-center text-gray-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Không có đăng ký nào{activeTab === 'pending' ? ' đang chờ' : ''}</p>
                    </div>
                ) : (
                    regs.map((reg) => {
                        const busy = actionId === reg.id;
                        const user = reg.users;
                        const session = reg.sessions;

                        return (
                            <div key={reg.id} className="card">
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                                        {user?.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.full_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}

                                        <span
                                            style={{ display: user?.avatar_url ? 'none' : 'flex' }}
                                            className="w-full h-full items-center justify-center text-blue-700 font-semibold text-sm"
                                        >
                                            {user?.full_name?.[0]?.toUpperCase() ?? '?'}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Row 1: name + status */}
                                        <div className="flex items-center flex-wrap gap-2">
                                            <span className="font-semibold text-gray-900">{user?.full_name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${BADGE[reg.payment_status] ?? ''}`}>
                                                {STATUS_LABEL[reg.payment_status]}
                                            </span>
                                            {reg.points_awarded && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                                    🏸 Đã cộng điểm
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 2: contact */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />{user?.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />{user?.email}
                                            </span>
                                        </div>

                                        {/* Row 3: session + ref + time */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs">
                                            {session && (
                                                <span className="flex items-center gap-1 text-blue-600">
                                                    <CalendarDays className="w-3 h-3" />
                                                    {session.title} —{' '}
                                                    {format(new Date(session.scheduled_at), 'dd/MM HH:mm', { locale: vi })}
                                                    {' '}·{' '}
                                                    <span className="font-semibold">
                                                        {session.price_per_slot?.toLocaleString('vi-VN')}đ
                                                    </span>
                                                </span>
                                            )}
                                            {reg.payment_reference && (
                                                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                                    Mã: {reg.payment_reference}
                                                </span>
                                            )}
                                            <span className="text-gray-400">
                                                Đăng ký lúc {format(new Date(reg.created_at), 'HH:mm dd/MM', { locale: vi })}
                                            </span>
                                        </div>

                                        {/* Payment proof image */}
                                        {reg.payment_proof_url && (
                                            <a
                                                href={reg.payment_proof_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-block mt-2 text-xs text-blue-600 underline"
                                            >
                                                📎 Xem ảnh bill
                                            </a>
                                        )}

                                        {/* Reject reason input */}
                                        {showReject === reg.id && (
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    value={rejectNotes[reg.id] ?? ''}
                                                    onChange={e => setRejectNotes(n => ({ ...n, [reg.id]: e.target.value }))}
                                                    className="input-field text-sm flex-1"
                                                    placeholder="Lý do từ chối (tuỳ chọn)"
                                                />
                                                <button
                                                    onClick={() => handleReject(reg.id)}
                                                    disabled={busy}
                                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    Xác nhận từ chối
                                                </button>
                                                <button
                                                    onClick={() => setShowReject(null)}
                                                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons — chỉ hiện khi pending */}
                                    {reg.payment_status === 'pending' && showReject !== reg.id && (
                                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => handleConfirm(reg.id)}
                                                disabled={busy}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Xác nhận
                                            </button>
                                            <button
                                                onClick={() => setShowReject(reg.id)}
                                                disabled={busy}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Từ chối
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {meta.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Trang {meta.page}/{meta.total_pages} ({meta.total} kết quả)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= meta.total_pages}
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