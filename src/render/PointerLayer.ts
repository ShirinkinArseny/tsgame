import {PointerEvent} from '../Events';

interface Listener {
	x: number,
	y: number,
	w: number,
	h: number,
	on: ((event: PointerEvent) => void)
}

const listeners: Array<Listener> = [];

export const pointerLayer = {

	reset: () => {
		listeners.splice(0, listeners.length);
	},


	listen: (listener: Listener) => {
		listeners.push(listener);
	},


	update(pointerEvent: PointerEvent) {
		for (let i = 0; i < listeners.length; i++) {
			if (pointerEvent.cancelled) return;
			const listener = listeners[i];
			if (
				listener.x <= pointerEvent.xy.x &&
				pointerEvent.xy.x <= listener.x + listener.w &&
				listener.y <= pointerEvent.xy.y &&
				pointerEvent.xy.y <= listener.y + listener.h
			) {
				listener.on(pointerEvent);
			}
		}
	}

};
