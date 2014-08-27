
var Future = require('../asyncFuture')


module.exports = function(t) {


    //*
    this.count(12)

	var futures = []

    var f = new Future()
    f.return(5)
    f.then(function(v) {
        t.ok(v===5)  // return before
    }).done()

    var f2 = new Future()
    f2.then(function(v) {
        t.ok(v===6)  // return after
    }).done()
    f2.return(6)

    futures.push(f)
    futures.push(f2)

    t.test("immediate future", function(t) {
        this.count(1)
        var f2p1 = new Future()
        f2p1.then(function(v) {
            return Future([6+4]) // immediate future
        }).then(function(v) {
            t.ok(v[0]===10)
        }).done()
        f2p1.return(6)
        futures.push(f2p1)
    })

    var f3, futureDotErrorIsDoneBeingMessedWith = new Future, exceptionTestsDone = new Future
    t.test("exceptions", function(t) {
        this.count(9)

        f3 = new Future()
        f3.throw(Error("test1"))
        f3.then(function(v) {
            t.ok(false) // should never happen
        }).catch(function(e) {
            t.ok(e.message === "test1") // throw before
        }).done()

        var f4 = new Future()
        f4.then(function(v) {
            t.ok(false) // should never happen
        }).catch(function(e) {
            t.ok(e.message === "test2")  // throw after
        }).done()
        f4.throw(Error("test2"))

        var f4 = new Future()
        f4.then(function(v) {
            throw Error("NOT OK")
        }).catch(function(e) {
            t.ok(e.message === 'NOT OK') // Throw inside then
        }).done()
        f4.return("ok?")

        var f4a = new Future()
        f4a.catch(function(e) {
            throw "noooo"
        }).catch(function(e) {
            t.ok(e === 'noooo') // Throw inside catch
        }).done()
        f4a.throw("blah")

        var f4b = new Future()
        f4b.finally(function(e) {
            throw "nooootAgaaaaaaiin"
        }).catch(function(e) {
            t.ok(e === 'nooootAgaaaaaaiin') // Throw inside finally
        }).done()
        f4b.throw("blah")

        var f4c = new Future()
        var finallyComplete = false
        f4c.finally(function(e) {
            var x = new Future
            setTimeout(function() {
                finallyComplete = true
                x.return()
            },0)
            return x
        }).then(function(v){
            t.ok('blah')
            t.ok(finallyComplete === true)
        }).done()
        f4c.return("blah")

        // uncaught
        Future.error(function(e) {
            t.ok(e === "blah", e) // uncaught exception
            Future.error(function(e) {
                t.log("Wtf: "+e)
                t.ok(false)
            })

            futureDotErrorIsDoneBeingMessedWith.return()
        })
        var f4 = new Future()
        f4.done()
        f4.throw("blah")

        futures.push(f3)
        futures.push(f4)

        futureDotErrorIsDoneBeingMessedWith.then(function() {

            // set error handler back to normal
            Future.error(function(e) {
                setTimeout(function() {
                    throw e
                },0)
            })

            t.test("done should cause an asynchronous error (by default)", function(t) {
                this.count(1)
                var d = require('domain').create();
                d.on('error', function(er) {
                    t.ok(er === 'something',er)
                })
                d.run(function() {
                    Future(true).then(function(){
                        throw "something"
                    }).done()
                })
            })

            exceptionTestsDone.return()
        })

    })

    exceptionTestsDone.then(function() {
        var futures = []

        t.test("done should cause an asynchronous error (by default)", function(t) {
            this.count(1)
            var d = require('domain').create();
            d.on('error', function(er) {
                t.ok(er === 'something',er)
            })
            d.run(function() {
                Future(true).then(function(){
                    throw "something"
                }).done()
            })
        })

        t.test("chaining", function(t) {
            this.count(3)

            var fs = [new Future, new Future, new Future]
            fs[0].then(function(v) {
                t.ok(v === 0)
                fs[1].return(1)
                return fs[1]      // resolved before
            }).then(function(v) {
                t.ok(v === 1) // Chained after
                return fs[2]      // resolved after
            }).then(function(v) {
                t.ok(v === 2)   // Chained before
            }).done()
            fs[0].return(0)
            fs[2].return(2)

            futures = futures.concat(fs)
        })


        t.test("combining", function(t) {
            this.count(6)

            Future.all(f,f2).then(function(v){
                t.ok(v[0] === 5) // ALL After Success
                t.ok(v[1] === 6)
            }).done()

            Future.all(f,f2,f3).then(function(v){
                t.ok(false) // should never happen
            }).catch(function(e) {
                t.ok(e.message === 'test1') // ALL After Error
            }).done()

            var f5 = new Future()
            var f6 = new Future()
            Future.all(f5, f6).then(function(v){
                t.ok(v[0] === 'Ya') // ALL Before Success
                t.ok(v[1] === 'ok')
            }).done()
            f5.return("Ya")
            f6.return("ok")

            var f7 = new Future()
            var f8 = new Future()
            Future.all(f7, f8).then(function(v){
                t.ok(false)// Shouldn't happen
            }).catch(function(e) {
                t.ok(e.message === 'err') // ALL Before error
            }).done()

            f7.return("Ya")
            f8.throw(Error("err"))
        })

        t.test("working with callbacks", function(t) {
            this.count(6)

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
            })
            futures.push(f9)

            var f10 = new Future
            asyncException(f10.resolver())
            f10.catch(function(e) {
                t.ok(e.message === 'callbackException')
            })

            // wrap functions

            var f11 = Future.wrap(asyncFn)()
            f11.then(function(x) {
                t.ok(x === 'hi')
            })
            futures.push(f11)

            var f12 = Future.wrap(asyncException)()
            f12.catch(function(e) {
                t.ok(e.message === 'callbackException')
            })

            // wrap methods

            var f13 = Future.wrap(objectWithMethods, 'asyncFn')()
            f13.then(function(x) {
                t.ok(x === 'hi')
            })

            var f14 = Future.wrap(objectWithMethods, 'asyncException')()
            f14.catch(function(e) {
                t.ok(e.message === 'callbackException')
            })
        })

        t.test("immediate futures", function(t) {
            this.count(1)

            futures.push(
                Future(true).then(function(v) {
                    t.eq(v,true)
                })
            )
        })

        t.test('debug ids', function() {
            Future.debug = true

            var f = new Future()
            this.ok(f.id !== undefined, f.id)

            var f2 = new Future()
            this.ok(f2.id !== undefined, f2.id)
            this.ok(f.id !== f2.id)

            Future.debug = false
        })

        t.test('long traces', function(t) {
            this.count(2)

            var lineNumber = '311'

            Future.debug=false // make sure long traces don't happen when debug is false
            test(function(t, e) {
                t.ok(e.stack.toString().indexOf(lineNumber) === -1)
            })

            Future.debug = true
            test(function(t, e) {
                t.ok(e.stack.toString().indexOf(lineNumber) !== -1)
            })

            function test(assertions) {
                var f = new Future
                f.then(function() {
                    throw new Error("wuuuut")
                }).catch(function(e) {
                    t.log(e.stack)
                    assertions(t, e)
                })

                setTimeout(function() {
                    f.return(1)
                })
            }

        })

        t.test("former bugs", function() {
            this.count(10)

            this.test("Return result of then", function(t) {
                this.count(1)

                var f = Future(true).then(function() {
                    return Future(true).then(function() {
                        return Future('wutup')
                    })
                })

                futures.push(
                    f.then(function(result) {
                        t.ok(result === 'wutup', result)
                    })
                )
            })

            this.test("exception in returned future", function(t) {
                this.count(1)

                var f = new Future
                futures.push(f)

                var d = require('domain').create()
                d.on('error', function(err) {
                    t.ok(err.message === "Inner Exception1", err.message)
                    f.return()
                })
                d.run(function() {
                    Future(true).then(function() {
                        var f = new Future
                        f.throw(Error("Inner Exception1"))
                        return f
                    }).done()
                })
            })


            this.test("exception in returned future, passed through a finally", function(t) {
                this.count(2)

                var f = new Future
                futures.push(f)

                var d = require('domain').create()
                d.on('error', function(err) {
                    t.ok(err.message === "Inner Exception2", err.message)
                    f.return()
                })
                d.run(function() {
                    Future(true).then(function() {
                        var f = new Future
                        f.throw(Error("Inner Exception2"))
                        return f
                    }).finally(function() {
                        // do nothing
                            t.ok(true)
                    }).done()
                })
            })

            this.test("exception in future returned from a finally", function(t) {
                this.count(1)

                var f = new Future
                futures.push(f)

                var d = require('domain').create()
                d.on('error', function(err) {
                    t.ok(true)
                })
                d.run(function() {
                    Future(true).finally(function() {
                        var innerf = new Future
                        innerf.throw("test")

                        f.return()

                        return innerf
                    }).done()
                })
            })

            this.test("exception in returned future, passed to a catch", function(t) {
                this.count(1)

                var f = new Future
                futures.push(f)

                Future(true).then(function() {
                    var f = new Future
                    f.throw(Error("Inner Exception3"))
                    return f
                }).catch(function(e) {
                    t.ok(e.message === "Inner Exception3", e.message)
                    f.return()
                })
            })

            this.test("returned future not being waited on by finally", function(t) {
                this.count(1)

                var f = new Future
                futures.push(f)

                var returnedFutureReturned = false
                Future(true).then(function() {
                    var f2 = new Future
                    setTimeout(function() {
                        returnedFutureReturned = true
                        f2.return()
                    },500)

                    return f2
                }).finally(function() {
                    t.ok(returnedFutureReturned === true)
                    f.return()
                })
            })

            this.test('finally not passing through errors correctly', function(t) {
                this.count(1)

                var f = new Future
                f.throw("error")

                f.finally(function() {
                    // do nothing
                }).catch(function(e) {
                    t.ok(e === 'error')
                }).done()
            })

            this.test('finally not passing through return values correctly', function(t) {
                this.count(1)

                var f = new Future
                f.return("value")

                f.finally(function() {
                    // do nothing
                }).then(function(e) {
                    t.ok(e === 'value')
                }).done()
            })

            this.test("second catch not catching errors in error handler", function(t) {
                this.count(1)

                Future(undefined).then(function() {
                    var f = new Future
                    f.throw("crap")
                    return f
                }).catch(function(e) {
                    throw e
                }).catch(function(e) {
                        t.eq(e, 'crap')
                })
            })

            this.test('too much recursion suceptibility', function(t) {
                this.count(2)
                try {
                    var f = new Future, cur = f
                    for(var n=0; n<5000; n++) {
                        cur = cur.then(function(x) {
                            return Future(x)
                        })
                    }
                    cur.then(function(result) {
                        t.ok(true)
                    }).done()

                    f.return('done')
                    this.ok(true)

                } catch(e) {
                    this.ok(false, e)
                }
            })
        })
    }).done()

    //*/
}
