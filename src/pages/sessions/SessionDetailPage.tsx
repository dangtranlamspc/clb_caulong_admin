import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, CalendarDays, MapPin, Clock, Users,
    CheckCircle2, XCircle, Hourglass, Phone, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { sessionsApi, registrationsApi } from '../../api';
import SessionCostCard from './SessionCostCard';

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
    pending: { label: 'Chờ xác nhận', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Hourglass },
    confirmed: { label: 'Đã xác nhận', cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
    rejected: { label: 'Từ chối', cls: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
};

function UserAvatar({
    avatarUrl,
    fullName,
    size = 36,
}: {
    avatarUrl?: string | null;
    fullName?: string;
    size?: number;
}) {
    const [error, setError] = useState(false);

    const showImage = avatarUrl && !error;

    return (
        <div
            className="rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0"
            style={{ width: size, height: size }}
        >
            {showImage ? (
                <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            ) : (
                <span className="text-blue-700 text-sm font-semibold">
                    {fullName?.[0]?.toUpperCase() ?? '?'}
                </span>
            )}
        </div>
    );
}

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [registrations, setRegs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
    const [showReject, setShowReject] = useState<string | null>(null);

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

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/sessions')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{session.title}</h1>
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
                                            <UserAvatar
                                                avatarUrl={user?.avatar_url}
                                                fullName={user?.full_name}
                                                size={36}
                                            />
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
                                                        {user.member_type === 'co_dinh' ? '🔵 Cố định' : '⚪ Vãng lai'}
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

                                        {/* Action buttons */}
                                        {reg.payment_status === 'pending' && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
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
                                            </div>
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
        </div>
    );
}