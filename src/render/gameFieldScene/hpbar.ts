import {range} from '../utils/lists';

export function hpbar(value: number, max: number) {
	return range(0, max - 1).map(i =>
		'△◭▲'[(value > i + 0.75 ? 1 : 0) + (value > i + 0.25 ? 1 : 0)]
	).join('');
}
