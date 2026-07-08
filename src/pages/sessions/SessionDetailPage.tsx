import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, CalendarDays, MapPin, Clock, Users,
    CheckCircle2, XCircle, Hourglass, Phone, Mail,
    UserPlus, Search, Loader2, Eye, CornerDownRight,
    UserX,
    UserCheck,
    Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { sessionsApi, registrationsApi, usersApi } from '../../api';
import SessionCostCard from './SessionCostCard';
import { MorphButton } from '../../components/MorphButton';
import { supabase } from '../../lib/supabase';
import { createPortal } from 'react-dom';


const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
    pendingApproval: { label: 'Chờ duyệt', cls: 'bg-orange-50 text-orange-600 border-orange-200', icon: Hourglass },
    pending: { label: 'Chờ thanh toán', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Hourglass },
    pendingReview: { label: 'Chờ chốt thanh toán', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye },
    confirmed: { label: 'Đã xác nhận thanh toán', cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
    rejected: { label: 'Thanh toán bị từ chối', cls: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
    awaitingCheckin: { label: 'Chờ điểm danh', cls: 'bg-slate-50 text-slate-600 border border-slate-200', icon: Hourglass },
    awaitingFinish: { label: 'Chờ buổi đánh kết thúc', cls: 'bg-slate-50 text-slate-600 border border-slate-200', icon: Hourglass },
};

const SKILL_LABEL: Record<string, string> = {
    yeu: 'Yếu',
    trung_binh_yeu: 'TB yếu',
    trung_binh: 'TB',
    trung_binh_cong: 'TB+',
    ban_chuyen: 'Bán chuyên',
    chuyen_nghiep: 'Chuyên nghiệp',
};


type ActionPhase = 'idle' | 'loading' | 'success';

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [registrations, setRegs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionPhase, setActionPhase] = useState<Record<string, ActionPhase>>({});
    const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
    const [showReject, setShowReject] = useState<string | null>(null);

    const [viewingBillUrl, setViewingBillUrl] = useState<string | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
    const [addConfirmNow, setAddConfirmNow] = useState(false);
    const [addNotes, setAddNotes] = useState('');
    const [adding, setAdding] = useState(false);

    const [addTab, setAddTab] = useState<'account' | 'guest'>('account');
    const [guestForm, setGuestForm] = useState({ full_name: '', gender: 'male', skill_level: '' });
    const [hostRegId, setHostRegId] = useState<string>('');
    const [guestPaidNow, setGuestPaidNow] = useState(false);

    const [checkingInAll, setCheckingInAll] = useState(false);

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

    const handleCheckinAllPresent = async () => {
        if (awaitingCheckin.length === 0) return;
        if (!confirm(`Điểm danh có mặt cho tất cả ${awaitingCheckin.length} người đang chờ điểm danh?`)) return;

        setCheckingInAll(true);
        try {
            const results = await Promise.allSettled(
                awaitingCheckin.map(r => registrationsApi.checkinPresent(r.id))
            );
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.length - succeeded;

            if (succeeded > 0) toast.success(`Đã điểm danh có mặt cho ${succeeded} người`);
            if (failed > 0) toast.error(`${failed} người điểm danh thất bại`);

            await refreshSilently();
        } finally {
            setCheckingInAll(false);
        }
    };

    const refreshSilently = async () => {
        try {
            const [{ data: s }, { data: r }] = await Promise.all([
                sessionsApi.get(id!),
                sessionsApi.getRegistrations(id!),
            ]);
            setSession(s);
            setRegs(r);
        } catch { }
    };

    useEffect(() => { fetchAll(); }, [id]);

    useEffect(() => {
        if (!id) return;
        const channel = supabase
            .channel(`session:${id}`)
            .on('broadcast', { event: 'session_updated' }, () => {
                refreshSilently();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [id]);

    useEffect(() => {
        if (!showAddModal || addTab !== 'account') return;
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await usersApi.searchMembers(search.trim());
                setSearchResults(data ?? []);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [search, showAddModal, addTab]);

    const handleApproveRegistration = (regId: string) =>
        runAction(
            `${regId}:approve`, regId,
            () => registrationsApi.approveRegistration(regId),
            'Đã duyệt đăng ký',
            'Duyệt thất bại',
        );

    const handleRejectRegistration = (regId: string, displayName: string) => {
        if (!confirm(`Từ chối đăng ký của ${displayName}?`)) return;
        runAction(
            `${regId}:rejectReg`, regId,
            () => registrationsApi.rejectRegistrationRequest(regId),
            'Đã từ chối đăng ký',
            'Thao tác thất bại',
        );
    };

    const handleConfirm = (regId: string) =>
        runAction(
            `${regId}:confirm`, regId,
            () => registrationsApi.confirm(regId),
            'Xác nhận thành công — đã cộng 1 cầu lông!',
            'Xác nhận thất bại',
        );

    const handleReject = (regId: string) =>
        runAction(
            `${regId}:rejectConfirm`, regId,
            () => registrationsApi.reject(regId, rejectNotes[regId]),
            'Đã từ chối',
            'Từ chối thất bại',
            () => setShowReject(null),
        );

    const handleCheckinPresent = (regId: string) =>
        runAction(
            `${regId}:present`, regId,
            () => registrationsApi.checkinPresent(regId),
            'Đã điểm danh có mặt',
            'Điểm danh thất bại',
        );


    const handleCheckinAbsent = (regId: string, displayName: string) => {
        if (!confirm(`Đánh dấu vắng mặt và xoá ${displayName} khỏi buổi này?`)) return;
        runAction(
            `${regId}:absent`, regId,
            () => registrationsApi.checkinAbsent(regId),
            'Đã đánh dấu vắng mặt',
            'Thao tác thất bại',
        );
    };

    const getPhase = (key: string): ActionPhase => actionPhase[key] ?? 'idle';

    const runAction = (
        key: string,
        regId: string,
        action: () => Promise<any>,
        successMessage: string,
        errorMessage: string,
        afterDelay?: () => void,
    ) => {
        setActionId(regId);
        setActionPhase(p => ({ ...p, [key]: 'loading' }));

        action()
            .then(() => {
                setActionPhase(p => ({ ...p, [key]: 'success' }));
                toast.success(successMessage);
                setTimeout(async () => {
                    afterDelay?.();
                    await refreshSilently();
                    setActionPhase(p => {
                        const next = { ...p };
                        delete next[key];
                        return next;
                    });
                    setActionId(null);
                }, 700);
            })
            .catch((err: any) => {
                setActionPhase(p => {
                    const next = { ...p };
                    delete next[key];
                    return next;
                });
                setActionId(null);
                toast.error(err?.response?.data?.message ?? errorMessage);
            });
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setSearch('');
        setSearchResults([]);
        setSelectedMembers([]);
        setAddConfirmNow(false);
        setAddNotes('');
        setAddTab('account');
        setGuestForm({ full_name: '', gender: 'male', skill_level: '' });
        setHostRegId('');
        setGuestPaidNow(false);
    };

    const handleAddMember = async () => {
        setAdding(true);
        try {
            if (addTab === 'account') {
                if (selectedMembers.length === 0) return;

                const results = await Promise.allSettled(
                    selectedMembers.map(m =>
                        registrationsApi.adminAdd({
                            session_id: id,
                            user_id: m.id,
                            notes: addNotes || undefined,
                        })
                    )
                );

                const succeeded = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.length - succeeded;

                if (succeeded > 0) {
                    toast.success(`Đã thêm ${succeeded} thành viên vào buổi`);
                }
                if (failed > 0) {
                    toast.error(`${failed} thành viên thêm thất bại (có thể đã đăng ký buổi này)`);
                }
            } else {
                await registrationsApi.adminAdd({
                    session_id: id,
                    guest_full_name: guestForm.full_name,
                    guest_gender: guestForm.gender,
                    guest_skill_level: guestForm.skill_level || undefined,
                    host_registration_id: hostRegId || undefined,
                    payment_status: guestPaidNow ? 'confirmed' : 'pending',
                    notes: addNotes || undefined,
                });
                toast.success(`Đã thêm khách ${guestForm.full_name} vào buổi`);
            }
            closeAddModal();
            refreshSilently();
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

    const allPaid = registrations
        .filter(r => r.participation_status === 'confirmed')
        .every(r => r.payment_status === 'confirmed');


    const awaitingFinish = registrations.filter(r =>
        r.payment_status === 'pending' &&
        r.participation_status === 'confirmed' &&
        r.amount_override == null
    );

    const pending = registrations.filter(r =>
        r.payment_status === 'pending' &&
        r.participation_status === 'confirmed' &&
        r.amount_override != null &&
        !r.payment_reference &&
        r.payment_method !== 'cash'
    );

    const pendingReview = registrations.filter(r =>
        r.payment_status === 'pending' && (
            Boolean(r.payment_reference) ||
            (r.payment_method === 'cash' && r.amount_override != null) ||
            r.payment_method === 'grouped_with_host'
        )
    );

    const confirmed = registrations.filter(r => r.payment_status === 'confirmed');
    const rejected = registrations.filter(r => r.payment_status === 'rejected');
    const pendingApproval = registrations.filter(r => r.participation_status === 'pending_approval');
    const awaitingCheckin = registrations.filter(r => r.participation_status === 'awaiting_checkin');

    const canComplete =
        session.status === 'waiting_payment' &&
        pendingReview.length === 0 &&
        rejected.length === 0 &&
        registrations.filter(r => r.participation_status === 'confirmed').length > 0;

    const hostRegs = registrations.filter(r => !r.host_registration_id);
    const guestsOf = (hostId: string) => registrations.filter(r => r.host_registration_id === hostId);
    const hasCostData =
        (session.status === 'completed' || session.status === 'waiting_payment') &&
        (Number(session.court_fee ?? 0) > 0 || Number(session.shuttle_count ?? 0) > 0 || Number(session.other_fee ?? 0) > 0);

    const canAddMember = session.status === 'open' || session.status === 'full';

    const formatVnd = (n: number) => Math.round(n ?? 0).toLocaleString('vi-VN') + 'đ';

    const renderRow = (reg: any, isNested = false) => {

        const isPendingReview = reg.payment_status === 'pending' && (
            Boolean(reg.payment_reference) ||
            (reg.payment_method === 'cash' && reg.amount_override != null) ||
            reg.payment_method === 'grouped_with_host'
        );

        const isAwaitingFinish = reg.payment_status === 'pending'
            && reg.participation_status === 'confirmed'
            && reg.amount_override == null
            && !isPendingReview;

        const cfg = reg.participation_status === 'pending_approval'
            ? STATUS_CONFIG.pendingApproval
            : reg.participation_status === 'awaiting_checkin'
                ? STATUS_CONFIG.awaitingCheckin
                : isAwaitingFinish
                    ? STATUS_CONFIG.awaitingFinish
                    : isPendingReview
                        ? STATUS_CONFIG.pendingReview
                        : (STATUS_CONFIG[reg.payment_status] ?? STATUS_CONFIG.pending);
        const StatusIcon = cfg.icon;
        const busy = actionId === reg.id;
        const user = reg.users;
        const displayName = user?.full_name ?? reg.guest_full_name ?? '?';
        const displayGender = user?.gender ?? reg.guest_gender;

        const totalAmount = reg.amount_override;
        const hasBreakdown = totalAmount != null
            && reg.base_amount != null
            && reg.other_fee_amount != null
            && reg.other_fee_amount > 0
            && reg.payment_method !== 'grouped_with_host';

        const canReviewPayment =
            Boolean(reg.payment_reference) ||
            (reg.payment_method === 'cash' && reg.amount_override != null);

        const presentPhase = getPhase(`${reg.id}:present`);
        const absentPhase = getPhase(`${reg.id}:absent`);
        const confirmPhase = getPhase(`${reg.id}:confirm`);
        const approvePhase = getPhase(`${reg.id}:approve`);
        const rejectRegPhase = getPhase(`${reg.id}:rejectReg`);


        const actionsNode = reg.participation_status === 'pending_approval' ? (
            <>
                <MorphButton
                    phase={approvePhase}
                    idleIcon={<CheckCircle2 className="w-4 h-4" />}
                    label="Duyệt"
                    colorClass="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => handleApproveRegistration(reg.id)}
                    disabled={busy}
                />
                <MorphButton
                    phase={rejectRegPhase}
                    idleIcon={<XCircle className="w-4 h-4" />}
                    label="Từ chối"
                    colorClass="bg-red-100 hover:bg-red-200 text-red-600"
                    successColorClass="bg-red-500 text-white"
                    onClick={() => handleRejectRegistration(reg.id, displayName)}
                    disabled={busy}
                />
            </>
        ) : reg.participation_status === 'awaiting_checkin' ? (
            <>
                <MorphButton
                    phase={presentPhase}
                    idleIcon={<UserCheck className="w-4 h-4" />}
                    label="Có mặt"
                    colorClass="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleCheckinPresent(reg.id)}
                    disabled={busy}
                />
                <MorphButton
                    phase={absentPhase}
                    idleIcon={<UserX className="w-4 h-4" />}
                    label="Vắng mặt"
                    colorClass="bg-red-100 hover:bg-red-200 text-red-600"
                    successColorClass="bg-red-500 text-white"
                    onClick={() => handleCheckinAbsent(reg.id, displayName)}
                    disabled={busy}
                />
            </>
        ) : (reg.payment_proof_url || (reg.payment_status === 'pending' && canReviewPayment)) ? (
            <>
                {reg.payment_proof_url && (
                    <button
                        onClick={() => setViewingBillUrl(reg.payment_proof_url)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem ảnh bill chuyển khoản"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                )}

                {reg.payment_status === 'pending' && canReviewPayment && (
                    <>
                        <MorphButton
                            phase={confirmPhase}
                            idleIcon={<CheckCircle2 className="w-4 h-4" />}
                            label="Xác nhận"
                            colorClass="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleConfirm(reg.id)}
                            disabled={busy}
                        />
                        <button
                            onClick={() => setShowReject(showReject === reg.id ? null : reg.id)}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <XCircle className="w-4 h-4" />
                            Từ chối
                        </button>
                    </>
                )}
            </>
        ) : null;

        return (
            <div key={reg.id} className={isNested ? 'bg-gray-50/60' : ''}>
                <div className={isNested ? 'pl-9 pr-4 py-2.5' : 'px-4 py-3'}>
                    <div className="flex items-start gap-3">
                        {isNested && (
                            <CornerDownRight className="w-4 h-4 text-gray-300 mt-1.5 flex-shrink-0" />
                        )}

                        <div className={`rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden ${isNested ? 'w-7 h-7' : 'w-9 h-9'}`}>
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <span className={`text-blue-700 font-semibold ${isNested ? 'text-xs' : 'text-sm'}`}>
                                    {displayName?.[0]?.toUpperCase() ?? '?'}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-gray-900 ${isNested ? 'text-sm' : ''}`}>{displayName}</span>

                                {user?.member_type && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${user.member_type === 'co_dinh'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                        {user.member_type === 'co_dinh' ? '🔵 Thành viên' : '⚪ Vãng lai'}
                                    </span>
                                )}

                                {reg.is_guest && (
                                    <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                                        ⚪ Khách
                                    </span>
                                )}

                                {reg.payment_method === 'cash' && (
                                    <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                        💵 Tiền mặt
                                    </span>
                                )}

                                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 whitespace-nowrap ${cfg.cls}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {cfg.label}
                                </span>

                                {reg.points_awarded && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                        🏸 Đã cộng điểm
                                    </span>
                                )}

                                {reg.payment_method !== 'grouped_with_host' && (
                                    totalAmount != null ? (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium whitespace-nowrap">
                                            💰 {formatVnd(totalAmount)}
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 italic whitespace-nowrap">
                                            Chưa có giá
                                        </span>
                                    )
                                )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                                {user?.phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />{user.phone}
                                    </span>
                                )}
                                {user?.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />{user.email}
                                    </span>
                                )}

                                {displayGender && (
                                    <span>{displayGender === 'male' ? 'Nam' : 'Nữ'}</span>
                                )}
                                {reg.guest_skill_level && (
                                    <span>· {SKILL_LABEL[reg.guest_skill_level] ?? reg.guest_skill_level}</span>
                                )}

                                {reg.payment_reference && (
                                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                        {reg.payment_reference}
                                    </span>
                                )}
                            </div>

                            {hasBreakdown && (
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Sân + cầu: <span className="font-medium text-gray-500">{formatVnd(reg.base_amount)}</span>
                                    {' + '}Khoản khác: <span className="font-medium text-gray-500">{formatVnd(reg.other_fee_amount)}</span>
                                    {reg.other_fee_note && (
                                        <span className="italic"> ({reg.other_fee_note})</span>
                                    )}
                                    {' = '}<span className="font-semibold text-gray-600">{formatVnd(totalAmount)}</span>
                                </p>
                            )}

                            {reg.notes && (
                                <p className="text-xs text-gray-400 mt-1 italic">{reg.notes}</p>
                            )}
                        </div>
                    </div>

                    {actionsNode && (
                        <div className="flex items-center gap-2 flex-wrap mt-3 sm:justify-end">
                            {actionsNode}
                        </div>
                    )}
                </div>

                {showReject === reg.id && (
                    <div className={`${isNested ? 'pl-9 pr-4' : 'px-4'} pb-3 flex gap-2`}>
                        <input
                            type="text"
                            value={rejectNotes[reg.id] ?? ''}
                            onChange={e => setRejectNotes(n => ({ ...n, [reg.id]: e.target.value }))}
                            className="input-field text-sm flex-1"
                            placeholder="Lý do từ chối (tuỳ chọn)"
                        />
                        <MorphButton
                            phase={getPhase(`${reg.id}:rejectConfirm`)}
                            idleIcon={null}
                            label="Xác nhận từ chối"
                            idleWidthClass="w-40"
                            colorClass="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleReject(reg.id)}
                            disabled={busy}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <style>{`
                @keyframes morphTickPop {
                    0%   { transform: scale(0); opacity: 0; }
                    60%  { transform: scale(1.25); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .morph-tick {
                    animation: morphTickPop 0.3s ease-out;
                }

                @keyframes badgePop {
                    0%   { transform: scale(0.7) translateY(-4px); opacity: 0; }
                    60%  { transform: scale(1.05) translateY(0); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .badge-pop {
                    animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
            <div className="max-w-3xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button onClick={() => navigate('/sessions')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 flex-1 min-w-[100px] truncate">{session.title}</h1>

                    {canAddMember && (awaitingCheckin.length > 0 || pendingApproval.length > 0) && (
                        <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                            {pendingApproval.length > 0 && `Còn ${pendingApproval.length} đăng ký chờ duyệt`}
                            {pendingApproval.length > 0 && awaitingCheckin.length > 0 && ', '}
                            {awaitingCheckin.length > 0 && `${awaitingCheckin.length} người chưa điểm danh`}
                        </span>
                    )}

                    {awaitingCheckin.length > 0 && (
                        <button
                            onClick={handleCheckinAllPresent}
                            disabled={checkingInAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                            {checkingInAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                            <span className="hidden sm:inline">Điểm danh tất cả ({awaitingCheckin.length})</span>
                            <span className="sm:hidden">Tất cả</span>
                        </button>
                    )}
                    {canAddMember && awaitingCheckin.length === 0 && pendingApproval.length === 0 && (
                        <Link
                            to={`/sessions/${id}/finish`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors flex-shrink-0"
                        >
                            <Calculator className="w-4 h-4" /> Kết thúc
                        </Link>
                    )}

                    {canComplete && (
                        <button
                            onClick={async () => {
                                const msg = pending.length > 0
                                    ? `Xác nhận hoàn thành buổi đánh? ${pending.length} người đang "Chờ thanh toán" sẽ được tự động chuyển sang "Đã xác nhận thanh toán" + "Tiền mặt". Buổi sẽ bị khoá lại.`
                                    : 'Xác nhận hoàn thành buổi đánh? Buổi sẽ bị khoá lại.';
                                if (!confirm(msg)) return;
                                try {
                                    await sessionsApi.complete(id!);
                                    toast.success('Đã hoàn thành và khoá buổi đánh!');
                                    refreshSilently();
                                } catch (err: any) {
                                    toast.error(err?.response?.data?.message ?? 'Thất bại');
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex-shrink-0"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Hoàn thành
                        </button>
                    )}

                    {canAddMember && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors flex-shrink-0"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Thêm thành viên</span>
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

                {hasCostData && <SessionCostCard sessionId={id!} />}

                {/* Summary badges */}
                <div className="flex gap-3 flex-wrap">
                    {[
                        { label: 'Chờ duyệt', count: pendingApproval.length, cls: 'bg-orange-50 text-orange-600 border border-orange-200' },
                        { label: 'Chờ điểm danh', count: awaitingCheckin.length, cls: 'bg-slate-50 text-slate-600 border border-slate-200' },
                        { label: 'Chờ buổi đánh kết thúc', count: awaitingFinish.length, cls: 'bg-slate-50 text-slate-600 border border-slate-200' },
                        { label: 'Chờ thanh toán', count: pending.length, cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
                        { label: 'Chờ chốt thanh toán', count: pendingReview.length, cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
                        { label: 'Đã xác nhận thanh toán', count: confirmed.length, cls: 'bg-green-50 text-green-700 border border-green-200' },
                        { label: 'Thanh toán bị từ chối', count: rejected.length, cls: 'bg-red-50 text-red-600 border border-red-200' },
                    ]
                        .filter(({ count }) => count > 0)
                        .map(({ label, count, cls }) => (
                            <span
                                key={label}
                                className={`badge-pop px-3 py-1 rounded-full text-sm font-medium ${cls}`}
                            >
                                {label}: {count}
                            </span>
                        ))}
                </div>

                <div className="card !p-0 overflow-hidden">
                    {registrations.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p>Chưa có ai đăng ký buổi này</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {hostRegs.map((host) => {
                                const guests = guestsOf(host.id);
                                return (
                                    <div key={host.id}>
                                        {renderRow(host)}
                                        {guests.map((g) => renderRow(g, true))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {viewingBillUrl && typeof document !== 'undefined' && createPortal(
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
                    </div>,
                    document.body
                )}

                {/* ── Add member modal ── */}
                {showAddModal && typeof document !== 'undefined' && createPortal(
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

                            <div className="flex gap-1 px-5 pt-3">
                                {[['account', 'Có tài khoản'], ['guest', 'Khách không tài khoản']].map(([val, lbl]) => (
                                    <button key={val} onClick={() => setAddTab(val as any)}
                                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${addTab === val ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
                                        {lbl}
                                    </button>
                                ))}
                            </div>

                            <div className="p-5 space-y-4">
                                {addTab === 'account' ? (
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

                                        {selectedMembers.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedMembers.map(m => (
                                                    <span
                                                        key={m.id}
                                                        className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"
                                                    >
                                                        {m.full_name}
                                                        <button
                                                            onClick={() => setSelectedMembers(prev => prev.filter(x => x.id !== m.id))}
                                                            className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center"
                                                        >
                                                            <XCircle className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="max-h-72 overflow-y-auto -mx-1 border border-gray-100 rounded-xl">
                                            {searching ? (
                                                <p className="text-sm text-gray-400 text-center py-4">Đang tìm...</p>
                                            ) : searchResults.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-4">Không tìm thấy thành viên</p>
                                            ) : (
                                                <ul className="divide-y divide-gray-50">
                                                    {searchResults.map(m => {
                                                        const isSelected = selectedMembers.some(x => x.id === m.id);
                                                        return (
                                                            <li key={m.id}>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedMembers(prev =>
                                                                            isSelected
                                                                                ? prev.filter(x => x.id !== m.id)
                                                                                : [...prev, m]
                                                                        );
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                                                        }`}>
                                                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                        {m.avatar_url ? (
                                                                            <img
                                                                                src={m.avatar_url}
                                                                                alt={m.full_name}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                                            />
                                                                        ) : (
                                                                            <span className="text-xs font-semibold text-blue-700">
                                                                                {m.full_name?.[0]?.toUpperCase() ?? '?'}
                                                                            </span>
                                                                        )}
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
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>

                                        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                                            ⓘ Đã chọn {selectedMembers.length} thành viên. Mỗi người sẽ nhận được thông báo đã được thêm vào buổi. Thanh toán sau khi buổi kết thúc.
                                        </p>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                                            <input
                                                value={guestForm.full_name}
                                                onChange={e => setGuestForm(f => ({ ...f, full_name: e.target.value }))}
                                                className="input-field"
                                                placeholder="Tên khách"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                                                <select
                                                    value={guestForm.gender}
                                                    onChange={e => setGuestForm(f => ({ ...f, gender: e.target.value }))}
                                                    className="input-field"
                                                >
                                                    <option value="male">Nam</option>
                                                    <option value="female">Nữ</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Trình độ</label>
                                                <select
                                                    value={guestForm.skill_level}
                                                    onChange={e => setGuestForm(f => ({ ...f, skill_level: e.target.value }))}
                                                    className="input-field"
                                                >
                                                    <option value="">-- Chọn --</option>
                                                    <option value="yeu">Yếu</option>
                                                    <option value="trung_binh_yeu">TB Yếu</option>
                                                    <option value="trung_binh">Trung bình</option>
                                                    <option value="trung_binh_cong">TB+</option>
                                                    <option value="ban_chuyen">Bán chuyên</option>
                                                    <option value="chuyen_nghiep">Chuyên nghiệp</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Đi cùng (tuỳ chọn, để gộp tiền)
                                            </label>
                                            <select
                                                value={hostRegId}
                                                onChange={e => setHostRegId(e.target.value)}
                                                className="input-field"
                                            >
                                                <option value="">-- Không, tính tiền riêng --</option>
                                                {registrations.filter(r => !r.is_guest).map((r: any) => (
                                                    <option key={r.id} value={r.id}>{r.users?.full_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tuỳ chọn)</label>
                                            <input
                                                value={addNotes}
                                                onChange={e => setAddNotes(e.target.value)}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
                                <button onClick={closeAddModal} className="btn-secondary text-sm">Hủy</button>
                                <button
                                    onClick={handleAddMember}
                                    disabled={
                                        adding ||
                                        (addTab === 'account' ? selectedMembers.length === 0 : !guestForm.full_name.trim())
                                    }
                                    className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Thêm vào buổi{addTab === 'account' && selectedMembers.length > 1 ? ` (${selectedMembers.length})` : ''}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                }
            </div >
        </>
    );
}