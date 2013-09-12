//      ________       _       __           __                        ___
//     /_  __/ /_  ___| |     / /___  _____/ /_____  __________      /  /
//      / / / __ \/ _ \ | /| / / __ \/ ___/ //_/ _ \/ ___/ ___/     /  /
//     / / / / / /  __/ |/ |/ / /_/ / /  / ,< /  __/ /  (__  )    _/ ./
//    /_/ /_/ /_/\___/|__/|__/\____/_/  /_/|_|\___/_/  /____/    / ./
//                                                      .net    / /
//                                                         .   /./
//    W.js - http://theworkers.github.com/W.js/       ..   |  //  .
//                                                 .   \\  | /' .'  .
//                                                  ~-. `     ' .-~
//
//    Portions of W.js are inspired or borrowed from:
//     - [underscore.js](http://underscorejs.org/)
//     - [backbone.js](http://backbonejs.org/)
//     - [pathjs](https://github.com/mtrpcic/pathjs)
//
(function () {
    // module setup inspired by underscore.js
    var root = this;
    var W = root.W || {};
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = W;
        root.W = W;
    } else {
        root.W = W;
    }

    /** Current version. */
    W.version = '2.1.0';

    // Inspired/taken from underscore.js
    // Underscore.js 1.3.1
    // (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
    // Underscore is freely distributable under the MIT license.
    // Portions of Underscore are inspired or borrowed from Prototype,
    // Oliver Steele's Functional, and John Resig's Micro-Templating.
    // For all details and documentation:
    // http://documentcloud.github.com/underscore
    var nativeForEach   = Array.prototype.forEach,
        nativeBind      = Function.prototype.bind,
        slice           = Array.prototype.slice,
        breaker         = {};
    W.extend = function(obj) {
        W.each(slice.call(arguments, 1), function(source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        });
        return obj;
    };
    W.each = function(obj, iterator, context) {
        if (obj === null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            for (var key in obj) {
                if (_.has(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) return;
                }
            }
        }
    };
    var ctor = function(){};
    /**
     * Bind function to scope. Useful for events.
     * @param   {Function}   fn     function
     * @param   {Object}     scope    Scope of the function to be executed in
     * @example $("div").fadeIn(100, W.bind(this, this.transitionDidFinish));
    */
    W.bind = function bind(fn, scope) {
        var bound, args;
        if (fn.bind === nativeBind && nativeBind) return nativeBind.apply(fn, slice.call(arguments, 1));
        args = slice.call(arguments, 2);
        // @todo: don't link this
        return bound = function() {
            if (!(this instanceof bound)) return fn.apply(scope, args.concat(slice.call(arguments)));
            ctor.prototype = fn.prototype;
            var self = new ctor();
            var result = fn.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) return result;
            return self;
        };
    };

    W.clone = function (obj) {
        var target = {};
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                target[i] = obj[i];
            }
        }
        return target;
    };

    // for help with snippets, and
    // for people who don't like namespacing
    // reservse bind. If no context will bind to W.
    W.use = function (lib, context) {
        lib = (typeof lib == "string") ? W.snippet[lib] : lib;
        if (!context) {
             W.extend(W, lib);
            return lib;
        } else {
            W.extend(context, lib);
        }
        return lib;
    };

    /**
    * Asynchronous Loop
    *
    * @param   {Number}    iterations      Number of times to run
    * @param   {Function}  fn            Function to execute in  iteration.
    *                                      Must call loop.next() when finished.
    * @param   {Function}  callback        On loop finshed call back
    *
    * @example
    *      W.aloop(10,
    *           function (index, next, end) {
    *               log(index);
    *               next();
    *           },
    *           function () {
    *               log('finished');
    *           }
    *       );
    */
    W.loop = function (iterations, fn, callback) {
        var index = 0;
        var done = false;
        var end =  function() {
            done = true;
            callback();
        };
        var next = function() {
            if (done) { return; }
            if (index < iterations) {
                index++;
                fn(index-1, next, end);
            } else {
                done = true;
                if (callback) { callback(); }
            }
        };
        next();
        return next;
    };


    var Sequencer = function Sequence(fn) {
        var self = this;
        var fns = [];
        var done = function () {
            fns.shift();
            if (fns.length > 0) { triggerFn(fns[0]); }
            return self;
        };
        this.then = function (fn) {
            fns.push(fn);
            return self;
        };
        this.delay = function (ms) {
            self.then(function (done) {
                setTimeout(done, ms);
            });
            return self;
        };
        this.start = function () {
            triggerFn(fns[0]);
            return self;
        };
        function triggerFn (fn) {
            // it expects an done object
            if (fn.length > 0) {
                fn(done);
            } else {
                fn();
                done();
            }
        }
        if (typeof fn === 'function') {
            this.then(fn);
        }
        return this;
    };

    /**
     * A function sequencer with `delay` and `then` methods. Functions passed to `then` can have an optional argument `done` which can be used to trigger the function finishing
     * @param  {Function} fn optional first argument
     * @return {[Sequencer]} object with `delay` and `then` methods.
     * @example
     *     sequence(function (done) {
     *         console.log(0);
     *         done();
     *     })
     *     .then(function (done) {
     *         console.log(1);
     *         done();
     *     })
     *     .delay(1000)
     *     .then(function () {
     *         console.log(2);
     *     })
     *     .delay(1000)
     *     .then(function (done) {
     *         console.log(3);
     *         done();
     *     })
     *     .delay(1000)
     *     .then(function (done) {
     *         console.log(4);
     *         done();
     *     })
     *     .start();
     */
    W.sequence = function (fn) {
        return new sequence.Sequencer(fn);
    };


})();
