export class SimpleCache<T> {

    constructor(
        private readonly creator: (key: string) => T,
    ) {
        this.creator = creator;
    }

    private readonly map = { };
    
    get(key: string): T {
        const oldValue = this.map[key];
        if (oldValue !== undefined) {
            return oldValue;
        } else {
            const newValue = this.creator(key);
            this.map[key] = newValue;
            return newValue;
        }
    }

}
export default SimpleCache;