function persistOidcFallback(values) {
    try {
        const existingName = window.name;
        let existingPayload = {};
        if (existingName) {
            try {
                existingPayload = JSON.parse(existingName);
            } catch (err) {
                existingPayload = {};
            }
        }

        const oidcData = {
            ...(existingPayload.__earthcal_oidc || {}),
            ...values,
            timestamp: Date.now(),
        };

        window.name = JSON.stringify({
            ...existingPayload,
            __earthcal_oidc: oidcData,
        });
    } catch (error) {
        console.warn('[OIDC] Unable to persist fallback auth data:', error);
        try {
            window.name = JSON.stringify({
                __earthcal_oidc: { ...values, timestamp: Date.now() },
            });
        } catch (nestedError) {
            console.warn('[OIDC] Unable to set window.name fallback:', nestedError);
        }
    }
}

export async function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    array.forEach(x => result += charset[x % charset.length]);
    return result;
}

export async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isLocalOrigin(origin) {
    return origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://localhost');
}

export async function redirectToBuwana() {
    const buwanaAuthorizeURL = "https://buwana.ecobricks.org/authorize";
    const client_id = "ecal_7f3da821d0a54f8a9b58";
    const scope = "openid email profile";

    // 👇 Decide redirect_uri based on where we’re running
    const origin = window.location.origin;
    const defaultRedirectUri = "https://earthcal.app/auth/callback";

    // For snap / local dev, send user back to *this* origin’s /auth/callback
    let baseRedirectUri = isLocalOrigin(origin)
        ? `${origin.replace(/\/$/, '')}/auth/callback`
        : defaultRedirectUri;

    const redirectUriObj = new URL(baseRedirectUri);

    // Use browser language if available
    const lang = (navigator.language || "en").slice(0, 2) || "en";

    // PKCE + state/nonce as before
    const state = await generateRandomString(32);
    const nonce = await generateRandomString(32);
    sessionStorage.setItem("oidc_state", state);
    sessionStorage.setItem("oidc_nonce", nonce);

    const codeVerifier = await generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem("pkce_code_verifier", codeVerifier);
    persistOidcFallback({
        oidc_state: state,
        oidc_nonce: nonce,
        pkce_code_verifier: codeVerifier,
    });

    const url = new URL(buwanaAuthorizeURL);
    url.searchParams.append("client_id", client_id);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", scope);
    url.searchParams.append("redirect_uri", redirectUriObj.toString());
    url.searchParams.append("state", state);
    url.searchParams.append("nonce", nonce);
    url.searchParams.append("code_challenge", codeChallenge);
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("lang", lang);

    window.location.href = url.toString();
}
