import React, { useEffect, useState } from "react";
import { Inbox, Mail, MailCheck, Plus, Search, Send, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Folder = "inbox" | "sent" | "compose";
type Audience = "teacher" | "parent" | "student";

interface MessageRecord {
  id: number;
  sender_id: string;
  sender_role: string;
  sender_name: string;
  recipient_id: string;
  recipient_role: string;
  recipient_name: string;
  subject: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface RecipientOption {
  id: string;
  name: string;
  surname?: string;
  username?: string;
  email?: string;
}

const resourceByAudience: Record<Audience, string> = {
  teacher: "teachers",
  parent: "parents",
  student: "students",
};

const formatDateTime = (value: string) => {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const MessagesPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [folder, setFolder] = useState<Folder>("inbox");
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [selected, setSelected] = useState<MessageRecord | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience>("teacher");
  const [recipientId, setRecipientId] = useState("");
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (folder === "compose") return;
    let active = true;
    setLoading(true);
    setError(null);
    setSelected(null);

    api.getAll("messages", { folder, search: search.trim() }).then((response) => {
      if (!active) return;
      if (!response.success || !Array.isArray(response.data?.messages)) {
        setMessages([]);
        setError(response.message || "Unable to load messages.");
        return;
      }
      setMessages(response.data.messages);
      setUnreadCount(Number(response.data.unread_count) || 0);
    }).catch((requestError: unknown) => {
      if (!active) return;
      setMessages([]);
      setError(requestError instanceof Error ? requestError.message : "Unable to load messages.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [folder, refreshKey, search]);

  useEffect(() => {
    if (folder !== "compose" || !isAdmin) return;
    let active = true;
    setLoadingRecipients(true);
    setRecipientId("");
    api.getAll(resourceByAudience[audience], { page: 1, limit: 1000 }).then((response) => {
      if (!active) return;
      const records = response.data?.[resourceByAudience[audience]];
      if (!response.success || !Array.isArray(records)) {
        setError(response.message || `Unable to load ${audience} recipients.`);
        setRecipients([]);
        return;
      }
      setRecipients(records);
      setError(null);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : `Unable to load ${audience} recipients.`);
    }).finally(() => {
      if (active) setLoadingRecipients(false);
    });
    return () => { active = false; };
  }, [audience, folder, isAdmin]);

  const selectMessage = async (message: MessageRecord) => {
    setSelected(message);
    if (folder !== "inbox" || message.read_at) return;
    const response = await api.update("messages", message.id, {});
    if (response.success) {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, read_at: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
      setSelected((current) => current?.id === message.id ? { ...current, read_at: new Date().toISOString() } : current);
      window.dispatchEvent(new Event("school-messages-updated"));
    }
  };

  const markAllRead = async () => {
    setError(null);
    const response = await api.markAllMessagesRead();
    if (!response.success) {
      setError(response.message || "Unable to mark messages as read.");
      return;
    }
    setMessages((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    setSelected((current) => current ? { ...current, read_at: current.read_at || new Date().toISOString() } : current);
    setUnreadCount(0);
    window.dispatchEvent(new Event("school-messages-updated"));
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    setNotice(null);
    const response = await api.create("messages", {
      audience,
      recipient_id: recipientId || undefined,
      subject: subject.trim(),
      body: body.trim(),
    });
    setSending(false);
    if (!response.success) {
      setError(response.message || "Unable to send message.");
      return;
    }
    const deliveredTo = Number(response.data?.recipient_count) || 0;
    setNotice(`Message delivered to ${deliveredTo} ${audience}${deliveredTo === 1 ? "" : "s"}.`);
    setSubject("");
    setBody("");
    setFolder("sent");
    setRefreshKey((value) => value + 1);
  };

  const openFolder = (next: Folder) => {
    setError(null);
    setNotice(null);
    setFolder(next);
  };

  return (
    <div className="m-4 mt-0 flex-1 space-y-4 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Communication</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">{isAdmin ? "Send targeted messages and review delivery." : "Messages sent to your account."}</p>
        </div>
        {isAdmin && <button onClick={() => openFolder("compose")} className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"><Plus size={16} /> Compose</button>}
      </header>

      {notice && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{notice}</div>}
      {error && <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><span>{error}</span><button onClick={() => setRefreshKey((value) => value + 1)} className="shrink-0 font-semibold underline">Retry</button></div>}

      <div className="grid min-h-[620px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-gray-200 bg-gray-50 p-3 lg:border-b-0 lg:border-r">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-sky-500" />
          </div>
          <nav className="flex gap-2 lg:flex-col">
            <button onClick={() => openFolder("inbox")} className={`flex flex-1 items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium transition lg:flex-none ${folder === "inbox" ? "bg-sky-100 text-sky-900" : "text-gray-600 hover:bg-gray-100"}`}>
              <span className="flex items-center gap-2"><Inbox size={16} /> Inbox</span>
              {unreadCount > 0 && <span className="rounded-full bg-sky-700 px-2 py-0.5 text-[11px] font-semibold text-white">{unreadCount}</span>}
            </button>
            {isAdmin && <>
              <button onClick={() => openFolder("sent")} className={`flex flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition lg:flex-none ${folder === "sent" ? "bg-sky-100 text-sky-900" : "text-gray-600 hover:bg-gray-100"}`}><Send size={16} /> Sent</button>
              <button onClick={() => openFolder("compose")} className={`flex flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition lg:flex-none ${folder === "compose" ? "bg-sky-100 text-sky-900" : "text-gray-600 hover:bg-gray-100"}`}><Plus size={16} /> Compose</button>
            </>}
          </nav>
          {folder === "inbox" && unreadCount > 0 && <button onClick={markAllRead} className="mt-3 hidden w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 lg:flex"><MailCheck size={14} /> Mark all read</button>}
        </aside>

        {folder === "compose" && isAdmin ? (
          <section className="min-w-0 p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700"><Send size={19} /></span><div><h2 className="text-lg font-semibold text-gray-900">Compose message</h2><p className="text-sm text-gray-500">Choose a role and optionally target one person.</p></div></div>
            <form onSubmit={sendMessage} className="max-w-3xl space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">Audience
                  <select value={audience} onChange={(event) => setAudience(event.target.value as Audience)} className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">
                    <option value="teacher">Teachers</option><option value="parent">Parents</option><option value="student">Students</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">Recipient
                  <select value={recipientId} onChange={(event) => setRecipientId(event.target.value)} disabled={loadingRecipients} className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 disabled:bg-gray-100">
                    <option value="">All {audience}s</option>
                    {recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{[recipient.name, recipient.surname].filter(Boolean).join(" ") || recipient.username || recipient.id}{recipient.email ? ` · ${recipient.email}` : ""}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800"><Users size={14} />{recipientId ? "This message will be delivered to one selected recipient." : `This message will be delivered separately to all ${recipients.length} ${audience}${recipients.length === 1 ? "" : "s"}.`}</div>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">Subject
                <input required maxLength={255} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Message subject" className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">Message
                <textarea required rows={9} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message..." className="resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
              </label>
              <div className="flex justify-end"><button type="submit" disabled={sending || loadingRecipients || recipients.length === 0} className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} />{sending ? "Sending..." : "Send message"}</button></div>
            </form>
          </section>
        ) : (
          <section className="grid min-w-0 md:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.4fr)]">
            <div className="min-w-0 border-b border-gray-200 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><h2 className="text-sm font-semibold text-gray-800">{folder === "sent" ? "Sent messages" : "Inbox"}</h2>{folder === "inbox" && unreadCount > 0 && <button onClick={markAllRead} className="text-xs font-medium text-sky-700 hover:underline">Mark all read</button>}</div>
              {loading ? <p className="p-5 text-sm text-gray-500">Loading messages...</p> : messages.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center"><Mail size={26} className="text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-700">{error ? "Messages could not be loaded" : folder === "sent" ? "No sent messages yet" : "Your inbox is clear"}</p><p className="mt-1 text-xs text-gray-500">{error ? "Use Retry above to try again." : folder === "inbox" ? "Messages addressed to your account appear here." : "Messages you send will appear here."}</p></div> : <div className="max-h-[560px] overflow-y-auto">{messages.map((message) => {
                const active = selected?.id === message.id;
                const otherName = folder === "sent" ? message.recipient_name : message.sender_name;
                const otherRole = folder === "sent" ? message.recipient_role : message.sender_role;
                return <button key={message.id} onClick={() => void selectMessage(message)} className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition ${active ? "bg-sky-50" : "hover:bg-gray-50"}`}>
                  <div className="flex items-start justify-between gap-2"><span className={`truncate text-sm ${!message.read_at && folder === "inbox" ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>{otherName}</span><span className="shrink-0 text-[10px] text-gray-400">{formatDateTime(message.created_at)}</span></div>
                  <p className={`mt-1 truncate text-sm ${!message.read_at && folder === "inbox" ? "font-semibold text-gray-800" : "text-gray-600"}`}>{message.subject}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{message.body}</p>
                  <span className="mt-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] capitalize text-gray-500">{otherRole}</span>
                </button>;
              })}</div>}
            </div>
            <article className="min-w-0 p-5 md:p-7">
              {selected ? <>
                <div className="border-b border-gray-100 pb-4"><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{folder === "sent" ? `Sent to ${selected.recipient_role}` : `From ${selected.sender_role}`}</p><h2 className="mt-2 break-words text-xl font-semibold text-gray-900">{selected.subject}</h2><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500"><span>{folder === "sent" ? selected.recipient_name : selected.sender_name}</span><time>{formatDateTime(selected.created_at)}</time></div></div>
                <div className="whitespace-pre-wrap py-5 text-sm leading-7 text-gray-700">{selected.body}</div>
                {folder === "sent" && <p className="border-t border-gray-100 pt-3 text-xs text-gray-500">Recipient: {selected.recipient_name} ({selected.recipient_role}) · {selected.read_at ? "Read" : "Unread"}</p>}
              </> : <div className="flex min-h-64 flex-col items-center justify-center text-center"><Mail size={30} className="text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-700">Select a message</p><p className="mt-1 text-xs text-gray-500">Message details will appear here.</p></div>}
            </article>
          </section>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
