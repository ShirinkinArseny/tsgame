import {getGraph} from '../field/FiveAngledNodes';
import {FieldNode, serializeNodes} from '../field/FieldNode';
import {Character, serializeCharacter} from '../Character';
import {Bimap} from '../../render/utils/Bimap';
import {getSkewXmatrix, scale} from '../../render/utils/Matrices';
import {multiplyMatToVec, vec3} from '../../render/utils/Vector';
import {getSpellByTitle, meleeAttack, Spell} from '../spells/Spell';
import {ServerSocket, Socket} from './Socket';
import {uuid} from '../../render/utils/ID';
import {CharacterMotion, WorldCommon} from './WorldCommon';


export class WorldServer extends WorldCommon {

	protected readonly graph: Array<FieldNode>;
	protected readonly characters: Bimap<Character, FieldNode>;
	protected readonly charactersMotions: Map<Character, CharacterMotion>;
	protected readonly turnQueue: Character[] = [];
	private readonly isPlayerAuthed = new Map<Socket, boolean>();

	constructor(
		sockets: ServerSocket,
		private readonly password: string,
	) {
		super();
		const graph = getGraph(100, 100, -100, -100, 20);
		const skewMatrix = scale(
			getSkewXmatrix(Math.atan2(0.5, 1)),
			vec3(1, 0.7, 1)
		);
		graph.forEach(node => {
			const list = [...node.points];
			node.points.splice(0, node.points.length);
			node.points.push(
				...list.map(point => multiplyMatToVec(skewMatrix, point.xyzw).xy)
			);
			node.recalcCenter();
		});
		this.graph = graph;
		this.initNodes();
		this.charactersMotions = new Map<Character, CharacterMotion>();
		this.characters = new Bimap<Character, FieldNode>();
		this.characters.set(
			new Character(
				uuid(),
				'Jeff',
				'spacedude',
				5,
				5,
				5,
				400,
				11,
				[meleeAttack]
			),
			this.graph[1]
		);
		this.characters.set(
			new Character(
				uuid(),
				'<-XxX-[PRO.DeaШoN]-XxX->',
				'bus',
				5,
				5,
				5,
				400,
				0,
				[meleeAttack]
			),
			this.graph[2]
		);
		this.characters.set(
			new Character(
				uuid(),
				'Вася',
				'giraffe',
				5,
				5,
				5,
				400,
				-4,
				[meleeAttack]
			),
			this.graph[3]
		);
		this.turnQueue = this.characters.map((a) => a);
		this.turnQueue.sort((a, b) => a.initiative - b.initiative);
		const handleMessage = (socket: Socket, message: any) => {
			this.handleMessage(socket, message);
		};
		sockets.onConnect(socket => {
			socket.onReceiveJson((message) => handleMessage(socket, message));
		});
	}

	private handleMessage = (socket: Socket, message: any) => {
		if (message.action === 'hello from client') {
			this.authPlayer(socket, message);
		} else {
			if (this.isPlayerAuthed.get(socket)) {
				if (message.action === 'cast spell') {
					this.handleCastSpell(socket, message);
				}
			} else {
				socket.drop();
			}
		}
	};

	private sendPlayerWorldState = (socket: Socket) => {
		socket.sendJson({
			action: 'hello from server',
			nodes: serializeNodes(this.graph),

		});
		this.sendUpdateCharacters(socket);
		this.sendUpdateTurnQueue(socket);
	};

	private sendUpdateTurnQueue = (socket: Socket) => {
		socket.sendJson({
			action: 'update-turn-queue',
			queue: this.turnQueue.map(c => c.id)
		});
	};

	private sendUpdateCharacters = (socket: Socket) => {
		socket.sendJson({
			action: 'update-characters',
			characters: this.characters.map((c, n) => ({
				node: n.id,
				character: serializeCharacter(c),
				motion: this.charactersMotions.get(c)
			}))
		});
	};

	private sendCastedSpell = (
		socket: Socket,
		spell: Spell,
		author: Character,
		target: FieldNode | undefined
	) => {
		socket.sendJson({
			action: 'show-casted-spell',
			spell: spell.title,
			author: author.id,
			target: target?.id
		});
	};

	private authPlayer = (socket: Socket, msg: any) => {
		if (msg.password === this.password) {
			this.isPlayerAuthed.set(socket, true);
			this.sendPlayerWorldState(socket);
		} else {
			socket.drop();
		}
	};

	private handleCastSpell = (socket: Socket, message: any) => {
		const spell = getSpellByTitle(message.spell as string);
		const targetId = message.target as (string | undefined);
		const target = targetId ? this.getNodeById(targetId) : undefined;
		if (this.isCastingSpellAllowed(spell, target)) {
			const author = this.turnQueue[0];
			this.forAllPlayers(s => this.sendCastedSpell(
				s,
				spell,
				author,
				target
			));
			if (target) {
				spell.castEffectWithTarget && spell.castEffectWithTarget(
					this,
					author,
					target
				);
			} else {
				spell.castEffectWithoutTarget && spell.castEffectWithoutTarget(
					this,
					author,
				);
			}
		}
	};

	private forAllPlayers = (action: (socket: Socket) => void) => {
		this.isPlayerAuthed.keysList().forEach(action);
	};

	moveCharacter(character: Character, to: FieldNode) {
		const from = this.characters.getB(character);
		if (!from) return;
		const path = this.findPath(from, to);
		if (path.length - 1 > character.movePoints) {
			return;
		}
		character.movePoints -= path.length - 1;
		const date = new Date().getTime();
		const motion: CharacterMotion = {
			startedAt: date,
			path: path.map(n => n.id)
		};
		this.charactersMotions.set(character, motion);
		this.forAllPlayers(this.sendUpdateCharacters);
		setTimeout(() => {
			const node = this.getNodeById(
				motion.path[motion.path.length - 1]
			);
			this.charactersMotions.delete(character);
			this.characters.removeA(character);
			this.characters.set(character, node);
			this.forAllPlayers(this.sendUpdateCharacters);
		}, (path.length - 1) * character.moveTime);
	}

	damage(
		value: [Character, number][]
	) {
		value.forEach(([char, damage]) => {
			char.hp -= damage;
		});
		this.forAllPlayers(this.sendUpdateCharacters);
	}

	startNextTurn() {
		const activeChar = this.turnQueue[0];
		activeChar.movePoints = activeChar.movePointsPerTurn;
		this.turnQueue.splice(0, 1);
		this.turnQueue.push(activeChar);
		this.forAllPlayers(this.sendUpdateTurnQueue);
	}

	teleport(author: Character, target: FieldNode) {
		this.characters.removeA(author);
		this.characters.set(author, target);
		this.forAllPlayers(this.sendUpdateCharacters);
	}

}
