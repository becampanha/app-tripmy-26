import { put } from '@vercel/blob';

// POST /api/places/upload — recebe { filename, contentType, base64 } como JSON
// e salva no Vercel Blob, retornando a URL pública.
//
// O runtime local (Vercel Functions + Vite) só popula `req.body` para
// Content-Types que ele reconhece como parseáveis (JSON, form). Para
// Content-Type de imagem bruta, `req.body` fica undefined e o stream `req`
// já vem drenado (readableEnded: true) antes do handler rodar — não há como
// ler o binário bruto de forma confiável nesse ambiente. Por isso o upload
// vai em base64 dentro de um JSON, que o parser sempre processa.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, contentType, base64 } = req.body || {};
  if (!filename || !base64) {
    return res.status(400).json({ error: 'Campos "filename" e "base64" são obrigatórios' });
  }

  try {
    const buffer = Buffer.from(base64, 'base64');

    // Token passado explicitamente: o ambiente também tem VERCEL_OIDC_TOKEN +
    // BLOB_STORE_ID de um store antigo, e o SDK prioriza OIDC sobre
    // BLOB_READ_WRITE_TOKEN quando ambos existem — sem isso, o upload iria
    // parar no store errado.
    const blob = await put(`places/${Date.now()}-${filename}`, buffer, {
      access: 'public',
      contentType: contentType || 'image/jpeg',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    return res.status(500).json({ error: 'Falha no upload', details: err.message });
  }
}
