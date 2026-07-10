import { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2, XCircle, Hourglass, Clock,
    ChevronLeft, ChevronRight, RefreshCw,
    Swords, Users, Trophy, EyeOff, Eye,
    Plus,
    Trash2,
    Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api, matchesApi } from '../../api';
import { CreateMatchModal } from '../../components/matches/CreateMatchModal';


const STATUS_TABS = [
    { value: '', label: 'Tất cả', icon: RefreshCw, cls: 'text-gray-500' },
    { value: 'pending_approval', label: 'Chờ duyệt', icon: Hourglass, cls: 'text-amber-600' },
    { value: 'approved', label: 'Đã duyệt', icon: CheckCircle2, cls: 'text-green-600' },
    { value: 'rejected', label: 'Từ chối', icon: XCircle, cls: 'text-red-500' },
    { value: 'pending_result', label: 'Chờ kết quả', icon: Clock, cls: 'text-blue-500' },
];

const STATUS_BADGE: Record<string, string> = {
    pending_opponent: 'bg-gray-50 text-gray-600 border-gray-200',
    pending_result: 'bg-blue-50 text-blue-600 border-blue-200',
    pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABEL: Record<string, string> = {
    pending_opponent: 'Chờ đối thủ',
    pending_result: 'Chờ kết quả',
    pending_approval: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
};


function PlayerAvatar({ p, teamCls }: { p: any; teamCls: string }) {
    return p?.avatar_url
        ? <img src={p.avatar_url} alt={p.full_name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
        : <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${teamCls}`}>
            {p?.full_name?.[0]?.toUpperCase()}
        </div>;
}

function PlayerNames({ p1, p2 }: { p1: any; p2?: any }) {
    return (
        <div className="flex items-center gap-1.5">
            <PlayerAvatar p={p1} teamCls="bg-blue-100 text-blue-700" />
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{p1?.full_name}</span>
            {p2 && (
                <>
                    <span className="text-gray-300">/</span>
                    <PlayerAvatar p={p2} teamCls="bg-blue-100 text-blue-700" />
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{p2?.full_name}</span>
                </>
            )}
        </div>
    );
}

export default function MatchesAdminPage() {
    const [matches, setMatches] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setTab] = useState('pending_approval');
    const [page, setPage] = useState(1);
    const [actionId, setActionId] = useState<string | null>(null);
    const [showReject, setShowReject] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
    const [hiddenMap, setHiddenMap] = useState<Record<string, boolean>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showScoreInput, setShowScoreInput] = useState<string | null>(null);
    const [scoreInputs, setScoreInputs] = useState<Record<string, { score_a: string; score_b: string }>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [rollbackId, setRollbackId] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 15 };
            if (activeTab) params.status = activeTab;
            const { data } = await matchesApi.list(params);
            const list = data.data ?? [];
            setMatches(list);
            setMeta(data.meta ?? {});
            const initial: Record<string, boolean> = {};
            list.forEach((m: any) => {
                initial[m.id] = !!m.is_hidden;
            });
            setHiddenMap(initial);
        } finally {
            setLoading(false);
        }
    }, [activeTab, page]);

    useEffect(() => { fetchMatches(); }, [fetchMatches]);
    useEffect(() => { setPage(1); }, [activeTab]);

    const handleApprove = async (id: string, scorePayload?: { score_a: number; score_b: number }) => {
        setActionId(id);
        try {
            const match = matches.find(m => m.id === id);
            const nameById = new Map<string, string>();
            if (match) {
                [match.player_a1, match.player_a2, match.player_b1, match.player_b2]
                    .filter(Boolean)
                    .forEach((p: any) => nameById.set(p.id, p.full_name));
            }

            const { data } = await matchesApi.approve(id, scorePayload);

            const updates = data.rank_updates ?? [];
            const winners = updates.filter((u: any) => u.delta > 0);
            const losers = updates.filter((u: any) => u.delta < 0);

            const fmt = (u: any) => `${nameById.get(u.userId) ?? 'Người chơi'} ${u.delta > 0 ? '+' : ''}${u.delta}đ`;

            if (winners.length > 0) {
                toast.success(`🟢 Cộng điểm: ${winners.map(fmt).join(', ')}`);
            }
            if (losers.length > 0) {
                toast.error(`🔴 Trừ điểm: ${losers.map(fmt).join(', ')}`);
            }
            if (winners.length === 0 && losers.length === 0) {
                toast.success('✅ Đã duyệt trận đấu');
            }

            setShowScoreInput(null);
            fetchMatches();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Duyệt thất bại');
        } finally {
            setActionId(null);
        }
    };

    const handleApproveClick = (m: any) => {
        if (m.status === 'pending_result') {
            setShowScoreInput(m.id);
            return;
        }
        handleApprove(m.id);
    };

    const handleConfirmScoreAndApprove = (id: string) => {
        const input = scoreInputs[id];
        const scoreA = parseInt(input?.score_a ?? '', 10);
        const scoreB = parseInt(input?.score_b ?? '', 10);

        if (isNaN(scoreA) || isNaN(scoreB)) {
            toast.error('Vui lòng nhập đủ tỉ số 2 đội');
            return;
        }
        if (scoreA === scoreB) {
            toast.error('Tỉ số không được hoà');
            return;
        }
        handleApprove(id, { score_a: scoreA, score_b: scoreB });
    };

    const handleReject = async (id: string) => {
        const reason = rejectReason[id]?.trim();
        if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
        setActionId(id);
        try {
            await matchesApi.reject(id, reason);
            toast.success('Đã từ chối kết quả trận');
            setShowReject(null);
            fetchMatches();
        } finally {
            setActionId(null);
        }
    };

    const handleToggleHidden = async (id: string) => {
        const nextHidden = !hiddenMap[id];
        setHiddenMap(prev => ({ ...prev, [id]: nextHidden }));
        try {
            await api.patch(`/matches/${id}/visibility`, { is_hidden: nextHidden });
            toast.success(nextHidden ? '🙈 Đã ẩn khỏi member' : '👁 Đã hiện lại cho member');
        } catch {
            setHiddenMap(prev => ({ ...prev, [id]: !nextHidden }));
            toast.error('Thao tác thất bại');
        }
    };

    const handleDelete = async (id: string) => {
        setActionId(id);
        try {
            await matchesApi.delete(id);
            toast.success('🗑️ Đã xóa vĩnh viễn trận đấu');
            setDeleteId(null);
            fetchMatches();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Xóa thất bại');
        } finally {
            setActionId(null);
        }
    };

    const handleRollback = async (id: string) => {
        setActionId(id);
        try {
            const { data } = await matchesApi.rollback(id);
            toast.success(data.message ?? '↩️ Đã thu hồi kết quả trận đấu');
            setRollbackId(null);
            fetchMatches();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Thu hồi thất bại');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Swords className="w-6 h-6 text-blue-600" /> Trận giao hữu
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Duyệt kết quả và tính điểm</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tạo trận
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                {STATUS_TABS.map(({ value, label, icon: Icon, cls }) => (
                    <button
                        key={value}
                        onClick={() => setTab(value)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === value
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon className={`w-4 h-4 ${activeTab === value ? 'text-blue-600' : cls}`} />
                        {label}
                    </button>
                ))}
                <div className="flex-1" />
                <span className="self-center text-sm text-gray-400 pr-2">{meta.total ?? 0} trận</span>
            </div>

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="card h-28 animate-pulse bg-gray-100" />
                    ))
                ) : matches.length === 0 ? (
                    <div className="card py-16 text-center text-gray-400">
                        <Swords className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>Không có trận nào</p>
                    </div>
                ) : (
                    matches.map((m) => {
                        const busy = actionId === m.id;
                        // Cho phép duyệt cả khi pending_result (admin tự nhập tỉ số) hoặc pending_approval (đã có tỉ số)
                        const canApprove = m.status === 'pending_approval' || m.status === 'pending_result';
                        const isHidden = hiddenMap[m.id] ?? false;

                        const hasScore = (m.status === 'approved' || m.status === 'pending_approval') && m.sets?.length > 0;

                        return (
                            <div
                                key={m.id}
                                className={`card space-y-3 transition-opacity ${isHidden ? 'opacity-60' : ''}`}
                            >
                                {/* Hidden badge */}
                                {isHidden && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-2.5 py-1 w-fit">
                                        <EyeOff className="w-3 h-3" />
                                        Đang ẩn với member
                                    </div>
                                )}

                                {/* Row 1: Teams vs */}
                                <div className="flex items-center gap-3">
                                    {/* Team A */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 font-medium mb-1">ĐỘI A</p>
                                        <PlayerNames p1={m.player_a1} p2={m.player_a2} />
                                    </div>

                                    {/* Score */}
                                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                        {hasScore ? (() => {
                                            const s = m.sets[0];
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-2xl font-black ${m.winner_team === 'A' ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {s.score_a}
                                                    </span>
                                                    <span className="text-gray-300 text-lg">–</span>
                                                    <span className={`text-2xl font-black ${m.winner_team === 'B' ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {s.score_b}
                                                    </span>
                                                </div>
                                            );
                                        })() : (
                                            <span className="text-gray-300 text-sm">VS</span>
                                        )}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_BADGE[m.status] ?? ''}`}>
                                            {STATUS_LABEL[m.status]}
                                        </span>
                                    </div>

                                    {/* Team B */}
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className="text-[10px] text-gray-400 font-medium mb-1">ĐỘI B</p>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span className="text-sm font-medium text-gray-900 truncate max-w-[2000px]">
                                                {m.player_b1?.full_name}
                                            </span>
                                            <PlayerAvatar p={m.player_b1} teamCls="bg-red-100 text-red-700" />
                                            {m.player_b2 && (
                                                <>
                                                    <span className="text-gray-300">/</span>
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[2000px]">
                                                        {m.player_b2?.full_name}
                                                    </span>
                                                    <PlayerAvatar p={m.player_b2} teamCls="bg-red-100 text-red-700" />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                {m.match_type === 'doubles'
                                                    ? <><Users className="w-3 h-3" /> Đôi</>
                                                    : <><Trophy className="w-3 h-3" /> Đơn</>
                                                }
                                            </span>
                                            {m.played_at && (
                                                <span>{format(new Date(m.played_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        {canApprove && showReject !== m.id && showScoreInput !== m.id && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveClick(m)}
                                                    disabled={busy}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {m.status === 'pending_result' ? 'Nhập tỉ số & Duyệt' : 'Duyệt'}
                                                </button>
                                                {m.status === 'pending_approval' && (
                                                    <button
                                                        onClick={() => setShowReject(m.id)}
                                                        disabled={busy}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Từ chối
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {m.status === 'approved' && (
                                            <div className="text-right">
                                                <p className="text-xs text-green-600 font-medium">✅ Đã tính điểm</p>
                                                <p className="text-[10px] text-gray-400">
                                                    {m.winner_team === 'A'
                                                        ? `${m.player_a1?.full_name} thắng`
                                                        : `${m.player_b1?.full_name} thắng`}
                                                </p>
                                            </div>
                                        )}

                                        {m.status === 'rejected' && m.reject_reason && !m.reject_reason.includes('chưa') && (
                                            <p className="text-xs text-red-500 max-w-[160px] text-right">{m.reject_reason}</p>
                                        )}

                                        {/* Nút ẩn/hiện (admin only) */}
                                        <button
                                            onClick={() => handleToggleHidden(m.id)}
                                            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${isHidden
                                                ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                                                : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                                }`}
                                            title={isHidden ? 'Hiện lại với member' : 'Ẩn khỏi member'}
                                        >
                                            {isHidden
                                                ? <><RefreshCw className="w-3 h-3" /> Khôi phục</>
                                                : <><EyeOff className="w-3 h-3" /> Ẩn</>
                                            }
                                        </button>

                                        {deleteId === m.id && (
                                            <div className="flex items-center gap-2 pt-1 bg-red-50 border border-red-100 rounded-lg p-2.5">
                                                <p className="text-xs text-red-600 flex-1">
                                                    Xóa vĩnh viễn trận này? Hành động không thể hoàn tác.
                                                </p>
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    disabled={actionId === m.id}
                                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    Xác nhận xóa
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(null)}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}

                                        {rollbackId === m.id && (
                                            <div className="flex items-center gap-2 pt-1 bg-orange-50 border border-orange-100 rounded-lg p-2.5">
                                                <p className="text-xs text-orange-700 flex-1">
                                                    Thu hồi kết quả? Tỉ số sẽ bị xóa, trận về "Chờ kết quả", và điểm rank + bao điểm đã cộng/trừ cho các người chơi sẽ bị thu hồi. Member sẽ nhận thông báo.
                                                </p>
                                                <button
                                                    onClick={() => handleRollback(m.id)}
                                                    disabled={actionId === m.id}
                                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    Xác nhận thu hồi
                                                </button>
                                                <button
                                                    onClick={() => setRollbackId(null)}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {m.status !== 'approved' && (
                                    <button
                                        onClick={() => setDeleteId(m.id)}
                                        disabled={actionId === m.id}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                        title="Xóa vĩnh viễn trận đấu"
                                    >
                                        <Trash2 className="w-3 h-3" /> Xóa
                                    </button>
                                )}

                                {m.status === 'approved' && (
                                    <button
                                        onClick={() => setRollbackId(m.id)}
                                        disabled={actionId === m.id}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50"
                                        title="Thu hồi kết quả, hủy tỉ số và thu hồi điểm"
                                    >
                                        <Undo2 className="w-3 h-3" /> Hoàn tác
                                    </button>
                                )}

                                {showScoreInput === m.id && (
                                    <div className="flex items-center gap-2 pt-1">
                                        <input
                                            type="number"
                                            min={0}
                                            value={scoreInputs[m.id]?.score_a ?? ''}
                                            onChange={e => setScoreInputs(s => ({
                                                ...s,
                                                [m.id]: { ...s[m.id], score_a: e.target.value },
                                            }))}
                                            className="input-field text-sm w-20 text-center"
                                            placeholder="Đội A"
                                            autoFocus
                                        />
                                        <span className="text-gray-300">–</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={scoreInputs[m.id]?.score_b ?? ''}
                                            onChange={e => setScoreInputs(s => ({
                                                ...s,
                                                [m.id]: { ...s[m.id], score_b: e.target.value },
                                            }))}
                                            className="input-field text-sm w-20 text-center"
                                            placeholder="Đội B"
                                        />
                                        <button
                                            onClick={() => handleConfirmScoreAndApprove(m.id)}
                                            disabled={busy}
                                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg disabled:opacity-50 whitespace-nowrap"
                                        >
                                            Xác nhận duyệt
                                        </button>
                                        <button
                                            onClick={() => setShowScoreInput(null)}
                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}

                                {showReject === m.id && (
                                    <div className="flex gap-2 pt-1">
                                        <input
                                            type="text"
                                            value={rejectReason[m.id] ?? ''}
                                            onChange={e => setRejectReason(r => ({ ...r, [m.id]: e.target.value }))}
                                            className="input-field text-sm flex-1"
                                            placeholder="Lý do từ chối (bắt buộc)"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleReject(m.id)}
                                            disabled={busy}
                                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-50 whitespace-nowrap"
                                        >
                                            Xác nhận
                                        </button>
                                        <button
                                            onClick={() => setShowReject(null)}
                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {showCreateModal && (
                <CreateMatchModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        setTab('pending_result');
                        setPage(1);
                    }}
                />
            )}

            {meta.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Trang {meta.page}/{meta.total_pages} ({meta.total} trận)
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