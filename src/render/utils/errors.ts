export function error(text: string): never {
	throw new Error(text);
}
