import {Spell, spellText} from './_Spell';
import {Text} from '../../render/FontRenderer';

const text: Text = spellText(
	'Kick',
	'Kick another character with a fist. Three hundred bucks!',
	[
		['🔪', 'Damage', '1'],
		['🏹', 'Range', '1'],
		['⏰', 'A/P', '1']
	]
);

export const kick: Spell = {
	title: 'Kick',
	description: text,
	isAllowed: (world, character) => character.actionPoints >= 1,
	getAllowedNodes: (world, author) => {
		return world.getCircleArea(
			world.getCharacterState(author).node,
			1,
			true
		);
	},
	getAffectedNodes: (world, author, target) => [target],
	castEffectWithTarget: (world, author, target) => {
		world.spendActionPoints(author, 1);
		const c = world.getCharacterAt(target);
		if (c) {
			world.damage(c, 1);
		}
	}
};
