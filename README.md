# Decoy

[![Release](https://github.com/konfirm/node-decoy/actions/workflows/release.yml/badge.svg)](https://github.com/konfirm/node-decoy/actions/workflows/release.yml)
[![Tests](https://github.com/konfirm/node-decoy/actions/workflows/tests.yml/badge.svg)](https://github.com/konfirm/node-decoy/actions/workflows/tests.yml)

Create Proxy objects and keep track of mutations, reflecting them on access and providing the ability to either commit them or roll them back.

## A word of caution
Decoy can only keep track of direct property changes, this means that any decoy target that works solely through getters/setters will directly influence the underlying target. A good example is the built-in `Date` object, which is modified using its setter methods (e.g. `setFullYear(2018)`).

## Installation
Decoy is a scoped package, which means both the installation and `require` (or `import`) need the scope along with the package name:

```
$ npm install --save @konfirm/decoy
```

## Usage

```ts
//  require Decoy
import * as Decoy from '@konfirm/decoy';
//  create the original object
const original = { foo: 'bar', baz: { hello: 'world' }};
//  create the decoy dummy for original
const dummy = Decoy.create(original);

console.log(dummy.foo);     //  'bar'
console.log(original.foo);  //  'bar';

dummy.foo = 'I pity the foo!';

console.log(dummy.foo);     //  'I pity the foo!';
console.log(original.foo);  //  'bar';

Decoy.commit(dummy)
	.then((result) => {
		console.log(result === original);  //  true
		console.log(dummy.foo);            //  'I pity the foo!';
		console.log(original.foo);         //  'I pity the foo!';
	});
```

## API
Decoy is a collection of individual functions that work with any object that can to be [proxied](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy).
All direct property changes are recorded to be truly applied (`commit`) or reverted (`rollback`) at a later stage. The created proxy decoys will reflect the changes made.

### exports

| name         | syntax                                                           | description                                                                                         |
| ------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Decoy        | `Decoy<object>`                                                  | _TypeScript_ Type describing a Decoy (which is just an alias for the object provided)                |
| create       | `create<T>(target:T, boolean: onlyLastKeyMutations): Decoy<T>`   | create a new decoy for the target                                                                       |
| checksum     | `checksum(decoy: Decoy<T>):string`                               | calculate the checksum of the decoy                                                                 |
| isDecoy      | `isDecoy<T>(target: Decoy<T>):boolean`                           | is the target a known Decoy                                                                         |
| purge        | `purge<T = object>(decoy: Decoy<T>): T                           | clean the Decoy (including its nested ones)                                                         |
| commit       | `commit<T = object>(decoy: Decoy<T> [, key 1, ..., keyN])`       | commit the changes to the decoyed object, optionally limited to only the keys specified             |
| rollback     | `rollback<T = object>(decoy: Decoy<T> [, key 1, ..., keyN])`     | roll back the changes to the decoyed object, optionally limited to only the keys specified          |
| hasMutations | `hasMutations<T = object>(decoy: Decoy<T> [, key 1, ..., keyN])` | determine whether the decoyed object has any changes, optionally limited to only the keys specified |

### create
Creates a decoy proxy instance, any modification made to the decoy is recorded and can be effected using [`commit`](https://github.com/konfirm/node-decoy/blob/master/README.md#commit) or dropped using [`rollback`](https://github.com/konfirm/node-decoy/blob/master/README.md#rollback).

Syntax: `create(<object> [, <bool>]): Decoy<object>`

Examples:

```ts
import * as Decoy from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = Decoy.create(original);

dummy.hello = 'universe';

console.log(dummy.hello);     //  'universe';
console.log(original.hello);  //  'world';
```

```ts
import { create } from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = create(original);

dummy.hello = 'universe';

console.log(dummy.hello);     //  'universe';
console.log(original.hello);  //  'world';
```

#### Tracking only the latest change (new in v1.3.0)
An additional argument has been added to the `create` method, a boolean value indicating whether to keep track of every change (the default) or to preserve only the latest state.
Any change that effectively resets the original value is removed entirely, as Decoy no longer needs to update the value in a `commit`.

Example:
```ts
import * as Decoy from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = Decoy.create(original, true);

console.log(Decoy.hasMutations(dummy));  //  false
console.log(dummy.hello);                //  'world';

dummy.hello = 'universe';

console.log(Decoy.hasMutations(dummy));  //  true
console.log(dummy.hello);                //  'universe';

dummy.hello = 'world';

console.log(Decoy.hasMutations(dummy));  //  false
console.log(dummy.hello);                //  'world';
```


### isDecoy
Test whether the given target is a known proxy decoy created by [`Decoy.create`](https://github.com/konfirm/node-decoy/blob/master/README.md#create)

Syntax: `<boolean> Decoy.isDecoy(<any>)`

Example:
```ts
import * as Decoy from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = Decoy.create(original);

console.log(Decoy.isDecoy(dummy));     //  true;
console.log(Decoy.isDecoy(original));  //  false;
```

### hasMutations
Determine whether the provided Decoy has any (nested) mutations pending. If the provided value is not a known Decoy `(boolean) false` is returned.

Syntax: `<Promise> Decoy.hasMutations(<proxy decoy> [, <keyof proxy 1>, <keyof proxy N>, ...])`


```ts
import * as Decoy from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = Decoy.create(original);

console.log(Decoy.hasMutations(dummy));  //  false;

dummy.hello = 'universe';

console.log(Decoy.hasMutations(dummy));  //  true;

Decoy.rollback(dummy)
	.then(() => {
		console.log(Decoy.hasMutations(dummy));  //  false
	})
```

_NOTE_: If the decoy was created with the flag to track only the last change, `hasMutations` will return false if the last change brought the previously changed value(s) back to their original values.

#### Check for specific key mutations (new in v2.0.0)
In order to determine whether one or more specific keys have been changed, the `hasMutations` function allows for one or more property keys to be provided, the result will then be `true` if any of those keys were changed _on the decoy provided_.

```ts
import { create, hasMutations } from '@konfirm/decoy';

const subject = { ones: 1, twos: 2, nested: { ones: 1, twos: 2} };
const dummy = create(subject);

dummy.ones = 11;
dummy.nested.twos = 22;

console.log(hasMutations(dummy)); // true
console.log(hasMutations(dummy, 'ones')); // true
console.log(hasMutations(dummy, 'twos')); // false
console.log(hasMutations(dummy.nested)); // true
console.log(hasMutations(dummy.nested, 'ones')); // false
console.log(hasMutations(dummy.nested, 'twos')); // true
```


### commit
Commit the proxy decoy, applying all recorded changes to the original object. Once committed, the recorded changes are truncated and the recording of changes starts over.
The return value is a Promise, which rejects if the given value is not a (known) proxy decoy.

Syntax: `<Promise> Decoy.commit(<proxy decoy> [, <keyof proxy 1>, <keyof proxy N>, ...])`

Example:
```ts
import * as Decoy from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = Decoy.create(original);

dummy.hello = 'universe';

Decoy.commit(dummy)
	.then((result) => {
		console.log(result === original);  //  true
		console.log(dummy.hello);          //  'universe';
		console.log(original.hello);       //  'universe';
	});

//  try to commit the original, resulting in an error
Decoy.commit(original)
	.then((result) => console.log('never reached'))
	.catch((error) => console.error(error));
```

#### commit specific key mutations (new in v2.0.0)
In order to commit one or more specific changes, it is possible to specify the keys which should be committed.

```ts
import { create, commit } from '@konfirm/decoy';

const original = { hello: 'world', nested: { hello: 'world' } };
const dummy = create(original);

dummy.hello = 'universe';
dummy.nested.hello = 'universe';

commit(dummy, 'nested')
	.then((result) => {
		console.log(result === original); // true
		console.log(dummy.nested.hello); // universe
		console.log(original.nested.hello); // universe
		console.log(dummy.hello); // universe
		console.log(original.hello); // world
	});
```

### rollback
Roll back all recorded changes to the proxy decoy, dropping all recorded changes. This truncates all recorded changes.
The return value is a Promise, which rejects if the given value is not a (known) proxy decoy.

Syntax: `<Promise> Decoy.rollback(<proxy decoy>)`

Example:
```ts
import * as Decoy from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = Decoy.create(original);

dummy.hello = 'universe';

Decoy.rollback(dummy)
	.then((result) => {
		console.log(result === original);  //  true
		console.log(dummy.hello);          //  'world';
		console.log(original.hello);       //  'world';
	});

//  try to roll back the original, resulting in an error
Decoy.rollback(original)
	.then((result) => console.log('never reached'))
	.catch((error) => console.error(error));
```

#### rollback specific key mutations (new in v2.0.0)
In order to roll back one or more specific changes, it is possible to specify the keys that should be rolled back.

```ts
import { create, rollback } from '@konfirm/decoy';

const original = { hello: 'world', nested: { hello: 'world' } };
const dummy = create(original);

dummy.hello = 'universe';
dummy.nested.hello = 'universe';

rollback(dummy, 'nested')
	.then((result) => {
		console.log(result === original); // true
		console.log(dummy.nested.hello); // world
		console.log(original.nested.hello); // world
		console.log(dummy.hello); // universe
		console.log(original.hello); // world
	});
```


### purge
Removes a proxy decoy from the internal list of created decoys. Cleaning up all the record changes.
The return value is a Promise, which rejects if the given value is not a (known) proxy decoy.

Syntax: `<Promise> Decoy.purge(<proxy decoy>)`

Example:
```ts
import * as Decoy from '@konfirm/decoy';
const original = { hello: 'world' };
const dummy = Decoy.create(original);

dummy.hello = 'universe';

Decoy.purge(dummy)
	.then((result) => {
		console.log(result === original);  //  true
		console.log(original.hello);       //  'world';
	});

//  try to purge the original, resulting in an error
Decoy.purge(original)
	.then((result) => console.log('never reached'))
	.catch((error) => console.error(error));

//  try to purge the dummy again, resulting in an error
Decoy.purge(dummy)
	.then((result) => console.log('never reached'))
	.catch((error) => console.error(error));
```

## License

MIT License Copyright (c) 2017-2023 Rogier Spieker (Konfirm)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
