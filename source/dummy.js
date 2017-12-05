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
		const trap = new DummyTrap((object) => linked[linked.push(this.create(object)) - 1]);
		const proxy = new Proxy(target, trap);

		storage.set(proxy, { target, trap, linked });

		return proxy;
	}

	/**
	 *  Calculate the checksum for the given proxy, taking nested objects
	 *  into consideration
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @return    {String}  checksum
	 *  @memberof  Dummy
	 */
	static checksum(proxy) {
		return Object.keys(proxy)
			.sort((one, two) => -Number(one < two) || Number(one > two))
			.reduce((checksum, key) => {
				const value = proxy[key];
				const update = typeof value === 'object' ? this.checksum(value) : value;

				return checksum.update(`${ key }:${ update }`);
			}, crypto.createHash('sha256'))
			.digest('hex');
	}

	/**
	 *  Test whether the provided object is a known Dummy
	 *
	 *  @static
	 *  @param     {Object}   proxy
	 *  @return    {Boolean}  is dummy
	 *  @memberof  Dummy
	 */
	static isDummy(proxy) {
		return storage.has(proxy);
	}

	/**
	 *  Remove the provided object from the internal storage
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @throws    {Error}   'Not a known Dummy: <proxy>'
	 *  @memberof  Dummy
	 */
	static purge(proxy) {
		if (!this.isDummy(proxy)) {
			throw new Error(`Not a known Dummy: ${ proxy }`);
		}

		storage.delete(proxy);
	}

	/**
	 *  Commit all recorded mutations to the proxied object and
	 *  any recorded delegate
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @return    {Object}  original target
	 *  @throws    {Error}   'Not a known Dummy: <proxy>'
	 *  @memberof  Dummy
	 */
	static commit(proxy) {
		if (!this.isDummy(proxy)) {
			throw new Error(`Not a known Dummy: ${ proxy }`);
		}

		const { target, trap, linked } = storage.get(proxy);

		trap.commit();
		linked.forEach((sub) => this.commit(sub));

		return target;
	}

	/**
	 *  Roll back all recorded mutations for the proxied object and
	 *  any recorded delegate
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @return    {Object}  original target
	 *  @throws    {Error}   'Not a known Dummy: <proxy>'
	 *  @memberof  Dummy
	 */
	static rollback(proxy) {
		if (!this.isDummy(proxy)) {
			throw new Error(`Not a known Dummy: ${ proxy }`);
		}

		const { target, trap, linked } = storage.get(proxy);

		trap.rollback();
		linked.forEach((sub) => this.rollback(sub));

		return target;
	}
}

module.exports = Dummy;
