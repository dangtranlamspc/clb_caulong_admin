import { useEffect, useState } from 'react';
import { Trophy, Medal, Star, RefreshCw } from 'lucide-react';
import { rankingsApi } from '../../api';

const LEVEL_CONFIG: Record<string, { cls: string; emoji: string }> = {
    'Cố định (tháng)': { cls: 'bg-purple-100 text-purple-800 border-purple-300', emoji: '🏆' },
    'Vãng lai cố định': { cls: 'bg-blue-100 text-blue-800 border-blue-300', emoji: '🥇' },
    'Vãng lai lâu lâu': { cls: 'bg-cyan-100 text-cyan-800 border-cyan-300', emoji: '🥈' },
    'Vãng lai lần đầu': { cls: 'bg-green-100 text-green-800 border-green-300', emoji: '🥉' },
    'Chưa có level': { cls: 'bg-gray-100 text-gray-500 border-gray-200', emoji: '—' },
};


function Shuttlecock({ size = 20 }: { size?: number }) {
    return (
        <img
            src='https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782118304/cau-long-icon_qeymuc.png'
            alt="cầu lông"
            width={size}
            height={size}
            style={{ objectFit: 'contain', display: 'inline-block' }}
        />
    );
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1)
        return (
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 shadow">
                <Trophy className="w-4 h-4 text-white" />
            </div>
        );
    if (rank === 2)
        return (
            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0 shadow">
                <Medal className="w-4 h-4 text-white" />
            </div>
        );
    if (rank === 3)
        return (
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 shadow">
                <Star className="w-4 h-4 text-white" />
            </div>
        );
    return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500">
            #{rank}
        </div>
    );
}

export default function LeaderboardPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: res } = await rankingsApi.leaderboard();
            setData(res);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const top3 = data.slice(0, 3);
    const rest = data.slice(3);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Bảng xếp hạng
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Tính theo số cầu lông tích lũy (mỗi buổi thanh toán xác nhận = +1 🏸)
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    title="Làm mới"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="card h-16 animate-pulse bg-gray-100" />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <div className="card py-16 text-center text-gray-400">
                    <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Chưa có dữ liệu xếp hạng</p>
                </div>
            ) : (
                <>
                    {/* Podium — top 3 */}
                    {top3.length >= 1 && (
                        <div className="grid grid-cols-3 gap-3">
                            {/* 2nd */}
                            <div className="flex flex-col items-center gap-2 pt-4">
                                {top3[1] ? (
                                    <>
                                        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600 shadow-inner">
                                            {top3[1].full_name?.[0]}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[90px]">{top3[1].full_name}</p>
                                            <p className="text-xs text-slate-500">🥈 #{top3[1].rank}</p>
                                            <p className="text-lg font-bold text-slate-600">{top3[1].total_points} <Shuttlecock size={35} /></p>
                                        </div>
                                    </>
                                ) : <div />}
                            </div>

                            {/* 1st */}
                            <div className="flex flex-col items-center gap-2">
                                {top3[0] && (
                                    <>
                                        <div className="relative">
                                            <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-yellow-100 flex items-center justify-center text-3xl font-bold text-yellow-700 shadow-lg border-2 border-yellow-400">
                                                {top3[0].full_name?.[0]}
                                            </div>
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[90px]">{top3[0].full_name}</p>
                                            <p className="text-xs text-yellow-600">🥇 #1</p>
                                            <p className="text-xl font-bold text-yellow-600">{top3[0].total_points} <Shuttlecock size={45} /></p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 3rd */}
                            <div className="flex flex-col items-center gap-2 pt-6">
                                {top3[2] ? (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-700 shadow-inner">
                                            {top3[2].full_name?.[0]}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[90px]">{top3[2].full_name}</p>
                                            <p className="text-xs text-amber-700">🥉 #{top3[2].rank}</p>
                                            <p className="text-lg font-bold text-amber-700">{top3[2].total_points} <Shuttlecock size={30} /></p>
                                        </div>
                                    </>
                                ) : <div />}
                            </div>
                        </div>
                    )}

                    {/* Full list */}
                    <div className="card !p-0 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {data.map((member) => {
                                const levelCfg = LEVEL_CONFIG[member.level] ?? LEVEL_CONFIG['Chưa có level'];
                                const isTop3 = member.rank <= 3;

                                return (
                                    <div
                                        key={member.id}
                                        className={`flex items-center gap-3 px-4 py-3 ${isTop3 ? 'bg-yellow-50/40' : 'hover:bg-gray-50'}`}
                                    >
                                        <RankBadge rank={Number(member.rank)} />

                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${isTop3 ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {member.full_name?.[0]?.toUpperCase()}
                                        </div>

                                        {/* Name + level */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${isTop3 ? 'text-gray-900' : 'text-gray-800'}`}>
                                                {member.full_name}
                                            </p>
                                            {member.level && member.level !== 'Chưa có level' && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full border inline-block mt-0.5 ${levelCfg.cls}`}>
                                                    {levelCfg.emoji} {member.level}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div className="text-right flex-shrink-0">
                                            <p className={`font-bold text-lg ${isTop3 ? 'text-yellow-600' : 'text-blue-600'}`}>
                                                <span className="flex items-center justify-end gap-1">
                                                    {member.total_points}
                                                    <Shuttlecock size={30} />
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-400">{member.total_sessions} buổi</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}