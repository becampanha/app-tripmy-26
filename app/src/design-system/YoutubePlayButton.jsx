import { PlayIcon } from '@solar-icons/react/bold/play';

// Ícone de play puro, branco, sem nenhum fundo/círculo — usado sobre a foto
// do header de Atrações e sobre a thumbnail/capa de vídeo em Dicas.
export default function YoutubePlayButton({ size = 56 }) {
  return (
    <PlayIcon
      size={size}
      color="#fff"
      style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))' }}
    />
  );
}
