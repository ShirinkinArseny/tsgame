export class Character {

	readonly maxHp: number;
	readonly hp: number;
	readonly type: string;
	readonly name: string;
	readonly moveTime: number;


	constructor(
		name: string,
		type: string,
		hp: number,
		maxHp: number,
		moveTime: number
	) {
		this.name = name;
		this.type = type;
		this.hp = hp;
		this.maxHp = maxHp;
		this.moveTime = moveTime;
	}

}
