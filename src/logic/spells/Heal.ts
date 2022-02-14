import {Spell, spellText} from './_Spell';
import {Text} from '../../render/FontRenderer';

const text: Text = spellText(
	'Heal',
	'Restore some health points, fix injuries, stop the bleeding.',
	[
		['🔪', 'Damage', '-1'],
		['⏰', 'A/P', '2']
	]
);

export const heal: Spell = {
	title: 'Heal',
	description: text,
	isAllowed: (world, author) => author.actionPoints >= 1,
	castEffectWithoutTarget: (world, author) => {
		world.damage(author, -1);
		world.spendActionPoints(author, 1);
	},
	draw: (world, author, target, castVisualEffect) => {
		castVisualEffect(world.getCharacterState(author).node, 'Heal');
	}
};
