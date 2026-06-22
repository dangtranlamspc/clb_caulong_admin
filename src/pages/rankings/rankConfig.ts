import satImg from '../../assets/ranks/sat.webp';
import dongImg from '../../assets/ranks/dong.webp';
import bacImg from '../../assets/ranks/bac.webp';
import vangImg from '../../assets/ranks/vang.webp';
import bachKimImg from '../../assets/ranks/bach_kim.webp';
import lucBaoImg from '../../assets/ranks/lucbao.webp';
import kimCuongImg from '../../assets/ranks/kimcuong.webp';
import caoThuImg from '../../assets/ranks/caothu.webp';

import satFrame from '../../assets/frame_ranks/sat.webp';
import dongFrame from '../../assets/frame_ranks/dong.webp';
import bacFrame from '../../assets/frame_ranks/bac.webp';
import vangFrame from '../../assets/frame_ranks/vang.webp';
import bachkimFrame from '../../assets/frame_ranks/bachkim.webp';
import lucbaoFrame from '../../assets/frame_ranks/lucbao.webp';
import kimcuongFrame from '../../assets/frame_ranks/kimcuong.webp';
import caothuFrame from '../../assets/frame_ranks/caothu.webp';


import satoldImg from '../../assets/ranks_old/sat_old.png';
import dongoldImg from '../../assets/ranks_old/dong_old.png';
import bacoldImg from '../../assets/ranks_old/bac_old.png';
import vangoldImg from '../../assets/ranks_old/vang_old.png';
import bachKimoldImg from '../../assets/ranks_old/bk_old.png';
import lucBaooldImg from '../../assets/ranks_old/lucbao_old.png';
import kimCuongoldImg from '../../assets/ranks_old/kimcuong_old.png';
import caoThuoldImg from '../../assets/ranks_old/caothu_old.png';


export const TIERS = ['Sắt', 'Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Lục Bảo', 'Kim Cương', 'Cao Thủ'] as const;
export const DIVISIONS = ['V', 'IV', 'III', 'II', 'I'] as const;
export type Tier = typeof TIERS[number];
export type Division = typeof DIVISIONS[number];

export interface TierConfig {
    label: string;
    color: string;
    bg: string;
    border: string;
    gradient: string;
    icon: string;
    img: string;
    img_old: string;
    frame: string;
}

export const TIER_CONFIG: Record<string, TierConfig> = {
    'Sắt': {
        label: 'Sắt', color: 'text-zinc-500', bg: 'bg-zinc-100',
        border: 'border-zinc-300', gradient: 'from-zinc-300 to-zinc-500',
        icon: '⚙️', img: satImg, frame: satFrame, img_old: satoldImg
    },
    'Đồng': {
        label: 'Đồng', color: 'text-orange-700', bg: 'bg-orange-50',
        border: 'border-orange-300', gradient: 'from-orange-300 to-orange-600',
        icon: '🥉', img: dongImg, frame: dongFrame, img_old: dongoldImg
    },
    'Bạc': {
        label: 'Bạc', color: 'text-slate-500', bg: 'bg-slate-100',
        border: 'border-slate-300', gradient: 'from-slate-300 to-slate-500',
        icon: '🥈', img: bacImg, frame: bacFrame, img_old: bacoldImg
    },
    'Vàng': {
        label: 'Vàng', color: 'text-yellow-600', bg: 'bg-yellow-50',
        border: 'border-yellow-400', gradient: 'from-yellow-300 to-yellow-500',
        icon: '🥇', img: vangImg, frame: vangFrame, img_old: vangoldImg
    },
    'Bạch Kim': {
        label: 'Bạch Kim', color: 'text-sky-600', bg: 'bg-sky-50',
        border: 'border-sky-400', gradient: 'from-sky-200 to-sky-500',
        icon: '💠', img: bachKimImg, frame: bachkimFrame, img_old: bachKimoldImg
    },
    'Lục Bảo': {
        label: 'Lục Bảo', color: 'text-emerald-600', bg: 'bg-emerald-50',
        border: 'border-emerald-400', gradient: 'from-emerald-300 to-emerald-600',
        icon: '💚', img: lucBaoImg, frame: lucbaoFrame, img_old: lucBaooldImg
    },
    'Kim Cương': {
        label: 'Kim Cương', color: 'text-blue-600', bg: 'bg-blue-50',
        border: 'border-blue-400', gradient: 'from-blue-300 to-purple-500',
        icon: '💎', img: kimCuongImg, frame: kimcuongFrame, img_old: kimCuongoldImg
    },
    'Cao Thủ': {
        label: 'Cao Thủ', color: 'text-purple-700', bg: 'bg-purple-50',
        border: 'border-purple-500', gradient: 'from-purple-400 to-pink-500',
        icon: '👑', img: caoThuImg, frame: caothuFrame, img_old: caoThuoldImg
    },
};

export function getTierConfig(tier: string): TierConfig {
    return TIER_CONFIG[tier] ?? TIER_CONFIG['Sắt'];
}

export function lpProgress(lp: number): number {
    return Math.min(Math.max(lp, 0), 99);
}

export function rankLabel(tier: string, division: string, lp: number): string {
    return `${tier} ${division} • ${lp} LP`;
}