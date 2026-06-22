import { useState, useEffect, useCallback } from 'react';
import {
    Wallet, RefreshCw, Calendar, Users, TrendingUp,
    ChevronDown, ArrowUpDown, Download,
} from 'lucide-react';
import { guestsApi } from '../../api';

type SortKey = 'total_payment' | 'total_day' | 'daily_average' | 'full_name';

const PERSON_TYPE_LABEL: Record<string, { label: string; cls: string }> = {
    member: { label: 'Thành viên', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    guest: { label: 'Khách vãng lai', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const GENDER_LABEL: Record<string, string> = {
    male: 'Nam', female: 'Nữ', other: 'Khác',
};

function formatMonth(monthStr?: string) {
    if (!monthStr) return '—';
    const d = new Date(monthStr);
    return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
}

function generateMonthOptions(count = 18) {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = d.toISOString().slice(0, 10);
        opts.push({ value, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    return opts;
}

export default function CostReportPage() {
    const [mode, setMode] = useState<'monthly' | 'summary'>('summary');
    const [month, setMonth] = useState('');
    const [gender, setGender] = useState('');
    const [personType, setPersonType] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>('total_payment');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const monthOptions = generateMonthOptions();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (mode === 'summary') {
                const { data: res } = await guestsApi.costReportSummary();
                setData(res ?? []);
            } else {
                const params: any = {};
                if (month) params.month = month;
                if (gender) params.gender = gender;
                if (personType) params.person_type = personType;
                const { data: res } = await guestsApi.costReport(params);
                setData(res ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, [mode, month, gender, personType]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredData = mode === 'summary'
        ? data.filter(d => {
            if (gender && d.gender !== gender) return false;
            if (personType && d.person_type !== personType) return false;
            return true;
        })
        : data;

    const sortedData = [...filteredData].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'full_name') {
            cmp = (a.full_name ?? '').localeCompare(b.full_name ?? '', 'vi');
        } else {
            cmp = Number(a[sortKey] ?? 0) - Number(b[sortKey] ?? 0);
        }
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const totals = filteredData.reduce(
        (acc, d) => ({
            total_payment: acc.total_payment + Number(d.total_payment ?? 0),
            total_day: acc.total_day + Number(d.total_day ?? 0),
            count: acc.count + 1,
        }),
        { total_payment: 0, total_day: 0, count: 0 },
    );

    const exportCsv = () => {
        const headers = ['Họ tên', 'Giới tính', 'Loại', 'Số buổi', 'Tổng tiền', 'Trung bình/buổi'];
        const rows = sortedData.map(d => [
            d.full_name,
            GENDER_LABEL[d.gender] ?? '',
            PERSON_TYPE_LABEL[d.person_type]?.label ?? '',
            d.total_day ?? 0,
            d.total_payment ?? 0,
            d.daily_average ?? 0,
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cost-report-${mode}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-blue-600" /> Báo cáo chi phí
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Tổng hợp tiền đóng của thành viên và khách vãng lai
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportCsv}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Download className="w-4 h-4" /> Xuất CSV
                    </button>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 border-b border-gray-200">
                <button
                    onClick={() => setMode('summary')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${mode === 'summary'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" /> Tổng hợp toàn thời gian
                </button>
                <button
                    onClick={() => setMode('monthly')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${mode === 'monthly'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Calendar className="w-4 h-4" /> Theo tháng
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {mode === 'monthly' && (
                    <div className="relative">
                        <select
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Tất cả các tháng</option>
                            {monthOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                )}

                <div className="relative">
                    <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">Tất cả giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                    <select
                        value={personType}
                        onChange={e => setPersonType(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">Thành viên + Khách</option>
                        <option value="member">Chỉ thành viên</option>
                        <option value="guest">Chỉ khách vãng lai</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900">
                            {totals.total_payment.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-xs text-gray-500">Tổng tiền thu</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900">{totals.total_day}</p>
                        <p className="text-xs text-gray-500">Tổng lượt tham gia</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900">{totals.count}</p>
                        <p className="text-xs text-gray-500">Số người</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                            <th className="px-4 py-3 font-medium">
                                <button onClick={() => toggleSort('full_name')} className="flex items-center gap-1 hover:text-gray-700">
                                    Họ tên <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </th>
                            <th className="px-4 py-3 font-medium">Giới tính</th>
                            <th className="px-4 py-3 font-medium">Loại</th>
                            {mode === 'monthly' && <th className="px-4 py-3 font-medium">Tháng</th>}
                            <th className="px-4 py-3 font-medium text-right">
                                <button onClick={() => toggleSort('total_day')} className="flex items-center gap-1 ml-auto hover:text-gray-700">
                                    Số buổi <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </th>
                            <th className="px-4 py-3 font-medium text-right">
                                <button onClick={() => toggleSort('total_payment')} className="flex items-center gap-1 ml-auto hover:text-gray-700">
                                    Tổng tiền <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </th>
                            <th className="px-4 py-3 font-medium text-right">
                                <button onClick={() => toggleSort('daily_average')} className="flex items-center gap-1 ml-auto hover:text-gray-700">
                                    TB/buổi <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-4 py-3">
                                        <div className="h-5 bg-gray-100 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((d, idx) => {
                                const ptCfg = PERSON_TYPE_LABEL[d.person_type] ?? PERSON_TYPE_LABEL.member;
                                return (
                                    <tr key={`${d.full_name}-${d.person_type}-${idx}`} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{d.full_name}</td>
                                        <td className="px-4 py-3 text-gray-500">{GENDER_LABEL[d.gender] ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${ptCfg.cls}`}>
                                                {ptCfg.label}
                                            </span>
                                        </td>
                                        {mode === 'monthly' && (
                                            <td className="px-4 py-3 text-gray-500">{formatMonth(d.month)}</td>
                                        )}
                                        <td className="px-4 py-3 text-right text-gray-700">{d.total_day ?? 0}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-blue-700">
                                            {Number(d.total_payment ?? 0).toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500">
                                            {Number(d.daily_average ?? 0).toLocaleString('vi-VN')}đ
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}