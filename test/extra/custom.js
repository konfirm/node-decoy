const storage = new WeakMap();

class Custom {
	constructor(value) {
		storage.set(this, { value });
	}

	[Symbol.toPrimitive](hint) {
		const { value } = storage.get(this);

		if (value && typeof value === 'object' && Symbol.toPrimitive in value) {
			return value[Symbol.toPrimitive](hint);
		}

		return JSON.stringify(value);
	}
}

module.exports = Custom;
