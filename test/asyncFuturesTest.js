"use strict";

var Unit = require('deadunit')
var Future = require('../asyncFuture')
Future.debug = true

var futures = []
var test = Unit.test("Testing async futures", function() {
    var t = this
    var countAsserts = 0
    var expectedAsserts = 0

    var f = new Future()
    this.ok(f.id !== undefined, f.id)
    f.return(5)
    f.then(function(v) {
        t.ok(v===5)  // return before
        countAsserts++
    }).done()

    var f2 = new Future()
    this.ok(f2.id !== undefined, f2.id)
    this.ok(f.id !== f2.id)
    f2.then(function(v) {
        t.ok(v===6)  // return after
        countAsserts++
    }).done()
    f2.return(6)

    futures.push(f)
    futures.push(f2)

    expectedAsserts += 2

    Future.debug = false
    var nondebugTest = new Future
    this.ok(nondebugTest.nondebugTest === undefined)

    t.test("immediate future", function() {
        var f2p1 = new Future()
        f2p1.then(function(v) {
            return Future([6+4]) // immediate future
        }).then(function(v) {
            t.ok(v[0]===10)
            countAsserts++
        }).done()
        f2p1.return(6)
        futures.push(f2p1)

        expectedAsserts += 1
    })

    var f3, futureDotErrorIsDoneBeingMessedWith = new Future
    t.test("exceptions", function() {
        var t = this

        f3 = new Future()
        f3.throw(Error("test1"))
        f3.then(function(v) {
            t.ok(false) // should never happen
        }).catch(function(e) {
            t.ok(e.message === "test1") // throw before
            countAsserts++
        }).done()

        var f4 = new Future()
        f4.then(function(v) {
            t.ok(false) // should never happen
        }).catch(function(e) {
            t.ok(e.message === "test2")  // throw after
            countAsserts++
        }).done()
        f4.throw(Error("test2"))

        var f4 = new Future()
        f4.then(function(v) {
            throw Error("NOT OK")
        }).catch(function(e) {
            t.ok(e.message === 'NOT OK') // Throw inside then
            countAsserts++
        }).done()
        f4.return("ok?")

        var f4 = new Future()
        f4.catch(function(e) {
            throw "noooo"
        }).catch(function(e) {
            t.ok(e === 'noooo') // Throw inside catch
            countAsserts++
        }).done()
        f4.throw("blah")

        var f4 = new Future()
        f4.finally(function(e) {
            throw "nooootAgaaaaaaiin"
        }).catch(function(e) {
            t.ok(e === 'nooootAgaaaaaaiin') // Throw inside finally
            countAsserts++
        }).done()
        f4.throw("blah")

        var f5 = new Future
        this.test("done should cause an asynchronous error (by default)", function(t) {
            this.count(1)
            var d = require('domain').create();
            d.on('error', function(er) {
                t.ok(er === 'something',er)
                f5.return()
            })
            d.run(function() {
                Future(true).then(function(){
                    throw "something"
                }).done()
            })
        })

        f5.then(function() {
            // uncaught
            Future.error(function(e) {
                t.ok(e === "blah", e) // uncaught exception
                countAsserts++
                Future.error(function(e) {
                    t.log("Wtf: "+e)
                    t.ok(false)
                })

                futureDotErrorIsDoneBeingMessedWith.return()
            })
            var f4 = new Future()
            f4.done()
            f4.throw("blah")

            expectedAsserts += 6
            futures.push(f3)
            futures.push(f4)
        })

    })

    t.test("chaining", function() {
        var t = this

        var fs = [new Future, new Future, new Future]
        fs[0].then(function(v) {
            t.ok(v === 0)
            countAsserts++
            fs[1].return(1)
            return fs[1]      // resolved before
        }).then(function(v) {
            t.ok(v === 1) // Chained after
            countAsserts++
            return fs[2]      // resolved after
        }).then(function(v) {
            t.ok(v === 2)
            countAsserts++ // Chained before
        }).done()
        fs[0].return(0)
        fs[2].return(2)

        futures = futures.concat(fs)

        expectedAsserts += 3
    })


    t.test("combining", function() {
        var t = this

        Future.all(f,f2).then(function(v){
            t.ok(v[0] === 5) // ALL After Success
            t.ok(v[1] === 6)
            countAsserts+=2
        }).done()

        Future.all(f,f2,f3).then(function(v){
            t.ok(false) // should never happen
        }).catch(function(e) {
            t.ok(e.message === 'test1') // ALL After Error
            countAsserts++
        }).done()

        var f5 = new Future()
        var f6 = new Future()
        Future.all(f5, f6).then(function(v){
            t.ok(v[0] === 'Ya') // ALL Before Success
            t.ok(v[1] === 'ok')
            countAsserts+=2
        }).done()
        f5.return("Ya")
        f6.return("ok")

        var f7 = new Future()
        var f8 = new Future()
        Future.all(f7, f8).then(function(v){
            t.ok(false)// Shouldn't happen
        }).catch(function(e) {
            t.ok(e.message === 'err') // ALL Before error
            countAsserts++
        })
        f7.return("Ya")
        f8.throw(Error("err"))

        futures.push(f6)
        futures.push(f7)
        futures.push(f8)

        expectedAsserts += 6
    })

    t.test("working with callbacks", function(t) {
        var t = this

        function asyncFn(cb) {
            cb(undefined, "hi")
        }
        function asyncException(cb) {
            cb(Error("callbackException"))
        }
        
        var objectWithMethods = {
			asyncFn: asyncFn,
			asyncException: asyncException
		}

        // resolver

        var f9 = new Future
        asyncFn(f9.resolver())
        f9.then(function(x) {
            t.ok(x === 'hi')
            countAsserts++
        })
        futures.push(f9)

        var f10 = new Future
        asyncException(f10.resolver())
        f10.catch(function(e) {
            t.ok(e.message === 'callbackException')
            countAsserts++
        })
        futures.push(f10)

        // wrap functions

        var f11 = Future.wrap(asyncFn)()
        f11.then(function(x) {
            t.ok(x === 'hi')
            countAsserts++
        })
        futures.push(f11)

        var f12 = Future.wrap(asyncException)()
        f12.catch(function(e) {
            t.ok(e.message === 'callbackException')
            countAsserts++
        })
        futures.push(f12)
                
		// wrap methods

        var f13 = Future.wrap(objectWithMethods, 'asyncFn')()
        f13.then(function(x) {
            t.ok(x === 'hi')
            countAsserts++
        })
        futures.push(f13)

        var f14 = Future.wrap(objectWithMethods, 'asyncException')()
        f14.catch(function(e) {
            t.ok(e.message === 'callbackException')
            countAsserts++
        })
        futures.push(f14)            

        expectedAsserts += 6
    })

    t.test("immediate futures", function(t) {
        var t = this

        futures.push(
            Future(true).then(function(v) {
                t.equal(v,true)
                countAsserts++
            })
        )

        expectedAsserts += 1
    })

    futureDotErrorIsDoneBeingMessedWith.then(function() {
        t.test("former bugs", function() {
            this.test("Return result of then", function(t) {
                var f = Future(true).then(function() {
                    return Future(true).then(function() {
                        return Future('wutup')
                    })
                })

                futures.push(
                    f.then(function(result) {
                        t.ok(result === 'wutup', result)
                        countAsserts++
                    })
                )

                expectedAsserts += 1
            })

            this.test("exception in returned future", function(t) {
                var f = new Future
                futures.push(f)

                var d = require('domain').create()
                d.on('error', function(err) {
                    t.ok(err.message === "Inner Exception1", err.message)
                    countAsserts++
                    f.return()
                })
                d.run(function() {
                    Future(true).then(function() {
                        var f = new Future
                        f.throw(Error("Inner Exception1"))
                        return f
                    }).done()
                })

                expectedAsserts += 1
            })

            this.test("exception in returned future, passed through a finally", function(t) {
                var f = new Future
                futures.push(f)

                // set error handler back to normal
                Future.error(function(e) {
                    setTimeout(function() {
                        throw e
                    },0)
                })

                var d = require('domain').create()
                d.on('error', function(err) {
                    t.ok(err.message === "Inner Exception2", err.message)
                    countAsserts++
                    f.return()
                })
                d.run(function() {
                    Future(true).then(function() {
                        var f = new Future
                        f.throw(Error("Inner Exception2"))
                        return f
                    }).finally(function() {
                        // do nothing
                    }).done()
                })

                expectedAsserts += 1
            })

            this.test("exception in returned future, passed to a catch", function(t) {
                var f = new Future
                futures.push(f)

                Future(true).then(function() {
                    var f = new Future
                    f.throw(Error("Inner Exception3"))
                    return f
                }).catch(function(e) {
                    t.ok(e.message === "Inner Exception3", e.message)
                    countAsserts++
                    f.return()
                })

                expectedAsserts += 1
            })

            this.test("returned future not being waited on by finally", function(t) {
                var f = new Future
                futures.push(f)

                var returnedFutureReturned = false
                Future(true).then(function() {
                    var f2 = new Future
                    setTimeout(function() {
                        f2.return()
                        returnedFutureReturned = true
                    },500)

                    return f2
                }).finally(function() {
                    t.ok(returnedFutureReturned === true)
                    countAsserts++
                    f.return()
                })

                expectedAsserts += 1
            })
        })

          /*

        // longtraces
        q.longStackSupport = true;
        q.call(function() {
            throw Error("test")
        }).catch(function(e) {
            console.log(e.stack)
        }).fin(function() {
            console.log("finally!")
        })
              */

        var x = Future.all(futures)
        futures.push(x)
        x.finally(function() {
            t.equal(countAsserts, expectedAsserts)
        })
    })
})

Future.all(futures).finally(function() {
    test.writeConsole()
})


