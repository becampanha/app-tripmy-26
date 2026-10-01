import { color, shellMaxWidth, spacing, type } from './tokens.js';

const REVEAL_THRESHOLD = 8; // px de scroll antes da borda/sombra aparecerem

// Barra de topo fixa, única instância — título grande + ações + abas (se
// houver), sempre no mesmo tamanho e sempre visível, independente do
// scroll. Antes disso existia tanto um "título grande" solto no corpo da
// página (rolava junto) quanto esta barra (só aparecia depois de rolar) —
// duas instâncias separadas das mesmas abas, cada uma com seu próprio
// scroll horizontal interno, sem sincronia entre elas (causava a aba ativa
// aparecer fora do lugar ao alternar entre as duas). Agora só existe esta
// barra: o conteúdo da tela nasce com um espaço reservado no topo (ver
// headerRef/useElementHeight) pra não nascer escondido atrás dela, e rola
// por baixo normalmente.
// `headerRef` (opcional): ref medindo a altura real renderizada da barra —
// ver hooks/useElementHeight.js. A tela usa a altura devolvida como
// padding-top do conteúdo, pra ele nascer logo abaixo da barra e não atrás
// dela. Sem isso teria que hardcodar um número fixo, que quebraria se o
// título quebrasse em 2 linhas ou a tela não tivesse tabs.
// `scrollY` (opcional): só controla a borda inferior e a sombra — aparecem
// depois que a página rola um pouco, indicando que há conteúdo passando por
// baixo da barra (que, diferente da versão anterior, está sempre visível e
// no mesmo tamanho, não "revela" mais com o scroll). Passando um valor fixo
// > REVEAL_THRESHOLD (ex: telas sem scroll de página, como o DayMap), a
// borda/sombra ficam sempre visíveis, sem depender de rolar nada.
// `titleSize` (opcional, default 'large'): 'large' usa type.mainTitle (título
// grande normal), 'compact' usa type.itemTitle — pra telas onde o "título"
// é mais um rótulo de contexto (ex: tema do dia no mapa) do que o nome
// grande da tela em si.
export default function FixedHeader({ title, left, right, tabs, headerRef, scrollY = 0, titleSize = 'large' }) {
  const scrolled = scrollY > REVEAL_THRESHOLD;

  return (
    <div
      ref={headerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex: 7,
        background: color.bg,
        borderBottom: scrolled ? `1px solid ${color.border}` : '1px solid transparent',
        transition: 'border-color 0.15s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Sombra só embaixo da barra (gradiente, não boxShadow do elemento
          inteiro — boxShadow vaza um pouco pros lados mesmo com offset só em
          Y, por causa do blur). Fica fora da altura real da barra, numa
          faixa própria logo abaixo, dando a sensação de que ela flutua por
          cima do conteúdo que passa rolando por baixo. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '100%',
          height: 10,
          background: 'linear-gradient(to bottom, rgba(28,26,23,0.08), rgba(28,26,23,0))',
          opacity: scrolled ? 1 : 0,
          transition: 'opacity 0.15s ease',
          pointerEvents: 'none',
        }}
      />
      {/* Padding vertical (topo e base) simétrico — sempre o mesmo, único e
          constante, com ou sem tabs. Antes o respiro final dependia de
          existir ou não o bloco de tabs, deixando telas sem abas com a
          barra colada no botão de ação; agora é sempre o mesmo valor, em
          qualquer tela que use este componente. Menor que o padding
          horizontal (screenGutter) — a barra é mais compacta no eixo
          vertical de propósito, pra não ocupar espaço demais da tela. */}
      <div style={{ padding: `${spacing.cardPadding}px ${spacing.screenGutter}px ${tabs ? 0 : spacing.cardPadding}px` }}>
        <div
          style={{
            display: 'flex',
            // 'center' (não 'flex-start'): com 'flex-start', a altura da
            // linha ainda era ditada pelo filho mais alto (o botão de 38px
            // em `right`, quando presente) mesmo o título sendo mais baixo
            // — isso sobrava como espaço "fantasma" abaixo do título só
            // quando havia `right`. 'center' alinha os dois verticalmente
            // pelo meio, sem sobra condicional.
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.gapMd,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.gapMd, minWidth: 0 }}>
            {left && <div style={{ flex: 'none' }}>{left}</div>}
            <div style={{ ...(titleSize === 'compact' ? type.itemTitle : type.mainTitle), color: color.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </div>
          </div>
          {right && <div style={{ display: 'flex', alignItems: 'center', gap: spacing.gapMd, flex: 'none' }}>{right}</div>}
        </div>
      </div>
      {tabs && (
        // Fora do container com padding lateral de propósito — o scroll
        // horizontal das abas vai até a borda real da barra (que já ocupa a
        // largura inteira da tela), em vez de ficar preso dentro do mesmo
        // respiro lateral do título. O padding esquerdo/direito do início/
        // fim do conteúdo (pra não colar na borda ao arrastar até o fim)
        // fica por conta do padding interno do próprio DayTabs/HScrollTabs.
        <div style={{ marginTop: spacing.controlGap, paddingBottom: spacing.cardPadding }}>
          {tabs}
        </div>
      )}
    </div>
  );
}
