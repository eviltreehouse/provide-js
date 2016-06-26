/* @INFO
PROVISO is a companion utility module to `provide` that provides as DSL-esque approach
to Object.create and Object.defineProperties. Maybe it'll be helpful -- maybe it won't.
We'll see :P

Copyright (C) 2016 EvilTreeHouse.com. Free software: open/edit at will.
*/

!function($w, As) {
	
	function $proviso(className, dsl) {
		var _constructor;
		var _props = [];
		var _methods = [];
		var _dynprops = {};
		var _defs = [];
		var _super    = null;
		
		dsl.forEach((def) => {
			if (typeof def == 'function') {
				var deftype = _methodType(def);
				if (deftype[0] == 'c') {
					_constructor = def;
				} else if (deftype[0] == 'gp') {
					_methods.push(def);
				} else if (deftype[0] in {'g': true,'s': true}) {
					if (!_dynprops[deftype[1]]) _dynprops[deftype[1]] = {};
					_dynprops[deftype[1]][ deftype[0] ] = def;
				}
			} else if (typeof def == 'object') {
				_defs.push(def);
			}
		});
		
		var _statics = [];
		_defs.forEach((def) => {
			if (def[0].toLowerCase() == 'extends') {
				_super = def[1];
			} else if (def[0].match(/^\./)) {
				_props.push(def);
			} else if (def[0].toUpperCase() == def[0]) {
				_statics.push(def);
			}
		});
		
		if (! _constructor) {
			_constructor = function() {};
		}
		
//		console.info('className', className);
//		console.info('props', _props);
//		console.info('methods', _methods);
//		console.info('dynprops', _dynprops);
		
		_constructor.prototype = Object.create(_super && _super.prototype ? _super.prototype : null, _buildDefinition(_statics, _props, _dynprops) );
		for (var mi in _methods) {
			_constructor.prototype[_methods[mi].name] = _methods[mi];
		}
		
		if (_super) {
			_constructor.prototype['$super'] = _super;
		}
		
		$w[ className ] = _constructor;
	}
	
	function _buildDefinition(statics, props, dynprops) {
		var o = {};
		statics.forEach((st) => {
			o[st[0]] = { 'value': st[1], 'configurable': false }
		});
		
		props.forEach((prop) => {
			var propnm = prop[0]; propnm = propnm.replace(/^\./, '');
			var def_val = prop.length == 3 ? prop[2] : undefined;
			o[ propnm ] = { 'readable': false, 'writable': false, 'configurable': false, 'enumerable': propnm.match(/^_/) ? false : true };
			if (def_val != undefined) o[propnm].value = def_val;
			
			if (prop[1].toLowerCase() == 'rw') {
				o[propnm].readable = o[propnm].writable = true;	
			} else if (prop[1].toLowerCase() == 'ro') {
				o[propnm].readable = true;
			} else if (prop[1].toLowerCase() == 'wo') {
				o[propnm].writable = true;
			}
		});
		
		for (var pk in dynprops) {
			var propdef = { 'configurable': false };
			if (dynprops[pk].g) {
				delete propdef.readable;
				propdef['get'] = dynprops[pk].g;
			}
			if (dynprops[pk].s) {
				delete propdef.writable;
				propdef['set'] = dynprops[pk].s;
			}
			
			o[pk] = propdef;
		}
		
		console.info('buildDef', o);
		return o;
	}
	
	function _methodType(m) {
		var _typ = null;
		var _qual = "";
		
		var nm = m.name;
		if (nm.match(/^\$/)) {
			_typ = 'g';
			_qual = nm.replace(/^\$/, '');
		} else if (nm.match(/\$$/)) {
			_typ = 's';
			_qual = nm.replace(/\$$/, '');
		} else if (nm == '_') {
			_typ = 'c';
			_qual = null;
		} else if (nm == nm.toUpperCase()) {
			_typ = 'cv';
			_qual = nm;
		} else {
			_typ = 'gp';
			_qual = nm;
		}
		
		var ret = [ _typ, _qual ];
		console.debug(nm, ret);
		return ret;
	}
	
	
	$w[As] = $proviso;
}(this, '$refine');


/* ==== SCRATCH ====

function _() (constructor def)
function $thing() [get]
function thing$(v) [set]
[ CLASS_CONSTANT => permvanent_val ]
[ 'extends' => SUPER ] => this.$super()
[ '.property', 'rw', 'default_value' ]

*/