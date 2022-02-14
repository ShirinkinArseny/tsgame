import {Spell, spellText} from './_Spell';
import {Text} from '../../render/FontRenderer';

const text: Text = spellText(
	'Move',
	'Change your location via moving your body by legs.',
	[
		['⏰', 'M/P', '1 per cell']
	]
);

export const move: Spell = {
	title: 'Move',
	description: text,
	isAllowed: (world, character) => character.movePoints > 0,
	getAllowedNodes: (world, author) => {
		return world.getCircleArea(
			world.getCharacterState(author).node,
			author.movePoints
		);
	},
	getAffectedNodes: (world, author, target) => {
		const path = world.findPath(
			world.getCharacterState(author).node,
			target
		);
		while (
			path.length > 0 &&
			path.length - 1 > author.movePoints) {
			path.splice(path.length - 1, 1);
		}
		return path;
	},
	castEffectWithTarget: (world, author, target) => {
		world.moveCharacter(author, target);
	}
};
