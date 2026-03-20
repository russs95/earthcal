/*
 * ecological_examples.js
 * EarthCal Ecological Examples Library
 *
 * Purpose:
 * - Provide grounded ecological examples associated with lunar moments
 * - Link biological behaviors to lunar phase / tidal / light cycles
 * - Used as "grounding layer" for EarthCal auspices
 *
 * Global export:
 *   window.EARTHCAL_ECOLOGICAL_EXAMPLES
 */

(function () {
    "use strict";

    window.EARTHCAL_ECOLOGICAL_EXAMPLES = {
        schema: "earthcal.ecological-examples.v1",
        title: "EarthCal Ecological Examples",
        description:
            "Examples of ecological and biological phenomena associated with lunar cycles, tides, and illumination patterns.",

        notes: [
            "Examples vary in strength of scientific support.",
            "Some are well-established (e.g. tides), others are species- and region-specific.",
            "These are grounding examples, not deterministic rules."
        ],

        examples: [

            // --------------------------------------------------
            // NEW / FULL MOON (TIDAL + LIGHT)
            // --------------------------------------------------

            {
                id: "grunion-spawning",
                tags: ["new-moon", "full-moon"],
                title: "Grunion spawning runs",
                species: {
                    vernacular: "California grunion",
                    latin: "Leuresthes tenuis"
                },
                domain: "marine",
                region: "California coast, USA",
                summary:
                    "California grunion come ashore to spawn on sandy beaches during spring tides that occur near full and new moons, timing reproduction to tidal maxima.",
                confidence: "high",
                evidenceType: "well-established",
                sourceType: "marine biology"
            },

            {
                id: "coral-spawning",
                tags: ["full-moon"],
                title: "Coral mass spawning",
                species: {
                    vernacular: "Staghorn coral (example species)",
                    latin: "Acropora spp."
                },
                domain: "marine",
                region: "Great Barrier Reef, Australia",
                summary:
                    "Many coral species synchronize mass spawning events shortly after full moons, using lunar cues alongside temperature and seasonal signals.",
                confidence: "high",
                evidenceType: "well-established",
                sourceType: "marine biology"
            },

            {
                id: "palolo-worm",
                tags: ["full-moon"],
                title: "Palolo worm emergence",
                species: {
                    vernacular: "Palolo worm",
                    latin: "Palola viridis"
                },
                domain: "marine",
                region: "Pacific Islands (e.g. Samoa, Fiji)",
                summary:
                    "Palolo worms reproduce in spectacular synchronized swarms timed to specific lunar phases near the full moon, forming an important seasonal event.",
                confidence: "high",
                evidenceType: "well-established",
                sourceType: "marine biology / ethnobiology"
            },

            {
                id: "reef-fish-spawning",
                tags: ["full-moon"],
                title: "Reef fish spawning aggregations",
                species: {
                    vernacular: "Nassau grouper",
                    latin: "Epinephelus striatus"
                },
                domain: "marine",
                region: "Caribbean",
                summary:
                    "Nassau grouper form spawning aggregations linked to full moon cycles, with timing influenced by both lunar illumination and tides.",
                confidence: "high",
                evidenceType: "well-established",
                sourceType: "marine ecology"
            },

            // --------------------------------------------------
            // TIDES (NEW + FULL)
            // --------------------------------------------------

            {
                id: "spring-tides",
                tags: ["new-moon", "full-moon"],
                title: "Spring tidal amplification",
                species: {
                    vernacular: "Coastal intertidal ecosystems",
                    latin: "Multiple taxa"
                },
                domain: "marine",
                region: "Global coastlines",
                summary:
                    "Tidal ranges are greatest near new and full moons due to alignment of Sun and Moon, strongly influencing intertidal feeding, exposure, and reproduction.",
                confidence: "very high",
                evidenceType: "physical science",
                sourceType: "oceanography"
            },

            // --------------------------------------------------
            // MOONLIGHT EFFECTS (FULL MOON)
            // --------------------------------------------------

            {
                id: "lion-hunting",
                tags: ["full-moon"],
                title: "Predator-prey dynamics and moonlight",
                species: {
                    vernacular: "African lion",
                    latin: "Panthera leo"
                },
                domain: "terrestrial",
                region: "Sub-Saharan Africa",
                summary:
                    "Lions often experience reduced hunting success during bright full moon nights, as prey are more vigilant under increased illumination.",
                confidence: "moderate-high",
                evidenceType: "observational studies",
                sourceType: "behavioral ecology"
            },

            {
                id: "owl-hunting",
                tags: ["full-moon"],
                title: "Nocturnal hunting shifts",
                species: {
                    vernacular: "Barn owl",
                    latin: "Tyto alba"
                },
                domain: "terrestrial",
                region: "Global",
                summary:
                    "Barn owls adjust hunting behavior with lunar brightness, sometimes reducing activity during bright full moons when prey detection dynamics shift.",
                confidence: "moderate",
                evidenceType: "observational",
                sourceType: "avian ecology"
            },

            // --------------------------------------------------
            // DARKNESS (NEW MOON)
            // --------------------------------------------------

            {
                id: "dung-beetle-navigation",
                tags: ["new-moon"],
                title: "Dung beetle celestial navigation",
                species: {
                    vernacular: "African dung beetle",
                    latin: "Scarabaeus satyrus"
                },
                domain: "terrestrial",
                region: "Africa",
                summary:
                    "Dung beetles orient using celestial cues including the Milky Way and moonlight, adjusting behavior depending on lunar illumination levels.",
                confidence: "high",
                evidenceType: "experimental",
                sourceType: "animal behavior"
            },

            {
                id: "firefly-signaling",
                tags: ["new-moon"],
                title: "Firefly bioluminescent signaling",
                species: {
                    vernacular: "Common eastern firefly",
                    latin: "Photinus pyralis"
                },
                domain: "terrestrial",
                region: "North America",
                summary:
                    "Firefly signaling can be more visible and effective during darker nights near the new moon, where reduced ambient light enhances mate communication.",
                confidence: "moderate",
                evidenceType: "observational",
                sourceType: "entomology"
            },

            // --------------------------------------------------
            // PERIGEE / APOGEE (TIDAL MODULATION)
            // --------------------------------------------------

            {
                id: "perigee-tides",
                tags: ["perigee-window"],
                title: "Perigean tidal enhancement",
                species: {
                    vernacular: "Coastal tidal systems",
                    latin: "Multiple taxa"
                },
                domain: "marine",
                region: "Global coastlines",
                summary:
                    "When the Moon is near perigee, tidal forces are slightly stronger, sometimes amplifying high tides when combined with new or full moon alignment.",
                confidence: "high",
                evidenceType: "physical science",
                sourceType: "oceanography"
            },

            {
                id: "apogee-tides",
                tags: ["apogee-window"],
                title: "Apogean tidal reduction",
                species: {
                    vernacular: "Coastal tidal systems",
                    latin: "Multiple taxa"
                },
                domain: "marine",
                region: "Global coastlines",
                summary:
                    "When the Moon is near apogee, tidal ranges are typically weaker compared to perigee conditions.",
                confidence: "high",
                evidenceType: "physical science",
                sourceType: "oceanography"
            },

            // --------------------------------------------------
            // ECLIPSE (LIGHT DISRUPTION)
            // --------------------------------------------------

            {
                id: "eclipse-animal-behavior",
                tags: ["solar-eclipse-window", "lunar-eclipse-window"],
                title: "Animal behavior during eclipses",
                species: {
                    vernacular: "Multiple species",
                    latin: "Multiple taxa"
                },
                domain: "terrestrial",
                region: "Global",
                summary:
                    "During solar eclipses, some animals exhibit dusk-like or nocturnal behaviors due to sudden light changes, including birds returning to roost.",
                confidence: "moderate",
                evidenceType: "observational",
                sourceType: "behavioral ecology"
            },

            // --------------------------------------------------
            // ASCENDING / DESCENDING (WEAKER SCIENCE)
            // --------------------------------------------------

            {
                id: "sap-flow-general",
                tags: ["ascending", "descending"],
                title: "Sap flow variability",
                species: {
                    vernacular: "Sugar maple",
                    latin: "Acer saccharum"
                },
                domain: "plant",
                region: "North America",
                summary:
                    "Sap flow in trees is primarily driven by temperature and pressure cycles, though some traditions associate broader rhythms with lunar cycles.",
                confidence: "low-moderate",
                evidenceType: "mixed",
                sourceType: "plant physiology + traditional interpretation"
            }

        ]
    };

}());