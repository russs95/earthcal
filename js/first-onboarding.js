(function () {
    'use strict';

    function persistOidcFallback(values) {
        try {
            const existingName = window.name;
            let existingPayload = {};

            if (existingName) {
                try {
                    existingPayload = JSON.parse(existingName);
                } catch (error) {
                    existingPayload = {};
                }
            }

            const oidcData = {
                ...(existingPayload.__earthcal_oidc || {}),
                ...values,
                timestamp: Date.now()
            };

            window.name = JSON.stringify({
                ...existingPayload,
                __earthcal_oidc: oidcData
            });
        } catch (error) {
            console.warn('[OIDC] Unable to persist fallback auth data:', error);
            try {
                window.name = JSON.stringify({
                    __earthcal_oidc: { ...values, timestamp: Date.now() }
                });
            } catch (nestedError) {
                console.warn('[OIDC] Unable to set window.name fallback:', nestedError);
            }
        }
    }

    function parseJwt(token) {
        if (!token) return null;
        try {
            const [, payload] = token.split('.');
            return JSON.parse(atob(payload));
        } catch (error) {
            console.warn('Unable to parse JWT payload.', error);
            return null;
        }
    }

    function isExpired(payload) {
        if (!payload?.exp) {
            return true;
        }
        return payload.exp <= Math.floor(Date.now() / 1000);
    }

    function isLoggedIn({ returnPayload = false } = {}) {
        const tryParse = (json) => {
            if (!json) return null;
            try {
                return JSON.parse(json);
            } catch (error) {
                return null;
            }
        };

        let payload = null;

        const sessionPayload = tryParse(sessionStorage.getItem('buwana_user'));
        if (sessionPayload && !isExpired(sessionPayload)) {
            payload = sessionPayload;
        }

        if (!payload) {
            const profilePayload = tryParse(localStorage.getItem('user_profile'));
            if (profilePayload && !isExpired(profilePayload)) {
                payload = profilePayload;
            }
        }

        if (!payload) {
            const idPayload = parseJwt(localStorage.getItem('id_token'));
            const accessPayload = parseJwt(localStorage.getItem('access_token'));
            payload = idPayload && !isExpired(idPayload)
                ? idPayload
                : accessPayload && !isExpired(accessPayload)
                    ? accessPayload
                    : null;
        }

        const hasValidSession = payload?.buwana_id && !isExpired(payload);
        if (returnPayload) {
            return { isLoggedIn: Boolean(hasValidSession), payload: hasValidSession ? payload : null };
        }
        return Boolean(hasValidSession);
    }

    function generateRandomString(length) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        array.forEach((value) => {
            result += charset[value % charset.length];
        });
        return result;
    }

    function base64UrlEncode(arrayBuffer) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async function generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return base64UrlEncode(digest);
    }

    function isLocalOrigin(origin) {
        return origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost');
    }

    function buildRedirectUri() {
        const origin = (window.location.origin || '').replace(/\/$/, '');
        const defaultRedirect = 'https://earthcal.app/auth/callback';
        const base = isLocalOrigin(origin)
            ? `${origin}/auth/callback`
            : defaultRedirect;

        return new URL(base).toString();
    }

    async function createJWTloginURL() {
        const buwanaAuthorizeURL = 'https://buwana.ecobricks.org/authorize';
        const client_id = 'ecal_7f3da821d0a54f8a9b58';
        const redirect_uri = buildRedirectUri();
        const scope = 'openid email profile';
        const lang = 'en';

        const state = generateRandomString(32);
        const nonce = generateRandomString(32);
        sessionStorage.setItem('oidc_state', state);
        sessionStorage.setItem('oidc_nonce', nonce);

        const code_verifier = generateRandomString(64);
        const code_challenge = await generateCodeChallenge(code_verifier);
        sessionStorage.setItem('pkce_code_verifier', code_verifier);
        persistOidcFallback({
            oidc_state: state,
            oidc_nonce: nonce,
            pkce_code_verifier: code_verifier
        });

        const url = new URL(buwanaAuthorizeURL);
        url.searchParams.append('client_id', client_id);
        url.searchParams.append('response_type', 'code');
        url.searchParams.append('scope', scope);
        url.searchParams.append('redirect_uri', redirect_uri);
        url.searchParams.append('state', state);
        url.searchParams.append('nonce', nonce);
        url.searchParams.append('code_challenge', code_challenge);
        url.searchParams.append('code_challenge_method', 'S256');
        url.searchParams.append('lang', lang);

        const loginButton = document.getElementById('auth-login-button');
        if (loginButton) {
            loginButton.onclick = () => {
                window.location.href = url.toString();
            };
        }

        return url.toString();
    }

    function resolveTimeZoneFromPayload(payload) {
        return payload?.['buwana:timeZone']
            || payload?.zoneinfo
            || payload?.tzid
            || payload?.time_zone
            || null;
    }

    function safeBrowserTimeZone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
        } catch (error) {
            console.warn('Unable to resolve browser timezone.', error);
            return null;
        }
    }

    async function firstGetUserData() {
        console.log('🌿 firstGetUserData: Checking session state...');
        const { isLoggedIn: ok, payload } = isLoggedIn({ returnPayload: true });

        if (!ok || !payload?.buwana_id) {
            console.warn('⚪ No active session detected for first-time onboarding.');
            return null;
        }

        try {
            if (!sessionStorage.getItem('buwana_user')) {
                sessionStorage.setItem('buwana_user', JSON.stringify(payload));
            }
        } catch (error) {
            console.warn('Unable to cache session payload in sessionStorage.', error);
        }

        const tokenTimeZone = resolveTimeZoneFromPayload(payload);
        const profile = {
            first_name: payload?.given_name || payload?.first_name || 'Earthling',
            email: payload?.email || null,
            buwana_id: payload?.buwana_id || null,
            earthling_emoji: payload?.['buwana:earthlingEmoji'] || '🌎',
            community: payload?.['buwana:community'] || null,
            continent: payload?.['buwana:location.continent'] || null,
            status: payload?.status || null,
            time_zone: tokenTimeZone
        };

        window.userProfile = profile;
        window.userLanguage = window.userLanguage || (navigator.language ? navigator.language.slice(0, 2) : 'en');
        window.userTimeZone = tokenTimeZone || window.userTimeZone || safeBrowserTimeZone();

        console.log('✅ firstGetUserData loaded profile:', profile);
        return { payload, profile };
    }

    window.isLoggedIn = isLoggedIn;
    window.createJWTloginURL = createJWTloginURL;
    window.firstGetUserData = firstGetUserData;
})();
