import React, { useEffect, useState } from "react";
import { Download, FileText, Inbox, Mail, MailCheck, Paperclip, Plus, Search, Send, Users, X } from "lucide-react";
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
  conversation_id: string;
  attachments?: MessageAttachment[];
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
  const { role, user } = useAuth();
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
  const [audience, setAudience] = useState<Audience>("teacher");
  const [recipientId, setRecipientId] = useState("");
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composeFiles, setComposeFiles] = useState<File[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (folder === "compose") return;
    let active = true;
    setLoading(true);
    setError(null);
    setSelected(null);
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
    }, 5000);
    return () => { active = false; window.clearInterval(interval); };
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

  useEffect(() => {
    if (!selected?.conversation_id) {
      setConversationMessages(selected ? [selected] : []);
      return;
    }
    let active = true;
    let initialLoad = true;
    const loadConversation = async () => {
      if (initialLoad) setThreadLoading(true);
      const response = await api.getAll("messages", { conversation_id: selected.conversation_id });
      if (!active) return;
      if (response.success && Array.isArray(response.data?.messages)) {
        setConversationMessages(response.data.messages);
        setUnreadCount(Number(response.data.unread_count) || 0);
        setMessages((current) => current.map((item) => item.conversation_id === selected.conversation_id && item.recipient_role === role
          ? { ...item, read_at: item.read_at || new Date().toISOString() }
          : item));
        window.dispatchEvent(new Event("school-messages-updated"));
      } else if (initialLoad) {
        setError(response.message || "Unable to load this conversation.");
      }
      if (initialLoad) {
        initialLoad = false;
        setThreadLoading(false);
      }
    };
    void loadConversation();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadConversation();
    }, 3000);
    return () => { active = false; window.clearInterval(interval); };
  }, [role, selected?.conversation_id, threadRefreshKey]);

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
    const deliveredTo = Number(response.data?.recipient_count) || 0;
    setNotice(`Message delivered to ${deliveredTo} ${audience}${deliveredTo === 1 ? "" : "s"}.`);
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

  const attachmentPicker = (files: File[], setFiles: React.Dispatch<React.SetStateAction<File[]>>, inputId: string) => (
    <div className="space-y-2">
      <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"><Paperclip size={14} /> Attach files</label>
      <input id={inputId} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files || [])].slice(0, 5))} />
      {files.length > 0 && <ul className="flex flex-wrap gap-2">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`} className="flex max-w-full items-center gap-2 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-700"><FileText size={13} /><span className="max-w-48 truncate">{file.name}</span><span className="shrink-0 text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span><button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><X size={13} /></button></li>)}</ul>}
      <p className="text-[11px] text-gray-400">Up to 5 files, 10 MB each. PDF, Office documents, TXT, PNG, or JPG.</p>
    </div>
  );

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
              {attachmentPicker(composeFiles, setComposeFiles, "compose-attachments")}
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
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Conversation</p><h2 className="mt-1 break-words text-lg font-semibold text-gray-900">{selected.subject}</h2></div><span className="text-xs text-gray-500">{conversationMessages.length} messages</span></div>
                <div className="max-h-[460px] space-y-4 overflow-y-auto py-5">
                  {threadLoading && conversationMessages.length === 0 ? <p className="text-sm text-gray-500">Loading conversation...</p> : conversationMessages.map((message) => {
                    const ownMessage = message.sender_id === user?.id && message.sender_role === role;
                    return <div key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] rounded-lg p-3.5 sm:max-w-[78%] ${ownMessage ? "bg-sky-100 text-sky-950" : "bg-gray-100 text-gray-800"}`}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs"><span className="font-semibold">{ownMessage ? "You" : message.sender_name} <span className="font-normal capitalize opacity-70">· {message.sender_role}</span></span><time className="opacity-60">{formatDateTime(message.created_at)}</time></div>
                        {message.id === conversationMessages[0]?.id && <p className="mb-1 text-xs font-semibold">{message.subject}</p>}
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                        {!!message.attachments?.length && <ul className="mt-3 space-y-1.5 border-t border-black/10 pt-2">{message.attachments.map((attachment) => <li key={attachment.id}><button type="button" onClick={() => void downloadAttachment(attachment)} className="inline-flex max-w-full items-center gap-2 rounded px-2 py-1 text-xs font-medium underline decoration-current/40 hover:bg-white/50"><Download size={13} /><span className="truncate">{attachment.original_name}</span><span className="shrink-0 opacity-60">{(attachment.file_size / 1024 / 1024).toFixed(1)} MB</span></button></li>)}</ul>}
                      </div>
                    </div>;
                  })}
                </div>
                {selected.conversation_id ? <form onSubmit={sendReply} className="border-t border-gray-100 pt-4">
                  <label className="sr-only" htmlFor="reply-body">Reply</label>
                  <textarea id="reply-body" required rows={3} value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write a reply..." className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-sky-500" />
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">{attachmentPicker(replyFiles, setReplyFiles, "reply-attachments")}<button type="submit" disabled={sendingReply || !replyBody.trim()} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"><Send size={14} />{sendingReply ? "Sending..." : "Send reply"}</button></div>
                </form> : <p className="border-t border-gray-100 pt-3 text-xs text-gray-500">This older message has no reply thread available.</p>}
              </> : <div className="flex min-h-64 flex-col items-center justify-center text-center"><Mail size={30} className="text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-700">Select a message</p><p className="mt-1 text-xs text-gray-500">Conversation and attachments appear here.</p></div>}
            </article>
          </section>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
