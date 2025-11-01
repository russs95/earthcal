(() => {
    const SUPPORTED_LANGUAGES = ["ar", "de", "en", "es", "fr", "id", "zh"];
    const fallbackTranslations = window.EARTHCAL_INDEX_TRANSLATIONS || {};
    const fallbackLanguage = (window.EARTHCAL_INDEX_LANGUAGE || "en").toLowerCase();

    const unique = (values) => Array.from(new Set(values.filter(Boolean)));

    const getNavigatorLanguages = () => {
        const languages = [];
        if (Array.isArray(navigator.languages)) {
            languages.push(...navigator.languages);
        }
        if (typeof navigator.language === "string") {
            languages.push(navigator.language);
        }
        if (typeof navigator.userLanguage === "string") {
            languages.push(navigator.userLanguage);
        }
        return languages
            .map((lang) => (typeof lang === "string" ? lang.toLowerCase() : ""))
            .map((lang) => lang.split("-")[0]);
    };

    const resolveLanguagePriority = () => {
        const detected = getNavigatorLanguages();
        const candidates = detected.filter((lang) => SUPPORTED_LANGUAGES.includes(lang));
        candidates.push(fallbackLanguage);
        return unique(candidates);
    };

    const loadLanguageFile = (lang) => {
        if (!lang || lang === fallbackLanguage) {
            return Promise.resolve({ lang: fallbackLanguage, translations: fallbackTranslations });
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = `translations/index-${lang}.js`;
            script.async = true;
            script.onload = () => {
                if (window.EARTHCAL_INDEX_TRANSLATIONS) {
                    resolve({ lang, translations: window.EARTHCAL_INDEX_TRANSLATIONS });
                } else {
                    reject(new Error(`Translations for language ${lang} did not register.`));
                }
            };
            script.onerror = () => reject(new Error(`Failed to load translations for language ${lang}.`));
            document.head.appendChild(script);
        });
    };

    const selectTranslations = async () => {
        const languagesToTry = resolveLanguagePriority();
        for (const lang of languagesToTry) {
            try {
                const result = await loadLanguageFile(lang);
                if (result && result.translations) {
                    return { ...result, fallback: fallbackTranslations };
                }
            } catch (error) {
                console.warn("EarthCal index: unable to load translations for", lang, error);
            }
        }
        return { lang: fallbackLanguage, translations: fallbackTranslations, fallback: fallbackTranslations };
    };

    window.__earthcalIndexI18nPromise = selectTranslations().then((result) => ({
        ...result,
        supported: SUPPORTED_LANGUAGES,
    }));
})();
