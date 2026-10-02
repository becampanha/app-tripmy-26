import { getSql } from './_db.js';

// IDs de destino da API pública ThemeParks.wiki (api.themeparks.wiki/v1)
// para cada park_id usado na tabela `attractions` — sem autenticação, dados
// de fila ao vivo por atração. Confirmados via /v1/destinations.
const THEMEPARKS_ENTITY_ID = {
  'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
  epcot: '47f90d2c-e191-4239-a466-5892ef59a88b',
  'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
  'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693',
  'islands-of-adventure': '267615cc-8943-4c2a-ae2c-5da728ca591f',
  'universal-studios': 'eb3f4560-2383-4a36-9152-6b3e5ed6bc57',
  epic: '12dbb85b-265f-44e6-bccf-f1faa17211fc',
};

// Normaliza nome de atração para comparação tolerante a diferenças de
// acentuação/pontuação entre a planilha original e a API externa (ex:
// apóstrofo curvo vs reto, "®"/"™", maiúsculas).
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

async function listAttractions(req, res) {
  const sql = getSql();
  const rows = await sql.query(`
    SELECT * FROM attractions
    ORDER BY park_sort_order, area_sort_order, sort_order
  `);
  const strategyRows = await sql.query(`SELECT park_id, summary, route FROM park_strategies`);
  const strategyByPark = new Map(strategyRows.map((r) => [r.park_id, r]));

  const parksById = new Map();
  for (const r of rows) {
    if (!parksById.has(r.park_id)) {
      const strategy = strategyByPark.get(r.park_id);
      parksById.set(r.park_id, {
        id: r.park_id,
        name: r.park_name,
        emoji: r.park_emoji,
        strategy: strategy?.summary || null,
        route: strategy?.route || null,
        areas: [],
      });
    }
    const park = parksById.get(r.park_id);
    let area = park.areas.find((a) => a.name === r.area);
    if (!area) {
      area = { name: r.area, attractions: [] };
      park.areas.push(area);
    }
    area.attractions.push({
      id: r.id,
      name: r.name,
      required: r.required,
      type: r.type,
      duration: r.duration,
      queue: r.queue_time,
      bestTime: r.best_time,
      restrictions: r.restrictions,
      parentSwap: r.parent_swap,
      intensity: r.intensity,
      photo: r.photo,
      youtubeVideoId: r.youtube_video_id,
    });
  }

  return res.status(200).json(Array.from(parksById.values()));
}

// GET /api/attractions?action=live — fila em tempo real de todos os parques,
// via ThemeParks.wiki. Devolve um mapa { [nomeNormalizado]: { waitTime, status } }
// pronto pro frontend casar com attraction.name sem reimplementar a
// normalização dos dois lados.
async function liveQueueTimes(req, res) {
  const entries = Object.entries(THEMEPARKS_ENTITY_ID);

  const results = await Promise.all(
    entries.map(async ([parkId, entityId]) => {
      try {
        const response = await fetch(`https://api.themeparks.wiki/v1/entity/${entityId}/live`);
        if (!response.ok) return { parkId, liveData: [] };
        const data = await response.json();
        return { parkId, liveData: data.liveData || [] };
      } catch {
        return { parkId, liveData: [] };
      }
    })
  );

  const byName = {};
  for (const { liveData } of results) {
    for (const item of liveData) {
      if (item.entityType !== 'ATTRACTION') continue;
      const waitTime = item.queue?.STANDBY?.waitTime;
      byName[normalizeName(item.name)] = {
        status: item.status || null,
        waitTime: typeof waitTime === 'number' ? waitTime : null,
      };
    }
  }

  // Curto de propósito: a própria ThemeParks.wiki já atualiza os dados em
  // intervalos regulares, isso só evita bater na API a cada re-render.
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  return res.status(200).json(byName);
}

// GET /api/attractions?action=locations&park=<park_id> — coordenadas de cada
// atração de UM parque, via ThemeParks.wiki. Um parque por vez (não todos de
// uma vez como em liveQueueTimes) porque o mapa só é aberto sob demanda.
async function locations(req, res) {
  const parkId = req.query.park;
  const entityId = THEMEPARKS_ENTITY_ID[parkId];
  if (!entityId) {
    return res.status(400).json({ error: 'Parâmetro "park" inválido ou ausente', valid: Object.keys(THEMEPARKS_ENTITY_ID) });
  }

  const response = await fetch(`https://api.themeparks.wiki/v1/entity/${entityId}/children`);
  if (!response.ok) {
    return res.status(502).json({ error: 'Falha ao consultar ThemeParks.wiki' });
  }
  const data = await response.json();

  const byName = {};
  for (const child of data.children || []) {
    if (child.entityType !== 'ATTRACTION' || !child.location) continue;
    byName[normalizeName(child.name)] = {
      lat: child.location.latitude,
      lng: child.location.longitude,
    };
  }

  // Layout do parque não muda de um dia pro outro — cache mais longo que o
  // da fila ao vivo, que precisa ficar fresco.
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).json(byName);
}

// PUT /api/attractions?action=update&id=<id> — edita campos de uma atração.
// Só `required` ("está no roteiro") e `youtubeVideoId` (link do vídeo
// mostrando a atração, cadastrado manualmente) são editáveis — os demais
// campos vêm fixos da planilha original importada.
const ATTRACTION_FIELD_MAP = { required: 'required', youtubeVideoId: 'youtube_video_id' };

async function updateAttraction(req, res) {
  const sql = getSql();
  const { id } = req.query;
  const body = req.body || {};

  const fields = [];
  const values = [];
  let i = 1;
  for (const [key, column] of Object.entries(ATTRACTION_FIELD_MAP)) {
    if (body[key] === undefined) continue;
    fields.push(`${column} = $${i++}`);
    values.push(body[key]);
  }

  if (!id || fields.length === 0) {
    return res.status(400).json({ error: 'Parâmetro "id" e ao menos um campo editável são obrigatórios' });
  }

  values.push(id);
  await sql.query(`UPDATE attractions SET ${fields.join(', ')} WHERE id = $${i}`, values);
  return res.status(200).json({ ok: true });
}

// PUT /api/attractions?action=updateStrategy&park=<park_id> — edita o texto
// de estratégia ("Como aproveitar o dia") e/ou a ordem sugerida de atrações
// (route, array de nomes) de um parque. Upsert: alguns parques ainda não
// têm linha em park_strategies (ver comentário em db/schema.sql).
async function updateStrategy(req, res) {
  const sql = getSql();
  const parkId = req.query.park;
  const body = req.body || {};

  if (!parkId || (body.summary === undefined && body.route === undefined)) {
    return res.status(400).json({ error: 'Parâmetro "park" e ao menos um campo (summary ou route) são obrigatórios' });
  }

  const current = await sql.query('SELECT summary, route FROM park_strategies WHERE park_id = $1', [parkId]);
  const summary = body.summary !== undefined ? body.summary : current[0]?.summary || '';
  const route = body.route !== undefined ? JSON.stringify(body.route) : current[0]?.route ? JSON.stringify(current[0].route) : null;

  await sql.query(
    `INSERT INTO park_strategies (park_id, summary, route, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (park_id) DO UPDATE SET summary = $2, route = $3, updated_at = now()`,
    [parkId, summary, route]
  );
  return res.status(200).json({ ok: true });
}

const ACTIONS = { live: liveQueueTimes, locations };
const WRITE_ACTIONS = { update: updateAttraction, updateStrategy };

// GET /api/attractions — retorna todas as atrações agrupadas por parque e
// área, já ordenadas (park_sort_order, area_sort_order, sort_order — a
// mesma ordem em que apareciam na planilha original).
// GET /api/attractions?action=live — fila em tempo real (ver liveQueueTimes).
// GET /api/attractions?action=locations&park=<id> — coordenadas (ver locations).
// PUT /api/attractions?action=update&id=<id> — ver updateAttraction.
export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const writeAction = WRITE_ACTIONS[req.query.action];
    if (!writeAction) {
      return res.status(400).json({ error: 'Parâmetro "action" inválido para PUT' });
    }
    return writeAction(req, res);
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = ACTIONS[req.query.action];
  if (action) {
    return action(req, res);
  }

  return listAttractions(req, res);
}
