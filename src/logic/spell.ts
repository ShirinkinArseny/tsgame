export class Spell {

	constructor(
		public readonly title: string,
		public readonly damage: number,
		public readonly range: number,
		public readonly radius: number,
	) {
	}

}

export const meleeAttack = new Spell(
	'Kick',
	1,
	1,
	0
);

