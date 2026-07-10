import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Loader2, Users, Trash2, Pencil, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { activitiesAdminApi } from "../../api";

const TYPE_LABEL: Record<string, string> = {
  shirt_order: "👕 Đặt áo",
  tournament: "🏆 Giải đấu",
  birthday: "🎂 Sinh nhật",
  offline_event: "🔥 Offline",
  poll: "📊 Bình chọn",
};

const STATUS_CFG: Record<string, string> = {
  draft: "bg-gray-50 text-gray-500",
  open: "bg-orange-50 text-orange-600",
  upcoming: "bg-purple-50 text-purple-600",
  ongoing: "bg-blue-50 text-blue-600",
  closed: "bg-green-50 text-green-700",
  completed: "bg-slate-50 text-slate-500",
  cancelled: "bg-red-50 text-red-500",
};

export default function ActivitiesListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await activitiesAdminApi.list({
        type: typeFilter || undefined,
        limit: 50,
      });
      setItems(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [typeFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Xoá hoạt động "${title}"? Toàn bộ đăng ký liên quan cũng sẽ bị xoá.`,
      )
    )
      return;
    try {
      await activitiesAdminApi.delete(id);
      toast.success("Đã xoá");
      fetchList();
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoạt động</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {items.length} hoạt động
          </p>
        </div>
        <div className="flex-1" />
        <Link
          to="/activities/new"
          className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Tạo hoạt động</span>
        </Link>
      </div>

      {/* Type filter - đồng bộ style pill giống SessionsPage */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        <button
          onClick={() => setTypeFilter("")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !typeFilter
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Tất cả
        </button>
        {Object.entries(TYPE_LABEL).map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              typeFilter === val
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có hoạt động nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Hoạt động</th>
                <th className="text-left px-4 py-3">Loại</th>
                <th className="text-left px-4 py-3">Ngày</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3">Đăng ký</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {a.emoji} {a.title}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {TYPE_LABEL[a.type]}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.deadline || a.event_date
                      ? format(
                          new Date(a.deadline ?? a.event_date),
                          "dd/MM/yyyy",
                          { locale: vi },
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CFG[a.status] ?? "bg-gray-50 text-gray-500"}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/activities/${a.id}/registrations`}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Users className="w-3.5 h-3.5" /> Xem
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/activities/${a.id}/edit`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.title)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
