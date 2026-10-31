export type IconLayer = { d: string; fill: "top" | "side" | "front" | "accent" | "none"; stroke?: boolean };
export type IconDrawing = { viewBox: string; layers: readonly IconLayer[] };
const iso = (layers: readonly IconLayer[]): IconDrawing => ({ viewBox: "0 0 64 64", layers });
const control = (d: string): IconDrawing => ({ viewBox: "0 0 24 24", layers: [{ d, fill: "none", stroke: true }] });

export const drawings = {
  hub: iso([
    { d: "M8 24 32 10 56 24 32 38Z", fill: "top" },
    { d: "M8 24 32 38V58L8 44Z", fill: "front" },
    { d: "M32 38 56 24V44L32 58Z", fill: "side" },
    { d: "M16 29 25 34V45L16 40Z", fill: "accent" }
  ]),
  parcel: iso([
    { d: "M10 22 32 10 54 22 32 35Z", fill: "top" },
    { d: "M10 22 32 35V56L10 43Z", fill: "front" },
    { d: "M32 35 54 22V43L32 56Z", fill: "side" },
    { d: "M21 16 43 29V38L37 42V33L15 20Z", fill: "accent" }
  ]),
  motorbike: iso([
    { d: "M5 40 32 25 60 40 32 56Z", fill: "top" },
    { d: "M10 39a6 9 0 1 0 12 0 6 9 0 1 0-12 0M43 33a6 9 0 1 0 12 0 6 9 0 1 0-12 0", fill: "side" },
    { d: "M17 34 28 24 40 30 49 25 51 31 34 42 24 37Z", fill: "front" },
    { d: "M28 24 34 20 45 26 40 30Z", fill: "accent" },
    { d: "M45 26 43 16 49 13", fill: "none", stroke: true }
  ]),
  car: iso([
    { d: "M7 32 31 18 56 32V43L32 57 7 43Z", fill: "front" },
    { d: "M7 32 31 18 56 32 32 46Z", fill: "top" },
    { d: "M32 46 56 32V43L32 57Z", fill: "side" },
    { d: "M16 27 25 14 39 20 47 34 32 42Z", fill: "accent" },
    { d: "M12 40a4 6 0 1 0 8 0 4 6 0 1 0-8 0M39 46a4 6 0 1 0 8 0 4 6 0 1 0-8 0", fill: "side" }
  ]),
  water: iso([
    { d: "M5 30 32 14 59 30 32 46Z", fill: "top" },
    { d: "M5 30 32 46V53L5 37Z", fill: "front" },
    { d: "M32 46 59 30V37L32 53Z", fill: "side" },
    { d: "m14 30 8 4 8-4 8 4 9-5", fill: "none", stroke: true }
  ]),
  source: iso([
    { d: "M13 16 37 6 52 16 28 29Z", fill: "top" },
    { d: "M13 16 28 29V59L13 49Z", fill: "side" },
    { d: "M28 29 52 16V46L28 59Z", fill: "front" },
    { d: "m33 33 13-7v4l-13 7Zm0 9 13-7v4l-13 7Z", fill: "accent" }
  ]),
  check: control("m5 12 4 4L19 6"),
  close: control("m6 6 12 12M6 18 18 6"),
  blocked: control("M4 4h16v16H4ZM4 4l16 16"),
  clock: control("M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M12 7v5l4 2"),
  warning: control("M12 3 2 21h20ZM12 9v5M12 17v1"),
  help: control("M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17v1"),
  refresh: control("M20 4v6h-6M20 10a8 8 0 1 0 0 5"),
  arrow: control("M4 12h16m-6-6 6 6-6 6")
} as const satisfies Record<string, IconDrawing>;
export type IconName = keyof typeof drawings;
