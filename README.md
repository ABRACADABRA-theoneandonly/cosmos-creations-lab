# Cosmic Curiosity Lab

Build an interactive AI Science Lab web app with rich animations, sounds, and vibrant visuals featuring:

1. Interactive Science-Themed Lab Hub (Home Screen):
- A walkable 2D science lab room where you control a character (keyboard WASD/arrows or click/touch to move) moving between 4 interactive research stations/portals:
  * Genetics & DNA Alteration Lab
  * Rocket Launchpad & Orbital Space Simulator
  * Volcanology & Magma Chamber Station
  * Element & Chemical Particle Sandbox (Sandboxels-style falling sand/liquid/gas physics)
- A floating animated personal AI robot companion ("Sparky" / "Dr. Byte") that follows the player character around with smooth trailing physics.
- Dialogue banner / pop-up drawer at the bottom that appears whenever the robot gives tips, guided walkthroughs, fun science facts, and real-life scientific context.
- Sound effects toggle, atmospheric background synth, and lively station hover/activation animations.

2. Genetics & DNA Lab Station:
- Sleek futuristic biological laboratory setting with 3 vertical glowing test tubes / cryogenic pods: Tube 1 (Parent A DNA traits), Tube 2 (Parent B DNA traits), and Tube 3 (Synthesized Hybrid Specimen).
- Interactive gene splicing sliders and selectors (e.g., bioluminescence, scale/fur type, limb count, respiratory adaptations, intelligence, metabolic rate).
- AI species generation: visually renders the final mutant/hybrid creature with detailed stats, classification taxonomy, ecological niche, strengths/weaknesses, and realistic scientific lore (e.g. CRISPR, genetic modification examples like jellyfish GFP in mice).

3. Rocket Launchpad & Galaxy Station (Cosmic Deep Space Theme):
- Starfield and galaxy visual aesthetic with particle thruster trails, telemetry HUD, staging indicators, and planetary views.
- Rocket launch physics minigame: calculate and dial in rocket fuel mass vs thrust vs payload.
  * Too little fuel: fails to achieve escape velocity / orbital speed and falls back down to Earth in a dramatic fireball.
  * Just right: achieves stable low Earth orbit / lunar transfer with real orbital mechanics telemetry.
  * Too much fuel: vessel becomes too heavy or overshoots into deep space with zero return fuel, stranding the crew.
- Includes a dramatic "Supernova / Explode the Sun" sandbox mode button with cosmic shockwaves, planetary vaporization, and astrophysics facts explaining stellar lifecycle, Chandrasekhar limit, and solar flares.

4. Volcanology & Magma Chamber (Dark & Spooky Volcanic Theme):
- Glowing obsidian, smoky atmospheric particles, bubbling magma crags, and seismic readouts.
- Magma pressure chamber controls: adjust chamber depth, silica content, gas pressure, and magma viscosity to dictate eruption type (gentle Hawaiian effusive flow vs catastrophic Plinian explosive blast).
- Optional toggles for pyroclastic flows, volcanic bombs/lava rocks, ash plume dispersion, and lightning within ash clouds.
- Real-world eruption comparisons (Mount St. Helens, Krakatoa, Kilauea, Pompeii/Vesuvius).

5. Particle Element Sandbox (Sandboxels inspired):
- Canvas-based falling sand / cellular automata simulation grid.
- Palette of solids, liquids, gases, organics, and chemicals: Sand, Water, Lava, Ice, Fire, Oil, Acid, Gunpowder, Steam, Plant, Metal, Uranium, Salt, etc.
- Temperature and interaction controls: heat brush, freeze brush, pressure, mixing, chemical reactions, state changes (ice melts to water, water boils to steam, acid dissolves metal, gunpowder explodes with fire).
- Clear, pause, step, and preset experiment buttons with scientific explanations of exothermic/endothermic reactions and matter states.

Include educational trivia, real-life examples, accessible responsive UI with sound effects, and high-fidelity polish.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/96f660fe-ec93-4669-a5bd-e6e9c07c0893).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
