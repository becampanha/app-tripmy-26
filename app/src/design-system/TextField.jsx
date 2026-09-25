import { useEffect, useRef, useState } from 'react';
import { color, type } from './tokens.js';

export function FieldLabel({ children }) {
  return (
    <div style={{ ...type.eyebrow, color: color.faintIcon }}>
      {children}
    </div>
  );
}

export const inputStyle = {
  border: `1px solid ${color.imagePlaceholder}`,
  borderRadius: 8,
  padding: '6px 8px',
  ...type.input,
  color: color.dark,
  width: '100%',
  boxSizing: 'border-box',
};

// Input com estado local: digita fluido na tela sem esperar rede a cada
// tecla, e só dispara onCommit (que salva na API) 500ms depois de parar
// de digitar, ou imediatamente ao sair do campo.
// cancelToken: ao mudar de valor, invalida qualquer timer de debounce pendente
// sem commitar — usado pelo botão Cancelar do modo edição, para garantir que
// nenhum PUT atrasado sobrescreva o revert já aplicado.
export default function TextField({ value, onCommit, cancelToken, style, ...props }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);
  const canceledRef = useRef(false);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (cancelToken === undefined) return;
    clearTimeout(timerRef.current);
    canceledRef.current = true;
  }, [cancelToken]);

  const handleChange = (e) => {
    const next = e.target.value;
    setLocal(next);
    clearTimeout(timerRef.current);
    canceledRef.current = false;
    timerRef.current = setTimeout(() => onCommit(next), 500);
  };

  const handleBlur = () => {
    clearTimeout(timerRef.current);
    if (canceledRef.current) return;
    if (local !== value) onCommit(local);
  };

  return (
    <input
      {...props}
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{ ...inputStyle, ...style }}
    />
  );
}
