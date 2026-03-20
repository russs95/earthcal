/*
 * biodynamic_council.js
 * EarthCal Biodynamic Gardening Council Library
 *
 * Purpose:
 * - Provide biodynamic-style gardening counsel for lunar moments
 * - Match against SunCalc.getLunarMoment() output
 * - Supply structured guidance for planting, cultivating, harvesting,
 *   pruning, composting, and observation
 *
 * Global export:
 *   window.EARTHCAL_BIODYNAMIC_COUNCIL
 */

(function () {
    "use strict";

    window.EARTHCAL_BIODYNAMIC_COUNCIL = {
        schema: "earthcal.biodynamic-council.v1",
        title: "EarthCal Biodynamic Gardening Council",
        description:
            "Structured biodynamic-style gardening counsel keyed to lunar moment tags and match rules.",
        sourceFunction: "SunCalc.getLunarMoment(date, options)",

        notes: [
            "This library provides interpretive gardening counsel inspired by biodynamic and lunar gardening traditions.",
            "It is intended as a planning and reflection aid, not as a deterministic scientific model.",
            "Multiple entries may match a given date. A resolver should sort and synthesize them."
        ],

        categories: {
            phase: {
                label: "Phase",
                description: "Moon phase and broad growth tendency."
            },
            motion: {
                label: "Motion",
                description: "Ascending or descending lunar declination motion."
            },
            combo: {
                label: "Combined Motion",
                description: "Phase + motion overlaps with stronger gardening implications."
            },
            orbital: {
                label: "Orbital Event",
                description: "Node, perigee, and apogee windows."
            },
            alignment: {
                label: "Alignment",
                description: "Eclipse windows and major lunar alignments."
            }
        },

        priorityOrder: [
            "solar-eclipse-window",
            "lunar-eclipse-window",
            "ascending-node",
            "descending-node",
            "node-window",
            "perigee-window",
            "apogee-window",
            "waxing-ascending",
            "waxing-descending",
            "waning-descending",
            "waning-ascending",
            "new-moon",
            "full-moon",
            "waxing",
            "waning",
            "ascending",
            "descending",
            "waxing-crescent",
            "waxing-gibbous",
            "waning-gibbous",
            "waning-crescent"
        ],

        entries: [
            {
                id: "new-moon",
                label: "New Moon",
                category: "phase",
                durationHours: 21.3,
                significance: "primary",
                summary:
                    "A quiet beginning phase often associated with seeding, inward preparation, and subtle establishment.",
                ecologicalEffect:
                    "Low visible light and a reset-like turning point in the lunar cycle; often interpreted as an inward, germinal moment.",
                gardeningFocus: [
                    "seed planning",
                    "gentle sowing",
                    "transplanting with care",
                    "bed preparation"
                ],
                recommendedActions: [
                    "Start delicate seeds",
                    "Plan planting sequences",
                    "Prepare beds and trays",
                    "Transplant gently if conditions are otherwise favorable"
                ],
                avoidActions: [
                    "forcing rapid visible growth",
                    "overworking plants",
                    "heavy pruning for speed"
                ],
                counsel:
                    "Use the new moon as a subtle beginning. Favor intention, preparation, and gentle establishment over forceful outward work.",
                match: {
                    any: [
                        { field: "isNewMoon", equals: true },
                        { field: "phaseName", equals: "New Moon" },
                        { field: "moments", includes: "New Moon" }
                    ]
                }
            },

            {
                id: "waxing-crescent",
                label: "Waxing Crescent",
                category: "phase",
                durationHours: 80,
                significance: "supporting",
                summary:
                    "An early growth phase associated with fragile emergence and careful encouragement.",
                ecologicalEffect:
                    "Increasing light is interpreted as a gentle upward-building impulse.",
                gardeningFocus: [
                    "seedling establishment",
                    "leafy starts",
                    "herbs",
                    "early annuals"
                ],
                recommendedActions: [
                    "Sow quick greens and herbs",
                    "Encourage seedling establishment",
                    "Begin light watering routines",
                    "Support fragile starts"
                ],
                avoidActions: [
                    "heavy disturbance",
                    "rough transplanting",
                    "major pruning"
                ],
                counsel:
                    "Treat this as a tender emergence period. Encourage what has just begun rather than pushing it hard.",
                match: {
                    all: [
                        { field: "phaseName", equals: "Waxing Crescent" }
                    ]
                }
            },

            {
                id: "waxing-gibbous",
                label: "Waxing Gibbous",
                category: "phase",
                durationHours: 270,
                significance: "supporting",
                summary:
                    "A strengthening phase associated with robust above-ground growth and refinement before fullness.",
                ecologicalEffect:
                    "Upward and outward vitality is often considered strong during this period.",
                gardeningFocus: [
                    "vigorous above-ground crops",
                    "training and support",
                    "growth refinement"
                ],
                recommendedActions: [
                    "Plant strong above-ground crops",
                    "Train trellised plants",
                    "Refine watering and feeding schedules",
                    "Support leaf and stem development"
                ],
                avoidActions: [
                    "root disturbance without reason",
                    "late corrective neglect"
                ],
                counsel:
                    "Use the waxing gibbous to strengthen and refine visible growth. Support what is expanding.",
                match: {
                    all: [
                        { field: "phaseName", equals: "Waxing Gibbous" }
                    ]
                }
            },

            {
                id: "full-moon",
                label: "Full Moon",
                category: "phase",
                durationHours: 21.3,
                significance: "primary",
                summary:
                    "A peak phase associated with visibility, above-ground expression, and heightened moisture dynamics in tradition.",
                ecologicalEffect:
                    "Often interpreted as a moment of peak vitality, strong leaf expression, and increased moisture sensitivity.",
                gardeningFocus: [
                    "leaf harvest",
                    "observation",
                    "watering awareness",
                    "medicinal gathering"
                ],
                recommendedActions: [
                    "Harvest leafy crops",
                    "Observe plant health closely",
                    "Apply compost tea or foliar supports carefully",
                    "Gather medicinal plants where relevant"
                ],
                avoidActions: [
                    "overwatering",
                    "ignoring fungal pressure",
                    "careless handling of moisture-sensitive crops"
                ],
                counsel:
                    "Treat the full moon as a peak expression phase. Harvest, observe, and support plants, but watch moisture and fungal risk.",
                match: {
                    any: [
                        { field: "isFullMoon", equals: true },
                        { field: "phaseName", equals: "Full Moon" },
                        { field: "moments", includes: "Full Moon" }
                    ]
                }
            },

            {
                id: "waning-gibbous",
                label: "Waning Gibbous",
                category: "phase",
                durationHours: 270,
                significance: "supporting",
                summary:
                    "A consolidating phase associated with integrating growth and turning attention toward roots and outcomes.",
                ecologicalEffect:
                    "The traditional interpretation shifts from visible expansion toward consolidation and nourishment.",
                gardeningFocus: [
                    "root crop support",
                    "soil nourishment",
                    "compost integration",
                    "reviewing bed condition"
                ],
                recommendedActions: [
                    "Sow or support root crops",
                    "Add compost or mulch",
                    "Improve soil structure",
                    "Review what is thriving and what is not"
                ],
                avoidActions: [
                    "rash expansion",
                    "neglect of soil condition"
                ],
                counsel:
                    "Use the waning gibbous to gather strength back into the system. Nourish roots and soil.",
                match: {
                    all: [
                        { field: "phaseName", equals: "Waning Gibbous" }
                    ]
                }
            },

            {
                id: "waning-crescent",
                label: "Waning Crescent",
                category: "phase",
                durationHours: 80,
                significance: "supporting",
                summary:
                    "A quiet finishing phase associated with pruning, cleanup, and release.",
                ecologicalEffect:
                    "Traditionally linked with low outward vigor, making it suitable for reduction and clearing.",
                gardeningFocus: [
                    "pruning",
                    "weeding",
                    "cleanup",
                    "closing cycles"
                ],
                recommendedActions: [
                    "Prune selectively",
                    "Weed beds",
                    "Clear dead material",
                    "Finish storage harvests"
                ],
                avoidActions: [
                    "major new sowings",
                    "forcing growth"
                ],
                counsel:
                    "Use the waning crescent to release what is complete and simplify the garden before renewal.",
                match: {
                    all: [
                        { field: "phaseName", equals: "Waning Crescent" }
                    ]
                }
            },

            {
                id: "waxing",
                label: "Waxing",
                category: "phase",
                durationHours: 354,
                significance: "supporting",
                summary:
                    "A broad growth window associated with above-ground development and increasing vitality.",
                ecologicalEffect:
                    "Increasing illumination is often interpreted as supporting upward and outward growth.",
                gardeningFocus: [
                    "above-ground crops",
                    "leaf development",
                    "plant establishment"
                ],
                recommendedActions: [
                    "Plant above-ground crops",
                    "Transplant annuals",
                    "Encourage leaf growth",
                    "Support visible development"
                ],
                avoidActions: [
                    "exclusive focus on reduction work"
                ],
                counsel:
                    "The waxing half favors cultivation and outward growth. Build momentum in what rises above the soil.",
                match: {
                    all: [
                        { field: "waxing", equals: true }
                    ]
                }
            },

            {
                id: "waning",
                label: "Waning",
                category: "phase",
                durationHours: 354,
                significance: "supporting",
                summary:
                    "A broad consolidating window associated with roots, soil, and completion.",
                ecologicalEffect:
                    "Decreasing illumination is often interpreted as supporting rootward and inward processes.",
                gardeningFocus: [
                    "root crops",
                    "soil cultivation",
                    "composting",
                    "completion"
                ],
                recommendedActions: [
                    "Plant root crops",
                    "Work compost into beds",
                    "Improve soil texture",
                    "Finish and consolidate garden tasks"
                ],
                avoidActions: [
                    "unnecessary outward expansion",
                    "overemphasis on leafy initiation"
                ],
                counsel:
                    "The waning half favors completion, roots, and soil-building. Draw energy downward and stabilize.",
                match: {
                    all: [
                        { field: "waning", equals: true }
                    ]
                }
            },

            {
                id: "ascending",
                label: "Ascending Moon",
                category: "motion",
                durationHours: 327.6,
                significance: "supporting",
                summary:
                    "A declination phase traditionally associated with rising plant impulse and above-ground emphasis.",
                ecologicalEffect:
                    "Often compared to a miniature spring-summer tendency within the lunar month.",
                gardeningFocus: [
                    "fruits",
                    "flowers",
                    "seed collection",
                    "grafting"
                ],
                recommendedActions: [
                    "Harvest fruits and flowers",
                    "Graft where appropriate",
                    "Collect seeds",
                    "Support reproductive and expressive plant parts"
                ],
                avoidActions: [
                    "exclusive focus on deep root disturbance"
                ],
                counsel:
                    "Use the ascending moon for work that emphasizes what rises, flowers, fruits, or expresses itself outwardly.",
                match: {
                    all: [
                        { field: "ascending", equals: true }
                    ]
                }
            },

            {
                id: "descending",
                label: "Descending Moon",
                category: "motion",
                durationHours: 327.6,
                significance: "supporting",
                summary:
                    "A declination phase traditionally associated with rooting, settlement, and soil-oriented work.",
                ecologicalEffect:
                    "Often compared to a miniature autumn-winter tendency within the lunar month.",
                gardeningFocus: [
                    "transplanting",
                    "soil work",
                    "root establishment",
                    "pruning"
                ],
                recommendedActions: [
                    "Transplant seedlings",
                    "Work soil carefully",
                    "Prune where needed",
                    "Strengthen root establishment"
                ],
                avoidActions: [
                    "overemphasis on quick outward display"
                ],
                counsel:
                    "Use the descending moon to strengthen roots, settle plants, and work closer to the soil.",
                match: {
                    all: [
                        { field: "descending", equals: true }
                    ]
                }
            },

            {
                id: "waxing-ascending",
                label: "Waxing + Ascending",
                category: "combo",
                durationHours: 170,
                significance: "primary",
                summary:
                    "One of the strongest traditional combinations for above-ground growth, fruiting, flowering, and visible initiation.",
                ecologicalEffect:
                    "Combines increasing light with rising declination, producing a strong outward-growth interpretation.",
                gardeningFocus: [
                    "fruiting crops",
                    "flowers",
                    "climbing plants",
                    "grains"
                ],
                recommendedActions: [
                    "Plant fruiting crops",
                    "Sow beans, peas, and climbers",
                    "Support flowering plants",
                    "Begin visible growth-oriented garden actions"
                ],
                avoidActions: [
                    "deep reduction work unless necessary",
                    "root-only emphasis"
                ],
                counsel:
                    "This is a strong moment for visible, upward, and reproductive plant work. Favor growth that rises and expresses.",
                match: {
                    all: [
                        { field: "waxing", equals: true },
                        { field: "ascending", equals: true }
                    ]
                }
            },

            {
                id: "waxing-descending",
                label: "Waxing + Descending",
                category: "combo",
                durationHours: 170,
                significance: "primary",
                summary:
                    "A grounded growth combination often interpreted as good for leafy crops and steady establishment.",
                ecologicalEffect:
                    "Combines growth momentum with a root-supportive motion.",
                gardeningFocus: [
                    "leafy greens",
                    "herbs",
                    "steady transplants",
                    "structured establishment"
                ],
                recommendedActions: [
                    "Plant lettuces and leafy greens",
                    "Set herbs",
                    "Transplant with care",
                    "Build stable support systems for growth"
                ],
                avoidActions: [
                    "reckless speed",
                    "ignoring root support"
                ],
                counsel:
                    "This is a good period for building healthy leaf growth on a stable base. Grow, but stay grounded.",
                match: {
                    all: [
                        { field: "waxing", equals: true },
                        { field: "descending", equals: true }
                    ]
                }
            },

            {
                id: "waning-descending",
                label: "Waning + Descending",
                category: "combo",
                durationHours: 170,
                significance: "primary",
                summary:
                    "One of the strongest traditional combinations for root crops, soil cultivation, composting, and stabilization.",
                ecologicalEffect:
                    "Combines decreasing light with downward declination, producing a strong rootward and consolidating interpretation.",
                gardeningFocus: [
                    "root crops",
                    "bulbs",
                    "soil improvement",
                    "composting"
                ],
                recommendedActions: [
                    "Plant carrots, beets, onions, garlic, and other root crops",
                    "Add compost",
                    "Deepen soil care",
                    "Stabilize beds and foundations"
                ],
                avoidActions: [
                    "showy outward initiatives",
                    "neglect of soil health"
                ],
                counsel:
                    "This is a strong period for rooting, consolidating, and strengthening the garden below the surface.",
                match: {
                    all: [
                        { field: "waning", equals: true },
                        { field: "descending", equals: true }
                    ]
                }
            },

            {
                id: "waning-ascending",
                label: "Waning + Ascending",
                category: "combo",
                durationHours: 170,
                significance: "primary",
                summary:
                    "A mixed combination often interpreted as suitable for harvesting, pruning, and sharing the completed yield.",
                ecologicalEffect:
                    "Declining light tempers growth while rising declination supports above-ground harvest and expression.",
                gardeningFocus: [
                    "harvest",
                    "pruning",
                    "seed gathering",
                    "sharing the yield"
                ],
                recommendedActions: [
                    "Harvest storage crops",
                    "Prune selectively",
                    "Collect mature seeds",
                    "Share or process the yield"
                ],
                avoidActions: [
                    "large new sowings",
                    "overextension"
                ],
                counsel:
                    "Use this period to gather, prune, and bring mature garden work into usable form.",
                match: {
                    all: [
                        { field: "waning", equals: true },
                        { field: "ascending", equals: true }
                    ]
                }
            },

            {
                id: "ascending-node",
                label: "Ascending Node",
                category: "orbital",
                durationHours: 9,
                significance: "warning",
                summary:
                    "A threshold crossing traditionally treated as unstable for planting and transplanting.",
                ecologicalEffect:
                    "Biodynamic calendars often regard node crossings as disturbed or less favorable for sensitive biological work.",
                gardeningFocus: [
                    "pause",
                    "observation",
                    "maintenance"
                ],
                recommendedActions: [
                    "Observe the garden",
                    "Clean tools",
                    "Do light maintenance",
                    "Plan rather than plant"
                ],
                avoidActions: [
                    "sowing",
                    "transplanting",
                    "grafting",
                    "major cultivation"
                ],
                counsel:
                    "Treat the ascending node as a pause point. Avoid sensitive planting actions and let the threshold pass.",
                match: {
                    all: [
                        { field: "nearNode", equals: true },
                        { field: "nodeType", equals: "ascending node" }
                    ]
                }
            },

            {
                id: "descending-node",
                label: "Descending Node",
                category: "orbital",
                durationHours: 9,
                significance: "warning",
                summary:
                    "A threshold crossing traditionally treated as unstable for planting and transplanting.",
                ecologicalEffect:
                    "Like the ascending node, this is often treated as a disturbed window in biodynamic timing.",
                gardeningFocus: [
                    "pause",
                    "maintenance",
                    "observation"
                ],
                recommendedActions: [
                    "Do repairs",
                    "Observe plant condition",
                    "Organize tools and seeds",
                    "Wait before sensitive work"
                ],
                avoidActions: [
                    "planting",
                    "transplanting",
                    "grafting"
                ],
                counsel:
                    "Treat the descending node as a brief unstable threshold. Favor maintenance and observation over planting.",
                match: {
                    all: [
                        { field: "nearNode", equals: true },
                        { field: "nodeType", equals: "descending node" }
                    ]
                }
            },

            {
                id: "node-window",
                label: "Node Window",
                category: "orbital",
                durationHours: 9,
                significance: "warning",
                summary:
                    "A general node-related pause window often considered unfavorable for sensitive planting operations.",
                ecologicalEffect:
                    "Interpreted in biodynamic timing as a moment of instability or interruption.",
                gardeningFocus: [
                    "neutral work",
                    "maintenance",
                    "planning"
                ],
                recommendedActions: [
                    "Keep work light",
                    "Observe",
                    "Plan next actions",
                    "Maintain tools or paths"
                ],
                avoidActions: [
                    "major sowing",
                    "transplanting",
                    "grafting"
                ],
                counsel:
                    "Use node windows for neutral work. Let the garden be observed more than directed.",
                match: {
                    all: [
                        { field: "nearNode", equals: true }
                    ]
                }
            },

            {
                id: "perigee-window",
                label: "Perigee Window",
                category: "orbital",
                durationHours: 18,
                significance: "warning",
                summary:
                    "A close-moon window often associated in tradition with heightened moisture and sensitivity.",
                ecologicalEffect:
                    "Some biodynamic interpretations associate perigee with stronger moisture tension and vulnerability to fungal or pest pressure.",
                gardeningFocus: [
                    "monitoring",
                    "caution",
                    "microclimate awareness"
                ],
                recommendedActions: [
                    "Monitor fungal conditions",
                    "Watch pests carefully",
                    "Adjust watering with caution",
                    "Observe rather than over-intervene"
                ],
                avoidActions: [
                    "sensitive sowing if avoidable",
                    "careless irrigation",
                    "ignoring mildew conditions"
                ],
                counsel:
                    "Treat perigee as a heightened window. Watch moisture, pressure, and sensitivity carefully.",
                match: {
                    all: [
                        { field: "nearPerigee", equals: true }
                    ]
                }
            },

            {
                id: "apogee-window",
                label: "Apogee Window",
                category: "orbital",
                durationHours: 18,
                significance: "warning",
                summary:
                    "A distant-moon window often interpreted as lower-vigor and more reflective than active.",
                ecologicalEffect:
                    "Sometimes treated in tradition as less favorable for urgent sowing and more suitable for review and maintenance.",
                gardeningFocus: [
                    "perspective",
                    "planning",
                    "maintenance"
                ],
                recommendedActions: [
                    "Review garden plans",
                    "Do light maintenance",
                    "Think strategically about rotations and design",
                    "Avoid relying on this window for delicate establishment if other timing is available"
                ],
                avoidActions: [
                    "overconfidence in germination windows",
                    "urgent sensitive sowing"
                ],
                counsel:
                    "Treat apogee as a spacious planning window. Step back, review, and work lightly.",
                match: {
                    all: [
                        { field: "nearApogee", equals: true }
                    ]
                }
            },

            {
                id: "solar-eclipse-window",
                label: "Solar Eclipse Window",
                category: "alignment",
                durationHours: 36,
                significance: "critical",
                summary:
                    "A new-moon node alignment traditionally regarded as highly unstable for planting and biological initiation.",
                ecologicalEffect:
                    "Used in many biodynamic interpretations as a strong pause or reset window.",
                gardeningFocus: [
                    "deep pause",
                    "observation",
                    "ceremonial or reflective reset"
                ],
                recommendedActions: [
                    "Pause sensitive planting",
                    "Observe the garden and weather",
                    "Reflect on the cycle",
                    "Prepare for later action"
                ],
                avoidActions: [
                    "sowing",
                    "transplanting",
                    "grafting",
                    "major biological interventions"
                ],
                counsel:
                    "Use a solar eclipse window as a strong pause in action. Prepare, observe, and wait for clearer conditions.",
                match: {
                    all: [
                        { field: "eclipseType", equals: "solar eclipse window" }
                    ]
                }
            },

            {
                id: "lunar-eclipse-window",
                label: "Lunar Eclipse Window",
                category: "alignment",
                durationHours: 36,
                significance: "critical",
                summary:
                    "A full-moon node alignment traditionally regarded as highly charged and unstable for sensitive planting work.",
                ecologicalEffect:
                    "Often treated as a strong threshold emphasizing observation rather than biological intervention.",
                gardeningFocus: [
                    "pause",
                    "harvest review",
                    "reflection"
                ],
                recommendedActions: [
                    "Observe",
                    "Review what has reached maturity",
                    "Harvest only when necessary",
                    "Defer sensitive planting work"
                ],
                avoidActions: [
                    "new sowing",
                    "transplanting",
                    "forcing a major garden push"
                ],
                counsel:
                    "Treat a lunar eclipse window as a charged threshold. Favor reflection and observation over initiation.",
                match: {
                    all: [
                        { field: "eclipseType", equals: "lunar eclipse window" }
                    ]
                }
            }
        ]
    };
}());