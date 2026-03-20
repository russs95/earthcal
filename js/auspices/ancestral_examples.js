/*
 * ancestral-examples.js
 * EarthCal Ancestral Examples Library
 *
 * Purpose:
 * - Provide Indigenous and First Nations examples of ceremonial, ecological,
 *   calendrical, and seasonal practices associated with lunar and solar moments
 * - Serve as a grounding layer for EarthCal auspices
 * - Keep explicit track of confidence and source-review status
 *
 * Global export:
 *   window.EARTHCAL_ANCESTRAL_EXAMPLES
 */

(function () {
    "use strict";

    window.EARTHCAL_ANCESTRAL_EXAMPLES = {
        schema: "earthcal.ancestral-examples.v2",
        title: "EarthCal Ancestral Examples",
        description:
            "Examples of Indigenous, First Nations, and ancestral ceremonial, calendrical, and ecological practices associated with lunar and solar moments.",

        notes: [
            "These are grounding examples, not universal claims.",
            "Traditions are local, living, and internally diverse. Avoid flattening distinct peoples into a single rule.",
            "Some examples connect directly to a specific tag, while others are broader calendar-grounding examples.",
            "Entries marked usable-with-context should be presented carefully and without overgeneralization."
        ],

        confidenceScale: {
            high: "Well documented in Indigenous cultural, museum, educational, or historical sources.",
            moderate: "Reasonably supported but variable by community, region, or interpretation.",
            low: "Suggestive or partially documented; use with caution.",
            review_needed: "Promising example that should not be foregrounded until source review is completed."
        },

        examples: [

            // --------------------------------------------------
            // LUNAR: NEW MOON / DARK MOON
            // --------------------------------------------------

            {
                id: "maori-maramataka-new-moon-whiro",
                tags: ["new-moon"],
                layer: "lunar",
                culture: "Māori",
                region: "Aotearoa / New Zealand",
                title: "Whiro and dark-moon caution in maramataka",
                practiceType: "ecological calendar / planning / resource timing",
                summary:
                    "In many maramataka traditions, the dark beginning of the lunar cycle, often associated with Whiro, is treated as a low-energy or less favorable period for some activities, while timing for fishing, gardening, and gathering varies by iwi and locality.",
                confidence: "high",
                sourceType: "Indigenous ecological calendar / museum and encyclopedia documentation",
                reviewStatus: "usable-with-context",
                notes:
                    "Keep iwi variation explicit. Do not present one pan-Māori rule for all communities."
            },

            {
                id: "maori-maramataka-lunar-nights-guidance",
                tags: ["new-moon", "waxing-crescent", "full-moon", "waning"],
                layer: "lunar",
                culture: "Māori",
                region: "Aotearoa / New Zealand",
                title: "Named lunar nights guiding work and harvest",
                practiceType: "ecological calendar / fishing / gardening",
                summary:
                    "Maramataka names each night of the lunar month and links many of those nights to practical guidance for fishing, planting, eeling, shellfish gathering, and other work in te taiao.",
                confidence: "high",
                sourceType: "Indigenous ecological calendar / museum and encyclopedia documentation",
                reviewStatus: "usable",
                notes:
                    "Best shown as an example of lunar timing and activity guidance, not as a rigid universal prescription."
            },

            // --------------------------------------------------
            // LUNAR: FULL MOON / LUNAR CALENDARING
            // --------------------------------------------------

            {
                id: "anishinaabe-thirteen-grandmother-moons",
                tags: ["full-moon", "new-moon", "waxing", "waning"],
                layer: "lunar",
                culture: "Anishinaabe / Anishinaabeg",
                region: "Great Lakes and surrounding regions, North America",
                title: "Thirteen Grandmother Moons",
                practiceType: "lunar calendar / seasonal teaching / cultural orientation",
                summary:
                    "Anishinaabe lunar teachings and moon naming traditions use a cycle of named moons to orient seasonal teachings, ecological changes, and community life through the year.",
                confidence: "moderate-high",
                sourceType: "First Nations calendar and cultural publications",
                reviewStatus: "usable",
                notes:
                    "Best used as a lunar-calendar grounding example rather than a precise single-tag action rule."
            },

            {
                id: "haudenosaunee-lunar-calendar-cycle",
                tags: ["full-moon", "new-moon", "waxing", "waning"],
                layer: "lunar",
                culture: "Haudenosaunee",
                region: "Northeastern North America",
                title: "Thirteen-month lunar calendar and ceremonial year",
                practiceType: "lunar calendar / thanksgiving festivals / seasonal ceremony",
                summary:
                    "The Haudenosaunee calendar follows a lunar cycle of thirteen months, with ceremonies through the year that give thanks for sap flow, strawberries, green corn, and the harvest, linking moon time to reciprocal relationship with the land.",
                confidence: "high",
                sourceType: "National Museum of the American Indian educational material",
                reviewStatus: "usable",
                notes:
                    "A strong example of lunar calendrics structuring ceremonial and seasonal life."
            },

            {
                id: "anishinaabe-moon-names-seasonal-orientation",
                tags: ["full-moon", "waning", "waxing", "new-moon"],
                layer: "lunar",
                culture: "Anishinaabe / Anishinaabeg",
                region: "Great Lakes and surrounding regions, North America",
                title: "Moon names as seasonal orientation",
                practiceType: "seasonal calendar / ecological orientation",
                summary:
                    "Named moons in Anishinaabe calendars serve as seasonal teachers, tying timekeeping to ice, berries, animals, water, and changes in communal life rather than to abstract month names alone.",
                confidence: "moderate",
                sourceType: "First Nations calendar publications and cultural interpretation",
                reviewStatus: "usable-with-context",
                notes:
                    "Keep wording broad and ecological; avoid claiming one exact moon-name list for all Anishinaabe communities."
            },

            // --------------------------------------------------
            // LUNAR: ECLIPSE AND THRESHOLD
            // --------------------------------------------------

            {
                id: "indigenous-eclipse-thresholds-general",
                tags: ["solar-eclipse-window", "lunar-eclipse-window"],
                layer: "lunar",
                culture: "Multiple Indigenous peoples",
                region: "Global / comparative",
                title: "Eclipses as threshold events",
                practiceType: "cosmological response / caution / ceremony",
                summary:
                    "Across many Indigenous traditions, eclipses are understood as potent threshold events that may call for prayer, caution, witnessing, or temporary suspension of ordinary activity.",
                confidence: "moderate",
                sourceType: "Comparative Indigenous and ethnohistorical interpretation",
                reviewStatus: "usable-with-context",
                notes:
                    "Keep this broad and comparative. Do not attach it to a single nation unless the source is specific."
            },

            // --------------------------------------------------
            // SOLAR: WINTER SOLSTICE
            // --------------------------------------------------

            {
                id: "hopi-soyal-winter-solstice",
                tags: ["winter-solstice-window", "ascending-light"],
                layer: "solar",
                culture: "Hopi",
                region: "Arizona, USA",
                title: "Soyal and the winter solstice turning",
                practiceType: "winter solstice ceremony / prayer / renewal",
                summary:
                    "At winter solstice, Hopi Soyal welcomes the katsinam with prayer and ritual, marking a seasonal turning associated with renewal, rain, planting, and the life of corn.",
                confidence: "high",
                sourceType: "National Park Service educational source",
                reviewStatus: "usable",
                notes:
                    "A strong winter-solstice example tied to agricultural and ceremonial renewal."
            },

            {
                id: "haudenosaunee-midwinter-festival",
                tags: ["winter-solstice-window", "ascending-light"],
                layer: "solar",
                culture: "Haudenosaunee",
                region: "Northeastern North America",
                title: "Mid-Winter Festival and new-year renewal",
                practiceType: "seasonal ceremony / thanksgiving / renewal",
                summary:
                    "The Haudenosaunee ceremonial year begins with the Mid-Winter Festival, a time of thanksgiving and preparation for the new year that sits near the deep turning of winter.",
                confidence: "high",
                sourceType: "National Museum of the American Indian educational material",
                reviewStatus: "usable",
                notes:
                    "Useful as winter-reset grounding even though it is not identical to an astronomical solstice-day observance."
            },

            // --------------------------------------------------
            // SOLAR: SUMMER SOLSTICE
            // --------------------------------------------------

            {
                id: "zuni-dowa-yalanne-solstice-harvest",
                tags: ["summer-solstice-window", "descending-light"],
                layer: "solar",
                culture: "A:shiwi (Zuni)",
                region: "New Mexico, USA",
                title: "Dowa Yalanne and the path of the sun",
                practiceType: "solstice observation / agricultural ceremony / harvest timing",
                summary:
                    "The A:shiwi use Dowa Yalanne (Corn Mountain) to mark the path of the sun and determine the timing of solstice and harvest ceremonies within a reciprocal agricultural cycle.",
                confidence: "high",
                sourceType: "National Museum of the American Indian educational material",
                reviewStatus: "usable",
                notes:
                    "A very strong EarthCal example because it explicitly links solar observation, agriculture, and ceremony."
            },

            {
                id: "white-mountain-apache-summer-solstice-dance",
                tags: ["summer-solstice-window"],
                layer: "solar",
                culture: "White Mountain Apache",
                region: "Arizona, USA",
                title: "Summer solstice song and dance",
                practiceType: "solstice celebration / dance / blessing",
                summary:
                    "White Mountain Apache performers continue to mark the summer solstice through song and dance, including Crown Dance traditions associated with blessing, healing, protection, and rain.",
                confidence: "moderate-high",
                sourceType: "National Museum of the American Indian program documentation",
                reviewStatus: "usable",
                notes:
                    "Good for modern continuance of solstice observance; phrase carefully as a living performance tradition."
            },

            {
                id: "kichwa-hatun-puncha-inti-raymi",
                tags: ["summer-solstice-window", "descending-light"],
                layer: "solar",
                culture: "Kichwa-Otavaleño / Andean Indigenous traditions",
                region: "Ecuador and the northern Andes",
                title: "Hatun Puncha / Inti Raymi",
                practiceType: "solstice celebration / music / dance / seasonal ceremony",
                summary:
                    "Kichwa-Otavaleños celebrate Hatun Puncha, also called Inti Raymi, as a midsummer solar festival marked by music, dance, and communal movement through the landscape.",
                confidence: "high",
                sourceType: "Smithsonian Folklife documentation",
                reviewStatus: "usable",
                notes:
                    "A strong Indigenous solar example for celebration, fullness, and communal expression."
            },

            // --------------------------------------------------
            // SOLAR: ANNUAL LIGHT ARC / SEASONAL TURNING
            // --------------------------------------------------

            {
                id: "maori-matariki-new-year-threshold",
                tags: ["winter-solstice-window", "ascending-light", "new-moon"],
                layer: "solar",
                culture: "Māori",
                region: "Aotearoa / New Zealand",
                title: "Matariki and the new-year threshold",
                practiceType: "seasonal turning / new-year marking / calendrical renewal",
                summary:
                    "In many Māori traditions, the reappearance of Matariki and the first new moon following it mark the new-year threshold, joining stellar observation, lunar timing, and seasonal renewal.",
                confidence: "high",
                sourceType: "Museum and encyclopedia documentation",
                reviewStatus: "usable-with-context",
                notes:
                    "This is not a pure solar event, but it is highly relevant to winter turning, renewal, and the return of light."
            },

            {
                id: "zuni-annual-cycle-sun-and-seed",
                tags: ["winter-solstice-window", "summer-solstice-window", "ascending-light", "descending-light"],
                layer: "solar",
                culture: "A:shiwi (Zuni)",
                region: "New Mexico, USA",
                title: "Annual cycle of seed, rain, growth, and harvest",
                practiceType: "seasonal ceremonial cycle / agriculture",
                summary:
                    "A:shiwi agricultural and ceremonial life follows an annual cycle in which winter seed blessing, spring planting, summer ceremonies for rain, and harvest are linked through observation of season and sun.",
                confidence: "high",
                sourceType: "National Museum of the American Indian educational material",
                reviewStatus: "usable",
                notes:
                    "Excellent for grounding the broader solar arc rather than only a single annual event."
            },

            // --------------------------------------------------
            // PLACEHOLDERS FOR FUTURE RESEARCH
            // --------------------------------------------------

            {
                id: "cree-moon-seasonal-round-placeholder",
                tags: ["full-moon", "new-moon", "waxing", "waning"],
                layer: "lunar",
                culture: "Cree / nēhiyawak",
                region: "Northern and central North America",
                title: "Possible Cree moon-round seasonal example",
                practiceType: "seasonal calendar / lunar naming",
                summary:
                    "This is a promising area for a stronger Cree-specific lunar calendar example, but it should be expanded only with a clearly attributable community or educational source.",
                confidence: "review_needed",
                sourceType: "placeholder / needs community-specific source review",
                reviewStatus: "hold",
                notes:
                    "Included as a research placeholder only."
            },

            {
                id: "equinox-indigenous-specific-placeholder",
                tags: ["march-equinox-window", "september-equinox-window"],
                layer: "solar",
                culture: "Indigenous / First Nations examples to be determined",
                region: "To be determined",
                title: "Specific equinox example needed",
                practiceType: "placeholder",
                summary:
                    "A strong equinox-specific Indigenous example should be added only once it is grounded in a clear, attributable source from the relevant people or institution.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Included to mark a current gap in the library."
            }

        ]
    };

}());