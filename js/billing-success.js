const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 24; // ~1 minute

const spinnerEl = document.getElementById('status-spinner');
const statusMessageEl = document.getElementById('status-message');
const statusLogEl = document.getElementById('status-log');
const celebrateOverlayEl = document.getElementById('celebrate-overlay');

const createLogEntry = (() => {
    const entries = [];
    return (message) => {
        const timestamp = new Date().toLocaleTimeString();
        entries.push(`[${timestamp}] ${message}`);
        if (entries.length > 200) {
            entries.splice(0, entries.length - 200);
        }
        statusLogEl.innerHTML = `<code>${entries.join('\n')}</code>`;
    };
})();

const safeStorageGet = (storage, key) => {
    try {
        return storage.getItem(key);
    } catch (error) {
        console.warn(`Unable to read ${key} from storage.`, error);
        return null;
    }
};

const safeStorageSet = (storage, key, value) => {
    try {
        storage.setItem(key, value);
    } catch (error) {
        console.warn(`Unable to persist ${key} in storage.`, error);
    }
};

const safeJsonParse = (value, context) => {
    if (typeof value !== 'string' || !value.length) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        if (context) {
            console.warn(`Unable to parse ${context} as JSON.`, error);
        }
        return null;
    }
};

const parseBuwanaId = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('buwana_id') || params.get('id');
        const fromSession = safeStorageGet(sessionStorage, 'buwana_id');
        const fromLocal = safeStorageGet(localStorage, 'buwana_id');
        const fromGlobal = typeof window !== 'undefined'
            ? window.__EARTHCAL_BUWANA_ID__ || null
            : null;

        const sessionUser = safeJsonParse(
            safeStorageGet(sessionStorage, 'buwana_user'),
            'sessionStorage.buwana_user',
        );
        const localUser = safeJsonParse(
            safeStorageGet(localStorage, 'buwana_user'),
            'localStorage.buwana_user',
        );

        const fromSessionProfile = sessionUser?.buwana_id;
        const fromLocalProfile = localUser?.buwana_id;

        let fromCookie = null;
        if (typeof document !== 'undefined' && typeof document.cookie === 'string') {
            const cookieMatch = document.cookie.match(/(?:^|;\s*)buwana_id=(\d+)/);
            if (cookieMatch) {
                fromCookie = cookieMatch[1];
            }
        }

        const candidates = [
            fromQuery,
            fromSession,
            fromLocal,
            fromGlobal,
            fromSessionProfile,
            fromLocalProfile,
            fromCookie,
        ].filter((candidate) => candidate !== null && candidate !== undefined);
        for (const candidate of candidates) {
            const value = Number(candidate);
            if (Number.isFinite(value) && value > 0) {
                return value;
            }
        }
    } catch (error) {
        console.warn('Unable to parse buwana_id from storage.', error);
    }
    return null;
};

const determinePlanId = (subscriptionData) => {
    if (!subscriptionData) return null;
    const planIdCandidates = [
        subscriptionData.plan_id,
        subscriptionData.planId,
        subscriptionData?.plan?.plan_id,
        subscriptionData?.plan?.planId,
    ];

    for (const candidate of planIdCandidates) {
        const numeric = Number(candidate);
        if (Number.isFinite(numeric)) {
            return numeric;
        }
    }
    return null;
};

const determineIsJediPlan = (payload) => {
    if (!payload) return false;

    const subscription = payload.current_subscription || null;
    if (!subscription) {
        return false;
    }

    const planId = determinePlanId(subscription);
    if (planId && [2, 3, 4].includes(planId)) {
        return true;
    }

    const planNameCandidates = [
        subscription?.plan?.name,
        subscription?.plan_name,
        subscription?.name,
        payload?.current_plan_name,
    ].filter(Boolean);

    const planSlugCandidates = [
        subscription?.plan?.slug,
        subscription?.plan_slug,
        subscription?.slug,
    ].filter(Boolean);

    const normalizedNames = planNameCandidates
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean);
    const normalizedSlugs = planSlugCandidates
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean);

    if (normalizedNames.some((value) => value.includes('jedi'))) {
        return true;
    }

    if (normalizedSlugs.some((value) => value.includes('jedi'))) {
        return true;
    }

    return false;
};

const updateStatus = (message, { highlight = false } = {}) => {
    statusMessageEl.innerHTML = highlight ? `<strong>${message}</strong>` : message;
};

const showCelebration = () => {
    spinnerEl?.setAttribute('hidden', 'hidden');
    celebrateOverlayEl?.classList.add('is-active');
};

const pollSubscription = async (buwanaId) => {
    if (!Number.isFinite(buwanaId)) {
        updateStatus('Missing account details. Please contact support so we can activate your powers.');
        createLogEntry('❌ Unable to poll subscription without a buwana_id.');
        spinnerEl?.setAttribute('hidden', 'hidden');
        return;
    }

    createLogEntry(`🌍 Checking subscription for buwana_id: ${buwanaId}`);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            const response = await fetch('api/v1/check_user_sub.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buwana_id: buwanaId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();

            if (payload?.ok === false) {
                throw new Error(payload?.error || 'subscription_lookup_failed');
            }

            if (determineIsJediPlan(payload)) {
                const planName = payload?.current_subscription?.plan?.name
                    || payload?.current_subscription?.plan_name
                    || payload?.current_plan_name
                    || 'Jedi';
                updateStatus(`Recognition confirmed. Welcome to the ${planName} plan!`, { highlight: true });
                createLogEntry(`🟢 Jedi subscription detected on attempt ${attempt}.`);
                showCelebration();
                safeStorageSet(sessionStorage, 'earthcal_plan', 'jedi');
                safeStorageSet(localStorage, 'earthcal_plan', 'jedi');
                setTimeout(() => {
                    window.location.assign('dash.html');
                }, 3500);
                return;
            }

            const waitSeconds = POLL_INTERVAL_MS / 1000;
            updateStatus(`Not Jedi yet → Next poll in ${waitSeconds}s…`);
            createLogEntry(`Attempt ${attempt}: Jedi plan not detected yet. Retrying in ${waitSeconds}s.`);
        } catch (error) {
            const waitSeconds = POLL_INTERVAL_MS / 1000;
            updateStatus(`Connection hiccup → retrying in ${waitSeconds}s`);
            createLogEntry(`⚠️ Poll attempt ${attempt} failed: ${error instanceof Error ? error.message : error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    createLogEntry('⏳ Maximum polling attempts reached without detecting Jedi access.');
    updateStatus('We could not confirm your Jedi access just yet. Our support team has been notified.');
    spinnerEl?.setAttribute('hidden', 'hidden');
};

const init = () => {
    const buwanaId = parseBuwanaId();
    if (Number.isFinite(buwanaId)) {
        safeStorageSet(sessionStorage, 'buwana_id', String(buwanaId));
        safeStorageSet(localStorage, 'buwana_id', String(buwanaId));
    }

    pollSubscription(buwanaId);
};

window.addEventListener('DOMContentLoaded', init);
