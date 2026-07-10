import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { activitiesAdminApi } from "../../api";

const EDIT_PATH: Record<string, string> = {
  shirt_order: "shirt-order",
  tournament: "tournament",
  birthday: "birthday",
  offline_event: "offline-event",
  poll: "poll",
};

export default function EditActivityRedirect() {
  const { id } = useParams();
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    activitiesAdminApi.get(id!).then(({ data }) => setType(data.type));
  }, [id]);

  if (!type)
    return <div className="p-8 text-center text-gray-400">Đang tải...</div>;
  return <Navigate to={`/activities/${id}/edit/${EDIT_PATH[type]}`} replace />;
}
