"use strict";

var Unit = require('deadunit/deadunit.browser')
var tests = require('./asyncFuturesTests')

var test = Unit.test("Testing async futures", tests).writeHtml()
