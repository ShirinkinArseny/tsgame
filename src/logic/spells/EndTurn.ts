import {Spell, spellText} from './_Spell';
import {Text} from '../../render/FontRenderer';


const text: Text = spellText(
	'End turn',
	'Got out of action points? End turn to restore some!',
	[
		['⏰', 'A/P', '0']
	],
	'Can be casted only once per turn'
);

export const endTurn: Spell = {
	title: 'End Turn',
	description: text,
	isAllowed: () => true,
	castEffectWithoutTarget: (world) => {
		world.startNextTurn();
	}
};
