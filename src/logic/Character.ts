import {getSpellByTitle, Spell} from './spells/_Spell';
import {CastedEffect, getEffectByTitle} from './effects/_Effect';

export type Character = {
	id: string
	name: string
	type: string
	movePointsPerTurn: number
	actionPointsPerTurn: number
	maxHp: number
	moveTime: number
	initiative: number
	team: string
	movePoints: number
	actionPoints: number
	hp: number
	spells: Spell[]
	effects: CastedEffect[]
}

export const serializeCharacter = (character: Character) => {
	return Object.assign({}, character, {
		spells: character.spells.map(s => s.title),
		effects: character.effects.map(s => ({
			title: s.effect.title,
			duration: s.duration,
		})),
	});
};

export const deserializeCharacter = (
	oldCharacter: Character | undefined,
	j: any
) => {
	const q = {
		spells: j.spells.map((s: any) => getSpellByTitle(s)),
		effects: j.effects.map((s: any) => ({
			duration: s.duration,
			effect: getEffectByTitle(s.title)
		})),
	};
	if (oldCharacter) {
		return Object.assign(oldCharacter, j, q);
	} else {
		return Object.assign({}, j, q);
	}
};
