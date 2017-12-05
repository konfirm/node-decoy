const Trap = require('@konfirm/trap');
const storage = new WeakMap();

/**
 *  Trap extension to allow for manipulation of get values
 *
 *  @class    DecoyTrap
 *  @extends  {Trap}
 */
class DecoyTrap extends Trap {
	/**
	 *  Creates an instance of DecoyTrap
	 *
	 *  @param     {Function}  delegate
	 *  @memberof  DecoyTrap
	 */
	constructor(delegate) {
		super();

		storage.set(this, { delegate });
	}

	/**
	 *  Create a delegated object, ensuring the prototype of the original
	 *  value is persisted
	 *
	 * @param     {any}    value
	 * @return    {Proxy}  delegate
	 * @memberof  DecoyTrap
	 */
	delegate(value) {
		const result = storage.get(this).delegate(value);

		Object.setPrototypeOf(result, Object.getPrototypeOf(value));

		return result;
	}

	/**
	 *  Obtain (or register) a delegate for the provided value, so a previously
	 *  created delegate object can be re-used
	 *
	 *  @param     {Object}  target
	 *  @param     {any}     value
	 *  @return    {Proxy}   delegate
	 *  @memberof  DecoyTrap
	 */
	cache(target, value) {
		if (!storage.has(value)) {
			storage.set(value, new Map());
		}

		const map = storage.get(value);

		if (!map.has(target)) {
			map.set(target, this.delegate(value));
		}

		return map.get(target);
	}

	/**
	 *  Override the Trap get method so the delegate function provided during
	 *  construction can be invoked on object values
	 *
	 *  @param     {Object}  target
	 *  @param     {String}  key
	 *  @return    {any}     value
	 *  @memberof  DecoyTrap
	 */
	get(target, key) {
		const value = super.get(target, key);

		return typeof value === 'object' ? this.cache(target, value) : value;
	}
}

module.exports = DecoyTrap;
