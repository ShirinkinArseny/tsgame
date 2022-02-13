import {FieldNode} from '../field/FieldNode';

export class AbstractCharacterState {

	constructor(public readonly node: FieldNode) {
	}

}

export class CharacterCalmState extends AbstractCharacterState {

	public readonly kind = 'CharacterCalmState';

	constructor(node: FieldNode) {
		super(node);
	}

}

export class CharacterMovingState extends AbstractCharacterState {

	public readonly kind = 'CharacterMovingState';

	constructor(public readonly from: FieldNode, public readonly to: FieldNode, public readonly phase: number) {
		super(from);
	}

}

export type CharacterState = CharacterCalmState | CharacterMovingState;
