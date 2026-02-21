// client/src/pages/ChatPage.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
  FaFlag,
} from "react-icons/fa";
import Button from "../components/ui/Button";
import ReportModal from "../components/ReportModal";

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

function ChatMessage({ message, onDelete, canDelete, onImageClick, isFocused }) {
  const me = getUser();
  const isMe = me && me.id === message.user_id;
  const avatarChar = (message.author_name?.[0] || "U").toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  return (
    <div 
      id={`msg-${message.id}`} 
      className={`chat-message ${isMe ? "chat-message-me" : ""} ${isFocused ? "focused-highlight" : ""}`}
    >
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
          <div className="chat-message-author">
            {message.author_name}
            {isFocused && <span className="focus-badge">Nội dung bị báo cáo</span>}
          </div>
        )}
        {isMe && isFocused && (
          <div className="chat-message-author" style={{ textAlign: 'right' }}>
            <span className="focus-badge">Nội dung bị báo cáo</span>
          </div>
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

        {((me && me.id !== message.user_id) || canDelete) && (
          <div className="chat-message-ellipsis">
            <button
              type="button"
              className="btn-menu-trigger"
              onClick={() => setMenuOpen((v) => !v)}
              title="Tùy chọn"
            >
              <FaEllipsisV />
            </button>

            {menuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="menu" style={{ right: 0, left: "auto" }}>
                  {canDelete && (
                    <button
                      type="button"
                      className="menuItem danger"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(message.id);
                      }}
                    >
                      <span className="menuIcon"><FaTrash /></span>
                      <span>Xoá tin nhắn</span>
                    </button>
                  )}
                  {me && me.id !== message.user_id && (
                    <button
                      type="button"
                      className="menuItem"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowReport(true);
                      }}
                    >
                      <span className="menuIcon"><FaFlag /></span>
                      <span>Báo cáo</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          targetType="message"
          targetId={message.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function ChatWindow({ roomId, onRoomChange }) {
  const me = getUser();
  const loc = useLocation();
  const search = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const focusMessageId = search.get("focus_message");

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
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const isInitialLoad = useRef(true);

  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;
    
    // Nếu force=true hoặc user đang ở gần đáy (trong khoảng 150px)
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
    }
  };

  const scrollToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-flash");
      setTimeout(() => el.classList.remove("highlight-flash"), 3000);
    }
  };

  async function loadMessages() {
    if (!roomId) return;
    try {
      if (isInitialLoad.current) setLoading(true);
      const res = await http.get(`/api/chat/rooms/${roomId}/messages`);
      const newMessages = res.data || [];
      
      setMessages(newMessages);

      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
        
        // Sau khi load lần đầu, nếu có focus_message thì nhảy tới đó, không thì xuống đáy
        setTimeout(() => {
          if (focusMessageId) {
            scrollToMessage(focusMessageId);
          } else {
            scrollToBottom(true);
          }
        }, 120);
      } else {
        // Các lần poll sau, chỉ cuộn nếu đang ở đáy
        scrollToBottom();
      }
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tải tin nhắn thất bại");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (roomId) {
      isInitialLoad.current = true;
      loadMessages();
      
      pollingIntervalRef.current = setInterval(loadMessages, 3000);
      return () => clearInterval(pollingIntervalRef.current);
    }
  }, [roomId]);

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
      // Force scroll to bottom when I send a message
      setTimeout(() => scrollToBottom(true), 100);
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

      <div className="chat-messages" ref={chatContainerRef}>
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
              isFocused={focusMessageId && String(msg.id) === String(focusMessageId)}
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
  const loc = useLocation();
  const search = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const roomFromUrl = search.get("room");

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  async function loadRooms() {
    setErr("");
    try {
      setLoading(true);
      const res = await http.get("/api/chat/rooms");
      const roomList = res.data || [];
      setRooms(roomList);
      
      // Ưu tiên chọn room từ URL
      if (roomFromUrl) {
        const found = roomList.find(r => r.id === Number(roomFromUrl));
        if (found) {
          setSelectedRoomId(found.id);
        } else if (roomList.length > 0) {
          setSelectedRoomId(roomList[0].id);
        }
      } else if (!selectedRoomId && roomList.length > 0) {
        setSelectedRoomId(roomList[0].id);
      }
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tải danh sách phòng chat thất bại");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomFromUrl]);

  async function createRoom(payload) {
    try {
      const res = await http.post("/api/chat/rooms", payload);
      if (res.data?.status === "pending") {
        alert(res.data.msg || "Phòng chat đã được tạo và đang chờ admin duyệt.");
      } else {
        await loadRooms();
        if (res.data?.id) setSelectedRoomId(res.data.id);
      }
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
                style={{ padding: 0, display: "grid", placeItems: "center" }}
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
