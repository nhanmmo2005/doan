// client/src/pages/ChatPage.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Lightbox from "../components/Lightbox";
import { http } from "../api/http";
import { getUser } from "../auth";
import { uploadMedia } from "../api/upload";
import {
  FaComments,
  FaPaperPlane,
  FaImage,
  FaTrash,
  FaPlus,
  FaEllipsisV,
} from "react-icons/fa";
import Button from "../components/ui/Button";

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function fmtDateTime(ts) {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Hôm nay lúc ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (days === 1) {
      return `Hôm qua lúc ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return d.toLocaleString("vi-VN");
    }
  } catch {
    return "";
  }
}

function ChatRoomListItem({ room, isActive, onClick }) {
  return (
    <div
      className={`chat-room-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="chat-room-icon">
        <FaComments />
      </div>
      <div className="chat-room-info">
        <div className="chat-room-name">{room.name}</div>
        {room.description && (
          <div className="chat-room-desc">{room.description}</div>
        )}
        {room.message_count > 0 && (
          <div className="chat-room-meta">
            {room.message_count} tin nhắn
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessage({ message, onDelete, canDelete, onImageClick }) {
  const me = getUser();
  const isMe = me && me.id === message.user_id;
  const avatarChar = (message.author_name?.[0] || "U").toUpperCase();

  return (
    <div className={`chat-message ${isMe ? "chat-message-me" : ""}`}>
      {!isMe && (
        <Link to={`/users/${message.user_id}`} className="chat-avatar" title={message.author_name}>
          {message.author_avatar ? (
            <img src={message.author_avatar} alt={message.author_name} />
          ) : (
            <span>{avatarChar}</span>
          )}
        </Link>
      )}

      <div className="chat-message-content">
        {!isMe && (
          <div className="chat-message-author">{message.author_name}</div>
        )}

        <div className="chat-message-bubble">
          {message.content && <div className="chat-message-text">{message.content}</div>}
          
          {message.media_url && (
            <div className="chat-message-media">
              {message.media_type === "image" ? (
                <img 
                  src={message.media_url} 
                  alt="" 
                  onClick={() => onImageClick?.(message.media_url)} 
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <video controls src={message.media_url} style={{ maxWidth: "100%" }} />
              )}
            </div>
          )}

          <div className="chat-message-time">{fmtTime(message.created_at)}</div>
        </div>

        {canDelete && (
          <Button
            type="button"
            className="chat-message-delete"
            variant="danger"
            size="sm"
            onClick={() => onDelete(message.id)}
            title="Xoá tin nhắn"
          >
            <FaTrash />
          </Button>
        )}
      </div>
    </div>
  );
}

function ChatWindow({ roomId, onRoomChange }) {
  const me = getUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [err, setErr] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadMessages() {
    if (!roomId) return;
    setErr("");
    try {
      setLoading(true);
      const res = await http.get(`/api/chat/rooms/${roomId}/messages`);
      setMessages(res.data || []);
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tải tin nhắn thất bại");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (roomId) {
      loadMessages();
      
      // Poll for new messages every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        loadMessages();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !mediaFile) return;

    setErr("");
    try {
      setSending(true);

      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const uploaded = await uploadMedia([mediaFile]);
        if (uploaded && uploaded.length > 0) {
          mediaUrl = uploaded[0].url;
          mediaType = uploaded[0].mediaType;
        }
      }

      await http.post(`/api/chat/rooms/${roomId}/messages`, {
        content: text.trim() || "",
        mediaUrl,
        mediaType,
      });

      setText("");
      setMediaFile(null);
      setMediaPreview(null);
      await loadMessages();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Gửi tin nhắn thất bại");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId) {
    if (!confirm("Xoá tin nhắn này?")) return;
    try {
      await http.delete(`/api/chat/rooms/${roomId}/messages/${messageId}`);
      await loadMessages();
    } catch (e) {
      alert(e?.response?.data?.msg || "Xoá thất bại");
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setMediaFile(file);
      if (file.type.startsWith("image/")) {
        setMediaPreview(URL.createObjectURL(file));
      }
    } else {
      alert("Chỉ chấp nhận file ảnh hoặc video");
    }
  }

  if (!roomId) {
    return (
      <div className="chat-window chat-window-empty">
        <FaComments style={{ fontSize: 64, color: "var(--muted)", marginBottom: 16 }} />
        <p style={{ color: "var(--muted)" }}>Chọn phòng chat để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {err && <div className="err" style={{ margin: 12 }}>{err}</div>}

      <div className="chat-messages">
        {loading && messages.length === 0 ? (
          <div className="chat-loading">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onDelete={handleDelete}
              canDelete={me && (me.id === msg.user_id || me.role === "admin")}
              onImageClick={(url) => {
                setLightboxImage(url);
                setLightboxOpen(true);
              }}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          items={[{ url: lightboxImage, mediaType: "image" }]}
          index={0}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => {}}
          onNext={() => {}}
        />
      )}

      {me && (
        <form className="chat-input-form" onSubmit={handleSend}>
          {mediaPreview && (
            <div className="chat-media-preview">
              <img src={mediaPreview} alt="Preview" />
              <Button
                type="button"
                className="chat-media-remove"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
              >
                ×
              </Button>
            </div>
          )}

          <div className="chat-input-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <Button
              type="button"
              className="chat-attach-btn"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Gửi ảnh/video"
            >
              <FaImage />
            </Button>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="chat-text-input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />

            <Button
              type="submit"
              className="chat-send-btn"
              variant="primary"
              size="sm"
              disabled={sending || (!text.trim() && !mediaFile)}
              title="Gửi (Enter)"
            >
              <FaPaperPlane />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ChatPage() {
  const me = getUser();
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setErr("");
    try {
      setLoading(true);
      const res = await http.get("/api/chat/rooms");
      setRooms(res.data || []);
      
      // Auto-select first room if none selected
      if (!selectedRoomId && res.data && res.data.length > 0) {
        setSelectedRoomId(res.data[0].id);
      }
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tải danh sách phòng chat thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function createRoom(payload) {
    try {
      await http.post("/api/chat/rooms", payload);
      await loadRooms();
      setShowCreateRoom(false);
    } catch (e) {
      alert(e?.response?.data?.msg || "Tạo phòng chat thất bại");
      throw e;
    }
  }

  if (!me) {
    return (
      <AppLayout>
        <div className="feed-wrap col">
          <div className="err">Vui lòng đăng nhập để sử dụng chat</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="chat-page">
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 1000 }}>
              <FaComments style={{ marginRight: 8, color: "var(--primary)" }} />
              Chat cộng đồng
            </h2>
            {(me.role === "admin" || true) && ( // Allow all users to create rooms for now
              <Button
                type="button"
                className="chat-create-btn"
                variant="primary"
                size="sm"
                onClick={() => setShowCreateRoom(!showCreateRoom)}
                title="Tạo phòng chat mới"
              >
                <FaPlus />
              </Button>
            )}
          </div>

          {showCreateRoom && (
            <CreateRoomForm
              onSubmit={createRoom}
              onCancel={() => setShowCreateRoom(false)}
            />
          )}

          {loading && <div className="pill" style={{ margin: 12 }}>Đang tải...</div>}

          {err && <div className="err" style={{ margin: 12 }}>{err}</div>}

          {!loading && rooms.length === 0 && (
            <div className="chat-empty-rooms">
              <p>Chưa có phòng chat nào</p>
            </div>
          )}

          <div className="chat-room-list">
            {rooms.map((room) => (
              <ChatRoomListItem
                key={room.id}
                room={room}
                isActive={selectedRoomId === room.id}
                onClick={() => setSelectedRoomId(room.id)}
              />
            ))}
          </div>
        </div>

        <ChatWindow roomId={selectedRoomId} onRoomChange={loadRooms} />
      </div>
    </AppLayout>
  );
}

function CreateRoomForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert("Bạn chưa nhập tên phòng chat");

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        topic: null,
      });
      setName("");
      setDescription("");
    } catch (e) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-create-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên phòng chat *"
        style={{ width: "100%", marginBottom: 8 }}
        maxLength={255}
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Mô tả (tùy chọn)"
        rows={2}
        style={{ width: "100%", marginBottom: 8, resize: "vertical" }}
        maxLength={500}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <Button type="button" className="chip" variant="secondary" size="sm" onClick={onCancel} style={{ flex: 1 }}>
          Huỷ
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Đang tạo..." : "Tạo"}
        </Button>
      </div>
    </div>
  );
}
