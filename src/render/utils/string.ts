export const limit = (v: string, length: number) => {
	if (v.length <= length) return v;
	return v.substring(0, length - 3) + '...';
};
