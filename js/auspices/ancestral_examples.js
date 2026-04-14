/*
 * ancestral-examples.js
 * EarthCal Ancestral Examples Library
 *
 * Purpose:
 * - Provide Indigenous and ancestral examples of ceremonial, ecological,
 *   calendrical, and seasonal practices associated with EarthCal's tracked moments
 * - Serve as a grounding layer for EarthCal auspices
 * - Ensure each tracked moment has either a researched example
 *   or an explicit placeholder awaiting review
 *
 * Design notes:
 * - This file is organized by tracked moment coverage, not by culture
 * - Each moment currently has one primary slot
 * - Placeholder entries are intentional and help ensure no moment is missed
 *
 * Global export:
 *   window.EARTHCAL_ANCESTRAL_EXAMPLES
 */

(function () {
    "use strict";

    window.EARTHCAL_ANCESTRAL_EXAMPLES = {
        schema: "earthcal.ancestral-examples.v3",
        title: "EarthCal Ancestral Examples",
        description:
            "Examples of Indigenous, First Nations, and ancestral ceremonial, calendrical, and ecological practices associated with specific tracked lunar and solar moments.",

        notes: [
            "These examples show how ancestral peoples made use of particular astronomical moments.",
            "Traditions are local, living, and internally diverse. Avoid flattening distinct peoples into a single rule.",
            "Each tracked moment should have either a specific example or an explicit placeholder for future research.",
            "Placeholder entries are intentional. They make coverage gaps visible so that no moment is missed as the library develops.",
            "Where EarthCal tracks a modern astronomical category that may not map directly onto a traditional one, placeholder entries help flag the need for careful interpretive work."
        ],

        confidenceScale: {
            high: "Well documented in Indigenous cultural, museum, educational, or historical sources.",
            moderate: "Reasonably supported but variable by community, region, or interpretation.",
            low: "Suggestive or partially documented; use with caution.",
            review_needed: "Promising example that should not be foregrounded until source review is completed."
        },

        examples: [

            // ==================================================
            // PRIMARY LUNAR PHASE MOMENTS
            // ==================================================

            {
                id: "balinese-tilem-new-moon-ceremony",
                tags: ["new-moon"],
                layer: "lunar",
                culture: "Balinese Hindu",
                region: "Bali / Indonesia",
                title: "Tilem new-moon prayer and purification",
                practiceType: "ceremony / prayer / purification / spiritual reset",
                summary:
                    "At every new moon, Balinese Hindus observe Tilem with prayers, offerings, and acts of purification. Individuals may go to dedicated springs and waterfalls to bathe and cleanse. Village communities also gather for ceremony, treating the dark moon as a time for inward reflection, spiritual cleansing, and the clearing of negative forces before the next cycle begins.",
                confidence: "high",
                sourceType: "Living ritual tradition / Hindu religious documentation",
                reviewStatus: "usable",
                notes:
                    "A strong recurring new-moon observance. Keep wording focused on Balinese Hindu practice and avoid overstating uniformity across all temples or communities."
            },

            {
                id: "placeholder-full-moon",
                tags: ["full-moon"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for full-moon observance",
                practiceType: "placeholder / ceremony / gathering / timing",
                summary:
                    "We are working to identify a strong ancestral example specifically tied to the full moon. The best future entry should describe not only what the full moon meant, but what people actually did in response, whether gathering, fishing, ceremony, celebration, or restraint.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Replace with a specific and phase-linked example rather than a broad lunar-calendar tradition."
            },

            {
                id: "german-alpine-mondholz-waning-building-timber",
                tags: ["waning"],
                layer: "lunar",
                culture: "German / Alpine woodcraft tradition",
                region: "German-speaking Alpine Europe",
                title: "Waning moon felling for durable building timber",
                practiceType: "forestry / woodcutting / building material timing",
                summary:
                    "In German-speaking Alpine woodcraft traditions, durable building timber was often felled during the waning moon, especially in winter and in some variants shortly before the dark moon. Woodcutters and builders held that timber cut in this phase would dry better, resist pests and rot more effectively, and remain more stable in construction. Rather than treating the moon as symbolic only, this tradition used the waning phase as practical guidance for when to cut wood intended to last.",
                confidence: "moderate",
                sourceType: "Forestry tradition review / Alpine moon-wood documentation",
                reviewStatus: "usable-with-context",
                notes:
                    "Strong fit for the waning tag. Some versions narrow the ideal timing to winter or the days before new moon, so avoid presenting one single rigid rule for all German-speaking regions."
            },
            {
                id: "german-alpine-waxing-firewood-combustion",
                tags: ["waxing"],
                layer: "lunar",
                culture: "German / Alpine woodcraft tradition",
                region: "German-speaking Alpine Europe",
                title: "Waxing moon cutting for firewood",
                practiceType: "forestry / fuel preparation / seasonal timing",
                summary:
                    "In traditional moon-timed woodcutting rules from the German-speaking Alpine world, firewood was cut during the waxing moon, in contrast to building timber cut during the waning moon. The aim here was different: not durability in construction, but wood that would burn more readily and serve well as fuel. This made the waxing moon a practical guide for selecting wood intended for quick combustion and household heat rather than long structural use.",
                confidence: "moderate",
                sourceType: "Forestry tradition review / historical moon-rule documentation",
                reviewStatus: "usable-with-context",
                notes:
                    "Useful as a clean waxing counterpart to the waning building-timber rule. Best framed as a traditional practical maxim, with variation by region and practitioner."
            },

            {
                id: "placeholder-ascending",
                tags: ["ascending"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for ascending-moon pattern",
                practiceType: "placeholder / rising force / expression",
                summary:
                    "We are working to identify a strong ancestral example for an ascending lunar pattern. The best future entry would show how a moon experienced as rising or lifting was associated with upward movement, expression, growth above ground, or outward flourishing.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "May be difficult unless sourced from traditions that explicitly track lunar ascent and descent."
            },

            {
                id: "placeholder-descending",
                tags: ["descending"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for descending-moon pattern",
                practiceType: "placeholder / grounding / inwardness / rooting",
                summary:
                    "We are working to identify a strong ancestral example for a descending lunar pattern. A future entry should show how a moon experienced as lowering or settling was associated with rooting, grounding, inwardness, burial, or work directed toward what lies below the surface.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Potentially strong if matched with traditions involving planting, root work, or descent symbolism."
            },

            {
                id: "maori-maramataka-waxing-nights-tirea-hoata",
                tags: ["waxing-crescent"],
                layer: "lunar",
                culture: "Māori",
                region: "Aotearoa / New Zealand",
                title: "Early waxing nights as a return of activity",
                practiceType: "ecological calendar / planting / fishing / food gathering",
                summary:
                    "In many maramataka traditions, the early waxing nights after Whiro, including Tirea and Hoata, were understood as a return of productive energy after the restraint of the dark moon. These nights were associated with practical guidance for planting food, gathering shellfish, and timing activities such as eeling and crayfishing. As the young moon became visible and strength returned to the cycle, work in te taiao could begin to open outward again.",
                confidence: "high",
                sourceType: "Indigenous ecological calendar / museum and encyclopedia documentation",
                reviewStatus: "usable-with-context",
                notes:
                    "Keep iwi variation explicit. Best used as an example of waxing renewal and increasing activity, not as a rigid universal prescription."
            },

            {
                id: "placeholder-waxing-gibbous",
                tags: ["waxing-gibbous"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for waxing-gibbous build-up",
                practiceType: "placeholder / accumulation / ripening / preparation",
                summary:
                    "We are working to identify a strong ancestral example for the waxing gibbous phase. The best future entry should show a moment of near-fullness: building momentum, preparing for culmination, or intensifying activity before the full moon.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Good category for ripening, preparation, and intensification if a source can be found."
            },

            {
                id: "placeholder-waning-gibbous",
                tags: ["waning-gibbous"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for waning-gibbous distribution or release",
                practiceType: "placeholder / sharing / decline / post-peak timing",
                summary:
                    "We are working to identify a strong ancestral example for the waning gibbous phase. A future entry should show what happens after lunar fullness has passed: distribution, harvesting, ceremonial aftermath, or the beginning of measured decline.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "A useful tag if a tradition distinguishes between fullness and the first stage of release."
            },

            {
                id: "hawaiian-mauli-waning-crescent-last-breath",
                tags: ["waning-crescent"],
                layer: "lunar",
                culture: "Native Hawaiian",
                region: "Hawaiʻi",
                title: "Mauli as the moon’s last breath",
                practiceType: "ecological calendar / fishing / timing / reflection",
                summary:
                    "In the Hawaiian lunar calendar, Mauli is the last night the moon is visible, and its name is understood as the moon’s 'last breath.' As the final crescent thins and vitality ebbs from the cycle, this moment can be read as one of completion, quieting, and release. In a culture that timed fishing and farming by the moon, such a phase marked not only an observation in the sky but a practical threshold: a time to pause, to refrain from overreaching, and to prepare for the coming reset of the dark moon.",
                confidence: "moderate",
                sourceType: "Indigenous lunar calendar / Hawaiian language and cultural documentation",
                reviewStatus: "usable-with-context",
                notes:
                    "Strong waning-crescent example because it is both phase-specific and symbolically vivid. The 'pause, release, and prepare' interpretation is a careful synthesis from the naming of Mauli and broader Hawaiian lunar timing traditions, so avoid presenting every phrase here as a direct traditional quotation."
            },

            // ==================================================
            // COMPOUND LUNAR MOMENTS
            // ==================================================

            {
                id: "placeholder-waxing-ascending",
                tags: ["waxing-ascending"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for waxing-ascending synthesis",
                practiceType: "placeholder / compounded lunar timing",
                summary:
                    "We are working to identify a strong ancestral example for a waxing and ascending lunar pattern. The ideal future entry would show a period understood as both building in strength and lifting in expression, with corresponding actions in cultivation, movement, or outward activity.",
                confidence: "review_needed",
                sourceType: "placeholder / needs synthesis review",
                reviewStatus: "hold",
                notes:
                    "This may need to be synthesized from traditions that track multiple lunar qualities at once."
            },

            {
                id: "placeholder-waxing-descending",
                tags: ["waxing-descending"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for waxing-descending synthesis",
                practiceType: "placeholder / compounded lunar timing",
                summary:
                    "We are working to identify a strong ancestral example for a waxing yet descending lunar pattern. A future entry should illuminate how growth or accumulation might be paired with grounding, rooting, or inward settling rather than pure outward expansion.",
                confidence: "review_needed",
                sourceType: "placeholder / needs synthesis review",
                reviewStatus: "hold",
                notes:
                    "Likely a more interpretive category than a directly named traditional one."
            },

            {
                id: "placeholder-waning-descending",
                tags: ["waning-descending"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for waning-descending synthesis",
                practiceType: "placeholder / compounded lunar timing",
                summary:
                    "We are working to identify a strong ancestral example for a waning and descending lunar pattern. The best future example would likely involve release, reduction, composting, burial, rest, or completion with a clear practical action mode.",
                confidence: "review_needed",
                sourceType: "placeholder / needs synthesis review",
                reviewStatus: "hold",
                notes:
                    "Potentially strong for endings, clearing, and return-to-ground interpretations."
            },

            {
                id: "placeholder-waning-ascending",
                tags: ["waning-ascending"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for waning-ascending synthesis",
                practiceType: "placeholder / compounded lunar timing",
                summary:
                    "We are working to identify a strong ancestral example for a waning yet ascending lunar pattern. A future entry should show how diminishing force might still carry expressive, spiritual, or communicative qualities before the cycle closes.",
                confidence: "review_needed",
                sourceType: "placeholder / needs synthesis review",
                reviewStatus: "hold",
                notes:
                    "This may later connect well to ritual closure or elevated release traditions."
            },

            // ==================================================
            // ORBITAL AND ECLIPSE THRESHOLDS
            // ==================================================

            {
                id: "placeholder-solar-eclipse-window",
                tags: ["solar-eclipse-window"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for solar eclipse response tradition",
                practiceType: "placeholder / eclipse protocol / ceremony",
                summary:
                    "We are working to identify a strong Indigenous or ancestral example specifically tied to a solar eclipse window. The best future example should include both the observed meaning of the eclipse and the human response it called forth, such as prayer, caution, witnessing, or suspension of ordinary activity.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Replace with a culture-specific example once reviewed. Avoid broad comparative statements in final use."
            },

            {
                id: "placeholder-lunar-eclipse-window",
                tags: ["lunar-eclipse-window"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for lunar eclipse response tradition",
                practiceType: "placeholder / eclipse protocol / ceremony",
                summary:
                    "We are working to identify a strong Indigenous or ancestral example specifically tied to a lunar eclipse window. The ideal future entry should show how the dimming or transformation of the moon was interpreted and what actions or cautions people observed in response.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Replace with a culture-specific example once reviewed."
            },

            {
                id: "placeholder-ascending-node",
                tags: ["ascending-node"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for ascending-node interpretation",
                practiceType: "placeholder / orbital threshold / interpretation",
                summary:
                    "We are working to identify whether a specific ancestral tradition can be responsibly associated with a moment analogous to the ascending lunar node. Any final entry should be careful not to force a modern astronomical category onto a tradition that used a different framework.",
                confidence: "review_needed",
                sourceType: "placeholder / needs conceptual review",
                reviewStatus: "hold",
                notes:
                    "This may require interpretive rather than direct one-to-one mapping."
            },

            {
                id: "placeholder-descending-node",
                tags: ["descending-node"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for descending-node interpretation",
                practiceType: "placeholder / orbital threshold / interpretation",
                summary:
                    "We are working to identify whether a specific ancestral tradition can be responsibly associated with a moment analogous to the descending lunar node. Any final entry should preserve the original cultural logic rather than retrofitting it too aggressively to modern orbital terminology.",
                confidence: "review_needed",
                sourceType: "placeholder / needs conceptual review",
                reviewStatus: "hold",
                notes:
                    "Likely to require careful interpretive framing."
            },



            {
                id: "hindu-rahu-ketu-nodal-threshold-caution",
                tags: ["node-window"],
                layer: "lunar",
                culture: "Hindu",
                region: "South Asia / India",
                title: "Rahu and Ketu as nodal thresholds of caution",
                practiceType: "ritual calendar / restraint / purification",
                summary:
                    "In Hindu cosmology and ritual astronomy, Rahu and Ketu are the shadow bodies identified with the lunar nodes, the crossing points where eclipses become possible. Because these nodal forces were associated with disruption, danger, and interruption of ordinary order, periods linked to their influence came to be treated with caution. In practice, traditions surrounding these charged intervals emphasize restraint, avoidance of ordinary or auspicious activity, and acts of purification before returning to normal life.",
                confidence: "moderate",
                sourceType: "Hindu cosmology / ritual astronomy / ethnographic documentation",
                reviewStatus: "usable-with-context",
                notes:
                    "Useful for node-window semantics because the nodal principle is direct, but the action pattern is often documented through eclipse observances rather than a separately named recurring node-window. Keep this clearly distinct from the more specific solar- and lunar-eclipse entries."
            },

            {
                id: "placeholder-perigee-window",
                tags: ["perigee-window"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for perigee-window interpretation",
                practiceType: "placeholder / lunar intensity / timing",
                summary:
                    "We are working to identify whether any ancestral traditions can be responsibly mapped to periods of heightened lunar nearness or intensity analogous to perigee. The best future example would need a clear action-mode component and not just symbolic resemblance.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Avoid speculative 'supermoon' back-projections."
            },

            {
                id: "placeholder-apogee-window",
                tags: ["apogee-window"],
                layer: "lunar",
                culture: "Research in progress",
                region: "TBD",
                title: "Placeholder for apogee-window interpretation",
                practiceType: "placeholder / lunar distance / timing",
                summary:
                    "We are working to identify whether any ancestral traditions can be responsibly mapped to periods of relative lunar distance or thinning influence analogous to apogee. A future example should be grounded in actual practice and observation, not just symbolic interpretation.",
                confidence: "review_needed",
                sourceType: "placeholder / needs source review",
                reviewStatus: "hold",
                notes:
                    "Likely a difficult category and may require especially careful justification."
            }

        ]
    };

}());