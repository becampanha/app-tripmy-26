import { useEffect, useState } from 'react';
import { fetchAttractions } from '../api/itineraryApi.js';
import { readCache, writeCache } from './persistentCache.js';

// Espelho em memória de módulo do cache — evita reler e reparsear o
// localStorage a cada render (mesmo padrão de useItinerary.js). Único pro
// módulo inteiro (não por instância do hook), pra todo consumidor (lista,
// mapa, detalhe, roteiro de atrações) começar com o mesmo dado otimista e
// ficar em sincronia.
let cachedParks = readCache('attractions');

export function useAttractionsData() {
  const [parks, setParks] = useState(cachedParks || []);
  const [loading, setLoading] = useState(cachedParks === null);

  useEffect(() => {
    fetchAttractions()
      .then((data) => {
        cachedParks = data;
        writeCache('attractions', data);
        setParks(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Qualquer consumidor que faça uma atualização otimista (ex: toggle
  // "Está no roteiro") só precisa chamar setParks — o espelho em memória e o
  // localStorage são mantidos em sincronia aqui, não espalhados em cada tela.
  useEffect(() => {
    if (parks.length === 0) return;
    cachedParks = parks;
    writeCache('attractions', parks);
  }, [parks]);

  return { parks, setParks, loading };
}
