const crypto = require('crypto');
const DummyTrap = require('./trap');

const storage = new WeakMap();

/**
 *  Crash Test Dummy
 *
 *  @class  Dummy
 */
class Dummy {
	/**
	 *  Create a Dummy target
	 *
	 *  @static
	 *  @param     {Object}  target
	 *  @return    {Proxy}   dummy
	 *  @memberof  Dummy
	 */
	static create(target) {
		const linked = [];
		const trap = new DummyTrap((object) => {
			const delegate = this.create(object);
			linked.push(delegate);

			return delegate;
		});
		const proxy = new Proxy(target, trap);

		storage.set(proxy, { target, trap, linked });

		return proxy;
	}

	static checksum(proxy) {
		return Object.keys(proxy)
			.sort((one, two) => -Number(one < two) || Number(one > two))
			.reduce((checksum, key) => {
				// console.log(`${ key }:${ proxy[key] }`);

				return checksum.update(`${ key }:${ proxy[key] }`);
			}, crypto.createHash('sha256'))
			.digest('hex');
	}

	static isDummy(proxy) {
		return storage.has(proxy);
	}

	static purge(proxy) {
		if (!this.isDummy(proxy)) {
			throw new Error(`Unknown Dummy: ${ proxy }`);
		}

		storage.delete(proxy);
	}

	static commit(proxy) {
		if (!this.isDummy(proxy)) {
			throw new Error(`Unknown Dummy: ${ proxy }`);
		}

		const { target, trap, linked } = storage.get(proxy);

		trap.commit();
		linked.forEach((sub) => this.commit(sub));

		return target;
	}

	static rollback(proxy) {
		if (!this.isDummy(proxy)) {
			throw new Error(`Unknown Dummy: ${ proxy }`);
		}

		const { target, trap, linked } = storage.get(proxy);

		trap.rollback();
		linked.forEach((sub) => this.rollback(sub));

		return target;
	}
}

module.exports = Dummy;
