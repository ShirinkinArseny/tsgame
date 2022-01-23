import {ortho, reverse} from './utils/matrices';
import {vec4} from './utils/vector';


export const runMatrixTests = () => {

	const v1 = vec4(1, 0, 0, 1);

	const o1 = ortho(0, 256, 256, 0);
	const o2 = reverse(o1);

	const v2 = v1.times(o2);
	const v3 = v2.times(o1);
	console.log(v2);
	console.log(v3);


};
