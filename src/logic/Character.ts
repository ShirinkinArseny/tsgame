import {getSpellByTitle, Spell} from './spells/Spell';

export type Character = {
	id: string,
	name: string,
	type: string,
	movePointsPerTurn: number,
	actionPointsPerTurn: number,
	maxHp: number,
	moveTime: number,
	initiative: number,
	spells: Array<Spell>,
	team: string,
	movePoints: number,
	actionPoints: number,
	hp: number,
}

export const serializeCharacter = (character: Character) => {
	return Object.assign({}, character, {spells: character.spells.map(s => s.title)});
};

export const deserializeCharacter = (
	oldCharacter: Character | undefined,
	j: any
) => {
	if (oldCharacter) {
		return Object.assign(oldCharacter, j, {spells: j.spells.map((s: any) => getSpellByTitle(s))});
	} else {
		return Object.assign({}, j, {spells: j.spells.map((s: any) => getSpellByTitle(s))});

	}
};
