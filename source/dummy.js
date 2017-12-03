const crypto = require('crypto');
const Trap = require('@konfirm/trap');

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
		const trap = new Trap();
		const proxy = new Proxy(target, trap);

		storage.set(proxy, { target, trap });

		return proxy;
	}

	static checksum(proxy) {
		return Object.keys(proxy)
			//  eslint-disable-next-line no-confusing-arrow, no-magic-numbers
			.sort((one, two) => one < two ? -1 : Number(one > two))
			.reduce(
				(checksum, key) => checksum.update(`${ key }:${ proxy[key] }`),
				crypto.createHash('sha256')
			)
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

		const { target, trap } = storage.get(proxy);

		trap.commit();

		return target;
	}

	static rollback(proxy) {
		if (!this.isDummy(proxy)) {
			throw new Error(`Unknown Dummy: ${ proxy }`);
		}

		const { target, trap } = storage.get(proxy);

		trap.rollback();

		return target;
	}
}

module.exports = Dummy;
