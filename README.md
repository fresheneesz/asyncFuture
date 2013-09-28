`async-future`
============

A simple, powerful library for managing asynchronous control flow and saner handling of asynchronous exceptions.

Why use async-future?
=====================
* If you want to avoid callback-hell
* If you want exception bubbling with try-catch-finally semantics for asynchronous code
* If you ever need to wait for two or more asynchronous calls to complete before executing some code

Example
=======

```
var Future = require('async-future')

var f = new Future
asynchronousFunction(function(result) {
    f.return(result)
})

f.then(function(result) {
    return Future.wrap(asyncFn2)() // turns an asynchronous function into a function that returns a future

}).then(function(result2) {
    console.log(result2)

}.catch(function(error) {
    console.error("Error: "+error)

}).finally(function() {
    // this is ran regardless of whether an exception was thrown above ^
}.done()
```

Why use async-future over ...
=============================
* [jQuery deferred](http://api.jquery.com/jQuery.Deferred/) doesn't bubble exceptions
* [Q promises](https://github.com/kriskowal/q) doesn't give you the flexibility to resolve your promises, rather it splits things into promises and deffereds. This makes things both more complicated and more restrictive.
* [fibers/future](https://github.com/laverdet/node-fibers) has a nicer interface, but only works on node.js
* [FutureJs](https://github.com/FuturesJS/FuturesJS) doesn't have very good documentation (so its hard to really know)
* [parallel.js](http://adambom.github.io/parallel.js/) is more complicated and doesn't help you bubble exceptions
* [substack's node-seq](https://github.com/substack/node-seq) is also much more complicated, and doesn't have sane semantics for passing futures/promises out of functions

Install
=======

```
npm install async-future
```


Usage
=====

```javascript
var Future = require('async-future')
```

future-chains
-------------

The most important part of `async-future` is future-chains. 
These are chains that have try-catch-finally style semantics, but are asynchronous.
Future-chains consist of chains of `then`, `catch`, and `finally` calls and usually end in a `done` call. 
All three of those methods return a `new Future` that is resolved either:
	
* if the callback returns nothing (aka `undefined`), when the callback of that method returns. In this case, the future returns undefined as well.
* if the callback returns a future, when the returned future resolves. In this case, the `new Future` returned by the method resolves to the same thing as the future returned from the method's callback.

`f.then(<callback>)` - executes a callback when the future (`f`) or previous link in the chain is returned from. 
Returns a future that resolves when `then` completes. 
If the future (`f`) resolves with an exception or if an exception is thrown inside the then, the future it returns will resolve with an exceptions. 
`<callback>` should either return nothing (aka `undefined`), or should return a future. 
If the future `f` is returned from `<callback>`, the returned future is resolved with the result the returned future resolves to.

`f.catch(<callback>)` - when an exception is thrown (or an error-resolved future is returned) from a previous link in the chain,
 the error propagates down the chain to the first catch it comes across, skipping any `then`s and running any `finally`s.
It then executes a callback that gets that error as its only parameter. 
Returns a future that resolves when `catch` completes.

`f.finally(<callback>)` - executes a callback regardless of whether the future-chain resolved with a value or an exception. 
The callback takes no arguments. Its return value is ignored in the case that it runs off an error-resolved future, and instead propogates the error.
Returns a future that resolves when `finally` completes.

`f.done()` - marks a future chain as done, which means that if any subsequent exceptions happen, 
 it will be thrown asynchronously (and likely caught be a domain or seen in the console). 
Every future or future-chain that won't have one of the chain-methods (or the `resolver` method) called on it, 
should call `.done()`, so that thrown exceptions won't get lost.

Other Instance properties
-------------------

`f.return(<value>)` - resolves a future with a return value (`undefined` if a value isn't passed)

`f.throw(<exception>)` - resolves a future with an exception

`f.resolver()` - returns an errback from a future. This is useful for using functions that require an errback-style callback (a function that takes two parameters, `(error, result)`)

`f.resolved()` - returns true if the future has already been resolved, false otherwise.

Static properties
-----------------

`Future.all(<futures>` - returns a future that resolves when all futures inside resolve (or throws an error when one of the futures returns an error).

`Future.wrap(<fn>)` - wraps a function that takes an errback so that it returns a future instead of calling an errback.

Example:

```
function a(x, errback) {
	if(x === false)
		errback(Error('x isnt true : ('))
	else 
		errback(undefined, x)
}

var aFuture = Future.wrap(a)

// prints 5
aFuture(5).then(function(result) {
	console.log(result)
}).done()

// prints an exception
aFuture(false).then(function(result) {
	console.log(result) // never gets here
}).done() 

```

`Future.wrap(<object>, <method)` - wraps a method that takes an errback so that it returns a future instead of calling an errback. Example:
	
* Example: `var wrappedMethod = Future.wrap(object, 'methodName')`

`Future.error(<handler>)` - sets up a function that is called when an unhandled error happens. `<handler>` gets one parameter, the unhandled exception. Unhandled errors happen when `done` is called and an exception is thrown from the future.

`Future.debug` - if true, gives each future a unique id (default is `false`)


Todo
====

* Rethink (and re-test) `finally`. Needs more edge case test (what if an error is thrown and finally is before the catch? What if its after the catch? What if an error isn't thrown?)
* timeout or cancelation (probably cancellation is more general)
* Long stack traces

How to Contribute!
============

Anything helps:

* Creating issues (aka tickets/bugs/etc). Please feel free to use issues to report bugs, request features, and discuss changes
* Updating the documentation: ie this readme file. Be bold! Help create amazing documentation!
* Submitting pull requests.

How to submit pull requests:

1. Please create an issue and get my input before spending too much time creating a feature. Work with me to ensure your feature or addition is optimal and fits with the purpose of the project.
2. Fork the repository
3. clone your forked repo onto your machine and run `npm install` at its root
4. If you're gonna work on multiple separate things, its best to create a separate branch for each of them
5. edit!
6. If it's a code change, please add to the unit tests (at test/asyncFuturesTest.js) to verify that your change
7. When you're done, run the unit tests and ensure they all pass
8. Commit and push your changes
9. Submit a pull request: https://help.github.com/articles/creating-a-pull-request

Contributors
============
* Special thanks to [kriskowal][kriskowal], who's project [Q promises][qPromises] gave me inspiration for this project.

[Q promises](https://github.com/kriskowal/q)

[jayferd]: https://github.com/kriskowal
[qPromises]: https://github.com/kriskowal/q

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
