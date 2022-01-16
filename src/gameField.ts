import {getGraph} from './render/field/fiveField';
import {FieldNode} from './render/field/fieldNode';


export class GameField {

	graph: Array<FieldNode>;

	constructor() {
		this.graph = getGraph(100, 100, -100, -100, 20);
	}
}
