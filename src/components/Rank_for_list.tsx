import { getTierConfig } from "../pages/rankings/rankConfig";

interface RankPodiumAvatarListProps {
    tier: string;
    avatar?: string;
    name: string;
    size?: number;
    frameScale?: number;
    avatarTop?: string;
}

export function RankPodiumAvatarList({
    tier, avatar, name, size = 80, frameScale = 2.2, listMode = false,
}: RankPodiumAvatarListProps & { frameTop?: string; listMode?: boolean }) {
    const cfg = getTierConfig(tier);

    return (
        <div
            className="relative flex items-center justify-center"
            style={{
                width: size,
                height: size,
                overflow: listMode ? 'visible' : 'visible',
                flexShrink: 0,
            }}
        >
            {/* Avatar */}
            <div
                className="absolute overflow-hidden rounded-full"
                style={{
                    width: size,
                    height: size,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                }}
            >
                {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold">
                        {name?.[0]?.toUpperCase()}
                    </div>
                )}
            </div>

            <div style={{
                position: 'absolute',
                width: size * frameScale,
                height: size * frameScale,
                left: '50%',
                top: '18%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                pointerEvents: 'none',
            }}>
                <img
                    src={cfg.frame}
                    alt={tier}
                    style={{
                        display: 'block',
                        maxWidth: 'none',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            </div>
        </div>
    );
}