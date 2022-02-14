export const range = (from: number, to: number) => [...Array(to - from + 1)].map((_, idx) => idx + from);


declare global {
	interface Map<K, V> {
		keysList(): Array<K>;

		valuesList(): Array<V>;

		entriesList(): Array<[K, V]>;
	}

	interface Array<T> {
		delete(value: T): Array<T>;

		deleteIf(predicate: (element: T) => boolean): Array<T>;
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
Array.prototype.delete = function (element): Array<any> {
	for (let i = 0; i < this.length; i++) {
		const e = this[i];
		if (e === element) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
};
Array.prototype.deleteIf = function (predicate): Array<any> {
	for (let i = 0; i < this.length; i++) {
		const e = this[i];
		if (predicate(e)) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
};

