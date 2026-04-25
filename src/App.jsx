import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { useTheme } from './components/theme-provider';

const STORAGE_KEYS = {
  resources: 'rooster.resources',
  events: 'rooster.events',
  drivers: 'rooster.drivers',
};

const EVENT_LABEL_TRUNCATE_LIMIT = 12;

const SUMMARY_RESOURCE_ID = 'summary-shift-am';
const SUMMARY_RESOURCE_GROUP = 'Summary';

const INIT_RESOURCES = [
  { id: 'room-a', title: 'Room A', group: 'Group A' },
  { id: 'room-b', title: 'Room B', group: 'Group A' },
  { id: 'room-c', title: 'Room C', group: 'Group B' },
  { id: 'room-d', title: 'Room D', group: 'Group B' },
];

const INIT_EVENTS = [
  { id: 'evt-1', resourceId: 'room-a', title: 'Meeting Tim Produk', start: '2026-04-24T09:00:00', end: '2026-04-24T11:00:00' },
  { id: 'evt-2', resourceId: 'room-b', title: 'Sprint Planning',    start: '2026-04-24T10:00:00', end: '2026-04-24T12:30:00' },
  { id: 'evt-3', resourceId: 'room-c', title: 'Client Review',      start: '2026-04-25T13:00:00', end: '2026-04-25T15:00:00' },
  { id: 'evt-4', resourceId: 'room-d', title: 'Workshop Internal',  start: '2026-04-26T08:30:00', end: '2026-04-26T11:30:00' },
];

const EMPTY_ROUTE = { title: '', group: '' };
const EMPTY_GROUP = { name: '' };
const EMPTY_EVENT = { title: '', resourceId: '', start: '', end: '', color: '#3b82f6' };
const INIT_DRIVERS = [
  { id: 'drv-1', name: 'Ahmad' },
  { id: 'drv-2', name: 'Siti' },
  { id: 'drv-3', name: 'Daniel' },
];

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return fallback;

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

function toDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '';
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextDateKey(dateKey) {
  const parsedDate = new Date(dateKey + 'T00:00:00');
  if (Number.isNaN(parsedDate.getTime())) return dateKey;
  parsedDate.setDate(parsedDate.getDate() + 1);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isEventOnDate(event, dateKey) {
  const startKey = toDateKey(event.start);
  if (!startKey) return false;
  const endCandidate = toDateKey(event.end);
  if (!endCandidate || endCandidate <= startKey) {
    return dateKey === startKey;
  }
  return dateKey >= startKey && dateKey < endCandidate;
}

function getTrimmedText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isEventLabelTruncated(value) {
  return getTrimmedText(value).length > EVENT_LABEL_TRUNCATE_LIMIT;
}

function getTruncatedEventLabel(value) {
  const cleanValue = getTrimmedText(value);
  if (!cleanValue) return '';
  if (!isEventLabelTruncated(cleanValue)) return cleanValue;
  return `${cleanValue.slice(0, 3)}..........`;
}

export default function App() {
  const SHIFT_AM_LABEL = 'Shift AM';
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState('resourceTimelineWeek');
  const calendarRef = useRef(null);

  const [resources, setResources] = useState(() => readStoredValue(STORAGE_KEYS.resources, INIT_RESOURCES));
  const [events, setEvents]       = useState(() => readStoredValue(STORAGE_KEYS.events, INIT_EVENTS));
  const [drivers, setDrivers] = useState(() => readStoredValue(STORAGE_KEYS.drivers, INIT_DRIVERS));

  // modals
  const [routeModal, setRouteModal] = useState(false);
  const [manageModal, setManageModal] = useState(false);
  const [routeEditModal, setRouteEditModal] = useState(false);
  const [routeDeleteModal, setRouteDeleteModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [groupDeleteModal, setGroupDeleteModal] = useState(false);
  const [driverModal, setDriverModal] = useState(false);
  const [driverDeleteModal, setDriverDeleteModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [editModal,  setEditModal]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [routeDeleteId, setRouteDeleteId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [initialGroupName, setInitialGroupName] = useState('');
  const [groupDeleteName, setGroupDeleteName] = useState('');
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [driverDeleteId, setDriverDeleteId] = useState(null);
  const [initialRouteForm, setInitialRouteForm] = useState(EMPTY_ROUTE);
  const [initialEditForm, setInitialEditForm] = useState(EMPTY_EVENT);

  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE);
  const [groupForm, setGroupForm] = useState(EMPTY_GROUP);
  const [driverForm, setDriverForm] = useState({ name: '' });
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [editForm,  setEditForm]  = useState(EMPTY_EVENT);
  const [eventDateMode, setEventDateMode] = useState('custom');
  const [eventNameMode, setEventNameMode] = useState('driver');
  const [eventDurationDays, setEventDurationDays] = useState('');
  const [editDateMode, setEditDateMode] = useState('custom');
  const [editNameMode, setEditNameMode] = useState('driver');
  const [editDurationDays, setEditDurationDays] = useState('');
  const [visibleRange, setVisibleRange] = useState({ start: '', end: '' });
  const [eventNamePopover, setEventNamePopover] = useState({ open: false, text: '', x: 0, y: 0 });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.resources, JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.drivers, JSON.stringify(drivers));
  }, [drivers]);

  function addDaysToDate(startDate, daysToAdd) {
    if (!startDate) return '';
    const safeDays = Math.max(1, Number(daysToAdd) || 1);
    const date = new Date(startDate + 'T00:00:00');
    date.setDate(date.getDate() + safeDays);
    return date.toISOString().slice(0, 10);
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
  }

  function getDurationInDays(startDate, endDate) {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffMs = end.getTime() - start.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) return 1;
    return Math.max(1, Math.round(diffMs / 86400000));
  }

  function toggleEditMode() {
    setIsEditMode((current) => !current);
  }

  function openRouteModal() {
    setRouteForm(EMPTY_ROUTE);
    setRouteModal(true);
  }

  function normalizeName(value) {
    return value.trim().toLowerCase();
  }

  function openManageModal() {
    setManageModal(true);
  }

  function closeManageModal() {
    setManageModal(false);
  }

  function openDriverModal() {
    closeManageModal();
    setEditingDriverId(null);
    setDriverForm({ name: '' });
    setDriverModal(true);
  }

  function getRouteGroupName(route) {
    const rawGroup = route?.group;
    return typeof rawGroup === 'string' && rawGroup.trim() ? rawGroup.trim() : 'General';
  }

  function openGroupModal() {
    closeManageModal();
    setEditingGroupName('');
    setInitialGroupName('');
    setGroupForm(EMPTY_GROUP);
    setGroupModal(true);
  }

  function closeGroupModal() {
    setGroupModal(false);
    setEditingGroupName('');
    setInitialGroupName('');
    setGroupForm(EMPTY_GROUP);
  }

  function openGroupEdit(groupName) {
    setEditingGroupName(groupName);
    setInitialGroupName(groupName);
    setGroupForm({ name: groupName });
  }

  function cancelGroupEdit() {
    setEditingGroupName('');
    setInitialGroupName('');
    setGroupForm(EMPTY_GROUP);
  }

  function saveGroupEdit() {
    const name = groupForm.name.trim();
    if (!editingGroupName || !name) return;
    const duplicate = routeGroups.some((groupName) => (
      normalizeName(groupName) !== normalizeName(editingGroupName) &&
      normalizeName(groupName) === normalizeName(name)
    ));
    if (duplicate) return;
    setResources((prev) => prev.map((route) => (
      normalizeName(getRouteGroupName(route)) === normalizeName(editingGroupName)
        ? { ...route, group: name }
        : route
    )));
    cancelGroupEdit();
  }

  function openGroupDeleteDialog(groupName) {
    setGroupDeleteName(groupName);
    setGroupDeleteModal(true);
  }

  function closeGroupDeleteDialog() {
    setGroupDeleteName('');
    setGroupDeleteModal(false);
  }

  function deleteGroup() {
    if (!groupDeleteName || normalizeName(groupDeleteName) === normalizeName('General')) return;
    setResources((prev) => prev.map((route) => (
      normalizeName(getRouteGroupName(route)) === normalizeName(groupDeleteName)
        ? { ...route, group: 'General' }
        : route
    )));
    if (normalizeName(editingGroupName) === normalizeName(groupDeleteName)) {
      cancelGroupEdit();
    }
    closeGroupDeleteDialog();
  }

  function closeDriverModal() {
    setDriverModal(false);
    setEditingDriverId(null);
    setDriverForm({ name: '' });
  }

  function openDriverEdit(driver) {
    setEditingDriverId(driver.id);
    setDriverForm({ name: driver.name });
  }

  function saveDriver() {
    const name = driverForm.name.trim();
    if (!name) return;
    const exists = drivers.some((driver) => normalizeName(driver.name) === normalizeName(name));
    if (exists) return;
    setDrivers((prev) => [...prev, { id: `drv-${Date.now()}`, name }]);
    setDriverForm({ name: '' });
  }

  function saveDriverEdit() {
    const name = driverForm.name.trim();
    if (!editingDriverId || !name) return;
    const exists = drivers.some((driver) => (
      driver.id !== editingDriverId && normalizeName(driver.name) === normalizeName(name)
    ));
    if (exists) return;
    setDrivers((prev) => prev.map((driver) => driver.id === editingDriverId ? { ...driver, name } : driver));
    setEvents((prev) => prev.map((event) => (
      normalizeName(event.title) === normalizeName(drivers.find((driver) => driver.id === editingDriverId)?.name || '')
        ? { ...event, title: name }
        : event
    )));
    setEditingDriverId(null);
    setDriverForm({ name: '' });
  }

  function cancelDriverEdit() {
    setEditingDriverId(null);
    setDriverForm({ name: '' });
  }

  function openDriverDeleteDialog(driverId) {
    setDriverDeleteId(driverId);
    setDriverDeleteModal(true);
  }

  function closeDriverDeleteDialog() {
    setDriverDeleteModal(false);
    setDriverDeleteId(null);
  }

  function deleteDriver() {
    if (!driverDeleteId) return;
    const deletingDriver = drivers.find((driver) => driver.id === driverDeleteId);
    setDrivers((prev) => prev.filter((driver) => driver.id !== driverDeleteId));
    if (deletingDriver) {
      setEvents((prev) => prev.filter((event) => normalizeName(event.title) !== normalizeName(deletingDriver.name)));
    }
    if (editingDriverId === driverDeleteId) {
      cancelDriverEdit();
    }
    closeDriverDeleteDialog();
  }

  function closeRouteModal() {
    setRouteModal(false);
    setRouteForm(EMPTY_ROUTE);
  }

  function saveRoute() {
    if (!routeForm.title.trim()) return;
    const id = 'route-' + Date.now();
    setResources((prev) => [...prev, {
      id,
      title: routeForm.title.trim(),
      group: routeForm.group.trim() || 'General',
    }]);
    closeRouteModal();
  }

  function openRouteEditModal(route) {
    setEditingRouteId(route.id);
    setRouteForm({ title: route.title, group: route.group || '' });
    setInitialRouteForm({ title: route.title, group: route.group || '' });
    setRouteEditModal(true);
  }

  function closeRouteEditModal() {
    setRouteEditModal(false);
    setEditingRouteId(null);
    setInitialRouteForm(EMPTY_ROUTE);
    setRouteForm(EMPTY_ROUTE);
  }

  function saveRouteEdit() {
    if (!editingRouteId || !routeForm.title.trim()) return;
    setResources((prev) => prev.map((route) => route.id === editingRouteId
      ? {
        ...route,
        title: routeForm.title.trim(),
        group: routeForm.group.trim() || 'General',
      }
      : route));
    closeRouteEditModal();
  }

  function openRouteDeleteDialog(routeId) {
    if (!routeId) return;
    setRouteDeleteId(routeId);
    setRouteDeleteModal(true);
  }

  function closeRouteDeleteDialog() {
    setRouteDeleteModal(false);
    setRouteDeleteId(null);
  }

  function deleteRoute() {
    if (!routeDeleteId) return;
    setResources((prev) => prev.filter((route) => route.id !== routeDeleteId));
    setEvents((prev) => prev.filter((event) => event.resourceId !== routeDeleteId));
    closeRouteDeleteDialog();
    if (editingRouteId === routeDeleteId) {
      closeRouteEditModal();
    }
  }

  function saveEvent() {
    const finalEnd = eventDateMode === 'duration'
      ? addDaysToDate(eventForm.start, eventDurationDays || 1)
      : eventForm.end;

    if (!eventForm.title.trim() || !eventForm.resourceId || !eventForm.start || !finalEnd) return;
    const normalizedEventName = normalizeName(eventForm.title);
    if (!drivers.some((driver) => normalizeName(driver.name) === normalizedEventName)) {
      setDrivers((prev) => [...prev, { id: `drv-${Date.now()}`, name: eventForm.title.trim() }]);
    }
    const id = 'evt-' + Date.now();
    setEvents((prev) => [...prev, { id, ...eventForm, end: finalEnd }]);
    setEventModal(false);
    setEventForm(EMPTY_EVENT);
    setEventDateMode('custom');
    setEventDurationDays('');
  }

  function openEventModal() {
    setEventForm(EMPTY_EVENT);
    setEventNameMode('driver');
    setEventDateMode('custom');
    setEventDurationDays('');
    setEventModal(true);
  }

  function openRouteFromManage() {
    closeManageModal();
    openRouteModal();
  }

  function openShiftFromManage() {
    closeManageModal();
    openEventModal();
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
    const currentTitle = ev.title || '';
    const hasDriverName = drivers.some((driver) => normalizeName(driver.name) === normalizeName(currentTitle));
    setEditForm({
      title: currentTitle,
      resourceId,
      start: startDate,
      end: endDate,
      color: ev.backgroundColor || ev.extendedProps?.color || '#111111',
    });
    setEditNameMode(hasDriverName ? 'driver' : 'custom');
    setEditDateMode('custom');
      setEditDurationDays('');
    setInitialEditForm({
      title: currentTitle,
      resourceId,
      start: startDate,
      end: endDate,
      color: ev.backgroundColor || ev.extendedProps?.color || '#111111',
    });
    setEditModal(true);
  }

  function closeEditModal() {
    setEditModal(false);
    setEditingId(null);
    setEditNameMode('driver');
    setEditDateMode('custom');
    setEditDurationDays('');
    setInitialEditForm(EMPTY_EVENT);
  }

  function saveEdit() {
    const finalEnd = editDateMode === 'duration'
      ? addDaysToDate(editForm.start, editDurationDays || 1)
      : editForm.end;

    if (!editForm.title.trim() || !editForm.resourceId || !editForm.start || !finalEnd) return;
    const normalizedEditName = normalizeName(editForm.title);
    if (!drivers.some((driver) => normalizeName(driver.name) === normalizedEditName)) {
      setDrivers((prev) => [...prev, { id: `drv-${Date.now()}`, name: editForm.title.trim() }]);
    }
    setEvents((prev) => prev.map((e) => e.id === editingId ? { ...e, ...editForm, end: finalEnd } : e));
    closeEditModal();
  }

  function deleteEvent() {
    setEvents((prev) => prev.filter((e) => e.id !== editingId));
    closeEditModal();
  }

  function onDatesSet(info) {
    setCurrentTitle(info.view.title);
    setCurrentView(info.view.type);
    setVisibleRange({
      start: toDateKey(info.start),
      end: toDateKey(info.end),
    });
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

  function closeEventNamePopover() {
    setEventNamePopover({ open: false, text: '', x: 0, y: 0 });
  }

  function openEventNamePopover(title, mouseEvent) {
    const cleanTitle = getTrimmedText(title);
    if (!cleanTitle || !mouseEvent) return;

    const popoverWidth = 270;
    const popoverHeight = 92;
    const offset = 12;
    const maxX = Math.max(offset, window.innerWidth - popoverWidth - offset);
    const maxY = Math.max(offset, window.innerHeight - popoverHeight - offset);
    const x = Math.min(mouseEvent.clientX + offset, maxX);
    const y = Math.min(mouseEvent.clientY + offset, maxY);

    setEventNamePopover({
      open: true,
      text: cleanTitle,
      x,
      y,
    });
  }

  const eventAutoEndDate = eventDateMode === 'duration'
    ? addDaysToDate(eventForm.start, eventDurationDays || 1)
    : '';
  const editAutoEndDate = editDateMode === 'duration'
    ? addDaysToDate(editForm.start, editDurationDays || 1)
    : '';
  const eventFinalEnd = eventDateMode === 'duration' ? eventAutoEndDate : eventForm.end;
  const editFinalEnd = editDateMode === 'duration' ? editAutoEndDate : editForm.end;

  const routeSaveEnabled = Boolean(routeForm.title.trim());
  const routeEditChanged = (
    routeForm.title.trim() !== initialRouteForm.title.trim() ||
    routeForm.group.trim() !== initialRouteForm.group.trim()
  );
  const routeEditSaveEnabled = Boolean(editingRouteId && routeForm.title.trim() && routeEditChanged);
  const routeGroups = Array.from(new Set(resources.map((route) => getRouteGroupName(route))));
  const groupNameExists = routeGroups.some((groupName) => normalizeName(groupName) === normalizeName(groupForm.name));
  const groupEditChanged = normalizeName(groupForm.name) !== normalizeName(initialGroupName);
  const groupEditSaveEnabled = Boolean(editingGroupName && groupForm.name.trim() && groupEditChanged && !groupNameExists);
  const driverNameExists = drivers.some((driver) => normalizeName(driver.name) === normalizeName(driverForm.name));
  const driverSaveEnabled = Boolean(driverForm.name.trim() && !driverNameExists);
  const editingDriver = drivers.find((driver) => driver.id === editingDriverId);
  const driverEditChanged = Boolean(editingDriver && normalizeName(editingDriver.name) !== normalizeName(driverForm.name));
  const driverEditSaveEnabled = Boolean(editingDriverId && driverForm.name.trim() && driverEditChanged && !driverNameExists);

  const eventSaveEnabled = Boolean(
    eventForm.title.trim() &&
    eventForm.resourceId &&
    eventForm.start &&
    eventFinalEnd,
  );

  const editBaseValid = Boolean(
    editingId &&
    editForm.title.trim() &&
    editForm.resourceId &&
    editForm.start &&
    editFinalEnd,
  );
  const editChanged = (
    editForm.title.trim() !== initialEditForm.title.trim() ||
    editForm.resourceId !== initialEditForm.resourceId ||
    editForm.start !== initialEditForm.start ||
    editFinalEnd !== initialEditForm.end ||
    editForm.color !== initialEditForm.color
  );
  const editSaveEnabled = editBaseValid && editChanged;

  const visibleDateKeys = useMemo(() => {
    if (!visibleRange.start || !visibleRange.end || visibleRange.start >= visibleRange.end) {
      return [];
    }
    const dateKeys = [];
    let cursor = visibleRange.start;
    while (cursor < visibleRange.end) {
      dateKeys.push(cursor);
      cursor = nextDateKey(cursor);
    }
    return dateKeys;
  }, [visibleRange]);

  const shiftAmDailyTotals = useMemo(() => {
    const normalizedShiftName = normalizeName(SHIFT_AM_LABEL);
    return visibleDateKeys.map((dateKey) => {
      const total = events.filter((event) => (
        normalizeName(event.title) === normalizedShiftName &&
        isEventOnDate(event, dateKey)
      )).length;
      return { dateKey, total };
    });
  }, [events, visibleDateKeys]);

  const calendarResources = useMemo(() => ([
    ...resources.map((resource) => ({
      ...resource,
      orderWeight: 0,
      isSummary: false,
    })),
    {
      id: SUMMARY_RESOURCE_ID,
      title: `Total ${SHIFT_AM_LABEL}`,
      group: SUMMARY_RESOURCE_GROUP,
      orderWeight: 1,
      isSummary: true,
    },
  ]), [resources]);

  const summaryEvents = useMemo(() => (
    shiftAmDailyTotals.map(({ dateKey, total }) => ({
      id: `summary-${dateKey}`,
      resourceId: SUMMARY_RESOURCE_ID,
      title: String(total),
      start: `${dateKey}T07:00:00`,
      end: `${dateKey}T20:00:00`,
      color: '#6b7280',
      editable: false,
      startEditable: false,
      durationEditable: false,
      extendedProps: {
        isSummary: true,
        total,
      },
    }))
  ), [shiftAmDailyTotals]);

  const calendarEvents = useMemo(() => ([...events, ...summaryEvents]), [events, summaryEvents]);

  useEffect(() => {
    if (!eventNamePopover.open) return undefined;

    const onPointerDown = () => closeEventNamePopover();
    const onEscape = (event) => {
      if (event.key === 'Escape') closeEventNamePopover();
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [eventNamePopover.open]);

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <div className="brand-wrap">
          <p className="eyebrow">Rooster</p>
          <strong className="brand-title">Timeline Scheduler</strong>
        </div>
        <div className="top-nav-actions">
          <button
            type="button"
            className={`theme-toggle${isEditMode ? ' is-active' : ''}`}
            onClick={toggleEditMode}
          >
            {isEditMode ? 'Edit Mode: On' : 'Edit Mode: Off'}
          </button>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {resolvedTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </nav>

      <header className="app-header">
        <h1>Daily Trip</h1>
        <span className="subtitle">Resource scheduling example using a timeline view</span>
      </header>

      <section className="calendar-controls" aria-label="Calendar controls">
        <div className="calendar-control-group nav-layout">
          <button type="button" className="calendar-control-btn arrow" onClick={goPrev}>{'‹'}</button>
          <button type="button" className="calendar-control-btn" onClick={goToday}>Today</button>
          <button type="button" className="calendar-control-btn arrow" onClick={goNext}>{'›'}</button>
        </div>

        <p className="calendar-title">{currentTitle}</p>

        <div className="calendar-control-group">
          {isEditMode ? (
            <button type="button" className="calendar-control-btn action-btn" onClick={openManageModal}>Manage</button>
          ) : null}
          <button type="button" className="calendar-control-btn" onClick={toggleView}>
            {currentView === 'resourceTimelineWeek' ? 'Week' : 'Month'}
          </button>
        </div>
      </section>

      {/* Manage Modal */}
      {manageModal && (
        <div className="modal-overlay" onClick={closeManageModal}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Manage</span>
              <button type="button" className="modal-close" onClick={closeManageModal}>✕</button>
            </div>
            <div className="modal-body">
              <button type="button" className="manage-option-btn" onClick={openRouteFromManage}>Add New Route</button>
              <button type="button" className="manage-option-btn" onClick={openShiftFromManage}>Add New Shift</button>
              <button type="button" className="manage-option-btn" onClick={openGroupModal}>Route Group</button>
              <button type="button" className="manage-option-btn" onClick={openDriverModal}>Driver Name</button>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn cancel" onClick={closeManageModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Route Group Modal */}
      {groupModal && (
        <div className="modal-overlay" onClick={closeGroupModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Route Group</span>
              <button type="button" className="modal-close" onClick={closeGroupModal}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Group Name</label>
              <input
                className="modal-input"
                placeholder="e.g. Group A"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ name: e.target.value })}
              />
              <div className="driver-inline-actions">
                <button
                  type="button"
                  className="modal-btn save"
                  onClick={saveGroupEdit}
                  disabled={!groupEditSaveEnabled}
                >
                  Save Group Name
                </button>
                {editingGroupName ? (
                  <button type="button" className="modal-btn cancel" onClick={cancelGroupEdit}>Cancel Edit</button>
                ) : null}
              </div>

              <div className="driver-list-wrap">
                {routeGroups.length ? (
                  routeGroups.map((groupName) => {
                    const routeCount = resources.filter((route) => normalizeName(getRouteGroupName(route)) === normalizeName(groupName)).length;
                    return (
                      <div className="driver-list-item" key={groupName}>
                        <span>{groupName} ({routeCount} route)</span>
                        <div className="driver-item-actions">
                          <button type="button" className="driver-item-btn edit" onClick={() => openGroupEdit(groupName)}>Edit</button>
                          <button
                            type="button"
                            className="driver-item-btn delete"
                            onClick={() => openGroupDeleteDialog(groupName)}
                            disabled={normalizeName(groupName) === normalizeName('General')}
                            title={normalizeName(groupName) === normalizeName('General') ? 'General cannot be deleted' : 'Delete group'}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="subtitle">No group yet.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn cancel" onClick={closeGroupModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation */}
      {groupDeleteModal && (
        <div className="modal-overlay" onClick={closeGroupDeleteDialog}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Delete Group</span>
              <button type="button" className="modal-close" onClick={closeGroupDeleteDialog}>✕</button>
            </div>
            <div className="modal-body">
              <p className="subtitle">Group will be deleted and all route in this group will be moved to General. Continue?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn cancel" onClick={closeGroupDeleteDialog}>Cancel</button>
              <button type="button" className="modal-btn delete" onClick={deleteGroup}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Name Modal */}
      {driverModal && (
        <div className="modal-overlay" onClick={closeDriverModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Driver Name</span>
              <button type="button" className="modal-close" onClick={closeDriverModal}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Name</label>
              <input
                className="modal-input"
                placeholder="e.g. Ahmad"
                value={driverForm.name}
                onChange={(e) => setDriverForm({ name: e.target.value })}
              />
              <div className="driver-inline-actions">
                {editingDriverId ? (
                  <>
                    <button type="button" className="modal-btn save" onClick={saveDriverEdit} disabled={!driverEditSaveEnabled}>Save Changes</button>
                    <button type="button" className="modal-btn cancel" onClick={cancelDriverEdit}>Cancel Edit</button>
                  </>
                ) : (
                  <button type="button" className="modal-btn save" onClick={saveDriver} disabled={!driverSaveEnabled}>Add Driver</button>
                )}
              </div>
              <div className="driver-list-wrap">
                {drivers.length ? (
                  drivers.map((driver) => (
                    <div className="driver-list-item" key={driver.id}>
                      <span>{driver.name}</span>
                      <div className="driver-item-actions">
                        <button type="button" className="driver-item-btn edit" onClick={() => openDriverEdit(driver)}>Edit</button>
                        <button type="button" className="driver-item-btn delete" onClick={() => openDriverDeleteDialog(driver.id)}>Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="subtitle">No driver yet.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn cancel" onClick={closeDriverModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Driver Confirmation */}
      {driverDeleteModal && (
        <div className="modal-overlay" onClick={closeDriverDeleteDialog}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Delete Driver</span>
              <button type="button" className="modal-close" onClick={closeDriverDeleteDialog}>✕</button>
            </div>
            <div className="modal-body">
              <p className="subtitle">Driver will be deleted. Related shifts with the same name will also be removed. Continue?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn cancel" onClick={closeDriverDeleteDialog}>Cancel</button>
              <button type="button" className="modal-btn delete" onClick={deleteDriver}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Route Modal */}
      {routeModal && (
        <div className="modal-overlay" onClick={closeRouteModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Add New Route</span>
              <button type="button" className="modal-close" onClick={closeRouteModal}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Route Name</label>
              <input
                className="modal-input"
                placeholder="e.g. Route KL-JB"
                value={routeForm.title}
                onChange={(e) => setRouteForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <label className="modal-label" style={{ marginTop: '0.7rem' }}>Group</label>
              <select
                className="modal-input"
                value={routeForm.group || 'General'}
                onChange={(e) => setRouteForm((prev) => ({ ...prev, group: e.target.value }))}
              >
                <option value="General">General</option>
                {routeGroups
                  .filter((groupName) => normalizeName(groupName) !== normalizeName('General'))
                  .map((groupName) => (
                    <option key={groupName} value={groupName}>{groupName}</option>
                  ))}
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn cancel" onClick={closeRouteModal}>Cancel</button>
              <button type="button" className="modal-btn save" onClick={saveRoute} disabled={!routeSaveEnabled}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {routeEditModal && (
        <div className="modal-overlay" onClick={closeRouteEditModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Edit Route</span>
              <button type="button" className="modal-close" onClick={closeRouteEditModal}>✕</button>
            </div>
            <div className="modal-body">
              <label className="modal-label">Route Name</label>
              <input
                className="modal-input"
                value={routeForm.title}
                onChange={(e) => setRouteForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <label className="modal-label" style={{ marginTop: '0.7rem' }}>Group</label>
              <select
                className="modal-input"
                value={routeForm.group || 'General'}
                onChange={(e) => setRouteForm((prev) => ({ ...prev, group: e.target.value }))}
              >
                <option value="General">General</option>
                {routeGroups
                  .filter((groupName) => normalizeName(groupName) !== normalizeName('General'))
                  .map((groupName) => (
                    <option key={groupName} value={groupName}>{groupName}</option>
                  ))}
              </select>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="modal-btn delete" onClick={() => openRouteDeleteDialog(editingRouteId)}>Delete</button>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" className="modal-btn cancel" onClick={closeRouteEditModal}>Cancel</button>
                <button type="button" className="modal-btn save" onClick={saveRouteEdit} disabled={!routeEditSaveEnabled}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Route Confirmation */}
      {routeDeleteModal && (
        <div className="modal-overlay" onClick={closeRouteDeleteDialog}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Delete Route</span>
              <button type="button" className="modal-close" onClick={closeRouteDeleteDialog}>✕</button>
            </div>
            <div className="modal-body">
              <p className="subtitle">This route and all shifts assigned to it will be deleted. Continue?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn cancel" onClick={closeRouteDeleteDialog}>Cancel</button>
              <button type="button" className="modal-btn delete" onClick={deleteRoute}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shift Modal */}
      {eventModal && (
        <div className="modal-overlay" onClick={() => setEventModal(false)}>
          <div className="modal-box modal-shift" onClick={(e) => e.stopPropagation()}>
            <div className="sdcn-dialog-header">
              <div>
                <h2 className="sdcn-dialog-title">Add Shift</h2>
                <p className="sdcn-dialog-desc">Fill in the details to create a new shift.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setEventModal(false)}>✕</button>
            </div>
            <div className="sdcn-dialog-body">
              <div className="sdcn-field">
                <label className="sdcn-label">Name</label>
                <div className="sdcn-tabs" role="tablist">
                  <button type="button" className={`sdcn-tab${eventNameMode === 'driver' ? ' is-active' : ''}`}
                    onClick={() => { setEventNameMode('driver'); setEventForm((f) => ({ ...f, title: drivers[0]?.name || '' })); }}>
                    Driver
                  </button>
                  <button type="button" className={`sdcn-tab${eventNameMode === 'custom' ? ' is-active' : ''}`}
                    onClick={() => { setEventNameMode('custom'); setEventForm((f) => ({ ...f, title: '' })); }}>
                    Custom
                  </button>
                </div>
                {eventNameMode === 'driver' ? (
                  <select className="sdcn-input" value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}>
                    {drivers.length ? (<><option value="">— Select Driver —</option>{drivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</>) : (<option value="">No driver available</option>)}
                  </select>
                ) : (
                  <input className="sdcn-input" placeholder="e.g. Ahmad" value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} />
                )}
              </div>
              <div className="sdcn-field">
                <label className="sdcn-label">Route / Resource</label>
                <select className="sdcn-input" value={eventForm.resourceId} onChange={(e) => setEventForm((f) => ({ ...f, resourceId: e.target.value }))}>
                  <option value="">— Select Route —</option>
                  {resources.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
              <div className="sdcn-field">
                <label className="sdcn-label">Date Mode</label>
                <div className="sdcn-tabs" role="tablist">
                  <button type="button" className={`sdcn-tab${eventDateMode === 'custom' ? ' is-active' : ''}`} onClick={() => setEventDateMode('custom')}>Custom Dates</button>
                  <button type="button" className={`sdcn-tab${eventDateMode === 'duration' ? ' is-active' : ''}`} onClick={() => setEventDateMode('duration')}>By Duration</button>
                </div>
              </div>
              {eventDateMode === 'custom' ? (
                <div className="sdcn-row">
                  <div className="sdcn-field">
                    <label className="sdcn-label">Start Date</label>
                    <input className="sdcn-input" type="date" value={eventForm.start} onChange={(e) => setEventForm((f) => ({ ...f, start: e.target.value }))} />
                    {eventForm.start && <span className="sdcn-hint">{fmtDate(eventForm.start)}</span>}
                  </div>
                  <div className="sdcn-field">
                    <label className="sdcn-label">End Date</label>
                    <input className="sdcn-input" type="date" value={eventForm.end} onChange={(e) => setEventForm((f) => ({ ...f, end: e.target.value }))} />
                    {eventForm.end && <span className="sdcn-hint">{fmtDate(eventForm.end)}</span>}
                  </div>
                </div>
              ) : (
                <div className="sdcn-row">
                  <div className="sdcn-field">
                    <label className="sdcn-label">Start Date</label>
                    <input className="sdcn-input" type="date" value={eventForm.start} onChange={(e) => setEventForm((f) => ({ ...f, start: e.target.value }))} />
                    {eventForm.start && <span className="sdcn-hint">{fmtDate(eventForm.start)}</span>}
                  </div>
                  <div className="sdcn-field">
                    <label className="sdcn-label">Duration (Days)</label>
                    <input className={`sdcn-input${eventDurationDays === '' ? ' input-muted' : ''}`} type="number" min="1" placeholder="e.g. 7" value={eventDurationDays} onChange={(e) => setEventDurationDays(e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 1))} />
                    {eventAutoEndDate && <span className="sdcn-hint">Ends: {fmtDate(eventAutoEndDate)}</span>}
                  </div>
                </div>
              )}
              <div className="sdcn-field">
                <label className="sdcn-label">Shift Color</label>
                <div className="sdcn-color-row">
                  {['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316'].map((c) => (
                    <button key={c} type="button" className={`color-swatch${eventForm.color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setEventForm((f) => ({ ...f, color: c }))} aria-label={c} />
                  ))}
                  <input type="color" className="color-custom" value={eventForm.color} onChange={(e) => setEventForm((f) => ({ ...f, color: e.target.value }))} title="Custom colour" />
                </div>
              </div>
            </div>
            <div className="sdcn-dialog-footer">
              <button type="button" className="sdcn-btn outline" onClick={() => setEventModal(false)}>Cancel</button>
              <button type="button" className="sdcn-btn primary" onClick={saveEvent} disabled={!eventSaveEnabled}>Add Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-box modal-shift" onClick={(e) => e.stopPropagation()}>
            <div className="sdcn-dialog-header">
              <div>
                <h2 className="sdcn-dialog-title">Edit Shift</h2>
                <p className="sdcn-dialog-desc">Update the details for this shift.</p>
              </div>
              <button type="button" className="modal-close" onClick={closeEditModal}>✕</button>
            </div>
            <div className="sdcn-dialog-body">
              <div className="sdcn-field">
                <label className="sdcn-label">Name</label>
                <div className="sdcn-tabs" role="tablist">
                  <button type="button" className={`sdcn-tab${editNameMode === 'driver' ? ' is-active' : ''}`}
                    onClick={() => { setEditNameMode('driver'); setEditForm((f) => ({ ...f, title: drivers[0]?.name || '' })); }}>
                    Driver
                  </button>
                  <button type="button" className={`sdcn-tab${editNameMode === 'custom' ? ' is-active' : ''}`}
                    onClick={() => { setEditNameMode('custom'); setEditForm((f) => ({ ...f, title: '' })); }}>
                    Custom
                  </button>
                </div>
                {editNameMode === 'driver' ? (
                  <select className="sdcn-input" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}>
                    {drivers.length ? (<><option value="">— Select Driver —</option>{drivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</>) : (<option value="">No driver available</option>)}
                  </select>
                ) : (
                  <input className="sdcn-input" placeholder="e.g. Ahmad" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                )}
              </div>
              <div className="sdcn-field">
                <label className="sdcn-label">Route / Resource</label>
                <select className="sdcn-input" value={editForm.resourceId} onChange={(e) => setEditForm((f) => ({ ...f, resourceId: e.target.value }))}>
                  <option value="">— Select Route —</option>
                  {resources.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
              <div className="sdcn-field">
                <label className="sdcn-label">Date Mode</label>
                <div className="sdcn-tabs" role="tablist">
                  <button type="button" className={`sdcn-tab${editDateMode === 'custom' ? ' is-active' : ''}`} onClick={() => setEditDateMode('custom')}>Custom Dates</button>
                  <button type="button" className={`sdcn-tab${editDateMode === 'duration' ? ' is-active' : ''}`} onClick={() => setEditDateMode('duration')}>By Duration</button>
                </div>
              </div>
              {editDateMode === 'custom' ? (
                <div className="sdcn-row">
                  <div className="sdcn-field">
                    <label className="sdcn-label">Start Date</label>
                    <input className="sdcn-input" type="date" value={editForm.start} onChange={(e) => setEditForm((f) => ({ ...f, start: e.target.value }))} />
                    {editForm.start && <span className="sdcn-hint">{fmtDate(editForm.start)}</span>}
                  </div>
                  <div className="sdcn-field">
                    <label className="sdcn-label">End Date</label>
                    <input className="sdcn-input" type="date" value={editForm.end} onChange={(e) => setEditForm((f) => ({ ...f, end: e.target.value }))} />
                    {editForm.end && <span className="sdcn-hint">{fmtDate(editForm.end)}</span>}
                  </div>
                </div>
              ) : (
                <div className="sdcn-row">
                  <div className="sdcn-field">
                    <label className="sdcn-label">Start Date</label>
                    <input className="sdcn-input" type="date" value={editForm.start} onChange={(e) => setEditForm((f) => ({ ...f, start: e.target.value }))} />
                    {editForm.start && <span className="sdcn-hint">{fmtDate(editForm.start)}</span>}
                  </div>
                  <div className="sdcn-field">
                    <label className="sdcn-label">Duration (Days)</label>
                    <input className={`sdcn-input${editDurationDays === '' ? ' input-muted' : ''}`} type="number" min="1" placeholder="e.g. 7" value={editDurationDays} onChange={(e) => setEditDurationDays(e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 1))} />
                    {editAutoEndDate && <span className="sdcn-hint">Ends: {fmtDate(editAutoEndDate)}</span>}
                  </div>
                </div>
              )}
              <div className="sdcn-field">
                <label className="sdcn-label">Shift Color</label>
                <div className="sdcn-color-row">
                  {['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316'].map((c) => (
                    <button key={c} type="button" className={`color-swatch${editForm.color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setEditForm((f) => ({ ...f, color: c }))} aria-label={c} />
                  ))}
                  <input type="color" className="color-custom" value={editForm.color} onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))} title="Custom colour" />
                </div>
              </div>
            </div>
            <div className="sdcn-dialog-footer" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="sdcn-btn destructive" onClick={deleteEvent}>Delete</button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="sdcn-btn outline" onClick={closeEditModal}>Cancel</button>
                <button type="button" className="sdcn-btn primary" onClick={saveEdit} disabled={!editSaveEnabled}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="calendar-card">
        <datalist id="driver-name-options">
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.name} />
          ))}
        </datalist>
        <FullCalendar
          ref={calendarRef}
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineWeek"
          locale="en-gb"
          firstDay={1}
          nowIndicator
          editable={isEditMode}
          selectable={isEditMode}
          resourceAreaHeaderContent="Route"
          resourceLabelContent={(arg) => (
            <div className="resource-label-wrap">
              <span className={arg.resource.extendedProps?.isSummary ? 'resource-summary-label' : ''}>{arg.resource.title}</span>
              {isEditMode && !arg.resource.extendedProps?.isSummary ? (
                <button
                  type="button"
                  className="resource-edit-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openRouteEditModal({
                      id: arg.resource.id,
                      title: arg.resource.title,
                      group: arg.resource.extendedProps?.group || '',
                    });
                  }}
                  aria-label={`Edit ${arg.resource.title}`}
                  title={`Edit ${arg.resource.title}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm16.71-10.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 3.75 3.75 1.34-1.34z" />
                  </svg>
                </button>
              ) : null}
            </div>
          )}
          resourceAreaWidth="13%"
          resourceGroupField="group"
          resourceOrder="orderWeight,group,title"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          eventMinWidth={70}
          displayEventTime={false}
          resources={calendarResources}
          events={calendarEvents}

          headerToolbar={false}
          datesSet={onDatesSet}
          eventClassNames={(arg) => (arg.event.extendedProps?.isSummary ? ['summary-total-event'] : [])}
          eventContent={(arg) => {
            if (arg.event.extendedProps?.isSummary) {
              return <span className="summary-total-event-text">{arg.event.extendedProps.total}</span>;
            }
            const truncated = isEventLabelTruncated(arg.event.title);
            return (
              <span className={`timeline-event-text${truncated ? ' is-truncated' : ''}`}>
                {getTruncatedEventLabel(arg.event.title)}
              </span>
            );
          }}
          eventClick={(clickInfo) => {
            if (clickInfo.event.extendedProps?.isSummary) return;
            if (!isEditMode) {
              if (isEventLabelTruncated(clickInfo.event.title)) {
                openEventNamePopover(clickInfo.event.title, clickInfo.jsEvent);
              }
              return;
            }
            openEditModal(clickInfo);
          }}
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

        {eventNamePopover.open ? (
          <div
            className="event-name-popover"
            style={{ left: `${eventNamePopover.x}px`, top: `${eventNamePopover.y}px` }}
            onPointerDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="Full event name"
          >
            <strong className="event-name-popover-title">Full Name</strong>
            <span className="event-name-popover-text">{eventNamePopover.text}</span>
          </div>
        ) : null}
      </section>
    </main>
  );
}
