"use strict";

var Unit = require('deadunit')
var tests = require('./asyncFuturesTests')

var test = Unit.test("Testing async futures", tests).writeConsole()


