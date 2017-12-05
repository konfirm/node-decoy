/* global source, describe, it, expect */

const Decoy = source('decoy');

describe('Decoy', () => {
	it('creates a decoy', (next) => {
		const subject = { foo: 'bar' };
		const decoy = Decoy.create(subject);

		//  we're one
		expect(JSON.stringify(decoy)).to.equal(JSON.stringify(subject));
		expect(decoy.constructor).to.equal(subject.constructor);
		expect(decoy.constructor.name).to.equal(subject.constructor.name);
		expect(decoy).to.equal(subject);

		//  but we're not the same
		expect(decoy).not.to.shallow.equal(subject);

		next();
	});

	it('reflects changes on the decoy', (next) => {
		const subject = { foo: 'bar' };
		const decoy = Decoy.create(subject);

		decoy.foo = 'changed';
		expect(decoy.foo).to.equal('changed');
		expect(subject.foo).to.equal('bar');

		expect(JSON.stringify(decoy)).to.equal('{"foo":"changed"}');
		expect(JSON.stringify(subject)).to.equal('{"foo":"bar"}');

		next();
	});

	it('calculates consistent checksums', (next) => {
		const one = Decoy.create({ zzz: 'aaa', rrr: 'sss', aaa: 'zzz' });
		const two = Decoy.create({ rrr: 'sss', aaa: 'zzz', zzz: 'aaa' });

		expect(JSON.stringify(one)).not.to.equal(JSON.stringify(two));
		expect(Decoy.checksum(one)).to.equal(Decoy.checksum(two));

		one.aaa = 'bbb';
		expect(one.aaa).to.equal('bbb');
		expect(one.aaa).not.to.equal(two.aaa);
		expect(Decoy.checksum(one)).not.to.equal(Decoy.checksum(two));

		two.aaa = 'bbb';
		expect(two.aaa).to.equal('bbb');
		expect(two.aaa).to.equal(one.aaa);
		expect(Decoy.checksum(one)).to.equal(Decoy.checksum(two));

		one.qqq = 'added';
		expect(one.qqq).to.equal('added');
		expect(one.qqq).not.to.equal(two.qqq);
		expect(Decoy.checksum(one)).not.to.equal(Decoy.checksum(two));

		two.qqq = 'different';
		expect(two.qqq).to.equal('different');
		expect(two.qqq).not.to.equal(one.qqq);
		expect(Decoy.checksum(one)).not.to.equal(Decoy.checksum(two));

		two.qqq = 'added';
		expect(two.qqq).to.equal('added');
		expect(two.qqq).to.equal(one.qqq);
		expect(Decoy.checksum(one)).to.equal(Decoy.checksum(two));

		one.aaa = { a: 'A', q: { c: 'C', a: 'A' }, z: 'Z' };
		two.aaa = { z: 'Z', a: 'A', q: { a: 'A', c: 'C' } };

		expect(Decoy.checksum(one)).to.equal(Decoy.checksum(two));

		next();
	});

	it('rolls back all mutations', (next) => {
		const subject = { aaa: 'aaa' };
		const decoy = Decoy.create(subject);

		expect(subject.aaa).to.equal('aaa');
		expect(decoy.aaa).to.equal('aaa');

		decoy.aaa = 'ZZZ';

		expect(subject.aaa).to.equal('aaa');
		expect(decoy.aaa).to.equal('ZZZ');

		Decoy.rollback(decoy);

		expect(subject.aaa).to.equal('aaa');
		expect(decoy.aaa).to.equal('aaa');

		next();
	});

	it('commits all mutations', (next) => {
		const subject = { aaa: 'aaa' };
		const decoy = Decoy.create(subject);

		expect(subject.aaa).to.equal('aaa');
		expect(decoy.aaa).to.equal('aaa');

		decoy.aaa = 'ZZZ';

		expect(subject.aaa).to.equal('aaa');
		expect(decoy.aaa).to.equal('ZZZ');

		Decoy.commit(decoy);

		expect(subject.aaa).to.equal('ZZZ');
		expect(decoy.aaa).to.equal('ZZZ');

		next();
	});

	describe('Nested objects', () => {
		it('can commit', (next) => {
			const subject = {};
			const decoy = Decoy.create(subject);

			decoy.foo = { bar: { baz: { qux: 'yes' } } };
			expect(Decoy.isDecoy(decoy.foo.bar.baz)).to.be.true();
			expect(Decoy.isDecoy(decoy.foo.bar)).to.be.true();
			expect(Decoy.isDecoy(decoy.foo)).to.be.true();

			expect(subject).to.equal({});

			Decoy.commit(decoy);

			expect(subject).to.equal({ foo: { bar: { baz: { qux: 'yes' } } } });

			Decoy.rollback(decoy);

			expect(subject).to.equal({ foo: { bar: { baz: { qux: 'yes' } } } });

			next();
		});

		it('can roll back', (next) => {
			const subject = {};
			const decoy = Decoy.create(subject);

			decoy.foo = { bar: { baz: { qux: 'yes' } } };
			expect(Decoy.isDecoy(decoy.foo.bar.baz)).to.be.true();
			expect(Decoy.isDecoy(decoy.foo.bar)).to.be.true();
			expect(Decoy.isDecoy(decoy.foo)).to.be.true();

			expect(subject).to.equal({});

			Decoy.rollback(decoy);

			expect(subject).to.equal({});

			Decoy.commit(decoy);

			expect(subject).to.equal({});

			next();
		});
	});

	describe('Arrays', () => {
		const subject = { arr: [] };
		const decoy = Decoy.create(subject);

		it('does not modify the source', (next) => {
			decoy.arr.push('hello', 'world');

			expect(decoy.arr).to.be.length(2);
			expect(decoy.arr).to.equal([ 'hello', 'world' ]);
			expect(subject.arr).to.be.length(0);
			expect(subject.arr).to.equal([]);

			Decoy.commit(decoy);

			expect(decoy.arr).to.be.length(2);
			expect(decoy.arr).to.equal([ 'hello', 'world' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			decoy.arr.push('yoda', decoy.arr.shift());

			expect(decoy.arr).to.be.length(3);
			expect(decoy.arr).to.equal([ 'world', 'yoda', 'hello' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			Decoy.rollback(decoy);

			expect(decoy.arr).to.be.length(2);
			expect(decoy.arr).to.equal([ 'hello', 'world' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			decoy.arr.splice(1, 0, 'wonderful');

			expect(decoy.arr).to.be.length(3);
			expect(decoy.arr).to.equal([ 'hello', 'wonderful', 'world' ]);
			expect(subject.arr).to.be.length(2);
			expect(subject.arr).to.equal([ 'hello', 'world' ]);

			Decoy.commit(decoy);

			expect(decoy.arr).to.be.length(3);
			expect(decoy.arr).to.equal([ 'hello', 'wonderful', 'world' ]);
			expect(subject.arr).to.be.length(3);
			expect(subject.arr).to.equal([ 'hello', 'wonderful', 'world' ]);

			next();
		});
	});

	it('throws if the proxy is not a known decoy', (next) => {
		const subject = { aaa: 'aaa' };
		const decoy = Decoy.create(subject);

		expect(() => Decoy.commit(subject)).to.throw(Error, /^Not a known Decoy/);
		expect(() => Decoy.commit(decoy)).not.to.throw();

		expect(() => Decoy.rollback(subject)).to.throw(Error, /^Not a known Decoy/);
		expect(() => Decoy.rollback(decoy)).not.to.throw();

		expect(() => Decoy.purge(subject)).to.throw(Error, /^Not a known Decoy/);
		expect(() => Decoy.purge(decoy)).not.to.throw();

		expect(() => Decoy.commit(decoy)).to.throw(Error, /^Not a known Decoy/);
		expect(() => Decoy.rollback(decoy)).to.throw(Error, /^Not a known Decoy/);
		expect(() => Decoy.purge(decoy)).to.throw(Error, /^Not a known Decoy/);

		next();
	});
});
