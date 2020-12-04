
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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
        image: "./img/bed_fersken_lys.png"
    },{
        image: "./img/bed_fersken_dark.png"
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
                image: "./img/skatt_stjerne1.png"
            },{
                image: "./img/skatt_stjerne2.png"
            },{
                image: "./img/skatt_stjerne3.png"
            },{
                image: "./img/skatt_stjerne4.png"
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

    // (53:3) {:else}
    function create_else_block_2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*cardComp*/ ctx[3].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Bedriftskort");
    			attr_dev(img, "class", "svelte-1ok54gy");
    			add_location(img, file, 54, 5, 1164);
    			attr_dev(div, "class", "face back svelte-1ok54gy");
    			add_location(div, file, 53, 4, 1097);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[13], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cardComp*/ 8 && img.src !== (img_src_value = /*cardComp*/ ctx[3].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(53:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:3) {#if !companyCard}
    function create_if_block_2(ctx) {
    	let div;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "face front svelte-1ok54gy");
    			add_location(div, file, 50, 4, 1012);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			dispose = listen_dev(div, "click", /*click_handler*/ ctx[12], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(50:3) {#if !companyCard}",
    		ctx
    	});

    	return block;
    }

    // (64:3) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*cardTax*/ ctx[4].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Skattekort");
    			attr_dev(img, "class", "svelte-1ok54gy");
    			add_location(img, file, 65, 5, 1444);
    			attr_dev(div, "class", "face back svelte-1ok54gy");
    			add_location(div, file, 64, 4, 1381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			dispose = listen_dev(div, "click", /*click_handler_3*/ ctx[15], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cardTax*/ 16 && img.src !== (img_src_value = /*cardTax*/ ctx[4].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(64:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:3) {#if !taxCard}
    function create_if_block_1(ctx) {
    	let div;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "face front svelte-1ok54gy");
    			add_location(div, file, 61, 4, 1297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			dispose = listen_dev(div, "click", /*click_handler_2*/ ctx[14], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(61:3) {#if !taxCard}",
    		ctx
    	});

    	return block;
    }

    // (75:3) {:else}
    function create_else_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*cardSabo*/ ctx[5].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Sabotasjekort");
    			attr_dev(img, "class", "svelte-1ok54gy");
    			add_location(img, file, 76, 5, 1725);
    			attr_dev(div, "class", "face back svelte-1ok54gy");
    			add_location(div, file, 75, 4, 1661);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			dispose = listen_dev(div, "click", /*click_handler_5*/ ctx[17], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cardSabo*/ 32 && img.src !== (img_src_value = /*cardSabo*/ ctx[5].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(75:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (72:3) {#if !saboCard}
    function create_if_block(ctx) {
    	let div;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "face front svelte-1ok54gy");
    			add_location(div, file, 72, 4, 1576);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			dispose = listen_dev(div, "click", /*click_handler_4*/ ctx[16], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(72:3) {#if !saboCard}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;

    	function select_block_type(ctx, dirty) {
    		if (!/*companyCard*/ ctx[0]) return create_if_block_2;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*taxCard*/ ctx[1]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (!/*saboCard*/ ctx[2]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div3 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			if_block1.c();
    			t1 = space();
    			div2 = element("div");
    			if_block2.c();
    			attr_dev(div0, "class", "card company flipped svelte-1ok54gy");
    			add_location(div0, file, 48, 2, 951);
    			attr_dev(div1, "class", "card tax flipped svelte-1ok54gy");
    			add_location(div1, file, 59, 2, 1244);
    			attr_dev(div2, "class", "card sabo flipped svelte-1ok54gy");
    			add_location(div2, file, 70, 2, 1521);
    			attr_dev(div3, "class", "container svelte-1ok54gy");
    			add_location(div3, file, 46, 1, 924);
    			attr_dev(main, "class", "svelte-1ok54gy");
    			add_location(main, file, 45, 0, 916);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div0);
    			if_block0.m(div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			if_block1.m(div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			if_block2.m(div2, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div2, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_block1.d();
    			if_block2.d();
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

    function instance($$self, $$props, $$invalidate) {
    	let companyCard = false;
    	let taxCard = false;
    	let saboCard = false;
    	let cardComp = 0;
    	let cardTax = 0;
    	let cardSabo = 0;

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
    		if ($$invalidate(0, companyCard = true)) pickCompCard();
    	};

    	const pushTaxCards = () => {
    		if ($$invalidate(1, taxCard = true)) pickTaxCard();
    	};

    	const pushSaboCards = () => {
    		if ($$invalidate(2, saboCard = true)) pickSaboCard();
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
