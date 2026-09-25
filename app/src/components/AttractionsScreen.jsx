import { useEffect, useMemo, useState } from 'react';
import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { CloseCircleIcon } from '@solar-icons/react/linear/close-circle';
import AttractionCard from './AttractionCard.jsx';
import { fetchAttractions } from '../api/itineraryApi.js';
import { useDragScroll } from '../hooks/useDragScroll.js';
import { readCache, writeCache } from '../hooks/persistentCache.js';

function AttractionCardSkeleton() {
  return (
    <div
      style={{
        height: 132,
        marginBottom: 10,
        borderRadius: 18,
        background: '#f9f7f2',
        animation: 'pulse 1.2s ease-in-out infinite',
      }}
    />
  );
}

// Mesmo padrão visual/funcional da tela de Lugares: abas com scroll
// horizontal (aqui, um parque por aba) + seções sticky por área + busca.
export default function AttractionsScreen() {
  const cached = readCache('attractions');
  const [parks, setParks] = useState(cached || []);
  const [loading, setLoading] = useState(cached === null);
  const [parkIndex, setParkIndex] = useState(0);
  const [search, setSearch] = useState('');
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();

  useEffect(() => {
    fetchAttractions()
      .then((data) => {
        setParks(data);
        writeCache('attractions', data);
      })
      .finally(() => setLoading(false));
  }, []);

  const park = parks[parkIndex];

  const sections = useMemo(() => {
    if (!park) return [];
    const query = search.trim().toLowerCase();
    return park.areas
      .map((area) => ({
        name: area.name,
        attractions: query
          ? area.attractions.filter((a) => a.name.toLowerCase().includes(query))
          : area.attractions,
      }))
      .filter((area) => area.attractions.length > 0);
  }, [park, search]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box' }}>
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.3, color: '#1c1a17' }}>
          Atrações
        </div>

        <div
          ref={scrollerRef}
          {...dragHandlers}
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            marginTop: 16,
            padding: '2px 2px 6px',
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {loading && parks.length === 0 && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ flex: 'none', width: 120, height: 36, borderRadius: 14, background: '#f9f7f2', animation: 'pulse 1.2s ease-in-out infinite' }} />
          ))}

          {parks.map((p, i) => {
            const active = i === parkIndex;
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (dragRef.current && dragRef.current.moved) return;
                  setParkIndex(i);
                }}
                style={{
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 14,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: active ? '#1c1a17' : '#f9f7f2',
                  color: active ? '#fff' : '#6b6459',
                }}
              >
                <span>{p.emoji}</span>
                {p.name}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          boxSizing: 'border-box',
          padding: '2px 22px 120px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            borderRadius: 12,
            border: '1px solid #ececec',
            background: '#fff',
            marginBottom: 16,
          }}
        >
          <MagnifierIcon size={14} color="#b3ab9c" style={{ flex: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar atração"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#1c1a17',
              fontSize: 13,
              fontWeight: 600,
            }}
          />
          {search && (
            <div onClick={() => setSearch('')} style={{ flex: 'none', cursor: 'pointer', display: 'flex' }}>
              <CloseCircleIcon size={14} color="#b3ab9c" />
            </div>
          )}
        </div>

        {loading && parks.length === 0 && Array.from({ length: 4 }).map((_, i) => <AttractionCardSkeleton key={i} />)}

        {!loading && park && sections.map((section) => (
          <div key={section.name}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                background: '#fff',
                padding: '10px 0',
                marginBottom: 4,
                color: '#1c1a17',
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: -0.1,
              }}
            >
              {section.name}
            </div>
            {section.attractions.map((attraction) => (
              <AttractionCard key={attraction.id} attraction={attraction} />
            ))}
          </div>
        ))}

        {!loading && park && sections.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma atração encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
