import {Character} from './Character';
import {FieldNode} from './field/FieldNode';
import {Text} from '../render/FontRenderer';
import {WorldCommon} from './world/WorldCommon';
import {WorldServer} from './world/WorldServer';
import {error} from '../render/utils/Errors';
import {WorldClient} from './world/WorldClient';

export type Spell = {
	title: string;
	description: Text;
	isAllowed: (field: WorldCommon, author: Character) => boolean;
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

export const endTurn: Spell = {
	title: 'End Turn',
	description: [{
		words: 'Let the next character act'.split(' ')
	}],
	isAllowed: () => true,
	castEffectWithoutTarget: (world) => {
		world.startNextTurn();
	}
};

export const move: Spell = {
	title: 'Move',
	description: [{
		words: 'Do a steppity-step. Get out the way!'.split(' ')
	}],
	isAllowed: () => true,
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

export const meleeAttack: Spell = {
	title: 'Kick',
	description: [{
		words: 'Kick another character with a fist. Three hundred bucks!'.split(' ')
	}],
	isAllowed: () => true,
	getAllowedNodes: (world, author) => {
		return world.getCircleArea(
			world.getCharacterState(author).node,
			1,
			true
		);
	},
	getAffectedNodes: (world, author, target) => [target],
	castEffectWithTarget: () => {
		//
	}
};

export const bomb: Spell = {
	title: 'Bomb',
	description: [{
		words: 'DROP DA BOMB DROP DA BOMB DROP DA BOBM'.split(' ')
	}],
	isAllowed: () => true,
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


export const heal: Spell = {
	title: 'Heal',
	description: [{
		words: 'Will heal character'.split(' ')
	}],
	isAllowed: () => true,
	castEffectWithoutTarget: (world, author) => {
	},
	draw: (world, author, target, castVisualEffect) => {
		castVisualEffect(world.getCharacterState(author).node, 'Heal');
	}
};


export const teleport: Spell = {
	title: 'Teleport',
	description: [{
		words: 'Move to selected cell'.split(' ')
	}],
	isAllowed: (
		world,
		author
	) => author.actionPoints > 2,
	castEffectWithTarget: (world, author, target) => {
		world.teleport(author, target);
	},
	draw: (world, author, target, castVisualEffect) => {
		castVisualEffect(world.getCharacterState(author).node, 'TP-Out');
		target && castVisualEffect(target, 'TP-In');
	}
};

export const spells = [
	endTurn,
	move,
	meleeAttack,
	bomb,
	heal,
	teleport
];

export const getSpellByTitle = (title: string) => spells.find(s => s.title === title) || error('No spell found for name ' + title);
