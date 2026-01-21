import Button from "./ui/Button";

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
        <Button className="lb-close" variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Button>

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
            <Button className="lb-btn lb-prev" variant="ghost" size="sm" onClick={onPrev}>←</Button>
            <div className="lb-count">{index + 1}/{items.length}</div>
            <Button className="lb-btn lb-next" variant="ghost" size="sm" onClick={onNext}>→</Button>
          </div>
        )}
      </div>
    </div>
  );
}
