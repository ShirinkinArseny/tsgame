import {Socket} from './Socket';
import {Character, deserializeCharacter} from '../Character';
import {deserializeNodes, FieldNode} from '../field/FieldNode';
import {CharacterMotion, WorldCommon} from './WorldCommon';
import {Bimap} from '../../render/utils/Bimap';
import {error} from '../../render/utils/Errors';
import {getSpellByTitle, Spell} from '../spells/_Spell';


export type SpellListener = (
	spell: Spell,
	author: Character,
	target: FieldNode | undefined
) => void
export type QueueListener = (character: Character) => void

export class WorldClient extends WorldCommon {

	protected readonly graph: Array<FieldNode> = [];
	protected readonly characters: Bimap<Character, FieldNode> = new Bimap();
	protected readonly charactersMotions: Map<Character, CharacterMotion> = new Map();
	protected readonly turnQueue: Character[] = [];
	private readonly charIdToChar = new Map<string, Character>();
	private readonly spellListeners: SpellListener[] = [];
	private readonly queueListeners: QueueListener[] = [];

	addSpellListener(listener: SpellListener) {
		this.spellListeners.push(listener);
	}

	addQueueListener(listener: QueueListener) {
		this.queueListeners.push(listener);
	}

	constructor(
		private socket: Socket,
		password: string,
		team: string,
	) {
		super();
		socket.onReceiveJson(obj => {
			if (obj.action === 'hello from server') {
				this.handleInitConnection(obj);
			}
			if (obj.action === 'update-characters') {
				this.handleUpdateCharacters(obj);
			}
			if (obj.action === 'update-turn-queue') {
				this.handleUpdateTurnQueue(obj);
			}
			if (obj.action === 'show-casted-spell') {
				this.handleShowCastedSpell(obj);
			}
		});
		socket.sendJson({
			action: 'hello from client',
			team: team,
			password: password,
		});
	}

	private handleInitConnection(msg: any) {
		this.graph.push(...deserializeNodes(msg.nodes));
		this.initNodes();
	}

	private handleShowCastedSpell(msg: any) {
		const spell = getSpellByTitle(msg.spell);
		const author = this.charIdToChar.get(msg.author) || error('Cannot find char');
		const targetId = msg.target;
		const target = targetId && this.getNodeById(targetId);
		this.spellListeners.forEach(sl => sl(
			spell,
			author,
			target
		));
	}

	private handleUpdateCharacters(msg: any) {
		msg.characters.forEach((j: any) => {
			const nodeId = j.node as string;
			const id = j.character.id as string;
			const oldCharacter = this.charIdToChar.get(id);
			const character = deserializeCharacter(
				oldCharacter,
				j.character
			);
			this.charIdToChar.set(character.id, character);
			this.characters.set(character, this.getNodeById(nodeId));
			const motion = j.motion as CharacterMotion | undefined;
			if (motion) {
				this.charactersMotions.set(character, motion);
			}
		});
		const deadCharacters = this.characters.map(a => a).filter(a => a.hp <= 0);
		deadCharacters.forEach(corpse => {
			this.turnQueue.delete(corpse);
			this.charactersMotions.delete(corpse);
			this.characters.deleteA(corpse);
			this.charIdToChar.delete(corpse.id);
		});
	}

	private handleUpdateTurnQueue(msg: any) {
		this.turnQueue.splice(0, this.turnQueue.length);
		this.turnQueue.push(
			...(msg.queue as string[]).map(id =>
				this.charIdToChar.get(id) || error('No character with id=' + id)
			)
		);

		this.queueListeners.forEach(queueListener => queueListener(
			this.turnQueue[0]
		));
	}

	castSpell(
		spell: Spell,
		target: FieldNode | undefined = undefined
	): void {
		if (this.isCastingSpellAllowed(spell, target)) {
			this.socket.sendJson({
				action: 'cast spell',
				spell: spell.title,
				target: target?.id
			});
		}
	}
}
