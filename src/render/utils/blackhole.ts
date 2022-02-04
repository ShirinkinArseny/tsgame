let l = 0;

export const Blackhole = {
	eat: (v: any) => l += v.toString().length,
	vomit: () => l
};
