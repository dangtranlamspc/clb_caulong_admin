import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { activitiesAdminApi } from "../../api";

export default function OfflineEventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    emoji: "🔥",
    location: "",
    event_date: "",
    status: "ongoing",
    max_participants: "",
    fee_per_person: "0",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        type: "offline_event",
        title: form.title,
        emoji: form.emoji,
        location: form.location,
        event_date: form.event_date,
        status: form.status,
        detail: {
          max_participants: form.max_participants
            ? Number(form.max_participants)
            : null,
          fee_per_person: Number(form.fee_per_person),
        },
      };
      if (id) await activitiesAdminApi.update(id, payload);
      else await activitiesAdminApi.create(payload);
      toast.success("Đã lưu hoạt động");
      navigate("/activities");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Offline / BBQ & Giao lưu</h1>
      <input
        className="input-field"
        placeholder="Tiêu đề"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <input
        className="input-field"
        placeholder="Địa điểm"
        value={form.location}
        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
      />
      <input
        type="datetime-local"
        className="input-field"
        value={form.event_date}
        onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
      />
      <input
        type="number"
        className="input-field"
        placeholder="Số người tối đa (để trống nếu không giới hạn)"
        value={form.max_participants}
        onChange={(e) =>
          setForm((f) => ({ ...f, max_participants: e.target.value }))
        }
      />
      <input
        type="number"
        className="input-field"
        placeholder="Phí/người"
        value={form.fee_per_person}
        onChange={(e) =>
          setForm((f) => ({ ...f, fee_per_person: e.target.value }))
        }
      />
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="btn-primary w-full"
      >
        Lưu
      </button>
    </div>
  );
}
