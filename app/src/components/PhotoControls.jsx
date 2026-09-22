import { useRef, useState } from 'react';

const CREDIT_NAME = 'Nicholas Fuentes';
const CREDIT_HREF = 'https://unsplash.com/@nickfuentes_?utm_source=cronograma&utm_medium=referral';
const UNSPLASH_HREF = 'https://unsplash.com/?utm_source=cronograma&utm_medium=referral';

const buttonStyle = {
  border: 0,
  borderRadius: 6,
  padding: '5px 10px',
  background: 'rgba(0,0,0,0.55)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
  pointerEvents: 'auto',
};

// Sits above both the photo (z0) and the scroll container that slides the
// white panel over it (z1) so the upload button/credit stay clickable
// wherever they're visually placed on the photo, without blocking the
// day-tab / scroll gestures elsewhere in that same screen region — the
// wrapper itself is click-through (pointer-events:none) and only the
// actual controls opt back in.
export default function PhotoControls({ isCustom, upload, reset }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          pointerEvents: 'auto',
          outline: dragOver ? '2px solid #c96442' : 'none',
          outlineOffset: -2,
          background: dragOver ? 'rgba(201,100,66,0.10)' : 'transparent',
        }}
      >
        <button type="button" onClick={() => inputRef.current && inputRef.current.click()} style={{ ...buttonStyle, position: 'absolute', top: 8, right: 8 }}>
          {isCustom ? 'Trocar foto' : 'Adicionar foto'}
        </button>

        {isCustom && (
          <button type="button" onClick={reset} style={{ ...buttonStyle, position: 'absolute', top: 8, right: 108 }}>
            Remover
          </button>
        )}
      </div>

      {!isCustom && (
        <div
          style={{
            position: 'absolute',
            left: 6,
            bottom: 6,
            padding: '3px 7px',
            borderRadius: 5,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 10,
            backdropFilter: 'blur(6px)',
            pointerEvents: 'auto',
          }}
        >
          Photo by{' '}
          <a href={CREDIT_HREF} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            {CREDIT_NAME}
          </a>{' '}
          on{' '}
          <a href={UNSPLASH_HREF} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            Unsplash
          </a>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        hidden
        onChange={(e) => {
          const file = e.target.files && e.target.files[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
