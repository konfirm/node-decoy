import test from 'tape';
import { create, commit, hasMutations, isDecoy, rollback, purge } from '../source/main';

test('README samples - usage', async (t) => {
	//  require Decoy
	// import { create, commit } from '@konfirm/decoy';
	//  create the original object
	const original = { foo: 'bar', baz: { hello: 'world' } };
	//  create the decoy dummy
	const dummy = create(original);

	t.equal((dummy.foo), 'bar');
	t.equal((original.foo), 'bar');

	dummy.foo = 'I pity the foo!';

	t.equal((dummy.foo), 'I pity the foo!');
	t.equal((original.foo), 'bar');

	const result = await commit(dummy);
	t.equal(result, original);

	t.equal((dummy.foo), 'I pity the foo!');
	t.equal((original.foo), 'I pity the foo!');

	t.end();
});

test('README samples - create', (t) => {
	// import { create } from '@konfirm/decoy';
	const original = { hello: 'world' };
	const dummy = create(original);

	dummy.hello = 'universe';

	t.equal(dummy.hello, 'universe');
	t.equal(original.hello, 'world');

	t.end();
});

test('README samples - create - only last change', (t) => {
	// import { create, hasMutations } from '@konfirm/decoy';
	const original = { hello: 'world' };
	const dummy = create(original, true);

	t.false(hasMutations(dummy), 'dummy has no mutations');
	t.equal(dummy.hello, 'world', 'dummy.hello is "world"');

	dummy.hello = 'universe';

	t.true(hasMutations(dummy), 'dummy has mutations');
	t.equal(dummy.hello, 'universe', 'dummy.hello is "universe"');

	dummy.hello = 'world';

	t.false(hasMutations(dummy), 'dummy has no mutations');
	t.equal(dummy.hello, 'world', 'dummy.hello is "world" (restored)');

	t.end();
});

test('README samples - isDecoy', (t) => {
	// import { create, isDecoy } from '@konfirm/decoy';
	const original = { hello: 'world' };
	const dummy = create(original);

	t.true(isDecoy(dummy), 'dummy is a Decoy');
	t.false(isDecoy(original), 'original is not a Decoy');

	t.end();
});

test('README samples - hasMutations', async (t) => {
	// import { create, hasMutations, rollback } from '@konfirm/decoy';
	const original = { hello: 'world' };
	const dummy = create(original);

	t.false(hasMutations(dummy), 'dummy has no mutations');

	dummy.hello = 'universe';

	t.true(hasMutations(dummy), 'dummy has mutations');

	await rollback(dummy);

	t.false(hasMutations(dummy), 'dummy has no mutations');

	t.end();
});

test('README samples - partial hasMutations', (t) => {
	// import { create, hasMutations } from '@konfirm/decoy';

	const subject = { ones: 1, twos: 2, nested: { ones: 1, twos: 2 } };
	const dummy = create(subject);

	dummy.ones = 11;
	dummy.nested.twos = 22;

	t.true(hasMutations(dummy), 'dummy has mutations');
	t.true(hasMutations(dummy, 'ones'), 'dummy has mutations on "ones"');
	t.false(hasMutations(dummy, 'twos'), 'dummy has no mutations on "twos"');
	t.true(hasMutations(dummy.nested), 'dummy.nested has mutations');
	t.false(hasMutations(dummy.nested, 'ones'), 'dummy.nested has no mutations on "ones"');
	t.true(hasMutations(dummy.nested, 'twos'), 'dummy.nested has mutations on "twos"');

	t.end();
});

test('README samples - commit', async (t) => {
	// import { create, commit } from '@konfirm/decoy';
	const original = { hello: 'world' };
	const dummy = create(original);

	dummy.hello = 'universe';

	t.equal(dummy.hello, 'universe', 'dummy.hello is "universe"');
	t.equal(original.hello, 'world', 'original.hello is "world"');

	const result = await commit(dummy)
	t.equal(result, original), 'result is the original';

	t.equal(dummy.hello, 'universe', 'dummy.hello is "universe"');
	t.equal(original.hello, 'universe', 'original.hello is "universe"');

	//  try to commit the original, resulting in an error
	try {
		await commit(original);
		t.fail('commit on original should throw an Error');
	}
	catch (error) {
		t.true(/Not a known Decoy/.test(error.message), 'commit on original rejects with Error "Not a known Decoy"');
	}

	t.end();
});

test('README samples - partial commit', async (t) => {
	// import { create, commit } from '@konfirm/decoy';

	const original = { hello: 'world', nested: { hello: 'world' } };
	const dummy = create(original);

	dummy.hello = 'universe';
	dummy.nested.hello = 'universe';

	const result = await commit(dummy, 'nested')

	t.equal(result === original, true);
	t.equal(dummy.nested.hello, 'universe');
	t.equal(original.nested.hello, 'universe');
	t.equal(dummy.hello, 'universe');
	t.equal(original.hello, 'world');

	t.end();
});

test('README samples - rollback', async (t) => {
	// import { create, rollback } from '@konfirm/decoy';
	const original = { hello: 'world' };
	const dummy = create(original);

	dummy.hello = 'universe';

	t.equal(dummy.hello, 'universe', 'dummy.hello is "universe"');
	t.equal(original.hello, 'world', 'original.hello is "world"');

	const result = await rollback(dummy);
	t.equal(result, original, 'rollback result is the original');

	t.equal(dummy.hello, 'world', 'dummy.hello is "world"');
	t.equal(original.hello, 'world', 'original.hello is "world"');

	//  try to roll back the original, resulting in an error
	try {
		await rollback(original);
		t.fail('rollback on original should throw an Error');
	}
	catch (error) {
		t.true(/Not a known Decoy/.test(error.message), 'rollback on original rejects with Error "Not a known Decoy"');
	}
});

test('README samples - partial rollback', async (t) => {
	// import { create, rollback } from '@konfirm/decoy';

	const original = { hello: 'world', nested: { hello: 'world' } };
	const dummy = create(original);

	dummy.hello = 'universe';
	dummy.nested.hello = 'universe';

	const result = await rollback(dummy, 'nested')

	t.equal(result === original, true);
	t.equal(dummy.nested.hello, 'world');
	t.equal(original.nested.hello, 'world');
	t.equal(dummy.hello, 'universe');
	t.equal(original.hello, 'world');

	t.end();
});

test('README samples - purge', async (t) => {
	// import { create, purge } from '@konfirm/decoy';
	const original = { hello: 'world' };
	const dummy = create(original);

	dummy.hello = 'universe';

	const result = await purge(dummy);

	t.equal(result, original, 'purge result is the original');
	t.equal(original.hello, 'world', 'original.hello is "world"');

	//  try to purge the original, resulting in an error
	try {
		await purge(original);
		t.fail('purge on original should throw an Error');
	}
	catch (error) {
		t.true(/Not a known Decoy/.test(error.message), 'purge on original rejects with Error "Not a known Decoy"');
	}

	try {
		await purge(dummy);
		t.fail('purge on purged dummy should throw an Error');
	}
	catch (error) {
		t.true(/Not a known Decoy/.test(error.message), 'purge on purged dummy rejects with Error "Not a known Decoy"');
	}

	t.end();
});
