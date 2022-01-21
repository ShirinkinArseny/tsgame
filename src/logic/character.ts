export class Character {

	constructor(
		public readonly name: string,
		public readonly type: string,
		public readonly hp: number,
		public readonly maxHp: number,
		public readonly moveTime: number
	) {
	}

}
