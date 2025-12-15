(function (global) {
    const DEFAULT_API_BASE = '/api/v1';
    let currentUser = null;
    let apiBase = DEFAULT_API_BASE;
    let initialized = false;
    let statusListeners = [];
    let connectivityState = {
        online: navigator.onLine,
        backendReachable: false,
        pending: 0,
        lastChecked: null
    };

    function storageKey(type) {
        if (!currentUser?.buwana_id) return null;
        return `ec_user_${currentUser.buwana_id}_${type}`;
    }

    function readOutbox() {
        const key = storageKey('outbox');
        if (!key) return [];
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('[sync-store] unable to parse outbox', err);
            return [];
        }
    }

    function persistOutbox(list) {
        const key = storageKey('outbox');
        if (!key) return;
        try {
            localStorage.setItem(key, JSON.stringify(list || []));
        } catch (err) {
            console.warn('[sync-store] unable to persist outbox', err);
        }
        connectivityState.pending = Array.isArray(list) ? list.length : 0;
        notifyStatusListeners();
    }

    function readCachedState() {
        const calKey = storageKey('calendars');
        const itemKey = storageKey('items');
        if (!calKey || !itemKey) return null;
        try {
            const calendars = JSON.parse(localStorage.getItem(calKey) || '[]');
            const itemsByCalendar = JSON.parse(localStorage.getItem(itemKey) || '{}');
            return { calendars, itemsByCalendar };
        } catch (err) {
            console.warn('[sync-store] unable to read cached state', err);
            return null;
        }
    }

    function persistCachedState(calendars, itemsByCalendar) {
        const calKey = storageKey('calendars');
        const itemKey = storageKey('items');
        if (!calKey || !itemKey) return;
        try {
            localStorage.setItem(calKey, JSON.stringify(calendars || []));
            localStorage.setItem(itemKey, JSON.stringify(itemsByCalendar || {}));
        } catch (err) {
            console.warn('[sync-store] unable to persist cache', err);
        }
        mirrorLegacyCaches(calendars, itemsByCalendar);
    }

    function mirrorLegacyCaches(calendars, itemsByCalendar) {
        const safeCalendars = Array.isArray(calendars) ? calendars : [];
        const safeItems = itemsByCalendar && typeof itemsByCalendar === 'object' ? itemsByCalendar : {};
        const keysToKeep = new Set();
        let totalItems = 0;

        safeCalendars.forEach((calendar) => {
            if (!calendar || calendar.calendar_id === undefined || calendar.calendar_id === null) return;
            const calId = calendar.calendar_id;
            const storageKey = `calendar_${calId}`;
            const items = Array.isArray(safeItems[calId]) ? safeItems[calId] : [];
            try {
                localStorage.setItem(storageKey, JSON.stringify(items));
                keysToKeep.add(storageKey);
            } catch (err) {
                console.warn('[sync-store] unable to mirror items for calendar', calId, err);
            }
            totalItems += items.length;
        });

        Object.keys(localStorage)
            .filter((key) => /^calendar_\d+$/.test(key) && !keysToKeep.has(key))
            .forEach((key) => localStorage.removeItem(key));

        const payload = JSON.stringify(safeCalendars);
        try {
            sessionStorage.setItem('user_calendars_v1', payload);
            localStorage.setItem('user_calendars_v1', payload);
        } catch (err) {
            console.debug('[sync-store] unable to mirror calendar list', err);
        }

        connectivityState.pending = readOutbox().length;
        notifyStatusListeners({ totalItems, calendarCount: safeCalendars.length });
    }

    function normalizeItem(item, calendar, buwanaId) {
        const toUtcDateTime = (rawLocal) => {
            if (!rawLocal) return null;
            const normalizedLocal = String(rawLocal).replace(' ', 'T');
            const parsed = new Date(normalizedLocal);
            if (Number.isNaN(parsed.getTime())) return null;

            const offsetMs = parsed.getTimezoneOffset() * 60000;
            const utcDate = new Date(parsed.getTime() - offsetMs);
            return `${utcDate.toISOString().slice(0, 19).replace('T', ' ')}`;
        };

        const parseDateParts = () => {
            const rawDate = item.start_local || item.dtstart_utc || item.date || '';
            const sanitized = String(rawDate).trim().replace('T', ' ');
            const firstToken = sanitized.split(' ')[0];
            const explicitParts = [item.year, item.month, item.day].map(Number);

            let year = Number.isFinite(explicitParts[0]) ? explicitParts[0] : undefined;
            let month = Number.isFinite(explicitParts[1]) ? explicitParts[1] : undefined;
            let day = Number.isFinite(explicitParts[2]) ? explicitParts[2] : undefined;
            let datePart = '';

            const match = firstToken.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (match) {
                year = Number(match[1]);
                month = Number(match[2]);
                day = Number(match[3]);
                datePart = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            } else if (year && month && day) {
                datePart = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }

            return { datePart, year, month, day };
        };

        const { datePart, year, month, day } = parseDateParts();
        const timeLabel = (() => {
            const rawDate = item.start_local || item.dtstart_utc || item.date || '';
            const timePart = String(rawDate).trim().replace('T', ' ').split(' ')[1] || item.time;
            const safeTime = (timePart || '00:00').slice(0, 5);
            return safeTime;
        })();

        if (typeof global.normalizeV1Item === 'function') {
            try {
                return global.normalizeV1Item(item, calendar, buwanaId);
            } catch (err) {
                console.warn('[sync-store] normalizeV1Item failed, falling back', err);
            }
        }
        const uniqueKey = `v1_${calendar?.calendar_id || 'cal'}_${item.item_id || item.id || Date.now()}`;
        const numericItemId = Number(item.item_id || item.id);
        const itemId = Number.isFinite(numericItemId) ? numericItemId : (item.item_id || item.id);
        const calendarId = Number(calendar?.calendar_id || item.calendar_id || item.cal_id);

        const normalized = {
            unique_key: uniqueKey,
            item_id: itemId,
            buwana_id: buwanaId,
            cal_id: Number.isFinite(calendarId) ? calendarId : undefined,
            cal_name: calendar?.name || 'My Calendar',
            cal_color: calendar?.color || '#3b82f6',
            title: item.summary || item.title || 'Untitled Event',
            date: datePart || item.date || '',
            year: Number.isFinite(year) ? year : undefined,
            month: Number.isFinite(month) ? month : undefined,
            day: Number.isFinite(day) ? day : undefined,
            time: timeLabel,
            time_zone: item.tzid || calendar?.tzid || 'Etc/UTC',
            comments: item.description || item.notes || '',
            comment: item.description || item.notes ? '1' : '0',
            last_edited: item.updated_at || new Date().toISOString(),
            created_at: item.created_at || new Date().toISOString(),
            datecycle_color: item.color_hex || calendar?.color || '#3b82f6',
            date_emoji: item.emoji || calendar?.emoji || '⬤',
            pinned: item.pinned ? '1' : '0',
            completed: item.percent_complete >= 100 ? '1' : '0',
            frequency: item.frequency || item.recurrence || '',
            all_day: item.all_day ? 1 : 0,
            tzid: item.tzid || calendar?.tzid || 'Etc/UTC',
            raw_v1: {
                item_id: itemId || uniqueKey,
                calendar_id: Number.isFinite(calendarId) ? calendarId : null,
                uid: item.uid || uniqueKey,
                component_type: item.component_type || item.item_kind || item.kind || 'todo',
                dtstart_utc: item.dtstart_utc || toUtcDateTime(item.start_local || item.date),
                due_utc: item.due_utc || toUtcDateTime(item.start_local || item.date),
                item_emoji: item.emoji || calendar?.emoji || '⬤',
                item_color: item.color_hex || calendar?.color || '#3b82f6',
                summary: item.summary || item.title || 'Untitled Event',
                description: item.description || item.notes || '',
                tzid: item.tzid || calendar?.tzid || 'Etc/UTC',
                recurrence: item.recurrence || item.frequency || '',
                pinned: item.pinned ? 1 : 0,
                percent_complete: typeof item.percent_complete === 'number'
                    ? item.percent_complete
                    : (item.completed || item.done || item.status === 'COMPLETED') ? 100 : 0,
                status: item.status || (item.completed || item.done ? 'COMPLETED' : 'NEEDS-ACTION'),
                all_day: item.all_day ? 1 : 0,
                start_local: item.start_local || item.date || datePart,
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString()
            }
        };

        const itemCacheKey = storageKey('items');
        if (itemCacheKey) {
            console.log('[sync-store][normalizeItem] preparing cached item for highlightDateCycles', {
                cacheKey: itemCacheKey,
                item: normalized
            });
        }

        return normalized;
    }

    async function checkBackendReachable() {
        // Don’t short-circuit on navigator.onLine; just try.
        try {
            const res = await fetch(`${apiBase}/get_earthcal_plans.php`, {
                method: 'GET',
                cache: 'no-store',
                credentials: 'omit'
            });
            // If we got any HTTP response, the backend is reachable.
            return true;
        } catch (err) {
            console.debug('[sync-store] backend reachability failed', err);
            return false;
        }
    }


    const isForcedOffline = () => {
        if (typeof window !== 'undefined' && window.isForcedOffline === true) {
            return true;
        }

        try {
            return localStorage.getItem('earthcal_forced_offline') === 'true';
        } catch (err) {
            console.warn('[sync-store] Unable to read forced offline flag', err);
        }

        return false;
    };

    async function determineConnectivity() {
        if (isForcedOffline()) {
            connectivityState = {
                ...connectivityState,
                online: false,
                backendReachable: false,
                lastChecked: Date.now(),
                forcedOffline: true
            };
            notifyStatusListeners();
            return false;
        }

        const reachable = await checkBackendReachable();

        // In Electron/snap, navigator.onLine is often unreliable.
        // If the backend is reachable, we treat the app as online.
        const online = reachable || navigator.onLine;

        connectivityState = {
            ...connectivityState,
            online,
            backendReachable: reachable,
            lastChecked: Date.now(),
            forcedOffline: false
        };

        notifyStatusListeners();
        return connectivityState.online;
    }


    function notifyStatusListeners(extra = {}) {
        const payload = { ...connectivityState, ...extra, pending: readOutbox().length };
        statusListeners.forEach((cb) => {
            try {
                cb(payload);
            } catch (err) {
                console.warn('[sync-store] status listener failed', err);
            }
        });
    }

    function onConnectivityChange() {
        determineConnectivity().then((online) => {
            if (online) {
                flushOutbox();
            }
        });
    }
    async function initSyncStore(user, options = {}) {
        // Store current user (may just be { buwana_id } in offline mode)
        currentUser = user || null;

        // Detect if we're running on a local dev / snap origin
        let isLocalhost = false;
        try {
            if (typeof window !== 'undefined' && window.location && window.location.origin) {
                const origin = window.location.origin;
                isLocalhost = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
            }
        } catch (e) {
            // ignore – fallback to DEFAULT_API_BASE below
        }

        // Resolve API base:
        // 1. options.apiBase (explicit override)
        // 2. If localhost/snap -> talk to production backend
        // 3. Otherwise default to relative /api/v1
        apiBase = options.apiBase
            || (isLocalhost ? 'https://earthcal.app/api/v1' : DEFAULT_API_BASE);

        console.debug('[sync-store] initSyncStore for user', currentUser?.buwana_id, 'apiBase =', apiBase);

        // Update pending count from outbox
        connectivityState.pending = readOutbox().length;

        // Attach connectivity listeners once
        if (!initialized && typeof window !== 'undefined') {
            window.addEventListener('online', onConnectivityChange);
            window.addEventListener('offline', onConnectivityChange);
            initialized = true;
        }

        await determineConnectivity();
        return { ...connectivityState };
    }

    async function loadInitialState() {
        if (!currentUser?.buwana_id) {
            console.warn('[sync-store] loadInitialState called without user');
            return { calendars: [], itemsByCalendar: {} };
        }

        const online = await determineConnectivity();
        if (online) {
            await flushOutbox();
            try {
                const response = await fetch(`${apiBase}/get_user_items.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ buwana_id: currentUser.buwana_id })
                });
                const data = await response.json();
                const calendars = Array.isArray(data?.calendars) ? data.calendars : [];
                const itemsByCalendar = {};
                calendars.forEach((calendar) => {
                    const calId = calendar?.calendar_id;
                    if (!calId && calId !== 0) return;
                    const items = Array.isArray(calendar.items) ? calendar.items : [];
                    itemsByCalendar[calId] = items.map((item) => normalizeItem(item, calendar, currentUser.buwana_id));
                });
                persistCachedState(calendars, itemsByCalendar);
                return { calendars, itemsByCalendar };
            } catch (err) {
                console.warn('[sync-store] fetch latest state failed, falling back to cache', err);
            }
        }

        const cached = readCachedState();
        if (cached) {
            mirrorLegacyCaches(cached.calendars, cached.itemsByCalendar);
            return cached;
        }

        return { calendars: [], itemsByCalendar: {} };
    }

    function applyLocalChange(change) {
        const existing = readCachedState() || { calendars: [], itemsByCalendar: {} };
        const calendars = Array.isArray(existing.calendars) ? [...existing.calendars] : [];
        const itemsByCalendar = { ...existing.itemsByCalendar };
        const calId = change.payload?.calendar_id || change.payload?.cal_id;
        if (!calId && calId !== 0) return existing;

        if (!itemsByCalendar[calId]) itemsByCalendar[calId] = [];

        let calendar = calendars.find((c) => Number(c.calendar_id) === Number(calId));
        if (!calendar) {
            calendar = {
                calendar_id: calId,
                name: change.payload?.calendar_name || 'My Calendar',
                color: change.payload?.color_hex || change.payload?.color || '#3b82f6',
                emoji: change.payload?.emoji || '📅'
            };
            calendars.push(calendar);
        }

        const normalized = normalizeItem(
            {
                ...change.payload,
                item_id: change.payload.item_id || change.client_temp_id || change.item_id,
                summary: change.payload.summary || change.payload.title,
                description: change.payload.description || change.payload.notes,
                color_hex: change.payload.color_hex || change.payload.color
            },
            calendar,
            currentUser?.buwana_id
        );

        if (change.operation === 'delete') {
            itemsByCalendar[calId] = itemsByCalendar[calId].filter((item) => {
                return (
                    item.item_id !== change.item_id &&
                    item.item_id !== change.client_temp_id &&
                    item.unique_key !== change.client_temp_id
                );
            });
        } else if (change.operation === 'update') {
            let updated = false;
            itemsByCalendar[calId] = itemsByCalendar[calId].map((item) => {
                if (
                    item.item_id === normalized.item_id ||
                    item.item_id === change.item_id ||
                    item.item_id === change.client_temp_id
                ) {
                    updated = true;
                    return { ...item, ...normalized, pending: !connectivityState.online };
                }
                return item;
            });
            if (!updated) {
                itemsByCalendar[calId].push({ ...normalized, pending: true });
            }
        } else {
            itemsByCalendar[calId].push({ ...normalized, pending: !connectivityState.online });
        }

        persistCachedState(calendars, itemsByCalendar);
        return { calendars, itemsByCalendar };
    }

    function enqueueChange(operation, payload) {
        const outbox = readOutbox();
        const entry = {
            operation,
            payload,
            item_id: payload?.item_id || null,
            calendar_id: payload?.calendar_id || payload?.cal_id || null,
            client_temp_id: payload?.client_temp_id || `tmp_${Date.now()}`,
            queued_at: Date.now(),
            last_error: null
        };
        const outboxKey = storageKey('outbox');
        console.log('[sync-store] enqueueing offline change', {
            outboxKey,
            operation,
            calendar_id: entry.calendar_id,
            item_id: entry.item_id,
            client_temp_id: entry.client_temp_id,
            queued_at: entry.queued_at,
            payloadSnapshot: {
                summary: payload?.summary || payload?.title,
                start_local: payload?.start_local || payload?.date,
                calendar_name: payload?.calendar_name,
                color_hex: payload?.color_hex,
                emoji: payload?.emoji,
                pinned: payload?.pinned,
                all_day: payload?.all_day,
                tzid: payload?.tzid
            }
        });
        outbox.push(entry);
        persistOutbox(outbox);
        applyLocalChange(entry);
        return entry;
    }

    async function flushOutbox() {
        const queue = readOutbox();
        if (!queue.length) return [];
        const remaining = [];
        for (const entry of queue) {
            try {
                await applyChangeToServer(entry);
            } catch (err) {
                console.warn('[sync-store] failed to flush entry', err);
                remaining.push({ ...entry, last_error: err?.message || 'Unknown error' });
            }
        }
        persistOutbox(remaining);
        if (connectivityState.online && !remaining.length) {
            await loadInitialState();
        }
        return remaining;
    }

    async function applyChangeToServer(change) {
        const endpoint = change.operation === 'delete'
            ? 'delete_item.php'
            : change.operation === 'update'
                ? 'update_item.php'
                : 'add_item.php';
        const body = { ...change.payload };
        if (change.operation === 'delete') {
            body.item_id = change.item_id;
        }
        const res = await fetch(`${apiBase}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        if (data?.ok === false) {
            throw new Error(data?.error || 'Server rejected change');
        }
        return data;
    }

    async function createOrUpdateItem(payload) {
        const operation = payload?.item_id ? 'update' : 'create';
        const online = await determineConnectivity();
        if (!online) {
            enqueueChange(operation === 'create' ? 'create' : 'update', payload);
            return { ok: true, queued: true };
        }
        try {
            await applyChangeToServer({ operation, payload, item_id: payload?.item_id });
            await loadInitialState();
            return { ok: true, queued: false };
        } catch (err) {
            console.warn('[sync-store] live create/update failed, queueing', err);
            enqueueChange(operation === 'create' ? 'create' : 'update', { ...payload, last_error: err?.message });
            return { ok: false, queued: true, error: err };
        }
    }

    async function deleteItem(itemId, calendarId) {
        const payload = { item_id: itemId, calendar_id: calendarId, buwana_id: currentUser?.buwana_id };
        const online = await determineConnectivity();
        if (!online) {
            enqueueChange('delete', payload);
            return { ok: true, queued: true };
        }
        try {
            await applyChangeToServer({ operation: 'delete', payload, item_id: itemId });
            applyLocalChange({ operation: 'delete', payload, item_id: itemId, calendar_id: calendarId });
            await loadInitialState();
            return { ok: true, queued: false };
        } catch (err) {
            console.warn('[sync-store] delete failed, queueing', err);
            enqueueChange('delete', payload);
            return { ok: false, queued: true, error: err };
        }
    }

    function onOnlineStatusChange(cb) {
        if (typeof cb === 'function') {
            statusListeners.push(cb);
            cb({ ...connectivityState, pending: readOutbox().length });
        }
        return () => {
            statusListeners = statusListeners.filter((fn) => fn !== cb);
        };
    }

    function getStatus() {
        return { ...connectivityState, pending: readOutbox().length };
    }

    global.syncStore = {
        initSyncStore,
        loadInitialState,
        createOrUpdateItem,
        deleteItem,
        flushOutbox,
        onOnlineStatusChange,
        getStatus
    };
})(typeof window !== 'undefined' ? window : global);
