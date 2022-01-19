export class Bimap<A, B> {

	aToB = new Map<A, B>();
	bToA = new Map<B, A>();

	constructor() {
		//
	}

	getA(b: B) {
		return this.bToA.get(b);
	}

	getB(a: A) {
		return this.aToB.get(a);
	}

	set(a: A, b: B) {
		this.aToB.set(a, b);
		this.bToA.set(b, a);
	}

	forEach(action: (a: A, b: B) => any) {
		this.bToA.forEach((a, b) => action(a, b));
	}

	map<T>(action: (a: A, b: B) => T) {
		const res = [];
		this.forEach((a, b) => res.push(action(a, b)));
		return res;
	}

	removeA(a: A) {
		const b = this.aToB.get(a);
		this.aToB.delete(a);
		this.bToA.delete(b);
	}

	removeB(b: B) {
		const a = this.bToA.get(b);
		this.bToA.delete(b);
		this.aToB.delete(a);
	}
}
