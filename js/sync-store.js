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
        if (typeof global.normalizeV1Item === 'function') {
            try {
                return global.normalizeV1Item(item, calendar, buwanaId);
            } catch (err) {
                console.warn('[sync-store] normalizeV1Item failed, falling back', err);
            }
        }
        const rawDate = item.start_local || item.dtstart_utc || '';
        const [datePart, timePart] = rawDate.split(' ');
        const timeLabel = (timePart || '00:00').slice(0, 5);
        return {
            unique_key: `v1_${calendar?.calendar_id || 'cal'}_${item.item_id || item.id || Date.now()}`,
            item_id: Number(item.item_id || item.id) || item.item_id || item.id,
            buwana_id: buwanaId,
            cal_id: Number(calendar?.calendar_id),
            cal_name: calendar?.name || 'My Calendar',
            cal_color: calendar?.color || '#3b82f6',
            title: item.summary || item.title || 'Untitled Event',
            date: datePart || item.date || '',
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
            all_day: item.all_day ? 1 : 0,
            tzid: item.tzid || calendar?.tzid || 'Etc/UTC',
            raw_v1: item
        };
    }

    async function checkBackendReachable() {
        if (!navigator.onLine) return false;
        try {
            const res = await fetch(`${apiBase}/get_earthcal_plans.php`, {
                method: 'GET',
                cache: 'no-store',
                credentials: 'same-origin'
            });
            return res.ok || res.status === 404;
        } catch (err) {
            console.debug('[sync-store] backend reachability failed', err);
            return false;
        }
    }

    async function determineConnectivity() {
        const reachable = await checkBackendReachable();
        connectivityState = {
            ...connectivityState,
            online: navigator.onLine && reachable,
            backendReachable: reachable,
            lastChecked: Date.now()
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
        currentUser = user;
        apiBase = options.apiBase || DEFAULT_API_BASE;
        connectivityState.pending = readOutbox().length;

        if (!initialized) {
            window.addEventListener('online', onConnectivityChange);
            window.addEventListener('offline', onConnectivityChange);
            initialized = true;
        }

        await determineConnectivity();
        return connectivityState;
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

        const normalized = normalizeItem(
            {
                ...change.payload,
                item_id: change.payload.item_id || change.client_temp_id || change.item_id,
                summary: change.payload.summary || change.payload.title,
                description: change.payload.description || change.payload.notes,
                color_hex: change.payload.color_hex || change.payload.color
            },
            calendars.find((c) => Number(c.calendar_id) === Number(calId)) || {
                calendar_id: calId,
                name: change.payload.calendar_name || 'My Calendar',
                color: change.payload.color_hex || '#3b82f6',
                emoji: change.payload.emoji || '📅'
            },
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
        if (connectivityState.online) {
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
