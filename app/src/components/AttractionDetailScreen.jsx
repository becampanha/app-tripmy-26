import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { CalendarMinimalisticIcon } from '@solar-icons/react/bold/calendar-minimalistic';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';
import { ClockCircleIcon } from '@solar-icons/react/bold/clock-circle';
import { LockKeyholeMinimalisticIcon } from '@solar-icons/react/bold/lock-keyhole-minimalistic';
import { RoundDoubleAltArrowRightIcon } from '@solar-icons/react/bold/round-double-alt-arrow-right';
import { RulerIcon } from '@solar-icons/react/bold/ruler';
import { SquareTransferHorizontalIcon } from '@solar-icons/react/bold/square-transfer-horizontal';
import { updateAttraction } from '../api/itineraryApi.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { useAttractionsData } from '../hooks/useAttractionsData.js';
import { useLiveQueueTimes } from '../hooks/useLiveQueueTimes.js';
import { ATTRACTION_STATUS_LABEL } from '../data/attractionStatus.js';
import EditActionBar from './EditActionBar.jsx';
import { NavBar, navControlStyle, navControlTextColor, Skeleton, FieldLabel, inputStyle, YoutubePlayButton, YoutubeVideoModal, color as tokenColor, radius, spacing } from '../design-system/index.js';
import { LIST_DETAIL_STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';
import { extractYoutubeId } from '../data/youtube.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

const INTENSITY_LABEL = {
  Alta: 'Muito radical',
  Média: 'Radical',
  Baixa: 'Pouco radical',
};

// Mesmos tokens já usados pra outros avisos no app (ver tokens.js: os
// comentários de success/warning/danger já citam explicitamente
// "intensidade alta/média" como um dos usos pretendidos).
const INTENSITY_ACCENT = {
  Alta: 'danger',
  Média: 'warning',
  Baixa: 'success',
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


// Grid de 2 colunas — todos os cards do mesmo tamanho (sem flex/scroll
// horizontal como antes), ícone sempre como componente Solar Icons (nunca
// emoji), pra consistência visual com o resto do app.
// `accent` controla a cor só do VALOR (nunca do ícone, que fica sempre na
// cor normal escura): 'warning' (âmbar, ex: altura mínima obrigatória ou
// intensidade média), 'success' (verde, ex: Parent Swap disponível ou
// intensidade baixa), 'danger' (vermelho, intensidade alta) ou undefined
// (cinza padrão). A fila em tempo real NÃO usa accent — o status (fechada/
// indisponível) já é comunicado pelo próprio texto, sem precisar colorir.
function InfoCard({ icon: Icon, label, value, isLive, isClosed, accent }) {
  const valueColor = accent ? tokenColor[accent] : '#9a9186';
  return (
    <div
      style={{
        padding: spacing.cardPadding,
        borderRadius: 16,
        border: '1px solid #ececec',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <Icon size={20} color={tokenColor.dark} />
      <div style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 800, marginTop: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, minWidth: 0 }}>
        {/* Cadeado pequeno ao lado do texto quando a fila está fechada —
            NÃO troca o ícone principal do card (que continua sempre o
            relógio), só acrescenta esse indicador junto do valor. */}
        {isClosed && <LockKeyholeMinimalisticIcon size={12} color="#9a9186" style={{ flex: 'none' }} />}
        <span
          style={{
            color: valueColor,
            fontSize: 12.5,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
        {isLive && (
          <span
            style={{
              flex: 'none',
              width: 5,
              height: 5,
              borderRadius: 3,
              background: tokenColor.success,
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
        )}
      </div>
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
  const { getLiveQueue, getLiveStatus } = useLiveQueueTimes();
  const staggerKey = useStaggerKey();

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

  // Modo de edição de tela inteira, mesmo padrão do PlaceDetailScreen.jsx:
  // ícone de lápis no NavBar (não mais dentro do card de vídeo), que ao
  // ativar esconde a ficha técnica inteira (vem toda da planilha original,
  // não é editável — ver api/attractions.js) e mostra só o campo que de
  // fato pode ser editado aqui (vídeo do YouTube), com EditActionBar fixo
  // embaixo (Cancelar/Salvar) em vez de botões inline no próprio card.
  const [editing, setEditing] = useState(false);
  const [videoDraft, setVideoDraft] = useState('');
  const [saving, setSaving] = useState(false);
  // Modal de vídeo em tela cheia, aberto pelo botão de play sobre a foto do
  // header — evitamos colocar o player ali dentro porque o header tem
  // efeito parallax (`scale()` dinâmico conforme o scroll, ver headerScale
  // abaixo), que deixaria o vídeo esticando/encolhendo enquanto a pessoa
  // rola a tela.
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const startEditing = () => {
    setVideoDraft(attraction?.youtubeVideoId ? `https://youtu.be/${attraction.youtubeVideoId}` : '');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setVideoDraft('');
  };

  const handleSave = async () => {
    const videoId = extractYoutubeId(videoDraft);
    if (videoDraft.trim() && !videoId) {
      showToast('Link do YouTube inválido — cole a URL completa do vídeo.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateAttraction(id, { youtubeVideoId: videoId });
      applyField({ youtubeVideoId: videoId });
      setEditing(false);
      showToast('Edição realizada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
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
  const liveStatus = attraction ? getLiveStatus(attraction.name) : null;
  const hasLiveQueue = typeof liveQueue === 'number';
  const statusLabel = !hasLiveQueue ? ATTRACTION_STATUS_LABEL[liveStatus] : null;
  // Sem dado ao vivo (nem fila numérica, nem status fechada/manutenção):
  // cai pra estimativa estática da planilha (attraction.queue), marcada com
  // "~" na frente pra deixar claro que não é tempo real.
  const queueValue = hasLiveQueue
    ? `${liveQueue} min`
    : statusLabel || (attraction?.queue
        ? (attraction.queue.trim().startsWith('~') ? attraction.queue : `~ ${attraction.queue}`)
        : null);
  const intensityLabel = attraction ? INTENSITY_LABEL[attraction.intensity] || attraction.intensity : null;
  const hasHeightRestriction = attraction?.restrictions === 'Altura mínima';

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box', paddingBottom: 40 }}>
      {/* opacity animada por fora (Motion) em paralelo ao transform de
          parallax controlado via CSS inline (transition própria,
          inalterada) — a foto só aparece depois que o slide de entrada da
          tela termina, junto com o resto do conteúdo em stagger, em vez de
          já vir visível enquanto a tela ainda desliza. */}
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

        {!loading && attraction?.youtubeVideoId && (
          <div
            onClick={() => setVideoModalOpen(true)}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <YoutubePlayButton />
          </div>
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
          attraction && !editing && (
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
          )
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
        <motion.div
          key={`${staggerKey}-${id}`}
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
          ) : !attraction ? (
            <div style={{ color: '#9a9186', fontSize: 15, fontWeight: 600 }}>Atração não encontrada.</div>
          ) : (
            <>
              <motion.div variants={STAGGER_ITEM} style={{ minWidth: 0 }}>
                <div style={{ color: '#1c1a17', fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 8 }}>
                  {attraction.name}
                </div>
                {attraction.type && (
                  <div style={{ color: tokenColor.muted, fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>
                    {attraction.type}
                  </div>
                )}
              </motion.div>

              {/* "Está no roteiro" deixou de ser editável manualmente — agora
                  é só informativo, calculado a partir do Roteiro real (ver
                  api/attractions.js, listAttractions): está no roteiro se e
                  somente se a atração estiver vinculada a alguma activity em
                  algum dia. Sem clique/toggle; mostra os dias quando houver. */}
              <motion.div
                variants={STAGGER_ITEM}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginTop: spacing.controlGap,
                  padding: spacing.cardPadding,
                  borderRadius: radius.card,
                  background: tokenColor.surfaceMuted,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {attraction.required && <CheckCircleIcon size={16} color={tokenColor.success} />}
                  <div style={{ color: tokenColor.dark, fontSize: 15.5, fontWeight: 800 }}>
                    {attraction.required ? 'Está no roteiro' : 'Não está no roteiro'}
                  </div>
                </div>
                {attraction.required ? (
                  <div style={{ color: tokenColor.muted, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                    Escalada em: {attraction.itineraryDays.map((d) => `${d.weekday} ${d.date}`).join(', ')}
                  </div>
                ) : (
                  <div style={{ color: tokenColor.muted, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                    Adicione essa atração a um dia do Roteiro pra ela aparecer aqui
                  </div>
                )}
              </motion.div>

              {/* Ficha técnica inteira (grid + avisos) some em modo de
                  edição — todo esse bloco vem fixo da planilha original
                  (api/attractions.js), não é editável, então não faz
                  sentido continuar visível competindo com o campo que de
                  fato pode ser editado. */}
              {!editing && (
                <motion.div variants={STAGGER_ITEM}>
                  {/* Grid de ficha técnica — 3 colunas, todos os cards do
                      mesmo tamanho, 2 por linha (Tipo voltou a aparecer
                      como texto embutido embaixo do título, não é mais um
                      card aqui). */}
                  <div style={{ marginTop: spacing.controlGap + 6 }}>
                    <div style={{ color: '#1c1a17', fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
                      Informações
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: spacing.gapMd,
                      }}
                    >
                      {queueValue && (
                        <InfoCard
                          icon={ClockCircleIcon}
                          label="Fila em tempo real"
                          value={queueValue}
                          isLive={hasLiveQueue}
                          isClosed={!!statusLabel}
                        />
                      )}
                      {attraction.duration && <InfoCard icon={FerrisWheelIcon} label="Duração" value={attraction.duration} />}
                      <InfoCard
                        icon={RulerIcon}
                        label="Altura mínima"
                        value={hasHeightRestriction ? 'Obrigatória' : 'Não exigida'}
                        accent={hasHeightRestriction ? 'warning' : undefined}
                      />
                      <InfoCard
                        icon={SquareTransferHorizontalIcon}
                        label="Parent Swap"
                        value={attraction.parentSwap ? 'Disponível' : 'Não disponível'}
                        accent={attraction.parentSwap ? 'success' : undefined}
                      />
                      {attraction.bestTime && <InfoCard icon={CalendarMinimalisticIcon} label="Melhor horário" value={attraction.bestTime} />}
                      {intensityLabel && (
                        <InfoCard
                          icon={RoundDoubleAltArrowRightIcon}
                          label="Intensidade"
                          value={intensityLabel}
                          accent={INTENSITY_ACCENT[attraction.intensity]}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {editing && (
                <div style={{ marginTop: spacing.controlGap + 6 }}>
                  <div style={{ color: '#1c1a17', fontSize: 15, fontWeight: 800 }}>Vídeo da atração</div>
                  <div style={{ marginTop: 8 }}>
                    <FieldLabel>Link do YouTube</FieldLabel>
                    <input
                      value={videoDraft}
                      onChange={(e) => setVideoDraft(e.target.value)}
                      placeholder="https://youtu.be/..."
                      style={{ ...inputStyle, marginTop: 3 }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {editing && <EditActionBar key="edit-action-bar" onCancel={handleCancel} onSave={handleSave} saving={saving} />}

      <AnimatePresence>
        {videoModalOpen && attraction?.youtubeVideoId && (
          <YoutubeVideoModal videoId={attraction.youtubeVideoId} title="Vídeo da atração" onClose={() => setVideoModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
