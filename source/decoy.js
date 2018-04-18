const Checksum = require('@konfirm/checksum');
const DecoyTrap = require('./trap');

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
	 *  @param     {Object}   target
	 *  @param     {boolean}  [onlyLast=false]
	 *  @return    {Proxy}    decoy
	 *  @memberof  Decoy
	 */
	static create(target, onlyLast = false) {
		const linked = [];
		const trap = new DecoyTrap((object) => linked[linked.push(this.create(object, onlyLast)) - 1], onlyLast);
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
		return Checksum.hash(proxy);
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

			return linked.reduce((prev, sub) => prev.then(() => this.purge(sub)), Promise.resolve())
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

			return linked.reduce((prev, sub) => prev.then(() => this.commit(sub)), Promise.resolve())
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

			return linked.reduce((prev, sub) => prev.then(() => this.rollback(sub)), Promise.resolve())
				.then(() => resolve(target));
		});
	}

	/**
	 *  Determine if the proxied object contains mutations
	 *
	 *  @static
	 *  @param     {Object}  proxy
	 *  @memberof  Decoy
	 */
	static hasMutations(proxy) {
		if (this.isDecoy(proxy)) {
			const { trap, linked } = storage.get(proxy);

			return linked.reduce((verdict, sub) => verdict || this.hasMutations(sub), trap.mutations.length > 0);
		}

		return false;
	}
}

module.exports = Decoy;
