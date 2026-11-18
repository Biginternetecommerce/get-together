# Asset manifest & redesign status

## Done (this pass)
- **Scene 03 tunnel**: now real Three.js geometry (was flat SVG rings). 4-layer organic balloon garlands, latex (clearcoat+sheen) and chrome-pearl materials, tied knots, glass bubbles, iridescent 3D scallop shells and pearls at each arch foot, receding ocean-scale floor, hanging jellyfish, per-arch size/colour variation, scroll-driven camera. Readable frosted title plate. Verified desktop + 375px mobile, no horizontal overflow.

## NOT done - needs real art (no image/3D generation tool was available)
| Asset | Current state | Needed |
|---|---|---|
| Envelope (Scene 01) | layered inline SVG, still fairly flat | rendered/illustrated envelope + embossed paper texture, or a Three.js build like the tunnel |
| Octopus, turtle, jellyfish, seahorse, corals (Art.tsx) | flat-ish vector | one commissioned/generated 3D-style character set, exported as transparent WebP/PNG layers or GLB |
| Dive backdrop (Scene 02) | SVG reef layers + gradient | painted far/mid/near reef plates (WebP) |
| Stage shells/corals (Scene 04) | SVG (balloon arch is already real 3D) | 3D glowing shell + coral set (GLB) |
| Scenes 05-10 | restyle not yet redone | see brief; photo frames work and are editable in `src/config/invitation.ts` |

## Verify before launch (looks like SAMPLE content, left untouched)
`src/config/invitation.ts`: date 14 Mar 2027 3-6 PM, "Coral Bay Garden Hall, 12 Seashell Lane, Marina Bay", maps query. README says these were meant to be TBC.
