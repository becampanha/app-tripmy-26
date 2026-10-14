# Contexto do projeto — Family Trip

Este arquivo é lido automaticamente pelo Claude Code sempre que uma conversa começa neste diretório — não precisa ser citado manualmente. Contém um resumo prático e cronológico de tudo que já foi pedido e implementado, pra retomar o trabalho sem perder contexto entre conversas. Atualize-o (adicionando uma nova seção numerada no fim) sempre que uma sessão de trabalho significativa terminar ou antes de o usuário encerrar a conversa.

**Projeto:** Family Trip (PWA de roteiro de viagem Orlando/Disney)
**Repo:** `becampanha/app-tripmy-26`, código em `app/`
**Produção:** https://app-xi-one-11.vercel.app
**Stack:** Vite + React (SPA), Vercel Functions (`api/*.js`), Neon Postgres, Vercel Blob

---

## 1. Tela de detalhes do lugar — bugs e distância entre atividades

- **Bug crítico corrigido**: app quebrava (tela toda sumia) ao abrir um dia do roteiro onde duas atividades consecutivas usavam o mesmo lugar. Causa: cálculo de distância com origem = destino gerava `null` que quebrava o `.toFixed()` no frontend. Corrigido em 3 camadas (backend detecta e retorna 0/0 direto, backend valida tipos, frontend valida tipos, cache não persiste resultado inválido).
- **Bug corrigido**: cards do roteiro ficavam "colados" (sem espaçamento) quando a distância ainda não tinha carregado. Corrigido reservando o espaçamento sempre, independente do componente de distância renderizar algo.
- Analisado e confirmado que o par "Saída do hotel → Café da manhã no hotel" (Disney's All-Star Music Resort / Intermission Food Court) tem o mesmo endereço físico e por isso mostra "0.0 km · 0 min de carro" — comportamento correto, mantido a pedido do usuário (não esconder a linha quando a distância é zero).

## 2. Ícone do app

- Substituído `public/icons/icon-192.png` e `icon-512.png` pela imagem enviada pelo usuário (orelhas de Mickey + banquinho, fundo preto).

## 3. Tela de detalhes do lugar — redesign "No roteiro"

- Bloco que mostra se o lugar está no roteiro movido para debaixo da lista de Tipo/Custo/Horário, com título "No roteiro" (mesmo estilo de "Endereço do local").
- Trocado fundo bege por card branco com borda.
- Não mostra mais quantidade de dias — vira uma linha "No roteiro: Sim ✓ / Não" no estilo ficha técnica.
- Adicionado link "Ver todos os dias" que expande um accordion com a lista completa de datas/horários (em vez de abrir uma tela nova).
- Removidas as linhas divisórias acima dos títulos "No roteiro" e "Endereço do local" (pedido explícito).
- Texto do endereço trocado de cinza-claro para preto (`#1c1a17`).

## 4. Carrossel de fotos e efeito parallax

- Substituído o carrossel de fotos caseiro (scroll manual) por **Embla Carousel** (`embla-carousel-react`), tanto no header da tela de detalhes quanto no lightbox fullscreen — arrasto mais suave, indicador de página com dots animados + contador numérico "2/3".
- Lightbox: fecha ao tocar em qualquer ponto da tela (antes só fechava pelo X ou arrastando pra baixo).
- Efeito parallax no header da tela de detalhes: a foto principal fica fixa atrás do conteúdo; ao rolar a tela para cima, o card branco desliza por cima da foto. Uma nav bar branca flutuante aparece no topo quando o scroll passa da altura da foto, com os botões voltar/editar mudando de estilo (translúcido sobre a foto → sólido sobre a nav bar).
- **Bug corrigido durante a implementação**: um elemento espaçador invisível estava roubando os cliques/arrastos do carrossel (before fix, carrossel e lightbox pareciam "travados"). Corrigido com `pointerEvents: 'none'` no espaçador.

## 5. Ajustes finos na lista "Ver todos os dias" (accordion)

- Padronizado o espaçamento de todas as linhas (12px top/bottom, igual ao cabeçalho "Ver todos os dias").
- Quando não há horário, mostra "—" no lugar do horário (em vez de esconder a coluna, o que quebrava o alinhamento visual entre linhas).

## 6. Cards de Tipo/Custo/Horário — estilo Airbnb

- Trocada a lista vertical de linhas por cards com scroll horizontal, no estilo "Where you'll sleep" do Airbnb: ícone (emoji, ex: 🏨 para Tipo) no topo, label em negrito, valor em cinza embaixo.

## 7. Funcionalidade de Recomendações (nova, na tela de detalhes do lugar)

- Nova seção "Recomendações" logo acima de "No roteiro": título + link "Criar" (ícone + à esquerda do texto) + placeholder "Nenhuma recomendação no momento." quando vazio.
- Modal do tipo bottom-sheet (colada na base da tela) para publicar: campo de descrição (obrigatório) + foto opcional. Removidos os campos "Título" e "Quem está sugerindo" a pedido do usuário (mantém só a descrição).
- Cards de recomendação em carrossel horizontal, no mesmo visual do `PlaceCard` da tela de Lugares (foto de fundo, gradiente, texto sobreposto) — sem título, sem data, sem autor, só a descrição.
- Scroll horizontal com mouse corrigido (reaproveitado `useDragScroll`).
- Clicar num card com foto abre a foto em fullscreen (reaproveitado o mesmo `PhotoLightbox` do carrossel principal).
- Nova tabela `place_recommendations` no banco + endpoint `/api/places/recommendations` (GET/POST).

## 8. Cache/performance (stale-while-revalidate)

- Os dados de "No roteiro" (`usePlaceOccurrences`) e "Recomendações" (`usePlaceRecommendations`) agora usam cache em `localStorage`: mostram o último dado conhecido instantaneamente ao reabrir a tela (sem skeleton), e atualizam em segundo plano assim que a rede responde. Mesmo padrão já usado para distância/geocodificação entre lugares.
- Skeleton de carregamento no bloco "No roteiro" só aparece na primeiríssima visita a um lugar (quando ainda não há nada em cache).

## 9. Barra de ação de edição do roteiro (EditActionBar)

- Nova barra, do mesmo tamanho/posição da tab bar inferior, que a substitui enquanto a tela de Roteiro está em modo de edição.
- Botão "Cancelar": estilo texto/link, sem sublinhado, negrito, cor cinza opaca (`#9a9186`) — à esquerda.
- Botão "Salvar": fundo verde (`#3fa35a`), ícone de check, alinhado à direita.
- A tab bar normal reaparece automaticamente ao cancelar, salvar, ou mesmo se o usuário sair da tela sem confirmar nada (estado global via `useEditingState.js`).
- **Bug corrigido durante a implementação**: clicar no botão de editar antes dos dados do dia carregarem travava a tela inteira (`startEditing` lendo `.id` de `null`). Adicionada uma guarda.

## 10. Sistema de toast/notificações

- Mapeadas **17 interações** de criar/editar/remover no projeto inteiro (roteiro, lugares, fotos, recomendações). Descoberto que **nenhuma tinha sistema de feedback visual** e a maioria falhava **silenciosamente** em caso de erro de rede (sem `try/catch`, erro só aparecia no console).
- Criado sistema de toast próprio (`useToast.js` + `ToastHost.jsx`), sem dependência externa: aparece no topo da tela, auto-some em ~3s, verde para sucesso, escuro/vermelho para erro.
- Aplicado em todas as 17 interações: salvar roteiro, criar/editar/remover lugar, trocar/adicionar/remover fotos, publicar recomendação, buscar no Google.
- Corrigidos os `try/catch` faltantes no caminho (ex: remover lugar não tinha nenhum tratamento de erro antes).
- Mensagens de erro de rede pura ("Failed to fetch") são substituídas por uma mensagem amigável em vez do texto técnico do navegador.

## 11. Nova tela "Atrações" (grande funcionalidade nova)

- Usuário forneceu uma planilha Excel (`🎪 Parques e atrações.xlsx`) com 7 abas (parques: Magic Kingdom, Epcot, Hollywood Studios, Animal Kingdom, Epic, Islands of Adventure, Universal Studios), cada uma com atrações organizadas por área, contendo: obrigatória ou não, tipo, duração, tempo de fila, melhor horário, restrições, Parent Swap, intensidade.
- Extraídas **133 atrações** da planilha (script Python/openpyxl), estrutura validada e populada numa nova tabela `attractions` no Neon Postgres.
- Novo endpoint `/api/attractions` (GET) que retorna tudo agrupado por parque → área, na ordem original da planilha.
- Nova tela `/atracoes`, mesmo padrão visual da tela de Lugares: abas de parque com scroll horizontal, seções sticky por área, busca por nome.
- Novo card de atração (`AttractionCard.jsx`): badge "Obrigatória" (se aplicável), nome, tipo, badge de intensidade colorida (verde/amarelo/vermelho = Baixa/Média/Alta), ficha técnica (duração, fila, melhor horário, restrições), indicador "Tem Parent Swap".
- Nova aba "Atrações" na tab bar inferior (ícone de roda-gigante).
- **Fotos**: confirmado que o Google Places tem foto disponível para praticamente qualquer atração (testado em vários parques, inclusive o Epic Universe recém-inaugurado). Rodado um script de importação em lote que buscou e importou foto do Google para todas as 133 atrações (upload para Vercel Blob, mesmo padrão já usado para lugares). Resultado final: **133/133 atrações com foto**, exibida no canto direito do card (mesmo padrão visual do card de atividade do roteiro).

## 12. Card de Atrações — visual como o card de Lugares

- Card de atração trocado para usar a foto como fundo (gradiente + texto sobreposto), no mesmo padrão do `PlaceCard`, em vez do card branco com foto lateral.

## 13. Design system completo (do zero)

- Criado `src/design-system/` com tokens centrais (`tokens.js`): cores, tipografia nomeada ("Text Styles" — Main Title, Section Title, Item Title, Paragraph, Button, Label, Caption, Eyebrow, com aliases semânticos), espaçamento em escala de 4px, raios de borda, sombras/overlays.
- ~20 componentes reutilizáveis extraídos das telas existentes e padronizados: `Badge`, `PhotoCard`, `HScrollTabs`, `SearchInput`, `IconButton`, `FloatingBar` (tab bar), `Skeleton`, `SectionHeader`, `InfoRow`, `Toggle`, `CtaButton`, `NavBar` (nav bar flutuante sobre foto), `Checkbox`, `ButtonGroup`, `TextField`/`FieldLabel`, `Select`, `RecommendationCard`, `PhotoLightbox`.
- Todas as telas existentes refatoradas para usar os tokens/componentes em vez de valores soltos — objetivo: nunca duplicar um padrão visual, só reutilizar.
- Criada tela interna `/design-system` (`DesignSystemScreen.jsx`) como catálogo de referência dos componentes.
- **Bugs corrigidos no processo**: `Toggle` disparava `onChange` em dobro ao clicar direto nele (wrapper e o próprio switch tinham `onClick`, corrigido com `stopPropagation`); `SectionHeader` com `z-index` alto demais passava por cima da tab bar (reduzido de 5 para 2).

## 14. Ajustes visuais no `AttractionCard`

- Tags reposicionadas, ícones trocados, texto de intensidade "Alta/Média/Baixa" → "Muito radical/Radical/Pouco radical", nome/tipo invertidos no layout, tags de restrição e melhor horário movidas para o topo do card.

## 15. Dados do restaurante Tokyo Dining

- Descoberto que o restaurante fechou e reabriu como "Shiki-Sai: Sushi Izakaya" — dados do lugar atualizados no banco (nome, foto, informações).

## 16. Recomendações → "Dicas" (funcionalidade nova completa)

- Modal de criar recomendação: campos "Título" e "Quem está sugerindo" trazidos de volta (tinham sido removidos antes), ordem final Título → Descrição → Quem está sugerindo → Foto.
- Card de recomendação redesenhado: de carrossel horizontal para lista vertical, reaproveitando exatamente o mesmo visual do card de atividade do Roteiro (`ActivityItem`) — o mesmo `RecommendationCard` é usado tanto na tela de detalhes do lugar quanto na nova tela agregada.
- Nova tela **"Dicas"** (rota `/recomendacoes`) na tab bar, entre Roteiro e Lugares: lista todas as recomendações de todos os lugares num só lugar.
- CRUD completo dentro do modo de edição da tela de detalhes do lugar: cada recomendação aparece com campos abertos para editar (título, descrição, autor, foto — trocar ou remover) ou excluir, igual ao resto da tela de edição. Novo endpoint `PUT /api/places/recommendations`.
- Rodada uma leva real de recomendações a partir de uma lista fornecida pelo usuário sobre Disney Springs (aprovadas uma a uma): Cooke's of Dublin, Morimoto Asia Street Food, Wine Bar George, Earl of Sandwich, Ghirardelli Soda Fountain, Marketplace Snacks (lugar novo, criado a pedido), Everglazed Donuts (lugar novo), e Pretzel do Mickey no Magic Kingdom — 8 recomendações reais publicadas, todas com foto reaproveitada das `dishPhotos` do Google Places (busca de foto específica por prato via web tentada e abandonada — bloqueios de scraping).
- Renomeação de "Recomendações" para "**Dicas**" em todo texto visível da interface (título da tela, tab bar, textos de vazio, toasts, labels do formulário) — escopo limitado de propósito: só a funcionalidade nova, não o campo antigo `place.recommendation` (frase curta do card de Lugares); e só o texto visível, não nomes internos de arquivos/rotas/tabelas do banco.
- Meta do card ajustada para "Recomendado por {nome} · {data}", título em negrito.

## 17. Tela "Mais" (nova)

- Nova aba na tab bar (mais à direita): mostra a versão instalada (hash do commit) e data/hora de publicação, atualizados automaticamente a cada build via `vite.config.js` (injeta `__BUILD_INFO__`). Botão de hard refresh (desregistra service worker + limpa caches + recarrega).
- Confirmado que a atualização de versão já é automática e silenciosa (service worker com `registerType: 'autoUpdate'`, checagem a cada 60s) — não precisou de UI extra além do botão de refresh manual como reforço.

## 18. Experiência mobile "menos web, mais app nativo"

- Zoom automático do iOS ao focar campos de formulário: corrigido fixando `font-size: 16px` em `input/textarea/select` (só nesses elementos, sem alterar os tokens visuais de outros componentes).
- Seleção de texto/imagem e menu de contexto ao segurar o dedo: desativados por padrão (`user-select: none`, `-webkit-touch-callout: none`) só no app; reabilitados nos campos de formulário (edição normal) e via classe de escape (`.allow-native-touch`) nas fotos, para preservar o menu nativo do iOS (Salvar Imagem/Copiar) — um long-press customizado (`useLongPress.js`) chegou a ser implementado e depois **removido por completo**, pois o usuário queria de fato o gesto nativo do iOS, não algo customizado.
- Pinch-to-zoom da página travado via `touch-action: pan-y` (não `pan-x`, para não brigar com carrosséis/abas horizontais internos).
- Vazamento de cor de fundo durante "bounce" de overscroll ao arrastar rápido: múltiplas iterações (`overscroll-behavior: contain` no container de scroll de cada tela, container raiz do app trocado de `position: relative + 100vh` para `position: fixed + inset: 0`, `#root` com `height: 100dvh; overflow: hidden`). Resolução final: `body` mantém o bege `#e7e2da` (moldura visível só na web, fora do cartão mobile de 480px), `#root` fica branco `#fff` (cor do "cartão" mobile, fallback caso algo vaze atrás da status bar no celular).
- Efeito de zoom no header da tela de detalhes do lugar ao puxar a tela para baixo (overscroll no topo) — a foto de fundo (fixa/parallax) agora acompanha o gesto com um `scale` proporcional à distância arrastada.

## 19. Nav bar fixa ao rolar (todas as telas principais)

- Novo componente `FixedHeader` no design system: título + ações (botão à direita, quando houver) fixos no topo, fundo branco, sem blur, com uma linha divisória sutil que só aparece depois de ~8px de scroll — mesmo espírito da nav bar que já existia na tela de detalhes do lugar (que usa foto de fundo), mas simplificada para telas sem foto.
- Novo hook `useScrollY` (aceita um ref externo opcional, para telas que já tinham um ref próprio no container).
- Integrado nas 5 telas "raiz": Roteiro (título + botão editar), Dicas (só título), Lugares (título + botão adicionar), Atrações (só título), Mais (só título). Tela de detalhes do lugar não foi alterada — já tinha esse comportamento.

## 20. Espessura dos ícones "linear" (contorno)

- Aumentada globalmente via CSS: `--solar-stroke-width: 2` no `:root` (`@solar-icons/react` lê essa variável nativamente em todo ícone que usa `stroke`, default da biblioteca é `1.5`). Afeta todos os ícones de contorno do projeto (setinhas, `+` de Lugares, etc.) de uma vez, sem precisar editar cada componente. Ícones "bold" (tab bar) são preenchidos (`fill`), não usam `stroke` — não são afetados.

## 21. Horários de funcionamento + navegação por hambúrguer + Compras (nova tela grande) + Viajantes

- **Horários de funcionamento**: importados do Google Places API pra 157 lugares já cadastrados (`api/places/_hours.js`, `src/data/hoursSchedule.js`), armazenados estruturados por dia (`hours_schedule JSONB`). UI resumida (agrupa dias com mesmo horário, ex: "Seg a Sex: 11h-22h") com acordeão inline pra expandir e ver os 7 dias — sem modal, embutido na própria tela.
- **Navegação por hambúrguer**: adicionado `HamburgerMenuButton.jsx` à esquerda do título em todas as telas raiz (Roteiro, Dicas, Lugares, Atrações, Compras), abrindo a tela "Mais" como uma rota normal (push lateral padrão), não mais um item da tab bar. "Mais" saiu da tab bar e virou um botão só acessível pelo hambúrguer; a vaga na tab bar foi ocupada pela nova aba "Compras".
- **Viajantes (tela nova)**: lista dos 10 participantes da viagem com emoji específico cada (Luciane, Marcos, Giulia, Bruno, Maria Luiza, Anna, Nicolas, Pedro, Isabela, Marco), acessível por um item dentro de "Mais".
- **Compras (funcionalidade nova, grande)**: cada viajante tem sua própria lista de compras pessoal. Sem login — identidade do dispositivo definida uma vez via onboarding "Quem é você?" e persistida em `localStorage` (`useTravelerIdentity.js`); um dropdown na navbar permite *ver* a lista de qualquer viajante sem trocar a identidade salva do aparelho. Itens têm categoria fixa (Vestuário, Calçados, Eletrônicos, Brinquedos, Beleza, Casa, Outros — não criável pelo usuário, evita abas vazias), nome, marca, link, preço, nota, foto. Extração automática de imagem do link (og:image via fetch server-side, `api/shopping.js?action=fetchLinkImage`) com toggle pra usar/ignorar — foto manual sempre tem prioridade. Checkbox quadrado "já comprado" ao lado do preço. Aba "Resumo" (ícone, sempre primeira) agrega todas as categorias: por categoria mostra "Para comprar (N)" e "Comprado (N)" com valor; no fim, dois cards lado a lado (cinza bege padrão do projeto / verde) com o total geral. Valores acima de US$ 1.000 usam separador de milhar. 40 itens reais importados de uma planilha Excel fornecida pelo usuário (uma aba por viajante), preservando links/preços/marcas; depois rodado um backfill em lote pra extrair imagem de link nos itens que não tinham (alguns sites como Amazon/Apple bloqueiam scraping de og:image — limitação externa, não bug).
- **Card de atualização de versão**: causa raiz encontrada — o service worker já detectava quando havia uma build nova (`registerSW` com `autoUpdate`), mas nunca completava a troca (faltava escutar `onNeedRefresh` e chamar `updateSW(true)`), por isso o app nunca se atualizava sozinho de fato. Agora aparece um card preto flutuante acima da tab bar (só em telas raiz) quando detecta a versão nova — texto à esquerda, botão "Atualizar" à direita; nunca recarrega sozinho, só quando o usuário clica.
- **Tela "Mais" redesenhada como lista pura**: item de versão (hash do commit + data) ganhou o mesmo visual de lista dos demais itens, com o botão de hard refresh virando só um ícone dentro do próprio item (em vez do bloco grande separado de antes); "Ver tela de boas-vindas" no mesmo padrão. Botão de voltar da tela virou um "X" na navbar.
- **Onboarding**: adicionado um slide novo pra Compras no carrossel de boas-vindas (ícone de carrinho, foto do Vineland Premium Outlets).
- **Bug real corrigido no hook compartilhado `useElementHeight.js`**: usava `useRef` para o elemento observado por `ResizeObserver` — se o elemento só existe condicionalmente no primeiro render (ex: tela de Compras no estado "quem é você"), o observer nunca era recriado quando o elemento real aparecia depois, e a altura ficava travada em 0 pra sempre. Corrigido trocando para callback ref (dispara de novo toda vez que o nó DOM muda, inclusive de `null` pra um elemento real).
- **Bug de texto longo vazando de cards**: URLs gigantes coladas como descrição de uma recomendação (Dicas) estouravam a largura do card em vez de quebrar linha. Corrigido com `overflowWrap: 'anywhere'` em todos os campos de texto livre (RecommendationCard, RecommendationCardStack, PlaceCard, PlaceDetailScreen).
- **Mapa fullscreen do lugar refinado**: trocado o antigo iframe estático do Maps Embed por um mapa de verdade (Google Maps JS API), mesmo padrão técnico do mapa do Roteiro — pino balão, GPS, satélite, card fixo com foto/nome/endereço no rodapé. Extraído como `SinglePlaceMap.jsx`. O ícone do mini-card estático na tela de detalhe também trocou: de um círculo escuro com ícone de mapa dentro, pra um pino preto sólido solto (`MapPointIcon`), sem círculo.
- **Mapa de Lugares (tela nova)**: botão "Mapa" na navbar de Lugares, ao lado de "Adicionar" — mesmo padrão refinado do mapa do Roteiro (`DayMap.jsx`), mas adaptado: abas de categoria no header (iguais às da lista, só que independentes — não herdam subcategoria/busca/toggle "no roteiro" da tela de lista), um pino por lugar da categoria ativa, carrossel horizontal de cards sincronizado com o pino selecionado (arrastar troca de card/pino, clicar num pino pula o carrossel até ele), primeiro lugar já selecionado automaticamente ao abrir ou trocar de categoria. Extraído como `PlacesMap.jsx`; `PlaceCard.jsx` ganhou as props `bottomContent`/`style` (mesmo padrão do `AttractionCard`) pra os botões "Centralizar"/"Detalhes" ficarem dentro do próprio card, sobre a foto.
- **Bug de performance real descoberto e corrigido**: geocodificar uma categoria com 100+ lugares de uma vez (ex: 134 restaurantes) disparava uma rajada de requisições simultâneas que travava o `vercel dev` local — a `Promise.all` inteira ficava pendurada pra sempre, sem nunca resolver nem rejeitar (sintoma: "Carregando mapa..." eterno, mesmo com a API respondendo bem isoladamente via curl). Corrigido processando em lotes de 16 por vez em `useAddressesLocations.js`, atualizando o Map de coordenadas incrementalmente a cada lote.
- **Zoom inicial dos mapas**: todos os mapas (Roteiro, Atrações, Lugares) paravam de incluir a localização do usuário no cálculo de bounds — antes, se o usuário estivesse longe dos pontos do dia/parque/categoria, isso forçava um zoom-out bem maior que o necessário. Agora o enquadramento inicial foca só nos pontos cadastrados; o botão de GPS já existente continua centralizando na localização do usuário sob demanda.
- **Busca + filtros de Lugares/Atrações**: o toggle "está no roteiro" e o dropdown de área (só em Lugares) viraram botões compactos (tamanho de ícone) na mesma linha do campo de busca, em vez de ocuparem uma linha inteira abaixo dela. Toggle: quadrado com ícone de check, fundo preto quando ativo (mesmo padrão de chip ativo/inativo do projeto). Dropdown: botão ícone+seta, mantendo o mesmo `Select`/popover de sempre por trás (`Select.jsx` ganhou a prop opcional `icon` pra esse modo compacto). Ícone de fechar (X) do campo de busca trocado pra variante bold/preenchida; lupa continua linear.
- **Navbars**: botões "Adicionar" (Lugares, Dicas) e "Editar" (Roteiro) viraram só ícone, sem label de texto — os demais botões das mesmas navbars (Mapa, Carrossel, Roteiro) mantiveram o texto.

## 22. Auditoria de cache offline + taxa/conversão no resumo de Compras

- **Auditoria de cache**: revisadas todas as telas principais e de detalhe quanto a funcionar offline (stale-while-revalidate). Confirmado que Roteiro, Lugares, Atrações, Dicas e os dados "ao vivo" (clima, geocodificação, distância, fila, posições no mapa) já seguiam o padrão corretamente. Encontrados 2 problemas reais: **Compras** não tinha cache nenhum (lista sumia ao reabrir offline), e **detalhe de lugar** só "pegava carona" no cache da lista inteira (`find()` por ID), falhando em deep links quando a tela de Lugares nunca tinha sido visitada na sessão.
- **Corrigido**: novo `useShoppingScreenState.js` (cache por viajante, chave `shopping:${identity}`) integrado em `ShoppingScreen.jsx` — abre instantâneo offline e um `useEffect` mantém o cache em sincronia com qualquer mutação local (criar/editar/remover/marcar comprado), sem precisar tocar em cada handler individualmente. `usePlacesScreenState.js` ganhou `getCachedPlace`/`setCachedPlace` (chave `place:${id}`) como fallback quando a lista inteira não tem o lugar. Atrações já estava correto (`useAttractionsData` cacheia a lista de módulo, independente de qualquer tela ter montado antes) — nenhuma mudança necessária ali.
- **Resumo de Compras — taxa e conversão em real**: nos dois cards finais (Para comprar / Comprado), adicionada uma linha "Taxa: US$ X,XX (6.5%)" (imposto de vendas da Flórida — 6% estadual + 0.5% do condado de Orange/Orlando; Miami-Dade usa 7%, mas não se aplica aqui) e, numa linha abaixo, maior, o total já com taxa convertido em real (🇧🇷 R$ ...). Cotação USD→BRL buscada em tempo real via AwesomeAPI (gratuita, sem chave), consolidada em `/api/weather.js?action=exchangeRate` (projeto já estava no limite de 12 Serverless Functions do Hobby, por isso virou uma action a mais em vez de arquivo novo) — novo hook `useExchangeRate.js` com cache de 1h e fallback pra última cotação conhecida offline. Valor em dólar com bandeira 🇺🇸 à esquerda (texto da taxa fica sem bandeira, só os dois valores principais têm).
- **Ícones nos cards finais**: "Para comprar" ganhou `ClipboardListIcon` (listinha), "Comprado" ganhou `BillCheckIcon` (cheque) — ambos de `@solar-icons/react/bold/*` (existem só no diretório `dist/icons/bold`, não aparecem num `find` direto na pasta `bold/` do pacote por causa do wildcard de exports).

---

## Estado atual

Tudo commitado e publicado em produção até o commit `766cb65` ("Cache offline em Compras e detalhe de lugar; taxa/conversão e ícones no resumo de Compras").

## Combinados de processo (importante lembrar)

- **Não fazer commit/push/deploy automaticamente.** Só editar e validar localmente (`vite build`) até o usuário pedir explicitamente ("comita", "sobe pra produção", "builda", "pode publicar").
- **Verificação visual obrigatória em mudanças de UI**: usar Playwright (`npm install --no-save playwright` temporário, screenshot, depois `npm uninstall playwright --no-save`) contra o `vercel dev` já rodando em `localhost:3000` antes de reportar qualquer ajuste visual como pronto.
- **Não matar o `vercel dev` da porta 3000 após verificações.** O usuário mantém sua própria instância rodando lá o tempo todo pra testar manualmente (dá hard refresh quando quer ver mudanças novas) — nunca rodar `pkill` nesse processo no cleanup pós-verificação.
- Deploy sempre roda a partir da raiz do repo (`/Users/becampanha/Development/app-tripmy-26`, não `app/`), via `vercel --prod --yes` — é onde o `.vercel/project.json` está linkado.
- `vercel dev` local tem instabilidades conhecidas: pode matar a função Node ~600ms-1s depois de responder (esconde bugs de async não aguardado) e trava sob rajadas grandes de requisições simultâneas (>~20-30 ao mesmo tempo) — qualquer tela que precise geocodificar/buscar muitos endereços de uma vez deve processar em lotes, não tudo de uma vez.

## Pendências / ideias não implementadas

- Magic Kingdom tinha uma nota de estratégia livre na planilha original (texto corrido sobre ordem de visitar atrações) que não foi incorporada à tela — só as atrações estruturadas foram importadas. Se o usuário quiser, dá pra pensar num lugar para esse tipo de anotação por parque.
- Não confirmado se o vazamento de cor bege durante overscroll rápido foi 100% resolvido — última correção aplicada e publicada, mas sem teste de confirmação do usuário depois dela.
- 9 lugares criados em Disney Springs durante a rodada de recomendações (Six Ravens, Level99, Paradiso 37, Frontera Cocina, D-Luxe Burger, The Daily Poutine, Pepe by Jose Andres, Jock Lindsey's, Vivoli il Gelato, Salt & Straw) ficaram **sem recomendação** — usuário optou por pular essas na aprovação item a item.
- Extração automática de imagem de link não funciona em sites com proteção anti-bot forte (Amazon, Apple, Ralph Lauren, American Eagle, Vans confirmados) — limitação externa, sem solução no momento.
- Testar o app localmente a partir de um iPhone fora da mesma rede Wi-Fi do computador ainda não foi resolvido (precisaria de um deploy de preview da Vercel, que o usuário pediu pra não fazer por enquanto — só produção, quando ele pedir).
