import {GameField} from './gameField';
import {Character} from './character';
import {FieldNode} from './field/fieldNode';
import {Text} from '../render/fontRenderer';

export type Spell = {
	title: string;
	description: Text;
	isAllowed: (field: GameField, author: Character) => boolean;
	castEffectWithoutTarget?: (
		field: GameField,
		author: Character,
	) => void;
	getAllowedNodes?: (
		field: GameField,
		author: Character,
	) => Array<FieldNode>;
	getAffectedNodes?: (
		field: GameField,
		author: Character,
		target: FieldNode
	) => Array<FieldNode>;
	castEffectWithTarget?: (
		field: GameField,
		author: Character,
		target: FieldNode
	) => void;
}

export const endTurn: Spell = {
	title: 'End Turn',
	description: [{
		words: 'Let the next character act'.split(' ')
	}],
	isAllowed: (field, author) => true,
	castEffectWithoutTarget: (field) => {
		field.startNextTurn();
	}
};

export const move: Spell = {
	title: 'Move',
	description: [{
		words: 'Do a steppity-step. Get out the way!'.split(' ')
	}],
	isAllowed: (field, author) => true,
	getAllowedNodes: (field, author) => {
		return field.getCircleArea(
			field.getCharacterState(author).node,
			author.movePoints
		);
	},
	getAffectedNodes: (field, author, target) => {
		const path = field.findPath(
			field.getCharacterState(author).node,
			target
		);
		while (
			path.length > 0 &&
			path.length - 1 > author.movePoints) {
			path.splice(path.length - 1, 1);
		}
		return path;
	},
	castEffectWithTarget: (field, author, target) => {
		field.moveCharacter(
			author,
			target
		);
	}
};

export const meleeAttack: Spell = {
	title: 'Kick',
	description: [{
		words: 'Kick another character with a fist. Three hundred bucks!'.split(' ')
	}],
	isAllowed: (field, author) => true,
	getAllowedNodes: (field, author) => {
		return field.getCircleArea(
			field.getCharacterState(author).node,
			1,
			true
		);
	},
	getAffectedNodes: (field, author, target) => [target],
	castEffectWithTarget: (field, author, target) => {
		//
	}
};

export const bomb: Spell = {
	title: 'Bomb',
	description: [{
		words: 'DROP DA BOMB DROP DA BOMB DROP DA BOBM'.split(' ')
	}],
	isAllowed: (field, author) => true,
	getAllowedNodes: (field, author) => {
		return field.getCircleArea(
			field.getCharacterState(author).node,
			5,
			true
		);
	},
	getAffectedNodes: (field, author, target) => {
		return field.getCircleArea(
			target,
			2,
			true
		);
	},
	castEffectWithTarget: (field, author, target) => {
		//
	}
};


export const heal: Spell = {
	title: 'Heal',
	description: [{
		words: 'Will heal character'.split(' ')
	}],
	isAllowed: (field, author) => true,
	castEffectWithoutTarget: (field, author) => {
		//
	}
};

export const spells = [
	endTurn,
	move,
	meleeAttack,
	bomb,
	heal
];
