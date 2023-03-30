import test from 'tape';
import * as main from '../source/main';

test('main - exports', (t) => {
    const expect = ['create', 'checksum', 'isDecoy', 'purge', 'commit', 'rollback', 'hasMutations'];
    const actual = Object.keys(main);

    t.deepEqual(actual, expect, `exports ${expect.join(', ')}`)
    actual.forEach((key) => {
        t.equal(typeof main[key], 'function', `${key} is a function`);
    });

    t.end();
});
