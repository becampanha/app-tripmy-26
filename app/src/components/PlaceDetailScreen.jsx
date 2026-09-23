import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { AddCircleIcon } from '@solar-icons/react/linear/add-circle';
import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { PointOnMapIcon } from '@solar-icons/react/bold/point-on-map';
import { CalendarMarkIcon } from '@solar-icons/react/bold/calendar-mark';
import {
  fetchPlaces, createPlace, updatePlace, deletePlace, uploadPlacePhoto,
  searchGooglePlaces, importGooglePlacePhotos,
} from '../api/itineraryApi.js';
import { FieldLabel, inputStyle } from './DebouncedInput.jsx';
import Select from './Select.jsx';
import { useDragScroll } from '../hooks/useDragScroll.js';
import { useGeocode } from '../hooks/useGeocode.js';
import { usePlaceOccurrences } from '../hooks/usePlaceOccurrences.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { tagOptionsFor } from '../data/placeTagOptions.js';
import { getCachedPlaces, setCachedPlaces } from '../hooks/usePlacesScreenState.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Centros', 'Outlets', 'Shopping', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

const EDITABLE_FIELDS = [
  'name', 'category', 'subcategory', 'tag', 'address', 'rating', 'reviewLabel',
  'cost', 'hours', 'recommendation', 'menuLabel', 'googleMapsUri',
];

function placeFields(place) {
  const out = {};
  for (const f of EDITABLE_FIELDS) out[f] = place[f] ?? '';
  return out;
}

// Painel de busca no Google Places para o fluxo de criação de um novo
// lugar (rota /lugares/novo). Ao escolher um resultado, o pai monta o
// rascunho de edição já pré-preenchido com nome/endereço/avaliação/fotos.
function GoogleSearchPanel({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    try {
      const places = await searchGooglePlaces(query.trim());
      setResults(places);
    } finally {
      setSearching(false);
    }
  };

  const handlePick = async (place) => {
    if (importingId) return;
    setImportingId(place.id);
    try {
      const photos = await importGooglePlacePhotos(place.id).catch(() => ({ photo: null, dishPhotos: [], recommendation: null }));
      onSelect({
        id: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        rating: place.rating ?? '',
        googleMapsUri: place.googleMapsUri || '',
        photo: photos.photo,
        dishPhotos: photos.dishPhotos || [],
        recommendation: photos.recommendation,
      });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div style={{ padding: '20px 22px' }}>
      <div style={{ color: '#1c1a17', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Novo lugar</div>
      <div style={{ color: '#9a9186', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
        Busque o lugar no Google para preencher os dados automaticamente.
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            borderRadius: 12,
            border: '1px solid #ececec',
            background: '#fff',
          }}
        >
          <MagnifierIcon size={14} color="#b3ab9c" style={{ flex: 'none' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do lugar"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: '#1c1a17', fontSize: 13, fontWeight: 600 }}
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          style={{
            flex: 'none',
            padding: '0 18px',
            borderRadius: 12,
            border: 0,
            background: '#1c1a17',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: searching ? 'default' : 'pointer',
            opacity: searching ? 0.7 : 1,
          }}
        >
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {results && results.length === 0 && (
        <div style={{ marginTop: 20, textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
          Nenhum resultado encontrado.
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {results.map((place) => (
            <div
              key={place.id}
              onClick={() => handlePick(place)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: 14,
                border: '1px solid #ececec',
                cursor: importingId ? 'default' : 'pointer',
                opacity: importingId && importingId !== place.id ? 0.5 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#1c1a17', fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>
                  {place.displayName?.text}
                </div>
                <div style={{ color: '#9a9186', fontSize: 12, fontWeight: 500, marginTop: 2, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {place.formattedAddress}
                </div>
              </div>
              {importingId === place.id && (
                <div style={{ flex: 'none', color: '#9a9186', fontSize: 12, fontWeight: 700 }}>Importando...</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  const isNew = id === undefined;
  const navigate = useNavigate();
  const cachedPlace = useMemo(() => {
    if (isNew) return null;
    const cached = getCachedPlaces();
    return cached ? cached.find((p) => p.id === id) || null : null;
  }, [id, isNew]);
  const [place, setPlace] = useState(cachedPlace);
  const [loading, setLoading] = useState(!isNew && cachedPlace === null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  // Enquanto editing=true, os campos de texto/número só mexem neste estado
  // local — nada de PUT a cada tecla. Só ao clicar Salvar (handleSave) é que
  // manda pra API, e só os campos que de fato mudaram. No fluxo de criação
  // (isNew), draft nasce assim que um resultado do Google é escolhido — ver
  // handleGooglePick — e o formulário sempre aparece "em edição".
  const [draft, setDraft] = useState(null);
  // Fotos escolhidas automaticamente do Google no fluxo de criação — fora de
  // EDITABLE_FIELDS (não fazem parte do diff do handleSave), mas precisam
  // ser state (não ref) para aparecer no carrossel assim que definidas.
  const [newPlacePhotos, setNewPlacePhotos] = useState({ id: null, photo: null, dishPhotos: [] });
  const originalRef = useRef(null);
  const { scrollerRef: dishScrollerRef, dragHandlers: dishDragHandlers } = useDragScroll();
  const coords = useGeocode(place?.address ?? draft?.address);
  const occurrences = usePlaceOccurrences(id);

  const reload = (silent) => {
    if (!silent) setLoading(true);
    return fetchPlaces()
      .then((places) => {
        setCachedPlaces(places);
        setPlace(places.find((p) => p.id === id) || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isNew) return;
    reload(cachedPlace !== null);
  }, [id]);

  const dishPhotos = isNew ? newPlacePhotos.dishPhotos : place ? place.dishPhotos || [] : [];
  // Fotos do carrossel principal — hoje só a fachada, mas preparado pra crescer
  // (ex: quando o lugar tiver mais de uma foto de capa no futuro). No fluxo
  // de criação, vem da importação automática do Google, não de `place`.
  const mainPhotos = useMemo(() => {
    if (isNew) return newPlacePhotos.photo ? [newPlacePhotos.photo] : [];
    return place && place.photo ? [place.photo] : [];
  }, [place, isNew, newPlacePhotos.photo]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [id]);

  const goToPhoto = (delta) => {
    if (mainPhotos.length === 0) return;
    setPhotoIndex((i) => (i + delta + mainPhotos.length) % mainPhotos.length);
  };

  // Upload de foto é uma ação imediata (escolher arquivo já sobe pro Blob),
  // não faz sentido ficar "rascunhada" esperando o Salvar — continua
  // persistindo na hora, independente do draft dos campos de texto.
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

  // Chamado ao escolher um resultado da busca do Google no fluxo de criação:
  // monta o rascunho já preenchido (nome, endereço, avaliação, recomendação,
  // link do Maps), com categoria em branco para o usuário decidir.
  const handleGooglePick = (picked) => {
    setNewPlacePhotos({ id: picked.id, photo: picked.photo, dishPhotos: picked.dishPhotos });
    const snapshot = {
      name: picked.name,
      category: '',
      subcategory: '',
      tag: '',
      address: picked.address,
      rating: picked.rating,
      reviewLabel: '',
      cost: '',
      hours: '',
      recommendation: picked.recommendation || '',
      menuLabel: '',
      googleMapsUri: picked.googleMapsUri,
    };
    originalRef.current = snapshot;
    setDraft({ ...snapshot });
    setEditing(true);
  };

  const startEditing = () => {
    const snapshot = placeFields(place);
    originalRef.current = snapshot;
    setDraft({ ...snapshot });
    setEditing(true);
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/lugares');
      return;
    }
    setEditing(false);
    setDraft(null);
    originalRef.current = null;
  };

  const handleSave = async () => {
    if (isNew) {
      if (!draft.name.trim() || !draft.category.trim()) {
        return;
      }
      setSaving(true);
      try {
        const fields = {};
        for (const f of EDITABLE_FIELDS) {
          fields[f] = ['rating', 'cost'].includes(f) && draft[f] !== ''
            ? Number(draft[f])
            : draft[f] || null;
        }
        const { photo, dishPhotos, id: newId } = newPlacePhotos;
        const created = await createPlace({ id: newId, ...fields, photo, dishPhotos });
        const freshPlaces = await fetchPlaces();
        setCachedPlaces(freshPlaces);
        navigate(`/lugares/${created.id}`, { replace: true });
      } finally {
        setSaving(false);
      }
      return;
    }

    const original = originalRef.current;
    const changed = EDITABLE_FIELDS.some((f) => String(draft[f]) !== String(original[f]));
    setSaving(true);
    try {
      if (changed) {
        const fields = {};
        for (const f of EDITABLE_FIELDS) {
          fields[f] = ['rating', 'cost'].includes(f) && draft[f] !== ''
            ? Number(draft[f])
            : draft[f] || null;
        }
        await updatePlace(id, fields);
        await reload(true);
      }
      setEditing(false);
      setDraft(null);
      originalRef.current = null;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deletePlace(id);
    navigate('/lugares');
  };

  const setDraftField = (field) => (value) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  // Fluxo de criação, antes de escolher um resultado do Google: sem foto
  // pra mostrar ainda, então usa um cabeçalho simples (só botão voltar) em
  // vez da área de foto de 320px do fluxo normal de visualizar/editar.
  if (isNew && !draft) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box', paddingBottom: 40 }}>
        <div style={{ padding: '18px 22px 0' }}>
          <div
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: '#f9f7f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AltArrowLeftIcon size={20} color="#1c1a17" />
          </div>
        </div>
        <GoogleSearchPanel onSelect={handleGooglePick} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box', paddingBottom: 120 }}>
      <div style={{ position: 'relative', width: '100%', height: 320, background: '#eee9df', overflow: 'hidden' }}>
        {!loading && mainPhotos[photoIndex] && (
          <img
            src={mainPhotos[photoIndex]}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Zonas de clique para navegar o carrossel: esquerda volta, direita avança, com loop */}
        {mainPhotos.length > 1 && (
          <>
            <div
              onClick={() => goToPhoto(-1)}
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 1, cursor: 'pointer' }}
            />
            <div
              onClick={() => goToPhoto(1)}
              style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 1, cursor: 'pointer' }}
            />
          </>
        )}

        {mainPhotos.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 34,
              right: 14,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            {photoIndex + 1}/{mainPhotos.length}
          </div>
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
            background: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
            zIndex: 2,
          }}
        >
          <AltArrowLeftIcon size={20} color="#fff" />
        </div>

        {(place || isNew) && (
          <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 8, zIndex: 2 }}>
            {editing && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCancel}
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 19,
                  background: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
                }}
              >
                <CloseIcon size={15} color="#fff" />
                <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Cancelar</span>
              </div>
            )}

            <div
              onClick={() => {
                if (saving) return;
                editing ? handleSave() : startEditing();
              }}
              style={{
                height: 38,
                padding: editing ? '0 14px' : 0,
                width: editing ? 'auto' : 38,
                borderRadius: 19,
                background: editing ? '#1c1a17' : 'rgba(255,255,255,0.22)',
                backdropFilter: editing ? undefined : 'blur(10px)',
                WebkitBackdropFilter: editing ? undefined : 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
              }}
            >
              {editing ? (
                <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>{saving ? 'Salvando...' : 'Salvar'}</span>
              ) : (
                <PenIcon size={17} color="#fff" />
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

        {/* Barra branca sobreposta à base da foto, com cantos superiores
            arredondados — cria o efeito de "moldura subindo por cima da
            imagem" sem depender de recortes/gradientes no elemento seguinte. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 24,
            background: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            zIndex: 2,
          }}
        />
      </div>

      <div style={{ position: 'relative', background: '#fff' }}>
        <div style={{ padding: '10px 22px 20px' }}>
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
        ) : !place && !isNew ? (
          <div style={{ color: '#9a9186', fontSize: 15, fontWeight: 600 }}>Lugar não encontrado.</div>
        ) : editing && draft ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <FieldLabel>Nome</FieldLabel>
              <input value={draft.name || ''} onChange={(e) => setDraftField('name')(e.target.value)} style={{ ...inputStyle, marginTop: 3, fontSize: 16, fontWeight: 700 }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Categoria</FieldLabel>
                <div style={{ marginTop: 3 }}>
                  <Select
                    label="Categoria"
                    placeholder="Selecione"
                    value={draft.category || ''}
                    onChange={(value) => setDraft((d) => ({ ...d, category: value, tag: '' }))}
                    options={CATEGORIES}
                    fullWidth
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Tag</FieldLabel>
                <div style={{ marginTop: 3 }}>
                  <Select
                    label="Tag"
                    placeholder={draft.category ? 'Selecione' : 'Escolha a categoria'}
                    value={draft.tag || ''}
                    onChange={setDraftField('tag')}
                    options={tagOptionsFor(draft.category)}
                    fullWidth
                  />
                </div>
              </div>
            </div>

            {subcategoriesFor(draft.category).length > 0 && (
              <div>
                <FieldLabel>Subcategoria</FieldLabel>
                <div style={{ marginTop: 3 }}>
                  <Select
                    label="Subcategoria"
                    placeholder="Nenhuma"
                    value={draft.subcategory || ''}
                    onChange={setDraftField('subcategory')}
                    options={subcategoriesFor(draft.category)}
                    fullWidth
                  />
                </div>
              </div>
            )}

            <div>
              <FieldLabel>Endereço</FieldLabel>
              <input value={draft.address || ''} onChange={(e) => setDraftField('address')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Avaliação (nota)</FieldLabel>
                <input value={draft.rating ?? ''} onChange={(e) => setDraftField('rating')(e.target.value)} type="number" step="0.1" style={{ ...inputStyle, marginTop: 3 }} />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Avaliação (rótulo)</FieldLabel>
                <input value={draft.reviewLabel || ''} onChange={(e) => setDraftField('reviewLabel')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} placeholder="ex: 4.6 ★★★★★" />
              </div>
            </div>

            <div>
              <FieldLabel>Custo médio (US$)</FieldLabel>
              <input value={draft.cost ?? ''} onChange={(e) => setDraftField('cost')(e.target.value)} type="number" style={{ ...inputStyle, marginTop: 3 }} />
            </div>

            <div>
              <FieldLabel>Horário</FieldLabel>
              <input value={draft.hours || ''} onChange={(e) => setDraftField('hours')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} placeholder="ex: 11h-22h" />
            </div>

            <div>
              <FieldLabel>Recomendação</FieldLabel>
              <input value={draft.recommendation || ''} onChange={(e) => setDraftField('recommendation')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} />
            </div>

            <div>
              <FieldLabel>Fotos do lugar</FieldLabel>
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
              <input value={draft.menuLabel || ''} onChange={(e) => setDraftField('menuLabel')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} placeholder="ex: Ver menu" />
            </div>

            <div>
              <FieldLabel>Link do Google Maps</FieldLabel>
              <input value={draft.googleMapsUri || ''} onChange={(e) => setDraftField('googleMapsUri')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} />
            </div>

            {!isNew && (
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
            )}
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

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 14,
                background: occurrences && occurrences.length > 0 ? '#eef6ee' : '#f9f7f2',
              }}
            >
              <CalendarMarkIcon
                size={16}
                color={occurrences && occurrences.length > 0 ? '#4d8a5c' : '#b3ab9c'}
                style={{ marginTop: 1, flex: 'none' }}
              />
              <div style={{ minWidth: 0 }}>
                {!occurrences ? (
                  <Skeleton width={120} height={13} />
                ) : occurrences.length === 0 ? (
                  <div style={{ color: '#9a9186', fontSize: 13, fontWeight: 600 }}>Fora do roteiro</div>
                ) : occurrences.length <= 3 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {occurrences.map((occ, i) => (
                      <div key={i} style={{ color: '#3f6b48', fontSize: 13, fontWeight: 600 }}>
                        {occ.date} ({occ.weekday}){occ.time ? ` · ${occ.time}` : ''}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#3f6b48', fontSize: 13, fontWeight: 600 }}>
                    No roteiro em {occurrences.length} horários
                  </div>
                )}
              </div>
            </div>

            {dishPhotos.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ borderTop: '1px solid #ececec', paddingTop: 16 }}>
                  <div style={{ color: '#9a9186', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Fotos do lugar
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

            {(place.reviewLabel || place.cost != null || place.hours) && (
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

            {coords && (
              <a
                href={place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  position: 'relative',
                  marginTop: 18,
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: '#eee9df',
                  height: 160,
                }}
              >
                <img
                  src={`/api/places/google?action=map&lat=${coords.lat}&lng=${coords.lng}&width=600&height=320`}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: '#1c1a17',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(28,26,23,0.35)',
                  }}
                >
                  <PointOnMapIcon size={19} color="#fff" />
                </div>
              </a>
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
