export const limit = (
	v: string,
	length: number,
	emp: boolean = true
) => {
	if (v.length <= length) return v;
	if (emp) {
		return v.substring(0, length - 3) + '...';
	}
	return v.substring(0, length);
};
