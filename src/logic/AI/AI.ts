import {WorldClient} from '../world/WorldClient';
import {Character} from '../Character';
import {teams} from '../../constants';
import {Spell} from '../spells/_Spell';
import {FieldNode} from '../field/FieldNode';

export function initAI(world: WorldClient, team: string = teams.enemy) {

	world.addQueueListener(onQueueChange);

	function onQueueChange(character: Character) {
		if (character.team !== team) {
			return;
		}


		console.log(character);
		console.log(world);

		const moveSpell = character.spells.find(spell => spell.title === 'Move') as Spell;
		let allowedNodes: FieldNode[];
		// @ts-ignore
		allowedNodes = moveSpell.getAllowedNodes(world, character);
		dummyMoves();


		const endSpell = character.spells.find(spell => spell.title === 'End Turn') as Spell;

		world.castSpell(endSpell);

		function dummyMoves() {
			if (character.movePoints <= 0 || allowedNodes.length <= 0) {
				return;
			}
			// @ts-ignore
			allowedNodes = moveSpell.getAllowedNodes(world, character);
			const target = Math.floor(allowedNodes.length * Math.random());
			world.castSpell(moveSpell, allowedNodes[target]);

			setTimeout(dummyMoves, 2000);

		}
	}
}




