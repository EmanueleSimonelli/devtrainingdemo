const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export function getDeals(params = {}) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== undefined && v !== null) qs.set(k, v)
  }
  const query = qs.toString()
  return request(`/deals${query ? `?${query}` : ''}`)
}

export function getDeal(dealId) {
  return request(`/deals/${dealId}`)
}

export function createDeal(body) {
  return request('/deals', { method: 'POST', body: JSON.stringify(body) })
}

export function getBuyers() {
  return request('/buyers')
}

export function getPublishers() {
  return request('/publishers')
}

export function getStates() {
  return request('/states')
}
