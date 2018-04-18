/* global source, describe, it, expect */

const Decoy = source('decoy');

describe('README.js', () => {
	it('samples usage', (next) => {
		//  require Decoy
		// const Decoy = require('@konfirm/decoy');
		//  create the original object
		const original = { foo: 'bar', baz: { hello: 'world' } };
		//  create the decoy dummy
		const dummy = Decoy.create(original);

		expect((dummy.foo)).to.equal('bar');
		expect((original.foo)).to.equal('bar');

		dummy.foo = 'I pity the foo!';

		expect((dummy.foo)).to.equal('I pity the foo!');
		expect((original.foo)).to.equal('bar');

		Decoy.commit(dummy)
			.then((result) => {
				expect(result).to.shallow.equal(original);

				expect((dummy.foo)).to.equal('I pity the foo!');
				expect((original.foo)).to.equal('I pity the foo!');

				next();
			});
	});

	it('samples create', (next) => {
		// const Decoy = require('@konfirm/decoy');
		const original = { hello: 'world' };
		const dummy = Decoy.create(original);

		dummy.hello = 'universe';

		expect(dummy.hello).to.equal('universe');
		expect(original.hello).to.equal('world');

		next();
	});

	it('samples create - only last change', (next) => {
		// const Decoy = require('@konfirm/decoy');
		const original = { hello: 'world' };
		const dummy = Decoy.create(original, true);

		expect(Decoy.hasMutations(dummy)).to.be.false();
		expect(dummy.hello).to.equal('world');

		dummy.hello = 'universe';

		expect(Decoy.hasMutations(dummy)).to.be.true();
		expect(dummy.hello).to.equal('universe');

		dummy.hello = 'world';

		expect(Decoy.hasMutations(dummy)).to.be.false();
		expect(dummy.hello).to.equal('world');

		next();
	});

	it('samples isDecoy', (next) => {
		// const Decoy = require('@konfirm/decoy');
		const original = { hello: 'world' };
		const dummy = Decoy.create(original);

		expect(Decoy.isDecoy(dummy)).to.be.true();
		expect(Decoy.isDecoy(original)).to.be.false();

		next();
	});

	it('samples hasMutations', (next) => {
		const original = { hello: 'world' };
		const dummy = Decoy.create(original);

		expect(Decoy.hasMutations(dummy)).to.be.false();

		dummy.hello = 'universe';

		expect(Decoy.hasMutations(dummy)).to.be.true();

		Decoy.rollback(dummy)
			.then(() => {
				expect(Decoy.hasMutations(dummy)).to.be.false();

				next();
			});
	});

	it('samples commit', (next) => {
		// const Decoy = require('@konfirm/decoy');
		const original = { hello: 'world' };
		const dummy = Decoy.create(original);

		dummy.hello = 'universe';

		Decoy.commit(dummy)
			.then((result) => {
				expect(result).to.shallow.equal(original);

				expect(dummy.hello).to.equal('universe');
				expect(original.hello).to.equal('universe');

				return Promise.resolve();
			})
			//  try to commit the original, resulting in an error
			.then(() => Decoy.commit(original))
			.then(() => {
				throw new Error('commit of an unknown Decoy succeeded');
			})
			.catch((error) => {
				expect(error).to.be.error();
				expect(error.message).to.match(/^Not a known Decoy/);

				next();
			});
	});

	it('samples rollback', (next) => {
		// const Decoy = require('@konfirm/decoy');
		const original = { hello: 'world' };
		const dummy = Decoy.create(original);

		dummy.hello = 'universe';

		Decoy.rollback(dummy)
			.then((result) => {
				expect(result).to.shallow.equal(original);

				expect(dummy.hello).to.equal('world');
				expect(original.hello).to.equal('world');

				return Promise.resolve();
			})
			//  try to roll back the original, resulting in an error
			.then(() => Decoy.rollback(original))
			.then(() => {
				throw new Error('rollback of an unknown Decoy succeeded');
			})
			.catch((error) => {
				expect(error).to.be.error();
				expect(error.message).to.match(/^Not a known Decoy/);

				next();
			});
	});

	it('samples purge', (next) => {
		// const Decoy = require('@konfirm/decoy');
		const original = { hello: 'world' };
		const dummy = Decoy.create(original);

		dummy.hello = 'universe';

		Decoy.purge(dummy)
			.then((result) => {
				expect(result).to.shallow.equal(original);

				expect(original.hello).to.equal('world');

				return Promise.resolve();
			})
			//  try to purge the original, resulting in an error
			.then(() => Decoy.purge(original))
			.then(() => {
				throw new Error('purge of an unknown Decoy succeeded');
			})
			.catch((error) => {
				expect(error).to.be.error();
				expect(error.message).to.match(/^Not a known Decoy/);

				//  try to purge the dummy again, resulting in an error
				Decoy.purge(dummy)
					.then(() => {
						throw new Error('purge of an unknown Decoy succeeded');
					})
					.catch((subError) => {
						expect(subError).to.be.error();
						expect(subError.message).to.match(/^Not a known Decoy/);

						next();
					});
			});
	});
});
