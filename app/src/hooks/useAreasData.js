import { useEffect, useState } from 'react';
import { fetchAreas } from '../api/itineraryApi.js';
import { readCache, writeCache } from './persistentCache.js';
import { cachedAreasByCategory, setCachedAreasByCategory } from '../data/subcategories.js';

// Mesmo padrão de useAttractionsData.js — busca a lista inteira (agrupada por
// categoria, { "Restaurante": [{id,name}, ...], ... }) e mantém um espelho em
// memória de módulo (em subcategories.js, consumido por subcategoriesFor —
// que fica síncrona) + localStorage em sincronia a cada mutação otimista.
export function useAreasData() {
  const [areasByCategory, setAreasByCategory] = useState(cachedAreasByCategory || {});
  const [loading, setLoading] = useState(cachedAreasByCategory === null);

  useEffect(() => {
    fetchAreas()
      .then((data) => {
        setCachedAreasByCategory(data);
        writeCache('placeAreas', data);
        setAreasByCategory(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (Object.keys(areasByCategory).length === 0) return;
    setCachedAreasByCategory(areasByCategory);
    writeCache('placeAreas', areasByCategory);
  }, [areasByCategory]);

  return { areasByCategory, setAreasByCategory, loading };
}
