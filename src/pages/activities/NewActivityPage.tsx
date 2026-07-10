import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

const TYPES = [
  {
    type: "shirt_order",
    emoji: "👕",
    label: "Đặt áo nhóm",
    desc: "Mở đăng ký chọn size, đặt áo đồng phục cho thành viên",
    path: "/activities/new/shirt-order",
    cls: "bg-blue-50 group-hover:bg-blue-100",
  },
  {
    type: "tournament",
    emoji: "🏆",
    label: "Giải nội bộ",
    desc: "Tạo giải đấu, mở đăng ký đội/đôi tham gia",
    path: "/activities/new/tournament",
    cls: "bg-amber-50 group-hover:bg-amber-100",
  },
  {
    type: "birthday",
    emoji: "🎂",
    label: "Sinh nhật thành viên",
    desc: "Hiển thị danh sách thành viên sinh nhật trong tháng",
    path: "/activities/new/birthday",
    cls: "bg-pink-50 group-hover:bg-pink-100",
  },
  {
    type: "offline_event",
    emoji: "🔥",
    label: "Offline / BBQ",
    desc: "Tổ chức giao lưu, mở đăng ký tham gia sự kiện",
    path: "/activities/new/offline-event",
    cls: "bg-orange-50 group-hover:bg-orange-100",
  },
  {
    type: "poll",
    emoji: "📊",
    label: "Bình chọn",
    desc: "Tạo khảo sát, thu thập ý kiến thành viên",
    path: "/activities/new/poll",
    cls: "bg-purple-50 group-hover:bg-purple-100",
  },
];

export default function NewActivityPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/activities")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Chọn loại hoạt động
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Mỗi loại có cách đăng ký và quản lý khác nhau
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => navigate(t.path)}
            className="group card flex items-center gap-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors ${t.cls}`}
            >
              {t.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                {t.desc}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
