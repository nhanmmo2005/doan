// client/src/components/FeedPostCard.jsx
import { useMemo, useState } from "react";
import PostItem from "./PostItem";
import Lightbox from "./Lightbox";

function MediaGrid({ media, onOpen }) {
  const images = (media || []).filter((m) => m.mediaType === "image");
  const videos = (media || []).filter((m) => m.mediaType === "video");

  if (!media || media.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      {/* Videos inline */}
      {videos.map((v, idx) => (
        <div
          key={`v-${idx}`}
          style={{
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            marginBottom: 10,
            background: "#fff",
          }}
        >
          <video controls style={{ width: "100%", display: "block", background: "#000" }}>
            <source src={v.url} />
          </video>
        </div>
      ))}

      {/* Images grid */}
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 6,
            gridTemplateColumns: images.length === 1 ? "1fr" : "1fr 1fr",
          }}
        >
          {images.slice(0, 4).map((img, idx) => {
            const isFourth = idx === 3 && images.length > 4;
            return (
              <button
                key={`i-${idx}`}
                type="button"
                onClick={() => onOpen(idx)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "#fff",
                }}
              >
                <img src={img.url} alt="" style={{ width: "100%", display: "block" }} />
                {isFourth && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.55)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 28,
                      fontWeight: 900,
                    }}
                  >
                    +{images.length - 4}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FeedPostCard({ post, onLike, onChanged, autoOpenComments = false }) {
  const media = Array.isArray(post.media) ? post.media : [];
  const fallback = post.image_url
    ? [{ mediaType: "image", url: post.image_url, sortOrder: 0 }]
    : [];

  const items = useMemo(() => (media.length ? media : fallback), [media, post.image_url]);

  const imageItems = useMemo(() => items.filter((x) => x.mediaType === "image"), [items]);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  function openAt(i) {
    setLbIndex(i);
    setLbOpen(true);
  }

  return (
    <>
      <PostItem
        post={post}
        onLike={onLike}
        onChanged={onChanged}
        autoOpenComments={autoOpenComments}
      >
        <MediaGrid media={items} onOpen={openAt} />
      </PostItem>

      <Lightbox
        open={lbOpen}
        items={imageItems}
        index={lbIndex}
        onClose={() => setLbOpen(false)}
        onPrev={() => setLbIndex((x) => (x - 1 + imageItems.length) % imageItems.length)}
        onNext={() => setLbIndex((x) => (x + 1) % imageItems.length)}
      />
    </>
  );
}
