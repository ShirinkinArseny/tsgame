import {Character} from '../Character';
import {FieldNode} from '../field/FieldNode';
import {FontStyle, HorizontalAlign, Text} from '../../render/FontRenderer';
import {WorldCommon} from '../world/WorldCommon';
import {WorldServer} from '../world/WorldServer';
import {error} from '../../render/utils/Errors';
import {WorldClient} from '../world/WorldClient';
import {endTurn} from './EndTurn';
import {move} from './Move';
import {kick} from './Kick';
import {bomb} from './Bomb';
import {heal} from './Heal';
import {teleport} from './Teleport';
import {Colors} from '../../render/utils/Colors';

export type Spell = {
	title: string;
	description: Text;
	isAllowed: (world: WorldCommon, author: Character) => boolean;
	getAllowedNodes?: (
		world: WorldCommon,
		author: Character,
	) => Array<FieldNode>;
	getAffectedNodes?: (
		world: WorldCommon,
		author: Character,
		target: FieldNode
	) => Array<FieldNode>;
	castEffectWithoutTarget?: (
		world: WorldServer,
		author: Character,
	) => void;
	castEffectWithTarget?: (
		world: WorldServer,
		author: Character,
		target: FieldNode
	) => void;
	draw?: (
		world: WorldClient,
		author: Character,
		target: FieldNode | undefined,
		castVisualEffect: (node: FieldNode, type: string) => void
	) => void;
}

export const spells = [
	endTurn,
	move,
	kick,
	bomb,
	heal,
	teleport
];

export const getSpellByTitle = (title: string) => spells.find(s => s.title === title) || error('No spell found for name ' + title);

export function spellText(
	title: string,
	description: string,
	table: [string, string, string][],
	subtext: string | undefined = undefined
): Text {
	return [
		{
			words: [
				{
					word: title,
					fontStyle: FontStyle.BOLD,
				}
			]
		},
		{
			words: description.split(' ').map(w => ({
				word: w,
				fontStyle: FontStyle.SMALL
			})),
			paddingBottom: 5
		},
		{
			cells: table.map(line => line.map((w, idx) => ({
				type: 'paragraph',
				words: [
					{
						word: w,
						fontStyle: (idx === 1) ? FontStyle.BOLD : FontStyle.SMALL
					}
				],
				align: [
					HorizontalAlign.LEFT,
					HorizontalAlign.LEFT,
					HorizontalAlign.RIGHT
				][idx],
				paddingBottom: 2
			}))),
			columns: [
				{allowStretch: false},
				{allowStretch: true},
				{allowStretch: false},
			],
			paddingBottom: 0
		},
		subtext ? {
			words: subtext.split(' ').map(w => ({
				word: w,
				color: Colors.RED,
				fontStyle: FontStyle.SMALL
			})),
			align: HorizontalAlign.CENTER
		} : undefined
	].filter(a => a) as Text;
}
