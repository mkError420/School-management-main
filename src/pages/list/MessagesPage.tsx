import React, { useEffect, useRef, useState } from "react";
import { Download, FileText, Inbox, Mail, MailCheck, Paperclip, Plus, Search, Send, Trash2, Users, X, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useAccessRole, useAuth } from "@/context/AuthContext";

type Folder = "inbox" | "sent" | "compose";
type Audience = "admin" | "teacher" | "student" | "parent";

interface BroadcastRecipient {
  id: string;
  name: string;
  role: string;
  img?: string | null;
}

interface MessageRecord {
  id: number;
  sender_id: string;
  sender_role: string;
  sender_name: string;
  sender_img?: string | null;
  recipient_id: string;
  recipient_role: string;
  recipient_name: string;
  recipient_img?: string | null;
  subject: string;
  body: string;
  created_at: string;
  read_at: string | null;
  conversation_id: string;
  attachments?: MessageAttachment[];
  // Broadcast / sent-folder grouping
  is_broadcast?: boolean;
  broadcast_recipients?: BroadcastRecipient[];
  recipient_count?: number;
}

interface MessageAttachment {
  id: number;
  original_name: string;
  mime_type: string;
  file_size: number;
}

interface RecipientOption {
  id: string;
  name: string;
  surname?: string;
  username?: string;
  email?: string;
  role: string;
  class_name?: string;
  img?: string | null;
}

const formatDateTime = (value: string) => {
  if (!value) return "";
  const normalized = value.endsWith("Z") || value.includes("+")
    ? value
    : value.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

/** Renders a single circular avatar â€” image if available, else coloured initials */
const AvatarBubble: React.FC<{ name: string; img?: string | null; size?: number; className?: string }> = ({
  name, img, size = 36, className = "",
}) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  // Stable colour from name hash
  const colours = [
    "bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500",
    "bg-amber-500", "bg-purple-500", "bg-teal-500", "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  const colour = colours[Math.abs(hash) % colours.length];

  const style = { width: size, height: size, fontSize: Math.max(10, size / 2.8) };

  if (img) {
    return (
      <img
        src={img.startsWith("http") ? img : `/uploads/${img}`}
        alt={name}
        style={style}
        className={`rounded-full object-cover ring-2 ring-white shrink-0 ${className}`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colour} ring-2 ring-white ${className}`}
    >
      {initials || "?"}
    </span>
  );
};

/** Stacked avatar row for broadcast messages â€“ shows up to 4 overlapping bubbles + overflow badge */
const AvatarStack: React.FC<{ recipients: BroadcastRecipient[]; total: number }> = ({ recipients, total }) => {
  const shown = recipients.slice(0, 4);
  const overflow = total - shown.length;
  return (
    <span className="inline-flex items-center" aria-label={`${total} recipients`}>
      {shown.map((r, idx) => (
        <span key={r.id} style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: shown.length - idx }} className="relative">
          <AvatarBubble name={r.name} img={r.img} size={28} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          style={{ width: 28, height: 28, marginLeft: -8, fontSize: 10 }}
          className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-gray-300 font-bold text-gray-700 ring-2 ring-white"
        >
          +{overflow}
        </span>
      )}
    </span>
  );
};


const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const role = useAccessRole();
  const isAdmin = role === "admin";

  const [folder, setFolder] = useState<Folder>("inbox");
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [selected, setSelected] = useState<MessageRecord | null>(null);
  const [conversationMessages, setConversationMessages] = useState<MessageRecord[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compose states
  const [audience, setAudience] = useState<Audience>(isAdmin ? "teacher" : "admin");
  const [recipientId, setRecipientId] = useState("");
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composeFiles, setComposeFiles] = useState<File[]>([]);

  // Reply states
  const [replyBody, setReplyBody] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Deletion states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Realtime Polling for messages list
  useEffect(() => {
    if (folder === "compose") return;
    let active = true;
    setLoading(true);
    setError(null);

    const loadMessages = async (initialLoad: boolean) => {
      if (initialLoad) setLoading(true);
      try {
        const response = await api.getAll("messages", { folder, search: search.trim() });
        if (!active) return;
        if (!response.success || !Array.isArray(response.data?.messages)) {
          if (initialLoad) setMessages([]);
          setError(response.message || "Unable to load messages.");
          return;
        }
        setMessages(response.data.messages);
        setUnreadCount(Number(response.data.unread_count) || 0);
        window.dispatchEvent(new Event("school-messages-updated"));
        setError(null);
      } catch (requestError: unknown) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load messages.");
      } finally {
        if (active && initialLoad) setLoading(false);
      }
    };

    void loadMessages(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages(false);
    }, 4000);

    const onFocus = () => {
      if (document.visibilityState === "visible") void loadMessages(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [folder, refreshKey, search]);

  // Load recipients for compose
  useEffect(() => {
    if (folder !== "compose") return;
    let active = true;
    setLoadingRecipients(true);
    setRecipientId("");

    api.getMessageRecipients(audience)
      .then((response) => {
        if (!active) return;
        const records = response.data?.recipients;
        if (!response.success || !Array.isArray(records)) {
          setError(response.message || `Unable to load ${audience} recipients.`);
          setRecipients([]);
          return;
        }
        setRecipients(records);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : `Unable to load ${audience} recipients.`);
      })
      .finally(() => {
        if (active) setLoadingRecipients(false);
      });

    return () => { active = false; };
  }, [audience, folder]);

  // Realtime Polling for active conversation thread
  useEffect(() => {
    if (!selected?.conversation_id) {
      setConversationMessages(selected ? [selected] : []);
      return;
    }

    let active = true;
    let initialLoad = true;
    let previousCount = 0;

    const loadConversation = async () => {
      if (initialLoad) setThreadLoading(true);
      const response = await api.getAll("messages", { conversation_id: selected.conversation_id });
      if (!active) return;
      if (response.success && Array.isArray(response.data?.messages)) {
        const msgs = response.data.messages;
        setConversationMessages(msgs);
        setUnreadCount(Number(response.data.unread_count) || 0);

        setMessages((current) => current.map((item) =>
          item.conversation_id === selected.conversation_id && (item.recipient_id === user?.id)
            ? { ...item, read_at: item.read_at || new Date().toISOString() }
            : item
        ));
        window.dispatchEvent(new Event("school-messages-updated"));

        // If new message arrived, scroll to bottom
        if (msgs.length > previousCount) {
          previousCount = msgs.length;
          setTimeout(scrollToBottom, 100);
        }
      } else if (initialLoad) {
        setError(response.message || "Unable to load this conversation.");
      }

      if (initialLoad) {
        initialLoad = false;
        setThreadLoading(false);
        setTimeout(scrollToBottom, 150);
      }
    };

    void loadConversation();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadConversation();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [selected?.conversation_id, threadRefreshKey, user?.id]);

  useEffect(() => {
    if (selected?.conversation_id && !messages.some((message) => message.conversation_id === selected.conversation_id)) {
      setSelected(null);
      setConversationMessages([]);
    }
  }, [messages, selected?.conversation_id]);

  const selectMessage = (message: MessageRecord) => {
    setSelected(message);
    setReplyBody("");
    setReplyFiles([]);
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

    const formData = new FormData();
    formData.append("audience", audience);
    if (recipientId) formData.append("recipient_id", recipientId);
    formData.append("subject", subject.trim());
    formData.append("body", body.trim());
    composeFiles.forEach((file) => formData.append("attachments[]", file, file.name));

    const response = await api.uploadMessage(formData);
    setSending(false);

    if (!response.success) {
      setError(response.message || "Unable to send message.");
      return;
    }

    const deliveredTo = Number(response.data?.recipient_count) || 1;
    setNotice(`Message sent successfully (${deliveredTo} recipient${deliveredTo === 1 ? "" : "s"}).`);
    setSubject("");
    setBody("");
    setComposeFiles([]);
    setFolder("sent");
    setRefreshKey((value) => value + 1);
  };

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected?.conversation_id || !replyBody.trim()) return;

    setSendingReply(true);
    setError(null);

    const formData = new FormData();
    formData.append("conversation_id", selected.conversation_id);
    formData.append("body", replyBody.trim());
    replyFiles.forEach((file) => formData.append("attachments[]", file, file.name));

    const response = await api.uploadMessage(formData);
    setSendingReply(false);

    if (!response.success) {
      setError(response.message || "Unable to send reply.");
      return;
    }

    setReplyBody("");
    setReplyFiles([]);
    setNotice("Reply sent.");
    setThreadRefreshKey((value) => value + 1);
    setTimeout(scrollToBottom, 200);
    window.dispatchEvent(new Event("school-messages-updated"));
  };

  const downloadAttachment = async (attachment: MessageAttachment) => {
    try {
      const blob = await api.downloadMessageAttachment(attachment.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.original_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError: unknown) {
      setError(downloadError instanceof Error ? downloadError.message : "Attachment download failed.");
    }
  };

  // Delete an entire conversation - Soft delete from user's view
  const deleteConversation = async (conversationId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    if (!window.confirm("Remove this conversation from your view? The other party's messages will not be affected.")) {
      return;
    }

    setDeletingConversationId(conversationId);
    setError(null);

    try {
      const response = await api.deleteConversation(conversationId);
      if (!response.success) {
        setError(response.message || "Unable to delete conversation.");
        return;
      }

      setMessages((current) => current.filter((item) => item.conversation_id !== conversationId));
      if (selected?.conversation_id === conversationId) {
        setSelected(null);
        setConversationMessages([]);
      }
      setNotice("Conversation removed from your view successfully.");
      window.dispatchEvent(new Event("school-messages-updated"));
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setDeletingConversationId(null);
    }
  };

  // Delete a single message - Only sender can delete their own message
  const deleteMessage = async (message: MessageRecord, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    if (String(message.sender_id) !== String(user?.id)) {
      setError("You can only delete messages that you sent.");
      return;
    }
    if (!window.confirm("Delete this message? This cannot be undone.")) return;

    setDeletingId(message.id);
    setError(null);

    try {
      const response = await api.delete("messages", message.id);
      if (!response.success) {
        setError(response.message || "Unable to delete this message.");
        return;
      }

      setMessages((current) => current.filter((item) => item.id !== message.id));
      setConversationMessages((current) => current.filter((item) => item.id !== message.id));

      if (selected?.id === message.id) {
        setSelected(null);
        setConversationMessages([]);
      } else if (selected?.conversation_id && selected.conversation_id === message.conversation_id) {
        setThreadRefreshKey((current) => current + 1);
      }

      if (message.recipient_id === user?.id && !message.read_at) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      setNotice("Message deleted successfully.");
      window.dispatchEvent(new Event("school-messages-updated"));
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const attachmentPicker = (files: File[], setFiles: React.Dispatch<React.SetStateAction<File[]>>, inputId: string) => (
    <div className="space-y-2">
      <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
        <Paperclip size={14} /> Attach files
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.gif"
        className="sr-only"
        onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files || [])].slice(0, 5))}
      />
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`} className="flex max-w-full items-center gap-2 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-700">
              <FileText size={13} />
              <span className="max-w-48 truncate">{file.name}</span>
              <span className="shrink-0 text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}>
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-gray-400">Up to 5 files, 10 MB each. PDF, Office documents, TXT, PNG, JPG, or WebP.</p>
    </div>
  );

  const openFolder = (next: Folder) => {
    setError(null);
    setNotice(null);
    setFolder(next);
  };

  return (
    <div className="m-4 mt-0 flex-1 space-y-4 pb-8">
      {/* â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="flex flex-wrap items-end justify-between gap-3 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Communication</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">Realtime messaging system between students, teachers, parents, and administrators.</p>
        </div>

        {/* Compose Button - Available for EVERYONE */}
        <button
          onClick={() => openFolder("compose")}
          className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 transition shadow-xs"
        >
          <Plus size={16} /> Compose Message
        </button>
      </header>

      {notice && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-center justify-between" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-green-700 hover:text-green-900"><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{error}</span>
          <button onClick={() => setRefreshKey((value) => value + 1)} className="shrink-0 font-semibold underline">Retry</button>
        </div>
      )}

      {/* â”€â”€â”€ Main Content Box â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid min-h-[620px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* â”€â”€â”€ Left Sidebar Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <aside className="border-b border-gray-200 bg-gray-50 p-3 lg:border-b-0 lg:border-r">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-sky-500"
            />
          </div>

          <nav className="flex gap-2 lg:flex-col">
            <button
              onClick={() => openFolder("inbox")}
              className={`flex flex-1 items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium transition lg:flex-none ${
                folder === "inbox" ? "bg-sky-100 text-sky-900" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2"><Inbox size={16} /> Inbox</span>
              {unreadCount > 0 && <span className="rounded-full bg-sky-700 px-2 py-0.5 text-[11px] font-semibold text-white">{unreadCount}</span>}
            </button>

            {/* Sent Folder - Available for EVERYONE */}
            <button
              onClick={() => openFolder("sent")}
              className={`flex flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition lg:flex-none ${
                folder === "sent" ? "bg-sky-100 text-sky-900" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Send size={16} /> Sent
            </button>

            {/* Compose Folder - Available for EVERYONE */}
            <button
              onClick={() => openFolder("compose")}
              className={`flex flex-1 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition lg:flex-none ${
                folder === "compose" ? "bg-sky-100 text-sky-900" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Plus size={16} /> Compose
            </button>
          </nav>

          {folder === "inbox" && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="mt-3 hidden w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 lg:flex"
            >
              <MailCheck size={14} /> Mark all read
            </button>
          )}
        </aside>

        {/* â”€â”€â”€ Center / Right Pane â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {folder === "compose" ? (
          /* â”€â”€â”€ Compose View: Available to EVERYONE â”€â”€â”€â”€â”€â”€â”€â”€ */
          <section className="min-w-0 p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                <Send size={19} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Compose message</h2>
                <p className="text-sm text-gray-500">Send an instant message to any teacher, student, parent, or administration.</p>
              </div>
            </div>

            <form onSubmit={sendMessage} className="max-w-3xl space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                  Recipient Role
                  <select
                    value={audience}
                    onChange={(event) => setAudience(event.target.value as Audience)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  >
                    <option value="admin">Administrators / School Office</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                    <option value="parent">Parents</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                  Recipient Name
                  <select
                    value={recipientId}
                    onChange={(event) => setRecipientId(event.target.value)}
                    disabled={loadingRecipients}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 disabled:bg-gray-100"
                  >
                    {isAdmin ? (
                      <option value="">All {audience}s (Broadcast)</option>
                    ) : audience === "admin" ? (
                      <option value="">School Administration (All Office Admins)</option>
                    ) : (
                      <option value="">Select a {audience}...</option>
                    )}
                    {recipients.map((recipient) => {
                      const displayName = [recipient.name, recipient.surname].filter(Boolean).join(" ") || recipient.username || recipient.id;
                      return (
                        <option key={recipient.id} value={recipient.id}>
                          {displayName}
                          {recipient.class_name ? ` (${recipient.class_name})` : ""}
                          {recipient.email ? ` Â· ${recipient.email}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
                <Users size={14} />
                {recipientId
                  ? "Delivering privately to the selected recipient."
                  : audience === "admin"
                  ? "Delivering to school administration."
                  : `Delivering to all ${recipients.length} ${audience}${recipients.length === 1 ? "" : "s"}.`}
              </div>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                Subject
                <input
                  required
                  maxLength={255}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Message subject"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                Message Body
                <textarea
                  required
                  rows={9}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your message..."
                  className="resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </label>

              {attachmentPicker(composeFiles, setComposeFiles, "compose-attachments")}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => openFolder("inbox")}
                  className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || loadingRecipients || (!recipientId && !isAdmin && audience !== "admin")}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} />
                  {sending ? "Sending..." : "Send message"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          /* â”€â”€â”€ Messages List & Active Thread View â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
          <section className="grid min-w-0 md:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.4fr)]">
            {/* â”€â”€â”€ List of Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="min-w-0 border-b border-gray-200 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-800">
                  {folder === "sent" ? "Sent messages" : "Inbox"}
                </h2>
                {folder === "inbox" && unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-sky-700 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              {loading ? (
                <p className="p-5 text-sm text-gray-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
                  <Mail size={26} className="text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    {error ? "Messages could not be loaded" : folder === "sent" ? "No sent messages yet" : "Your inbox is clear"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {error
                      ? "Use Retry above to try again."
                      : folder === "inbox"
                      ? "Messages addressed to your account appear here."
                      : "Messages you send will appear here."}
                  </p>
                </div>
              ) : (
                <div className="max-h-[560px] overflow-y-auto">
                  {messages.map((message) => {
                    const active = selected?.conversation_id === message.conversation_id;
                    const isBroadcast = message.is_broadcast === true;
                    const otherName = folder === "sent" ? message.recipient_name : message.sender_name;
                    const otherRole = folder === "sent" ? message.recipient_role : message.sender_role;
                    const otherImg = folder === "sent" ? message.recipient_img : message.sender_img;
                    const isUnread = !message.read_at && folder === "inbox";

                    return (
                      <div
                        key={message.id}
                        className={`border-b border-gray-100 transition group ${
                          active ? "bg-sky-50" : isUnread ? "bg-sky-50/40 hover:bg-gray-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => void selectMessage(message)}
                          className="block w-full px-4 pt-3 text-left"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar area */}
                            <div className="shrink-0">
                              {isBroadcast && message.broadcast_recipients?.length ? (
                                <AvatarStack
                                  recipients={message.broadcast_recipients}
                                  total={message.recipient_count ?? message.broadcast_recipients.length}
                                />
                              ) : (
                                <AvatarBubble name={otherName || "?"} img={otherImg} size={36} />
                              )}
                            </div>

                            {/* Text */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`truncate text-sm ${
                                  isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"
                                }`}>
                                  {isBroadcast
                                    ? `${otherRole ? otherRole.charAt(0).toUpperCase() + otherRole.slice(1) : ""} Broadcast (${message.recipient_count ?? "All"})`
                                    : otherName}
                                </span>
                                <span className="shrink-0 text-[10px] text-gray-400">
                                  {formatDateTime(message.created_at)}
                                </span>
                              </div>
                              <p className={`mt-0.5 truncate text-sm ${
                                isUnread ? "font-bold text-gray-800" : "text-gray-600"
                              }`}>
                                {message.subject}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-gray-500">
                                {message.body}
                              </p>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center justify-between px-4 pb-3 pt-2">
                          <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] capitalize text-gray-500">
                            {isBroadcast ? `${message.recipient_count ?? ""} recipients` : otherRole}
                          </span>

                          {/* Delete Conversation action available to EVERYONE */}
                          <button
                            type="button"
                            onClick={(e) => void deleteConversation(message.conversation_id, e)}
                            disabled={deletingConversationId === message.conversation_id}
                            aria-label={`Remove conversation with ${otherName}`}
                            title="Remove conversation from your view"
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-700 opacity-80 group-hover:opacity-100 disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* â”€â”€â”€ Active Conversation Thread â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <article className="min-w-0 p-5 md:p-7 flex flex-col justify-between">
              {selected ? (
                <>
                  <div>
                    {/* Conversation Header with DELETE CONVERSATION for EVERYONE */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {(() => {
                          const isOwn = String(selected.sender_id) === String(user?.id);
                          const isBcast = selected.is_broadcast === true;
                          if (isBcast && selected.broadcast_recipients?.length) {
                            return (
                              <AvatarStack
                                recipients={selected.broadcast_recipients}
                                total={selected.recipient_count ?? selected.broadcast_recipients.length}
                              />
                            );
                          }
                          const name = isOwn ? selected.recipient_name : selected.sender_name;
                          const img = isOwn ? selected.recipient_img : selected.sender_img;
                          return <AvatarBubble name={name || "?"} img={img} size={40} />;
                        })()}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Conversation Thread</p>
                          <h2 className="mt-0.5 break-words text-lg font-semibold text-gray-900">{selected.subject}</h2>
                          {selected.is_broadcast && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              <Users size={11} className="inline mr-1" />
                              Broadcast to {selected.recipient_count ?? "all"} {selected.recipient_role}s
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-500">{conversationMessages.length} messages</span>
                        {/* Delete Conversation Button - EVERYONE CAN DELETE */}
                        <button
                          type="button"
                          onClick={() => void deleteConversation(selected.conversation_id)}
                          disabled={deletingConversationId === selected.conversation_id}
                          title="Remove conversation from your view"
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          <span>Delete Conversation</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="max-h-[460px] space-y-4 overflow-y-auto py-5">
                      {threadLoading && conversationMessages.length === 0 ? (
                        <p className="text-sm text-gray-500">Loading conversation...</p>
                      ) : (
                        conversationMessages.map((message) => {
                          const ownMessage = (String(message.sender_id) === String(user?.id));
                          const avatarName = ownMessage ? (user?.username ?? "You") : message.sender_name;
                          const avatarImg = ownMessage ? null : message.sender_img;

                          return (
                            <div key={message.id} className={`flex items-end gap-2.5 ${ownMessage ? "flex-row-reverse" : "flex-row"}`}>
                              {/* Profile avatar beside bubble */}
                              <div className="shrink-0 pb-1">
                                <AvatarBubble name={avatarName} img={avatarImg} size={34} />
                              </div>

                              <div className={`max-w-[85%] rounded-lg p-3.5 sm:max-w-[72%] ${
                                ownMessage ? "bg-sky-100 text-sky-950" : "bg-gray-100 text-gray-800"
                              }`}>
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
                                  <span className="font-semibold">
                                    {ownMessage ? "You" : message.sender_name}{" "}
                                    <span className="font-normal capitalize opacity-70">Â· {message.sender_role}</span>
                                  </span>
                                  <time className="opacity-60">{formatDateTime(message.created_at)}</time>
                                </div>

                                {message.id === conversationMessages[0]?.id && (
                                  <p className="mb-1 text-xs font-semibold">{message.subject}</p>
                                )}

                                <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>

                                {!!message.attachments?.length && (
                                  <ul className="mt-3 space-y-1.5 border-t border-black/10 pt-2">
                                    {message.attachments.map((attachment) => (
                                      <li key={attachment.id}>
                                        <button
                                          type="button"
                                          onClick={() => void downloadAttachment(attachment)}
                                          className="inline-flex max-w-full items-center gap-2 rounded px-2 py-1 text-xs font-medium underline decoration-current/40 hover:bg-white/50"
                                        >
                                          <Download size={13} />
                                          <span className="truncate">{attachment.original_name}</span>
                                          <span className="shrink-0 opacity-60">
                                            {(attachment.file_size / 1024 / 1024).toFixed(1)} MB
                                          </span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {/* Individual message delete button - only for messages you sent */}
                                {ownMessage && (
                                  <div className="mt-3 flex justify-end border-t border-black/10 pt-2">
                                    <button
                                      type="button"
                                      onClick={(e) => void deleteMessage(message, e)}
                                      disabled={deletingId === message.id}
                                      title="Delete this message"
                                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-white/60 hover:text-red-700 disabled:opacity-50"
                                    >
                                      <Trash2 size={12} />
                                      <span>{deletingId === message.id ? "Deleting..." : "Delete message"}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* â”€â”€â”€ Realtime Reply Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {selected.conversation_id ? (
                    <form onSubmit={sendReply} className="border-t border-gray-100 pt-4">
                      <label className="sr-only" htmlFor="reply-body">Reply</label>
                      <textarea
                        id="reply-body"
                        required
                        rows={3}
                        value={replyBody}
                        onChange={(event) => setReplyBody(event.target.value)}
                        placeholder="Write a reply..."
                        className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-sky-500"
                      />
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        {attachmentPicker(replyFiles, setReplyFiles, "reply-attachments")}
                        <button
                          type="submit"
                          disabled={sendingReply || !replyBody.trim()}
                          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={14} />
                          {sendingReply ? "Sending..." : "Send reply"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="border-t border-gray-100 pt-3 text-xs text-gray-500">
                      This older message has no reply thread available.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center text-center m-auto">
                  <Mail size={30} className="text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-700">Select a message or compose a new one</p>
                  <p className="mt-1 text-xs text-gray-500">Conversation messages and attached files will appear here.</p>
                </div>
              )}
            </article>
          </section>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
