import { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, Swords, Trophy } from 'lucide-react';
import { rankingsApi } from '../../api';
import { getTierConfig } from './rankConfig';
import { RankIcon } from '../../components/RankIcon';
import { RankPodiumAvatar } from '../../components/Rank';
import { RankPodiumAvatarList } from '../../components/Rank_for_list';

type Tab = 'winrate' | 'rank';

const TOP3_STYLES = [
    { bg: 'bg-yellow-50', avatarBg: 'bg-yellow-100', avatarText: 'text-yellow-700', border: 'border-yellow-300', medal: '🥇', label: 'text-yellow-600' },
    { bg: 'bg-slate-50', avatarBg: 'bg-slate-100', avatarText: 'text-slate-600', border: 'border-slate-300', medal: '🥈', label: 'text-slate-500' },
    { bg: 'bg-amber-50', avatarBg: 'bg-amber-100', avatarText: 'text-amber-700', border: 'border-amber-300', medal: '🥉', label: 'text-amber-700' },
];

function PositionBadge({ pos }: { pos: number }) {
    const s = TOP3_STYLES[pos - 1];
    if (s) return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${s.avatarBg} ${s.avatarText} border ${s.border}`}>
            {s.medal}
        </div>
    );
    return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold bg-gray-100 text-gray-500">
            #{pos}
        </div>
    );
}

function WinRateBadge({ percent }: { percent: number }) {
    const color = percent >= 70 ? 'bg-green-100 text-green-800'
        : percent >= 50 ? 'bg-blue-100 text-blue-800'
            : percent >= 30 ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800';
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
            {percent.toFixed(1)}%
        </span>
    );
}

function WinRateBar({ percent }: { percent: number }) {
    const color = percent >= 70 ? 'bg-green-500'
        : percent >= 50 ? 'bg-blue-500'
            : percent >= 30 ? 'bg-amber-400'
                : 'bg-red-400';
    return (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
    );
}

function WinRatePodium({ top3 }: { top3: any[] }) {
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const podiumStyles = [
        { pt: 'pt-4', avatarSize: 'w-14 h-14 text-2xl', crown: false, valueClass: 'text-lg font-bold text-slate-600' },
        { pt: 'pt-0', avatarSize: 'w-[72px] h-[72px] text-3xl', crown: true, valueClass: 'text-xl font-bold text-green-600' },
        { pt: 'pt-6', avatarSize: 'w-12 h-12 text-xl', crown: false, valueClass: 'text-lg font-bold text-amber-700' },
    ];
    const medals = ['🥈', '🥇', '🥉'];
    const positions = [2, 1, 3];

    return (
        <div className="grid grid-cols-3 gap-3">
            {podiumOrder.map((p, i) => {
                if (!p) return <div key={i} />;
                const style = podiumStyles[i];
                const s = TOP3_STYLES[positions[i] - 1];
                return (
                    <div key={p.id} className={`flex flex-col items-center gap-2 ${style.pt}`}>
                        <div className="relative">
                            <div className={`${style.avatarSize} rounded-full ${s.avatarBg} ${s.avatarText} flex items-center justify-center font-bold shadow-inner border ${s.border}`}>
                                {p.full_name?.[0]}
                            </div>
                            {style.crown && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{p.full_name}</p>
                            <p className={`text-xs ${s.label}`}>{medals[i]} #{positions[i]}</p>
                            <p className={style.valueClass}>{Number(p.win_rate_percent).toFixed(1)}%</p>
                            <p className="text-xs text-gray-400">{p.sets_won_month}W / {p.sets_lost_month}L</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function WinRateList({ data }: { data: any[] }) {
    return (
        <div className="card !p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {data.map((member, idx) => {
                    const isTop3 = idx < 3;
                    const s = TOP3_STYLES[idx];
                    const winRate = Number(member.win_rate_percent);
                    return (
                        <div key={member.id} className={`flex items-center gap-3 px-4 py-3 ${isTop3 ? s.bg : 'hover:bg-gray-50'}`}>
                            <PositionBadge pos={idx + 1} />
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${isTop3 ? `${s.avatarBg} ${s.avatarText}` : 'bg-green-100 text-green-700'}`}>
                                {member.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">{member.full_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <WinRateBar percent={winRate} />
                                    <span className="text-xs text-gray-400 flex-shrink-0">{member.total_sets_month ?? 0} set</span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 space-y-0.5">
                                <div className="flex justify-end"><WinRateBadge percent={winRate} /></div>
                                <p className="text-xs text-gray-400">
                                    <span className="text-green-600 font-medium">{member.sets_won_month}W</span>
                                    {' / '}
                                    <span className="text-red-400 font-medium">{member.sets_lost_month}L</span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function TierBadge({ tier, division, points }: { tier: string; division: string; points: number }) {
    const cfg = getTierConfig(tier);
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {tier} {division}
        </span>
    );
}

function RankPodium({ top3 }: { top3: any[] }) {
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const iconSizes = [110, 140, 110];
    const podiumPt = ['mt-8', 'mt-0', 'mt-12'];
    const crowns = [false, true, false];
    const positions = [2, 1, 3];

    return (
        <div className="grid grid-cols-3 gap-3">
            {podiumOrder.map((p, i) => {
                if (!p) return <div key={i} />;
                const cfg = getTierConfig(p.tier);
                const s = TOP3_STYLES[positions[i] - 1];
                return (
                    <div
                        key={p.id}
                        className={`flex flex-col items-center ${podiumPt[i]}`}
                        style={{ overflow: 'visible' }}
                    >
                        <div
                            className="relative flex items-center justify-center pb-20"
                            style={{
                                height: iconSizes[i],
                                overflow: 'visible',
                            }}
                        >
                            <RankPodiumAvatar
                                tier={p.tier}
                                avatar={p.avatar_url}
                                name={p.full_name}
                                size={iconSizes[i]}
                                frameScale={i === 1 ? 3 : 2.7}
                            />

                            {crowns[i] && (
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl">
                                    👑
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{p.full_name}</p>
                            <p className={`text-xs ${s.label}`}>{s.medal} #{positions[i]}</p>
                            <p className={`text-sm font-bold ${cfg.color}`}>{p.tier} {p.division}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
{/* <RankAvatar tier={p.tier} name={p.full_name} size={iconSizes[i]} /> */ }
function RankList({ data }: { data: any[] }) {
    return (
        <div className="card !p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {data.map((p) => {
                    const pos = Number(p.rank_position);
                    const isTop3 = pos <= 3;
                    const s = TOP3_STYLES[pos - 1];
                    const winRate = p.win_rate ? Number(p.win_rate).toFixed(1) : '0.0';

                    return (
                        <div
                            key={p.id}
                            className={`flex items-center gap-3 px-4 py-4 ${isTop3 ? s?.bg : 'hover:bg-gray-50'}`}
                            style={{ minHeight: 64 }}
                        >
                            <PositionBadge pos={pos} />

                            <RankPodiumAvatarList
                                tier={p.tier}
                                avatar={p.avatar_url}
                                name={p.full_name}
                                size={48}
                                frameScale={3.2}
                                listMode
                            />

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">{p.full_name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <TierBadge tier={p.tier} division={p.division} points={p.points} />
                                </div>
                            </div>

                            {/* Right: RankIcon + W/L */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-right space-y-0.5">
                                    <p className="text-xs text-gray-400">
                                        <span className="text-green-600 font-medium">{p.wins}W</span>
                                        <span className="mx-0.5">/</span>
                                        <span className="text-red-400 font-medium">{p.losses}L</span>
                                        <span className="ml-1">· {winRate}%</span>
                                    </p>
                                </div>
                                <RankIcon tier={p.tier} size={56} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
}

export default function RankingsPage() {
    const [tab, setTab] = useState<Tab>('winrate');
    const [winRateData, setWinRateData] = useState<any[]>([]);
    const [rankData, setRankData] = useState<any[]>([]);
    const [loadingWR, setLoadingWR] = useState(true);
    const [loadingRank, setLoadingRank] = useState(true);

    const fetchWinRate = async () => {
        setLoadingWR(true);
        try { const { data } = await rankingsApi.winRate(); setWinRateData(data ?? []); }
        finally { setLoadingWR(false); }
    };

    const fetchRank = async () => {
        setLoadingRank(true);
        try { const { data } = await rankingsApi.rankLeaderboard(); setRankData(data ?? []); }
        finally { setLoadingRank(false); }
    };

    useEffect(() => { fetchWinRate(); fetchRank(); }, []);

    const handleRefresh = () => tab === 'winrate' ? fetchWinRate() : fetchRank();
    const loading = tab === 'winrate' ? loadingWR : loadingRank;
    const top3WR = winRateData.slice(0, 3);
    const top3Rank = rankData.slice(0, 3);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {tab === 'winrate'
                            ? <><TrendingUp className="w-6 h-6 text-green-500" /> Bảng xếp hạng</>
                            : <><Trophy className="w-6 h-6 text-blue-500" /> Bảng xếp hạng</>
                        }
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {tab === 'winrate'
                            ? 'Tính theo % thắng set giao hữu được duyệt trong tháng'
                            : 'Tính theo điểm LP tích lũy — thắng/thua net set × 5 điểm'
                        }
                    </p>
                </div>
                <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border border-gray-200 rounded-xl bg-gray-50 p-1 gap-1">
                <button
                    onClick={() => setTab('winrate')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'winrate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <TrendingUp className="w-4 h-4" /> Win Rate tháng
                </button>
                <button
                    onClick={() => setTab('rank')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === 'rank' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Trophy className="w-4 h-4" /> Rank LP 💎
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(8)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}
                </div>
            ) : tab === 'winrate' ? (
                winRateData.length === 0 ? (
                    <div className="card py-16 text-center text-gray-400">
                        <Swords className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>Chưa có dữ liệu win rate tháng này</p>
                    </div>
                ) : (
                    <>
                        {top3WR.length >= 1 && <WinRatePodium top3={top3WR} />}
                        <WinRateList data={winRateData} />
                    </>
                )
            ) : (
                rankData.length === 0 ? (
                    <div className="card py-16 text-center text-gray-400">
                        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>Chưa có dữ liệu rank</p>
                    </div>
                ) : (
                    <>
                        {top3Rank.length >= 1 && <RankPodium top3={top3Rank} />}
                        {rankData.length > 3 && <RankList data={rankData.slice(3)} />}
                    </>
                )
            )}
        </div>
    );
}