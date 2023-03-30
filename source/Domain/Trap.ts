import { Trap } from "@konfirm/trap";

type Proxy<T> = T;
type Delegate<T extends object = object> = (target: T) => Proxy<T>;
type Trapped<T extends object = object> = { delegate: Delegate<T>, cache: WeakMap<object, Map<object, Proxy<T>>> };

const storage: WeakMap<DecoyTrap, Trapped> = new WeakMap();

export class DecoyTrap extends Trap {
    constructor(delegate: Delegate, onlyLastKeyMutation: boolean = false) {
        super(onlyLastKeyMutation);

        storage.set(this, { delegate, cache: new WeakMap() });
    }

    delegate<T extends object = object>(value: T): Proxy<T> {
        const { delegate } = <Trapped>storage.get(this);
        const result = delegate(value);

        Object.setPrototypeOf(result, Object.getPrototypeOf(value));

        return result as Proxy<T>;
    }

    cache<T extends object = object>(target: any, value: any): Proxy<T> {
        const { cache } = <Trapped>storage.get(this);

        if (!cache.has(value)) {
            cache.set(value, new Map());
        }
        const map = <Map<object, Proxy<object>>>cache.get(value);

        if (!map.has(target)) {
            map.set(target, this.delegate(value));
        }

        return map.get(target) as Proxy<T>;
    }

    get<T extends object = object, K extends keyof T = keyof T>(target: T, key: K): T[K] {
        if (key === Symbol.toPrimitive && key in target) {
            return (<any>target)[Symbol.toPrimitive].bind(target);
        }

        const value = super.get(target, key as string | symbol);

        return <T[K]>(typeof value === 'object' ? this.cache(target, value) : value);
    }
}