export default function Lightbox({ open, items = [], index = 0, onClose, onPrev, onNext }) {
  if (!open || !items.length) return null;

  const it = items[index] || items[0];
  const isVideo = it?.mediaType === "video";

  function onKeyDown(e) {
    if (e.key === "Escape") onClose?.();
    if (e.key === "ArrowLeft") onPrev?.();
    if (e.key === "ArrowRight") onNext?.();
  }

  return (
    <div className="lb-backdrop" onKeyDown={onKeyDown} tabIndex={-1}>
      <div className="lb-modal">
        <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="lb-body">
          {isVideo ? (
            <video className="lb-media" controls>
              <source src={it.url} />
            </video>
          ) : (
            <img className="lb-media" src={it.url} alt="" />
          )}
        </div>

        {items.length > 1 && (
          <div className="lb-nav">
            <button className="lb-btn" onClick={onPrev}>←</button>
            <div className="lb-count">{index + 1}/{items.length}</div>
            <button className="lb-btn" onClick={onNext}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}
