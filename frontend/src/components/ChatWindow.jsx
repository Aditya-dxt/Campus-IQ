import { useState, useRef, useEffect } from 'react';
import {
  Send,
  FileText,
  Upload,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Loader2,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ──────────────────────── Document Sidebar ──────────────────────── */
function DocumentPanel({ documents, onUploadDoc, onClose }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadDoc?.(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
        <div className="flex items-center gap-2 text-surface-800">
          <FileText size={18} className="text-primary-500" />
          <h2 className="text-sm font-semibold">Your Documents</h2>
        </div>
        {/* Close only visible on mobile overlay */}
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-surface-400 transition hover:bg-surface-100 hover:text-surface-600 lg:hidden"
          aria-label="Close sidebar"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Document list */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {documents && documents.length > 0 ? (
          documents.map((doc, idx) => (
            <div
              key={doc.id ?? idx}
              className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-surface-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-800">
                  {doc.name}
                </p>
                <p className="text-xs text-surface-400">
                  {doc.size ? formatFileSize(doc.size) : ''}
                  {doc.size && doc.uploadDate ? ' · ' : ''}
                  {doc.uploadDate ? formatDate(doc.uploadDate) : ''}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-sm text-surface-400">
            No documents yet
          </p>
        )}
      </div>

      {/* Upload button */}
      <div className="border-t border-surface-100 p-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
        >
          <Upload size={16} />
          Upload Document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload document"
        />
      </div>
    </div>
  );
}

/* ──────────────────────── Source Citation ──────────────────────── */
function SourceCitation({ source }) {
  if (!source) return null;
  return (
    <div className="mt-2 rounded-lg bg-surface-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-surface-500">
        <BookOpen size={12} />
        <span>
          {source.document}
          {source.page != null && ` · p.${source.page}`}
        </span>
      </div>
      {source.snippet && (
        <p className="mt-1 line-clamp-2 text-xs italic text-surface-400">
          "{source.snippet}"
        </p>
      )}
    </div>
  );
}

/* ──────────────────────── Feedback Buttons ──────────────────────── */
function FeedbackButtons({ messageId, feedback, onRate }) {
  return (
    <div className="mt-2 flex items-center gap-1">
      <button
        type="button"
        onClick={() => onRate?.(messageId, 'up')}
        className={`rounded-lg p-1.5 transition ${
          feedback === 'up'
            ? 'bg-primary-100 text-primary-600'
            : 'text-surface-300 hover:bg-surface-100 hover:text-surface-500'
        }`}
        aria-label="Helpful"
      >
        <ThumbsUp size={14} />
      </button>
      <button
        type="button"
        onClick={() => onRate?.(messageId, 'down')}
        className={`rounded-lg p-1.5 transition ${
          feedback === 'down'
            ? 'bg-red-100 text-red-500'
            : 'text-surface-300 hover:bg-surface-100 hover:text-surface-500'
        }`}
        aria-label="Not helpful"
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}

/* ──────────────────────── Typing Indicator ──────────────────────── */
function TypingIndicator() {
  return (
    <div className="chat-bubble-ai mr-auto flex max-w-[85%] items-center gap-1.5 rounded-2xl bg-white px-5 py-4 shadow-sm">
      <span className="typing-dot h-2 w-2 rounded-full bg-surface-400" />
      <span className="typing-dot h-2 w-2 rounded-full bg-surface-400" />
      <span className="typing-dot h-2 w-2 rounded-full bg-surface-400" />
    </div>
  );
}

/* ──────────────────────── Main Component ──────────────────────── */
export default function ChatWindow({
  messages = [],
  documents = [],
  suggestedQuestions = [],
  onSendMessage,
  onUploadDoc,
  onRate,
  loading,
}) {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll on new messages / loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    onSendMessage?.(text);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedClick = (q) => {
    if (loading) return;
    onSendMessage?.(q);
  };

  return (
    <div className="relative flex h-full overflow-hidden rounded-2xl border border-surface-200 bg-surface-50 shadow-sm">
      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          absolute inset-y-0 left-0 z-40 w-72 transform border-r border-surface-100
          bg-white transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <DocumentPanel
          documents={documents}
          onUploadDoc={onUploadDoc}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Chat Pane ── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile toggle */}
        <div className="flex items-center gap-2 border-b border-surface-100 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-surface-500 transition hover:bg-surface-100"
            aria-label="Open documents"
          >
            <MessageSquare size={20} />
          </button>
          <span className="text-sm font-medium text-surface-700">Chat</span>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageSquare
                size={40}
                strokeWidth={1.5}
                className="mb-3 text-surface-300"
              />
              <p className="text-surface-400">
                Start a conversation by sending a message below.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    rounded-2xl px-5 py-3 shadow-sm
                    ${
                      isUser
                        ? 'chat-bubble-user ml-auto max-w-[75%] bg-primary-500 text-white'
                        : 'chat-bubble-ai mr-auto max-w-[85%] bg-white text-surface-800'
                    }
                  `}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>

                  {!isUser && msg.source && (
                    <SourceCitation source={msg.source} />
                  )}

                  {!isUser && (
                    <FeedbackButtons
                      messageId={msg.id}
                      feedback={msg.feedback}
                      onRate={onRate}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {loading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {suggestedQuestions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 sm:px-6">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestedClick(q)}
                className="shrink-0 cursor-pointer rounded-full bg-primary-50 px-4 py-2 text-sm text-primary-700 transition hover:bg-primary-100"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-surface-100 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              className="flex-1 rounded-full border border-surface-200 bg-surface-50 px-5 py-3 text-sm text-surface-800 placeholder-surface-400 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white shadow transition
                ${
                  !input.trim() || loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-primary-600 active:scale-95'
                }
              `}
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
