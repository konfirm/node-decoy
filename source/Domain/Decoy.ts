import { hash } from "@konfirm/checksum";
import { DecoyTrap } from "./Trap";

type Decoy<T extends object> = T;
type Decoyed<T extends object> = {
    target: T;
    trap: DecoyTrap;
    linked: Array<Decoy<object>>;
};
const storage: WeakMap<Decoy<object>, Decoyed<object>> = new WeakMap();

export function create<T extends object = object>(target: T, onlyLastKeyMutation?: boolean): Decoy<T> {
    const linked: Array<Decoy<object>> = [];
    const trap = new DecoyTrap((t) => linked[linked.push(create(t, onlyLastKeyMutation)) - 1], onlyLastKeyMutation);
    const proxy = new Proxy(target, trap);

    storage.set(proxy, { target, trap, linked });

    return <Decoy<T>>proxy;
}

export function checksum(proxy: Decoy<object>): string {
    return hash(proxy);
}

export function isDecoy<T extends object = object>(input: any): input is Decoy<T> {
    return storage.has(input);
}

async function traverse<T extends object>(decoy: Decoy<T>, action: (decoyed: Decoyed<object>, filter?: { [key: string | symbol]: string | symbol }) => void | Promise<void>, keys?: Array<keyof T>): Promise<T> {
    if (!isDecoy(decoy)) {
        throw new Error(`Not a known Decoy: ${decoy}`);
    }

    const decoyed = <Decoyed<T>>storage.get(decoy);

    if (keys?.length) {
        const mutated = keys.filter((key) => hasMutations(decoy, key));
        await Promise.all(mutated.map((key) => isDecoy(decoy[key]) ? traverse(<T>decoy[key], action) : action(decoyed, { [key]: <string | symbol>key })));

        return decoyed.target;
    }

    await action(decoyed);

    const { linked, target } = decoyed;
    await Promise.all(linked.map((linked) => traverse<typeof linked>(linked, action)));

    return target;
}

export function purge<T extends object = object>(decoy: Decoy<T>): Promise<T> {
    return traverse(
        decoy,
        (decoyed) => {
            storage.delete(decoy);
            decoyed.linked.length = 0;
        }
    );
}

export function commit<T extends object = object>(decoy: Decoy<T>, ...keys: Array<keyof T>): Promise<T> {
    return traverse(decoy, ({ trap }) => trap.commit(), keys);
}

export function rollback<T extends object = object>(decoy: Decoy<T>, ...keys: Array<keyof T>): Promise<T> {
    return traverse(decoy, ({ trap }) => trap.rollback(), keys);
}

export function hasMutations<T extends object = object>(decoy: Decoy<T>, ...keys: Array<keyof T>): boolean {
    if (isDecoy(decoy)) {
        const { trap, linked } = <Decoyed<T>>storage.get(decoy);

        return keys.length
            ? keys.some((key) => trap.count(<{ key: string | symbol }>{ key }) > 0 || (isDecoy(decoy[key]) && hasMutations(<T>decoy[key])))
            : trap.count() > 0 || linked.some((linked) => hasMutations(linked))
    }

    return false;
}