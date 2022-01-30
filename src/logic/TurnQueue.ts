import {Character} from './character';


export class TurnQueue {

	private readonly characters: Character[];
	private currentQueue: Character[] = [];
	private currentCharacter?: Character;

	constructor(characters: Character[]) {
		this.characters = characters.slice().sort((a, b) => a.initiative - b.initiative);
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

	getCurrentQueue() {
		return this.currentQueue;
	}

	removeCharacter(character: Character) {

		if (character === this.currentCharacter) {
			this.startTurn();
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