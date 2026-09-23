import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { AddCircleIcon } from '@solar-icons/react/linear/add-circle';
import { AddIcon } from '@solar-icons/react/linear/add';
import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { PointOnMapIcon } from '@solar-icons/react/bold/point-on-map';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { AltArrowDownIcon } from '@solar-icons/react/linear/alt-arrow-down';
import { AltArrowUpIcon } from '@solar-icons/react/linear/alt-arrow-up';
import {
  fetchPlaces, createPlace, updatePlace, deletePlace, uploadPlacePhoto,
  searchGooglePlaces, importGooglePlacePhotos,
  createRecommendation,
} from '../api/itineraryApi.js';
import { FieldLabel, inputStyle } from './DebouncedInput.jsx';
import Select from './Select.jsx';
import RecommendationModal from './RecommendationModal.jsx';
import { useGeocode } from '../hooks/useGeocode.js';
import { usePlaceOccurrences } from '../hooks/usePlaceOccurrences.js';
import { usePlaceRecommendations } from '../hooks/usePlaceRecommendations.js';
import { useDragScroll } from '../hooks/useDragScroll.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { tagOptionsFor } from '../data/placeTagOptions.js';
import { getCachedPlaces, setCachedPlaces } from '../hooks/usePlacesScreenState.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Centros', 'Outlets', 'Shopping', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

const EDITABLE_FIELDS = [
  'name', 'category', 'subcategory', 'tag', 'address',
  'cost', 'hours', 'recommendation', 'googleMapsUri',
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
      <div style={{ color: '#1c1a17', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
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

// Carrossel do header: rola de verdade (arrastar com o dedo/mouse, com
// scroll-snap), mas um toque/clique sem arrasto abre a foto em tela cheia.
// A foto principal (fachada) sempre vem primeiro em `photos` — ver
// `allPhotos` no componente pai — então ela é sempre a capa inicial.
function PhotoCarousel({ photos, photoIndex, onIndexChange, onOpenLightbox }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex: photoIndex });
  const pressRef = useRef(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => onIndexChange(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onIndexChange]);

  // Embla já cuida do arrasto/física do carrossel — só precisamos distinguir
  // um toque simples (abre lightbox) de um arrasto, olhando o deslocamento
  // entre pointerdown e pointerup.
  const handlePointerDown = (e) => {
    pressRef.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = (e) => {
    const start = pressRef.current;
    pressRef.current = null;
    if (!start) return;
    const moved = Math.abs(e.clientX - start.x) > 6 || Math.abs(e.clientY - start.y) > 6;
    if (!moved) onOpenLightbox();
  };

  return (
    <div
      ref={emblaRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'grab' }}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {photos.map((src, i) => (
          <div key={i} style={{ flex: '0 0 100%', height: '100%', minWidth: 0 }}>
            <img
              src={src}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 34,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
            pointerEvents: 'none',
          }}
        >
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === photoIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>
      )}

      {photos.length > 1 && (
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
            pointerEvents: 'none',
          }}
        >
          {photoIndex + 1}/{photos.length}
        </div>
      )}
    </div>
  );
}

// Visualização em tela cheia de uma foto do carrossel, com o mesmo gesto de
// arrastar pra navegar entre fotos. Fecha pelo X ou arrastando pra baixo.
function PhotoLightbox({ photos, photoIndex, onIndexChange, onClose }) {
  // O Embla foi desenhado pra um único eixo de arrasto — aqui precisamos de
  // dois gestos concorrentes (arrastar horizontal navega entre fotos,
  // arrastar vertical fecha o lightbox), então mantemos o controle manual
  // já testado em vez de lutar contra o motor de drag do Embla.
  const scrollerRef = useRef(null);
  const dragRef = useRef(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = photoIndex * el.clientWidth;
  }, []);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== photoIndex) onIndexChange(i);
  };

  const startDrag = (x, y) => {
    dragRef.current = { startX: x, startY: y, startScroll: scrollerRef.current.scrollLeft, axis: null, moved: false };
  };
  // Mouse não gera scroll nativo por arrastar (diferente de touch, que o
  // navegador já rola sozinho via overflowX: auto) — quando o gesto é
  // identificado como horizontal E veio do mouse, movemos scrollLeft à mão.
  const moveDrag = (x, y, isMouse) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (!drag.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      drag.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      drag.moved = true;
    }
    if (drag.axis === 'y') setDragY(Math.max(0, dy));
    else if (drag.axis === 'x' && isMouse) scrollerRef.current.scrollLeft = drag.startScroll - dx;
  };
  const endDrag = () => {
    const moved = dragRef.current?.moved;
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
    dragRef.current = null;
    // Toque simples (sem arrastar), fora de uma foto (ver onClick da imagem,
    // que interrompe a propagação) — clicou no fundo preto, então fecha.
    if (!moved) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 50,
        background: `rgba(0,0,0,${Math.max(0.4, 1 - dragY / 300)})`,
      }}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY, false)}
        onTouchEnd={endDrag}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY, true)}
        onMouseUp={endDrag}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          overflowX: dragY > 0 ? 'hidden' : 'auto',
          scrollSnapType: 'x mandatory',
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform 0.2s' : 'none',
        }}
      >
        {photos.map((src, i) => (
          <div
            key={i}
            style={{
              flex: 'none',
              width: '100%',
              height: '100%',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={src} alt="" draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>

      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
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
        }}
      >
        <CloseIcon size={18} color="#fff" />
      </div>

      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === photoIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 18,
            padding: '4px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {photoIndex + 1}/{photos.length}
        </div>
      )}
    </div>
  );
}

// Mapa em tela cheia, aberto ao tocar no mapa estático da tela de detalhe.
// Iframe interativo real (arrastar, zoom) via proxy do Maps Embed (api ação
// "embed" — a chave do Google nunca chega ao client). Footer flutuante fixo
// com miniatura do lugar, ocupando toda a largura, imitando o "cartão de
// destino" que apps de mapa mostram embaixo ao focar um local.
function MapFullscreen({ coords, name, address, photo, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 50,
        background: '#eee9df',
      }}
    >
      <iframe
        title="Mapa"
        src={`https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY}&center=${coords.lat},${coords.lng}&zoom=16`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        loading="lazy"
      />

      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          width: 38,
          height: 38,
          borderRadius: 19,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
        }}
      >
        <AltArrowLeftIcon size={20} color="#1c1a17" />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 24px rgba(28,26,23,0.22)',
        }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 12, flex: 'none', overflow: 'hidden', background: '#eee9df' }}>
          {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#1c1a17', fontSize: 14, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ color: '#9a9186', fontSize: 12, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {address}
          </div>
        </div>
      </div>
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [itineraryExpanded, setItineraryExpanded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [recommendationModalOpen, setRecommendationModalOpen] = useState(false);
  const [openRecommendationPhoto, setOpenRecommendationPhoto] = useState(null);
  const rootRef = useRef(null);
  const originalRef = useRef(null);
  const coords = useGeocode(place?.address ?? draft?.address);
  const occurrences = usePlaceOccurrences(id);
  const recommendationsScroll = useDragScroll();

  // Controla o efeito parallax (foto fixa atrás do conteúdo) e o surgimento
  // da nav bar branca flutuante conforme a página rola. Cada tela é seu
  // próprio container com overflowY: auto (ver App.jsx) — não o window —
  // por isso subimos até o ancestral marcado com data-scroll-root.
  useEffect(() => {
    const scrollRoot = rootRef.current?.closest('[data-scroll-root]');
    if (!scrollRoot) return;
    const onScroll = () => setScrollY(scrollRoot.scrollTop);
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollRoot.removeEventListener('scroll', onScroll);
  }, []);

  const { recommendations, addRecommendation } = usePlaceRecommendations(!isNew ? id : null);

  const handlePublishRecommendation = async ({ description, photoFile }) => {
    let photo = null;
    if (photoFile) {
      const { url } = await uploadPlacePhoto(photoFile);
      photo = url;
    }
    const created = await createRecommendation({ placeId: id, description, photo });
    addRecommendation(created);
    setRecommendationModalOpen(false);
  };

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
  const facadePhoto = isNew ? newPlacePhotos.photo : place ? place.photo : null;
  // Carrossel do header: foto principal (fachada) seguida das demais fotos
  // do lugar, todas juntas — sem separar "foto de capa" de "fotos extras".
  const allPhotos = useMemo(() => {
    return [facadePhoto, ...dishPhotos].filter(Boolean);
  }, [facadePhoto, dishPhotos]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [id]);

  const goToPhoto = (delta) => {
    if (allPhotos.length === 0) return;
    setPhotoIndex((i) => (i + delta + allPhotos.length) % allPhotos.length);
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
  // monta o rascunho já preenchido (nome, endereço, recomendação, link do
  // Maps), com categoria em branco para o usuário decidir.
  const handleGooglePick = (picked) => {
    setNewPlacePhotos({ id: picked.id, photo: picked.photo, dishPhotos: picked.dishPhotos });
    const snapshot = {
      name: picked.name,
      category: '',
      subcategory: '',
      tag: '',
      address: picked.address,
      cost: '',
      hours: '',
      recommendation: picked.recommendation || '',
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
          fields[f] = f === 'cost' && draft[f] !== ''
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
          fields[f] = f === 'cost' && draft[f] !== ''
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

  const HEADER_HEIGHT = 320;
  // Nav bar branca aparece quando o scroll já "engoliu" quase toda a foto —
  // some 40px antes do fim pra não bater exatamente no limiar do parallax.
  const navBarVisible = scrollY > HEADER_HEIGHT - 40;

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box', paddingBottom: 40 }}>
      {/* Foto fixa atrás do conteúdo (efeito parallax): não rola junto com a
          página — o card de informações desliza por cima dela conforme o
          usuário arrasta a tela pra cima. */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          height: HEADER_HEIGHT,
          background: '#eee9df',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {!loading && allPhotos.length > 0 && (
          <PhotoCarousel
            photos={allPhotos}
            photoIndex={photoIndex}
            onIndexChange={setPhotoIndex}
            onOpenLightbox={() => setLightboxOpen(true)}
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

      {/* Nav bar branca flutuante: só some quando o scroll ainda não engoliu
          a foto — surge por cima dela assim que o conteúdo abaixo passa por
          trás dos botões de voltar/editar. */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          height: 76,
          background: '#fff',
          boxShadow: navBarVisible ? '0 2px 10px rgba(28,26,23,0.08)' : 'none',
          opacity: navBarVisible ? 1 : 0,
          transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Wrapper de largura travada (mesmo padrão da faixa mobile centralizada
          usado em toda a tela) — os botões usam left/right simples dentro
          dele, evitando cálculo de posição via calc() relativo ao viewport. */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          height: 0,
          zIndex: 2,
        }}
      >
        <div
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            width: 38,
            height: 38,
            borderRadius: 19,
            background: navBarVisible ? '#f9f7f2' : 'rgba(255,255,255,0.22)',
            backdropFilter: navBarVisible ? undefined : 'blur(10px)',
            WebkitBackdropFilter: navBarVisible ? undefined : 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: navBarVisible ? 'none' : '0 4px 12px rgba(28,26,23,0.18)',
            transition: 'background 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <AltArrowLeftIcon size={20} color={navBarVisible ? '#1c1a17' : '#fff'} />
        </div>

        {(place || isNew) && (
          <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 8 }}>
            {editing && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCancel}
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 19,
                  background: navBarVisible ? '#f9f7f2' : 'rgba(255,255,255,0.22)',
                  backdropFilter: navBarVisible ? undefined : 'blur(10px)',
                  WebkitBackdropFilter: navBarVisible ? undefined : 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: navBarVisible ? 'none' : '0 4px 12px rgba(28,26,23,0.18)',
                  transition: 'background 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <CloseIcon size={15} color={navBarVisible ? '#1c1a17' : '#fff'} />
                <span style={{ color: navBarVisible ? '#1c1a17' : '#fff', fontSize: 13.5, fontWeight: 700 }}>Cancelar</span>
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
                background: editing ? '#1c1a17' : navBarVisible ? '#f9f7f2' : 'rgba(255,255,255,0.22)',
                backdropFilter: editing || navBarVisible ? undefined : 'blur(10px)',
                WebkitBackdropFilter: editing || navBarVisible ? undefined : 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: editing || !navBarVisible ? '0 4px 12px rgba(28,26,23,0.18)' : 'none',
                transition: 'background 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {editing ? (
                <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>{saving ? 'Salvando...' : 'Salvar'}</span>
              ) : (
                <PenIcon size={17} color={navBarVisible ? '#1c1a17' : '#fff'} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Espaçador puramente estrutural: reserva a altura da foto fixa no
          fluxo do documento, mas nunca deve interceptar cliques — senão rouba
          o toque/arrasto do carrossel, que fica visualmente por trás dele. */}
      <div style={{ position: 'relative', height: HEADER_HEIGHT, zIndex: 0, pointerEvents: 'none' }}>
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
                <FieldLabel>Área</FieldLabel>
                <div style={{ marginTop: 3 }}>
                  <Select
                    label="Área"
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
              {place.recommendation && (
                <div style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 500, marginTop: 3, lineHeight: 1.35 }}>
                  {place.recommendation}
                </div>
              )}
            </div>

            {(place.tag || place.cost != null || place.hours) && (
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 16,
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {(() => {
                  const cards = [];
                  if (place.tag) {
                    const [emoji, ...rest] = place.tag.split(' ');
                    cards.push({ key: 'tag', icon: emoji, label: 'Tipo', value: rest.join(' ') || place.tag });
                  }
                  if (place.cost != null) cards.push({ key: 'cost', icon: '💵', label: 'Custo', value: `US$ ${place.cost}` });
                  if (place.hours) cards.push({ key: 'hours', icon: '🕒', label: 'Horário', value: place.hours });
                  return cards.map(({ key, ...card }) => <InfoCard key={key} {...card} />);
                })()}
              </div>
            )}

            {!isNew && (
              <div style={{ marginTop: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>
                    Recomendações
                  </div>
                  <div
                    onClick={() => setRecommendationModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}
                  >
                    <AddIcon size={16} color="#1c1a17" />
                    <span style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 700 }}>Criar</span>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {!recommendations ? (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        border: '1px solid #ececec',
                      }}
                    >
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="90%" height={12} style={{ marginTop: 8 }} />
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        border: '1px solid #ececec',
                        color: '#9a9186',
                        fontSize: 13.5,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      Nenhuma recomendação no momento.
                    </div>
                  ) : (
                    <div
                      ref={recommendationsScroll.scrollerRef}
                      {...recommendationsScroll.dragHandlers}
                      style={{
                        display: 'flex',
                        gap: 10,
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        cursor: 'grab',
                        userSelect: 'none',
                      }}
                    >
                      {recommendations.map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          recommendation={rec}
                          onOpen={() => {
                            if (recommendationsScroll.dragRef.current?.moved) return;
                            if (rec.photo) setOpenRecommendationPhoto(rec.photo);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <div>
                <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>
                  No roteiro
                </div>
                <div
                  style={{
                    marginTop: 10,
                    background: '#fff',
                    border: '1px solid #ececec',
                    borderRadius: 16,
                    padding: '4px 14px',
                  }}
                >
                  {!occurrences ? (
                    <div style={{ padding: '12px 0' }}>
                      <Skeleton width="100%" height={16} />
                    </div>
                  ) : (
                    <>
                      <InfoRow
                        label="No roteiro"
                        value={
                          occurrences.length > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              Sim <CheckCircleIcon size={15} color="#4d8a5c" />
                            </span>
                          ) : (
                            'Não'
                          )
                        }
                        isLast={occurrences.length === 0}
                      />
                      {occurrences.length > 0 && (
                        <div
                          onClick={() => setItineraryExpanded((v) => !v)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 0',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 700 }}>
                            Ver todos os dias
                          </span>
                          {itineraryExpanded ? (
                            <AltArrowUpIcon size={15} color="#1c1a17" />
                          ) : (
                            <AltArrowDownIcon size={15} color="#1c1a17" />
                          )}
                        </div>
                      )}
                      {itineraryExpanded && occurrences.length > 0 && (
                        <div style={{ paddingBottom: 12 }}>
                          {occurrences.map((occ, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: '12px 0',
                                borderTop: '1px solid #f2efe9',
                              }}
                            >
                              <span style={{ color: '#1c1a17', fontSize: 13, fontWeight: 700 }}>
                                {occ.date} ({occ.weekday})
                              </span>
                              <span style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 600 }}>
                                {occ.time || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {place.address && (
              <div style={{ marginTop: 22 }}>
                <div>
                  <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>
                    Endereço do local
                  </div>
                  <div style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>
                    {place.address}
                  </div>
                </div>
              </div>
            )}

            {coords && (
              <div
                onClick={() => setMapFullscreen(true)}
                style={{
                  display: 'block',
                  position: 'relative',
                  marginTop: 10,
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: '#eee9df',
                  height: 160,
                  cursor: 'pointer',
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

      {lightboxOpen && (
        <PhotoLightbox
          photos={allPhotos}
          photoIndex={photoIndex}
          onIndexChange={setPhotoIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {mapFullscreen && coords && (
        <MapFullscreen
          coords={coords}
          name={place?.name || draft?.name}
          address={place?.address || draft?.address}
          photo={facadePhoto}
          onClose={() => setMapFullscreen(false)}
        />
      )}

      {recommendationModalOpen && (
        <RecommendationModal
          onSubmit={handlePublishRecommendation}
          onClose={() => setRecommendationModalOpen(false)}
        />
      )}

      {openRecommendationPhoto && (
        <PhotoLightbox
          photos={[openRecommendationPhoto]}
          photoIndex={0}
          onIndexChange={() => {}}
          onClose={() => setOpenRecommendationPhoto(null)}
        />
      )}
    </div>
  );
}

// Card com ícone no topo, label em negrito e valor secundário embaixo —
// estilo "Where you'll sleep" do Airbnb. Usado para Tipo, Custo, Horário
// numa fileira com scroll horizontal.
function InfoCard({ icon, label, value }) {
  return (
    <div
      style={{
        flex: '0 0 auto',
        minWidth: 108,
        padding: 14,
        borderRadius: 16,
        border: '1px solid #ececec',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1 }}>{icon}</div>
      <div style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 800, marginTop: 10 }}>{label}</div>
      <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}


// Card no estilo "postagem": foto opcional, título, descrição e um rodapé
// com quem sugeriu + quando foi publicado.
// Mesmo padrão visual do PlaceCard (tela de Lugares): foto de fundo cheia,
// gradiente escuro na base, texto sobreposto no canto inferior esquerdo.
function RecommendationCard({ recommendation, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        position: 'relative',
        flex: '0 0 auto',
        width: 260,
        height: 220,
        borderRadius: 18,
        overflow: 'hidden',
        background: '#eee9df',
        cursor: recommendation.photo ? 'pointer' : 'default',
      }}
    >
      {recommendation.photo && (
        <img
          src={recommendation.photo}
          alt=""
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '65%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {recommendation.description && (
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 12,
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 700,
            lineHeight: 1.35,
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {recommendation.description}
        </div>
      )}
    </div>
  );
}

// Uma linha de "ficha técnica": rótulo à esquerda, valor à direita, com
// linha divisória embaixo — usado para Tipo, Custo, Horário etc.
function InfoRow({ label, value, isLast }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 0',
        borderBottom: isLast ? 'none' : '1px solid #ececec',
      }}
    >
      <span style={{ color: '#9a9186', fontSize: 13.5, fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

