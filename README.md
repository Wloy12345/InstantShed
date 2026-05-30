# Shunder

A local-first construction project planner. Enter footprint dimensions, choose foundation and framing, see pier placement on the floorplan, and get a shopping list with **how many pieces to buy** based on store stock lengths you measured.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build & test

```bash
npm run build
npm test
```

## Features

- **Footprint**: Length × width → floor area, perimeter; **drag edges/corner** on the 2D floorplan to resize
- **3D preview**: Orbit + **drag the green ring** for wall height (Three.js)
- **Foundation**: Pier & beam, **timber pier** (posts + footings + skids), or concrete slab
- **Framing**: 2×4 or 2×6 studs at 16" or 24" on center
- **Store stock**: Default lumber lengths in build setup; **editable per line** on the shopping list
- **Shopping list**: Enter **your size** (ft per piece or sq ft per sheet) → **Buy** count = ceil(need ÷ your size)
- **Lowe's price estimate**: Per-line and total materials cost using approximate Lowe's retail prices (not a quote)
- **Save/load**: Export and import JSON project files (v1 files get sensible defaults)

## How piece counts work

| Material | Logic |
|----------|--------|
| Posts | 1 piece per pier location |
| Beams / plates | `ceil(linear feet needed ÷ stock length)` |
| Studs | 1 piece per stud if stock length ≥ wall height; otherwise divided by stock length |
| Sheathing | Enter sheet size in sq ft (e.g. 32 for 4×8); buy = ceil(sq ft needed ÷ sheet size) |

Post spacing uses a conservative max span: **6 ft** for 4×4, **8 ft** for 6×6. The grid always includes corners; actual spacing may be tighter than the max on small footprints.

## Lowe's price estimates

Prices live in [`src/data/lowesCatalog.ts`](src/data/lowesCatalog.ts) (typical retail per piece or per sq ft). The app multiplies **Buy** × unit price, using your entered stock length to pick the nearest standard SKU (8 / 10 / 12 / 16 ft lumber, 4×8 OSB sheets, etc.). Slab foundations use a materials-only $/sq ft estimate. **Not affiliated with Lowe's** — verify at your local store.

## Project JSON format

```json
{
  "id": "uuid",
  "name": "New shed",
  "footprint": { "lengthFt": 12, "widthFt": 12 },
  "wallHeightFt": 8,
  "roof": { "type": "gable", "pitchRisePer12": 4 },
  "foundation": {
    "type": "pier_beam",
    "postSize": "6x6",
    "maxSpanFt": 8,
    "perimeterBeam": true
  },
  "framing": { "studSize": "2x4", "studSpacingIn": 16 },
  "storeStock": {
    "postLengthFt": 8,
    "beamLengthFt": 8,
    "studLengthFt": 8,
    "plateLengthFt": 8,
    "sheathingSheetSqFt": 32
  },
  "shoppingStockLengths": {
    "framing.plates": 10
  },
  "materials": []
}
```

`foundation.type`: `pier_beam` | `timber_pier` | `slab`. Older exports without `foundation`, `framing`, or `storeStock` import with defaults.

## Example: 12×12 pier & beam shed

1. Foundation: Pier & beam, **6×6** → 9 posts on a 3×3 grid, **6 ft** spacing.
2. Framing: **2×4** @ 16" OC.
3. Store stock: 8 ft studs and plates.
4. Shopping list shows post count, beam/plate pieces, and stud pieces.
5. **Regenerate** on the shopping list saves lines (with Lowe's prices) to **Saved materials**.
6. **Export & print** opens a printable page with the full list, quantities, and price estimate (save as PDF from the print dialog).
