const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 24; // ~1 minute

const spinnerEl = document.getElementById('status-spinner');
const statusMessageEl = document.getElementById('status-message');
const statusLogEl = document.getElementById('status-log');
const statusIndicatorEl = document.getElementById('status-indicator');
const successBenefitsEl = document.getElementById('success-benefits');
const celebrateOverlayEl = document.getElementById('celebrate-overlay');

const createLogEntry = (() => {
    const entries = [];
    return (message) => {
        const timestamp = new Date().toLocaleTimeString();
        entries.push(`[${timestamp}] ${message}`);
        if (entries.length > 200) {
            entries.splice(0, entries.length - 200);
        }
        if (statusLogEl && !statusLogEl.hasAttribute('hidden')) {
            statusLogEl.innerHTML = `<code>${entries.join('\n')}</code>`;
        }
    };
})();

const safeStorageSet = (storage, key, value) => {
    try {
        storage.setItem(key, value);
    } catch (error) {
        console.warn(`Unable to persist ${key} in storage.`, error);
    }
};

const getSessionIdFromLocation = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('session_id') || params.get('session') || params.get('id');
        if (!raw) {
            return null;
        }

        const trimmed = raw.trim();
        return trimmed.length > 0 ? trimmed : null;
    } catch (error) {
        console.warn('Unable to read session_id from location.', error);
        return null;
    }
};

const fetchBuwanaIdForSession = async (sessionId) => {
    const url = new URL('api/v1/stripe_webhook.php', window.location.href);
    url.searchParams.set('session_id', sessionId);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`session_lookup_failed_${response.status}`);
    }

    const payload = await response.json();
    const buwanaId = Number(payload?.buwana_id ?? payload?.buwanaId);

    if (payload?.ok && Number.isFinite(buwanaId) && buwanaId > 0) {
        return buwanaId;
    }

    throw new Error(payload?.error || 'buwana_id_not_found');
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

const displaySuccessBenefits = () => {
    if (statusLogEl) {
        statusLogEl.setAttribute('hidden', 'hidden');
        statusLogEl.setAttribute('aria-hidden', 'true');
    }
    if (statusIndicatorEl) {
        statusIndicatorEl.classList.add('status-indicator--success');
    }
    if (successBenefitsEl) {
        successBenefitsEl.removeAttribute('hidden');
    }
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
                displaySuccessBenefits();
                safeStorageSet(sessionStorage, 'earthcal_plan', 'jedi');
                safeStorageSet(localStorage, 'earthcal_plan', 'jedi');
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

const init = async () => {
    const sessionId = getSessionIdFromLocation();

    if (!sessionId) {
        updateStatus('Missing checkout session details. Please return to the app and try again.');
        createLogEntry('❌ No session_id present in the URL.');
        spinnerEl?.setAttribute('hidden', 'hidden');
        return;
    }

    createLogEntry(`🛰️ Resolving checkout session ${sessionId}…`);

    try {
        const buwanaId = await fetchBuwanaIdForSession(sessionId);
        createLogEntry(`✅ Session linked to buwana_id ${buwanaId}.`);
        safeStorageSet(sessionStorage, 'buwana_id', String(buwanaId));
        safeStorageSet(localStorage, 'buwana_id', String(buwanaId));
        pollSubscription(buwanaId);
    } catch (error) {
        updateStatus('We could not confirm your account. Please contact support so we can help.');
        createLogEntry(`❌ Unable to resolve buwana_id from session: ${error instanceof Error ? error.message : error}`);
        spinnerEl?.setAttribute('hidden', 'hidden');
    }
};

window.addEventListener('DOMContentLoaded', () => {
    init().catch((error) => {
        console.error('Billing success init failed.', error);
        updateStatus('Unexpected error occurred. Please contact support.');
        createLogEntry(`❌ Initialization error: ${error instanceof Error ? error.message : error}`);
        spinnerEl?.setAttribute('hidden', 'hidden');
    });
});
