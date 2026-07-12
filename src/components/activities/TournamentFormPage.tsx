import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { activitiesAdminApi } from "../../api";

export default function TournamentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    emoji: "🏆",
    event_date: "",
    deadline: "",
    status: "open",
    format: "doi",
    max_teams: "",
    location: "",
    description: "",
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    activitiesAdminApi
      .get(id)
      .then(({ data }) => {
        setForm({
          title: data.title,
          emoji: data.emoji ?? "🏆",
          event_date: data.event_date ? data.event_date.slice(0, 16) : "",
          deadline: data.deadline ? data.deadline.slice(0, 16) : "",
          status: data.status,
          location: data.location ?? "",
          description: data.description ?? "",
          format: data.detail?.format ?? "doi",
          max_teams:
            data.detail?.max_teams != null ? String(data.detail.max_teams) : "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề");
    if (!form.event_date) return toast.error("Vui lòng chọn ngày thi đấu");
    if (
      form.deadline &&
      form.event_date &&
      new Date(form.deadline) > new Date(form.event_date)
    ) {
      return toast.error("Ngày chốt đăng ký phải trước ngày thi đấu");
    }

    setSaving(true);
    try {
      const payload = {
        type: "tournament",
        title: form.title,
        emoji: form.emoji,
        event_date: form.event_date,
        deadline: form.deadline || undefined,
        status: form.status,
        location: form.location || undefined,
        description: form.description || undefined,
        detail: {
          format: form.format,
          max_teams: form.max_teams ? Number(form.max_teams) : null,
        },
      };
      if (id) await activitiesAdminApi.update(id, payload);
      else await activitiesAdminApi.create(payload);
      toast.success("Đã lưu hoạt động");
      navigate("/activities");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-lg mx-auto p-8 text-center text-gray-400">
        Đang tải...
      </div>
    );

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">🏆 Giải nội bộ</h1>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên giải
        </label>
        <input
          className="input-field"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày thi đấu
          </label>
          <input
            type="datetime-local"
            className="input-field"
            value={form.event_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, event_date: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số đội tối đa
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Không giới hạn"
            value={form.max_teams}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_teams: e.target.value }))
            }
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày chốt danh sách đăng ký
          <span className="text-gray-400 font-normal"> (tuỳ chọn)</span>
        </label>
        <input
          type="datetime-local"
          className="input-field"
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
        />
        <p className="text-xs text-gray-400 mt-1">
          Sau thời điểm này, hệ thống có thể tự động đóng đăng ký (nếu bạn cấu
          hình job tự động), hoặc dùng làm mốc hiển thị "Deadline" cho thành
          viên.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Thể thức
        </label>
        <select
          className="input-field"
          value={form.format}
          onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
        >
          <option value="don">Đơn</option>
          <option value="doi">Đôi</option>
          <option value="doi_nam_nu">Đôi nam nữ</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa điểm
        </label>
        <input
          className="input-field"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả / thể lệ (tuỳ chọn)
        </label>
        <textarea
          className="input-field"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trạng thái
        </label>
        <select
          className="input-field"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">Nháp</option>
          <option value="open">Mở đăng ký</option>
          <option value="closed">Đã đóng đăng ký</option>
          <option value="ongoing">Đang diễn ra</option>
          <option value="completed">Đã kết thúc</option>
          <option value="cancelled">Đã huỷ</option>
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="btn-primary w-full disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu hoạt động"}
      </button>
    </div>
  );
}
