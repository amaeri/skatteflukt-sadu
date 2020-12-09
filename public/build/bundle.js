
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    let compList = [{
                image: "./img/bed_appelsin_lys.png"
            },{
                image: "./img/bed_appelsin_dark.png"
            },{
                image: "./img/bed_avokado_lys.png"
            },{
                image: "./img/bed_avokado_dark.png"
            },{
                image: "./img/bed_fersken_lys.png"
            },{
                image: "./img/bed_fersken_dark.png"
            },{
                image: "./img/bed_granateple_lys.png"
            },{
                image: "./img/bed_granateple_dark.png"
            },{
                image: "./img/bed_jordbar_lys.png"
            },{
                image: "./img/bed_jordbar_dark.png"
            },{
                image: "./img/bed_kiwi_lys.png"
            },{
                image: "./img/bed_kiwi_dark.png"
            },{
                image: "./img/bed_kokos_lys.png"
            },{
                image: "./img/bed_kokos_dark.png"
            },{
                image: "./img/bed_mango_lys.png"
            },{
                image: "./img/bed_mango_dark.png"
            },{
                image: "./img/bed_melon_lys.png"
            },{
                image: "./img/bed_melon_dark.png"
            },{
                image: "./img/bed_pare_lys.png"
            },{
                image: "./img/bed_pare_dark.png"
            },{
                image: "./img/bed_sitron_lys.png"
            },{
                image: "./img/bed_sitron_dark.png"
            },{
                image: "./img/bed_stjernefrukt_lys.png"
            },{
                image: "./img/bed_stjernefrukt_dark.png"
            }
        ];

    let taxList = [{
                image: "./img/skatt_appelsin1.png"
            },{
                image: "./img/skatt_appelsin2.png"
            },{
                image: "./img/skatt_appelsin3.png"
            },{
                image: "./img/skatt_appelsin4.png"
            },{
                image: "./img/skatt_avokado1.png"
            },{
                image: "./img/skatt_avokado2.png"
            },{
                image: "./img/skatt_avokado3.png"
            },{
                image: "./img/skatt_avokado4.png"
            },{
                image: "./img/skatt_fersken1.png"
            },{
                image: "./img/skatt_fersken2.png"
            },{
                image: "./img/skatt_fersken3.png"
            },{
                image: "./img/skatt_fersken4.png"
            },{
                image: "./img/skatt_granateple1.png"
            },{
                image: "./img/skatt_granateple2.png"
            },{
                image: "./img/skatt_granateple3.png"
            },{
                image: "./img/skatt_granateple4.png"
            },{
                image: "./img/skatt_jordbar1.png"
            },{
                image: "./img/skatt_jordbar2.png"
            },{
                image: "./img/skatt_jordbar3.png"
            },{
                image: "./img/skatt_jordbar4.png"
            },{
                image: "./img/skatt_kiwi1.png"
            },{
                image: "./img/skatt_kiwi2.png"
            },{
                image: "./img/skatt_kiwi3.png"
            },{
                image: "./img/skatt_kiwi4.png"
            },{
                image: "./img/skatt_kokos1.png"
            },{
                image: "./img/skatt_kokos2.png"
            },{
                image: "./img/skatt_kokos3.png"
            },{
                image: "./img/skatt_kokos4.png"
            },{
                image: "./img/skatt_mango1.png"
            },{
                image: "./img/skatt_mango2.png"
            },{
                image: "./img/skatt_mango3.png"
            },{
                image: "./img/skatt_mango4.png"
            },{
                image: "./img/skatt_pare1.png"
            },{
                image: "./img/skatt_pare2.png"
            },{
                image: "./img/skatt_pare3.png"
            },{
                image: "./img/skatt_pare4.png"
            },{
                image: "./img/skatt_sitron1.png"
            },{
                image: "./img/skatt_sitron2.png"
            },{
                image: "./img/skatt_sitron3.png"
            },{
                image: "./img/skatt_sitron4.png"
            },{
                image: "./img/skatt_stjernefrukt1.png"
            },{
                image: "./img/skatt_stjernefrukt2.png"
            },{
                image: "./img/skatt_stjernefrukt3.png"
            },{
                image: "./img/skatt_stjernefrukt4.png"
            }
        ];

    let saboList = [{
                image: "./img/sabo_bed1.png"
            },{
                image: "./img/sabo_bed2.png"
            },{
                image: "./img/sabo_bed3.png"
            },{
                image: "./img/sabo_bed4.png"
            },{
                image: "./img/sabo_inst1.png"
            },{
                image: "./img/sabo_inst2.png"
            },{
                image: "./img/sabo_inst3.png"
            },{
                image: "./img/sabo_inst4.png"
            },{
                image: "./img/sabo_skatt1.png"
            },{
                image: "./img/sabo_skatt2.png"
            },{
                image: "./img/sabo_skatt3.png"
            },{
                image: "./img/sabo_skatt4.png"
            }
        ];

    /* src/App.svelte generated by Svelte v3.19.1 */
    const file = "src/App.svelte";

    // (78:3) {:else}
    function create_else_block_2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*cardComp*/ ctx[3].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Bedriftskort");
    			attr_dev(img, "class", "svelte-1f0gz4s");
    			add_location(img, file, 79, 5, 1582);
    			attr_dev(div, "class", "face back svelte-1f0gz4s");
    			add_location(div, file, 78, 4, 1499);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[13], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*cardComp*/ 8 && img.src !== (img_src_value = /*cardComp*/ ctx[3].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(78:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (75:3) {#if !companyCard}
    function create_if_block_2(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "face front svelte-1f0gz4s");
    			add_location(div, file, 75, 4, 1398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler*/ ctx[12], false, false, false);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(75:3) {#if !companyCard}",
    		ctx
    	});

    	return block;
    }

    // (89:3) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*cardTax*/ ctx[4].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Skattekort");
    			attr_dev(img, "class", "svelte-1f0gz4s");
    			add_location(img, file, 90, 5, 1886);
    			attr_dev(div, "class", "face back svelte-1f0gz4s");
    			add_location(div, file, 89, 4, 1807);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler_3*/ ctx[15], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*cardTax*/ 16 && img.src !== (img_src_value = /*cardTax*/ ctx[4].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(89:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (86:3) {#if !taxCard}
    function create_if_block_1(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "face front svelte-1f0gz4s");
    			add_location(div, file, 86, 4, 1707);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler_2*/ ctx[14], false, false, false);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(86:3) {#if !taxCard}",
    		ctx
    	});

    	return block;
    }

    // (100:3) {:else}
    function create_else_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*cardSabo*/ ctx[5].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Sabotasjekort");
    			attr_dev(img, "class", "svelte-1f0gz4s");
    			add_location(img, file, 101, 5, 2191);
    			attr_dev(div, "class", "face back svelte-1f0gz4s");
    			add_location(div, file, 100, 4, 2111);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler_5*/ ctx[17], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*cardSabo*/ 32 && img.src !== (img_src_value = /*cardSabo*/ ctx[5].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(100:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:3) {#if !saboCard}
    function create_if_block(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "face front svelte-1f0gz4s");
    			add_location(div, file, 97, 4, 2010);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler_4*/ ctx[16], false, false, false);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, turn, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(97:3) {#if !saboCard}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;
    	let t2;
    	let div4;
    	let div1;
    	let current_block_type_index;
    	let if_block0;
    	let t3;
    	let div2;
    	let current_block_type_index_1;
    	let if_block1;
    	let t4;
    	let div3;
    	let current_block_type_index_2;
    	let if_block2;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*companyCard*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_1, create_else_block_1];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*taxCard*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	const if_block_creators_2 = [create_if_block, create_else_block];
    	const if_blocks_2 = [];

    	function select_block_type_2(ctx, dirty) {
    		if (!/*saboCard*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index_2 = select_block_type_2(ctx);
    	if_block2 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Trykk èn gang for å åpne et kort, trykk èn gang til for å lukke kortet";
    			t2 = space();
    			div4 = element("div");
    			div1 = element("div");
    			if_block0.c();
    			t3 = space();
    			div2 = element("div");
    			if_block1.c();
    			t4 = space();
    			div3 = element("div");
    			if_block2.c();
    			if (img.src !== (img_src_value = "./img/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "svelte-1f0gz4s");
    			add_location(img, file, 67, 2, 1190);
    			attr_dev(p, "class", "svelte-1f0gz4s");
    			add_location(p, file, 68, 2, 1230);
    			attr_dev(div0, "id", "logo");
    			attr_dev(div0, "class", "svelte-1f0gz4s");
    			add_location(div0, file, 66, 1, 1172);
    			attr_dev(div1, "class", "card company svelte-1f0gz4s");
    			add_location(div1, file, 73, 2, 1345);
    			attr_dev(div2, "class", "card tax svelte-1f0gz4s");
    			add_location(div2, file, 84, 2, 1662);
    			attr_dev(div3, "class", "card sabo svelte-1f0gz4s");
    			add_location(div3, file, 95, 2, 1963);
    			attr_dev(div4, "class", "container svelte-1f0gz4s");
    			add_location(div4, file, 71, 1, 1318);
    			attr_dev(main, "class", "svelte-1f0gz4s");
    			add_location(main, file, 65, 0, 1164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(main, t2);
    			append_dev(main, div4);
    			append_dev(div4, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			if_blocks_1[current_block_type_index_1].m(div2, null);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			if_blocks_2[current_block_type_index_2].m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div1, null);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div2, null);
    			}

    			let previous_block_index_2 = current_block_type_index_2;
    			current_block_type_index_2 = select_block_type_2(ctx);

    			if (current_block_type_index_2 === previous_block_index_2) {
    				if_blocks_2[current_block_type_index_2].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_2[previous_block_index_2], 1, 1, () => {
    					if_blocks_2[previous_block_index_2] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks_2[current_block_type_index_2];

    				if (!if_block2) {
    					if_block2 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    					if_block2.c();
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div3, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    			if_blocks_2[current_block_type_index_2].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function turn(node, { delay = 0, duration = 600 }) {
    	return {
    		delay,
    		duration,
    		css: (t, u) => `
					transform: rotateY(${1 - u * 180}deg);
					backface-visibility: hidden;
				`
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let companyCard;
    	let taxCard;
    	let saboCard;
    	let cardComp;
    	let cardTax;
    	let cardSabo;

    	const pickCompCard = () => {
    		let randomCompCard = Math.round(Math.random() * (compList.length - 1));
    		$$invalidate(3, cardComp = compList[randomCompCard]);
    	};

    	const pickTaxCard = () => {
    		let randomTaxCard = Math.round(Math.random() * (taxList.length - 1));
    		$$invalidate(4, cardTax = taxList[randomTaxCard]);
    	};

    	const pickSaboCard = () => {
    		let randomSaboCard = Math.round(Math.random() * (saboList.length - 1));
    		$$invalidate(5, cardSabo = saboList[randomSaboCard]);
    	};

    	const pushCompCards = () => {
    		if ($$invalidate(0, companyCard = true)) {
    			pickCompCard();
    		}
    	};

    	const pushTaxCards = () => {
    		if ($$invalidate(1, taxCard = true)) {
    			pickTaxCard();
    		}
    	};

    	const pushSaboCards = () => {
    		if ($$invalidate(2, saboCard = true)) {
    			pickSaboCard();
    		}
    	};

    	const click_handler = () => pushCompCards();
    	const click_handler_1 = () => $$invalidate(0, companyCard = false);
    	const click_handler_2 = () => pushTaxCards();
    	const click_handler_3 = () => $$invalidate(1, taxCard = false);
    	const click_handler_4 = () => pushSaboCards();
    	const click_handler_5 = () => $$invalidate(2, saboCard = false);

    	$$self.$capture_state = () => ({
    		compList,
    		taxList,
    		saboList,
    		companyCard,
    		taxCard,
    		saboCard,
    		cardComp,
    		cardTax,
    		cardSabo,
    		pickCompCard,
    		pickTaxCard,
    		pickSaboCard,
    		pushCompCards,
    		pushTaxCards,
    		pushSaboCards,
    		turn,
    		Math
    	});

    	$$self.$inject_state = $$props => {
    		if ("companyCard" in $$props) $$invalidate(0, companyCard = $$props.companyCard);
    		if ("taxCard" in $$props) $$invalidate(1, taxCard = $$props.taxCard);
    		if ("saboCard" in $$props) $$invalidate(2, saboCard = $$props.saboCard);
    		if ("cardComp" in $$props) $$invalidate(3, cardComp = $$props.cardComp);
    		if ("cardTax" in $$props) $$invalidate(4, cardTax = $$props.cardTax);
    		if ("cardSabo" in $$props) $$invalidate(5, cardSabo = $$props.cardSabo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		companyCard,
    		taxCard,
    		saboCard,
    		cardComp,
    		cardTax,
    		cardSabo,
    		pushCompCards,
    		pushTaxCards,
    		pushSaboCards,
    		pickCompCard,
    		pickTaxCard,
    		pickSaboCard,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
