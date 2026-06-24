import { getTierConfig } from "../pages/rankings/rankConfig";

interface RankIconProps {
    tier: string;
    size?: number;
    className?: string;
}

interface RankAvatarProps {
    tier: string;
    name: string;
    size?: number;
    frameScale?: number;
    className?: string;
}

export function RankIcon({ tier, size = 48 }: RankIconProps) {
    const cfg = getTierConfig(tier);
    return <img src={cfg.img_old} width={size} height={size} style={{ objectFit: 'contain' }} />;
}

export function RankAvatar({ tier, name, size = 48, frameScale = 1.7 }: RankAvatarProps) {
    const cfg = getTierConfig(tier);
    const frameSize = Math.round(size * frameScale);
    return (
        <div style={{ position: 'relative', width: frameSize, height: frameSize, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="rounded-full bg-gray-100 flex items-center justify-center font-medium"
                style={{ width: size, height: size, fontSize: size * 0.4, zIndex: 1 }}>
                {name?.[0]?.toUpperCase()}
            </div>
            <img src={cfg.frame} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, pointerEvents: 'none' }} />
        </div>
    );
}