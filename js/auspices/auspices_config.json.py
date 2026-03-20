{
    "schema": "earthcal.auspices_config.v2",
    "description": "Configuration for mapping EarthCal multi-layer moment outputs (lunar, solar, and later planetary and seasonal layers) to guidance, tags, durations, and UI metadata.",
    "engine": {
        "sourceFunctions": [
            "SunCalc.getLunarMoment(date, options)",
            "SunCalc.getSolarMoment(date, lat, lon, options)"
        ],
        "primaryDisplayOrder": [
            "comboName",
            "phaseName",
            "moments"
        ],
        "tagPriority": [
            "solar-eclipse-window",
            "lunar-eclipse-window",
            "summer-solstice-window",
            "winter-solstice-window",
            "march-equinox-window",
            "september-equinox-window",
            "ascending-node",
            "descending-node",
            "node-window",
            "perigee-window",
            "apogee-window",
            "new-moon",
            "full-moon",
            "waxing-ascending",
            "waxing-descending",
            "waning-descending",
            "waning-ascending",
            "ascending-light",
            "descending-light",
            "waxing",
            "waning",
            "ascending",
            "descending",
            "waxing-crescent",
            "waxing-gibbous",
            "waning-gibbous",
            "waning-crescent"
        ],
        "displayStrategy": {
            "primaryLabel": "comboName",
            "secondaryLabel": "phaseName",
            "showTags": true,
            "showWarningsFirst": true,
            "allowMultipleSimultaneousTags": true
        }
    },
    "categories": {
        "solar-season": {
            "label": "Solar Season",
            "purpose": "Marks annual equinox and solstice windows."
        },
        "phase": {
            "label": "Lunar Phase",
            "purpose": "Identifies the Moon’s illumination phase."
        },
        "motion": {
            "label": "Lunar Motion",
            "purpose": "Identifies whether lunar declination is ascending or descending."
        },
        "combo": {
            "label": "Lunar Combined Motion",
            "purpose": "Maps phase and motion overlap to discern deeper guidance."
        },
        "orbital": {
            "label": "Lunar Orbital Event",
            "purpose": "Marks node, perigee, and apogee windows."
        },
        "alignment": {
            "label": "Eclipse Event",
            "purpose": "Marks eclipse windows and major reset or reveal periods."
        }
    },
    "tags": [
        {
            "id": "new-moon",
            "layer": "lunar",
            "label": "New Moon",
            "category": "phase",
            "durationHours": 21.3,
            "intentionStage": "seed",
            "innerEffect": "Quiet reset; fertile but unseen beginning.",
            "guidance": "Seed intentions. Set direction gently without forcing outward action.",
            "suggestedActions": [
                "Create intentions",
                "Journal new directions",
                "Define new projects",
                "Begin habit plans"
            ],
            "ui": {
                "icon": "moon-new",
                "tone": "quiet",
                "emphasis": "primary"
            },
            "match": {
                "any": [
                    {
                        "field": "isNewMoon",
                        "equals": true
                    },
                    {
                        "field": "phaseName",
                        "equals": "New Moon"
                    },
                    {
                        "field": "moments",
                        "includes": "New Moon"
                    }
                ]
            }
        },
        {
            "id": "waxing-crescent",
            "layer": "lunar",
            "label": "Waxing Crescent",
            "category": "phase",
            "durationHours": 80,
            "intentionStage": "commit",
            "innerEffect": "Tender emergence of possibility.",
            "guidance": "Commit to the seed. Clarify first steps and gather support.",
            "suggestedActions": [
                "Schedule first actions",
                "Gather resources",
                "Draft outlines",
                "Start small"
            ],
            "ui": {
                "icon": "moon-waxing-crescent",
                "tone": "fresh",
                "emphasis": "secondary"
            },
            "match": {
                "all": [
                    {
                        "field": "phaseName",
                        "equals": "Waxing Crescent"
                    }
                ]
            }
        },
        {
            "id": "waxing-gibbous",
            "layer": "lunar",
            "label": "Waxing Gibbous",
            "category": "phase",
            "durationHours": 270,
            "intentionStage": "cultivate",
            "innerEffect": "Growing momentum and refinement.",
            "guidance": "Refine intentions. Strengthen structure, focus, and preparation.",
            "suggestedActions": [
                "Improve plans",
                "Deepen learning",
                "Refine strategies",
                "Strengthen systems"
            ],
            "ui": {
                "icon": "moon-waxing-gibbous",
                "tone": "growing",
                "emphasis": "secondary"
            },
            "match": {
                "all": [
                    {
                        "field": "phaseName",
                        "equals": "Waxing Gibbous"
                    }
                ]
            }
        },
        {
            "id": "full-moon",
            "layer": "lunar",
            "label": "Full Moon",
            "category": "phase",
            "durationHours": 21.3,
            "intentionStage": "realize",
            "innerEffect": "Peak awareness and illumination.",
            "guidance": "Realize and observe. See clearly what has manifested and what it means.",
            "suggestedActions": [
                "Celebrate milestones",
                "Share work",
                "Reflect in journal",
                "Present ideas"
            ],
            "ui": {
                "icon": "moon-full",
                "tone": "bright",
                "emphasis": "primary"
            },
            "match": {
                "any": [
                    {
                        "field": "isFullMoon",
                        "equals": true
                    },
                    {
                        "field": "phaseName",
                        "equals": "Full Moon"
                    },
                    {
                        "field": "moments",
                        "includes": "Full Moon"
                    }
                ]
            }
        },
        {
            "id": "waning-gibbous",
            "layer": "lunar",
            "label": "Waning Gibbous",
            "category": "phase",
            "durationHours": 270,
            "intentionStage": "harvest",
            "innerEffect": "Integration and learning.",
            "guidance": "Harvest insights. Gather lessons from what has unfolded.",
            "suggestedActions": [
                "Document lessons",
                "Review outcomes",
                "Write reflections",
                "Consolidate knowledge"
            ],
            "ui": {
                "icon": "moon-waning-gibbous",
                "tone": "integrating",
                "emphasis": "secondary"
            },
            "match": {
                "all": [
                    {
                        "field": "phaseName",
                        "equals": "Waning Gibbous"
                    }
                ]
            }
        },
        {
            "id": "waning-crescent",
            "layer": "lunar",
            "label": "Waning Crescent",
            "category": "phase",
            "durationHours": 80,
            "intentionStage": "release",
            "innerEffect": "Quiet dissolution and simplification.",
            "guidance": "Release and simplify. Let go of what is complete or no longer vital.",
            "suggestedActions": [
                "Archive finished items",
                "Close loops",
                "Delete clutter",
                "Rest and reset"
            ],
            "ui": {
                "icon": "moon-waning-crescent",
                "tone": "quiet",
                "emphasis": "secondary"
            },
            "match": {
                "all": [
                    {
                        "field": "phaseName",
                        "equals": "Waning Crescent"
                    }
                ]
            }
        },
        {
            "id": "waxing",
            "layer": "lunar",
            "label": "Waxing",
            "category": "phase",
            "durationHours": 354,
            "intentionStage": "cultivate",
            "innerEffect": "Growing vitality and expansion.",
            "guidance": "Cultivate intentions actively. Build momentum and visible growth.",
            "suggestedActions": [
                "Add tasks",
                "Build momentum",
                "Expand effort",
                "Develop projects"
            ],
            "ui": {
                "icon": "trend-up",
                "tone": "growing",
                "emphasis": "supporting"
            },
            "match": {
                "all": [
                    {
                        "field": "waxing",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "waning",
            "layer": "lunar",
            "label": "Waning",
            "category": "phase",
            "durationHours": 354,
            "intentionStage": "integrate",
            "innerEffect": "Consolidating energy and completion.",
            "guidance": "Complete and integrate. Reduce outward push and finish well.",
            "suggestedActions": [
                "Finish work",
                "Review progress",
                "Tidy plans",
                "Archive tasks"
            ],
            "ui": {
                "icon": "trend-down",
                "tone": "settling",
                "emphasis": "supporting"
            },
            "match": {
                "all": [
                    {
                        "field": "waning",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "ascending",
            "layer": "lunar",
            "label": "Ascending Moon",
            "category": "motion",
            "durationHours": 327.6,
            "intentionStage": "express",
            "innerEffect": "Energy rising toward expression and connection.",
            "guidance": "Focus outward. Share, connect, collaborate, and express.",
            "suggestedActions": [
                "Schedule meetings",
                "Host events",
                "Reach out",
                "Collaborate"
            ],
            "ui": {
                "icon": "arrow-up",
                "tone": "outward",
                "emphasis": "supporting"
            },
            "match": {
                "all": [
                    {
                        "field": "ascending",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "descending",
            "layer": "lunar",
            "label": "Descending Moon",
            "category": "motion",
            "durationHours": 327.6,
            "intentionStage": "root",
            "innerEffect": "Energy returning to roots and foundations.",
            "guidance": "Focus inward. Architect structure, lay foundations, and find inner coherence.",
            "suggestedActions": [
                "Journal",
                "Study",
                "Design systems",
                "Do personal work"
            ],
            "ui": {
                "icon": "arrow-down",
                "tone": "inward",
                "emphasis": "supporting"
            },
            "match": {
                "all": [
                    {
                        "field": "descending",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "waxing-ascending",
            "layer": "lunar",
            "label": "Waxing + Ascending",
            "category": "combo",
            "durationHours": 170,
            "intentionStage": "initiate",
            "innerEffect": "Maximum outward momentum.",
            "guidance": "Act boldly. This is one of the strongest times for initiation, announcement and action.",
            "suggestedActions": [
                "Launch projects",
                "Announce ideas",
                "Begin partnerships",
                "Start visible initiatives"
            ],
            "ui": {
                "icon": "rocket",
                "tone": "bold",
                "emphasis": "primary"
            },
            "match": {
                "all": [
                    {
                        "field": "waxing",
                        "equals": true
                    },
                    {
                        "field": "ascending",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "waxing-descending",
            "layer": "lunar",
            "label": "Waxing + Descending",
            "category": "combo",
            "durationHours": 170,
            "intentionStage": "build",
            "innerEffect": "Growing energy with grounding.",
            "guidance": "Build structure for the intention. Expand carefully and coherently.",
            "suggestedActions": [
                "Research",
                "Plan",
                "Build systems",
                "Practice skills"
            ],
            "ui": {
                "icon": "hammer",
                "tone": "grounded",
                "emphasis": "primary"
            },
            "match": {
                "all": [
                    {
                        "field": "waxing",
                        "equals": true
                    },
                    {
                        "field": "descending",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "waning-descending",
            "layer": "lunar",
            "label": "Waning + Descending",
            "category": "combo",
            "durationHours": 170,
            "intentionStage": "integrate",
            "innerEffect": "Deep reflection and stabilization.",
            "guidance": "Internalize lessons. Strengthen the roots of what remains.",
            "suggestedActions": [
                "Review strategy",
                "Journal deeply",
                "Stabilize foundations",
                "Integrate insights"
            ],
            "ui": {
                "icon": "tree-roots",
                "tone": "deep",
                "emphasis": "primary"
            },
            "match": {
                "all": [
                    {
                        "field": "waning",
                        "equals": true
                    },
                    {
                        "field": "descending",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "waning-ascending",
            "layer": "lunar",
            "label": "Waning + Ascending",
            "category": "combo",
            "durationHours": 170,
            "intentionStage": "share",
            "innerEffect": "Outward sharing of completed work.",
            "guidance": "Share the harvest. Communicate what has been learned or completed.",
            "suggestedActions": [
                "Teach",
                "Publish reflections",
                "Mentor",
                "Present results"
            ],
            "ui": {
                "icon": "megaphone",
                "tone": "expressive",
                "emphasis": "primary"
            },
            "match": {
                "all": [
                    {
                        "field": "waning",
                        "equals": true
                    },
                    {
                        "field": "ascending",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "ascending-node",
            "layer": "lunar",
            "label": "Ascending Node",
            "category": "orbital",
            "durationHours": 9,
            "intentionStage": "pause",
            "innerEffect": "Transition between paths; unstable threshold.",
            "guidance": "Pause before acting. Let the crossing settle before committing.",
            "suggestedActions": [
                "Reflect",
                "Observe",
                "Do light tasks",
                "Avoid major commitments"
            ],
            "ui": {
                "icon": "crossroads-up",
                "tone": "caution",
                "emphasis": "warning"
            },
            "match": {
                "all": [
                    {
                        "field": "nearNode",
                        "equals": true
                    },
                    {
                        "field": "nodeType",
                        "equals": "ascending node"
                    }
                ]
            }
        },
        {
            "id": "descending-node",
            "layer": "lunar",
            "label": "Descending Node",
            "category": "orbital",
            "durationHours": 9,
            "intentionStage": "pause",
            "innerEffect": "A crossing between lunar cycles; unstable threshold.",
            "guidance": "Hold. Let things settle. Observe rather than force decisions or actions.",
            "suggestedActions": [
                "Reflect",
                "Journal",
                "Observe",
                "Do maintenance",
                "Avoid major commitments"
            ],
            "ui": {
                "icon": "crossroads-down",
                "tone": "caution",
                "emphasis": "warning"
            },
            "match": {
                "all": [
                    {
                        "field": "nearNode",
                        "equals": true
                    },
                    {
                        "field": "nodeType",
                        "equals": "descending node"
                    }
                ]
            }
        },
        {
            "id": "node-window",
            "layer": "lunar",
            "label": "Node Window",
            "category": "orbital",
            "durationHours": 9,
            "intentionStage": "pause",
            "innerEffect": "General transition instability.",
            "guidance": "Neutral space. Allow things to unfold without forcing significance.",
            "suggestedActions": [
                "Avoid major scheduling",
                "Keep plans light",
                "Reflect",
                "Wait for clarity"
            ],
            "ui": {
                "icon": "pause",
                "tone": "caution",
                "emphasis": "warning"
            },
            "match": {
                "all": [
                    {
                        "field": "nearNode",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "perigee-window",
            "layer": "lunar",
            "label": "Perigee Window",
            "category": "orbital",
            "durationHours": 18,
            "intentionStage": "feel",
            "innerEffect": "Heightened intensity and sensitivity.",
            "guidance": "Observe amplified emotions and conditions. Avoid reactive commitments.",
            "suggestedActions": [
                "Journal emotional insights",
                "Observe patterns",
                "Delay major commitments",
                "Ground yourself"
            ],
            "ui": {
                "icon": "pulse",
                "tone": "intense",
                "emphasis": "warning"
            },
            "match": {
                "all": [
                    {
                        "field": "nearPerigee",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "apogee-window",
            "layer": "lunar",
            "label": "Apogee Window",
            "category": "orbital",
            "durationHours": 18,
            "intentionStage": "perspective",
            "innerEffect": "Distance, spaciousness, and clarity.",
            "guidance": "Step back and see the bigger picture.",
            "suggestedActions": [
                "Strategic thinking",
                "Long-term planning",
                "Perspective-taking",
                "Review trajectories"
            ],
            "ui": {
                "icon": "horizon",
                "tone": "clear",
                "emphasis": "warning"
            },
            "match": {
                "all": [
                    {
                        "field": "nearApogee",
                        "equals": true
                    }
                ]
            }
        },
        {
            "id": "solar-eclipse-window",
            "layer": "solar",
            "label": "Solar Eclipse Window",
            "category": "alignment",
            "durationHours": 36,
            "intentionStage": "realign",
            "innerEffect": "Radical reset potential.",
            "guidance": "Major realignment. Good for deep reflection, not impulsive action.",
            "suggestedActions": [
                "Deep journaling",
                "Redefine direction",
                "Contemplate change",
                "Keep commitments minimal"
            ],
            "ui": {
                "icon": "eclipse-solar",
                "tone": "transformative",
                "emphasis": "critical"
            },
            "match": {
                "all": [
                    {
                        "field": "eclipseType",
                        "equals": "solar eclipse window"
                    }
                ]
            }
        },
        {
            "id": "lunar-eclipse-window",
            "layer": "lunar",
            "label": "Lunar Eclipse Window",
            "category": "alignment",
            "durationHours": 36,
            "intentionStage": "reveal",
            "innerEffect": "Dramatic illumination and release.",
            "guidance": "Deep reset. Acknowledge truths. What is revealed informs release and closure.",
            "suggestedActions": [
                "Reflect deeply",
                "Close cycles",
                "Name truths",
                "Release what no longer fits"
            ],
            "ui": {
                "icon": "eclipse-lunar",
                "tone": "transformative",
                "emphasis": "critical"
            },
            "match": {
                "all": [
                    {
                        "field": "eclipseType",
                        "equals": "lunar eclipse window"
                    }
                ]
            }
        },
        {
            "id": "ascending-light",
            "layer": "solar",
            "label": "Ascending Light",
            "category": "solar-season",
            "durationHours": 4380,
            "intentionStage": "cultivate",
            "innerEffect": "The light half is building toward fullness.",
            "guidance": "This longer arc favors growth, emergence, and the building of life force toward greater expression.",
            "suggestedActions": [
                "Develop longer-term projects",
                "Grow capacity",
                "Build momentum seasonally",
                "Favor emergence"
            ],
            "ui": {
                "icon": "light-rising",
                "tone": "growing",
                "emphasis": "supporting"
            },
            "match": {
                "all": [
                    {
                        "field": "lightHalfName",
                        "equals": "Ascending Light"
                    }
                ]
            }
        },
        {
            "id": "descending-light",
            "layer": "solar",
            "label": "Descending Light",
            "category": "solar-season",
            "durationHours": 4380,
            "intentionStage": "integrate",
            "innerEffect": "The light half is returning toward inwardness and conservation.",
            "guidance": "This longer arc favors harvest, simplification, maturity, and wise conservation of energy.",
            "suggestedActions": [
                "Consolidate gains",
                "Harvest outcomes",
                "Simplify systems",
                "Strengthen what will remain"
            ],
            "ui": {
                "icon": "light-falling",
                "tone": "settling",
                "emphasis": "supporting"
            },
            "match": {
                "all": [
                    {
                        "field": "lightHalfName",
                        "equals": "Descending Light"
                    }
                ]
            }
        },
        {
            "id": "march-equinox-window",
            "layer": "solar",
            "label": "March Equinox Window",
            "category": "solar-season",
            "durationHours": 144,
            "intentionStage": "balance",
            "innerEffect": "Balance between light and dark; threshold of seasonal turning.",
            "guidance": "A moment for balance, recalibration, and equal regard for inward and outward life.",
            "suggestedActions": [
                "Rebalance priorities",
                "Recalibrate systems",
                "Mark a seasonal threshold",
                "Renew intention"
            ],
            "ui": {
                "icon": "equinox",
                "tone": "clear",
                "emphasis": "primary"
            },
            "match": {
                "any": [
                    {
                        "field": "seasonalAnchor",
                        "equals": "march equinox window"
                    },
                    {
                        "field": "moments",
                        "includes": "March Equinox Window"
                    }
                ]
            }
        },
        {
            "id": "september-equinox-window",
            "layer": "solar",
            "label": "September Equinox Window",
            "category": "solar-season",
            "durationHours": 144,
            "intentionStage": "balance",
            "innerEffect": "Balance returning through the turning of the year.",
            "guidance": "Use this threshold for balance, reflection, and re-centering as the annual arc shifts.",
            "suggestedActions": [
                "Re-center",
                "Reflect seasonally",
                "Balance effort and rest",
                "Adjust direction"
            ],
            "ui": {
                "icon": "equinox",
                "tone": "clear",
                "emphasis": "primary"
            },
            "match": {
                "any": [
                    {
                        "field": "seasonalAnchor",
                        "equals": "september equinox window"
                    },
                    {
                        "field": "moments",
                        "includes": "September Equinox Window"
                    }
                ]
            }
        },
        {
            "id": "summer-solstice-window",
            "layer": "solar",
            "label": "Summer Solstice Window",
            "category": "solar-season",
            "durationHours": 144,
            "intentionStage": "realize",
            "innerEffect": "Peak light, fullness, visibility, and expression.",
            "guidance": "A high point in the solar year. Favor celebration, visibility, gratitude, and full expression.",
            "suggestedActions": [
                "Celebrate",
                "Show completed work",
                "Acknowledge fullness",
                "Gather communally"
            ],
            "ui": {
                "icon": "solstice-summer",
                "tone": "bright",
                "emphasis": "primary"
            },
            "match": {
                "any": [
                    {
                        "field": "seasonalAnchor",
                        "equals": "summer solstice window"
                    },
                    {
                        "field": "moments",
                        "includes": "Summer Solstice Window"
                    }
                ]
            }
        },
        {
            "id": "winter-solstice-window",
            "layer": "solar",
            "label": "Winter Solstice Window",
            "category": "solar-season",
            "durationHours": 144,
            "intentionStage": "seed",
            "innerEffect": "Deep turning inward; the dark pivot before light begins growing again.",
            "guidance": "A profound reset. Favor quiet intention, deep reflection, renewal, and subtle beginnings.",
            "suggestedActions": [
                "Set deep intentions",
                "Rest",
                "Reflect",
                "Mark renewal"
            ],
            "ui": {
                "icon": "solstice-winter",
                "tone": "quiet",
                "emphasis": "primary"
            },
            "match": {
                "any": [
                    {
                        "field": "seasonalAnchor",
                        "equals": "winter solstice window"
                    },
                    {
                        "field": "moments",
                        "includes": "Winter Solstice Window"
                    }
                ]
            }
        }
    ],
    "resolver": {
        "recommendedAlgorithm": [
            "Resolve active moment layers using SunCalc.getLunarMoment(date, options) and SunCalc.getSolarMoment(date, lat, lon, options).",
            "Combine the active layer outputs into a single auspices input object, or evaluate tags per layer and merge the matches.",
            "Evaluate all tag match rules against the active moment data.",
            "Collect every matching tag.",
            "Sort matches by engine.tagPriority.",
            "Use the highest-priority combo, alignment, seasonal, or orbital tag as the main emphasis tag.",
            "Use the strongest available primary label from the active layers.",
            "Render all matched tags as chips or badges."
        ],
        "exampleInput": {
            "comboName": "Waning + Descending",
            "phaseName": "Waning Gibbous",
            "isNewMoon": false,
            "isFullMoon": false,
            "waxing": false,
            "waning": true,
            "ascending": false,
            "descending": true,
            "nearNode": false,
            "nodeType": "none",
            "nearPerigee": false,
            "nearApogee": true,
            "eclipseType": "none",
            "isDay": true,
            "isNight": false,
            "solarPhaseName": "Day",
            "solarEvent": "none",
            "energyName": "Falling",
            "seasonalAnchor": "summer solstice window",
            "lightHalfName": "Ascending Light",
            "moments": [
                "Waning",
                "Descending",
                "Waning + Descending",
                "Apogee Window",
                "Falling",
                "Ascending Light",
                "Summer Solstice Window"
            ]
        },
        "exampleResolvedTagIds": [
            "summer-solstice-window",
            "apogee-window",
            "waning-descending",
            "ascending-light",
            "waning",
            "descending",
            "waning-gibbous"
        ]
    }
}