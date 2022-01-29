import {FieldNode} from './field/fieldNode';
import {Bimap} from '../render/utils/bimap';
import {Character} from './character';
import {getGraph} from './field/fiveField';
import {getSkewXmatrix, scale} from '../render/utils/matrices';
import {multiplyMatToVec, vec3} from '../render/utils/vector';
import {CharacterCalmState, CharacterMovingState, CharacterState} from './gameField';


const DEFAULT_RENDER_VALUE = 10;

export class TurnQueue {

	private readonly characters: Character[];
	private currentQueue: Character[] = [];
	private currentCharacter?: Character;
	private currentCharacterIndex?: number;
	numberOfCharactersToShow: number;
	characterListToShow: Character[] = [];

	constructor(characters: Character[], numberOfCharactersToShow = 10) {
		this.characters = characters.sort((a, b) => a.initiative - b.initiative);
		this.numberOfCharactersToShow = numberOfCharactersToShow;
		/*this.currentQueue = this.characters.slice();*/
	}

	getCharacters() {
		return this.characters;
	}

	startTurn(): Character {
		if (this.currentQueue.length > 0) {
			this.currentQueue = this.characters.slice();
		}

		this.currentCharacter = this.currentQueue.pop() as Character;
		console.log(`start turn for ${this.currentCharacter.name}`);

		return this.currentCharacter;
	}

	endTurn() {

	}

}