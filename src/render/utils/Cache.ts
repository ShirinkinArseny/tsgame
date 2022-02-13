export class SimpleCache<K, V> {

	constructor(
		private readonly creator: (key: K) => V,
	) {
		this.creator = creator;
	}

	private readonly map = new Map<K, V>();

	get(key: K): V {
		const oldValue = this.map.get(key);
		if (oldValue !== undefined) {
			return oldValue;
		} else {
			const newValue = this.creator(key);
			this.map.set(key, newValue);
			return newValue;
		}
	}

}
