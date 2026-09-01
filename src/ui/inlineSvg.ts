/** Inline a master SVG fragment while making every local id/reference instance-safe. */
export function scopedSvgFragment(source: string, instanceId: string) {
  const inner = source.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const ids = [...inner.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]).filter((value): value is string => Boolean(value));
  const scoped = new Map(ids.map((value) => [value, `${value}-${instanceId}`]));
  return inner
    .replace(/\bid="([^"]+)"/g, (_, value: string) => `id="${scoped.get(value) ?? value}"`)
    .replace(/href="#([^"]+)"/g, (_, value: string) => `href="#${scoped.get(value) ?? value}"`)
    .replace(/url\(#([^)]+)\)/g, (_, value: string) => `url(#${scoped.get(value) ?? value})`);
}
