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

    const { chi_phi, thu_vang_lai, co_dinh, summary } = cost;

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

            {/* Thu từ vãng lai */}
            <div className="card space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">💰 Thu từ vãng lai</p>

                {thu_vang_lai.male_count > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                            ♂ {thu_vang_lai.male_count} nam × {fmt(thu_vang_lai.price_male)}
                        </span>
                        <span className="font-medium text-blue-600">{fmt(thu_vang_lai.male_total)}</span>
                    </div>
                )}

                {thu_vang_lai.female_count > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                            ♀ {thu_vang_lai.female_count} nữ × {fmt(thu_vang_lai.price_female)}
                        </span>
                        <span className="font-medium text-pink-500">{fmt(thu_vang_lai.female_total)}</span>
                    </div>
                )}

                {co_dinh.count > 0 && (
                    <div className="flex justify-between text-sm text-gray-400">
                        <span>🔵 {co_dinh.count} cố định</span>
                        <span className="italic">→ phí tháng riêng</span>
                    </div>
                )}

                <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                    <span>Thu vãng lai</span>
                    <span className="text-blue-600">{fmt(thu_vang_lai.total)}</span>
                </div>
            </div>

            {/* Phần dư cố định bù */}
            {co_dinh.count > 0 && (
                <div className={`card space-y-1 border ${summary.phan_du_co_dinh > 0 ? 'border-purple-200 bg-purple-50' : 'border-green-200 bg-green-50'}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ℹ️ Cố định bù phần còn lại</p>
                    <p className={`text-sm ${summary.phan_du_co_dinh > 0 ? 'text-purple-800' : 'text-green-700'}`}>
                        {fmt(summary.total_cost)} − {fmt(thu_vang_lai.total)} = <strong>{fmt(summary.phan_du_co_dinh)}</strong>
                        {summary.phan_du_co_dinh > 0
                            ? ' → cố định bù qua phí tháng'
                            : ' → vãng lai đã đủ chi phí 🎉'
                        }
                    </p>

                    {/* Danh sách cố định */}
                    {co_dinh.members.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {co_dinh.members.map((m: any) => (
                                <span key={m.id} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    {m.full_name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}