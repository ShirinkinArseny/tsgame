import {WorldClient} from '../world/WorldClient';
import {Character} from '../Character';
import {teams} from '../../constants';

export function initAI(world: WorldClient, team: string = teams.enemy) {

	world.addQueueListener(onQueueChange);

	function onQueueChange(character: Character) {
		if (character.team !== team) {
			return;
		}
	}
}


