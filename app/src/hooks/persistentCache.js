// Cache simples em localStorage: os dados sobrevivem a fechar o app/aba,
// reabrir dias depois, etc — não só à navegação dentro da sessão atual.
// Usado para o roteiro e a lista de lugares aparecerem instantâneos ao
// abrir o app, sem esperar a rede, mesmo numa sessão totalmente nova.
const PREFIX = 'cronograma-cache:';

export function readCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Armazenamento cheio ou indisponível (modo privado, etc) — segue sem
    // persistir; o cache em memória do módulo ainda cobre a sessão atual.
  }
}
