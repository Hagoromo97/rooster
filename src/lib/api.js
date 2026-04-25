const API_BASE = '/api';

export const apiClient = {
  async fetchResources() {
    const res = await fetch(`${API_BASE}/resources`);
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  async fetchEvents() {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async fetchDrivers() {
    const res = await fetch(`${API_BASE}/drivers`);
    if (!res.ok) throw new Error('Failed to fetch drivers');
    return res.json();
  },

  async fetchRouteGroups() {
    const res = await fetch(`${API_BASE}/route-groups`);
    if (!res.ok) throw new Error('Failed to fetch route groups');
    return res.json();
  },

  async createRouteGroup(name) {
    const res = await fetch(`${API_BASE}/route-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create route group');
    return res.json();
  },

  async updateRouteGroup(name, newName) {
    const res = await fetch(`${API_BASE}/route-groups`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, newName }),
    });
    if (!res.ok) throw new Error('Failed to update route group');
    return res.json();
  },

  async deleteRouteGroup(name) {
    const res = await fetch(`${API_BASE}/route-groups`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to delete route group');
    return res.json();
  },

  async createResource(resource) {
    const res = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resource),
    });
    if (!res.ok) throw new Error('Failed to create resource');
    return res.json();
  },

  async updateResource(resource) {
    const res = await fetch(`${API_BASE}/resources`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resource),
    });
    if (!res.ok) throw new Error('Failed to update resource');
    return res.json();
  },

  async deleteResource(id) {
    const res = await fetch(`${API_BASE}/resources`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Failed to delete resource');
    return res.json();
  },

  async createEvent(event) {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  async updateEvent(event) {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
  },

  async deleteEvent(id) {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Failed to delete event');
    return res.json();
  },

  async createDriver(driver) {
    const res = await fetch(`${API_BASE}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    });
    if (!res.ok) throw new Error('Failed to create driver');
    return res.json();
  },

  async updateDriver(driver) {
    const res = await fetch(`${API_BASE}/drivers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    });
    if (!res.ok) throw new Error('Failed to update driver');
    return res.json();
  },

  async deleteDriver(id) {
    const res = await fetch(`${API_BASE}/drivers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Failed to delete driver');
    return res.json();
  },
};
