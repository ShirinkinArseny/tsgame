export class Timed<T> {

	items: T[];
	timeout: number;
	initialTime: number;

	constructor(items: T[], timeout: number) {
		this.items = items;
		this.timeout = timeout;
		this.initialTime = new Date().getTime();
	}

	getFrameIndex() {
		const time = new Date().getTime();
		const diff = time - this.initialTime;
		const frame = Math.floor(diff / this.timeout);
		return frame % this.items.length;
	}

	get() {
		return this.items[this.getFrameIndex()];
	}

}
