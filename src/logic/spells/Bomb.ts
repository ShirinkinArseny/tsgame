import {FieldNode} from '../field/FieldNode';
import {Spell, spellText} from './_Spell';
import {Text} from '../../render/FontRenderer';

const text: Text = spellText(
	'Bomb',
	'Drop a bomb that deal fire damage to everything in the area around it.',
	[
		['🔪', 'Damage', '1'],
		['🏹', 'Range', '5'],
		['📏', 'Radius', '2'],
		['⏰', 'A/P', '2']
	]
);

export const bomb: Spell = {
	title: 'Bomb',
	description: text,
	isAllowed: (world, character) => character.actionPoints >= 2,
	getAllowedNodes: (world, author) => {
		return world.getCircleArea(
			world.getCharacterState(author).node,
			5,
			true
		);
	},
	getAffectedNodes: (world, author, target) => {
		return world.getCircleArea(
			target,
			2,
			true
		);
	},
	castEffectWithTarget: (world, author, target: FieldNode) => {
		world.spendActionPoints(author, 2);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const affectedNodes = bomb.getAffectedNodes(world, author, target);
		affectedNodes.forEach(n => {
			const c = world.getCharacterAt(n);
			if (c) {
				world.damage(c, 1);
			}
		});
	},
	draw: (world, author, target, castVisualEffect) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const affectedNodes = bomb.getAffectedNodes(world, author, target);
		affectedNodes.forEach(n => {
			const i = 1 + Math.floor(3 * Math.random() * 0.9999);
			castVisualEffect(n, 'Explosion:' + i);
		});
	}
};
