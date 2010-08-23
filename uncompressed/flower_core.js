/*	

flower_core.js v1.0

Flower core class
part of the CASH Music Flower code
more information/downloads available at: http://cashmusic.org/tools/

revisions:
+ 1.0: initial release

requires:
+ mootools v 1.2.4

distributed under a BSD license, terms:
Copyright (c) 2010, CASH Music
All rights reserved.
 
Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:
 
Redistributions of source code must retain the above copyright notice, this list 
of conditions and the following disclaimer. Redistributions in binary form must 
reproduce the above copyright notice, this list of conditions and the following 
disclaimer in the documentation and/or other materials provided with the 
distribution. Neither the name of CASH Music nor the names of its contributors 
may be used to endorse or promote products derived from this software without 
specific prior written permission.
 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT 
NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR 
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

*/

var FlowerDebug = new Class({
	/*
	Class FlowerDebug
	
	Adds additional debug functionality to existing classes.
		
	*/
	debug: 0,
	flowerCore: false,
	
	setFlowerCore: function(flowerObj) {
		/*
		Function setFlowerCore(object flowerObj)
		
		Sets a pointer to the main Flower Core object
		
		*/
		this.flowerCore = flowerObj;
		this.debug = this.flowerCore.debug;
		
		// check for console

		if(typeof(console) != 'object') {var console = {};}
		if(!console.log) {console.log = function(){};}
		if(!console.warn) {console.warn = console.log;}
		if(!console.error) {console.error = console.warn;}
	},
	
	debugMsg: function(type,msg) {
		if (this.debug) {
			var moduleName = '',
				msgTypes;
			type = type + 0;
			if (this.flowerCore && this.name) {moduleName = '[' + this.name + '] ';}
			msgTypes = ['Flower Error: ','Flower Warning: ','Flower Notice: '];
			switch(type) {
			case 0:
				console.error(msgTypes[type] + moduleName + msg);
			  break;
			case 1:
				console.warn(msgTypes[type] + moduleName + msg);
			  break;
			default:
				console.log(msgTypes[type] + moduleName + msg);
			}
		}
	},
	
	debugLoadMsg: function() {
		if (this.debug) {
			var logStr = 'Flower Module Loaded: ' + this.name + ' (v' + this.version + ')',
				allOptions = this.listAllOptions();
			if (allOptions) {logStr += '\n\tOptions:\n\t' + allOptions;}
			console.log(logStr.replace(/, /g,'\n\t'));
		}
	},
	
	listAllOptions: function() {
		/*
		Function listAllOptions()
		
		Lists all options passed to a Moo class as a plain text string, returns false 
		in the absence of any options.
		
		*/
		if (!this.donotdebugoptions) {
			var optionString = '',
				leadingComma = '',
				addQuote = '';
			$H(this.options).each(function(optionValue,optionName){
				if (typeof(optionValue) == 'string') {addQuote = '\'';}
				optionString += leadingComma + optionName + ' = ' + addQuote + optionValue + addQuote;
				leadingComma = ', ';
				addQuote = '';
			});
			if (optionString) {
				return optionString;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
});

var FlowerCore = new Class({
	/*
	Class FlowerCore
	
	The Flower Core is a dynamic application manager capable of loading, managing, and
	interacting with multiple objects across multiple external javascript files —
	even cross domain. Each object, or module, can be defined on-the-fly or as part
	of the core library, with dependencies and CSS selector conditions to trigger
	an automatic launch. Modules can also be loaded by request, with every load
	firing a moduleLoad event when successfully initiated. Those events, combined 
	with a primary bootComplete event fired at the completion of all auto-loading 
	modules, provide event-based application management that ensures an object will 
	only be requested after it is fully ready.
	

	OPTIONS:
	+ debug (0)
	  if true, debug information will be sent to the console
	  
	+ autoBoot (0)
	  if true, Flower will scan the page for specified selectors and auto-launch
	  appropriate modules
	  
	+ timeout (500)
	  the number of ms a module is permitted to load before it is declared not 
	  loaded (by error)

	EVENTS:
	+ moduleLoad (string moduleName)
	  fires when a module is loaded, returning the name of the module
	  
	+ bootComplete (bool)
	  fires after bootstrap() has been called and all modules are loaded or 
	  have timed out. returns true if all modules have been loaded, false if
	  fired on error/timeout
	  
	+ htmlChanged (mixed (string elementName) OR (element el))
	  fires when an element's html property has been changed. relies on module
	  to callback, so not absolute.
	  
	KEY METHODS:
	+ storeModule(string filePath,
				  string moduleName,
				  mixed (string dependencies) OR (false), 
				  string autoLaunchBySelectors, 
				  bool attachToLaunchSelectors,
				  bool relativePath)
	  stores module for loading/retrieving by name. dependencies should be set 
	  either to false, or a comma separated list of dependent module names. 
	  autoLaunchBySelectors should be a comma separated list of CSS selectors 
	  whose appearance in the DOM trigger the module. if attachToLaunchSelectors
	  is true, the module should call its attachToElement() method for each
	  selector. relativePath specifies if the filePath is relative to the current 
	  FlowerCore.js file, or if it is fully qualified. 
	  
	+ loadModule(string moduleName)
	  loads a module by name
	  
	+ getModule(string moduleName)
	  attempts to get a module by name, returning either a pointer object for the
	  initiated module, or null if the module has not been loaded
	  
	+ getModuleOptions(string moduleName)
	  returns a module's options property
	  
	+ setModuleOptions(string moduleName, object optionsObj)
	  sets a simple options object to pass to the initialization of a new module
	  object, allowing a module to be called with the specified options
	  
	+ clearAutoLoad(string moduleName)
	  clears a module's autoLaunchBySelectors property
	  
	+ addToAutoLoad(string moduleName, string selectorString)
	  accepts a comma separated list of CSS selectors to add to a module's
	  autoLaunchBySelectors property
	  
	+ bootstrap()
	  auto-launches all appropriate modules for the current page, firing the
	  bootComplete event when finished (successfully or not)
	
	*/
	Implements: [Options, Events, FlowerDebug],
	
	options: {
		debug: 0,
		autoBoot: 0,
		timeout: 500
	},
	
	initialize: function(options){
		this.setOptions(options);
		this.name = 'Flower';
		this.version = 1.0;
		this.modules = $H();
		this.commonCache = $H(); // common memory space for all Flower modules
		this.injectedFiles = [];
		this.debug = 0;
		this.timeout = this.options.timeout;
		this.documenthead = $$('head')[0];
		// determine file location as Flower library path
		var flower_core =  this.documenthead.getElement('script[src*=flower_core.js]');
		if (flower_core) {
			var src = flower_core.getProperty('src');
			this.libpath = src.substring(0,src.lastIndexOf("/")+1);
		}
		
		// hide/show ifjs_ specials
		$$('*.ifjs_visibilityhidden','div.flower_soundplayer').each(function(el){el.setStyle('visibility','hidden');});
		$$('*.ifjs_visibilityvisible').each(function(el){el.setStyle('visibility','visible');});
		$$('*.ifjs_displaynone').each(function(el){el.setStyle('display','none');});
		$$('*.ifjs_displayblock').each(function(el){el.setStyle('display','block');});
		$$('*.ifjs_displayinline').each(function(el){el.setStyle('display','inline');});
		
		// define and load up the standard library
		this.defineLibrary();
		if (this.options.autoBoot) {this.bootstrap();}
		
		if (this.options.debug && typeof(console) != 'undefined') {
			this.debug = 1;
			var allOptions = this.listAllOptions();
			if (this.libpath) {
				console.log('Flower (v' + this.version + ') loaded.\n\tPath: \'' + this.libpath + '\'' + '\n\tMooTools version: ' + MooTools.version + '\n\tOptions: ' + allOptions);
			} else {
				console.log('Flower loaded with errors. Version: ' + this.version + ' Path unknown. Please make sure the flower core JS file is named "flower_core.js"' + '\n\tOptions: ' + allOptions);
			}
		}
	},

	injectScript: function(scripturl,asFlower) {
		/*
		Function injectScript(string scripturl, bool asFlower)
		
		Injects a <script> element into the DOM head. If asFlower is true then scripturl will
		be treated as relative to this.libpath
		
		*/
		var injected;
		if (asFlower) {scripturl = this.libpath + scripturl;}
		if (this.injectedFiles.indexOf(scripturl) == -1) {
			injected = new Element('script', {
				'type': 'text/javascript',
				'src': scripturl
			}).injectInside(this.documenthead);
			this.injectedFiles.push(scripturl);
		}
	},
	
	htmlContentChanged: function(inElement) {
		/*
		Function htmlContentChanged(element or string inElement)
	
		Treats elements that have new content via javascript as if they had just been 
		loaded in the DOM — auto-attaching Flower modules, etc. 
	
		*/
		this.allModulesAutoAttach(inElement);
		this.fireEvent ('htmlChanged',inElement);
	},
	
	storeModule: function(filePath,moduleName,dependencies,autoLaunchBySelectors,attachToSelectors,relativePath) {
		/*
		Function storeModule(string filePath,string moduleName,
			mixed (string dependencies) OR (false), string autoLaunch, bool attachToSelectors,
			bool relativePath)
	
		Store information about Flower modules in this.modules, allowing for loading, auto-
		loading of dependencies, and auto-attaching to elements by selector.
		
		Dependencies should be comma separated, and dependent scripts *must* include 
		a moduleCallback() call
		
		Be careful not to loop dependencies.
		
		Paths should be relative to the libpath.
		
		attachToSelectors presumes the module refers to a returnable object containing an 
		addToElement(element) function that can accept the results of $$(autoLaunchBySelectors)
		
		*/
		var moduleObj = {
		   path: filePath,
		   dependencies: dependencies,
		   autoLaunch: autoLaunchBySelectors,
		   attach: attachToSelectors,
		   relativePath: relativePath,
		   pointer: null,
		   options: null
		};
		this.modules.set(moduleName, moduleObj);
	},
	
	loadModule: function(moduleName) {
		/*
		Function loadModule(string moduleName)
		
		Checks/inserts dependencies, waits for callbacks (if necessary), then inserts the
		requested module .
					
		*/
		var theModule = this.modules.get(moduleName),
			allDependencies;
		if (theModule) {
			if (theModule.pointer === null) {
				if (theModule.dependencies) {
					allDependencies = $A(theModule.dependencies.split(','));
					allDependencies.each(function(argument){
						if (this.modules.get(argument).pointer === null) {this.loadModule(argument);}
					}.bind(this));
					this.loadAfterDependencies(moduleName,allDependencies,0);
				} else {
					this.injectScript(theModule.path,theModule.relativePath);
				}
			} else {
				this.debugMsg(2,'requested module (\'' + moduleName + '\') already loaded');
				return false;
			}
		} else {
			this.debugMsg(0,'requested module (\'' + moduleName + '\') is not defined, cannot load');
			return false;
		}
	},
	
	loadAfterDependencies: function(moduleName,dependencies,iteration) {
		/*
		Function loadAfterDependencies(string moduleName, array dependencies, integer iteration)
		
		Checks status of dependencies, respawns if necessary, launches module
		once they are all loaded.
					
		*/
		var totalDependencies = dependencies.length,
			totalLoaded = 0,
			newiteration,
			newargs,
			theModule;
		dependencies.each(function(argument){
			if (this.modules.get(argument).pointer) {totalLoaded++;}
		}.bind(this));
		if (totalLoaded < totalDependencies) {
			if (iteration < this.timeout) {
				newiteration = iteration+100;
				newargs = [moduleName,dependencies,newiteration];
				this.loadAfterDependencies.delay(100,this,newargs);
			} else {
				this.debugMsg(0,'requested module (\'' + moduleName + 
					'\') could not load, dependency loading exceeded timeout');
			}
		} else {
			theModule = this.modules.get(moduleName);
			this.injectScript(theModule.path,theModule.relativePath);
		}
	},
	
	getModule: function(moduleName) {
		/*
		Function getModule(string moduleName)
		
		Wrapper function returns object pointer or null if not set.
					
		*/
		var objPointer = this.modules.get(moduleName);
		if (objPointer) {
			return objPointer.pointer;
		} else {
			return null;
		}
	},
	
	getModuleOptions: function(moduleName) {
		/*
		Function getModuleOptions(string moduleName)
		
		Wrapper function returns options object or null if not set.
					
		*/
		var objPointer = this.modules.get(moduleName);
		if (objPointer) {
			return objPointer.options;
		} else {
			return null;
		}
	},
	
	setModuleOptions: function(moduleName,optionsObj) {
		/*
		Function setModuleOptions(string moduleName, object optionsObj)
	
		Simple function copies current module object and returns it with specified options.
					
		*/
		var moduleObj = this.modules.get(moduleName);
		if (moduleObj) {moduleObj.options = optionsObj;}
		this.modules.set(moduleName,moduleObj);
	},
	
	setModulePointer: function(moduleName,objPointer) {
		/*
		Function setModulePointer(string moduleName, object objPointer)
	
		Simple function copies current module object and returns it with specified pointer.
					
		*/
		var moduleObj = this.modules.get(moduleName);
		if (moduleObj) {
			moduleObj.pointer = objPointer;
		}
		this.modules.set(moduleName,moduleObj);
	},
	
	moduleCallback: function(theModule) {
		/*
		Function moduleCallback(object or string theModule)
		
		Call-back function for Flower modules keeps main object aware of status and allows for 
		easier direct calls to each object where necessary
		
		Call-back expects an object with defined 'name' and 'version' properties, ideally 
		with flower_prototypes implemented. 
		
		*/
		if (typeof(theModule) == 'object') {
			if (this.modules.has(theModule.name)) {
				this.setModulePointer(theModule.name,theModule);
			} else {
				this.storeModule(0,theModule.name,0);
				this.setModulePointer(theModule.name,theModule);
			}
			this.fireEvent ('moduleLoad',theModule.name);
			theModule.debugLoadMsg();
			this.moduleAutoAttach(theModule.name);
		} else {
			this.debugMsg(0,'moduleCallback() must be provided with an object');
		}
	},
	
	moduleAutoAttach: function (moduleName,inElement) {
		/*
		Function moduleAutoAttach(string moduleName[, element or string inElement])
		
		Calls module.attachToElement() for a module's auto-attach elements. If 
		inElement is specified then only that element will be scanned for 
		auto-attach elements
		
		*/
		var moduleObj = this.modules.get(moduleName),
			allSelectors,
			allElementMatches;
		if (moduleObj.autoLaunch && moduleObj.attach && typeof(moduleObj.pointer.attachToElement) == 'function') {
			allSelectors = $A(moduleObj.autoLaunch.split(','));
			allElementMatches = $$(allSelectors);
			if (allElementMatches.length > 0) {
				if (!inElement) {
					$$(allSelectors).each(function(element){
						moduleObj.pointer.attachToElement(element);
					});
				} else {
					allSelectors.each(function(selector){
						document.id(inElement).getElements(selector).each(function(element){
							moduleObj.pointer.attachToElement(element);
						});
					});
				}
			}
		}
	},
	
	allModulesAutoAttach: function (inElement) {
		/*
		Function allModulesAutoAttach([element or string inElement])
		
		Calls allModulesAutoAttach() for all loaded modules.
		
		*/
		this.modules.each(function(moduleObj,moduleName){
			if (moduleObj.autoLaunch && moduleObj.pointer) {
				if (!inElement) {
					this.moduleAutoAttach(moduleName);
				} else {
					this.moduleAutoAttach(moduleName,inElement);
				}
			}
		}.bind(this));
	},
	
	registerModule: function(ClassType,className,delay) {
		/*
		Function registerModule(class classType, string className)
		
		Called from the module's script file, this function provides a single-line method
		of implementing Flower classes into the module class, checking for and setting options,
		and initiating the module call-back script.
		
		*/
		ClassType.implement(new FlowerDebug());
		var optionsCheck = this.getModuleOptions(className),
			moduleObject;
		if (optionsCheck) {
			moduleObject = new ClassType(optionsCheck);
		} else {
			moduleObject = new ClassType();
		}
		moduleObject.setFlowerCore(this);
		if (delay == true) {
			return moduleObject;
		} else {
			this.moduleCallback(moduleObject);
		}
	},
	
	bootstrap: function() {
		/*
		Function bootstrap()
		
		Searches through all defined modules for auto-boot selectors. If elements
		matching those CSS selectors are found, the module is loaded.
		
		*/
		var bootingModules = [],
			allSelectors;
		this.modules.each(function(moduleObj,moduleName){
			if (moduleObj.autoLaunch && !moduleObj.pointer) {
				allSelectors = $A(moduleObj.autoLaunch.split(','));
				if ($$(allSelectors).length > 0) {
					this.loadModule(moduleName);
					bootingModules.push(moduleName);
				}
			}
		}.bind(this));
		if (bootingModules.length > 0) {
			this.debugMsg(2,'boot started, attempting to load necessary modules:' +
				bootingModules.join('\n\t'));
		}
		this.checkBootStatus(bootingModules,0);
	},
	
	checkBootStatus: function(bootModules, iteration) {
		/*
		Function bootstrap(array bootModules, integer iteration)
		
		Takes an array of all required boot modules (based on auto-load selectors)
		and checks their status. Calls in a loop and fires the bootComplete event
		on successful load completion (first true) or on timeout (+2 seconds, fires false.) 
		
		*/
		if (bootModules.length == 0) {
			this.fireEvent ('bootComplete',true);
		} else {
			var totalModules = bootModules.length,
				totalLoaded = 0,
				newiteration,
				newargs;
			bootModules.each(function(argument){
				if (this.modules.get(argument).pointer) {totalLoaded++;}
			}.bind(this));
			if (totalLoaded < totalModules) {
				if (iteration < (this.timeout + 2000)) {
					newiteration = iteration+100;
					newargs = [bootModules,newiteration];
					this.checkBootStatus.delay(100,this,newargs);
				} else {
					this.fireEvent ('bootComplete',false);
					this.debugMsg(1,'boot failure, could not load all modules');
				}
			} else {
				this.fireEvent ('bootComplete',true);
				this.debugMsg(2,'boot successfully completed');
			}
		}
	},
	
	defineLibrary: function() {
		/*
		Function defineLibrary()
		
		Utility function that registers all default Library module information.
		
		Multiple instances of one path are allowed, to define multiple modules
		in one file — the file will only be injected once, with multiple call-
		backs made and all module pointers set.
		
		For reference: this.storeModule(string filePath,
										string moduleName,
										mixed (string dependencies) OR (false), 
										string autoLaunchBySelectors, 
										bool attachToLaunchSelectors,
										bool relativePath)
		
		*/		
		this.storeModule('enhancements/flower_anchor.js','linkexternal',0,'a.external',1,1);
		this.storeModule('enhancements/flower_anchor.js','linkpopup',0,'a.popup',1,1);
		this.storeModule('enhancements/flower_anchor.js','linkinside',0,'a.flower_linkinside',1,1);
		this.storeModule('enhancements/flower_anchor.js','drawer',0,'a.flower_drawertoggle',1,1);
		this.storeModule('utility/flower_utility.js','utility',0,0,0,1);
		this.storeModule('media/flower_overlay.js','overlay',0,0,0,1);
		this.storeModule('media/flower_imagebox.js','imagebox','utility,overlay','a.flower_imagebox,div.flower_imagebox',1,1);
		this.storeModule('media/flower_moviebox.js','moviebox','utility,overlay','a[href$=.mov],a[href$=.mp4],a[href$=.MOV],a[href$=.MP4],a[href^=http://www.youtube.com/watch?v],a[href^=http://youtube.com/watch?v],a[href^=http://vimeo.com/],a[href^=http://www.vimeo.com/],a[href^=http://video.google.com/videoplay?docid],a[href^=http://myspacetv.com/index.cfm?fuseaction=vids.individual&videoid],a[href^=http://vids.myspace.com/index.cfm?fuseaction=vids.individual&videoid],a[href^=http://www.vevo.com/watch]',1,1);
		this.storeModule('soundplayer/flower_soundplayer.js','soundplayer',0,'*.flower_soundplayer,div.flower_soundplayer_pageplayer',1,1);
	},
	
	clearAutoLoad: function(moduleName) {
		/*
		Function clearAutoLoad(string moduleName)
		
		Removes all autoLoad selectors from a module. Must be called before 
		bootstrap().
		
		*/
		var moduleObj = this.modules.get(moduleName);
		moduleObj.autoLaunch = 0;
	},
	
	addToAutoLoad: function(moduleName,selectorString) {
		/*
		Function addToAutoLoad(string moduleName, string selectorString)
		
		Adds selectorString to the autoLoad selectors of a module. Accepts a
		comma separated string of CSS selectors must be called before bootstrap().
		
		*/
		var moduleObj = this.modules.get(moduleName);
		if (moduleObj.autoLaunch) {
			moduleObj.autoLaunch += (',' + selectorString);
		} else {
			moduleObj.autoLaunch = selectorString;
		}
	}
});