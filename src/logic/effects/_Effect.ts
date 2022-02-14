import {Text} from '../../render/FontRenderer';
import {error} from '../../render/utils/Errors';

export type Effect = {
	title: string;
	description: Text;
}

export type CastedEffect = {
	effect: Effect,
	duration: number
}

const defaultText: Text = [{
	words: 'Lorem ipsum dolor sit amet'.split(' ')
}];

export const shieldEffect = {
	title: 'Shield',
	description: defaultText
};


export const fireEffect = {
	title: 'Fire',
	description: defaultText
};


export const playEffect = {
	title: 'Play',
	description: defaultText
};

export const effects = [
	shieldEffect,
	fireEffect,
	playEffect
];

export const getEffectByTitle = (title: string) => effects.find(s => s.title === title) || error('No effect found for name ' + title);
