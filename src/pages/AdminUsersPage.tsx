import React, { useEffect, useState } from "react";
import { Check, KeyRound, Pencil, Plus, Search, Shield, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

type AdminRole = "admin" | "super_admin";

interface AdminAccount {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

interface AdminDraft {
  username: string;
  email: string;
  role: AdminRole;
  password: string;
}

const emptyDraft: AdminDraft = { username: "", email: "", role: "admin", password: "" };
const fieldClass = "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<AdminDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<AdminAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    const response = await api.getAll("admins");
    if (response.success && Array.isArray(response.data?.admins)) {
      setAdmins(response.data.admins);
      setError(null);
    } else {
      setError(response.message || "Unable to load administrator accounts.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAdmins();
  }, []);

  const filteredAdmins = admins.filter((admin) =>
    `${admin.username} ${admin.email} ${admin.role}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
    setNotice(null);
    setDialogOpen(true);
  };

  const startEdit = (admin: AdminAccount) => {
    setEditingId(admin.id);
    setDraft({ username: admin.username, email: admin.email, role: admin.role, password: "" });
    setError(null);
    setNotice(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const payload: Record<string, string> = {
      username: draft.username.trim(),
      email: draft.email.trim(),
      role: draft.role,
    };
    if (draft.password) payload.password = draft.password;

    try {
      const response = editingId
        ? await api.update("admins", editingId, payload)
        : await api.create("admins", payload);
      if (!response.success) {
        setError(response.message || "Unable to save administrator account.");
        return;
      }
      setDialogOpen(false);
      setNotice(editingId ? "Administrator account updated." : "Administrator account created.");
      await loadAdmins();
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await api.delete("admins", confirmingDelete.id);
      if (!response.success) {
        setError(response.message || "Unable to delete administrator account.");
        return;
      }
      setConfirmingDelete(null);
      setNotice("Administrator account deleted.");
      await loadAdmins();
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-700">Other / Role access</p>
          <h1 className="text-2xl font-semibold text-gray-900">All Role</h1>
          <p className="mt-1 text-sm text-gray-500">Maintain administrator profiles and assign system-wide access.</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800">
          <Plus size={17} aria-hidden="true" />
          Create admin
        </button>
      </header>

      <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Administrator accounts</h2>
            <p className="mt-1 text-xs text-gray-500">{admins.length} account{admins.length === 1 ? "" : "s"}</p>
          </div>
          <label className="flex w-full items-center gap-2 rounded-md border border-gray-300 px-3 py-2 sm:max-w-xs">
            <Search size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
            <span className="sr-only">Search administrators</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search username, email, role" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
        </div>

        {notice && <p role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {error && !dialogOpen && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role access</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading administrator accounts...</td></tr>
              ) : filteredAdmins.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">{search ? "No matching accounts." : "No administrator accounts found."}</td></tr>
              ) : filteredAdmins.map((admin) => (
                <tr key={admin.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <UserRound size={16} className="text-gray-400" aria-hidden="true" />
                      {admin.username}
                      {admin.id === user?.id && <span className="text-[10px] font-semibold uppercase text-sky-700">You</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{admin.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${admin.role === "super_admin" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"}`}>
                      {admin.role === "super_admin" ? <ShieldCheck size={14} aria-hidden="true" /> : <Shield size={14} aria-hidden="true" />}
                      {admin.role === "super_admin" ? "Super admin" : "Admin"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{admin.created_at ? new Date(admin.created_at.replace(" ", "T")).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => startEdit(admin)} aria-label={`Edit ${admin.username}`} title="Edit account and role access" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-sky-50 hover:text-sky-700">
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => { setError(null); setConfirmingDelete(admin); }} disabled={admin.id === user?.id} aria-label={`Delete ${admin.username}`} title={admin.id === user?.id ? "You cannot delete your own account" : "Delete account"} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30">
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="admin-form-title" className="w-full max-w-lg rounded-md bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 id="admin-form-title" className="font-semibold text-gray-900">{editingId ? "Edit administrator" : "Create administrator"}</h2>
                <p className="mt-1 text-xs text-gray-500">Set account identity and role access.</p>
              </div>
              <button type="button" onClick={() => setDialogOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"><X size={17} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <label className="block text-sm font-medium text-gray-700">
                Username
                <input required minLength={3} maxLength={64} autoComplete="username" value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} className={`${fieldClass} mt-1.5`} />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email
                <input required={!editingId} type="email" autoComplete="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className={`${fieldClass} mt-1.5`} />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Role access
                <select value={draft.role} disabled={editingId === user?.id} onChange={(event) => setDraft({ ...draft, role: event.target.value as AdminRole })} className={`${fieldClass} mt-1.5 disabled:bg-gray-100`}>
                  <option value="admin">Admin · School management</option>
                  <option value="super_admin">Super admin · Full system access</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Password {editingId && <span className="font-normal text-gray-500">(leave blank to keep current)</span>}
                <input required={!editingId} minLength={8} type="password" autoComplete="new-password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} className={`${fieldClass} mt-1.5`} />
              </label>
              <p className="flex items-center gap-2 text-xs text-gray-500"><KeyRound size={14} aria-hidden="true" />Passwords are stored as secure hashes.</p>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50">
                  <Check size={15} aria-hidden="true" />
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create admin"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setConfirmingDelete(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-admin-title" className="w-full max-w-md rounded-md bg-white p-5 shadow-2xl">
            <h2 id="delete-admin-title" className="font-semibold text-gray-900">Delete {confirmingDelete.username}?</h2>
            <p className="mt-2 text-sm text-gray-500">This removes the account and its access. The last super-admin account cannot be deleted.</p>
            {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmingDelete(null)} disabled={deleting} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void handleDelete()} disabled={deleting} className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">
                <Trash2 size={15} aria-hidden="true" />
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
