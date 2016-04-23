// [[ Provide.js ]] -- light-weight dependency injection for modular code bases.      @INFO
// version 0.9.5																	  @INFO
// Copyright (c) 2016 EvilTreeHouse.com												  @INFO
// http://eviltreehouse.com / http://github.com/eviltreehouse / @eviltreehouse		  @INFO
// This is free software. Use/modify to your heart's content :)						  @INFO

!function(_window, As) {
	var readying = false;
	
	function $provide(needs, provides, f) {
		if (arguments.length == 1) return $provide.attach(arguments[0]);

		//console.info('Providing', module);
		if (! $provide.modules) $provide.modules = {};

		$provide.modules[ provides ] = { 'module': null, 'needs': needs, 'ready': false, 'f': f };
		if ($provide.isReady(provides)) {
			$provide.ready();
		}
	}
	
	$provide.pkg = function(_pkg, base_path) {
		if (! $provide.pkgs) $provide.pkgs = {};
		if (_pkg == 'main' || _pkg == null) _pkg = '*';
		
		$provide.pkgs[_pkg] = { 
			'load_path': base_path
		};
		
		return $provide;
	};
	
	$provide.getPkg = function(req) {
		// @TODO look at the requested module and scan for registered pkg definitions
		// If none, use the default 'main/NULL' one. For now, just force that.
		return $provide.pkgs['*'];
	};
	
	$provide.getScriptPath = function(module) {
		// @TODO
		return [$provide.getPkg(module), module].join("/") + ".js";
	};

	$provide.isReady = function(m) {
		if (! $provide.modules[m]) return false;

		if ($provide.modules[m].needs.length == 0) return true;
		var _ready = true;
		$provide.modules[m].needs.forEach(function(need) {
			if (! _ready) return;
			//console.log(m, 'wants', need, 'isReady?', $provide.isReady(need));
			if ((! $provide.isReady(need)) || (! $provide.modules[need].ready)) {
				//console.warn( $provide.modules[need] );
				_ready = false;
//			} else {
//				console.debug(need, 'is', $provide.modules[need].module);
			}
		});
		
//		if (_ready) {
//			console.info( 'isReady says yes?', $provide.modules[m]);
//		}

		return _ready;
	};

	$provide.ready = function(rerun) {
		if (readying && (!rerun)) {
			setTimeout(function() { $provide.ready(); }, 50);
			return;
		}
		
		readying = true;
		
		var _updated = false;
		for (var mod in $provide.modules) {
			if ($provide.isReady(mod) && $provide.modules[mod].ready == false) {
				//console.log(mod,'seems to be ready now!');
				var deps = [];
				$provide.modules[mod].needs.forEach(function(dep) {
					deps.push($provide.modules[dep].module);
				});
				
				//console.log('ready-ing',mod,'with',deps);

				$provide.modules[mod].module = $provide.modules[mod].f.apply(null, deps);
				if ($provide.modules[mod].module) {
					//console.debug(mod,'readied as', $provide.modules[mod].module);
					$provide.modules[mod].ready = true;
					_updated = true;
//				} else {
//					console.error(mod, 'did not resolve to a module?!');
				}
//			} else if (! $provide.isReady(mod)) {
//				console.log(mod, 'is NOT ready...');
			}
		}
		
		// Run again to resolve any new dep resolutions...
		if (_updated) {
			return $provide.ready(true);
		}
		else readying = false;
	};

	$provide.attach = function(modules) {
		modules = typeof modules == 'string' ? [ modules ] : modules;

		for (var mi in modules) {
//			console.log('attach-ing', modules[mi]);
			var module = modules[mi];
			var script = document.createElement('SCRIPT');
			
			script.setAttribute('src', $provide.getScriptPath(module));
			script.setAttribute('type', 'text/javascript');
			script.innerHTML = "";
			script.addEventListener('load', function(e) { $provide.ready(); });
			document.body.appendChild(script);
			//console.log(script);			
		}
	};

	$provide.me = function(m) {
		// manual import.
		if (! $provide.modules[m]) {
			throw new Error(m + " not available.");
		} else if (! $provide.modules[m].ready) {
			throw new Error(m + " not available due to dependency issue.");
		} else {
			return $provide.modules[m].module;
		}
	};
	
	// Set up default load path.
	$provide.pkg(null, '/js');
	
	_window[As] = $provide;
}(this, '$provide');