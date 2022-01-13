export class Timed<T> {

	items: T[];
	timeout: number;
	initialTime: number;

	constructor(items: T[], timeout: number) {
		this.items = items;
		this.timeout = timeout;
		this.initialTime = new Date().getTime();
	}

	get() {
		const time = new Date().getTime();
		const diff = time - this.initialTime;
		const frame = Math.floor(diff / this.timeout);
		const idx = frame % this.items.length;
		return this.items[idx];
	}

}
