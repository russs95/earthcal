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
        errors: 0,
        lastChecked: null
    };

    function parseLocalDateTimeParts(raw) {
        if (!raw) return null;
        const sanitized = String(raw).trim().replace('T', ' ');
        const match = sanitized.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
        );

        if (!match) return null;

        const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
        return {
            year: Number(year),
            month: Number(month),
            day: Number(day),
            hour: Number(hour),
            minute: Number(minute),
            second: Number(second)
        };
    }

    function getTimezoneOffsetMs(date, timeZone) {
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const parts = formatter.formatToParts(date);
            const filled = Object.fromEntries(parts.map((part) => [part.type, part.value]));
            const tzAsUtc = Date.UTC(
                Number(filled.year),
                Number(filled.month) - 1,
                Number(filled.day),
                Number(filled.hour),
                Number(filled.minute),
                Number(filled.second)
            );
            return tzAsUtc - date.getTime();
        } catch (err) {
            console.warn('[sync-store] unable to compute timezone offset, defaulting to 0ms:', err);
            return 0;
        }
    }

    function zonedDateTimeToUtc(localDateTime, timeZone) {
        const parts = parseLocalDateTimeParts(localDateTime);
        if (!parts) return null;

        const utcGuess = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second
        );
        const utcDate = new Date(utcGuess);
        const offset = getTimezoneOffsetMs(utcDate, timeZone);
        return new Date(utcGuess - offset);
    }

    function formatUtcIso(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    function storageKey(type) {
        if (!currentUser?.buwana_id) return null;
        return `ec_user_${currentUser.buwana_id}_${type}`;
    }

    function readOutbox() {
        const key = storageKey('outbox');
        if (!key) return [];
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed.map((entry) => ({
                status: 'pending',
                server_id: null,
                last_error: null,
                ...entry
            }));
        } catch (err) {
            console.warn('[sync-store] unable to parse outbox', err);
            return [];
        }
    }

    function summarizeOutbox(list) {
        const safeList = Array.isArray(list) ? list : [];
        const pending = safeList.filter((entry) => entry?.status !== 'sent' && entry?.status !== 'error').length;
        const errors = safeList.filter((entry) => entry?.status === 'error').length;
        return { pending, errors };
    }

    function persistOutbox(list) {
        const key = storageKey('outbox');
        if (!key) return;
        try {
            localStorage.setItem(key, JSON.stringify(list || []));
        } catch (err) {
            console.warn('[sync-store] unable to persist outbox', err);
        }
        const summary = summarizeOutbox(list);
        connectivityState.pending = summary.pending;
        connectivityState.errors = summary.errors;
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
            console.warn('[sync-store] unable to mirror calendar list', err);
        }

        const summary = summarizeOutbox(readOutbox());
        connectivityState.pending = summary.pending;
        connectivityState.errors = summary.errors;
        notifyStatusListeners({ totalItems, calendarCount: safeCalendars.length });
    }

    function normalizeItem(item, calendar, buwanaId) {
        const timeZone = item.tzid || calendar?.tzid || 'Etc/UTC';
        const toUtcDateTime = (rawLocal) => {
            if (!rawLocal) return null;
            const utcDate = zonedDateTimeToUtc(rawLocal, timeZone);
            return formatUtcIso(utcDate);
        };

        const localizedFromUtc = (() => {
            if (!item?.dtstart_utc) return null;
            const normalizedUtc = String(item.dtstart_utc).trim();
            if (!normalizedUtc) return null;

            const hasTzOffset = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalizedUtc);
            const isoCandidate = normalizedUtc.includes('T')
                ? normalizedUtc
                : normalizedUtc.replace(' ', 'T');
            const finalIso = hasTzOffset ? isoCandidate : `${isoCandidate}Z`;
            const parsed = new Date(finalIso);
            if (Number.isNaN(parsed.getTime())) return null;

            try {
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                const parts = formatter.formatToParts(parsed);
                const filled = Object.fromEntries(parts.map((part) => [part.type, part.value]));
                return {
                    datePart: `${filled.year}-${filled.month}-${filled.day}`,
                    year: Number(filled.year),
                    month: Number(filled.month),
                    day: Number(filled.day),
                    timePart: `${filled.hour}:${filled.minute}`
                };
            } catch (err) {
                console.warn('[sync-store] unable to localize dtstart_utc', err);
                return null;
            }
        })();

        const parseDateParts = () => {
            const preferLocalized = !item?.start_local && !item?.date;
            const rawDate =
                item.start_local ||
                item.date ||
                (preferLocalized && localizedFromUtc?.datePart
                    ? `${localizedFromUtc.datePart} ${localizedFromUtc.timePart || ''}`.trim()
                    : null) ||
                item.dtstart_utc ||
                '';
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

            if (!datePart && localizedFromUtc?.datePart) {
                datePart = localizedFromUtc.datePart;
            }
            if (!Number.isFinite(year) && Number.isFinite(localizedFromUtc?.year)) {
                year = localizedFromUtc.year;
            }
            if (!Number.isFinite(month) && Number.isFinite(localizedFromUtc?.month)) {
                month = localizedFromUtc.month;
            }
            if (!Number.isFinite(day) && Number.isFinite(localizedFromUtc?.day)) {
                day = localizedFromUtc.day;
            }

            return {
                datePart,
                year,
                month,
                day,
                timeOverride: preferLocalized ? localizedFromUtc?.timePart || null : null
            };
        };

        const { datePart, year, month, day, timeOverride } = parseDateParts();
        const timeLabel = (() => {
            if (timeOverride) {
                return timeOverride.slice(0, 5);
            }
            const rawDate = item.start_local || item.dtstart_utc || item.date || '';
            const timePart = String(rawDate).trim().replace('T', ' ').split(' ')[1] || item.time;
            const safeTime = (timePart || '00:00').slice(0, 5);
            return safeTime;
        })();

        let normalized;
        if (typeof global.normalizeV1Item === 'function') {
            try {
                normalized = global.normalizeV1Item(item, calendar, buwanaId);
            } catch (err) {
                console.warn('[sync-store] normalizeV1Item failed, falling back', err);
            }
        }

        if (!normalized) {
            const uniqueKey = `v1_${calendar?.calendar_id || 'cal'}_${item.item_id || item.id || Date.now()}`;
            const numericItemId = Number(item.item_id || item.id);
            const itemId = Number.isFinite(numericItemId) ? numericItemId : (item.item_id || item.id);
            const calendarId = Number(calendar?.calendar_id || item.calendar_id || item.cal_id);

            normalized = {
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
        }

        const finalDatePart = datePart || normalized?.date || item.date || '';

        const derivedFromDatePart = (() => {
            const match = String(finalDatePart)
                .trim()
                .split(' ')[0]
                .match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

            if (!match) return {};

            return {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(match[3])
            };
        })();

        const resolvedYear = (() => {
            const normalizedYear = Number(normalized?.year);
            if (Number.isFinite(derivedFromDatePart.year)) return derivedFromDatePart.year;
            if (Number.isFinite(normalizedYear)) return normalizedYear;
            if (Number.isFinite(year)) return year;
            return undefined;
        })();

        const resolvedMonth = (() => {
            const normalizedMonth = Number(normalized?.month);
            if (Number.isFinite(derivedFromDatePart.month)) return derivedFromDatePart.month;
            if (Number.isFinite(normalizedMonth)) return normalizedMonth;
            if (Number.isFinite(month)) return month;
            return undefined;
        })();

        const resolvedDay = (() => {
            const normalizedDay = Number(normalized?.day);
            if (Number.isFinite(derivedFromDatePart.day)) return derivedFromDatePart.day;
            if (Number.isFinite(normalizedDay)) return normalizedDay;
            if (Number.isFinite(day)) return day;
            return undefined;
        })();

        normalized.date = finalDatePart;
        normalized.year = resolvedYear;
        normalized.month = resolvedMonth;
        normalized.day = resolvedDay;

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

    const CONNECTIVITY_CACHE_MS = 18000;
    let cachedConnectivity = {
        lastChecked: 0,
        online: null,
        backendReachable: null
    };

    async function determineConnectivity(options = {}) {
        const { force = false } = options;
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

        const now = Date.now();
        if (
            !force &&
            cachedConnectivity.lastChecked &&
            now - cachedConnectivity.lastChecked < CONNECTIVITY_CACHE_MS &&
            cachedConnectivity.online !== null
        ) {
            connectivityState = {
                ...connectivityState,
                online: cachedConnectivity.online,
                backendReachable: cachedConnectivity.backendReachable,
                lastChecked: cachedConnectivity.lastChecked,
                forcedOffline: false
            };
            notifyStatusListeners();
            return connectivityState.online;
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
        cachedConnectivity = {
            lastChecked: connectivityState.lastChecked,
            online,
            backendReachable: reachable
        };

        notifyStatusListeners();
        return connectivityState.online;
    }


    function notifyStatusListeners(extra = {}) {
        const summary = summarizeOutbox(readOutbox());
        const payload = {
            ...connectivityState,
            ...extra,
            pending: summary.pending,
            errors: summary.errors
        };
        statusListeners.forEach((cb) => {
            try {
                cb(payload);
            } catch (err) {
                console.warn('[sync-store] status listener failed', err);
            }
        });
    }

    function onConnectivityChange() {
        determineConnectivity({ force: true }).then((online) => {
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

        // Update pending count from outbox
        const summary = summarizeOutbox(readOutbox());
        connectivityState.pending = summary.pending;
        connectivityState.errors = summary.errors;

        // Attach connectivity listeners once
        if (!initialized && typeof window !== 'undefined') {
            window.addEventListener('online', onConnectivityChange);
            window.addEventListener('offline', onConnectivityChange);
            initialized = true;
        }

        await determineConnectivity({ force: true });
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
        let pendingItem = null;

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
            const pendingFlag = change.status === 'pending' || (change.status !== 'sent' && !connectivityState.online);
            const pendingAction = change.payload?.pending_action || change.pending_action || 'update';
            let updated = false;
            itemsByCalendar[calId] = itemsByCalendar[calId].map((item) => {
                if (
                    item.item_id === normalized.item_id ||
                    item.item_id === change.item_id ||
                    item.item_id === change.client_temp_id
                ) {
                    updated = true;
                    const nextItem = {
                        ...item,
                        ...normalized,
                        pending: pendingFlag,
                        pending_action: pendingFlag ? pendingAction : undefined,
                        last_error: change.status === 'error' ? change.last_error || 'Sync failed' : null
                    };
                    pendingItem = nextItem;
                    return nextItem;
                }
                return item;
            });
            if (!updated) {
                const nextItem = {
                    ...normalized,
                    pending: pendingFlag,
                    pending_action: pendingFlag ? pendingAction : undefined,
                    last_error: change.status === 'error' ? change.last_error || 'Sync failed' : null
                };
                pendingItem = nextItem;
                itemsByCalendar[calId].push(nextItem);
            }
        } else {
            const pendingFlag = change.status === 'pending' || (change.status !== 'sent' && !connectivityState.online);
            const pendingAction = change.operation === 'create' ? 'create' : (change.payload?.pending_action || change.pending_action || 'update');
            const nextItem = {
                ...normalized,
                pending: pendingFlag,
                pending_action: pendingFlag ? pendingAction : undefined,
                last_error: change.status === 'error' ? change.last_error || 'Sync failed' : null
            };
            pendingItem = nextItem;
            itemsByCalendar[calId].push(nextItem);
        }

        persistCachedState(calendars, itemsByCalendar);
        return { calendars, itemsByCalendar, item: pendingItem || normalized, calendarId: calId };
    }

    function upsertOutboxEntry(entry) {
        const outbox = readOutbox();
        const idx = outbox.findIndex((e) => e.client_temp_id === entry.client_temp_id || e.item_id === entry.item_id);
        const merged = {
            status: 'pending',
            last_error: null,
            server_id: null,
            ...entry
        };
        if (idx >= 0) {
            outbox[idx] = { ...outbox[idx], ...merged };
        } else {
            outbox.push(merged);
        }
        persistOutbox(outbox);
        return merged;
    }

    function removeOutboxEntryByClientId(clientTempId) {
        persistOutbox(
            readOutbox().filter(
                (entry) => entry.client_temp_id !== clientTempId && entry.item_id !== clientTempId
            )
        );
    }

    function enqueueChange(operation, payload, options = {}) {
        const entry = {
            operation,
            payload,
            item_id: payload?.item_id || null,
            calendar_id: payload?.calendar_id || payload?.cal_id || null,
            client_temp_id: payload?.client_temp_id || payload?.item_id || `tmp_${Date.now()}`,
            queued_at: Date.now(),
            status: options.status || 'pending',
            last_error: options.last_error || null,
            server_id: options.server_id || null
        };
        const stored = upsertOutboxEntry(entry);
        if (options.applyLocalChange !== false) {
            applyLocalChange(stored);
        }
        return stored;
    }

    let flushInFlight = null;
    async function flushOutbox(options = {}) {
        if (flushInFlight) {
            return flushInFlight;
        }

        flushInFlight = (async () => {
            const { skipReload = false } = options;
            const queue = readOutbox();
            if (!queue.length) return [];
            const remaining = [];
            let hadSuccess = false;
            for (const entry of queue) {
                if (entry.status === 'sent') continue;
                try {
                    if (entry.operation === 'delete') {
                        await applyChangeToServer(entry);
                        applyLocalChange({ ...entry, status: 'sent' });
                        hadSuccess = true;
                        continue;
                    }
                    const response = await applyChangeToServer(entry);
                    const serverItem = response?.item || response?.data || response;
                    const calId = entry.calendar_id || entry.payload?.calendar_id || entry.payload?.cal_id;
                    const serverId = response?.item_id || serverItem?.item_id || serverItem?.id || entry.item_id;
                    await reconcileServerItem(calId, entry.client_temp_id, serverItem || { ...entry.payload, item_id: serverId });
                    hadSuccess = true;
                } catch (err) {
                    console.warn('[sync-store] failed to flush entry', err);
                    const errored = {
                        ...entry,
                        status: 'error',
                        last_error: err?.message || 'Unknown error',
                        error_at: Date.now()
                    };
                    applyLocalChange(errored);
                    remaining.push(errored);
                }
            }
            persistOutbox(remaining);
            if (!skipReload && connectivityState.online && hadSuccess && remaining.length === 0) {
                await loadInitialState();
            }
            return remaining;
        })();

        try {
            return await flushInFlight;
        } finally {
            flushInFlight = null;
        }
    }

    async function applyChangeToServer(change) {
        const endpoint = change.operation === 'delete'
            ? 'delete_item.php'
            : change.operation === 'update'
                ? 'update_item.php'
                : 'add_item.php';
        const body = { ...change.payload };
        delete body.pending_action;
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

    function reconcileServerItem(calId, clientTempId, serverItem) {
        if (!calId && calId !== 0) return;
        const cached = readCachedState() || { calendars: [], itemsByCalendar: {} };
        const calendars = Array.isArray(cached.calendars) ? [...cached.calendars] : [];
        const itemsByCalendar = { ...cached.itemsByCalendar };
        const calendar = calendars.find((c) => Number(c.calendar_id) === Number(calId));
        const normalized = normalizeItem(serverItem || {}, calendar, currentUser?.buwana_id);
        const targetId = normalized.item_id || clientTempId;
        const items = Array.isArray(itemsByCalendar[calId]) ? [...itemsByCalendar[calId]] : [];
        let replaced = false;

        const updatedItems = items.map((item) => {
            if (
                item.item_id === clientTempId ||
                item.unique_key === clientTempId ||
                item.item_id === targetId
            ) {
                replaced = true;
                return {
                    ...item,
                    ...normalized,
                    item_id: normalized.item_id || targetId,
                    pending: false,
                    pending_action: undefined,
                    last_error: null
                };
            }
            return item;
        });

        if (!replaced) {
            updatedItems.push({ ...normalized, pending: false, pending_action: undefined, last_error: null });
        }

        itemsByCalendar[calId] = updatedItems;

        const outbox = readOutbox();
        const updatedOutbox = outbox
            .map((entry) => {
                if (entry.client_temp_id === clientTempId || entry.item_id === clientTempId) {
                    return {
                        ...entry,
                        status: 'sent',
                        server_id: normalized.item_id || entry.server_id || entry.item_id
                    };
                }
                return entry;
            })
            .filter((entry) => entry.status !== 'sent');

        persistCachedState(calendars, itemsByCalendar);
        persistOutbox(updatedOutbox);
    }

    async function createOrUpdateItem(payload) {
        const operation = payload?.item_id ? 'update' : 'create';
        const clientTempId = payload?.client_temp_id || payload?.item_id || `tmp_${Date.now()}`;
        const change = enqueueChange(
            operation,
            { ...payload, client_temp_id: clientTempId },
            { applyLocalChange: false }
        );
        const pendingState = applyLocalChange(change);
        const pendingItem = pendingState?.item;

        const online = await determineConnectivity();
        if (online) {
            flushOutbox({ skipReload: true }).catch((err) => console.warn('[sync-store] async flush failed', err));
        }

        notifyStatusListeners();

        return { ok: true, queued: true, item: pendingItem, client_temp_id: clientTempId };
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
            enqueueChange('delete', payload, { status: 'error', last_error: err?.message || 'Unknown error' });
            return { ok: false, queued: true, error: err };
        }
    }

    function onOnlineStatusChange(cb) {
        if (typeof cb === 'function') {
            statusListeners.push(cb);
            const summary = summarizeOutbox(readOutbox());
            cb({ ...connectivityState, pending: summary.pending, errors: summary.errors });
        }
        return () => {
            statusListeners = statusListeners.filter((fn) => fn !== cb);
        };
    }

    function getStatus() {
        const summary = summarizeOutbox(readOutbox());
        return { ...connectivityState, pending: summary.pending, errors: summary.errors };
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
