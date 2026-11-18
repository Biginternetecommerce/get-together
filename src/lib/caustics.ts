/** Procedural, tileable underwater caustic texture (white light-web on transparent). Generated once, cached. */
let cached: string | null = null;

export function causticCanvas(size = 256): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  const T = Math.PI * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * T, ny = (y / size) * T;
      // domain-warped interference; all frequencies are integers so the tile is seamless
      const wx = nx + 0.55 * Math.sin(2 * ny + 1.3) + 0.3 * Math.sin(3 * nx + ny);
      const wy = ny + 0.55 * Math.sin(2 * nx + 0.4) + 0.3 * Math.sin(3 * ny - nx);
      const a = Math.sin(wx * 2) + Math.sin(wy * 2) + Math.sin((wx + wy) * 2) + Math.sin((wx - wy) * 3) * 0.6;
      const v = Math.abs(a) / 3.6;
      const web = Math.pow(Math.max(0, 1 - v * 6.5), 2.2);
      const i = (y * size + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255;
      img.data[i + 3] = Math.min(255, web * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function causticDataUrl(): string {
  if (cached) return cached;
  cached = causticCanvas(256).toDataURL("image/png");
  return cached;
}
