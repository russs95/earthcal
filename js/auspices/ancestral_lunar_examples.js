/*
 * ancestral_lunar_examples.js
 * EarthCal Ancestral Lunar Examples Library
 *
 * Purpose:
 * - Provide examples of traditional, ceremonial, agricultural, and cultural
 *   practices associated with lunar moments
 * - Serve as a grounding layer for EarthCal auspices
 * - Keep explicit track of confidence and source-review status
 *
 * Global export:
 *   window.EARTHCAL_ANCESTRAL_LUNAR_EXAMPLES
 */

(function () {
    "use strict";

    window.EARTHCAL_ANCESTRAL_LUNAR_EXAMPLES = {
        schema: "earthcal.ancestral-lunar-examples.v1",
        title: "EarthCal Ancestral Lunar Examples",
        description:
            "Examples of ancestral, traditional, ceremonial, and cultural practices associated with lunar moments.",

        notes: [
            "These are grounding examples, not universal claims.",
            "Some entries are broadly documented; others require further source review before prominent display.",
            "Traditions are often local, diverse, and internally varied. Avoid flattening cultures into a single rule."
        ],

        confidenceScale: {
            high: "Well documented in historical, ethnographic, or widely recognized traditional sources.",
            moderate: "Reasonably supported but may vary regionally or by interpretation.",
            low: "Suggestive or partially documented; use with caution.",
            review_needed: "Plausible or promising example that should not be foregrounded until source review is completed."
        },

        examples: [

            // --------------------------------------------------
            // FULL MOON
            // --------------------------------------------------

            {
                id: "buddhist-uposatha-full-moon",
                tags: ["full-moon"],
                culture: "Theravāda Buddhist traditions",
                region: "Sri Lanka, Thailand, Myanmar, Laos, Cambodia and related regions",
                title: "Full moon observance days",
                practiceType: "religious observance",
                summary:
                    "In many Theravāda Buddhist traditions, full moon days are especially significant for Uposatha observance, reflection, offerings, and communal religious practice.",
                confidence: "high",
                sourceType: "living religious tradition / historical documentation",
                reviewStatus: "usable",
                notes:
                    "A strong example of full moon timing in an enduring spiritual calendar."
            },

            {
                id: "hindu-purnima-observance",
                tags: ["full-moon"],
                culture: "Hindu traditions",
                region: "South Asia",
                title: "Purnima observances",
                practiceType: "ritual / fasting / festival",
                summary:
                    "Many Hindu traditions mark the full moon, or Purnima, with fasting, worship, pilgrimage, storytelling, and festival observance, though forms vary by region and lineage.",
                confidence: "high",
                sourceType: "living religious tradition / historical documentation",
                reviewStatus: "usable",
                notes:
                    "Excellent general grounding example for full moon ceremonial timing."
            },

            {
                id: "jewish-full-moon-festivals",
                tags: ["full-moon"],
                culture: "Jewish tradition",
                region: "Levant / global Jewish diaspora",
                title: "Festivals near the full moon",
                practiceType: "festival calendar",
                summary:
                    "Several major Jewish festivals occur around the full moon within the lunisolar calendar, reflecting the importance of lunar timing in ritual and communal life.",
                confidence: "high",
                sourceType: "religious calendar / historical tradition",
                reviewStatus: "usable",
                notes:
                    "Useful as a broad example of full moon alignment in calendrical religion."
            },

            {
                id: "mid-autumn-full-moon",
                tags: ["full-moon"],
                culture: "Chinese cultural traditions",
                region: "China and East Asian cultural sphere",
                title: "Mid-Autumn full moon celebration",
                practiceType: "festival / family gathering",
                summary:
                    "The Mid-Autumn Festival centers on the harvest moon and is associated with reunion, moon-viewing, offerings, and seasonal reflection.",
                confidence: "high",
                sourceType: "living cultural tradition",
                reviewStatus: "usable",
                notes:
                    "A strong example of full moon as a communal and aesthetic focal point."
            },

            // --------------------------------------------------
            // NEW MOON
            // --------------------------------------------------

            {
                id: "islamic-new-crescent-calendar",
                tags: ["new-moon"],
                culture: "Islamic traditions",
                region: "Global Muslim world",
                title: "New crescent month beginning",
                practiceType: "calendar / communal observation",
                summary:
                    "Islamic months begin with the sighting of the new crescent, making the new-moon threshold central to ritual timing, fasting, and feast observance.",
                confidence: "high",
                sourceType: "living religious tradition / calendar practice",
                reviewStatus: "usable",
                notes:
                    "Strictly speaking this is tied to first visible crescent rather than the invisible astronomical new moon, but it is closely related and highly relevant."
            },

            {
                id: "hindu-amavasya-observance",
                tags: ["new-moon"],
                culture: "Hindu traditions",
                region: "South Asia",
                title: "Amavasya observances",
                practiceType: "ritual / ancestor rites / fasting",
                summary:
                    "In many Hindu traditions, Amavasya, the new moon, is associated with inward rites, fasting, ancestor remembrance, and acts of offering.",
                confidence: "high",
                sourceType: "living religious tradition",
                reviewStatus: "usable",
                notes:
                    "A strong example of new moon as an inward and ancestral threshold."
            },

            {
                id: "maori-maramataka-new-moon",
                tags: ["new-moon"],
                culture: "Māori traditions",
                region: "Aotearoa / New Zealand",
                title: "Maramataka dark moon planning",
                practiceType: "ecological calendar / planning",
                summary:
                    "In maramataka knowledge systems, dark moon phases can be associated with reduced outward activity, careful planning, and timing decisions that vary by iwi and locality.",
                confidence: "moderate",
                sourceType: "indigenous ecological calendar",
                reviewStatus: "usable-with-context",
                notes:
                    "Important to preserve iwi variation and avoid presenting one pan-Māori rule."
            },

            // --------------------------------------------------
            // WANING / DESCENDING / BIODYNAMIC AGRICULTURAL TRADITIONS
            // --------------------------------------------------

            {
                id: "biodynamic-waning-descending-harvest",
                tags: ["waning", "descending", "waning-descending"],
                culture: "Biodynamic farming tradition",
                region: "Europe and global biodynamic communities",
                title: "Rootward and consolidating work",
                practiceType: "agricultural timing",
                summary:
                    "Biodynamic growers often associate waning and especially waning-descending periods with root crops, pruning, soil work, composting, and consolidating garden tasks.",
                confidence: "high",
                sourceType: "agricultural tradition / biodynamic calendar practice",
                reviewStatus: "usable",
                notes:
                    "This is one of the clearest traditional timing associations for the lunar layer."
            },

            {
                id: "european-folk-waning-pruning",
                tags: ["waning", "waning-crescent", "descending"],
                culture: "European folk agricultural traditions",
                region: "Europe",
                title: "Waning moon pruning and cutting",
                practiceType: "folk agriculture / orchard care",
                summary:
                    "Many European folk calendars recommend pruning, cutting timber, or reducing plant growth during the waning moon, especially where less sap or regrowth was desired.",
                confidence: "moderate",
                sourceType: "folk agricultural tradition",
                reviewStatus: "usable-with-context",
                notes:
                    "Regional practices vary, but waning-moon reduction work is widely attested in folk agriculture."
            },

            // --------------------------------------------------
            // WAXING / ASCENDING
            // --------------------------------------------------

            {
                id: "biodynamic-waxing-ascending-growth",
                tags: ["waxing", "ascending", "waxing-ascending"],
                culture: "Biodynamic farming tradition",
                region: "Europe and global biodynamic communities",
                title: "Upward and expressive planting times",
                practiceType: "agricultural timing",
                summary:
                    "Biodynamic calendars often associate waxing and especially waxing-ascending periods with above-ground crops, fruiting plants, flowering plants, and visible growth work.",
                confidence: "high",
                sourceType: "agricultural tradition / biodynamic calendar practice",
                reviewStatus: "usable",
                notes:
                    "Useful counterpart to the waning-descending rootward interpretation."
            },

            // --------------------------------------------------
            // NODE / ECLIPSE THRESHOLDS
            // --------------------------------------------------

            {
                id: "biodynamic-node-avoidance",
                tags: ["node-window", "ascending-node", "descending-node"],
                culture: "Biodynamic farming tradition",
                region: "Europe and global biodynamic communities",
                title: "Node avoidance periods",
                practiceType: "agricultural caution period",
                summary:
                    "Biodynamic calendars often mark lunar node periods as unsuitable for sowing, grafting, or sensitive cultivation, treating them as unstable thresholds.",
                confidence: "high",
                sourceType: "agricultural tradition / biodynamic calendar practice",
                reviewStatus: "usable",
                notes:
                    "Very relevant for cautionary EarthCal messaging."
            },

            {
                id: "eclipse-ritual-thresholds-general",
                tags: ["solar-eclipse-window", "lunar-eclipse-window"],
                culture: "Multiple cultures",
                region: "Global",
                title: "Eclipses as ritual thresholds",
                practiceType: "ritual / cosmological response",
                summary:
                    "Across many cultures, eclipses have been interpreted as potent thresholds that call for ritual response, caution, awe, prayer, or suspension of ordinary action.",
                confidence: "high",
                sourceType: "comparative cultural history",
                reviewStatus: "usable",
                notes:
                    "A broad, cross-cultural framing rather than a claim about one single tradition."
            },

            // --------------------------------------------------
            // SPECIFIC ECLIPSE / SKY RESPONSE EXAMPLES
            // --------------------------------------------------

            {
                id: "vedic-eclipse-ritual-caution",
                tags: ["solar-eclipse-window", "lunar-eclipse-window"],
                culture: "Hindu traditions",
                region: "South Asia",
                title: "Eclipse fasting and ritual caution",
                practiceType: "ritual caution / purification",
                summary:
                    "Many Hindu communities treat eclipses as ritually potent periods marked by fasting, prayer, bathing, mantra, and temporary caution around ordinary activities.",
                confidence: "high",
                sourceType: "living religious tradition",
                reviewStatus: "usable",
                notes:
                    "Strong example of eclipse periods as times of altered ordinary practice."
            },

            {
                id: "andean-moon-sun-omens",
                tags: ["solar-eclipse-window", "lunar-eclipse-window", "full-moon"],
                culture: "Andean traditions",
                region: "Andes",
                title: "Celestial omens and communal response",
                practiceType: "cosmological interpretation / ritual response",
                summary:
                    "Historical Andean traditions often treated unusual celestial events, including eclipses, as powerful signs requiring communal attention, ritual interpretation, or protective response.",
                confidence: "moderate",
                sourceType: "historical / ethnohistorical interpretation",
                reviewStatus: "usable-with-context",
                notes:
                    "Should be kept general unless tied to a specific well-sourced people and period."
            },

            // --------------------------------------------------
            // INDIGENOUS LUNAR CALENDARS
            // --------------------------------------------------

            {
                id: "anishinaabe-moon-naming",
                tags: ["full-moon", "new-moon", "waxing", "waning"],
                culture: "Anishinaabe traditions",
                region: "Great Lakes region, North America",
                title: "Moons as seasonal teachers",
                practiceType: "seasonal lunar naming / ecological orientation",
                summary:
                    "Anishinaabe lunar naming traditions link moons to seasonal and ecological processes, showing how the moon can orient food, movement, weather, and community rhythms.",
                confidence: "high",
                sourceType: "indigenous seasonal calendar",
                reviewStatus: "usable",
                notes:
                    "Best used as an example of lunar naming and seasonal orientation rather than a single action rule."
            },

            {
                id: "cree-lunar-seasonal-knowledge",
                tags: ["full-moon", "new-moon", "waxing", "waning"],
                culture: "Cree traditions",
                region: "Northern North America",
                title: "Seasonal moons and livelihood timing",
                practiceType: "seasonal ecological calendar",
                summary:
                    "Cree moon names and seasonal knowledge encode ecological timing, subsistence cycles, and social orientation, illustrating how lunar naming can structure lived time.",
                confidence: "moderate-high",
                sourceType: "indigenous seasonal calendar",
                reviewStatus: "usable",
                notes:
                    "Strong as a calendar-grounding example; weaker as a precise tag-to-action rule."
            },

            // --------------------------------------------------
            // CEREMONIAL / COMMUNAL LUNAR GATHERING
            // --------------------------------------------------

            {
                id: "full-moon-community-gatherings-general",
                tags: ["full-moon", "ascending"],
                culture: "Multiple cultures",
                region: "Global",
                title: "Full moon communal gathering patterns",
                practiceType: "gathering / ceremony / visibility",
                summary:
                    "In many societies, the bright full moon has supported communal gathering, travel, ceremony, dance, or night activity by increasing visibility and shared atmosphere.",
                confidence: "moderate",
                sourceType: "comparative anthropological pattern",
                reviewStatus: "usable-with-context",
                notes:
                    "Useful as a broad pattern, but should not be attached to one specific people without evidence."
            },

            // --------------------------------------------------
            // STONE / SOLAR-LUNAR ARCHITECTURE (CAREFUL WORDING)
            // --------------------------------------------------

            {
                id: "megalithic-sky-alignment-general",
                tags: ["full-moon", "solar-eclipse-window", "lunar-eclipse-window"],
                culture: "Megalithic sky-aligned traditions",
                region: "Europe and elsewhere",
                title: "Sky alignment and ceremonial architecture",
                practiceType: "monument alignment / ceremony",
                summary:
                    "Many megalithic sites show careful alignment to celestial events, suggesting that moon and sun cycles were important in ceremonial and calendrical life, though exact meanings often remain debated.",
                confidence: "moderate",
                sourceType: "archaeoastronomy",
                reviewStatus: "usable-with-caution",
                notes:
                    "Good for general grounding, but avoid specific claims about intentions unless strongly sourced."
            },

            // --------------------------------------------------
            // REVIEW-NEEDED PLACEHOLDERS
            // --------------------------------------------------

            {
                id: "igorot-full-moon-dance-placeholder",
                tags: ["full-moon"],
                culture: "Igorot-related traditions",
                region: "Luzon, Philippines",
                title: "Possible full moon communal dance example",
                practiceType: "dance / gathering",
                summary:
                    "This is a promising example of possible full moon communal observance, but it should not be displayed prominently until reviewed against reliable ethnographic or community sources.",
                confidence: "review_needed",
                sourceType: "placeholder / needs verification",
                reviewStatus: "hold",
                notes:
                    "Included as a research placeholder only."
            }

        ]
    };

}());