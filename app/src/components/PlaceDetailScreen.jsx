import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'motion/react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { AddCircleIcon } from '@solar-icons/react/linear/add-circle';
import { AddCircleIcon as AddCircleBoldIcon } from '@solar-icons/react/bold/add-circle';
import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { PointOnMapIcon } from '@solar-icons/react/bold/point-on-map';
import { MapPointIcon } from '@solar-icons/react/bold/map-point';
import { DocumentTextIcon } from '@solar-icons/react/bold/document-text';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { AltArrowDownIcon } from '@solar-icons/react/linear/alt-arrow-down';
import { AltArrowUpIcon } from '@solar-icons/react/linear/alt-arrow-up';
import { StarIcon } from '@solar-icons/react/bold/star';
import {
  fetchPlaces, createPlace, updatePlace, deletePlace, uploadPlacePhoto,
  searchGooglePlaces, importGooglePlacePhotos,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  toggleFavoritePlace,
} from '../api/itineraryApi.js';
import { getTravelerIdentity } from '../hooks/useTravelerIdentity.js';
import RecommendationModal from './RecommendationModal.jsx';
import SinglePlaceMap from './SinglePlaceMap.jsx';
import RecommendationEditModal from './RecommendationEditModal.jsx';
import EditActionBar from './EditActionBar.jsx';
import { useGeocode } from '../hooks/useGeocode.js';
import { usePlaceOccurrences } from '../hooks/usePlaceOccurrences.js';
import { usePlaceRecommendations } from '../hooks/usePlaceRecommendations.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { tagOptionsFor } from '../data/placeTagOptions.js';
import { getCachedPlaces, setCachedPlaces, getCachedPlace, setCachedPlace } from '../hooks/usePlacesScreenState.js';
import { DAY_KEYS, DAY_LABELS, emptySchedule, summarizeSchedule, allDaysList } from '../data/hoursSchedule.js';
import { IconButton, NavBar, navControlStyle, navControlTextColor, FieldLabel, inputStyle, Select, Toggle, RecommendationCard, PhotoLightbox, YoutubeVideoModal, color, space, spacing } from '../design-system/index.js';
import { LIST_DETAIL_STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Centros', 'Outlets', 'Shopping', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

const EDITABLE_FIELDS = [
  'name', 'category', 'subcategory', 'tag', 'address',
  'cost', 'hours', 'recommendation', 'googleMapsUri', 'menuUri',
];

function placeFields(place) {
  const out = {};
  for (const f of EDITABLE_FIELDS) out[f] = place[f] ?? '';
  // hoursSchedule é objeto/null, não string — fora do loop genérico acima
  // pra não virar '' (o '??' trataria até um {} vazio como valor válido,
  // então a checagem explícita evita essa pegadinha também).
  out.hoursSchedule = place.hoursSchedule ?? null;
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
    } catch (err) {
      showErrorToast(err, 'Não foi possível buscar no Google agora.');
    } finally {
      setSearching(false);
    }
  };

  const handlePick = async (place) => {
    if (importingId) return;
    setImportingId(place.id);
    try {
      const photos = await importGooglePlacePhotos(place.id).catch(() => ({ photo: null, dishPhotos: [], recommendation: null, hoursSchedule: null }));
      onSelect({
        id: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        googleMapsUri: place.googleMapsUri || '',
        photo: photos.photo,
        dishPhotos: photos.dishPhotos || [],
        recommendation: photos.recommendation,
        hoursSchedule: photos.hoursSchedule || null,
      });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div style={{ padding: '20px 22px' }}>
      <div style={{ color: '#1c1a17', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Novo lugar</div>
      <div style={{ color: '#1c1a17', fontSize: 13, fontWeight: 500, marginBottom: spacing.controlGap }}>
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
                gap: spacing.gapLg,
                padding: space.xl - 2,
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
    const fromList = cached ? cached.find((p) => p.id === id) || null : null;
    // Deep link direto (tela de Lugares nunca visitada nesta sessão): cai
    // pra uma chave própria por lugar, em vez de depender da lista inteira.
    return fromList || getCachedPlace(id);
  }, [id, isNew]);
  const [place, setPlace] = useState(cachedPlace);
  const [loading, setLoading] = useState(!isNew && cachedPlace === null);
  const [editing, setEditing] = useState(false);
  const staggerKey = useStaggerKey();
  const [saving, setSaving] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
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
  const [videoModalRec, setVideoModalRec] = useState(null);
  // Recomendação sendo editada no momento (ou null) — abre o
  // RecommendationEditModal a partir do botão de editar do próprio
  // RecommendationCard. Edição já não depende mais do modo de edição do
  // lugar: salva/exclui imediatamente, como a criação.
  const [editingRecommendation, setEditingRecommendation] = useState(null);
  const rootRef = useRef(null);
  const originalRef = useRef(null);
  const coords = useGeocode(place?.address ?? draft?.address);
  const occurrences = usePlaceOccurrences(id);

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

  const { recommendations, addRecommendation, removeRecommendation, patchRecommendation } = usePlaceRecommendations(!isNew ? id : null);

  const handlePublishRecommendation = async ({ title, author, description, category, youtubeVideoId, photoFile }) => {
    try {
      let photo = null;
      if (photoFile) {
        const { url } = await uploadPlacePhoto(photoFile);
        photo = url;
      }
      const created = await createRecommendation({ placeId: id, title, author, description, photo, category, youtubeVideoId });
      addRecommendation(created);
      setRecommendationModalOpen(false);
      showToast('Dica publicada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível publicar a dica.');
      throw err;
    }
  };

  // Editar e excluir agora são imediatos (mesmo espírito da criação) — não
  // dependem mais do modo de edição do lugar nem do botão Salvar geral.
  const handleSaveRecommendation = async ({ title, author, description, category, youtubeVideoId, photo, photoFile }) => {
    try {
      let finalPhoto = photo;
      if (photoFile) {
        const { url } = await uploadPlacePhoto(photoFile);
        finalPhoto = url;
      }
      const fields = { title, author, description, photo: finalPhoto, category, youtubeVideoId };
      await updateRecommendation(editingRecommendation.id, fields);
      patchRecommendation(editingRecommendation.id, fields);
      setEditingRecommendation(null);
      showToast('Dica atualizada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível atualizar a dica.');
      throw err;
    }
  };

  const handleDeleteRecommendation = async () => {
    try {
      await deleteRecommendation(editingRecommendation.id);
      removeRecommendation(editingRecommendation.id);
      setEditingRecommendation(null);
      showToast('Dica removida com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível remover a dica.');
      throw err;
    }
  };

  const reload = (silent) => {
    if (!silent) setLoading(true);
    return fetchPlaces()
      .then((places) => {
        setCachedPlaces(places);
        const found = places.find((p) => p.id === id) || null;
        setPlace(found);
        if (found) setCachedPlace(id, found);
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

  // Favoritos são por viajante (ver place_favorites/toggleFavoritePlace) —
  // mexe só na identidade ATIVA deste aparelho, sem afetar o favorito de
  // outros viajantes (ver o mesmo padrão em PlacesScreen.jsx).
  const identity = getTravelerIdentity();
  const isFavorite = identity ? (place?.favoritedBy || []).includes(identity) : false;

  const handleToggleFavorite = async () => {
    if (!identity) return;
    try {
      await toggleFavoritePlace(id, identity, !isFavorite);
      await reload(true);
    } catch (err) {
      showErrorToast(err, 'Não foi possível atualizar o favorito.');
    }
  };

  const handleReplaceMainPhoto = async (file) => {
    if (!file) return;
    try {
      const { url } = await uploadPlacePhoto(file);
      await patchPlace({ photo: url });
      showToast('Foto principal atualizada');
    } catch (err) {
      showErrorToast(err, 'Não foi possível trocar a foto principal.');
    }
  };

  const handleAddDishPhoto = async (file) => {
    if (!file) return;
    try {
      const { url } = await uploadPlacePhoto(file);
      await patchPlace({ dishPhotos: [...dishPhotos, url] });
      showToast('Foto adicionada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível adicionar a foto.');
    }
  };

  const handleRemoveDishPhoto = async (index) => {
    const next = dishPhotos.filter((_, i) => i !== index);
    try {
      await patchPlace({ dishPhotos: next });
      showToast('Foto removida');
    } catch (err) {
      showErrorToast(err, 'Não foi possível remover a foto.');
    }
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
      hoursSchedule: picked.hoursSchedule || null,
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
        setAttemptedSave(true);
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
        fields.hoursSchedule = draft.hoursSchedule || null;
        const { photo, dishPhotos, id: newId } = newPlacePhotos;
        const created = await createPlace({ id: newId, ...fields, photo, dishPhotos });
        const freshPlaces = await fetchPlaces();
        setCachedPlaces(freshPlaces);
        navigate(`/lugares/${created.id}`, { replace: true });
        showToast('Lugar criado com sucesso');
      } catch (err) {
        showErrorToast(err, 'Não foi possível criar o lugar.');
      } finally {
        setSaving(false);
      }
      return;
    }

    const original = originalRef.current;
    // hoursSchedule é objeto — comparado via JSON.stringify (não String(),
    // que daria "[object Object]" pros dois lados e nunca detectaria mudança).
    const hoursScheduleChanged = JSON.stringify(draft.hoursSchedule) !== JSON.stringify(original.hoursSchedule);
    const changed = hoursScheduleChanged || EDITABLE_FIELDS.some((f) => String(draft[f]) !== String(original[f]));
    setSaving(true);
    try {
      if (changed) {
        const fields = {};
        for (const f of EDITABLE_FIELDS) {
          fields[f] = f === 'cost' && draft[f] !== ''
            ? Number(draft[f])
            : draft[f] || null;
        }
        fields.hoursSchedule = draft.hoursSchedule || null;
        await updatePlace(id, fields);
        await reload(true);
      }

      setEditing(false);
      setDraft(null);
      originalRef.current = null;
      showToast('Edição realizada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível salvar as alterações do lugar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlace(id);
      navigate('/lugares');
      showToast('Lugar removido com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível remover o lugar.');
    }
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
          <IconButton icon={AltArrowLeftIcon} onClick={() => navigate(-1)} />
        </div>
        <GoogleSearchPanel onSelect={handleGooglePick} />
      </div>
    );
  }

  const HEADER_HEIGHT = 320;
  // Nav bar branca aparece quando o scroll já "engoliu" quase toda a foto —
  // some 40px antes do fim pra não bater exatamente no limiar do parallax.
  const navBarVisible = scrollY > HEADER_HEIGHT - 40;
  // Puxar a tela pra baixo além do topo (scrollY negativo, "rubber-band" do
  // próprio elemento) dá zoom na foto acompanhando o gesto — mesmo efeito do
  // Instagram/Twitter. A foto é position:fixed (não rola com o conteúdo),
  // então sem isso ela ficava parada enquanto o resto da tela esticava.
  const pullDistance = Math.max(0, -scrollY);
  const headerScale = 1 + pullDistance / HEADER_HEIGHT;

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box', paddingBottom: 40 }}>
      {/* Foto fixa atrás do conteúdo (efeito parallax): não rola junto com a
          página — o card de informações desliza por cima dela conforme o
          usuário arrasta a tela pra cima. opacity animada por fora (Motion)
          em paralelo ao transform de parallax controlado via CSS inline
          (transition própria, inalterada) — a foto só aparece depois que o
          slide de entrada da tela termina, junto com o resto do conteúdo em
          stagger, em vez de já vir visível enquanto a tela ainda desliza. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.32 }}
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) scale(${headerScale})`,
          transformOrigin: 'top center',
          transition: pullDistance === 0 ? 'transform 0.2s ease' : 'none',
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
      </motion.div>

      <NavBar
        visible={navBarVisible}
        left={
          <div
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              ...navControlStyle(navBarVisible),
            }}
          >
            <AltArrowLeftIcon size={20} color={navControlTextColor(navBarVisible)} />
          </div>
        }
        right={
          (place || isNew) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {place && !isNew && (
                <div
                  onClick={handleToggleFavorite}
                  style={{
                    height: 38,
                    width: 38,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    ...navControlStyle(navBarVisible),
                  }}
                >
                  <StarIcon size={17} color={isFavorite ? color.accent : navControlTextColor(navBarVisible)} />
                </div>
              )}
              {!editing && (
                <div
                  onClick={startEditing}
                  style={{
                    height: 38,
                    width: 38,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    ...navControlStyle(navBarVisible),
                  }}
                >
                  <PenIcon size={17} color={navControlTextColor(navBarVisible)} />
                </div>
              )}
            </div>
          )
        }
      />

      {/* Espaçador puramente estrutural: reserva a altura da foto fixa no
          fluxo do documento, mas nunca deve interceptar cliques — senão rouba
          o toque/arrasto do carrossel, que fica visualmente por trás dele. */}
      <div style={{ position: 'relative', height: HEADER_HEIGHT, zIndex: 0, pointerEvents: 'none' }} />

      <div
        style={{
          position: 'relative',
          background: '#fff',
          marginTop: -24,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <motion.div
          key={`${staggerKey}-${id ?? 'new'}`}
          variants={LIST_DETAIL_STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
          style={{ padding: '10px 22px 20px' }}
        >

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
              <FieldLabel error={isNew && attemptedSave && !draft.name.trim()}>Nome</FieldLabel>
              <input value={draft.name || ''} onChange={(e) => setDraftField('name')(e.target.value)} style={{ ...inputStyle, marginTop: 3, fontSize: 16, fontWeight: 700 }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel error={isNew && attemptedSave && !draft.category.trim()}>Categoria</FieldLabel>
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
              <FieldLabel>Horário de funcionamento</FieldLabel>
              <div style={{ marginTop: 5 }}>
                <HoursScheduleEditor value={draft.hoursSchedule} onChange={setDraftField('hoursSchedule')} />
              </div>
            </div>

            <div>
              <FieldLabel>Recomendação</FieldLabel>
              <input value={draft.recommendation || ''} onChange={(e) => setDraftField('recommendation')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} />
            </div>

            <div>
              <FieldLabel>Fotos do lugar</FieldLabel>
              <div style={{ display: 'flex', gap: spacing.gapLg, marginTop: 6, flexWrap: 'wrap' }}>
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

            {draft.category === 'Restaurante' && (
              <div>
                <FieldLabel>Link do menu</FieldLabel>
                <input value={draft.menuUri || ''} onChange={(e) => setDraftField('menuUri')(e.target.value)} style={{ ...inputStyle, marginTop: 3 }} />
              </div>
            )}

            {!isNew && (
              <div
                onClick={handleDelete}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: spacing.gapLg,
                  padding: spacing.cardPadding,
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
            <motion.div variants={STAGGER_ITEM} style={{ minWidth: 0 }}>
              <div style={{ color: '#1c1a17', fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 8 }}>
                {place.name}
              </div>
              {place.recommendation && (
                <div style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 500, marginTop: 3, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                  {place.recommendation}
                </div>
              )}
            </motion.div>

            {(place.tag || place.cost != null || (place.hours && !place.hoursSchedule)) && (
              <motion.div
                variants={STAGGER_ITEM}
                style={{
                  display: 'flex',
                  gap: spacing.gapLg,
                  marginTop: spacing.controlGap,
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
                  // Campo legado de texto livre — só exibido enquanto o lugar
                  // não tiver o horário estruturado novo (ver HoursScheduleSection).
                  if (place.hours && !place.hoursSchedule) cards.push({ key: 'hours', icon: '🕒', label: 'Horário', value: place.hours });
                  return cards.map(({ key, ...card }) => <InfoCard key={key} {...card} />);
                })()}
              </motion.div>
            )}

            {(place.googleMapsUri || place.category === 'Restaurante') && (
              <motion.div variants={STAGGER_ITEM} style={{ display: 'flex', gap: spacing.gapMd, marginTop: spacing.controlGap }}>
                {place.googleMapsUri && (
                  <a
                    href={place.googleMapsUri}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '14px 12px',
                      borderRadius: 16,
                      background: '#1c1a17',
                      color: '#fff',
                      fontSize: 14.5,
                      fontWeight: 700,
                      textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    <PointOnMapIcon size={17} color="#fff" />
                    Ver no Google Maps
                  </a>
                )}

                {place.category === 'Restaurante' && (
                  place.menuUri ? (
                    <a
                      href={place.menuUri}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '14px 12px',
                        borderRadius: 16,
                        background: '#fff',
                        border: '1px solid #ececec',
                        color: '#1c1a17',
                        fontSize: 14.5,
                        fontWeight: 700,
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <DocumentTextIcon size={17} color="#1c1a17" />
                      Ver cardápio
                    </a>
                  ) : (
                    // Desabilitado: sem menuUri cadastrado ainda. Não é <a>
                    // (sem href pra não navegar a lugar nenhum), fica cinza e
                    // sem cursor de clique — mesmo espírito do estado
                    // disabled do CtaButton (ver design-system/CtaButton.jsx).
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '14px 12px',
                        borderRadius: 16,
                        background: color.toggleOff,
                        color: color.faint,
                        fontSize: 14.5,
                        fontWeight: 700,
                        textAlign: 'center',
                        cursor: 'default',
                      }}
                    >
                      <DocumentTextIcon size={17} color={color.faint} />
                      Ver cardápio
                    </div>
                  )
                )}
              </motion.div>
            )}

            {place.hoursSchedule && (
              <motion.div variants={STAGGER_ITEM} style={{ marginTop: 22 }}>
                <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1, marginBottom: spacing.controlGap }}>
                  Horário de funcionamento
                </div>
                <HoursScheduleSection schedule={place.hoursSchedule} />
              </motion.div>
            )}

            {!isNew && (
              <motion.div variants={STAGGER_ITEM} style={{ marginTop: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>
                    Dicas
                  </div>
                  <div
                    onClick={() => setRecommendationModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 2 }}
                  >
                    <span style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 700 }}>Criar</span>
                    <AddCircleBoldIcon size={16} color="#1c1a17" />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {!recommendations ? (
                    <div
                      style={{
                        padding: spacing.cardPadding,
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
                      Nenhuma dica no momento.
                    </div>
                  ) : (
                    <div>
                      {recommendations.map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          recommendation={rec}
                          onOpenPhoto={() => setOpenRecommendationPhoto(rec.photo)}
                          onEdit={() => setEditingRecommendation(rec)}
                          onPlayVideo={() => setVideoModalRec(rec)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div variants={STAGGER_ITEM} style={{ marginTop: 22 }}>
              <div>
                <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>
                  No roteiro
                </div>
                <div
                  style={{
                    marginTop: spacing.gapLg,
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
                                gap: space.xl - 2,
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
            </motion.div>

            {place.address && (
              <motion.div variants={STAGGER_ITEM} style={{ marginTop: 22 }}>
                <div>
                  <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>
                    Endereço do local
                  </div>
                  <div style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>
                    {place.address}
                  </div>
                </div>
              </motion.div>
            )}

            {coords && (
              <motion.div
                variants={STAGGER_ITEM}
                onClick={() => setMapFullscreen(true)}
                style={{
                  display: 'block',
                  position: 'relative',
                  marginTop: spacing.gapLg,
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 4px 8px rgba(28,26,23,0.35))',
                  }}
                >
                  <MapPointIcon size={36} color="#1c1a17" />
                </div>
              </motion.div>
            )}

          </>
        )}
        </motion.div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <PhotoLightbox
            key="lightbox-main"
            photos={allPhotos}
            photoIndex={photoIndex}
            onIndexChange={setPhotoIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapFullscreen && coords && (
          <SinglePlaceMap
            key="map-fullscreen"
            coords={coords}
            name={place?.name || draft?.name}
            address={place?.address || draft?.address}
            photo={facadePhoto}
            onClose={() => setMapFullscreen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recommendationModalOpen && (
          <RecommendationModal
            key="recommendation-modal"
            onSubmit={handlePublishRecommendation}
            onClose={() => setRecommendationModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openRecommendationPhoto && (
          <PhotoLightbox
            key="lightbox-recommendation"
            photos={[openRecommendationPhoto]}
            photoIndex={0}
            onIndexChange={() => {}}
            onClose={() => setOpenRecommendationPhoto(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingRecommendation && (
          <RecommendationEditModal
            key="recommendation-edit-modal"
            recommendation={editingRecommendation}
            onSave={handleSaveRecommendation}
            onDelete={handleDeleteRecommendation}
            onClose={() => setEditingRecommendation(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoModalRec && (
          <YoutubeVideoModal
            key="recommendation-video-modal"
            videoId={videoModalRec.youtubeVideoId}
            title={videoModalRec.title || 'Vídeo da dica'}
            onClose={() => setVideoModalRec(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <EditActionBar key="edit-action-bar" onCancel={handleCancel} onSave={handleSave} saving={saving} />
        )}
      </AnimatePresence>
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
        padding: spacing.cardPadding,
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

// Horário de funcionamento estruturado: mostra o resumo de hoje numa linha,
// com um botão pra expandir (acordeão inline, sem modal) e ver o horário
// combinado de todos os dias da semana — dias consecutivos com o mesmo
// horário aparecem juntos numa faixa só (ex: "Seg a Sex: 11h–22h"), igual
// ao Google Maps, em vez de repetir a mesma linha várias vezes.
function HoursScheduleSection({ schedule }) {
  const [expanded, setExpanded] = useState(false);
  const groups = summarizeSchedule(schedule);
  if (groups.length === 0) return null;

  return (
    <div style={{ padding: spacing.cardPadding, borderRadius: 16, border: '1px solid #ececec', boxSizing: 'border-box' }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div style={{ minWidth: 0, color: '#1c1a17', fontSize: 13.5, fontWeight: 700 }}>
          {groups.map((g) => `${g.label}: ${g.value}`).join(' · ')}
        </div>
        {expanded ? <AltArrowUpIcon size={16} color="#9a9186" /> : <AltArrowDownIcon size={16} color="#9a9186" />}
      </div>

      {expanded && (
        <div style={{ marginTop: spacing.controlGap, paddingTop: spacing.controlGap, borderTop: '1px solid #ececec' }}>
          {allDaysList(schedule).map((day, i, arr) => (
            <div
              key={day.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i === arr.length - 1 ? 'none' : '1px solid #f3f1ee',
              }}
            >
              <span style={{ color: '#1c1a17', fontSize: 13, fontWeight: 600 }}>{day.label}</span>
              <span style={{ color: '#9a9186', fontSize: 13, fontWeight: 600 }}>{day.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Edição manual do horário por dia da semana — um toggle aberto/fechado por
// dia, com um par abre/fecha por período (suporta mais de um período no
// mesmo dia, ex: almoço e jantar separados, via "+ adicionar período").
// "Copiar para todos os dias" existe pra cobrir o caso mais comum (mesmo
// horário a semana toda) sem precisar preencher 7 vezes à mão.
function HoursScheduleEditor({ value, onChange }) {
  const schedule = value || emptySchedule();

  const setDayPeriods = (dayKey, periods) => {
    onChange({ ...schedule, [dayKey]: periods });
  };

  const toggleDay = (dayKey, isOpen) => {
    setDayPeriods(dayKey, isOpen ? [{ open: '09:00', close: '18:00' }] : []);
  };

  const updatePeriod = (dayKey, periodIndex, field, time) => {
    const periods = (schedule[dayKey] || []).map((p, i) => (i === periodIndex ? { ...p, [field]: time } : p));
    setDayPeriods(dayKey, periods);
  };

  const addPeriod = (dayKey) => {
    setDayPeriods(dayKey, [...(schedule[dayKey] || []), { open: '09:00', close: '18:00' }]);
  };

  const removePeriod = (dayKey, periodIndex) => {
    setDayPeriods(dayKey, (schedule[dayKey] || []).filter((_, i) => i !== periodIndex));
  };

  const copyToAllDays = (dayKey) => {
    const periods = schedule[dayKey] || [];
    const next = { ...schedule };
    for (const d of DAY_KEYS) next[d] = periods.map((p) => ({ ...p }));
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.gapMd }}>
      {DAY_KEYS.map((dayKey) => {
        const periods = schedule[dayKey] || [];
        const isOpen = periods.length > 0;
        return (
          <div key={dayKey} style={{ padding: spacing.cardPadding, borderRadius: 14, background: color.surfaceMuted }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: color.dark, fontSize: 13.5, fontWeight: 700 }}>{DAY_LABELS[dayKey]}</span>
              <Toggle checked={isOpen} onChange={(next) => toggleDay(dayKey, next)} />
            </div>

            {isOpen && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {periods.map((period, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="time"
                      value={period.open}
                      onChange={(e) => updatePeriod(dayKey, i, 'open', e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: '7px 8px', fontSize: 12.5 }}
                    />
                    <span style={{ color: color.muted, fontSize: 12 }}>até</span>
                    <input
                      type="time"
                      value={period.close}
                      onChange={(e) => updatePeriod(dayKey, i, 'close', e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: '7px 8px', fontSize: 12.5 }}
                    />
                    {periods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePeriod(dayKey, i)}
                        style={{ flex: 'none', border: 0, background: 'none', padding: 4, cursor: 'pointer' }}
                      >
                        <CloseIcon size={14} color={color.danger} />
                      </button>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                  <div onClick={() => addPeriod(dayKey)} style={{ color: color.dark, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    + Adicionar período
                  </div>
                  <div onClick={() => copyToAllDays(dayKey)} style={{ color: color.dark, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Copiar p/ todos os dias
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
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
        gap: space.xl - 2,
        padding: '12px 0',
        borderBottom: isLast ? 'none' : '1px solid #ececec',
      }}
    >
      <span style={{ color: '#9a9186', fontSize: 13.5, fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

