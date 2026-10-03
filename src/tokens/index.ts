import data from "./tokens.json";

export type Primitives = Record<string, Record<string, string>>;
export const primitives = data.primitives as Primitives;
export const semantic = data.semantic as [string, string][];
export const spacing = data.spacing as Record<string, number>;
export const radius = data.radius as Record<string, number>;
export const shadows = data.shadows as Record<string, { uso: string; layers: number[][] }>;
export const typography = data.typography as {
  token: string;
  figma: string;
  family: "serif" | "sans";
  size: number;
  lineHeight: number;
  weight: number;
  tracking: number;
  uppercase?: boolean;
  uso: string;
  ejemplo: string;
}[];

/** "crema/300" → "#E6DAC7" */
export function primitiveHex(ref: string): string {
  const [fam, step] = ref.split("/");
  return primitives[fam][step];
}

/** "text/primary" → "#06263A" */
export function semanticHex(name: string): string {
  const row = semantic.find(([n]) => n === name);
  if (!row) throw new Error(`Token semántico inexistente: ${name}`);
  return primitiveHex(row[1]);
}

export const cssVar = (name: string) => `--color-${name.replace(/\//g, "-")}`;
