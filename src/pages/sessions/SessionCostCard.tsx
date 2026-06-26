// src/components/sessions/SessionCostCard.tsx
import { useEffect, useState } from 'react';
import { sessionsApi } from '../../api';

function fmt(n: number) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

interface Props {
    sessionId: string;
}

export default function SessionCostCard({ sessionId }: Props) {
    const [cost, setCost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        sessionsApi.getCost(sessionId)
            .then(({ data }) => setCost(data))
            .finally(() => setLoading(false));
    }, [sessionId]);

    if (loading) return <div className="card animate-pulse h-48 bg-gray-100" />;
    if (!cost) return null;

    const { chi_phi, paid_list, summary } = cost;
    const hasConfirmed = summary.has_confirmed;

    return (
        <div className="space-y-3">

            {/* Chi phí thực tế */}
            <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🔑 Chi phí thực tế</p>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                        🏸 Cầu {chi_phi.shuttle_count} × {fmt(chi_phi.shuttle_price)}
                    </span>
                    <span className="font-medium">{fmt(chi_phi.shuttle_cost)}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">🏟 Sân</span>
                    <span className="font-medium">{fmt(chi_phi.court_fee)}</span>
                </div>

                <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                    <span>Tổng chi phí</span>
                    <span className="text-gray-900">{fmt(summary.total_cost)}</span>
                </div>
            </div>

            {/* Đã thu được */}
            {hasConfirmed ? (
                <div className="card space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">💰 Đã thu được</p>

                    <div className="space-y-1.5">
                        {paid_list.map((p: any) => (
                            <div key={p.registration_id} className="text-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-gray-700">{p.full_name}</span>
                                        {p.member_type === 'co_dinh' && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                                Thành viên
                                            </span>
                                        )}
                                        {p.member_type === 'vang_lai' && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                                                Vãng lai
                                            </span>
                                        )}
                                        {p.is_guest && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                                                Khách
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-medium text-blue-600 flex-shrink-0">{fmt(p.total_amount)}</span>
                                </div>
                                {p.guest_names.length > 0 && (
                                    <div className="pl-4 mt-0.5 text-xs text-gray-400">
                                        + khách đi cùng: {p.guest_names.join(', ')}
                                        {p.guests_amount > 0 ? ` (${fmt(p.guests_amount)})` : ' (đã gộp tiền)'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                        <span>Tổng đã thu</span>
                        <span className="text-blue-600">{fmt(summary.total_paid)}</span>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">💰 Đã thu được</p>
                    <p className="text-sm text-gray-400 italic">Chưa có ai được xác nhận thanh toán</p>
                </div>
            )}

            {/* Còn thiếu / dư */}
            {hasConfirmed && (
                <div className={`card space-y-1 border ${summary.remaining > 0 ? 'border-purple-200 bg-purple-50' : 'border-green-200 bg-green-50'}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ℹ️ Kết quả</p>
                    <p className={`text-sm ${summary.remaining > 0 ? 'text-purple-800' : 'text-green-700'}`}>
                        {fmt(summary.total_cost)} − {fmt(summary.total_paid)} = <strong>{fmt(Math.abs(summary.remaining))}</strong>
                        {summary.remaining > 0
                            ? ' → còn thiếu'
                            : summary.remaining < 0
                                ? ' → thu dư'
                                : ' → đủ chi phí 🎉'
                        }
                    </p>
                </div>
            )}

        </div>
    );
}