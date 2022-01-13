export const range = (from: number, to: number) => [...Array(to - from + 1)].map((_, idx) => idx + from);
