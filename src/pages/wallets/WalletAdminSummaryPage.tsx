import { useState, useEffect, useCallback } from 'react';
import {
    Loader2, Wallet, Search,
    TrendingDown, Users, AlertTriangle,
    Download, ChevronLeft, ChevronRight, MoreHorizontal,
    Plus, SlidersHorizontal, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { walletAdminApi } from '../../api';

function fmt(n: number) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

function relativeDay(dateStr: string | null) {
    if (!dateStr) return '—';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    return `${days} ngày trước`;
}

const TIER_STYLE: Record<string, { color: string; bg: string; dot: string }> = {
    'Tân thủ': { color: 'text-gray-600', bg: 'bg-gray-100', dot: '🔘' },
    'Phong trào': { color: 'text-green-700', bg: 'bg-green-50', dot: '🟢' },
    'Cứng cựa': { color: 'text-cyan-700', bg: 'bg-cyan-50', dot: '🔵' },
    'Chủ lực': { color: 'text-blue-700', bg: 'bg-blue-50', dot: '🔷' },
    'Cao thủ': { color: 'text-purple-700', bg: 'bg-purple-50', dot: '🟣' },
    'Kiện tướng': { color: 'text-amber-700', bg: 'bg-amber-50', dot: '🥇' },
    'Đại Kiện Tướng': { color: 'text-orange-700', bg: 'bg-orange-50', dot: '🏆' },
    'Huyền Thoại': { color: 'text-rose-700', bg: 'bg-rose-50', dot: '👑' },
};

function RankTag({ tier, points }: { tier: string | null; points?: number }) {
    if (!tier) return <span className="text-xs text-gray-300">—</span>;
    const t = TIER_STYLE[tier] ?? { color: 'text-gray-600', bg: 'bg-gray-100', dot: '•' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${t.bg} ${t.color}`}>
            <span>{t.dot}</span>{tier}
            {typeof points === 'number' && <span className="opacity-60">· {points}/50</span>}
        </span>
    );
}

function StatusBadge({ balance }: { balance: number }) {
    if (balance < 0)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 whitespace-nowrap">Âm ví</span>;
    if (balance === 0)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 whitespace-nowrap">Hết tiền</span>;
    if (balance < 50000)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 whitespace-nowrap">Sắp hết</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 whitespace-nowrap">Bình thường</span>;
}

function MemberPanel({ member, onClose, onChanged }: { member: any; onClose: () => void; onChanged: () => void }) {
    const [showTopup, setShowTopup] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(true);

    const fetchTx = useCallback(async () => {
        setLoadingTx(true);
        try {
            const { data } = await walletAdminApi.getMemberTransactions(member.id, { limit: 20 });
            setTransactions(data.data ?? []);
        } finally {
            setLoadingTx(false);
        }
    }, [member.id]);

    useEffect(() => { fetchTx(); }, [fetchTx]);

    const handleSubmit = async (isTopup: boolean) => {
        const val = Number(amount);
        if (!val || (isTopup && val < 1000)) { toast.error('Số tiền không hợp lệ'); return; }
        setSubmitting(true);
        try {
            if (isTopup) {
                await walletAdminApi.manualTopup(member.id, val, note || undefined);
            } else {
                await walletAdminApi.manualAdjust(member.id, val, note || undefined);
            }
            toast.success('Đã cập nhật số dư');
            setShowTopup(false); setShowAdjust(false); setAmount(''); setNote('');
            fetchTx();
            onChanged();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white lg:border-l border-gray-100">
            <div className="flex items-start justify-between p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-base sm:text-lg font-bold text-white flex-shrink-0">
                        {member.full_name[0]}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{member.full_name}</p>
                        <RankTag tier={member.tier} points={member.total_points} />
                        <p className="text-xs text-gray-400 mt-0.5">{member.phone}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Số dư ví hiện tại</p>
                <p className={`text-2xl sm:text-3xl font-black ${member.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {fmt(member.balance)}
                </p>
            </div>

            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex gap-2">
                <button onClick={() => { setShowTopup(true); setShowAdjust(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold">
                    <Plus className="w-3.5 h-3.5" /> Nạp tiền
                </button>
                <button onClick={() => { setShowAdjust(true); setShowTopup(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Điều chỉnh
                </button>
            </div>

            {(showTopup || showAdjust) && (
                <div className="px-4 sm:px-5 py-3 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-semibold text-blue-800 mb-2">
                        {showTopup ? 'Nạp tiền thủ công' : 'Điều chỉnh số dư (có thể nhập số âm)'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                            placeholder="Số tiền" className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
                        <input value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Ghi chú" className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
                        <button onClick={() => handleSubmit(showTopup)} disabled={submitting}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-1">
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'OK'}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-5 pt-4 pb-2">
                    <p className="font-bold text-gray-900 text-sm">Lịch sử giao dịch</p>
                </div>
                {loadingTx ? (
                    <div className="px-4 sm:px-5 py-6 text-center text-gray-400 text-sm">Đang tải...</div>
                ) : transactions.length === 0 ? (
                    <div className="px-4 sm:px-5 py-6 text-center text-gray-400 text-sm">Chưa có giao dịch nào</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                            <tbody>
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 border-b border-gray-50">
                                        <td className="px-4 sm:px-5 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                                            {format(new Date(tx.created_at), 'dd/MM/yyyy', { locale: vi })}
                                        </td>
                                        <td className="px-2 py-2.5 text-gray-700">{tx.title}</td>
                                        <td className={`px-2 py-2.5 font-bold text-right whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                                        </td>
                                        <td className="px-4 sm:px-5 py-2.5 text-xs text-gray-400 text-right whitespace-nowrap">
                                            {fmt(tx.balance_after)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WalletAdminSummaryPage() {
    const [stats, setStats] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, total_pages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [rankFilter, setRankFilter] = useState('');
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [page, setPage] = useState(1);
    const perPage = 8;

    const fetchSummary = useCallback(async () => {
        const { data } = await walletAdminApi.getSummary();
        setStats(data);
    }, []);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await walletAdminApi.listMembers({
                search: search || undefined,
                status: statusFilter || undefined,
                rank: rankFilter || undefined,
                page, limit: perPage,
            });
            setMembers(data.data ?? []);
            setMeta(data.meta ?? {});
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, rankFilter, page]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    // debounce search 350ms
    useEffect(() => {
        const t = setTimeout(() => { setPage(1); fetchMembers(); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { fetchMembers(); }, [statusFilter, rankFilter, page]);

    const totalPages = meta.total_pages ?? 0;

    if (!stats) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
    }

    const statCards = [
        {
            label: 'Tổng số dư CLB đang giữ', value: fmt(stats.club_balance),
            delta: `${stats.club_balance_delta >= 0 ? '+' : ''}${fmt(stats.club_balance_delta)} trong 30 ngày qua`,
            deltaPositive: stats.club_balance_delta >= 0,
            icon: <Wallet className="w-5 h-5 text-blue-600" />, iconBg: 'bg-blue-50',
        },
        {
            label: 'Thành viên còn tiền', value: String(stats.member_count),
            delta: `${stats.member_pct}% tổng thành viên`, deltaPositive: true,
            icon: <Users className="w-5 h-5 text-emerald-600" />, iconBg: 'bg-emerald-50',
        },
        {
            label: 'Thành viên âm ví', value: String(stats.negative_count),
            delta: `${stats.negative_pct}% tổng thành viên`, deltaPositive: false,
            icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, iconBg: 'bg-orange-50',
        },
        {
            label: 'Tổng công nợ', value: fmt(stats.total_debt),
            delta: 'Chưa có dữ liệu so sánh tháng trước', deltaPositive: false,
            icon: <TrendingDown className="w-5 h-5 text-purple-600" />, iconBg: 'bg-purple-50',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-gray-900 text-base sm:text-lg">Ví BNB</span>
                </div>
            </div>

            <div className="px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
                {/* ── Stat cards: 2 cột trên mobile, 4 cột trên desktop ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {statCards.map(s => (
                        <div key={s.label} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconBg}`}>{s.icon}</div>
                                <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">{s.label}</p>
                            </div>
                            <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">{s.value}</p>
                            <p className={`text-[10px] sm:text-xs mt-1 font-medium ${s.deltaPositive ? 'text-emerald-600' : 'text-red-500'}`}>{s.delta}</p>
                        </div>
                    ))}
                </div>

                <div className={`flex flex-col lg:flex-row gap-4 ${selectedMember ? 'lg:items-start' : ''}`}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 min-w-0">
                        {/* ── Thanh tìm kiếm + filter: xếp dọc trên mobile ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Tìm kiếm thành viên..."
                                    className="pl-8 pr-3 py-2 sm:py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-full"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700">
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="ok">Bình thường</option>
                                    <option value="low">Sắp hết</option>
                                    <option value="negative">Âm ví</option>
                                </select>
                                <select value={rankFilter} onChange={e => { setRankFilter(e.target.value); setPage(1); }}
                                    className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700">
                                    <option value="">Tất cả hạng</option>
                                    {Object.keys(TIER_STYLE).map(k => <option key={k} value={k}>{TIER_STYLE[k].dot} {k}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ── Danh sách: bảng cuộn ngang trên mobile, ẩn bớt cột phụ ── */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[640px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Thành viên</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Hạng</th>
                                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Số dư ví</th>
                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Trạng thái</th>
                                        <th className="hidden sm:table-cell text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Buổi gần nhất</th>
                                        <th className="px-4 sm:px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}><td colSpan={6} className="px-4 sm:px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                                        ))
                                    ) : members.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 sm:px-5 py-12 text-center text-gray-400">Không tìm thấy thành viên</td></tr>
                                    ) : members.map(m => (
                                        <tr key={m.id}
                                            className={`border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors ${selectedMember?.id === m.id ? 'bg-blue-50' : ''}`}
                                            onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}
                                        >
                                            <td className="px-4 sm:px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                                        {m.full_name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{m.full_name}</p>
                                                        <p className="text-xs text-gray-400">{m.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3"><RankTag tier={m.tier} points={m.total_points} /></td>
                                            <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${m.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                                {fmt(m.balance)}
                                            </td>
                                            <td className="px-3 py-3 text-center"><StatusBadge balance={m.balance} /></td>
                                            <td className="hidden sm:table-cell px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{relativeDay(m.last_session_at)}</td>
                                            <td className="px-4 sm:px-5 py-3 text-right">
                                                <button
                                                    onClick={e => { e.stopPropagation(); setSelectedMember(m); }}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
                                                >
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Phân trang: xếp dọc trên mobile ── */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 order-2 sm:order-1">
                                Hiển thị {(page - 1) * perPage + 1} – {Math.min(page * perPage, meta.total ?? 0)} của {meta.total ?? 0} thành viên
                            </p>
                            <div className="flex items-center gap-1 order-1 sm:order-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-7 h-7 rounded-md text-xs font-medium ${page === p ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                                        {p}
                                    </button>
                                ))}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                                    className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Panel chi tiết: full-width overlay trên mobile, panel cố định bên phải trên desktop ── */}
                    {selectedMember && (
                        <>
                            {/* Lớp phủ nền tối, chỉ hiện trên mobile/tablet để tap ra ngoài đóng panel */}
                            <div
                                className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                                onClick={() => setSelectedMember(null)}
                            />
                            <div
                                className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl overflow-hidden flex flex-col
                                           lg:static lg:z-auto lg:w-[420px] lg:flex-shrink-0 lg:rounded-xl lg:max-h-[calc(100vh-200px)]
                                           bg-white shadow-sm border border-gray-100"
                            >
                                <div className="lg:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
                                    <span className="w-10 h-1 rounded-full bg-gray-200" />
                                </div>
                                <div className="flex-1 min-h-0">
                                    <MemberPanel
                                        member={selectedMember}
                                        onClose={() => setSelectedMember(null)}
                                        onChanged={() => { fetchMembers(); fetchSummary(); }}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}