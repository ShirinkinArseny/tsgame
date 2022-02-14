import {Spell, spellText} from './_Spell';
import {Text} from '../../render/FontRenderer';

const text: Text = spellText(
	'Teleport',
	'Open magic portal and move through the space!',
	[
		['🏹', 'Range', '7'],
		['⏰', 'A/P', '3']
	]
);

export const teleport: Spell = {
	title: 'Teleport',
	description: text,
	isAllowed: (
		world,
		author
	) => author.actionPoints >= 3,
	getAllowedNodes: (world, author) => {
		return world.getCircleArea(
			world.getCharacterState(author).node,
			7
		);
	},
	getAffectedNodes: (world, author, target) => [target],
	castEffectWithTarget: (world, author, target) => {
		world.spendActionPoints(author, 3);
		world.teleport(author, target);
	},
	draw: (world, author, target, castVisualEffect) => {
		castVisualEffect(world.getCharacterState(author).node, 'TP-Out');
		target && castVisualEffect(target, 'TP-In');
	}
};
