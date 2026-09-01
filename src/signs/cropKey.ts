/**
 * Which official-crop image a sign draws from.
 *
 * Most Schedule signs resolve straight from their designation: RB-23 is
 * `RB-23.png`. A few are *variable-number* designs — the Regulations fix the
 * layout and let the numeral change per location — so one designation covers
 * several real images. RB-1 "Maximum speed" is one: `RB-1.png` reads
 * MAXIMUM 80 and `RB-1A.png` reads MAXIMUM 50. Those signs carry an `asset`
 * key naming the image for their variant.
 *
 * `asset` is an artwork file name and never an official designation. Both
 * speed variants keep designation RB-1, because the Traffic Signs Regulations
 * define RB-1 and no RB-1A.
 *
 * This lives on its own so the app, the gallery, the content validator and the
 * build's content-version digest all resolve artwork the same way. They used
 * to each derive `<designation>.png` independently, which is how the 50 km/h
 * sign came to display the 80 km/h image.
 */
export interface CropArtworkRef {
  designation?: string;
  /** OFFICIAL_CROPS key for this variant's image. Defaults to `designation`. */
  asset?: string;
}

export function cropKeyFor(entry: CropArtworkRef): string | undefined {
  return entry.asset ?? entry.designation;
}
