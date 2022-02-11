export class Character {

	public movePoints: number = this.movePointsPerTurn;
	public hp: number = this.maxHp;

	constructor(
		public readonly name: string,
		public readonly type: string,
		public readonly movePointsPerTurn: number,
		public readonly maxHp: number,
		public readonly moveTime: number,
		public readonly initiative: number
	) {
	}

}
