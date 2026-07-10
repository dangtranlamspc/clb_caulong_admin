import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { activitiesAdminApi } from "../../api";

const ALL_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"];

export default function ShirtOrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "Đặt áo nhóm",
    emoji: "👕",
    deadline: "",
    status: "open",
    price_per_shirt: "",
    available_sizes: ["S", "M", "L", "XL", "XXL"] as string[],
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
          emoji: data.emoji ?? "👕",
          deadline: data.deadline ? data.deadline.slice(0, 16) : "",
          status: data.status,
          description: data.description ?? "",
          price_per_shirt: String(data.detail?.price_per_shirt ?? ""),
          available_sizes: data.detail?.available_sizes ?? [
            "S",
            "M",
            "L",
            "XL",
            "XXL",
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSize = (size: string) => {
    setForm((f) => ({
      ...f,
      available_sizes: f.available_sizes.includes(size)
        ? f.available_sizes.filter((s) => s !== size)
        : [...f.available_sizes, size],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề");
    if (!form.deadline) return toast.error("Vui lòng chọn deadline");
    if (form.available_sizes.length === 0)
      return toast.error("Chọn ít nhất 1 size");

    setSaving(true);
    try {
      const payload = {
        type: "shirt_order",
        title: form.title,
        emoji: form.emoji,
        deadline: form.deadline,
        status: form.status,
        description: form.description || undefined,
        detail: {
          price_per_shirt: Number(form.price_per_shirt) || 0,
          available_sizes: form.available_sizes,
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
      <h1 className="text-xl font-bold text-gray-900">👕 Đặt áo nhóm</h1>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề
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
            Deadline đăng ký
          </label>
          <input
            type="datetime-local"
            className="input-field"
            value={form.deadline}
            onChange={(e) =>
              setForm((f) => ({ ...f, deadline: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá / áo (đ)
          </label>
          <input
            type="number"
            className="input-field"
            value={form.price_per_shirt}
            onChange={(e) =>
              setForm((f) => ({ ...f, price_per_shirt: e.target.value }))
            }
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Size cho phép chọn
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                form.available_sizes.includes(size)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả (tuỳ chọn)
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
          <option value="open">Đang nhận đăng ký</option>
          <option value="closed">Đã đóng</option>
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
