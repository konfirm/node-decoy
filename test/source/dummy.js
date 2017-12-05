/* global source, describe, it, expect */

const Dummy = source('dummy');

describe('Dummy', () => {
	const Named = require('../subject/named');

	it('creates a dummy', (next) => {
		const subject = { foo: 'bar' };
		const dummy = Dummy.create(subject);

		//  we're one
		expect(JSON.stringify(dummy)).to.equal(JSON.stringify(subject));
		expect(dummy.constructor).to.equal(subject.constructor);
		expect(dummy.constructor.name).to.equal(subject.constructor.name);
		expect(dummy).to.equal(subject);

		//  but we're not the same
		expect(dummy).not.to.shallow.equal(subject);

		next();
	});

	it('reflects changes on the dummy', (next) => {
		const subject = { foo: 'bar' };
		const dummy = Dummy.create(subject);

		dummy.foo = 'changed';
		expect(dummy.foo).to.equal('changed');
		expect(subject.foo).to.equal('bar');

		expect(JSON.stringify(dummy)).to.equal('{"foo":"changed"}');
		expect(JSON.stringify(subject)).to.equal('{"foo":"bar"}');

		next();
	});

	it('calculates consistent checksums', (next) => {
		const one = Dummy.create({ zzz: 'aaa', rrr: 'sss', aaa: 'zzz' });
		const two = Dummy.create({ rrr: 'sss', aaa: 'zzz', zzz: 'aaa' });

		expect(JSON.stringify(one)).not.to.equal(JSON.stringify(two));
		expect(Dummy.checksum(one)).to.equal(Dummy.checksum(two));

		one.aaa = 'bbb';
		expect(one.aaa).to.equal('bbb');
		expect(one.aaa).not.to.equal(two.aaa);
		expect(Dummy.checksum(one)).not.to.equal(Dummy.checksum(two));

		two.aaa = 'bbb';
		expect(two.aaa).to.equal('bbb');
		expect(two.aaa).to.equal(one.aaa);
		expect(Dummy.checksum(one)).to.equal(Dummy.checksum(two));

		one.qqq = 'added';
		expect(one.qqq).to.equal('added');
		expect(one.qqq).not.to.equal(two.qqq);
		expect(Dummy.checksum(one)).not.to.equal(Dummy.checksum(two));

		two.qqq = 'different';
		expect(two.qqq).to.equal('different');
		expect(two.qqq).not.to.equal(one.qqq);
		expect(Dummy.checksum(one)).not.to.equal(Dummy.checksum(two));

		two.qqq = 'added';
		expect(two.qqq).to.equal('added');
		expect(two.qqq).to.equal(one.qqq);
		expect(Dummy.checksum(one)).to.equal(Dummy.checksum(two));

		one.aaa = { a: 'A', q: { c: 'C', a: 'A' }, z: 'Z' };
		two.aaa = { z: 'Z', a: 'A', q: { a: 'A', c: 'C' } };

		expect(Dummy.checksum(one)).to.equal(Dummy.checksum(two));

		next();
	});

	it('rolls back all mutations', (next) => {
		const subject = { aaa: 'aaa' };
		const dummy = Dummy.create(subject);

		expect(subject.aaa).to.equal('aaa');
		expect(dummy.aaa).to.equal('aaa');

		dummy.aaa = 'ZZZ';

		expect(subject.aaa).to.equal('aaa');
		expect(dummy.aaa).to.equal('ZZZ');

		Dummy.rollback(dummy);

		expect(subject.aaa).to.equal('aaa');
		expect(dummy.aaa).to.equal('aaa');

		next();
	});

	it('commits all mutations', (next) => {
		const subject = { aaa: 'aaa' };
		const dummy = Dummy.create(subject);

		expect(subject.aaa).to.equal('aaa');
		expect(dummy.aaa).to.equal('aaa');

		dummy.aaa = 'ZZZ';

		expect(subject.aaa).to.equal('aaa');
		expect(dummy.aaa).to.equal('ZZZ');

		Dummy.commit(dummy);

		expect(subject.aaa).to.equal('ZZZ');
		expect(dummy.aaa).to.equal('ZZZ');

		next();
	});

	describe('Nested objects', () => {
		it('can commit', (next) => {
			const subject = {};
			const dummy = Dummy.create(subject);

			dummy.foo = { bar: { baz: { qux: 'yes' } } };
			expect(Dummy.isDummy(dummy.foo.bar.baz)).to.be.true();
			expect(Dummy.isDummy(dummy.foo.bar)).to.be.true();
			expect(Dummy.isDummy(dummy.foo)).to.be.true();

			expect(subject).to.equal({});

			Dummy.commit(dummy);

			expect(subject).to.equal({ foo: { bar: { baz: { qux: 'yes' } } } });

			Dummy.rollback(dummy);

			expect(subject).to.equal({ foo: { bar: { baz: { qux: 'yes' } } } });

			next();
		});

		it('can roll back', (next) => {
			const subject = {};
			const dummy = Dummy.create(subject);

			dummy.foo = { bar: { baz: { qux: 'yes' } } };
			expect(Dummy.isDummy(dummy.foo.bar.baz)).to.be.true();
			expect(Dummy.isDummy(dummy.foo.bar)).to.be.true();
			expect(Dummy.isDummy(dummy.foo)).to.be.true();

			expect(subject).to.equal({});

			Dummy.rollback(dummy);

			expect(subject).to.equal({});

			Dummy.commit(dummy);

			expect(subject).to.equal({});

			next();
		});
	});

	describe('Arrays', () => {
		const subject = { arr: [] };
		const dummy = Dummy.create(subject);

		it('does not modify the source', (next) => {
			dummy.arr.push('hello', 'world');

			expect(dummy.arr).to.be.length(2);
			expect(dummy.arr).to.equal([ 'hello', 'world' ]);
			expect(subject.arr).to.be.length(0);
			expect(subject.arr).to.equal([]);

			Dummy.commit(dummy);

			expect(dummy.arr).to.be.length(2);
			expect(dummy.arr).to.equal([ 'hello', 'world' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			dummy.arr.push('yoda', dummy.arr.shift());

			expect(dummy.arr).to.be.length(3);
			expect(dummy.arr).to.equal([ 'world', 'yoda', 'hello' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			Dummy.rollback(dummy);

			expect(dummy.arr).to.be.length(2);
			expect(dummy.arr).to.equal([ 'hello', 'world' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			dummy.arr.splice(1, 0, 'wonderful');

			expect(dummy.arr).to.be.length(3);
			expect(dummy.arr).to.equal([ 'hello', 'wonderful', 'world' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			Dummy.commit(dummy);

			expect(dummy.arr).to.be.length(3);
			expect(dummy.arr).to.equal([ 'hello', 'wonderful', 'world' ]);
			expect(subject.arr).to.be.length(3);
			expect(subject.arr).to.equal([ 'hello', 'wonderful', 'world' ]);

			next();
		});
	});

	it('throws if the proxy is not a known dummy', (next) => {
		const subject = { aaa: 'aaa' };
		const dummy = Dummy.create(subject);

		expect(() => Dummy.commit(subject)).to.throw(Error, /^Not a known Dummy/);
		expect(() => Dummy.commit(dummy)).not.to.throw();

		expect(() => Dummy.rollback(subject)).to.throw(Error, /^Not a known Dummy/);
		expect(() => Dummy.rollback(dummy)).not.to.throw();

		expect(() => Dummy.purge(subject)).to.throw(Error, /^Not a known Dummy/);
		expect(() => Dummy.purge(dummy)).not.to.throw();

		expect(() => Dummy.commit(dummy)).to.throw(Error, /^Not a known Dummy/);
		expect(() => Dummy.rollback(dummy)).to.throw(Error, /^Not a known Dummy/);
		expect(() => Dummy.purge(dummy)).to.throw(Error, /^Not a known Dummy/);

		next();
	});
});
