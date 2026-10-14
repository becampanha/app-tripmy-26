import { getSql } from './_db.js';

// Mesma lista de src/data/shoppingCategories.js (não importável aqui — API
// roda fora do bundle do Vite) — barra na origem a categoria inválida que já
// causou um bug real (item gravado com a chave interna "__summary__" da aba
// Resumo em vez de uma categoria de produto, inflando o total geral sem
// aparecer em nenhum card de categoria).
const VALID_CATEGORIES = ['Vestuário', 'Calçados', 'Eletrônicos', 'Brinquedos', 'Beleza', 'Casa', 'Outros'];

// GET    /api/shopping?traveler=... — lista os itens de um viajante
// GET    /api/shopping?action=fetchLinkImage&url=... — extrai a og:image da
//        página de um link, pra pré-visualizar no cadastro/edição de item
//        (ver ShoppingItemModal.jsx) — rodado no servidor porque sites como
//        Amazon/Ralph Lauren bloqueiam essa requisição por CORS se feita
//        direto do navegador.
// POST   /api/shopping — cria um item novo
// PUT    /api/shopping?id=... — edita um item
// PUT    /api/shopping?id=...&action=togglePurchased — body: { purchased }
//        marca/desmarca "comprado", sem precisar reenviar o item inteiro
//        (ver o check no card, ShoppingScreen.jsx)
// DELETE /api/shopping?id=... — remove um item
async function fetchLinkImage(req, res) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "url" é obrigatório' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Vários sites (Amazon incluso) recusam ou servem HTML incompleto
        // pra requisições sem User-Agent de navegador.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(200).json({ image: null });
    }

    // Só lê os primeiros ~300KB do HTML — as tags og:image/twitter:image
    // quase sempre ficam no <head>, bem no início do documento; páginas de
    // e-commerce podem ter HTML de vários MB, sem necessidade de baixar
    // tudo isso só pra achar uma meta tag.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = '';
    while (html.length < 300_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});

    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    const image = ogMatch?.[1] || twitterMatch?.[1] || null;
    return res.status(200).json({ image: image ? image.replace(/&amp;/g, '&') : null });
  } catch (err) {
    // Link fora do ar, timeout, bloqueio do site — não é um erro fatal pro
    // usuário, só significa "essa imagem não está disponível".
    return res.status(200).json({ image: null });
  }
}

export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'GET' && req.query.action === 'fetchLinkImage') {
    return fetchLinkImage(req, res);
  }

  if (req.method === 'GET') {
    const { traveler } = req.query;
    if (!traveler || typeof traveler !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "traveler" é obrigatório' });
    }

    const rows = await sql.query(
      'SELECT * FROM shopping_items WHERE traveler = $1 ORDER BY created_at DESC',
      [traveler]
    );

    const items = rows.map((r) => ({
      id: r.id,
      traveler: r.traveler,
      category: r.category,
      name: r.name,
      brand: r.brand,
      link: r.link,
      price: r.price,
      notes: r.notes,
      photo: r.photo,
      linkImage: r.link_image,
      useLinkImage: r.use_link_image,
      purchased: r.purchased,
      createdAt: r.created_at,
    }));

    return res.status(200).json(items);
  }

  if (req.method === 'POST') {
    const { traveler, category, name, brand, link, price, notes, photo, linkImage, useLinkImage } = req.body || {};
    if (!traveler || !category || !name) {
      return res.status(400).json({ error: 'Campos "traveler", "category" e "name" são obrigatórios' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `"category" inválida: ${category}` });
    }

    const rows = await sql.query(
      `INSERT INTO shopping_items (traveler, category, name, brand, link, price, notes, photo, link_image, use_link_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [traveler, category, name, brand || null, link || null, price ?? null, notes || null, photo || null, linkImage || null, Boolean(useLinkImage)]
    );

    const r = rows[0];
    return res.status(201).json({
      id: r.id,
      traveler: r.traveler,
      category: r.category,
      name: r.name,
      brand: r.brand,
      link: r.link,
      price: r.price,
      notes: r.notes,
      photo: r.photo,
      linkImage: r.link_image,
      useLinkImage: r.use_link_image,
      purchased: r.purchased,
      createdAt: r.created_at,
    });
  }

  if (req.method === 'PUT') {
    const { id, action } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }

    if (action === 'togglePurchased') {
      const { purchased } = req.body || {};
      await sql.query('UPDATE shopping_items SET purchased = $1 WHERE id = $2', [Boolean(purchased), id]);
      return res.status(200).json({ ok: true });
    }

    const { category, name, brand, link, price, notes, photo, linkImage, useLinkImage } = req.body || {};
    if (!category || !name) {
      return res.status(400).json({ error: 'Campos "category" e "name" são obrigatórios' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `"category" inválida: ${category}` });
    }

    await sql.query(
      'UPDATE shopping_items SET category = $1, name = $2, brand = $3, link = $4, price = $5, notes = $6, photo = $7, link_image = $8, use_link_image = $9 WHERE id = $10',
      [category, name, brand || null, link || null, price ?? null, notes || null, photo || null, linkImage || null, Boolean(useLinkImage), id]
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }
    await sql.query('DELETE FROM shopping_items WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
