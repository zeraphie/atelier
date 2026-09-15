/**
 * ─ Works ─
 *
 * The gallery as data: rooms, and the works that hang in them, with
 * their real sizes in centimetres. Nothing about a work is placed by
 * hand; the hang derives every position from these. The pictures are
 * public-domain scans from the holding collections, prepared once
 * into public/works, and images.json says what sizes exist.
 * The rooms' order is the tour, so each must share a wall with the next,
 * and a room's walls must have space for its works.
 * Decision: DECISIONS.md, a gallery with real works.
 */

export type Side = "top" | "right" | "bottom" | "left";

export interface Work {
  /** Names the image set in public/works and the entry in images.json. */
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly year: string;
  readonly medium: string;
  readonly widthCm: number;
  readonly heightCm: number;
  /** Who holds the work, with their reference. */
  readonly collection: string;
  /** Where the scan came from, and on what terms. */
  readonly source: string;
  /** The wall to hang it on; left unsaid, the hang picks one facing the entry. */
  readonly wall?: Side;
}

export interface Room {
  readonly id: string;
  readonly name: string;
  /** Where the room sits on the plan's grid of metres, and how many cells it spans. */
  readonly column: number;
  readonly row: number;
  readonly columns: number;
  readonly rows: number;
  readonly works: readonly Work[];
}

const PRINT = "Woodblock print, ink and colour on paper";
const MET = "Public domain, The Met Open Access";
const COMMONS = "Public domain, via Wikimedia Commons";
const HAER = "Historic American Engineering Record";
const SHEET = "Ink on polyester film, measured drawing";
const US_WORK = "Public domain, United States government work";

export const ROOMS: readonly Room[] = [
  { id: "foyer", name: "Foyer", column: 5, row: 4, columns: 3, rows: 3, works: [] },
  {
    id: "drawings",
    name: "Drawings",
    column: 0,
    row: 2,
    columns: 5,
    rows: 4,
    works: [
      {
        id: "haer-woolsey-bridge",
        title: "Woolsey Bridge, axonometric from below",
        artist: `Matthew Swaim, ${HAER}`,
        year: "20th century",
        medium: SHEET,
        widthCm: 91.4,
        heightCm: 62.6,
        collection: "Library of Congress, HAER AR-63, sheet 4",
        source: US_WORK,
        wall: "top",
      },
      {
        id: "haer-estate-whim-engine",
        title: "Overhead Crank Steam Engine and Cane Mill, Estate Whim",
        artist: `Kathleen Hoeft, ${HAER}`,
        year: "20th century",
        medium: SHEET,
        widthCm: 91.4,
        heightCm: 62.3,
        collection: "Library of Congress, HAER VI,1-WEST,1C-, sheet 1",
        source: US_WORK,
        wall: "top",
      },
      {
        id: "haer-sentinel-bridge",
        title: "Sentinel Bridge over the Merced River, elevation and section",
        artist: `Marie-Claude LeSauteur, ${HAER}`,
        year: "20th century",
        medium: SHEET,
        widthCm: 91.4,
        heightCm: 61,
        collection: "Library of Congress, HAER CAL,22-YOSEM,15-, sheet 1",
        source: US_WORK,
      },
    ],
  },
  {
    id: "ukiyo-e",
    name: "Ukiyo-e",
    column: 0,
    row: 0,
    columns: 3,
    rows: 2,
    works: [
      {
        id: "hokusai-great-wave",
        title: "Under the Wave off Kanagawa",
        artist: "Katsushika Hokusai",
        year: "c. 1830–32",
        medium: PRINT,
        widthCm: 37.9,
        heightCm: 25.7,
        collection: "The Metropolitan Museum of Art, JP1847",
        source: MET,
        wall: "bottom",
      },
      {
        id: "hiroshige-sudden-shower",
        title: "Sudden Shower over Shin-Ōhashi Bridge and Atake",
        artist: "Utagawa Hiroshige",
        year: "1857",
        medium: PRINT,
        widthCm: 24.1,
        heightCm: 34,
        collection: "The Metropolitan Museum of Art, JP2522",
        source: MET,
        wall: "bottom",
      },
    ],
  },
  {
    id: "meiji-tokyo",
    name: "Meiji Tokyo",
    column: 3,
    row: -1,
    columns: 4,
    rows: 3,
    works: [
      {
        id: "kiyochika-kudanzaka-night",
        title: "Kudanzaka at Night in Early Summer",
        artist: "Kobayashi Kiyochika",
        year: "1880",
        medium: PRINT,
        widthCm: 37,
        heightCm: 24,
        collection: "Smithsonian Institution",
        source: COMMONS,
        wall: "bottom",
      },
      {
        id: "hiroshige-iii-takanawa-railway",
        title: "Steam Train on the Railway along the Takanawa Coast",
        artist: "Utagawa Hiroshige III",
        year: "1871",
        medium: "Woodblock print triptych, ink and colour on paper",
        widthCm: 72.4,
        heightCm: 35.6,
        collection: "Geographicus Rare Antique Maps",
        source: COMMONS,
        wall: "right",
      },
      {
        id: "kiyochika-sumida-river-night",
        title: "The Sumida River at Night",
        artist: "Kobayashi Kiyochika",
        year: "1881",
        medium: PRINT,
        widthCm: 36.5,
        heightCm: 24,
        collection: "Honolulu Museum of Art, James A. Michener Collection, 13681",
        source: COMMONS,
        wall: "top",
      },
    ],
  },
  { id: "studio", name: "Studio", column: 7, row: 0, columns: 2, rows: 3, works: [] },
];
