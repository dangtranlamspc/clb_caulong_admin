import { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2, XCircle, Loader2, Wallet, Eye, Search,
    TrendingUp, TrendingDown, Users, AlertTriangle,
    Download, ChevronLeft, ChevronRight, MoreHorizontal,
    Plus, SlidersHorizontal, X, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '../../api';

function fmt(n: number) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

const walletAdminApi = {
    listMembers: (params?: any) => api.get('/wallet/admin/members', { params }),
    listTopupRequests: (params?: any) => api.get('/wallet/admin/topup-requests', { params }),
    approve: (id: string) => api.patch(`/wallet/admin/topup-requests/${id}/approve`),
    reject: (id: string, reason: string) =>
        api.patch(`/wallet/admin/topup-requests/${id}/reject`, { reason }),
    getMemberDetail: (id: string) => api.get(`/wallet/admin/members/${id}`),
    getMemberTransactions: (id: string) => api.get(`/wallet/admin/members/${id}/transactions`),
    manualTopup: (id: string, amount: number, note: string) =>
        api.post(`/wallet/admin/members/${id}/topup`, { amount, note }),
    adjustBalance: (id: string, amount: number, note: string) =>
        api.post(`/wallet/admin/members/${id}/adjust`, { amount, note }),
};

type RankBadge = { label: string; color: string; bg: string; dot: string };
const RANK_MAP: Record<string, RankBadge> = {
    diamond: { label: 'Diamond', color: 'text-blue-700', bg: 'bg-blue-50', dot: '💎' },
    platinum: { label: 'Platinum', color: 'text-purple-700', bg: 'bg-purple-50', dot: '🔷' },
    gold: { label: 'Gold', color: 'text-amber-700', bg: 'bg-amber-50', dot: '🥇' },
    silver: { label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100', dot: '🥈' },
    bronze: { label: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-50', dot: '🥉' },
};

function RankTag({ rank }: { rank: string }) {
    const r = RANK_MAP[rank?.toLowerCase()] ?? { label: rank, color: 'text-gray-600', bg: 'bg-gray-100', dot: '•' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${r.bg} ${r.color}`}>
            <span>{r.dot}</span>{r.label}
        </span>
    );
}

function StatusBadge({ balance }: { balance: number }) {
    if (balance < 0)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Âm ví</span>;
    if (balance < 50000)
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Sắp hết</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">Bình thường</span>;
}

// ─── Summary stats ────────────────────────────────────────────────────────────
const MOCK_STATS = {
    club_balance: 18520000,
    club_balance_delta: 2150000,
    member_count: 86,
    member_pct: 80.4,
    negative_count: 4,
    negative_pct: 3.7,
    total_debt: 580000,
    debt_delta: -320000,
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_MEMBERS = [
    { id: '1', full_name: 'Lio', phone: '0966 123 456', rank: 'diamond', balance: 425000, last_session: 'Hôm qua' },
    { id: '2', full_name: 'Minh', phone: '0977 234 567', rank: 'platinum', balance: 90000, last_session: 'Hôm nay' },
    { id: '3', full_name: 'Hoàng', phone: '0922 345 678', rank: 'gold', balance: -45000, last_session: 'Hôm qua' },
    { id: '4', full_name: 'Nam', phone: '0988 456 789', rank: 'platinum', balance: -120000, last_session: '2 ngày trước' },
    { id: '5', full_name: 'Tuấn', phone: '0911 567 890', rank: 'gold', balance: 15000, last_session: '2 ngày trước' },
    { id: '6', full_name: 'Khoa', phone: '0933 678 901', rank: 'silver', balance: 230000, last_session: '3 ngày trước' },
    { id: '7', full_name: 'Phong', phone: '0909 789 012', rank: 'silver', balance: 0, last_session: '4 ngày trước' },
    { id: '8', full_name: 'Duy', phone: '0966 890 123', rank: 'diamond', balance: 560000, last_session: 'Hôm nay' },
];

const MOCK_TRANSACTIONS = [
    { id: 't1', date: '2024-06-28', title: 'Nạp tiền', amount: 500000, balance_after: 500000 },
    { id: 't2', date: '2024-06-28', title: 'Buổi Hưng Phát', amount: -60000, balance_after: 440000 },
    { id: 't3', date: '2024-06-30', title: 'Buổi Hưng Phát', amount: -60000, balance_after: 380000 },
    { id: 't4', date: '2024-07-02', title: 'Mua cầu', amount: -20000, balance_after: 360000 },
    { id: 't5', date: '2024-07-05', title: 'Nạp tiền', amount: 300000, balance_after: 660000 },
    { id: 't6', date: '2024-07-06', title: 'Buổi Hưng Phát', amount: -60000, balance_after: 600000 },
    { id: 't7', date: '2024-07-07', title: 'Buổi Hưng Phát', amount: -65000, balance_after: 535000 },
    { id: 't8', date: '2024-07-10', title: 'Nước uống', amount: -10000, balance_after: 525000 },
    { id: 't9', date: '2024-07-12', title: 'Buổi Hưng Phát', amount: -100000, balance_after: 425000 },
];

// ─── Member detail panel ──────────────────────────────────────────────────────
function MemberPanel({ member, onClose }: { member: any; onClose: () => void }) {
    const [showTopup, setShowTopup] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');
    const [topupNote, setTopupNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleTopup = async () => {
        const amount = Number(topupAmount);
        if (!amount || amount < 1000) { toast.error('Số tiền không hợp lệ'); return; }
        setSubmitting(true);
        try {
            await walletAdminApi.manualTopup(member.id, amount, topupNote);
            toast.success(`Đã nạp ${fmt(amount)} cho ${member.full_name}`);
            setShowTopup(false); setTopupAmount(''); setTopupNote('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Thất bại');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                        {member.full_name[0]}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{member.full_name}</p>
                        <RankTag rank={member.rank} />
                        <p className="text-xs text-gray-400 mt-0.5">{member.phone}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Balance */}
            <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Số dư ví hiện tại</p>
                <p className={`text-3xl font-black ${member.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {fmt(member.balance)}
                </p>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
                <button onClick={() => { setShowTopup(true); setShowAdjust(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
                    <Plus className="w-3.5 h-3.5" /> Nạp tiền
                </button>
                <button onClick={() => { setShowAdjust(true); setShowTopup(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Điều chỉnh
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium">
                    <Download className="w-3.5 h-3.5" /> Xuất lịch sử
                </button>
            </div>

            {/* Topup form */}
            {(showTopup || showAdjust) && (
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-semibold text-blue-800 mb-2">{showTopup ? 'Nạp tiền thủ công' : 'Điều chỉnh số dư'}</p>
                    <div className="flex gap-2">
                        <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                            placeholder="Số tiền" className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
                        <input value={topupNote} onChange={e => setTopupNote(e.target.value)}
                            placeholder="Ghi chú" className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
                        <button onClick={handleTopup} disabled={submitting}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-1">
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'OK'}
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction history */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-5 pt-4 pb-2">
                    <p className="font-bold text-gray-900 text-sm">Lịch sử giao dịch</p>
                </div>
                <table className="w-full text-sm">
                    <tbody>
                        {MOCK_TRANSACTIONS.map(tx => (
                            <tr key={tx.id} className="hover:bg-gray-50 border-b border-gray-50">
                                <td className="px-5 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                                    {format(new Date(tx.date), 'dd/MM/yyyy', { locale: vi })}
                                </td>
                                <td className="px-2 py-2.5 text-gray-700">{tx.title}</td>
                                <td className={`px-2 py-2.5 font-bold text-right whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                                </td>
                                <td className="px-5 py-2.5 text-xs text-gray-400 text-right whitespace-nowrap">
                                    {fmt(tx.balance_after)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-5 py-3">
                    <button className="text-sm text-blue-600 hover:underline font-medium">
                        Xem tất cả lịch sử →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WalletAdminPage() {
    const [members] = useState(MOCK_MEMBERS);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [rankFilter, setRankFilter] = useState('');
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [page, setPage] = useState(1);
    const perPage = 8;

    const filtered = members.filter(m => {
        const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
        const matchStatus = !statusFilter
            || (statusFilter === 'negative' && m.balance < 0)
            || (statusFilter === 'low' && m.balance >= 0 && m.balance < 50000)
            || (statusFilter === 'ok' && m.balance >= 50000);
        const matchRank = !rankFilter || m.rank === rankFilter;
        return matchSearch && matchStatus && matchRank;
    });

    const totalPages = Math.ceil(filtered.length / perPage);
    const paged = filtered.slice((page - 1) * perPage, page * perPage);

    const stats = MOCK_STATS;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-gray-900 text-lg">Ví BNB</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Tìm kiếm thành viên..."
                            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 space-y-5">
                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Tổng số dư CLB đang giữ',
                            value: fmt(stats.club_balance),
                            delta: `+${fmt(stats.club_balance_delta)} so với tháng trước`,
                            deltaPositive: true,
                            icon: <Wallet className="w-5 h-5 text-blue-600" />,
                            iconBg: 'bg-blue-50',
                        },
                        {
                            label: 'Thành viên còn tiền',
                            value: String(stats.member_count),
                            delta: `${stats.member_pct}% tổng thành viên`,
                            deltaPositive: true,
                            icon: <Users className="w-5 h-5 text-emerald-600" />,
                            iconBg: 'bg-emerald-50',
                        },
                        {
                            label: 'Thành viên âm ví',
                            value: String(stats.negative_count),
                            delta: `${stats.negative_pct}% tổng thành viên`,
                            deltaPositive: false,
                            icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
                            iconBg: 'bg-orange-50',
                        },
                        {
                            label: 'Tổng công nợ',
                            value: fmt(stats.total_debt),
                            delta: `${fmt(stats.debt_delta)} so với tháng trước`,
                            deltaPositive: false,
                            icon: <TrendingDown className="w-5 h-5 text-purple-600" />,
                            iconBg: 'bg-purple-50',
                        },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.iconBg}`}>{s.icon}</div>
                                <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className={`text-xs mt-1 font-medium ${s.deltaPositive ? 'text-emerald-600' : 'text-red-500'}`}>{s.delta}</p>
                        </div>
                    ))}
                </div>

                {/* Main area */}
                <div className={`flex gap-4 ${selectedMember ? 'items-start' : ''}`}>
                    {/* Table */}
                    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex-1 min-w-0 ${selectedMember ? 'w-0' : 'w-full'}`}>
                        {/* Table filters */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Tìm kiếm thành viên..."
                                    className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-full"
                                />
                            </div>
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700">
                                <option value="">Tất cả trạng thái</option>
                                <option value="ok">Bình thường</option>
                                <option value="low">Sắp hết</option>
                                <option value="negative">Âm ví</option>
                            </select>
                            <select value={rankFilter} onChange={e => { setRankFilter(e.target.value); setPage(1); }}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700">
                                <option value="">Tất cả hạng</option>
                                {Object.entries(RANK_MAP).map(([k, v]) => <option key={k} value={k}>{v.dot} {v.label}</option>)}
                            </select>
                            <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                                <Download className="w-3.5 h-3.5" /> Xuất Excel
                            </button>
                        </div>

                        {/* Table head */}
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Thành viên</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Hạng</th>
                                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Số dư ví</th>
                                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Trạng thái</th>
                                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Buổi gần nhất</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map(m => (
                                    <tr key={m.id}
                                        className={`border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors ${selectedMember?.id === m.id ? 'bg-blue-50' : ''}`}
                                        onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                                    {m.full_name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{m.full_name}</p>
                                                    <p className="text-xs text-gray-400">{m.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3"><RankTag rank={m.rank} /></td>
                                        <td className={`px-3 py-3 text-right font-bold ${m.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                            {fmt(m.balance)}
                                        </td>
                                        <td className="px-3 py-3 text-center"><StatusBadge balance={m.balance} /></td>
                                        <td className="px-3 py-3 text-gray-500 text-xs">{m.last_session}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={e => { e.stopPropagation(); setSelectedMember(m); }}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                                                >
                                                    Chi tiết
                                                </button>
                                                <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                                                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                Hiển thị {(page - 1) * perPage + 1} – {Math.min(page * perPage, filtered.length)} của {filtered.length} thành viên
                            </p>
                            <div className="flex items-center gap-1">
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
                                {totalPages > 5 && <span className="text-gray-400 text-xs px-1">...</span>}
                                {totalPages > 5 && (
                                    <button onClick={() => setPage(totalPages)}
                                        className={`w-7 h-7 rounded-md text-xs font-medium ${page === totalPages ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                                        {totalPages}
                                    </button>
                                )}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Member detail panel */}
                    {selectedMember && (
                        <div className="w-[420px] flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                            <MemberPanel member={selectedMember} onClose={() => setSelectedMember(null)} />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-300 py-4">
                © 2024 BNB Badminton Club. All rights reserved.
            </div>
        </div>
    );
}