# Registro da sessão — Family Trip

Resumo prático de tudo que foi pedido e implementado nesta sessão, em ordem cronológica. Serve como referência caso o histórico de conversa se perca — para retomar, basta reabrir o Claude Code neste diretório e citar este arquivo.

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

---

## Estado atual

Tudo commitado e publicado em produção (`app-xi-one-11.vercel.app`) até o commit `35dca98` ("EditActionBar, sistema de toast e nova tela de Atrações").

## Pendências / ideias não implementadas

- Magic Kingdom tinha uma nota de estratégia livre na planilha original (texto corrido sobre ordem de visitar atrações) que não foi incorporada à tela — só as atrações estruturadas foram importadas. Se o usuário quiser, dá pra pensar num lugar para esse tipo de anotação por parque.
