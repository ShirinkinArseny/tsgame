export class Action {

	constructor(
		public readonly name: string,
		readonly cost: number,
		readonly targetCell: any,
		readonly damage: number
	) {
	}

}
