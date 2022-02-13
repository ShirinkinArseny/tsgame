export const range = (from: number, to: number) => [...Array(to - from + 1)].map((_, idx) => idx + from);


declare global {
	interface Map<K, V> {
		keysList(): Array<K>;

		valuesList(): Array<V>;
		entriesList(): Array<[K, V]>;
	}
}
Map.prototype.keysList = function (): Array<any> {
	return Array.from(this.keys());
};
Map.prototype.valuesList = function (): Array<any> {
	return Array.from(this.values());
};
Map.prototype.entriesList = function (): Array<any> {
	return Array.from(this.entries());
};
