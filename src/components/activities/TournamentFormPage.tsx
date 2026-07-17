import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { activitiesAdminApi } from "../../api";

// ============================================================
// Types khớp với schema mới: tournaments.team_size / max_teams / composition
// (Xem migration + activities.dto.ts + activities.service.ts)
// ============================================================

type Role = "nam" | "nu";
type Level = "A" | "B+" | "B" | "C";

interface CompositionSlot {
  role: Role;
  level: Level | null;
  label: string;
}

interface TournamentFormState {
  title: string;
  emoji: string;
  event_date: string;
  deadline: string;
  status: string;
  location: string;
  description: string;
  cover_image_url: string;
  team_size: 4 | 6;
  max_teams: string;
  entry_fee_per_person: string;
  composition: CompositionSlot[];
}

// Các lựa chọn "ô" trong thành phần đội — 1 dropdown chọn luôn cả role + level,
// khớp với cách hiển thị trong ảnh thiết kế (mỗi ô là 1 icon + 1 dropdown).
const SLOT_OPTIONS: CompositionSlot[] = [
  { role: "nam", level: "A", label: "Nam A" },
  { role: "nam", level: "B+", label: "Nam B+" },
  { role: "nam", level: "B", label: "Nam B" },
  { role: "nam", level: "C", label: "Nam C" },
  { role: "nu", level: null, label: "Nữ" },
];

const slotOptionKey = (role: Role, level: Level | null) =>
  `${role}_${level ?? "x"}`;

const DEFAULT_SLOT: CompositionSlot = { role: "nu", level: null, label: "Nữ" };

/** Đổi số người/đội (4 <-> 6): giữ nguyên các ô đã chọn, cắt/thêm ô cho khớp độ dài */
function resizeComposition(
  current: CompositionSlot[],
  size: number,
): CompositionSlot[] {
  if (current.length === size) return current;
  if (current.length > size) return current.slice(0, size);
  return [
    ...current,
    ...Array.from({ length: size - current.length }, () => ({
      ...DEFAULT_SLOT,
    })),
  ];
}

function defaultComposition(size: 4 | 6): CompositionSlot[] {
  const base: CompositionSlot[] = [
    { role: "nam", level: "A", label: "Nam A" },
    { role: "nam", level: "B+", label: "Nam B+" },
    { role: "nam", level: "B", label: "Nam B" },
    { role: "nu", level: null, label: "Nữ" },
  ];
  if (size === 4) return base;
  return [
    ...base,
    { role: "nam", level: "C", label: "Nam C" },
    { role: "nu", level: null, label: "Nữ" },
  ];
}

const TABS = [
  { key: "info", label: "Thông tin giải đấu" },
  { key: "rules", label: "Nội dung điều lệ" },
  { key: "prizes", label: "Giải thưởng" },
  { key: "fees", label: "Lệ phí" },
  { key: "theme", label: "Giao diện" },
  { key: "preview", label: "Xem trước" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_OPTIONS = [
  { value: "draft", label: "Nháp" },
  { value: "open", label: "Mở đăng ký" },
  { value: "closed", label: "Đã đóng đăng ký" },
  { value: "ongoing", label: "Đang diễn ra" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã huỷ" },
];

const initialForm: TournamentFormState = {
  title: "",
  emoji: "🏆",
  event_date: "",
  deadline: "",
  status: "draft",
  location: "",
  description: "",
  cover_image_url: "",
  team_size: 4,
  max_teams: "",
  entry_fee_per_person: "",
  composition: defaultComposition(4),
};

export default function TournamentFormPage({
  activityId,
  onSaved,
  onClose,
}: {
  activityId?: string;
  onSaved?: () => void;
  onClose?: () => void;
} = {}) {
  const params = useParams();
  const navigate = useNavigate();
  const id = activityId ?? params.id;

  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [form, setForm] = useState<TournamentFormState>(initialForm);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    activitiesAdminApi
      .get(id)
      .then(({ data }) => {
        const detail = data.detail ?? {};
        const teamSize: 4 | 6 = detail.team_size === 6 ? 6 : 4;
        const composition: CompositionSlot[] =
          Array.isArray(detail.composition) && detail.composition.length
            ? detail.composition.map((c: any) => ({
                role: c.role,
                level: c.role === "nu" ? null : c.level,
                label: c.label ?? (c.role === "nu" ? "Nữ" : `Nam ${c.level}`),
              }))
            : defaultComposition(teamSize);

        setForm({
          title: data.title ?? "",
          emoji: data.emoji ?? "🏆",
          event_date: data.event_date ? data.event_date.slice(0, 16) : "",
          deadline: data.deadline ? data.deadline.slice(0, 16) : "",
          status: data.status ?? "draft",
          location: data.location ?? "",
          description: data.description ?? "",
          cover_image_url: data.cover_image_url ?? "",
          team_size: teamSize,
          max_teams: detail.max_teams != null ? String(detail.max_teams) : "",
          entry_fee_per_person:
            detail.entry_fee_per_person != null
              ? String(detail.entry_fee_per_person)
              : "",
          composition: resizeComposition(composition, teamSize),
        });
      })
      .catch(() => toast.error("Không tải được dữ liệu giải đấu"))
      .finally(() => setLoading(false));
  }, [id]);

  const remainingDescChars = 160 - form.description.length;

  const handleTeamSizeChange = (size: 4 | 6) => {
    setForm((f) => ({
      ...f,
      team_size: size,
      composition: resizeComposition(f.composition, size),
    }));
  };

  const handleSlotChange = (index: number, key: string) => {
    const option = SLOT_OPTIONS.find(
      (o) => slotOptionKey(o.role, o.level) === key,
    );
    if (!option) return;
    setForm((f) => {
      const next = [...f.composition];
      next[index] = { ...option };
      return { ...f, composition: next };
    });
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Vui lòng nhập tên giải đấu";
    if (!form.event_date) return "Vui lòng chọn thời gian thi đấu";
    if (
      form.deadline &&
      form.event_date &&
      new Date(form.deadline) > new Date(form.event_date)
    ) {
      return "Ngày chốt đăng ký phải trước ngày thi đấu";
    }
    const maxTeamsNum = Number(form.max_teams);
    if (!form.max_teams || !Number.isInteger(maxTeamsNum) || maxTeamsNum < 1) {
      return "Số lượng đội tham gia không hợp lệ";
    }
    if (form.composition.length !== form.team_size) {
      return "Thành phần mỗi đội chưa khớp với số người/đội";
    }
    for (const slot of form.composition) {
      if (slot.role === "nam" && !slot.level) {
        return "Vui lòng chọn trình độ cho từng ô Nam trong thành phần đội";
      }
    }
    return null;
  };

  const handleSubmit = async (statusOverride?: string) => {
    const error = validate();
    if (error) return toast.error(error);

    setSaving(true);
    try {
      const payload = {
        type: "tournament",
        title: form.title,
        emoji: form.emoji,
        event_date: form.event_date,
        deadline: form.deadline || undefined,
        status: statusOverride ?? form.status,
        location: form.location || undefined,
        description: form.description || undefined,
        cover_image_url: form.cover_image_url || undefined,
        detail: {
          team_size: form.team_size,
          max_teams: Number(form.max_teams),
          composition: form.composition.map(({ role, level, label }) => ({
            role,
            level: role === "nu" ? null : level,
            label,
          })),
          entry_fee_per_person: form.entry_fee_per_person
            ? Number(form.entry_fee_per_person)
            : 0,
        },
      };
      if (id) await activitiesAdminApi.update(id, payload);
      else await activitiesAdminApi.create(payload);

      toast.success("Đã lưu giải đấu");
      if (onSaved) onSaved();
      else navigate("/activities");
    } catch {
      // lỗi đã được toast bởi interceptor trong api.ts
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else navigate("/activities");
  };

  if (loading)
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-gray-400">
        Đang tải...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Quay lại"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {id ? "Chỉnh sửa giải đấu" : "Tạo giải đấu"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            disabled={saving}
            onClick={() => handleSubmit("draft")}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Lưu nháp
          </button>
          <button
            disabled={saving}
            onClick={() => handleSubmit("open")}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Xuất bản"}
          </button>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== "info" ? (
        <ComingSoonTab label={TABS.find((t) => t.key === activeTab)!.label} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== Cột chính (2/3) ===== */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard icon="📅" title="THỜI GIAN – ĐỊA ĐIỂM">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Thời gian" required>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={form.event_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, event_date: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Địa điểm">
                  <input
                    className="input-field"
                    placeholder="Sân cầu lông..."
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard icon="👥" title="HÌNH THỨC VÀ ĐỐI TƯỢNG THAM GIA">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <Field label="Hình thức thi đấu" required>
                  <select className="input-field" value="doi_bong" disabled>
                    <option value="doi_bong">Đồng đội</option>
                  </select>
                </Field>
                <Field label="Số lượng đội tham gia" required>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      className="input-field"
                      placeholder="VD: 7"
                      value={form.max_teams}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, max_teams: e.target.value }))
                      }
                    />
                    <span className="text-sm text-gray-500 shrink-0">đội</span>
                  </div>
                </Field>
              </div>

              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Thành phần mỗi đội <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  {[4, 6].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleTeamSizeChange(size as 4 | 6)}
                      className={`px-3 py-1.5 font-medium ${
                        form.team_size === size
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {size} người
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.composition.map((slot, i) => (
                  <CompositionSlotCard
                    key={i}
                    slot={slot}
                    onChange={(key) => handleSlotChange(i, key)}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Mỗi ô là 1 vị trí trong đội. Hệ thống dùng thành phần này để
                kiểm tra slot còn trống khi thành viên đăng ký, và để bốc thăm
                chia đội.
              </p>
            </SectionCard>

            <SectionCard icon="💰" title="LỆ PHÍ">
              <Field label="Lệ phí / người">
                <input
                  type="number"
                  min={0}
                  className="input-field"
                  placeholder="0"
                  value={form.entry_fee_per_person}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      entry_fee_per_person: e.target.value,
                    }))
                  }
                />
              </Field>
              <p className="text-xs text-gray-400 mt-1.5">
                Áp dụng cho từng người đăng ký cá nhân (không nhân theo cặp).
              </p>
            </SectionCard>

            <SectionCard icon="📝" title="MÔ TẢ / THỂ LỆ">
              <Field label="Mô tả / thể lệ">
                <textarea
                  className="input-field"
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Field>
            </SectionCard>
          </div>

          {/* ===== Cột phụ (1/3) ===== */}
          <div className="space-y-6">
            <SectionCard title="Thông tin chung" plain>
              <Field label="Tên giải đấu" required>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </Field>
              <Field label="Emoji">
                <input
                  className="input-field"
                  value={form.emoji}
                  maxLength={4}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emoji: e.target.value }))
                  }
                />
              </Field>
              <Field label="Ảnh bìa (URL)">
                <input
                  className="input-field"
                  placeholder="https://..."
                  value={form.cover_image_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cover_image_url: e.target.value }))
                  }
                />
                {form.cover_image_url && (
                  <img
                    src={form.cover_image_url}
                    alt="Ảnh bìa"
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </Field>
            </SectionCard>

            <SectionCard title="Cài đặt hiển thị" plain>
              <Field label="Trạng thái">
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ngày chốt danh sách đăng ký">
                <input
                  type="datetime-local"
                  className="input-field"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deadline: e.target.value }))
                  }
                />
                <p className="text-xs text-gray-400 mt-1.5 leading-snug">
                  Sau thời điểm này hệ thống có thể tự đóng đăng ký.
                </p>
              </Field>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SectionCard({
  icon,
  title,
  children,
  plain,
}: {
  icon?: string;
  title: string;
  children: React.ReactNode;
  plain?: boolean;
}) {
  return (
    <div
      className={
        plain
          ? "bg-white rounded-xl border border-gray-200 p-5"
          : "bg-white rounded-xl border border-gray-200 p-5"
      }
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 tracking-wide">
        {icon && <span>{icon}</span>}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function CompositionSlotCard({
  slot,
  onChange,
}: {
  slot: CompositionSlot;
  onChange: (key: string) => void;
}) {
  const isNu = slot.role === "nu";
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          isNu ? "bg-pink-100" : "bg-blue-100"
        }`}
      >
        {isNu ? "👩" : "🧑"}
      </div>
      <select
        className="input-field text-sm text-center"
        value={slotOptionKey(slot.role, slot.level)}
        onChange={(e) => onChange(e.target.value)}
      >
        {SLOT_OPTIONS.map((o) => (
          <option
            key={slotOptionKey(o.role, o.level)}
            value={slotOptionKey(o.role, o.level)}
          >
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
      <p className="text-sm">
        Tab <span className="font-medium text-gray-500">"{label}"</span> chưa có
        dữ liệu tương ứng ở backend (chưa có cột/field lưu trữ), nên chưa hiển
        thị nội dung ở đây để tránh mất dữ liệu khi lưu.
      </p>
    </div>
  );
}
