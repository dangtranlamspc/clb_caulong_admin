import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Calculator, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionsApi } from '../../api';

function fmt(n: number) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

export default function SessionFinishPage() {
    const { id } = useParams<{ id: string }>();

    if (!id) {
        return <div className="max-w-2xl mx-auto text-center text-gray-400 py-10">Thiếu ID buổi đánh</div>;
    }

    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [registrations, setRegs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [courtFee, setCourtFee] = useState(0);
    const [shuttleCount, setShuttleCount] = useState(0);
    const [shuttlePrice, setShuttlePrice] = useState(0);
    const [amounts, setAmounts] = useState<Record<string, number>>({});

    useEffect(() => {
        Promise.all([sessionsApi.get(id), sessionsApi.getRegistrations(id)])
            .then(([{ data: s }, { data: r }]) => {
                setSession(s);
                setCourtFee(s.court_fee ?? 0);
                setShuttleCount(s.shuttle_count ?? 0);
                setShuttlePrice(s.shuttle_price ?? 0);

                const confirmed = r.filter((reg: any) => reg.participation_status !== 'declined');
                setRegs(confirmed);

                const priceMale = s.price_male ?? s.price_per_slot ?? 0;
                const priceFemale = s.price_female ?? s.price_per_slot ?? 0;
                const hosts = confirmed.filter((reg: any) => !reg.host_registration_id);
                const init: Record<string, number> = {};
                hosts.forEach((h: any) => {
                    const guests = confirmed.filter((reg: any) => reg.host_registration_id === h.id);
                    const hostGender = h.is_guest ? h.guest_gender : h.users?.gender;
                    const hostDefault = hostGender === 'female' ? priceFemale : priceMale;
                    const guestsDefault = guests.reduce((sum: number, g: any) =>
                        sum + (g.guest_gender === 'female' ? priceFemale : priceMale), 0);
                    init[h.id] = h.amount_override ?? (hostDefault + guestsDefault);
                });
                setAmounts(init);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const shuttleCost = shuttleCount * shuttlePrice;
    const totalCost = courtFee + shuttleCost;
    const totalCollected = Object.values(amounts).reduce((a, b) => a + (Number(b) || 0), 0);

    const hostRows = registrations.filter(r => !r.host_registration_id);
    const guestsOf = (hostId: string) => registrations.filter(r => r.host_registration_id === hostId);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await sessionsApi.finish(id, {
                court_fee: courtFee,
                shuttle_count: shuttleCount,
                shuttle_price: shuttlePrice,
                amounts: Object.entries(amounts).map(([registration_id, amount]) => ({
                    registration_id, amount: Number(amount) || 0,
                })),
            });
            toast.success('Đã kết thúc buổi và gửi hóa đơn thanh toán!');
            navigate(`/sessions/${id}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="max-w-2xl mx-auto"><div className="h-48 bg-gray-100 animate-pulse rounded-2xl" /></div>;
    if (!session) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/sessions/${id}`)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-900">Kết thúc buổi: {session.title}</h1>
                </div>
            </div>

            <div className="card space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Chi phí thực tế</p>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🏟 Tiền sân</label>
                    <input type="number" value={courtFee} onChange={e => setCourtFee(Number(e.target.value))} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Số bông cầu</label>
                        <input type="number" value={shuttleCount} onChange={e => setShuttleCount(Number(e.target.value))} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Giá 1 bông</label>
                        <input type="number" step="1000" value={shuttlePrice} onChange={e => setShuttlePrice(Number(e.target.value))} className="input-field" />
                    </div>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                    <span>Tổng chi phí</span><span>{fmt(totalCost)}</span>
                </div>
            </div>

            <div className="card !p-0 overflow-hidden">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-4">Số tiền từng người phải trả</p>
                <div className="divide-y divide-gray-100">
                    {hostRows.map(h => {
                        const guests = guestsOf(h.id);
                        const name = h.is_guest ? h.guest_full_name : h.users?.full_name;
                        return (
                            <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {name} {h.is_guest && <span className="text-xs text-gray-400">(khách)</span>}
                                        {!h.user_id && !h.is_guest && <span className="text-xs text-amber-500">⚠ chưa xác nhận</span>}
                                    </p>
                                    {guests.length > 0 && (
                                        <p className="text-xs text-purple-600 mt-0.5">
                                            + đi cùng: {guests.map(g => g.guest_full_name).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    value={amounts[h.id] ?? 0}
                                    onChange={e => setAmounts(a => ({ ...a, [h.id]: Number(e.target.value) }))}
                                    className="input-field w-32 text-right text-sm"
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between text-sm font-bold px-4 py-3 bg-gray-50">
                    <span>Tổng thu</span><span className="text-blue-600">{fmt(totalCollected)}</span>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button onClick={() => navigate(`/sessions/${id}`)} className="btn-secondary text-sm">Hủy</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2 text-sm">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Gửi hóa đơn thanh toán
                </button>
            </div>
        </div>
    );
}