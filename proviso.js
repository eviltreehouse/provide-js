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
				_props.push(def);
			}
		});
		
		var _statics = [];
		_props.forEach((prop) => {
			if (prop[0].toLowerCase() == 'extends') {
				_super = prop[1];
			} else if (prop[0].toUpperCase() == prop[0]) {
				_statics.push(prop);
			}
		});
		
		if (! _constructor) {
			_constructor = function() {};
		}
		
		console.info('className', className);
		console.info('props', _props);
		console.info('methods', _methods);
		console.info('dynprops', _dynprops);
		
		_constructor.prototype = Object.create(_super && _super.prototype ? _super.prototype : null, _buildDefinition(_statics, _dynprops) );
		for (var mi in _methods) {
			_constructor.prototype[_methods[mi].name] = _methods[mi];
		}
		
		if (_super) {
			_constructor.prototype['$super'] = _super;
		}
		
		$w[ className ] = _constructor;
	}
	
	function _buildDefinition(statics, dynprops) {
		var o = {};
		statics.forEach((st) => {
			o[st[0]] = { 'value': st[1], 'configurable': false }
		});
		
		for (var pk in dynprops) {
			var propdef = { 'readable': true, 'writable': true, 'configurable': false };
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
		
		//console.info('buildDef', o);
		return o;
	}
	
	function _methodType(m) {
		var _typ = null;
		var _qual = "";
		
		var nm = m.name;
		if (nm.match(/\$get$/)) {
			_typ = 'g';
			_qual = nm.replace(/\$get$/, '');
		} else if (nm.match(/\$set$/)) {
			_typ = 's';
			_qual = nm.replace(/\$set$/, '');
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
function TheThing$get()
function TheThing$set(v)
[ CLASS_CONSTANT => permvanent_val ]
[ 'extends' => SUPER ] => this.$super()



*/