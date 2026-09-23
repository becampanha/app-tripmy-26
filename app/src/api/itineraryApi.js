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

export function fetchItinerary() {
  return request('/api/itinerary');
}

export function updateDay(id, fields) {
  return request(`/api/days/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export function createPlace(fields) {
  return request('/api/places', {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

export function searchGooglePlaces(query) {
  return request(`/api/places/google?action=search&q=${encodeURIComponent(query)}`).then(
    (data) => data.places || []
  );
}

export function importGooglePlacePhotos(placeId) {
  return request(`/api/places/google?action=importPhotos&placeId=${encodeURIComponent(placeId)}`);
}

export function updatePlace(id, fields) {
  return request(`/api/places/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export function deletePlace(id) {
  return request(`/api/places/${id}`, { method: 'DELETE' });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadPlacePhoto(file) {
  const base64 = await fileToBase64(file);
  return request('/api/places/upload', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/jpeg', base64 }),
  });
}

export function fetchRecommendations(placeId) {
  return request(`/api/places/recommendations?placeId=${encodeURIComponent(placeId)}`);
}

export function createRecommendation({ placeId, description, photo }) {
  return request('/api/places/recommendations', {
    method: 'POST',
    body: JSON.stringify({ placeId, description, photo }),
  });
}
