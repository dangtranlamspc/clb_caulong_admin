import satImg from "../../assets/ranks/sat.webp";
import dongImg from "../../assets/ranks/dong.webp";
import bacImg from "../../assets/ranks/bac.webp";
import vangImg from "../../assets/ranks/vang.webp";
import bachKimImg from "../../assets/ranks/bach_kim.webp";
import lucBaoImg from "../../assets/ranks/lucbao.webp";
import kimCuongImg from "../../assets/ranks/kimcuong.webp";
import caoThuImg from "../../assets/ranks/caothu.webp";

import satFrame from "../../assets/frame_ranks/sat.webp";
import dongFrame from "../../assets/frame_ranks/dong.webp";
import bacFrame from "../../assets/frame_ranks/bac.webp";
import vangFrame from "../../assets/frame_ranks/vang.webp";
import bachkimFrame from "../../assets/frame_ranks/bachkim.webp";
import lucbaoFrame from "../../assets/frame_ranks/lucbao.webp";
import kimcuongFrame from "../../assets/frame_ranks/kimcuong.webp";
import caothuFrame from "../../assets/frame_ranks/caothu.webp";

import satoldImg from "../../assets/ranks_old/sat_old.png";
import dongoldImg from "../../assets/ranks_old/dong_old.png";
import bacoldImg from "../../assets/ranks_old/bac_old.png";
import vangoldImg from "../../assets/ranks_old/vang_old.png";
import bachKimoldImg from "../../assets/ranks_old/bk_old.png";
import lucBaooldImg from "../../assets/ranks_old/lucbao_old.png";
import kimCuongoldImg from "../../assets/ranks_old/kimcuong_old.png";
import caoThuoldImg from "../../assets/ranks_old/caothu_old.png";

export const TIERS = [
    "Sắt",
    "Đồng",
    "Bạc",
    "Vàng",
    "Bạch Kim",
    "Lục Bảo",
    "Kim Cương",
    "Cao Thủ",
] as const;
export const DIVISIONS = ["V", "IV", "III", "II", "I"] as const;
export type Tier = (typeof TIERS)[number];
export type Division = (typeof DIVISIONS)[number];

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
    Sắt: {
        label: "Sắt",
        color: "text-zinc-500",
        bg: "bg-zinc-100",
        border: "border-zinc-300",
        gradient: "from-zinc-300 to-zinc-500",
        icon: "⚙️",
        img: satImg,
        frame:
            "https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203453/sat_frame_sjcdg2.webp",
        img_old:
            "https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782176681/sat_phoi_fn_an1p7q.png",
    },
    Đồng: {
        label: "Đồng",
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-300",
        gradient: "from-orange-300 to-orange-600",
        icon: "🥉",
        img: dongImg,
        frame: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203449/dong_frame_s3nbx6.webp',
        img_old: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782176908/dong_phoi_fn_wxcnpy.png',
    },
    Bạc: {
        label: "Bạc",
        color: "text-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-300",
        gradient: "from-slate-300 to-slate-500",
        icon: "🥈",
        img: bacImg,
        frame: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203449/bac_frame_tvdjpw.webp',
        img_old: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782177164/bac_phoi_fn_t5lepk.png',
    },
    Vàng: {
        label: "Vàng",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-400",
        gradient: "from-yellow-300 to-yellow-500",
        icon: "🥇",
        img: vangImg,
        frame: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203452/vang_frame_t1xqgf.webp',
        img_old: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782176929/vang_phoi_fn_ciifmj.png',
    },
    "Lục Bảo": {
        label: "Lục Bảo",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-400",
        gradient: "from-emerald-300 to-emerald-600",
        icon: "💚",
        img: lucBaoImg,
        frame: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203451/lucbao_frame_skokel.webp',
        img_old: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782176864/lucbao_phoi_fn_lmvmjm.png',
    },
    "Bạch Kim": {
        label: "Bạch Kim",
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-400",
        gradient: "from-sky-200 to-sky-500",
        icon: "💠",
        img: bachKimImg,
        frame: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203448/bachkim_frame_wg452j.webp',
        img_old: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782176791/bk_phoi_fn_ay5z4k.png',
    },
    "Kim Cương": {
        label: "Kim Cương",
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-400",
        gradient: "from-blue-300 to-purple-500",
        icon: "💎",
        img: kimCuongImg,
        frame: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203450/kimcuong_frame_lqps4s.webp',
        img_old: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782176814/kc_phoi_fn_konsmv.png',
    },
    "Cao Thủ": {
        label: "Cao Thủ",
        color: "text-purple-700",
        bg: "bg-purple-50",
        border: "border-purple-500",
        gradient: "from-purple-400 to-pink-500",
        icon: "👑",
        img: caoThuImg,
        frame: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782203454/caothu_frame_mom7dj.webp',
        img_old: 'https://res.cloudinary.com/ds6mtnyyk/image/upload/v1782176623/caothu_phoi_fn_ummqst.png',
    },
};

export function getTierConfig(tier: string): TierConfig {
    return TIER_CONFIG[tier] ?? TIER_CONFIG["Sắt"];
}

export function lpProgress(lp: number): number {
    return Math.min(Math.max(lp, 0), 99);
}

export function rankLabel(tier: string, division: string, lp: number): string {
    return `${tier} ${division} • ${lp} LP`;
}
