import {range} from './Lists';

export const uuid = () => range(0, 35).map(() =>
	'01234556789abcdef'[Math.floor(Math.random() * 15.999999999999998)]
).join('');
