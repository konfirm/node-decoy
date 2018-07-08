/* global source, describe, it, expect */

const Decoy = source('decoy');
const Custom = require('../extra/custom.js');

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

	describe('allows primitive comparison', () => {
		it('compares Dates', (next) => {
			const one = Decoy.create(new Date('2001'));
			const two = Decoy.create(new Date('2002'));

			expect(one < two).to.be.true();
			expect(two < one).to.be.false();

			next();
		});

		it('compares custom object implementing Symbol.toPrimitive', (next) => {
			const one = Decoy.create(new Custom('foo'));
			const two = Decoy.create(new Custom('bar'));

			expect(one > two).to.be.true();
			expect(two > one).to.be.false();

			next();
		});
	});

	describe('determine if there are mutations', () => {
		const subject = { foo: 'bar', arr: [ 1, 'b', { nested: 'foo' } ], nested: { hello: 'world' } };
		const decoy = Decoy.create(subject);

		it('shallow', (next) => {
			expect(Decoy.hasMutations(subject)).to.be.false();
			expect(Decoy.hasMutations(decoy)).to.be.false();

			decoy.foo = 'changed';

			expect(Decoy.hasMutations(decoy)).to.be.true();

			Decoy.commit(decoy)
				.then(() => {
					expect(Decoy.hasMutations(decoy)).to.be.false();

					next();
				});
		});

		it('nested', (next) => {
			expect(Decoy.hasMutations(decoy)).to.be.false();

			decoy.nested.hello = 'changed';

			expect(Decoy.hasMutations(decoy)).to.be.true();

			Decoy.commit(decoy)
				.then(() => {
					expect(Decoy.hasMutations(decoy)).to.be.false();

					next();
				});
		});

		it('array', (next) => {
			expect(Decoy.hasMutations(decoy)).to.be.false();

			decoy.arr[0] = 2;
			decoy.arr[1] = 'c';
			decoy.arr[2].nested = 'changed';

			expect(Decoy.hasMutations(decoy)).to.be.true();

			Decoy.commit(decoy)
				.then(() => {
					expect(Decoy.hasMutations(decoy)).to.be.false();

					next();
				});
		});
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

		Decoy.rollback(decoy)
			.then((result) => {
				expect(result).to.shallow.equal(subject);

				expect(subject.aaa).to.equal('aaa');
				expect(decoy.aaa).to.equal('aaa');

				next();
			});
	});

	it('commits all mutations', (next) => {
		const subject = { aaa: 'aaa' };
		const decoy = Decoy.create(subject);

		expect(subject.aaa).to.equal('aaa');
		expect(decoy.aaa).to.equal('aaa');

		decoy.aaa = 'ZZZ';

		expect(subject.aaa).to.equal('aaa');
		expect(decoy.aaa).to.equal('ZZZ');

		Decoy.commit(decoy)
			.then((result) => {
				expect(result).to.shallow.equal(subject);

				expect(subject.aaa).to.equal('ZZZ');
				expect(decoy.aaa).to.equal('ZZZ');

				next();
			});
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

			Decoy.commit(decoy)
				.then((result) => {
					expect(result).to.shallow.equal(subject);

					expect(subject).to.equal({ foo: { bar: { baz: { qux: 'yes' } } } });

					next();
				});
		});

		it('can roll back', (next) => {
			const subject = {};
			const decoy = Decoy.create(subject);

			decoy.foo = { bar: { baz: { qux: 'yes' } } };
			expect(Decoy.isDecoy(decoy.foo.bar.baz)).to.be.true();
			expect(Decoy.isDecoy(decoy.foo.bar)).to.be.true();
			expect(Decoy.isDecoy(decoy.foo)).to.be.true();

			expect(subject).to.equal({});

			Decoy.rollback(decoy)
				.then((result) => {
					expect(result).to.shallow.equal(subject);

					expect(subject).to.equal({});

					next();
				});
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

			Decoy.commit(decoy)
				.then((result) => {
					expect(result).to.shallow.equal(subject);

					expect(decoy.arr).to.be.length(2);
					expect(decoy.arr).to.equal([ 'hello', 'world' ]);
					expect(subject.arr).to.be.length(2);
					expect(subject.arr).to.equal([ 'hello', 'world' ]);

					decoy.arr.push('yoda', decoy.arr.shift());

					expect(decoy.arr).to.be.length(3);
					expect(decoy.arr).to.equal([ 'world', 'yoda', 'hello' ]);
					expect(subject.arr).to.be.length(2);
					expect(subject.arr).to.equal([ 'hello', 'world' ]);

					return Decoy.rollback(decoy);
				})
				.then((result) => {
					expect(result).to.shallow.equal(subject);

					expect(decoy.arr).to.be.length(2);
					expect(decoy.arr).to.equal([ 'hello', 'world' ]);
					expect(subject.arr).to.be.length(2);
					expect(subject.arr).to.equal([ 'hello', 'world' ]);

					decoy.arr.splice(1, 0, 'wonderful');

					expect(decoy.arr).to.be.length(3);
					expect(decoy.arr).to.equal([ 'hello', 'wonderful', 'world' ]);
					expect(subject.arr).to.be.length(2);
					expect(subject.arr).to.equal([ 'hello', 'world' ]);

					return Decoy.commit(decoy);
				})
				.then((result) => {
					expect(result).to.shallow.equal(subject);

					expect(decoy.arr).to.be.length(3);
					expect(decoy.arr).to.equal([ 'hello', 'wonderful', 'world' ]);
					expect(subject.arr).to.be.length(3);
					expect(subject.arr).to.equal([ 'hello', 'wonderful', 'world' ]);

					next();
				});
		});
	});

	describe('Errors', () => {
		const original = { foo: { bar: { baz: 'qux' } } };
		const decoy = Decoy.create(original);

		//  ensure there are internal "links" to sub-decoys
		expect(decoy.foo.bar.baz).to.equal('qux');

		describe('commit', () => {
			it('rejects original', (next) => {
				Decoy.commit(original)
					.catch((error) => {
						expect(error).to.be.error();
						expect(error.message).to.match(/^Not a known Decoy/);

						next();
					});
			});

			it('accepts decoy', (next) => {
				Decoy.commit(decoy)
					.then((result) => {
						expect(result).to.shallow.equal(original);

						next();
					});
			});
		});

		describe('rollback', () => {
			it('rejects original', (next) => {
				Decoy.rollback(original)
					.catch((error) => {
						expect(error).to.be.error();
						expect(error.message).to.match(/^Not a known Decoy/);

						next();
					});
			});

			it('accepts decoy', (next) => {
				Decoy.rollback(decoy)
					.then((result) => {
						expect(result).to.shallow.equal(original);

						next();
					});
			});
		});

		describe('purge', () => {
			it('rejects original', (next) => {
				Decoy.purge(original)
					.catch((error) => {
						expect(error).to.be.error();
						expect(error.message).to.match(/^Not a known Decoy/);

						next();
					});
			});

			it('accepts decoy', (next) => {
				Decoy.purge(decoy)
					.then((result) => {
						expect(result).to.shallow.equal(original);

						next();
					});
			});

			it('no longer commits decoy', (next) => {
				Decoy.commit(original)
					.catch((error) => {
						expect(error).to.be.error();
						expect(error.message).to.match(/^Not a known Decoy/);

						next();
					});
			});

			it('no longer rolls back decoy', (next) => {
				Decoy.rollback(original)
					.catch((error) => {
						expect(error).to.be.error();
						expect(error.message).to.match(/^Not a known Decoy/);

						next();
					});
			});

			it('no longer purges decoy', (next) => {
				Decoy.rollback(original)
					.catch((error) => {
						expect(error).to.be.error();
						expect(error.message).to.match(/^Not a known Decoy/);

						next();
					});
			});
		});
	});
});
