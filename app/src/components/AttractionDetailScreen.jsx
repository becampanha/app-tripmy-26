import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { InfoCircleIcon } from '@solar-icons/react/bold/info-circle';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { AddCircleIcon } from '@solar-icons/react/bold/add-circle';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { updateAttraction } from '../api/itineraryApi.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { useAttractionsData } from '../hooks/useAttractionsData.js';
import { useLiveQueueTimes } from '../hooks/useLiveQueueTimes.js';
import { NavBar, navControlStyle, navControlTextColor, Skeleton, FieldLabel, inputStyle, color as tokenColor, radius, spacing } from '../design-system/index.js';

// Aceita qualquer formato comum de link do YouTube (watch?v=, youtu.be/,
// shorts/, embed/, ou já um ID puro de 11 caracteres) e devolve só o ID do
// vídeo, que é o que o player embutido (iframe .../embed/<id>) precisa.
function extractYoutubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match) return match[1];
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}

const INTENSITY_LABEL = {
  Alta: 'Muito radical',
  Média: 'Radical',
  Baixa: 'Pouco radical',
};

function findAttraction(parks, id) {
  for (const park of parks || []) {
    for (const area of park.areas) {
      // ids de atração vêm como number da API; useParams() sempre retorna
      // string — comparar como string pra não quebrar o match (== falharia
      // o lint, então normalizamos os dois lados explicitamente).
      const found = area.attractions.find((a) => String(a.id) === String(id));
      if (found) return found;
    }
  }
  return null;
}

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

// Tela de detalhe de uma atração — mesmo layout/estrutura visual da tela de
// detalhe de um lugar (PlaceDetailScreen.jsx): foto fixa com efeito
// parallax, navbar que aparece ao rolar, título + InfoCards de ficha
// técnica. Sem modo de edição, mini-mapa, Google Maps/cardápio ou seção de
// Dicas da comunidade — nenhum desses dados existe no schema de atração
// hoje (só vêm da planilha original importada, ver api/attractions.js).
export default function AttractionDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { parks, setParks, loading } = useAttractionsData();
  const [scrollY, setScrollY] = useState(0);
  const { getLiveQueue } = useLiveQueueTimes();

  const attraction = useMemo(() => findAttraction(parks, id), [parks, id]);

  // Mesmo padrão otimista de AttractionsScreen.jsx: atualiza o cache local na
  // hora, só reverte se o PUT falhar. useAttractionsData sincroniza o
  // espelho em memória/localStorage sozinho.
  const applyField = (fields) =>
    setParks((prev) =>
      prev.map((p) => ({
        ...p,
        areas: p.areas.map((a) => ({
          ...a,
          attractions: a.attractions.map((at) =>
            String(at.id) === String(id) ? { ...at, ...fields } : at
          ),
        })),
      }))
    );

  const handleToggleRequired = (required) => {
    applyField({ required });
    updateAttraction(id, { required }).catch((err) => {
      applyField({ required: !required });
      showErrorToast(err, 'Não foi possível atualizar o status no roteiro.');
    });
  };

  const [editingVideo, setEditingVideo] = useState(false);
  const [videoDraft, setVideoDraft] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  const startEditingVideo = () => {
    setVideoDraft(attraction?.youtubeVideoId ? `https://youtu.be/${attraction.youtubeVideoId}` : '');
    setEditingVideo(true);
  };

  const handleSaveVideo = async () => {
    const videoId = extractYoutubeId(videoDraft);
    if (videoDraft.trim() && !videoId) {
      showToast('Link do YouTube inválido — cole a URL completa do vídeo.', 'error');
      return;
    }
    setSavingVideo(true);
    try {
      await updateAttraction(id, { youtubeVideoId: videoId });
      applyField({ youtubeVideoId: videoId });
      setEditingVideo(false);
      showToast(videoId ? 'Vídeo atualizado' : 'Vídeo removido');
    } catch (err) {
      showErrorToast(err, 'Não foi possível salvar o vídeo.');
    } finally {
      setSavingVideo(false);
    }
  };

  useEffect(() => {
    const scrollRoot = document.querySelector('[data-scroll-root]');
    if (!scrollRoot) return;
    const onScroll = () => setScrollY(scrollRoot.scrollTop);
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollRoot.removeEventListener('scroll', onScroll);
  }, []);

  const HEADER_HEIGHT = 320;
  const navBarVisible = scrollY > HEADER_HEIGHT - 40;
  const pullDistance = Math.max(0, -scrollY);
  const headerScale = 1 + pullDistance / HEADER_HEIGHT;

  const liveQueue = attraction ? getLiveQueue(attraction.name) : null;
  const hasLiveQueue = typeof liveQueue === 'number';
  const queueValue = hasLiveQueue ? `${liveQueue} min` : attraction?.queue;
  const intensityLabel = attraction ? INTENSITY_LABEL[attraction.intensity] || attraction.intensity : null;
  const hasHeightRestriction = attraction?.restrictions === 'Altura mínima';

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box', paddingBottom: 40 }}>
      <div
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
        {!loading && attraction?.photo && (
          <img
            src={attraction.photo}
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
      </div>

      <NavBar
        visible={navBarVisible}
        left={
          <div
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
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
      />

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
        <div style={{ padding: '10px 22px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Skeleton width={44} height={44} radius={12} />
              <div style={{ flex: 1 }}>
                <Skeleton width="70%" height={22} />
                <Skeleton width="50%" height={13} style={{ marginTop: 6 }} />
              </div>
            </div>
          ) : !attraction ? (
            <div style={{ color: '#9a9186', fontSize: 15, fontWeight: 600 }}>Atração não encontrada.</div>
          ) : (
            <>
              <div style={{ minWidth: 0 }}>
                <div
                  onClick={() => handleToggleRequired(!attraction.required)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px 3px 6px',
                    borderRadius: 7,
                    background: attraction.required ? tokenColor.success : tokenColor.dark,
                    marginTop: 8,
                    cursor: 'pointer',
                  }}
                >
                  {attraction.required ? (
                    <CheckCircleIcon size={12} color="#fff" />
                  ) : (
                    <AddCircleIcon size={12} color="#fff" />
                  )}
                  <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700 }}>
                    {attraction.required ? 'Está no roteiro' : 'Não está no roteiro'}
                  </span>
                </div>

                <div style={{ color: '#1c1a17', fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>
                  {attraction.name}
                </div>
                {(attraction.type || attraction.intensity) && (
                  <div style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 500, marginTop: 3, lineHeight: 1.35 }}>
                    {[attraction.type, intensityLabel].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>

              {(attraction.bestTime || attraction.duration || queueValue) && (
                <div
                  style={{
                    display: 'flex',
                    gap: spacing.gapLg,
                    marginTop: spacing.controlGap,
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {attraction.bestTime && <InfoCard icon="📅" label="Melhor horário" value={attraction.bestTime} />}
                  {attraction.duration && <InfoCard icon="🎢" label="Duração" value={attraction.duration} />}
                  {queueValue && <InfoCard icon="🕒" label="Fila" value={queueValue} />}
                </div>
              )}

              {(hasHeightRestriction || attraction.parentSwap) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: spacing.controlGap }}>
                  {hasHeightRestriction && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <InfoCircleIcon size={13} color={tokenColor.warning} />
                      <span style={{ color: tokenColor.warning, fontSize: 12.5, fontWeight: 600 }}>
                        Atração requer altura mínima
                      </span>
                    </div>
                  )}
                  {hasHeightRestriction && attraction.parentSwap && (
                    <span style={{ color: tokenColor.warning, opacity: 0.6, fontSize: 12.5 }}>•</span>
                  )}
                  {attraction.parentSwap && (
                    <span style={{ color: tokenColor.warning, fontSize: 12.5, fontWeight: 600 }}>
                      Possui Parent Swap
                    </span>
                  )}
                </div>
              )}

              <div style={{ marginTop: spacing.controlGap + 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: '#1c1a17', fontSize: 15, fontWeight: 800 }}>Vídeo da atração</div>
                  {!editingVideo && (
                    <div
                      onClick={startEditingVideo}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        background: tokenColor.surfaceMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <PenIcon size={14} color={tokenColor.dark} />
                    </div>
                  )}
                </div>

                {editingVideo ? (
                  <div style={{ marginTop: 8 }}>
                    <FieldLabel>Link do YouTube</FieldLabel>
                    <input
                      value={videoDraft}
                      onChange={(e) => setVideoDraft(e.target.value)}
                      placeholder="https://youtu.be/..."
                      style={{ ...inputStyle, marginTop: 3 }}
                    />
                    <div style={{ display: 'flex', gap: spacing.gapMd, marginTop: spacing.gapMd }}>
                      <div
                        onClick={() => setEditingVideo(false)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 12,
                          borderRadius: 16,
                          border: `1px solid ${tokenColor.border}`,
                          color: tokenColor.dark,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </div>
                      <div
                        onClick={() => {
                          if (!savingVideo) handleSaveVideo();
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 12,
                          borderRadius: 16,
                          background: tokenColor.dark,
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: savingVideo ? 'default' : 'pointer',
                          opacity: savingVideo ? 0.7 : 1,
                        }}
                      >
                        {savingVideo ? 'Salvando...' : 'Salvar'}
                      </div>
                    </div>
                  </div>
                ) : attraction.youtubeVideoId ? (
                  <div
                    style={{
                      position: 'relative',
                      marginTop: 8,
                      paddingTop: '56.25%',
                      borderRadius: radius.cardPhoto,
                      overflow: 'hidden',
                      background: '#000',
                    }}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${attraction.youtubeVideoId}`}
                      title="Vídeo da atração"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ color: tokenColor.muted, fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                    Nenhum vídeo cadastrado ainda.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
