import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Empty from "../components/ui/Empty";
import { CardSkeleton } from "../components/ui/Skeleton";

export default function Announcements() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target: "all" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [announcements, inbox] = await Promise.all([
        api.get("/comms/announcements"),
        api.get("/comms/notifications"),
      ]);
      setList(announcements.announcements || []);
      setNotifications(inbox.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      const res = await api.put(`/comms/notifications/${id}/read`);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id ? res.notification : notification
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function create(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/comms/announcements", form);
      setShowForm(false);
      setForm({ title: "", body: "", target: "all" });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Company-wide updates</p>
        </div>
        {(user.role === "Admin" || user.role === "HR") && (
          <Button onClick={() => setShowForm(true)}>+ Post</Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.length > 0 && (
            <Card title="Notifications">
              <ul className="space-y-3">
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`flex items-start justify-between gap-4 rounded-lg p-3 ${
                      notification.readAt ? "bg-slate-50" : "bg-teal-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                      <p className="text-sm text-slate-600">{notification.message}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.readAt && (
                      <Button size="sm" variant="ghost" onClick={() => markRead(notification._id)}>
                        Mark read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {list.length ? (
            list.map((a) => (
              <Card key={a._id}>
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  By {a.postedBy?.name} · {new Date(a.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.body}</p>
              </Card>
            ))
          ) : (
            <Card>
              <Empty title="No announcements yet" />
            </Card>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Announcement">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Title</label>
            <input required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Body</label>
            <textarea required rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Target</label>
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="hr">HR only</option>
              <option value="employee">Employees only</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Post</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
