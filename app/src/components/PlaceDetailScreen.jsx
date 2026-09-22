import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { AddCircleIcon } from '@solar-icons/react/linear/add-circle';
import { fetchPlaces, updatePlace, deletePlace, uploadPlacePhoto } from '../api/itineraryApi.js';
import DebouncedInput, { FieldLabel } from './DebouncedInput.jsx';
import { useDragScroll } from '../hooks/useDragScroll.js';

const EDITABLE_FIELDS = [
  'name', 'category', 'tag', 'address', 'rating', 'reviewLabel',
  'cost', 'hours', 'distanceFromHotel', 'recommendation', 'menuLabel', 'googleMapsUri',
];

function placeFields(place) {
  const out = {};
  for (const f of EDITABLE_FIELDS) out[f] = place[f] ?? '';
  return out;
}

function Skeleton({ width, height, radius = 6, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: '#eee9df',
        animation: 'pulse 1.2s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export default function PlaceDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cancelToken, setCancelToken] = useState(0);
  const snapshotRef = useRef(null);
  const { scrollerRef: dishScrollerRef, dragHandlers: dishDragHandlers } = useDragScroll();

  const reload = (silent) => {
    if (!silent) setLoading(true);
    return fetchPlaces()
      .then((places) => setPlace(places.find((p) => p.id === id) || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [id]);

  const mainPhoto = place ? place.photo : null;
  const dishPhotos = place ? place.dishPhotos || [] : [];

  const patchPlace = async (fields) => {
    await updatePlace(id, fields);
    await reload(true);
  };

  const handleReplaceMainPhoto = async (file) => {
    if (!file) return;
    const { url } = await uploadPlacePhoto(file);
    await patchPlace({ photo: url });
  };

  const handleAddDishPhoto = async (file) => {
    if (!file) return;
    const { url } = await uploadPlacePhoto(file);
    await patchPlace({ dishPhotos: [...dishPhotos, url] });
  };

  const handleRemoveDishPhoto = async (index) => {
    const next = dishPhotos.filter((_, i) => i !== index);
    await patchPlace({ dishPhotos: next });
  };

  const startEditing = () => {
    snapshotRef.current = placeFields(place);
    setEditing(true);
  };

  const handleCancel = async () => {
    const snapshot = snapshotRef.current;
    if (!snapshot) {
      setEditing(false);
      return;
    }

    // Mata qualquer debounce pendente antes de sair do modo edição — precisa
    // de flushSync porque, se setEditing(false) fosse batched junto, os
    // inputs desmontariam no mesmo render sem o efeito de cancelamento
    // rodar, e o timer (setTimeout solto) dispararia depois.
    flushSync(() => {
      setCancelToken((t) => t + 1);
    });
    setEditing(false);

    // Lê o estado fresco da API em vez do `place` capturado no closure —
    // pode estar desatualizado em relação ao banco.
    const freshPlaces = await fetchPlaces();
    const freshPlace = freshPlaces.find((p) => p.id === id);
    const current = placeFields(freshPlace);
    const changed = EDITABLE_FIELDS.some((f) => String(current[f]) !== String(snapshot[f]));
    if (changed) {
      const restore = {};
      for (const f of EDITABLE_FIELDS) {
        restore[f] = ['rating', 'cost', 'distanceFromHotel'].includes(f) && snapshot[f] !== ''
          ? Number(snapshot[f])
          : snapshot[f] || null;
      }
      await updatePlace(id, restore);
      await reload(true);
    }

    snapshotRef.current = null;
  };

  const handleDelete = async () => {
    await deletePlace(id);
    navigate('/lugares');
  };

  const numericCommit = (field) => (value) => {
    patchPlace({ [field]: value === '' ? null : Number(value) });
  };
  const textCommit = (field) => (value) => {
    patchPlace({ [field]: value === '' ? null : value });
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box', paddingBottom: 120 }}>
      <div style={{ position: 'relative', width: '100%', height: 320, background: '#eee9df', overflow: 'hidden' }}>
        {!loading && mainPhoto && (
          <img
            src={mainPhoto}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%)',
            pointerEvents: 'none',
          }}
        />

        <div
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            width: 38,
            height: 38,
            borderRadius: 19,
            background: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
            zIndex: 2,
          }}
        >
          <AltArrowLeftIcon size={20} color="#1c1a17" />
        </div>

        {place && (
          <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 8, zIndex: 2 }}>
            {editing && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCancel}
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 19,
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
                }}
              >
                <CloseIcon size={15} color="#1c1a17" />
                <span style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 700 }}>Cancelar</span>
              </div>
            )}

            <div
              onClick={() => (editing ? setEditing(false) : startEditing())}
              style={{
                height: 38,
                padding: editing ? '0 14px' : 0,
                width: editing ? 'auto' : 38,
                borderRadius: 19,
                background: editing ? '#1c1a17' : 'rgba(255,255,255,0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
              }}
            >
              {editing ? (
                <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Salvar</span>
              ) : (
                <PenIcon size={17} color="#1c1a17" />
              )}
            </div>
          </div>
        )}

        {editing && (
          <label
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 16,
              background: 'rgba(28,26,23,0.72)',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              zIndex: 2,
            }}
          >
            <CameraMinimalisticIcon size={17} color="#fff" />
            Trocar foto principal
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleReplaceMainPhoto(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      <div style={{ padding: '20px 22px' }}>
        {loading ? (
          <Skeleton width={90} height={22} radius={8} style={{ marginBottom: 10 }} />
        ) : !editing ? (
          <div
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(28,26,23,0.72)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            {place ? place.tag || place.category : ''}
          </div>
        ) : null}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Skeleton width={44} height={44} radius={12} />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height={22} />
              <Skeleton width="50%" height={13} style={{ marginTop: 6 }} />
            </div>
          </div>
        ) : !place ? (
          <div style={{ color: '#9a9186', fontSize: 15, fontWeight: 600 }}>Lugar não encontrado.</div>
        ) : editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <FieldLabel>Nome</FieldLabel>
              <DebouncedInput value={place.name || ''} onCommit={textCommit('name')} cancelToken={cancelToken} style={{ marginTop: 3, fontSize: 16, fontWeight: 700 }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Categoria</FieldLabel>
                <DebouncedInput value={place.category || ''} onCommit={textCommit('category')} cancelToken={cancelToken} style={{ marginTop: 3 }} />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Tag</FieldLabel>
                <DebouncedInput value={place.tag || ''} onCommit={textCommit('tag')} cancelToken={cancelToken} style={{ marginTop: 3 }} placeholder="ex: 🍕 Pizza" />
              </div>
            </div>

            <div>
              <FieldLabel>Endereço</FieldLabel>
              <DebouncedInput value={place.address || ''} onCommit={textCommit('address')} cancelToken={cancelToken} style={{ marginTop: 3 }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Avaliação (nota)</FieldLabel>
                <DebouncedInput value={place.rating ?? ''} onCommit={numericCommit('rating')} cancelToken={cancelToken} type="number" step="0.1" style={{ marginTop: 3 }} />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Avaliação (rótulo)</FieldLabel>
                <DebouncedInput value={place.reviewLabel || ''} onCommit={textCommit('reviewLabel')} cancelToken={cancelToken} style={{ marginTop: 3 }} placeholder="ex: 4.6 ★★★★★" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Custo médio (US$)</FieldLabel>
                <DebouncedInput value={place.cost ?? ''} onCommit={numericCommit('cost')} cancelToken={cancelToken} type="number" style={{ marginTop: 3 }} />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Distância do hotel (km)</FieldLabel>
                <DebouncedInput value={place.distanceFromHotel ?? ''} onCommit={numericCommit('distanceFromHotel')} cancelToken={cancelToken} type="number" step="0.1" style={{ marginTop: 3 }} />
              </div>
            </div>

            <div>
              <FieldLabel>Horário</FieldLabel>
              <DebouncedInput value={place.hours || ''} onCommit={textCommit('hours')} cancelToken={cancelToken} style={{ marginTop: 3 }} placeholder="ex: 11h-22h" />
            </div>

            <div>
              <FieldLabel>Recomendação</FieldLabel>
              <DebouncedInput value={place.recommendation || ''} onCommit={textCommit('recommendation')} cancelToken={cancelToken} style={{ marginTop: 3 }} />
            </div>

            <div>
              <FieldLabel>Fotos dos pratos</FieldLabel>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {dishPhotos.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden', background: '#eee9df' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div
                      onClick={() => handleRemoveDishPhoto(i)}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        background: '#b3453f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      }}
                    >
                      <CloseIcon size={12} color="#fff" />
                    </div>
                  </div>
                ))}

                <label
                  style={{
                    width: 72,
                    height: 72,
                    flex: 'none',
                    borderRadius: 14,
                    border: '1.5px dashed #dcd6ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <AddCircleIcon size={22} color="#b3ab9c" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAddDishPhoto(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div>
              <FieldLabel>Rótulo do menu</FieldLabel>
              <DebouncedInput value={place.menuLabel || ''} onCommit={textCommit('menuLabel')} cancelToken={cancelToken} style={{ marginTop: 3 }} placeholder="ex: Ver menu" />
            </div>

            <div>
              <FieldLabel>Link do Google Maps</FieldLabel>
              <DebouncedInput value={place.googleMapsUri || ''} onCommit={textCommit('googleMapsUri')} cancelToken={cancelToken} style={{ marginTop: 3 }} />
            </div>

            <div
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 10,
                padding: 14,
                borderRadius: 16,
                border: '1.5px solid rgba(179,69,63,0.35)',
                color: '#b3453f',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <TrashBinTrashIcon size={16} color="#b3453f" />
              Remover lugar
            </div>
          </div>
        ) : (
          <>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#1c1a17', fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
                {place.name}
              </div>
              <div style={{ color: '#9a9186', fontSize: 13, fontWeight: 500, marginTop: 3, lineHeight: 1.3 }}>
                {place.address}
              </div>
            </div>

            {dishPhotos.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ borderTop: '1px solid #ececec', paddingTop: 16 }}>
                  <div style={{ color: '#9a9186', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Pratos Principais
                  </div>

                  <div
                    ref={dishScrollerRef}
                    {...dishDragHandlers}
                    style={{ display: 'flex', gap: 10, marginTop: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', cursor: 'grab', userSelect: 'none' }}
                  >
                    {dishPhotos.map((src, i) => (
                      <div
                        key={i}
                        style={{
                          width: 144,
                          height: 144,
                          borderRadius: 20,
                          flex: 'none',
                          overflow: 'hidden',
                          background: '#eee9df',
                        }}
                      >
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(place.reviewLabel || place.cost != null || place.distanceFromHotel != null || place.hours) && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginTop: 16,
                }}
              >
                {place.reviewLabel && <InfoPill label={place.reviewLabel} />}
                {place.cost != null && <InfoPill label={`💵 US$ ${place.cost}`} />}
                {place.distanceFromHotel != null && <InfoPill label={`📍 ${place.distanceFromHotel} km do hotel`} />}
                {place.hours && <InfoPill label={`🕒 ${place.hours}`} />}
              </div>
            )}

            {place.recommendation && (
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 16,
                  background: '#fff',
                  border: '1px solid #ececec',
                }}
              >
                <div style={{ color: '#9a9186', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  Recomendação
                </div>
                <div style={{ color: '#1c1a17', fontSize: 14.5, fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>
                  {place.recommendation}
                </div>
              </div>
            )}

            {place.menuLabel && (
              <div
                style={{
                  marginTop: 16,
                  padding: '14px 18px',
                  borderRadius: 16,
                  background: '#f9f7f2',
                  border: '1px solid #ececec',
                  color: '#1c1a17',
                  fontSize: 14.5,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                🍽️ {place.menuLabel}
              </div>
            )}

            {place.googleMapsUri && (
              <a
                href={place.googleMapsUri}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  marginTop: 16,
                  padding: '14px 18px',
                  borderRadius: 16,
                  background: '#1c1a17',
                  color: '#fff',
                  fontSize: 14.5,
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Ver no Google Maps
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoPill({ label }) {
  return (
    <div
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        background: '#fff',
        border: '1px solid #ececec',
        color: '#1c1a17',
        fontSize: 12.5,
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  );
}
