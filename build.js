var fs = require('fs')

// atempting to work around npm bug https://github.com/npm/npm/issues/4134
setTimeout(function() {
    var build = require('build-modules')

    var buildDirectory = __dirname+'/generatedBuilds/'
    if(!fs.existsSync(buildDirectory)) {
        fs.mkdirSync(buildDirectory)
    }

    var copywrite = '/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/'

    console.log('building and minifying...')

    build(buildDirectory, 'asyncFuture', copywrite, __dirname + '/asyncFuture.js', undefined, function(e) {
        if(e !== undefined) {
            console.error(e.stack)
        } else {
            console.log('done building main bundle')
        }
    })
    
    // test bundle
    
    build(__dirname+'/test', 'asyncFuture.test.browser', '', __dirname + '/test/asyncFuture.test.browser.js', undefined, function(e) {
        if(e !== undefined) {
            console.error(e.stack)
        } else {
            console.log('done building test bundle')
        }
    })
    
}, 3000)


