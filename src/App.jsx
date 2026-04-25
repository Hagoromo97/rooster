import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

const INIT_RESOURCES = [
  { id: 'room-a', title: 'Ruang A' },
  { id: 'room-b', title: 'Ruang B' },
  { id: 'room-c', title: 'Ruang C' },
  { id: 'room-d', title: 'Ruang D' },
];

const INIT_EVENTS = [
  { id: 'evt-1', resourceId: 'room-a', title: 'Meeting Tim Produk', start: '2026-04-24T09:00:00', end: '2026-04-24T11:00:00' },
  { id: 'evt-2', resourceId: 'room-b', title: 'Sprint Planning',    start: '2026-04-24T10:00:00', end: '2026-04-24T12:30:00' },
  { id: 'evt-3', resourceId: 'room-c', title: 'Client Review',      start: '2026-04-25T13:00:00', end: '2026-04-25T15:00:00' },
  { id: 'evt-4', resourceId: 'room-d', title: 'Workshop Internal',  start: '2026-04-26T08:30:00', end: '2026-04-26T11:30:00' },
];

const EMPTY_ROUTE = { title: '' };
const EMPTY_EVENT = { title: '', resourceId: '', start: '', end: '', color: '#3b82f6' };

export default function App() {
  const [theme, setTheme] = useState('light');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState('resourceTimelineWeek');
  const calendarRef = useRef(null);

  const [resources, setResources] = useState(INIT_RESOURCES);
  const [events, setEvents]       = useState(INIT_EVENTS);

  // modals
  const [routeModal, setRouteModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [editModal,  setEditModal]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);

  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [editForm,  setEditForm]  = useState(EMPTY_EVENT);
  const [eventDateMode, setEventDateMode] = useState('custom');
  const [eventDurationDays, setEventDurationDays] = useState(1);
  const [editDateMode, setEditDateMode] = useState('custom');
  const [editDurationDays, setEditDurationDays] = useState(1);

  function addDaysToDate(startDate, daysToAdd) {
    if (!startDate) return '';
    const safeDays = Math.max(1, Number(daysToAdd) || 1);
    const date = new Date(startDate + 'T00:00:00');
    date.setDate(date.getDate() + safeDays);
    return date.toISOString().slice(0, 10);
  }

  function getDurationInDays(startDate, endDate) {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffMs = end.getTime() - start.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) return 1;
    return Math.max(1, Math.round(diffMs / 86400000));
  }

  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }

  function saveRoute() {
    if (!routeForm.title.trim()) return;
    const id = 'route-' + Date.now();
    setResources((prev) => [...prev, { id, title: routeForm.title.trim() }]);
    setRouteModal(false);
    setRouteForm(EMPTY_ROUTE);
  }

  function saveEvent() {
    const finalEnd = eventDateMode === 'duration'
      ? addDaysToDate(eventForm.start, eventDurationDays)
      : eventForm.end;

    if (!eventForm.title.trim() || !eventForm.resourceId || !eventForm.start || !finalEnd) return;
    const id = 'evt-' + Date.now();
    setEvents((prev) => [...prev, { id, ...eventForm, end: finalEnd }]);
    setEventModal(false);
    setEventForm(EMPTY_EVENT);
    setEventDateMode('custom');
    setEventDurationDays(1);
  }

  function openEventModal() {
    setEventForm(EMPTY_EVENT);
    setEventDateMode('custom');
    setEventDurationDays(1);
    setEventModal(true);
  }

  function openEditModal(clickInfo) {
    const ev = clickInfo.event;
    const resourceId = ev.getResources()[0]?.id ?? '';
    const toDateOnly = (dt) => {
      if (!dt) return '';
      const d = new Date(dt);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 10);
    };
    setEditingId(ev.id);
    const startDate = toDateOnly(ev.start);
    const endDate = toDateOnly(ev.end);
    setEditForm({
      title: ev.title,
      resourceId,
      start: startDate,
      end: endDate,
      color: ev.backgroundColor || ev.extendedProps?.color || '#111111',
    });
    setEditDateMode('custom');
    setEditDurationDays(getDurationInDays(startDate, endDate));
    setEditModal(true);
  }

  function saveEdit() {
    const finalEnd = editDateMode === 'duration'
      ? addDaysToDate(editForm.start, editDurationDays)
      : editForm.end;

    if (!editForm.title.trim() || !editForm.resourceId || !editForm.start || !finalEnd) return;
    setEvents((prev) => prev.map((e) => e.id === editingId ? { ...e, ...editForm, end: finalEnd } : e));
    setEditModal(false);
    setEditingId(null);
    setEditDateMode('custom');
    setEditDurationDays(1);
  }

  function deleteEvent() {
    setEvents((prev) => prev.filter((e) => e.id !== editingId));
    setEditModal(false);
    setEditingId(null);
  }

  function onDatesSet(info) {
    setCurrentTitle(info.view.title);
    setCurrentView(info.view.type);
  }

  function goPrev() {
    calendarRef.current?.getApi().prev();
  }

  function goNext() {
    calendarRef.current?.getApi().next();
  }

  function goToday() {
    calendarRef.current?.getApi().today();
  }

  function changeView(viewName) {
    calendarRef.current?.getApi().changeView(viewName);
  }

  function toggleView() {
    const nextView = currentView === 'resourceTimelineWeek' ? 'resourceTimelineMonth' : 'resourceTimelineWeek';
    changeView(nextView);
  }

  const eventAutoEndDate = eventDateMode === 'duration'
    ? addDaysToDate(eventForm.start, eventDurationDays)
    : '';
  const editAutoEndDate = editDateMode === 'duration'
    ? addDaysToDate(editForm.start, editDurationDays)
    : '';

  return (
    <main className="app-shell" data-theme={theme}>
      <nav className="top-nav">
        <div className="brand-wrap">
          <p className="eyebrow">Rooster</p>
          <strong className="brand-title">Timeline Scheduler</strong>
        </div>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </nav>

      <header className="app-header">
        <h1>FullCalendar Timeline React</h1>
        <span className="subtitle">Contoh penjadwalan resource dengan tampilan timeline</span>
      </header>

      <section className="calendar-controls" aria-label="Calendar controls">
        <div className="calendar-control-group">
          <button type="button" className="calendar-control-btn arrow" onClick={goPrev}>{'‹'}</button>
          <button type="button" className="calendar-control-btn arrow" onClick={goNext}>{'›'}</button>
          <button type="button" className="calendar-control-btn" onClick={goToday}>Today</button>
        </div>

        <p className="calendar-title">{currentTitle}</p>

        <div className="calendar-control-group">
          <button type="button" className="calendar-control-btn action-btn" onClick={() => setRouteModal(true)}>+ New Route</button>
          <button type="button" className="calendar-control-btn action-btn" onClick={openEventModal}>+ Add Shift</button>
          <button type="button" className="calendar-control-btn" onClick={toggleView}>
            {currentView === 'resourceTimelineWeek' ? 'Week' : 'Month'}
          </button>
        </div>
      </section>

      {/* Add New Route Modal */}
      {routeModal && (
        <div className="modal-overlay" onClick={() => setRouteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Add New Route</span>
              <button className="modal-close" onClick={() => setRouteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Route Name</label>
              <input className="modal-input" placeholder="e.g. Route KL-JB" value={routeForm.title} onChange={(e) => setRouteForm({ title: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setRouteModal(false)}>Cancel</button>
              <button className="modal-btn save" onClick={saveRoute}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shift Modal */}
      {eventModal && (
        <div className="modal-overlay" onClick={() => setEventModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Add Shift</span>
              <button className="modal-close" onClick={() => setEventModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Driver Name</label>
              <input className="modal-input" placeholder="e.g. Ahmad" value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} />
              <label className="modal-label">Route / Row</label>
              <select className="modal-input" value={eventForm.resourceId} onChange={(e) => setEventForm((f) => ({ ...f, resourceId: e.target.value }))}>
                <option value="">-- Select --</option>
                {resources.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              <label className="modal-label">Start Date</label>
              <input className="modal-input" type="date" value={eventForm.start} onChange={(e) => setEventForm((f) => ({ ...f, start: e.target.value }))} />
              <label className="modal-label">Date Setting</label>
              <select className="modal-input" value={eventDateMode} onChange={(e) => setEventDateMode(e.target.value)}>
                <option value="custom">Custom End Date</option>
                <option value="duration">By Duration (Day)</option>
              </select>
              {eventDateMode === 'custom' ? (
                <>
                  <label className="modal-label">End Date</label>
                  <input className="modal-input" type="date" value={eventForm.end} onChange={(e) => setEventForm((f) => ({ ...f, end: e.target.value }))} />
                </>
              ) : (
                <>
                  <label className="modal-label">Duration (Day)</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    value={eventDurationDays}
                    onChange={(e) => setEventDurationDays(Math.max(1, Number(e.target.value) || 1))}
                  />
                  {eventAutoEndDate ? (
                    <span className="subtitle">Auto End Date: {eventAutoEndDate}</span>
                  ) : null}
                </>
              )}
              <label className="modal-label">Shift Colour</label>
              <div className="color-picker-row">
                {['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${eventForm.color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setEventForm((f) => ({ ...f, color: c }))}
                    aria-label={c}
                  />
                ))}
                <input
                  type="color"
                  className="color-custom"
                  value={eventForm.color}
                  onChange={(e) => setEventForm((f) => ({ ...f, color: e.target.value }))}
                  title="Custom colour"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setEventModal(false)}>Cancel</button>
              <button className="modal-btn save" onClick={saveEvent}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Edit Shift</span>
              <button className="modal-close" onClick={() => setEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Driver Name</label>
              <input className="modal-input" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
              <label className="modal-label">Route / Row</label>
              <select className="modal-input" value={editForm.resourceId} onChange={(e) => setEditForm((f) => ({ ...f, resourceId: e.target.value }))}>
                <option value="">-- Select --</option>
                {resources.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              <label className="modal-label">Start Date</label>
              <input className="modal-input" type="date" value={editForm.start} onChange={(e) => setEditForm((f) => ({ ...f, start: e.target.value }))} />
              <label className="modal-label">Date Setting</label>
              <select className="modal-input" value={editDateMode} onChange={(e) => setEditDateMode(e.target.value)}>
                <option value="custom">Custom End Date</option>
                <option value="duration">By Duration (Day)</option>
              </select>
              {editDateMode === 'custom' ? (
                <>
                  <label className="modal-label">End Date</label>
                  <input className="modal-input" type="date" value={editForm.end} onChange={(e) => setEditForm((f) => ({ ...f, end: e.target.value }))} />
                </>
              ) : (
                <>
                  <label className="modal-label">Duration (Day)</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    value={editDurationDays}
                    onChange={(e) => setEditDurationDays(Math.max(1, Number(e.target.value) || 1))}
                  />
                  {editAutoEndDate ? (
                    <span className="subtitle">Auto End Date: {editAutoEndDate}</span>
                  ) : null}
                </>
              )}
              <label className="modal-label">Shift Colour</label>
              <div className="color-picker-row">
                {['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${editForm.color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setEditForm((f) => ({ ...f, color: c }))}
                    aria-label={c}
                  />
                ))}
                <input
                  type="color"
                  className="color-custom"
                  value={editForm.color}
                  onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                  title="Custom colour"
                />
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="modal-btn delete" onClick={deleteEvent}>Delete</button>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button className="modal-btn cancel" onClick={() => setEditModal(false)}>Cancel</button>
                <button className="modal-btn save" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="calendar-card">
        <FullCalendar
          ref={calendarRef}
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineWeek"
          locale="en-gb"
          firstDay={1}
          nowIndicator
          editable
          selectable
          resourceAreaHeaderContent="Route"
          resourceAreaWidth="16%"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          resources={resources}
          events={events}

          headerToolbar={false}
          datesSet={onDatesSet}
          eventClick={openEditModal}
          views={{
            resourceTimelineWeek: {
              slotDuration: { days: 1 },
              slotLabelFormat: { weekday: 'short' },
              slotMinWidth: 120,
            },
            resourceTimelineMonth: {
              slotDuration: { days: 1 },
              slotLabelFormat: [{ weekday: 'short' }, { day: 'numeric' }],
              slotMinWidth: 84,
            },
          }}
          height="auto"
        />
      </section>
    </main>
  );
}
