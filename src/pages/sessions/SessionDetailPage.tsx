import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, CalendarDays, MapPin, Clock, Users,
    CheckCircle2, XCircle, Hourglass, Phone, Mail,
    UserPlus, Search, Loader2, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { sessionsApi, registrationsApi, usersApi } from '../../api';
import SessionCostCard from './SessionCostCard';

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
    pending: { label: 'Chờ xác nhận', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Hourglass },
    confirmed: { label: 'Đã xác nhận', cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
    rejected: { label: 'Từ chối', cls: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
};

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [registrations, setRegs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
    const [showReject, setShowReject] = useState<string | null>(null);

    // ── Xem ảnh bill chuyển khoản ──────────────────────────────────
    const [viewingBillUrl, setViewingBillUrl] = useState<string | null>(null);

    // ── Add member modal ──────────────────────────────────────────
    const [showAddModal, setShowAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [addConfirmNow, setAddConfirmNow] = useState(false);
    const [addNotes, setAddNotes] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [{ data: s }, { data: r }] = await Promise.all([
                sessionsApi.get(id!),
                sessionsApi.getRegistrations(id!),
            ]);
            setSession(s);
            setRegs(r);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [id]);

    // Debounce tìm kiếm thành viên trong modal
    useEffect(() => {
        if (!showAddModal) return;
        if (search.trim().length < 2) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await usersApi.searchMembers(search.trim());
                setSearchResults(data ?? []);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [search, showAddModal]);

    const handleConfirm = async (regId: string) => {
        setActionId(regId);
        try {
            await registrationsApi.confirm(regId);
            toast.success('Xác nhận thành công — đã cộng 1 cầu lông!');
            fetchAll();
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (regId: string) => {
        setActionId(regId);
        try {
            await registrationsApi.reject(regId, rejectNotes[regId]);
            toast.success('Đã từ chối');
            setShowReject(null);
            fetchAll();
        } finally {
            setActionId(null);
        }
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setSearch('');
        setSearchResults([]);
        setSelectedMember(null);
        setAddConfirmNow(false);
        setAddNotes('');
    };

    const handleAddMember = async () => {
        if (!selectedMember) return;
        setAdding(true);
        try {
            await registrationsApi.adminAdd({
                session_id: id,
                user_id: selectedMember.id,
                payment_status: addConfirmNow ? 'confirmed' : 'pending',
                notes: addNotes || undefined,
            });
            toast.success(`Đã thêm ${selectedMember.full_name} vào buổi${addConfirmNow ? '' : ' — đã gửi thông báo thanh toán'}`);
            closeAddModal();
            fetchAll();
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-3xl mx-auto">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="card h-32 animate-pulse bg-gray-100" />
                <div className="card h-64 animate-pulse bg-gray-100" />
            </div>
        );
    }

    if (!session) return null;

    const pending = registrations.filter(r => r.payment_status === 'pending');
    const confirmed = registrations.filter(r => r.payment_status === 'confirmed');
    const rejected = registrations.filter(r => r.payment_status === 'rejected');

    // Chỉ hiện cost card nếu buổi có cấu hình chi phí
    const hasCostData =
        session.status === 'completed' &&
        (Number(session.court_fee ?? 0) > 0 || Number(session.shuttle_count ?? 0) > 0);

    const canAddMember = session.status === 'open' || session.status === 'full';

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/sessions')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{session.title}</h1>
                {canAddMember && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors flex-shrink-0"
                    >
                        <UserPlus className="w-4 h-4" /> Thêm thành viên
                    </button>
                )}
            </div>

            {/* Session info card */}
            <div className="card grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-gray-400 text-xs">Thời gian</span>
                    <div className="flex items-center gap-1 font-medium text-gray-800">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                        {format(new Date(session.scheduled_at), 'dd/MM HH:mm', { locale: vi })}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-gray-400 text-xs">Thời lượng</span>
                    <div className="flex items-center gap-1 font-medium text-gray-800">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {session.duration_minutes} phút
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-gray-400 text-xs">Địa điểm</span>
                    <div className="flex items-center gap-1 font-medium text-gray-800 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{session.location || '—'}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-gray-400 text-xs">Chỗ trống</span>
                    <div className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className={session.available_slots <= 0 ? 'text-red-500' : 'text-gray-800'}>
                            {session.available_slots}/{session.max_slots}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Chi phí buổi ── chỉ hiện khi đã cấu hình tiền sân hoặc số cầu */}
            {hasCostData && <SessionCostCard sessionId={id!} />}

            {/* Summary badges */}
            <div className="flex gap-3 flex-wrap">
                {[
                    { label: 'Chờ xác nhận', count: pending.length, cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
                    { label: 'Đã xác nhận', count: confirmed.length, cls: 'bg-green-50 text-green-700 border border-green-200' },
                    { label: 'Từ chối', count: rejected.length, cls: 'bg-red-50 text-red-600 border border-red-200' },
                ].map(({ label, count, cls }) => (
                    <span key={label} className={`px-3 py-1 rounded-full text-sm font-medium ${cls}`}>
                        {label}: {count}
                    </span>
                ))}
            </div>

            {/* Registrations list */}
            <div className="card !p-0 overflow-hidden">
                {registrations.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Chưa có ai đăng ký buổi này</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {registrations.map((reg) => {
                            const cfg = STATUS_CONFIG[reg.payment_status] ?? STATUS_CONFIG.pending;
                            const StatusIcon = cfg.icon;
                            const busy = actionId === reg.id;
                            const user = reg.users;

                            return (
                                <div key={reg.id} className="px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-700 text-sm font-semibold">
                                                {user?.full_name?.[0]?.toUpperCase() ?? '?'}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-gray-900">{user?.full_name}</span>
                                                {/* member_type badge */}
                                                {user?.member_type && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${user.member_type === 'co_dinh'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                                        }`}>
                                                        {user.member_type === 'co_dinh' ? '🔵 Thành viên' : '⚪ Vãng lai'}
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.cls}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
                                                {reg.points_awarded && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                                        🏸 Đã cộng điểm
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />{user?.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />{user?.email}
                                                </span>
                                                {reg.payment_reference && (
                                                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {reg.payment_reference}
                                                    </span>
                                                )}
                                            </div>

                                            {reg.notes && (
                                                <p className="text-xs text-gray-400 mt-1 italic">{reg.notes}</p>
                                            )}
                                        </div>

                                        {/* Action buttons + xem bill — chỉ hiện khi có ảnh bill hoặc member đã gửi mã chuyển khoản */}
                                        {(reg.payment_proof_url || (reg.payment_status === 'pending' && reg.payment_reference)) && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {reg.payment_proof_url && (
                                                    <button
                                                        onClick={() => setViewingBillUrl(reg.payment_proof_url)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Xem ảnh bill chuyển khoản"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {reg.payment_status === 'pending' && reg.payment_reference && (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirm(reg.id)}
                                                            disabled={busy}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Xác nhận
                                                        </button>
                                                        <button
                                                            onClick={() => setShowReject(showReject === reg.id ? null : reg.id)}
                                                            disabled={busy}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Đang chờ member gửi mã chuyển khoản (chưa có cả mã lẫn ảnh bill) */}
                                        {reg.payment_status === 'pending' && !reg.payment_reference && !reg.payment_proof_url && (
                                            <span className="text-[11px] text-gray-400 italic flex-shrink-0 flex items-center gap-1">
                                                <Hourglass className="w-3 h-3" />
                                                Chờ CK
                                            </span>
                                        )}
                                    </div>

                                    {/* Reject reason input */}
                                    {showReject === reg.id && (
                                        <div className="mt-2 ml-12 flex gap-2">
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
                                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
                                            >
                                                Xác nhận từ chối
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Modal xem ảnh bill chuyển khoản ── */}
            {viewingBillUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setViewingBillUrl(null)}
                >
                    <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setViewingBillUrl(null)}
                            className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
                            title="Đóng"
                        >
                            <XCircle className="w-7 h-7" />
                        </button>
                        <img
                            src={viewingBillUrl}
                            alt="Ảnh bill chuyển khoản"
                            className="w-full max-h-[80vh] object-contain rounded-xl bg-white"
                        />
                    </div>
                </div>
            )}

            {/* ── Add member modal ── */}
            {showAddModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={closeAddModal}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Thêm thành viên vào buổi</h3>
                            <button onClick={closeAddModal} className="p-1 text-gray-400 hover:text-gray-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {!selectedMember ? (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            autoFocus
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="input-field pl-9"
                                            placeholder="Tìm theo tên hoặc số điện thoại..."
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto -mx-1">
                                        {searching ? (
                                            <p className="text-sm text-gray-400 text-center py-4">Đang tìm...</p>
                                        ) : search.trim().length < 2 ? (
                                            <p className="text-sm text-gray-400 text-center py-4">Nhập ít nhất 2 ký tự để tìm</p>
                                        ) : searchResults.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-4">Không tìm thấy thành viên</p>
                                        ) : (
                                            <ul className="space-y-1">
                                                {searchResults.map(m => (
                                                    <li key={m.id}>
                                                        <button
                                                            onClick={() => setSelectedMember(m)}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-blue-700">
                                                                {m.full_name?.[0]?.toUpperCase() ?? '?'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                                                                <p className="text-xs text-gray-400">{m.phone}</p>
                                                            </div>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${m.member_type === 'co_dinh'
                                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                                                }`}>
                                                                {m.member_type === 'co_dinh' ? 'Thành viên' : 'Vãng lai'}
                                                            </span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-blue-700">
                                            {selectedMember.full_name?.[0]?.toUpperCase() ?? '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{selectedMember.full_name}</p>
                                            <p className="text-xs text-gray-500">{selectedMember.phone}</p>
                                        </div>
                                        <button onClick={() => setSelectedMember(null)} className="text-xs text-blue-600 font-medium flex-shrink-0">
                                            Đổi
                                        </button>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={addConfirmNow}
                                            onChange={e => setAddConfirmNow(e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">Xác nhận thanh toán ngay (đã thu tiền tại sân)</span>
                                    </label>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tuỳ chọn)</label>
                                        <input
                                            value={addNotes}
                                            onChange={e => setAddNotes(e.target.value)}
                                            className="input-field"
                                            placeholder="VD: Khách vãng lai đăng ký trực tiếp"
                                        />
                                    </div>

                                    {!addConfirmNow && (
                                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                                            ⓘ Hệ thống sẽ gửi thông báo yêu cầu thanh toán đến thành viên này.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
                            <button onClick={closeAddModal} className="btn-secondary text-sm">Hủy</button>
                            <button
                                onClick={handleAddMember}
                                disabled={!selectedMember || adding}
                                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                                Thêm vào buổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}