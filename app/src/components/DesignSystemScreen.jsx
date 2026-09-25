import { useState } from 'react';
import { MapIcon } from '@solar-icons/react/bold/map';
import { ShopIcon } from '@solar-icons/react/bold/shop';
import { StarIcon } from '@solar-icons/react/bold/star';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import {
  color, overlay, radius, space, spacing, type, shellMaxWidth,
  Badge, PhotoCard, HScrollTabs, SearchInput, IconButton, FloatingBar,
  Skeleton, SectionHeader, InfoRow, Toggle, CtaButton, NavBar,
  navControlStyle, navControlTextColor, Checkbox, ButtonGroup,
  TextField, FieldLabel, Select,
} from '../design-system/index.js';

function Block({ title, children }) {
  return (
    <div style={{ marginBottom: spacing.sectionGap + 12 }}>
      <div style={{ ...type.sectionTitle, color: color.dark, marginBottom: spacing.controlGap }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.gapLg, alignItems: 'flex-start' }}>{children}</div>;
}

function Swatch({ name, value }) {
  const isLight = value === color.white || value === color.bg || value === color.surfaceMuted || value === color.imagePlaceholder;
  return (
    <div style={{ width: 108 }}>
      <div style={{ width: '100%', height: 56, borderRadius: radius.badge, background: value, border: isLight ? `1px solid ${color.border}` : 'none' }} />
      <div style={{ fontSize: 11, fontWeight: 700, color: color.dark, marginTop: 4 }}>{name}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: color.muted }}>{value}</div>
    </div>
  );
}

export default function DesignSystemScreen() {
  const [demoTab, setDemoTab] = useState('roteiro');
  const [demoToggle, setDemoToggle] = useState(true);
  const [demoCheck, setDemoCheck] = useState(true);
  const [demoGroup, setDemoGroup] = useState('a');
  const [demoSelect, setDemoSelect] = useState('');
  const [search, setSearch] = useState('');
  const [navVisible, setNavVisible] = useState(false);

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box', paddingBottom: 80 }}>
      <div style={{ padding: `${space.screenGutter}px ${space.screenGutter}px 0` }}>
        <div style={{ ...type.mainTitle, color: color.dark }}>Design System</div>
        <div style={{ ...type.paragraph, color: color.muted, marginTop: space.xs }}>
          Catálogo vivo — cada bloco abaixo é o componente real usado no app, não uma cópia visual.
          Toda tela nova deve importar daqui (<code>src/design-system</code>) em vez de reescrever estilo inline.
        </div>
      </div>

      <div style={{ padding: `${spacing.sectionGap}px ${space.screenGutter}px 0`, boxSizing: 'border-box' }}>

        <Block title="Cores">
          <div style={{ ...type.eyebrow, color: color.faintIcon, marginBottom: space.sm }}>Neutros</div>
          <Row>
            <Swatch name="dark" value={color.dark} />
            <Swatch name="muted" value={color.muted} />
            <Swatch name="mutedDeep" value={color.mutedDeep} />
            <Swatch name="faint" value={color.faint} />
            <Swatch name="white" value={color.white} />
          </Row>
          <div style={{ ...type.eyebrow, color: color.faintIcon, margin: `${spacing.gapLg}px 0 ${space.sm}px` }}>Fundos</div>
          <Row>
            <Swatch name="bg" value={color.bg} />
            <Swatch name="bgApp" value={color.bgApp} />
            <Swatch name="surfaceMuted" value={color.surfaceMuted} />
            <Swatch name="imagePlaceholder" value={color.imagePlaceholder} />
            <Swatch name="border" value={color.border} />
          </Row>
          <div style={{ ...type.eyebrow, color: color.faintIcon, margin: `${spacing.gapLg}px 0 ${space.sm}px` }}>Semânticas</div>
          <Row>
            <Swatch name="success" value={color.success} />
            <Swatch name="danger" value={color.danger} />
            <Swatch name="warning" value={color.warning} />
            <Swatch name="accent" value={color.accent} />
            <Swatch name="toggleOff" value={color.toggleOff} />
          </Row>
          <div style={{ ...type.eyebrow, color: color.faintIcon, margin: `${spacing.gapLg}px 0 ${space.sm}px` }}>Categorias de lugar</div>
          <Row>
            {Object.entries(color.category).map(([k, v]) => <Swatch key={k} name={k} value={v} />)}
          </Row>
        </Block>

        <Block title="Tipografia">
          {Object.entries({
            mainTitle: 'Título de tela (H1)', sectionTitle: 'Título de seção/card',
            itemTitle: 'Título de item de lista', paragraph: 'Corpo de texto', button: 'Texto de botão/CTA',
            label: 'Chip/tab horizontal', caption: 'Badge pequeno', eyebrow: 'RÓTULO UPPERCASE',
          }).map(([key, desc]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: spacing.controlGap, padding: `${space.sm}px 0`, borderBottom: `1px solid ${color.borderFaint}` }}>
              <div style={{ width: 110, flex: 'none', fontSize: 11, fontWeight: 700, color: color.muted }}>{key}</div>
              <div style={{ ...type[key], color: color.dark }}>{desc}</div>
            </div>
          ))}
        </Block>

        <Block title="Espaçamento (space)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
            {Object.entries(space).filter(([k]) => k !== 'screenGutter').map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: spacing.controlGap }}>
                <div style={{ width: 70, flex: 'none', fontSize: 11, fontWeight: 700, color: color.muted }}>{key}</div>
                <div style={{ width: val, height: 14, background: color.dark, borderRadius: 2, flex: 'none' }} />
                <div style={{ fontSize: 11, color: color.faint }}>{val}px</div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Raios (radius)">
          <Row>
            {Object.entries(radius).map(([key, val]) => (
              <div key={key} style={{ width: 96, textAlign: 'center' }}>
                <div style={{ width: '100%', height: 56, background: color.surfaceMuted, borderRadius: val, border: `1px solid ${color.border}` }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: color.dark, marginTop: 4 }}>{key}</div>
                <div style={{ fontSize: 10, color: color.muted }}>{val}px</div>
              </div>
            ))}
          </Row>
        </Block>

        <Block title="Badge">
          <Row>
            <Badge>Restaurante</Badge>
            <Badge>💵 US$ 40</Badge>
            <Badge icon={StarIcon} iconColor={color.accent}>Obrigatória</Badge>
            <Badge textColor={color.danger}>Alta</Badge>
          </Row>
        </Block>

        <Block title="PhotoCard (card com foto de fundo — padrão canônico)">
          <div style={{ maxWidth: 300 }}>
            <PhotoCard photo="/places/xlsx-ohana.jpg" height={220} contentStyle={{ padding: spacing.cardPadding, display: 'flex', alignItems: 'flex-end' }}>
              <div>
                <div style={{ color: color.white, ...type.itemTitle, textShadow: overlay.textShadowOnPhoto }}>'Ohana</div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>Restaurante · Disney's Polynesian</div>
              </div>
            </PhotoCard>
          </div>
        </Block>

        <Block title="HScrollTabs">
          <HScrollTabs
            items={[
              { key: 'roteiro', label: 'Roteiro', icon: MapIcon },
              { key: 'lugares', label: 'Lugares', icon: ShopIcon },
              { key: 'atracoes', label: 'Atrações', emoji: '🎢' },
            ]}
            activeKey={demoTab}
            onSelect={setDemoTab}
          />
        </Block>

        <Block title="SearchInput">
          <div style={{ maxWidth: 320 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." />
          </div>
        </Block>

        <Block title="IconButton">
          <Row>
            <IconButton icon={AltArrowLeftIcon} variant="light" />
            <div style={{ padding: 12, background: '#333', borderRadius: 12 }}>
              <IconButton icon={AltArrowLeftIcon} variant="onPhoto" />
            </div>
            <IconButton icon={AltArrowLeftIcon} variant="dark" />
          </Row>
        </Block>

        <Block title="NavBar (header com parallax sobre foto)">
          <div style={{ marginBottom: space.sm }}>
            <ButtonGroup
              options={[{ value: false, label: 'Sobre foto' }, { value: true, label: 'Scrolled' }]}
              value={navVisible}
              onChange={setNavVisible}
              style={{ maxWidth: 260 }}
            />
          </div>
          <div style={{ position: 'relative', height: 90, borderRadius: radius.card, overflow: 'hidden', background: navVisible ? color.bg : '#333' }}>
            <div style={{ position: 'absolute', top: 18, left: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', ...navControlStyle(navVisible) }}>
                <AltArrowLeftIcon size={20} color={navControlTextColor(navVisible)} />
              </div>
            </div>
          </div>
        </Block>

        <Block title="FloatingBar (tab bar / EditActionBar shell)">
          <div style={{ position: 'relative', height: 76 }}>
            <div style={{ position: 'absolute', inset: 0, background: '#333', borderRadius: radius.card }} />
            <div style={{ position: 'absolute', left: 12, right: 12, bottom: -6 }}>
              <FloatingBar style={{ position: 'static', transform: 'none', width: 'auto' }}>
                <div style={{ flex: 1, textAlign: 'center', color: color.white, fontSize: 12, fontWeight: 700 }}>Roteiro</div>
                <div style={{ flex: 1, textAlign: 'center', color: color.white, fontSize: 12, fontWeight: 700 }}>Lugares</div>
              </FloatingBar>
            </div>
          </div>
        </Block>

        <Block title="Skeleton">
          <Row>
            <Skeleton width={120} height={36} radius={radius.chip} />
            <Skeleton width={80} height={80} radius={radius.card} />
          </Row>
        </Block>

        <Block title="SectionHeader">
          <SectionHeader>Restaurantes</SectionHeader>
        </Block>

        <Block title="InfoRow">
          <div style={{ maxWidth: 320 }}>
            <InfoRow label="Tipo" value="Restaurante" borderSide="bottom" />
            <InfoRow label="Custo médio" value="US$ 40" borderSide="bottom" />
          </div>
        </Block>

        <Block title="Toggle / Checkbox">
          <Row>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
              <Toggle checked={demoToggle} onChange={setDemoToggle} />
              <span style={{ fontSize: 12.5, color: color.muted }}>Toggle</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
              <Checkbox checked={demoCheck} onChange={setDemoCheck} />
              <span style={{ fontSize: 12.5, color: color.muted }}>Checkbox</span>
            </div>
          </Row>
        </Block>

        <Block title="ButtonGroup">
          <ButtonGroup
            options={[{ value: 'a', label: 'Opção A' }, { value: 'b', label: 'Opção B' }, { value: 'c', label: 'Opção C' }]}
            value={demoGroup}
            onChange={setDemoGroup}
            style={{ maxWidth: 320 }}
          />
        </Block>

        <Block title="CtaButton">
          <Row>
            <div style={{ width: 200 }}><CtaButton>Publicar</CtaButton></div>
            <div style={{ width: 200 }}><CtaButton disabled>Publicar</CtaButton></div>
          </Row>
        </Block>

        <Block title="TextField / FieldLabel / Select">
          <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: spacing.gapLg }}>
            <div>
              <FieldLabel>Nome</FieldLabel>
              <TextField value="'Ohana" onCommit={() => {}} style={{ marginTop: 3 }} />
            </div>
            <Select
              label="Categoria"
              placeholder="Selecione"
              value={demoSelect}
              onChange={setDemoSelect}
              options={['Restaurante', 'Mercado', 'Loja']}
              fullWidth
            />
          </div>
        </Block>

      </div>
    </div>
  );
}
