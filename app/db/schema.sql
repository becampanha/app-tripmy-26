-- Catálogo de lugares (restaurantes, lojas, parques, mercados)
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,               -- place_id do Google, ou "xlsx-<slug>" para fallback
  name TEXT NOT NULL,
  category TEXT NOT NULL,            -- Restaurante | Mercado | Loja | Parque | Hotel | Aeroporto | Outro
  subcategory TEXT,                  -- opcional; lista de opções varia por category (ex: área/zona para Restaurante)
  tag TEXT,                          -- ex: "🍕 Pizza"
  address TEXT,
  rating REAL,
  google_maps_uri TEXT,
  photo TEXT,                        -- caminho da foto de fachada
  dish_photos JSONB DEFAULT '[]',    -- array de caminhos de fotos de prato/produto
  cost REAL,
  hours TEXT,
  distance_from_hotel REAL,
  menu_label TEXT,
  review_label TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dias do roteiro
CREATE TABLE IF NOT EXISTS days (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,                -- "25/12"
  weekday TEXT NOT NULL,             -- "Sex"
  theme TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

-- Itens/atividades de cada dia
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  address TEXT,                      -- endereço verificado, texto livre (legado)
  place_id TEXT REFERENCES places(id) ON DELETE SET NULL,  -- vínculo opcional a um lugar do catálogo
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_day_id ON activities(day_id);
CREATE INDEX IF NOT EXISTS idx_activities_place_id ON activities(place_id);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
