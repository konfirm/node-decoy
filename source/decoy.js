const crypto = require('crypto');
const DummyTrap = require('./trap');

const storage = new WeakMap();

/**
 *  Decoy
 *
 *  @class  Decoy
 */
class Decoy {
	/**
	 *  Create a Decoy target
	 *
	 *  @static
	 *  @param     {Object}  target
	 *  @return    {Proxy}   decoy
	 *  @memberof  Decoy
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
	 *  @memberof  Decoy
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
	 *  Test whether the provided object is a known Decoy
	 *
	 *  @static
	 *  @param     {Object}   proxy
	 *  @return    {Boolean}  is decoy
	 *  @memberof  Decoy
	 */
	static isDecoy(proxy) {
		return storage.has(proxy);
	}

	/**
	 *  Remove the provided object from the internal storage
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @throws    {Error}   'Not a known Decoy: <proxy>'
	 *  @memberof  Decoy
	 */
	static purge(proxy) {
		return new Promise((resolve, reject) => {
			if (!this.isDecoy(proxy)) {
				return reject(new Error(`Not a known Decoy: ${ proxy }`));
			}

			const { target, linked } = storage.get(proxy);

			storage.delete(proxy);

			linked.reduce((prev, sub) => prev.then(() => this.purge(sub)), Promise.resolve())
				.then(() => {
					linked.length = 0;

					resolve(target);
				});
		});
	}

	/**
	 *  Commit all recorded mutations to the proxied object and
	 *  any recorded delegate
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @return    {Object}  original target
	 *  @throws    {Error}   'Not a known Decoy: <proxy>'
	 *  @memberof  Decoy
	 */
	static commit(proxy) {
		return new Promise((resolve, reject) => {
			if (!this.isDecoy(proxy)) {
				return reject(new Error(`Not a known Decoy: ${ proxy }`));
			}

			const { target, trap, linked } = storage.get(proxy);

			trap.commit();

			linked.reduce((prev, sub) => prev.then(() => this.commit(sub)), Promise.resolve())
				.then(() => resolve(target));
		});
	}

	/**
	 *  Roll back all recorded mutations for the proxied object and
	 *  any recorded delegate
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @return    {Object}  original target
	 *  @throws    {Error}   'Not a known Decoy: <proxy>'
	 *  @memberof  Decoy
	 */
	static rollback(proxy) {
		return new Promise((resolve, reject) => {
			if (!this.isDecoy(proxy)) {
				return reject(new Error(`Not a known Decoy: ${ proxy }`));
			}

			const { target, trap, linked } = storage.get(proxy);

			trap.rollback();

			linked.reduce((prev, sub) => prev.then(() => this.rollback(sub)), Promise.resolve())
				.then(() => resolve(target));
		});
	}
}

module.exports = Decoy;
