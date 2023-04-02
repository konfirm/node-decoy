import test from 'tape';
import { each } from 'template-literal-each';
import * as Decoy from '../../source/Domain/Decoy';

test('Domain/Decoy - exports', (t) => {
    const expect = ['create', 'checksum', 'isDecoy', 'purge', 'commit', 'rollback', 'hasMutations'];
    const actual = Object.keys(Decoy);

    t.deepEqual(actual, expect, `exports ${expect.join(', ')}`)
    actual.forEach((key) => {
        t.equal(typeof Decoy[key], 'function', `${key} is a function`);
    });

    t.end();
});

test('Domain/Decoy - create', (t) => {
    const subject = { foo: 'bar' };
    const decoy = Decoy.create(subject);

    t.equal(decoy.constructor, subject.constructor, 'Both subject and decoy have the same constructor');
    t.equal(decoy.constructor.name, subject.constructor.name, 'Both subject and decoy have the same constructor name');
    t.equal(JSON.stringify(decoy), JSON.stringify(subject), 'JSON.stringify procudes the same output for both subject and its decoy');
    t.deepEqual(decoy, subject, 'The subject and its decoy are the same');
    t.notEqual(decoy, subject, 'The subject and its decoy are not equal')

    t.end();
});

test('Domain/Decoy - reflects changes on the decoy', (t) => {
    const subject = { foo: 'bar' };
    const decoy = Decoy.create(subject);

    t.equal(subject.foo, 'bar', 'The subject foo property has value "bar"');
    t.equal(decoy.foo, 'bar', 'The decoy foo property has value "bar"');

    decoy.foo = 'changed';
    t.equal(subject.foo, 'bar', 'The subject foo property has value "bar"');
    t.equal(decoy.foo, 'changed', 'The decoy foo property has value "changed"');

    t.equal(JSON.stringify(subject), '{"foo":"bar"}', 'The JSON representation of subject is {"foo":"bar"}');
    t.equal(JSON.stringify(decoy), '{"foo":"changed"}', 'The JSON representation of decoy is {"foo":"changed"}');

    t.end();
});

test('Domain/Decoy - decoys allow for primitive comparison', (t) => {
    const date1 = Decoy.create(new Date('2001'));
    const date2 = Decoy.create(new Date('2002'));

    t.ok(date1 < date2, `${date1} is less than ${date2}`);
    t.notOk(date1 > date2, `${date1} is not greater than ${date2}`);

    class Custom {
        constructor(private value: number) { }

        [Symbol.toPrimitive](hint: 'string' | 'number'): string | number {
            return hint === 'string'
                ? `[Custom:${this.value}]`
                : this.value;
        }
    }

    const custom1 = new Custom(123);
    const custom2 = new Custom(345);

    t.ok(custom1 < custom2, `${custom1} is less than ${custom2}`);
    t.notOk(custom1 > custom2, `${custom1} is not greater than ${custom2}`);

    t.end();
});


[undefined, false, true].forEach((onlyLastKeyMutation) => {
    const subject = { foo: 'bar', arr: [1, 'b', { nested: 'foo' }], nested: { hello: 'world' } };

    test(`Domain/Decoy - mutations (onlyLastKeyMutation = ${onlyLastKeyMutation})`, (t) => {
        const decoy = Decoy.create(subject, onlyLastKeyMutation);

        t.test(`top level (onlyLastKeyMutation = ${onlyLastKeyMutation})`, async (t) => {
            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.equal(subject.foo, 'bar', 'subject.foo is "bar"');
            t.equal(decoy.foo, 'bar', 'decoy.foo is "bar"');

            decoy.foo = 'changed';

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
            t.equal(subject.foo, 'bar', 'subject.foo is "bar"');
            t.equal(decoy.foo, 'changed', 'decoy.foo is "changed"');

            await Decoy.commit(decoy);

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.equal(subject.foo, 'changed', 'subject.foo is "changed"');
            t.equal(decoy.foo, 'changed', 'decoy.foo is "changed"');

            t.end();
        });

        t.test(`nested property (onlyLastKeyMutation = ${onlyLastKeyMutation})`, async (t) => {
            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.equal(subject.nested.hello, 'world', 'subject.nested.hello is "world"');
            t.equal(decoy.nested.hello, 'world', 'decoy.nested.hello is "world"');

            decoy.nested.hello = 'changed';

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
            t.equal(subject.nested.hello, 'world', 'subject.nested.hello is "world"');
            t.equal(decoy.nested.hello, 'changed', 'decoy.nested.hello is "changed"');

            await Decoy.commit(decoy);

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.equal(subject.nested.hello, 'changed', 'subject.nested.hello is "changed"');
            t.equal(decoy.nested.hello, 'changed', 'decoy.nested.hello is "changed"');

            t.end();
        });

        t.test(`nested array (onlyLastKeyMutation = ${onlyLastKeyMutation})`, async (t) => {
            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.deepEqual(subject.arr, [1, 'b', { nested: 'foo' }], 'subject.arr is [1, "b", {nested:"foo"}]');
            t.deepEqual(decoy.arr, [1, 'b', { nested: 'foo' }], 'subject.arr is [1, "b", {nested:"foo"}]');

            decoy.arr[0] = 2;

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
            t.deepEqual(subject.arr, [1, 'b', { nested: 'foo' }], 'subject.arr is [1, "b", {nested:"foo"}]');
            t.deepEqual(decoy.arr, [2, 'b', { nested: 'foo' }], 'subject.arr is [2, "b", {nested:"foo"}]');

            await Decoy.commit(decoy);

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.deepEqual(subject.arr, [2, 'b', { nested: 'foo' }], 'subject.arr is [2, "b", {nested:"foo"}]');
            t.deepEqual(decoy.arr, [2, 'b', { nested: 'foo' }], 'subject.arr is [2, "b", {nested:"foo"}]');

            decoy.arr[1] = 'c';

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
            t.deepEqual(subject.arr, [2, 'b', { nested: 'foo' }], 'subject.arr is [2, "b", {nested:"foo"}]');
            t.deepEqual(decoy.arr, [2, 'c', { nested: 'foo' }], 'subject.arr is [2, "c", {nested:"foo"}]');

            await Decoy.commit(decoy);

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.deepEqual(subject.arr, [2, 'c', { nested: 'foo' }], 'subject.arr is [2, "c", {nested:"foo"}]');
            t.deepEqual(decoy.arr, [2, 'c', { nested: 'foo' }], 'subject.arr is [2, "c", {nested:"foo"}]');

            (<any>decoy.arr[2]).nested = 'changed';

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
            t.deepEqual(subject.arr, [2, 'c', { nested: 'foo' }], 'subject.arr is [2, "c", {nested:"foo"}]');
            t.deepEqual(decoy.arr, [2, 'c', { nested: 'changed' }], 'subject.arr is [2, "c", {nested:"changed"}]');

            await Decoy.commit(decoy);

            t.false(Decoy.hasMutations(subject), 'subject has no mutations');
            t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
            t.deepEqual(subject.arr, [2, 'c', { nested: 'changed' }], 'subject.arr is [2, "c", {nested:"changed"}]');
            t.deepEqual(decoy.arr, [2, 'c', { nested: 'changed' }], 'subject.arr is [2, "c", {nested:"changed"}]');

            t.end();
        });

        t.end();
    });
});

test('Domain/Decoy - checksum', (t) => {
    const one: { [key: string]: unknown } = Decoy.create({ zzz: 'aaa', rrr: 'sss', aaa: 'zzz' });
    const two: { [key: string]: unknown } = Decoy.create({ rrr: 'sss', aaa: 'zzz', zzz: 'aaa' });

    t.equal(one.aaa, 'zzz', 'one.aaa is "zzz"');
    t.equal(two.aaa, 'zzz', 'two.aaa is "zzz"');
    t.notEqual(JSON.stringify(one), JSON.stringify(two), 'the JSON output of one and two are different');
    t.equal(Decoy.checksum(one), Decoy.checksum(two), 'the checksum of one and two are equal');
    t.equal(Decoy.checksum(one), '5b0eb56cbe6f2e1c24ea2b3f7455344bdf8508fd85eb43cad72d3572f1302137', 'the checksum of one is the same as in Decoy v1.4.7');
    t.equal(Decoy.checksum(two), '5b0eb56cbe6f2e1c24ea2b3f7455344bdf8508fd85eb43cad72d3572f1302137', 'the checksum of two is the same as in Decoy v1.4.7');

    one.aaa = 'bbb';
    t.equal(one.aaa, 'bbb', 'one.aaa is "bbb"');
    t.equal(two.aaa, 'zzz', 'two.aaa is "zzz"');
    t.notEqual(JSON.stringify(one), JSON.stringify(two), 'the JSON output of one and two are different');
    t.notEqual(Decoy.checksum(one), Decoy.checksum(two), 'the checksum of one and two are different');
    t.equal(Decoy.checksum(one), 'f27621c5ce1fc87375d8d382979acf17975dd68c08e5406c840e3c1eb465c4f2', 'the checksum of one is the same as in Decoy v1.4.7');
    t.equal(Decoy.checksum(two), '5b0eb56cbe6f2e1c24ea2b3f7455344bdf8508fd85eb43cad72d3572f1302137', 'the checksum of two is the same as in Decoy v1.4.7');

    two.aaa = 'bbb';
    t.equal(one.aaa, 'bbb', 'one.aaa is "bbb"');
    t.equal(two.aaa, 'bbb', 'two.aaa is "bbb"');
    t.notEqual(JSON.stringify(one), JSON.stringify(two), 'the JSON output of one and two are different');
    t.equal(Decoy.checksum(one), Decoy.checksum(two), 'the checksum of one and two are equal');
    t.equal(Decoy.checksum(one), 'f27621c5ce1fc87375d8d382979acf17975dd68c08e5406c840e3c1eb465c4f2', 'the checksum of one is the same as in Decoy v1.4.7');
    t.equal(Decoy.checksum(two), 'f27621c5ce1fc87375d8d382979acf17975dd68c08e5406c840e3c1eb465c4f2', 'the checksum of two is the same as in Decoy v1.4.7');

    one.qqq = 'added';
    t.equal(one.qqq, 'added', 'one.qqq is "added"');
    t.equal(two.qqq, undefined, 'two.qqq is undefined');
    t.notEqual(JSON.stringify(one), JSON.stringify(two), 'the JSON output of one and two are different');
    t.notEqual(Decoy.checksum(one), Decoy.checksum(two), 'the checksum of one and two are different');
    t.equal(Decoy.checksum(one), 'e2711361ecbc88e20848631e767a0eed573eaebd800565d2dbf01c6b27dea5de', 'the checksum of one is the same as in Decoy v1.4.7');
    t.equal(Decoy.checksum(two), 'f27621c5ce1fc87375d8d382979acf17975dd68c08e5406c840e3c1eb465c4f2', 'the checksum of two is the same as in Decoy v1.4.7');

    two.qqq = 'different';
    t.equal(one.qqq, 'added', 'one.qqq is "added"');
    t.equal(two.qqq, 'different', 'two.qqq is "different"');
    t.notEqual(JSON.stringify(one), JSON.stringify(two), 'the JSON output of one and two are different');
    t.notEqual(Decoy.checksum(one), Decoy.checksum(two), 'the checksum of one and two are equal');
    t.equal(Decoy.checksum(one), 'e2711361ecbc88e20848631e767a0eed573eaebd800565d2dbf01c6b27dea5de', 'the checksum of one is the same as in Decoy v1.4.7');
    t.equal(Decoy.checksum(two), 'fce8e89b099fa146261db5cccd3362a0d1550fc37e3e3cb661cb1291ab42623e', 'the checksum of two is the same as in Decoy v1.4.7');

    two.qqq = 'added';
    t.equal(one.qqq, 'added', 'one.qqq is "added"');
    t.equal(two.qqq, 'added', 'two.qqq is "added"');
    t.notEqual(JSON.stringify(one), JSON.stringify(two), 'the JSON output of one and two are different');
    t.equal(Decoy.checksum(one), Decoy.checksum(two), 'the checksum of one and two are equal');
    t.equal(Decoy.checksum(one), 'e2711361ecbc88e20848631e767a0eed573eaebd800565d2dbf01c6b27dea5de', 'the checksum of one is the same as in Decoy v1.4.7');
    t.equal(Decoy.checksum(two), 'e2711361ecbc88e20848631e767a0eed573eaebd800565d2dbf01c6b27dea5de', 'the checksum of two is the same as in Decoy v1.4.7');

    one.aaa = { a: 'A', q: { c: 'C', a: 'A' }, z: 'Z' };
    two.aaa = { z: 'Z', a: 'A', q: { a: 'A', c: 'C' } };

    t.deepEqual(one.aaa, { a: 'A', q: { c: 'C', a: 'A' }, z: 'Z' }, 'one.aaa is { a: "A", q: { c: "C", a: "A" }, z: "Z" }');
    t.deepEqual(two.aaa, { z: 'Z', a: 'A', q: { a: 'A', c: 'C' } }, 'two.aaa is { z: "Z", a: "A", q: { a: "A", c: "C" } }');
    t.notEqual(JSON.stringify(one), JSON.stringify(two), 'the JSON output of one and two are different');
    console.log(JSON.stringify(one), JSON.stringify(two));
    t.equal(Decoy.checksum(one), Decoy.checksum(two), 'the checksum of one and two are equal');
    t.equal(Decoy.checksum(one), '1e724ecfa9d98e7bda3977e5deed2dcb5cc05e01e539ae21f796a4bc1cf1f9be', 'the checksum of one is the same as in Decoy v1.4.7');
    t.equal(Decoy.checksum(two), '1e724ecfa9d98e7bda3977e5deed2dcb5cc05e01e539ae21f796a4bc1cf1f9be', 'the checksum of two is the same as in Decoy v1.4.7');

    t.end();
});

test('Domain/Decoy - rollback', async (t) => {
    const subject = { aaa: 'aaa' };
    const decoy = Decoy.create<{ [key: string]: unknown }>(subject);

    t.equal(subject.aaa, 'aaa', 'subject.aaa is "aaa"');
    t.equal(decoy.aaa, 'aaa', 'subject.aaa is "aaa"');

    decoy.aaa = 'ZZZ';

    t.equal(subject.aaa, 'aaa', 'subject.aaa is "aaa"');
    t.equal(decoy.aaa, 'ZZZ', 'subject.aaa is "ZZZ"');

    await Decoy.rollback(decoy);

    t.equal(subject.aaa, 'aaa', 'subject.aaa is "aaa"');
    t.equal(decoy.aaa, 'aaa', 'subject.aaa is "aaa"');

    t.end();
});

test('Domain/Decoy - commit', async (t) => {
    const subject = { aaa: 'aaa' };
    const decoy = Decoy.create(subject);

    t.equal(subject.aaa, 'aaa', 'subject.aaa is "aaa"');
    t.equal(decoy.aaa, 'aaa', 'subject.aaa is "aaa"');

    decoy.aaa = 'ZZZ';

    t.equal(subject.aaa, 'aaa', 'subject.aaa is "aaa"');
    t.equal(decoy.aaa, 'ZZZ', 'subject.aaa is "ZZZ"');

    await Decoy.commit(decoy);

    t.equal(subject.aaa, 'ZZZ', 'subject.aaa is "ZZZ"');
    t.equal(decoy.aaa, 'ZZZ', 'subject.aaa is "ZZZ"');

    t.end();
});

test('Domain/Decoy - nested objects', (t) => {
    const subject = { bar: { baz: 'yes' } };
    const decoy = Decoy.create<any>(subject);

    t.test('Domain/Decoy - nested objects rollback', async (t) => {
        t.true(Decoy.isDecoy(decoy.bar), 'decoy.bar is a known Decoy');

        decoy.foo = { bar: { baz: { qux: 'yes' } } };

        t.true(Decoy.isDecoy(decoy.foo.bar.baz), 'decoy.foo.bar.baz is a known Decoy');
        t.true(Decoy.isDecoy(decoy.foo.bar), 'decoy.foo.bar is a known Decoy');
        t.true(Decoy.isDecoy(decoy.foo), 'decoy.foo is a known Decoy');

        decoy.bar.baz = 'no';

        t.deepEqual(subject, { bar: { baz: 'yes' } }, `subject is { bar: { baz: 'yes' }}`);
        t.deepEqual(decoy, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }, `decoy is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        const result = await Decoy.rollback(decoy);

        t.equal(result, subject, `rollback resolved the original subject`);
        t.deepEqual(subject, { bar: { baz: 'yes' } }, `subject is { bar: { baz: 'yes' }}`);
        t.deepEqual(decoy, { bar: { baz: 'yes' } }, `decoy is { bar: { baz: 'yes' }}`);
        t.false(Decoy.hasMutations(decoy), `decoy has no mutations`);

        decoy.bar.baz = 'no';

        t.deepEqual(subject, { bar: { baz: 'yes' } }, `subject is { bar: { baz: 'yes' }}`);
        t.deepEqual(decoy, { bar: { baz: 'no' } }, `subject is { bar: { baz: 'no' }}`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        const nested = await Decoy.rollback(decoy.bar);

        t.equal(nested, subject.bar, `commit resolved the original subject.bar`);
        t.deepEqual(subject, { bar: { baz: 'yes' } }, `subject is { bar: { baz: 'yes' }}`);
        t.deepEqual(decoy, { bar: { baz: 'yes' } }, `decoy is { bar: { baz: 'yes' }}`);
        t.false(Decoy.hasMutations(decoy), `decoy has no mutations`);

        t.end();
    });

    t.test('Domain/Decoy - nested objects commit', async (t) => {
        t.true(Decoy.isDecoy(decoy.bar), 'decoy.bar is a known Decoy');

        decoy.foo = { bar: { baz: { qux: 'yes' } } };

        t.true(Decoy.isDecoy(decoy.foo.bar.baz), 'decoy.foo.bar.baz is a known Decoy');
        t.true(Decoy.isDecoy(decoy.foo.bar), 'decoy.foo.bar is a known Decoy');
        t.true(Decoy.isDecoy(decoy.foo), 'decoy.foo is a known Decoy');

        decoy.bar.baz = 'no';

        t.deepEqual(subject, { bar: { baz: 'yes' } }, `subject is { bar: { baz: 'yes' }}`);
        t.deepEqual(decoy, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }, `decoy is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        const result = await Decoy.commit(decoy);

        t.equal(result, subject, `commit resolved the original subject`);
        t.deepEqual(subject, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }, `subject is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }`);
        t.deepEqual(decoy, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }, `decoy is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }`);
        t.false(Decoy.hasMutations(decoy), `decoy has no mutations`);

        decoy.bar.baz = 'yes';

        t.deepEqual(subject, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }, `subject is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'no' } }`);
        t.deepEqual(decoy, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'yes' } }, `decoy is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'yes' } }`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        const nested = await Decoy.commit(decoy.bar);

        t.equal(nested, subject.bar, `commit resolved the original subject.bar`);
        t.deepEqual(subject, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'yes' } }, `subject is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'yes' } }`);
        t.deepEqual(decoy, { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'yes' } }, `decoy is { foo: { bar: { baz: { qux: 'yes' } } }, bar: { baz: 'yes' } }`);
        t.false(Decoy.hasMutations(decoy), `decoy has no mutations`);

        t.end();
    });

    t.end();
});

test('Domain/Decoy - partial actions', async (t) => {
    const subject = { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } };
    const decoy = Decoy.create(subject, true);

    decoy.ones = 111;

    t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
    t.true(Decoy.hasMutations(decoy, 'ones'), 'decoy has mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.false(Decoy.hasMutations(decoy, 'nested'), 'decoy has no mutations on "nested"');
    t.false(Decoy.hasMutations(decoy.nested), 'decoy.nested has no mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 111, twos: 2, nested: { ones: 1, twos: 2 } }, 'decoy is { ones: 111, twos: 2, nested: { ones: 1, twos: 2 } }')

    decoy.ones = 1;

    t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.false(Decoy.hasMutations(decoy, 'nested'), 'decoy has no mutations on "nested"');
    t.false(Decoy.hasMutations(decoy.nested), 'decoy.nested has no mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }, 'decoy is { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }')

    decoy.twos = 222;

    t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.true(Decoy.hasMutations(decoy, 'twos'), 'decoy has mutations on "twos"');
    t.false(Decoy.hasMutations(decoy, 'nested'), 'decoy has no mutations on "nested"');
    t.false(Decoy.hasMutations(decoy.nested), 'decoy.nested has no mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')

    await Decoy.rollback(decoy, 'ones');

    t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.true(Decoy.hasMutations(decoy, 'twos'), 'decoy has mutations on "twos"');
    t.false(Decoy.hasMutations(decoy, 'nested'), 'decoy has no mutations on "nested"');
    t.false(Decoy.hasMutations(decoy.nested), 'decoy.nested has no mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')

    await Decoy.commit(decoy, 'twos', 'nested');

    t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.false(Decoy.hasMutations(decoy, 'nested'), 'decoy has no mutations on "nested"');
    t.false(Decoy.hasMutations(decoy.nested), 'decoy.nested has no mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')

    decoy.nested.ones = 111;

    t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.true(Decoy.hasMutations(decoy, 'nested'), 'decoy has mutations on "nested"');
    t.true(Decoy.hasMutations(decoy.nested), 'decoy.nested has mutations');
    t.true(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 111, twos: 2 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 111, twos: 2 } }')

    await Decoy.rollback(decoy, 'nested');

    t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.false(Decoy.hasMutations(decoy, 'nested'), 'decoy has no mutations on "nested"');
    t.false(Decoy.hasMutations(decoy.nested), 'decoy.nested has no mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')

    decoy.nested.twos = 222;

    t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.true(Decoy.hasMutations(decoy, 'nested'), 'decoy has mutations on "nested"');
    t.true(Decoy.hasMutations(decoy.nested), 'decoy.nested has mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.true(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }')

    await Decoy.commit(decoy, 'ones', 'twos');

    t.true(Decoy.hasMutations(decoy), 'decoy has mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.true(Decoy.hasMutations(decoy, 'nested'), 'decoy has mutations on "nested"');
    t.true(Decoy.hasMutations(decoy.nested), 'decoy.nested has mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.true(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }, 'subject is { ones: 1, twos: 222, nested: { ones: 1, twos: 2 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }')

    await Decoy.commit(decoy, 'nested');

    t.false(Decoy.hasMutations(decoy), 'decoy has no mutations');
    t.false(Decoy.hasMutations(decoy, 'ones'), 'decoy has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy, 'twos'), 'decoy has no mutations on "twos"');
    t.false(Decoy.hasMutations(decoy, 'nested'), 'decoy has no mutations on "nested"');
    t.false(Decoy.hasMutations(decoy.nested), 'decoy.nested has no mutations');
    t.false(Decoy.hasMutations(decoy.nested, 'ones'), 'decoy.nested has no mutations on "ones"');
    t.false(Decoy.hasMutations(decoy.nested, 'twos'), 'decoy.nested has no mutations on "twos"');
    t.deepEqual(subject, { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }, 'subject is { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }')
    t.deepEqual(decoy, { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }, 'decoy is { ones: 1, twos: 222, nested: { ones: 1, twos: 222 } }')

    t.end();
});

test('Domain/Decoy - Arrays', (t) => {
    const subject = { arr: [] };
    const decoy = Decoy.create<{ arr: Array<unknown> }>(subject);

    t.test('Domain/Decoy - Array rollback', async (t) => {
        decoy.arr.push('hello', 'world');

        t.equal(subject.arr.length, 0, `subject.arr has length 0`);
        t.deepEqual(subject.arr, [], `subject.arr is []`);
        t.equal(decoy.arr.length, 2, `decoy.arr has length 2`);
        t.deepEqual(decoy.arr, ['hello', 'world'], `decoy.arr is ['hello', 'world']`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        decoy.arr.push('yoda', decoy.arr.shift());

        t.equal(subject.arr.length, 0, `subject.arr has length 0`);
        t.deepEqual(subject.arr, [], `subject.arr is []`);
        t.equal(decoy.arr.length, 3, `decoy.arr has length 3`);
        t.deepEqual(decoy.arr, ['world', 'yoda', 'hello'], `decoy.arr is ['world', 'yoda', 'hello']`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        decoy.arr.sort((a: any, b: any) => a < b ? -1 : Number(a > b));

        t.equal(subject.arr.length, 0, `subject.arr has length 0`);
        t.deepEqual(subject.arr, [], `subject.arr is []`);
        t.equal(decoy.arr.length, 3, `decoy.arr has length 3`);
        t.deepEqual(decoy.arr, ['hello', 'world', 'yoda'], `decoy.arr is ['hello', 'world', 'yoda']`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        const result = await Decoy.rollback(decoy);

        t.equal(result, subject, `rollback resolved the original subject`);
        t.equal(subject.arr.length, 0, `subject.arr has length 0`);
        t.deepEqual(subject.arr, [], `subject.arr is []`);
        t.equal(decoy.arr.length, 0, `decoy.arr has length 0`);
        t.deepEqual(decoy.arr, [], `decoy.arr is []`);
        t.false(Decoy.hasMutations(decoy), `decoy has no mutations`);

        t.end();
    });

    t.test('Domain/Decoy - Array commit', async (t) => {
        decoy.arr.push('hello', 'world');

        t.equal(subject.arr.length, 0, `subject.arr has length 0`);
        t.deepEqual(subject.arr, [], `subject.arr is []`);
        t.equal(decoy.arr.length, 2, `decoy.arr has length 2`);
        t.deepEqual(decoy.arr, ['hello', 'world'], `decoy.arr is ['hello', 'world']`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        decoy.arr.splice(1, 0, 'wonderful');

        t.equal(subject.arr.length, 0, `subject.arr has length 0`);
        t.deepEqual(subject.arr, [], `subject.arr is []`);
        t.equal(decoy.arr.length, 3, `decoy.arr has length 3`);
        t.deepEqual(decoy.arr, ['hello', 'wonderful', 'world'], `decoy.arr is ['hello', 'wonderful', 'world']`);
        t.true(Decoy.hasMutations(decoy), `decoy has mutations`);

        const result = await Decoy.commit(decoy);

        t.equal(result, subject, `commit resolved the original subject`);
        t.equal(subject.arr.length, 3, `subject.arr has length 3`);
        t.deepEqual(subject.arr, ['hello', 'wonderful', 'world'], `subject.arr is ['hello', 'wonderful', 'world']`);
        t.equal(decoy.arr.length, 3, `decoy.arr has length 3`);
        t.deepEqual(decoy.arr, ['hello', 'wonderful', 'world'], `decoy.arr is ['hello', 'wonderful', 'world']`);
        t.false(Decoy.hasMutations(decoy), `decoy has no mutations`);

        t.end();
    });

    t.end();
});

test('Domain/Decoy - Errors', (t) => {
    const pattern = /Not a known Decoy/;
    const original = { foo: { bar: { baz: 'qux' } } };
    const decoy = Decoy.create(original);

    //  ensure there are internal "links" to sub-decoys
    t.equal(decoy.foo.bar.baz, 'qux', `decoy.foo.bar.baz is 'qux'`);

    t.test('Domain/Decoy - Errors commit', async (t) => {
        try {
            await Decoy.commit(original);
            t.fail('commit on original should throw an Error');
        }
        catch (error) {
            t.true(pattern.test(error.message), 'commit on original rejects with Error "Not a known Decoy"');
        }

        t.end();
    })

    t.test('Domain/Decoy - Errors rollback', async (t) => {
        try {
            await Decoy.rollback(original);
            t.fail('rollback on original should throw an Error');
        }
        catch (error) {
            t.true(pattern.test(error.message), 'rollback on original rejects with Error "Not a known Decoy"');
        }
        t.end();
    })

    t.test('Domain/Decoy - Errors purge', async (t) => {
        try {
            await Decoy.purge(original);
            t.fail('purge on original should throw an Error');
        }
        catch (error) {
            t.true(pattern.test(error.message), 'purge on original rejects with Error "Not a known Decoy"');
        }

        await Decoy.purge(decoy);

        try {
            await Decoy.commit(original);
            t.fail('commit on purged decoy should throw an Error');
        }
        catch (error) {
            t.true(pattern.test(error.message), 'commit on purged decoy rejects with Error "Not a known Decoy"');
        }

        t.end();
    })

    t.end();
});
