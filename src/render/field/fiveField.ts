import {degreesToRadians, rotatePoint, translatePoint} from '../utils/geom';
import {Vec2} from '../matrices';

export const getFiveField = (width: number = 3, height: number = 3, bigSideSize: number = 1) => {

	const upFiveAngle = [[0, 0], [0.5, -0.5], [0.5, -1.5], [-0.5, -1.5], [-0.5, -0.5]];

	const rightFiveAngle = rotateShape(upFiveAngle, 0);

	const downFiveAngle = rotateShape(upFiveAngle, 0);

	const leftFiveAngle = rotateShape(upFiveAngle, 0);
	const baseCross = [upFiveAngle, rightFiveAngle, downFiveAngle, leftFiveAngle];
	return baseCross;
	// 	.map((shape) => {
	// 	return rotateShape(shape, 0);
	// });
};

function getCrossPoints() {
	const crossCenterPoints: Array<Vec2> = [];
	const boundRight = 20;
	const boundUp = 20;

	for (let x = 0; x < boundRight; x++) {
		for (let y = [2, 0, 3, 1, 4][x % 5]; y < boundUp; y += 5) {
			crossCenterPoints.push([x, y]);
		}
	}

	return crossCenterPoints;
}

export function getGraph() {
	const crossPoints = getCrossPoints();

	const fiveShapePoints = crossPoints.map(getCrossFiveShapes).flat(1);
	const nodes = fiveShapePoints.map((points) => {
		return new FiveNode(points);
	});
	const edges: FiveEgde[] = [];
	nodes.forEach(node => {
		node.points.forEach((point, i, points) => {
			const newEdge = new FiveEgde([points[i], points[((i + 1) % 5)]]);

			const isAlreadyExists = edges.some(edge => {
				const areEqual = areEqualEgdes(edge, newEdge);
				if (areEqual) {
					edge.addNode(node);
					return true;
				} else {
					return false;
				}
			});
			if (isAlreadyExists) {
				return;
			}
			newEdge.addNode(node);
			edges.push(newEdge);
		});
	});

	edges.forEach(edge => {
		if (edge.nodes.length === 2) {
			edge.nodes[0].linkToNode(edge.nodes[1]);
		}
	});
	console.log('edges', edges);
	console.log('shapes', fiveShapePoints);
	console.log('nodes', nodes);
	return nodes;

}

function getCrossFiveShapes(crossCenter: Vec2): Array<Array<Vec2>> {
	const upFiveAngle: Vec2[] = [[0, 0], [0.5, -0.5], [0.5, -1.5], [-0.5, -1.5], [-0.5, -0.5]];
	const translatedFiveAngle = upFiveAngle.map((point: Vec2) => {
		return translatePoint(point, crossCenter);
	});
	const cross = [
		rotateShape(translatedFiveAngle, 0, crossCenter),
		rotateShape(translatedFiveAngle, 90, crossCenter),
		rotateShape(translatedFiveAngle, 180, crossCenter),
		rotateShape(translatedFiveAngle, 270, crossCenter)
	];
	return cross;
}

function rotateShape(shape, angleDeg, origin?) {
	return shape.map(point => {
		return rotatePoint(point as Vec2, degreesToRadians(angleDeg), origin);
	});
}

class FiveNode {
	points: Array<Vec2>;
	angleGrad: number;
	nodes: FiveNode[];

	constructor(points: Array<Vec2>) {
		this.points = points;
		this.nodes = [];
	};

	linkToNode(node: FiveNode) {
		if (this.nodes.includes(node)) {
			return;
		}
		this.nodes.push(node);
		node.linkToNode(this);
	}
}

class FiveEgde {
	nodes: FiveNode[];
	points: [Vec2, Vec2];

	constructor(points: [Vec2, Vec2]) {
		this.points = points;
		this.nodes = [];
	}

	addNode(node: FiveNode) {
		if (this.nodes.includes(node)) {
			return;
		}
		this.nodes.push(node);
	}
}

function areEqualEgdes(edge1: FiveEgde, edge2: FiveEgde) {
	return arePointsEqual(edge1.points[0], edge2.points[0]) && arePointsEqual(edge1.points[1], edge2.points[1]) || arePointsEqual(edge1.points[0], edge2.points[1]) && arePointsEqual(edge1.points[1], edge2.points[0]);
}

function arePointsEqual(point1: Vec2, point2: Vec2) {
	const epsilon = 0.01;
	return Math.abs(point1[0] - point2[0]) < epsilon && Math.abs(point1[1] - point2[1]) < epsilon;
}

function mod(a: number, b: number) {
	return ((a % b) + b) % b;
}