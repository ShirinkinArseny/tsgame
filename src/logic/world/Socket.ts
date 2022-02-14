export abstract class Socket {

	abstract send(message: string): void;

	abstract onReceive(handle: (message: string) => void): void;

	abstract drop(): void;

	abstract onDrop(handle: () => void): void;

	sendJson(message: any) {
		this.send(JSON.stringify(message));
	}

	onReceiveJson(handle: (message: any) => void) {
		this.onReceive((string) => {
			handle(JSON.parse(string));
		});
	}

}

export interface ServerSocket {

	onConnect(handle: (socket: Socket) => void): void;


}

class LocalSocket extends Socket {

	other!: LocalSocket;
	handleNewMessage?: (message: string) => void;

	send(message: string): void {
		if (!this.other.handleNewMessage) {
			throw new Error('Not ready!');
		}
		this.other.handleNewMessage(message);
	}

	onReceive(handle: (message: string) => void): void {
		this.handleNewMessage = handle;
	}

	drop(): void {
		//
	}

	onDrop(): void {
		//
	}

}

export class LocalServerSocket implements ServerSocket {

	private handleNewConnect: (socket: Socket) => void = () => {
		/**/
	};

	onConnect(handle: (socket: Socket) => void): void {
		this.handleNewConnect = handle;
	}

	newClient(): Socket {
		const a = new LocalSocket();
		const b = new LocalSocket();
		a.other = b;
		b.other = a;
		this.handleNewConnect(a);
		return b;
	}


}
