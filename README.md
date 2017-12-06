# Decoy
Create Proxy objects and keep track of mutations, reflecting them on access and providing the ability to either commit them or roll them back.

## Installation
Decoy is a scoped package, which means both the installation and `require` (or `import`) need the scope along with the package name:

```
$ npm install --save @konfirm/decoy
```

## Usage

```
//  require Decoy
const Decoy = require('@konfirm/decoy');
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
Decoy is fully static and works with any object which allows to be [proxied](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy).
All direct property changes are recorded to be truly applied or reverted at a later stage. The created proxy decoys will reflect the changes made.


### create
Creates a decoy proxy instance, any modification made to the decoy is recorded and can be effected using [`commit`](https://github.com/konfirm/node-decoy/blob/master/README.md#commit) or dropped using [`rollback`](https://github.com/konfirm/node-decoy/blob/master/README.md#rollback).

Syntax: `<proxy decoy> Decoy.create(<object>)`

Example:
```
const Decoy = require('@konfirm/decoy');
const original = { hello: 'world' };
const dummy = Decoy.create(original);

dummy.hello = 'universe';

console.log(dummy.hello);     //  'universe';
console.log(original.hello);  //  'world';
```


### isDecoy
Test whether the given target is a known proxy decoy created by [`Decoy.create`](https://github.com/konfirm/node-decoy/blob/master/README.md#create)

Syntax: `<boolean> Decoy.isDecoy(<any>)`

Example:
```
const Decoy = require('@konfirm/decoy');
const original = { hello: 'world' };
const dummy = Decoy.create(original);

console.log(Decoy.isDecoy(dummy));     //  'false';
console.log(Decoy.isDecoy(original));  //  'false';
```


### commit
Commit the proxy decoy, applying all recorded changes to the original object. Once committed, the recorded changes are truncated and the recording of changes starts over.
The return value is a Promise, which rejects if the given value is not a (known) proxy decoy.

Syntax: `<Promise> Decoy.commit(<proxy decoy>)`

Example:
```
const Decoy = require('@konfirm/decoy');
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

### rollback
Roll back all recorded changes to the proxy decoy, dropping all recorded changes. This truncates all recorded changes and the recording as if nothing has changed.
The return value is a Promise, which rejects if the given value is not a (known) proxy decoy.

Syntax: `<Promise> Decoy.rollback(<proxy decoy>)`

Example:
```
const Decoy = require('@konfirm/decoy');
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


### purge
Removes a proxy decoy from the internal list of created decoys. Cleaning up all of the record changes.
The return value is a Promise, which rejects if the given value is not a (known) proxy decoy.

Syntax: `<Promise> Decoy.purge(<proxy decoy>)`

Example:
```
const Decoy = require('@konfirm/decoy');
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

MIT License Copyright (c) 2017 Rogier Spieker (Konfirm)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
