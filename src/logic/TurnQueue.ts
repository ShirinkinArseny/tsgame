import {Character} from './character';
import {Action} from './action';


export class TurnQueue {

	private readonly characters: Character[];
	private currentQueue: Character[] = [];
	currentCharacter?: Character;

	getCurrentCharacter(): Character {
		if (!this.currentCharacter) {
			this.startNextTurn();
		}
		return this.currentCharacter as Character;
	}

	constructor(characters: Character[]) {
		this.characters = characters.slice().sort((a, b) => a.initiative - b.initiative);

		this.characters.forEach(ch => {
			console.log(ch.name);
		});

	}

	getCharacters() {
		return this.characters;
	}

	startNextTurn(): Character {
		if (this.currentQueue.length <= 0) {
			this.currentQueue = this.characters.slice();
		}

		this.currentCharacter = this.currentQueue.pop() as Character;
		console.log(`start turn for ${this.currentCharacter.name}`);

		return this.currentCharacter;
	}

	doAction(action: Action) {

	}

	getCurrentQueue() {
		return this.currentQueue;
	}

	removeCharacter(character: Character) {

		if (character === this.currentCharacter) {
			this.startNextTurn();
		}
		const index1 = this.characters.indexOf(character);
		if (index1 > -1) {
			this.characters.splice(index1, 1);
		}

		const index2 = this.currentQueue.indexOf(character);
		if (index2 > -1) {
			this.currentQueue.splice(index2, 1);
		}
		console.log(`${character.name} died`);
	}

	addCharacter(character: Character) {

		if (this.characters.indexOf(character) != -1) {
			console.warn('weird, character already in the list');
		}

		this.currentQueue.push(character);
		this.characters.push(character);

		console.log(`${character.name} spawned`);
	}


}