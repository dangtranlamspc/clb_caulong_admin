import { useState } from "react";

export function UserAvatar({
    avatarUrl,
    fullName,
    size = 36,
}: {
    avatarUrl?: string | null;
    fullName?: string;
    size?: number;
}) {
    const [error, setError] = useState(false);

    const showImage = avatarUrl && !error;

    return (
        <div
            className="rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0"
            style={{ width: size, height: size }}
        >
            {showImage ? (
                <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            ) : (
                <span className="text-blue-700 text-sm font-semibold">
                    {fullName?.[0]?.toUpperCase() ?? '?'}
                </span>
            )}
        </div>
    );
}