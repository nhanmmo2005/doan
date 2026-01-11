import PostItem from "./PostItem";
import { useMemo, useState } from "react";
import Lightbox from "./Lightbox";

function MediaBlock({ items, onOpenImage }) {
  if (!items?.length) return null;

  const videos = items.filter((m) => m.mediaType === "video");
  const images = items.filter((m) => m.mediaType === "image");

  return (
    <div className="post-media">
      {/* video inline */}
      {videos.map((v, idx) => (
        <div className="post-video" key={`v-${idx}`}>
          <video controls preload="metadata">
            <source src={v.url} />
          </video>
        </div>
      ))}

      {/* image grid */}
      {images.length > 0 && (
        <div
          className={[
            "post-img-grid",
            images.length === 1 ? "g1" : "",
            images.length === 2 ? "g2" : "",
            images.length === 3 ? "g3" : "",
            images.length >= 4 ? "g4" : "",
          ].join(" ")}
        >
          {images.slice(0, 4).map((img, i) => {
            const more = i === 3 && images.length > 4;
            return (
              <button
                key={`i-${i}`}
                type="button"
                className="img-tile"
                onClick={() => onOpenImage(i)}
              >
                <img src={img.url} alt="" />
                {more && <div className="img-more">+{images.length - 4}</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FeedPostCard({ post, onLike }) {
  const media = Array.isArray(post?.media) ? post.media : [];
  const fallback = post?.image_url ? [{ mediaType: "image", url: post.image_url, sortOrder: 0 }] : [];

  const items = useMemo(() => (media.length ? media : fallback), [media, post?.image_url]);

  const imagesOnly = useMemo(() => items.filter((x) => x.mediaType === "image"), [items]);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  function openImageAt(i) {
    if (!imagesOnly.length) return;
    const safe = Math.max(0, Math.min(i, imagesOnly.length - 1));
    setLbIndex(safe);
    setLbOpen(true);
  }

  return (
    <>
      <PostItem post={post} onLike={onLike}>
        <MediaBlock items={items} onOpenImage={openImageAt} />
      </PostItem>

      {imagesOnly.length > 0 && (
        <Lightbox
          open={lbOpen}
          items={imagesOnly}
          index={lbIndex}
          onClose={() => setLbOpen(false)}
          onPrev={() => setLbIndex((x) => (imagesOnly.length ? (x - 1 + imagesOnly.length) % imagesOnly.length : 0))}
          onNext={() => setLbIndex((x) => (imagesOnly.length ? (x + 1) % imagesOnly.length : 0))}
        />
      )}
    </>
  );
}
