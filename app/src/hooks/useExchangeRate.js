import { useEffect, useState } from 'react';

// Cotação USD->BRL pra tela de Compras (resumo): busca em tempo real, com
// cache TTL curto (1h, câmbio muda mais rápido que clima) e fallback pra
// última cotação conhecida quando offline ou a API falha — nunca deixa o
// valor em real sumir da tela, só fica potencialmente desatualizado.
const CACHE_KEY = 'exchangeRate:USD-BRL';
const CACHE_TTL_MS = 60 * 60 * 1000;

function cacheGet() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cacheSet(rate) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, savedAt: Date.now() }));
  } catch {
    // localStorage indisponível/cheio — segue sem cache
  }
}

export function useExchangeRate() {
  const [rate, setRate] = useState(() => cacheGet()?.rate ?? null);

  useEffect(() => {
    const cached = cacheGet();
    const isFresh = cached && Date.now() - cached.savedAt < CACHE_TTL_MS;
    if (isFresh) return;

    fetch('/api/weather?action=exchangeRate')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rate) {
          setRate(data.rate);
          cacheSet(data.rate);
        }
      })
      .catch(() => {
        // Sem internet ou API fora do ar — mantém o valor em cache (se houver).
      });
  }, []);

  return rate;
}
