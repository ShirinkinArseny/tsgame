import {getSpellByTitle, Spell} from './spells/Spell';

export class Character {

	constructor(
		public id: string,
		public name: string,
		public type: string,
		public movePointsPerTurn: number,
		public actionPointsPerTurn: number,
		public maxHp: number,
		public moveTime: number,
		public initiative: number,
		public spells: Array<Spell>,
		public movePoints: number = movePointsPerTurn,
		public actionPoints: number = actionPointsPerTurn,
		public hp: number = maxHp,
	) {
	}

}

export const serializeCharacter = (character: Character) => {
	return {
		id: character.id,
		name: character.name,
		type: character.type,
		movePointsPerTurn: character.movePointsPerTurn,
		actionPointsPerTurn: character.actionPointsPerTurn,
		maxHp: character.maxHp,
		moveTime: character.moveTime,
		initiative: character.initiative,
		movePoints: character.movePoints,
		actionPoints: character.actionPoints,
		hp: character.hp,
		spells: character.spells.map(s => s.title)
	};
};

export const deserializeCharacter = (
	oldCharacter: Character | undefined,
	j: any
) => {
	if (oldCharacter) {
		oldCharacter.id = j.id;
		oldCharacter.name = j.name;
		oldCharacter.type = j.type;
		oldCharacter.movePointsPerTurn = j.movePointsPerTurn;
		oldCharacter.actionPointsPerTurn = j.actionPointsPerTurn;
		oldCharacter.maxHp = j.maxHp;
		oldCharacter.moveTime = j.moveTime;
		oldCharacter.initiative = j.initiative;
		oldCharacter.spells = j.spells.map((s: any) => getSpellByTitle(s));
		oldCharacter.movePoints = j.movePoints;
		oldCharacter.actionPoints = j.actionPoints;
		oldCharacter.hp = j.hp;
		return oldCharacter;
	} else {
		return new Character(
			j.id,
			j.name,
			j.type,
			j.movePointsPerTurn,
			j.actionPointsPerTurn,
			j.maxHp,
			j.moveTime,
			j.initiative,
			j.spells.map((s: any) => getSpellByTitle(s)),
			j.movePoints,
			j.actionPoints,
			j.hp,
		);
	}
};
