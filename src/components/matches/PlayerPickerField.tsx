import { useEffect, useState } from "react";
import { usersApi } from "../../api";
import { Search } from "lucide-react";

export function PlayerPickerField({ label, value, onSelect, exclude }: {
    label: string;
    value: any;
    onSelect: (m: any) => void;
    exclude: string[];
}) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (value || search.trim().length < 2) { setResults([]); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await usersApi.searchMembers(search.trim());
                setResults((data ?? []).filter((m: any) => !exclude.includes(m.id)));
            } finally { setSearching(false); }
        }, 350);
        return () => clearTimeout(t);
    }, [search, value, exclude]);

    if (value) {
        return (
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                        {value.full_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900 flex-1 truncate">{value.full_name}</span>
                    <button onClick={() => onSelect(null)} className="text-xs text-blue-600 font-medium">Đổi</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-8 text-sm"
                    placeholder="Tìm tên hoặc SĐT..."
                />
            </div>
            {search.trim().length >= 2 && (
                <div className="mt-1 max-h-40 overflow-y-auto border border-gray-100 rounded-xl">
                    {searching ? (
                        <p className="text-xs text-gray-400 text-center py-3">Đang tìm...</p>
                    ) : results.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">Không tìm thấy</p>
                    ) : (
                        results.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => { onSelect(m); setSearch(''); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                            >
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                                    {m.full_name?.[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                                    <p className="text-xs text-gray-400">{m.phone}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}