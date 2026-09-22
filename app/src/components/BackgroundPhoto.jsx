export default function BackgroundPhoto({ url, ready }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#151210' }}>
      {ready && (
        <img
          src={url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
