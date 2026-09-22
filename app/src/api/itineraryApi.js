async function request(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options && options.headers) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Falha na requisição: ${res.status}`);
  }
  return res.json();
}

export function createActivity({ dayId, time, title, subtitle, address, placeId }) {
  return request('/api/activities', {
    method: 'POST',
    body: JSON.stringify({ dayId, time, title, subtitle, address, placeId }),
  });
}

export function updateActivity(id, fields) {
  return request(`/api/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export function deleteActivity(id) {
  return request(`/api/activities/${id}`, { method: 'DELETE' });
}

export function reorderActivities(items) {
  return request('/api/activities/reorder', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function fetchPlaces() {
  return request('/api/places');
}
