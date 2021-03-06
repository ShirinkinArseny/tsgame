import {degreesToRadians, rotatePoint} from '../../render/utils/Geom';
import {FieldNode} from './FieldNode';
import {vec2, Vec2, vecSum} from '../../render/utils/Vector';

function getCrossPoints(boundRight = 20, boundUp = 20, boundLeft = 0, boundDown = 0, shapeSize = 1) {
	const crossCenterPoints: Array<Vec2> = [];

	const xx = boundLeft / shapeSize;
	const xInt = Math.floor(xx);
	const xDiff = xInt - xx;
	for (let x = xInt; x * shapeSize < boundRight; x += 1) {
		for (let y = [2, 0, 3, 1, 4][((x % 5) + 5) % 5] + boundDown / shapeSize; y * shapeSize < boundUp; y += 5) {
			crossCenterPoints.push(vec2(x * shapeSize - xDiff, y * shapeSize));
		}
	}

	return crossCenterPoints;
}

export function getGraph(
	boundRight: number | undefined,
	boundUp: number | undefined,
	boundLeft: number | undefined,
	boundDown: number | undefined,
	shapeSize: number | undefined
) {
	const crossPoints = getCrossPoints(boundRight, boundUp, boundLeft, boundDown, shapeSize);

	const fiveShapePoints = crossPoints.map(crossCenter => getCrossFiveShapes(crossCenter, shapeSize)).flat(1);
	const nodes = fiveShapePoints.map((points) => {
		return new FieldNode(points);
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

	return nodes;

}

function getCrossFiveShapes(crossCenter: Vec2, shapeSize = 1): Array<Array<Vec2>> {
	const upFiveAngle: Vec2[] = [
		vec2(0, 0),
		vec2(0.5 * shapeSize, -0.5 * shapeSize),
		vec2(0.5 * shapeSize, -1.5 * shapeSize),
		vec2(-0.5 * shapeSize, -1.5 * shapeSize),
		vec2(-0.5 * shapeSize, -0.5 * shapeSize)
	];
	const translatedFiveAngle = upFiveAngle.map((point: Vec2) => {
		return vecSum(point, crossCenter);
	});
	const cross = [
		rotateShape(translatedFiveAngle, 0, crossCenter),
		rotateShape(translatedFiveAngle, 90, crossCenter),
		rotateShape(translatedFiveAngle, 180, crossCenter),
		rotateShape(translatedFiveAngle, 270, crossCenter)
	];
	return cross;
}

function rotateShape(shape: Vec2[], angleDeg: number, origin: Vec2 | undefined) {
	const r = shape.map(point => {
		const rr = rotatePoint(point, degreesToRadians(angleDeg), origin);
		return rr;
	});
	return r;
}

class FiveEgde {
	nodes: FieldNode[];
	points: [Vec2, Vec2];

	constructor(points: [Vec2, Vec2]) {
		this.points = points;
		this.nodes = [];
	}

	addNode(node: FieldNode) {
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
