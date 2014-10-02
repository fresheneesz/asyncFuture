"use strict";

var Unit = require('deadunit')
var tests = require('./asyncFuturesTests')

var test = Unit.test("Testing async futures", function(t) {
    var afterSharedTests
    this.test('shared tests', function(t) {
        afterSharedTests = tests.call(this, t, 'node')
    })

    afterSharedTests.then(function() {

        t.test('node-specific tests', function(t) {

            var Future = require('../asyncFuture')

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

            t.test('former bugs', function(t) {
                this.test("exception in returned future", function(t) {
                    this.count(1)

                    var d = require('domain').create()
                    d.on('error', function(err) {
                        t.ok(err.message === "Inner Exception1", err.message)
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

                    var d = require('domain').create()
                    d.on('error', function(err) {
                        t.ok(err.message === "Inner Exception2", err.message)
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

                    var d = require('domain').create()
                    d.on('error', function(err) {
                        t.ok(true)
                    })
                    d.run(function() {
                        Future(true).finally(function() {
                            var innerf = new Future
                            innerf.throw("test")

                            return innerf
                        }).done()
                    })
                })
            })
        })
    }).done()
}).writeConsole()


