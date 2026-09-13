# AI Science Lab — Interactive Learning Playground

A vibrant, animated science lab you can walk around, with four hands-on stations, a floating robot buddy, sound effects, and real scientific facts throughout.

## Screens

**1. Lab Hub (home page)**
- Top-down 2D lab room, drawn on a canvas, with warm neon lighting and animated details (bubbling flasks, blinking monitors, drifting dust).
- Move your scientist with WASD/arrow keys or by clicking/tapping a spot.
- Four glowing station portals: Genetics, Rocket Launchpad, Volcano, Particle Sandbox. Walking into one pulses it and opens that station.
- "Sparky" the robot companion floats behind you with a soft trailing bob, blinking eyes, and a light glow.
- Bottom dialogue banner where Sparky offers tips, walkthrough hints, and fun facts; it can be expanded or dismissed.
- Sound toggle plus a calm ambient background tone; hover and activation sounds on stations.

**2. Genetics & DNA Lab**
- Three tall glowing tubes: Parent A, Parent B, and the synthesized hybrid.
- Sliders and selectors for bioluminescence, skin/fur/scale type, limb count, respiration, intelligence, and metabolism.
- "Synthesize" builds the creature: a layered animated illustration assembled from the chosen traits, plus stats, taxonomy, habitat niche, strengths/weaknesses, and lore referencing real CRISPR and GFP work.

**3. Rocket Launchpad & Galaxy Station**
- Deep-space starfield, particle thruster trail, telemetry readouts, staging lights, and a planet on the horizon.
- Dial fuel mass, thrust, and payload, then launch. Three outcomes: too little fuel falls back in a fireball, correct range reaches stable orbit with live telemetry, too much fuel drifts off into deep space stranded.
- "Explode the Sun" sandbox: expanding shockwave, planets vaporizing, and facts on stellar lifecycles, the Chandrasekhar limit, and solar flares.

**4. Volcanology & Magma Chamber**
- Dark obsidian scene with smoke particles, glowing cracks, bubbling magma, and a seismograph trace.
- Controls for chamber depth, silica content, gas pressure, and viscosity, which decide the eruption style from gentle Hawaiian flow to violent Plinian blast.
- Toggles for pyroclastic flow, volcanic bombs, ash plume spread, and ash-cloud lightning.
- After each eruption, a comparison card matching it to Kilauea, Mount St. Helens, Krakatoa, or Vesuvius.

**5. Particle Element Sandbox**
- Canvas grid falling-sand simulation with an element palette: sand, water, lava, ice, fire, oil, acid, gunpowder, steam, plant, metal, uranium, salt, stone, wall.
- Heat and freeze brushes, brush size, and reactions: ice melts, water boils to steam, lava sets fire and cools to stone, acid eats metal, gunpowder detonates, plants grow in water, uranium goes critical.
- Play/pause, single step, clear, and preset experiments, each with a short note on the chemistry or state change involved.

## Look and feel
Dark lab-instrument base with electric cyan and magenta accents; each station shifts the accent (green for genetics, violet for space, ember orange for volcano, neutral slate for the sandbox). Bold technical display font for headings, clean sans for body. Motion is used everywhere but stays smooth on mobile, with a reduced-motion fallback.

## Technical notes
- Five routes: `/` (hub), `/genetics`, `/launchpad`, `/volcano`, `/sandbox`, each with its own page title and social preview text.
- Canvas + requestAnimationFrame render loops for the hub, rocket, volcano, and sandbox; React state only for controls and dialogue so the simulations stay fast. Fixed-timestep updates, device pixel ratio aware, loops paused when a tab is hidden.
- Sandbox uses a typed-array cell grid with per-material update rules and a temperature field; palette and reactions live in one data module so materials are easy to add.
- Sound is synthesized in the browser (no audio files) through a small shared audio manager, created after the first user interaction, with a global mute toggle stored locally.
- All content, facts, and trait/element data are local — no backend or accounts needed.
- Design tokens go in `src/styles.css`; all colors semantic, no hardcoded ones in components.

## Scope note
This is a large build. I will build it in one pass in the order above (hub, genetics, launchpad, volcano, sandbox) so each station is playable as it lands.
