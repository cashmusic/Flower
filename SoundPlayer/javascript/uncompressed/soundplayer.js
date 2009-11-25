var SoundPlayer = new Class({

/*
*
*
* SoundPlayer class:
* The SoundPlayer class manages a playlist of Sound objects, and (by default)
* creates a UI from which they can be controlled.
*
* Events:
* play
* stop
* soundEnd
* ready
* position
* progress
* statusChange
*
*
*/

	Implements: [Events, Options],

	options: {
		swfLocation: 'scripts/SoundPlayer.swf', // the location of the main SWF file
		autostart: false, // whether the playlist should begin playing on load
		loopPlaylist: true, // whether the playlist should loop after completion of the last song
		controlImages: {
			// an object specifying URLs for the default control buttons
			'previous': 'images/previous.png',
			'next': 'images/next.png',
			'play': 'images/play.png',
			'pause': 'images/pause.png'
		},
		injectInto: 'soundplayerspc', // the id of the div
		// the following styles correspond to the default DOM elements creating the UI:
		//
		// seekbarSpcStyle - the background of the seekbar, visible during sound load
		// seekbarStyle - the seekbar itself
		// positionStyle - the position indicator
		// controlsStyle - the div containing control buttons
		//
		seekbarSpcStyle: {'position':'relative','background-color':'transparent','height':'6px','width':'100%','margin-top':'4px','overflow':'hidden'},
		seekbarStyle: {'position':'absolute','background-color':'#ccc','height':'6px','width':'0%','cursor':'pointer','z-index':'10'},
		positionStyle: {'position':'absolute','left':'0%','width':'3px','height':'6px','background-color':'#333','z-index':'15'},
		controlsStyle: {'margin-top':'8px','text-align':'right'},
		noInterface: false, // set to true to play playlist without creating a UI
		statusInterval: 500, // how often the SWF will send status updates, in miliseconds
		volume: 1, //volume to start at - ranges from 0 - 1 
		debug: false // whether or not to display debug messages
	},

	initialize: function(options) {
		this.setOptions(options);
		this.flashLoaded = false;
		this.loadQueue = [];
		this.sounds = new Hash();	
		this.currentSound = null;
		this.currentKey = -1;
		if (!this.options.noInterface) {
			this.createDomElements();
			this.addControlElements();
			this.addPlayerEffects();
			this.addPlayerEvents();
		} else {
			// check for options.soundOptions and only override this.options.soundOptions if not 
			// explicitly set by user...
			this.options.soundOptions = null;
		}
		window.addEvent('domready', function() { 
			this.swiffHome = new Element('div').setStyles({position:'absolute','top':1,'left':1}).inject(document.body);
			this.swf = new Swiff(this.options.swfLocation, {
				width: 1, height: 1, container: this.swiffHome,
				vars: {
			        statusInterval: this.options.statusInterval
			    },
				callBacks: {
			        onLoad: this.onFlashLoaded.bind(this),
			        registerID3: this.registerID3.bind(this),
			        onSoundLoaded: this.onSoundLoaded.bind(this),
			        onSoundEnd: this.onSoundEnd.bind(this),
			        onStatusChange: this.onStatusChange.bind(this),
			        swfMessage: this.debugMessage.bind(this),
			        onError: this.onError.bind(this)
			    }
			}).toElement();
			if (!this.options.noInterface) {
				this.playerSpc.inject($(this.options.injectInto));
			}
		}.bind(this));
		this.loadSounds(this.options.playlist,this.options.soundOptions);
	},
	
	debugMessage: function(msg) {
		// a simple way to dump to the console when testing should expand to include
		// more runtime information
		if (typeof(console) == 'object' && this.options.debug) {
			console.log(msg);
		}
	},
	
	/*
	*
	*
	* load functions:
	*
	* loadSounds(array sounds, object options)
	* this either loads of queues sounds based on an array of urls or objects
	* (see playlist format)
	*
	* loadSound(string/array urlOrArray, object options)
	* this loads a sound (from a url, or an object containing url, title, artist)
	*
	*
	*/
	
	loadSounds: function(sounds, options) {
		if (!this.flashLoaded) {
			this.loadQueue.push([sounds,options]);
		} else {
			sounds = sounds || [];
			sounds.each(function(url) {
				this.loadSound(url, options);
			},this);
		}
		return this;
	},

	loadSound: function(urlOrArray, options) {
		if (!this.flashLoaded) { this.loadQueue.push([urlOrArray,options]); }
		if (typeof(urlOrArray) == 'string') {
			this.sounds.set(urlOrArray, {
				sound: new Sound(urlOrArray, this, options),
				title: false,
				artist: false
			});
		} else {
			// any problems storing by URL? multiple identical files in one playlist...
			// should maybe check for/ignore second time?
			this.sounds.set(urlOrArray.url, {
				sound: new Sound(urlOrArray.url, this, options),
				title: urlOrArray.title,
				artist: urlOrArray.artist
			});
		}
		return this;
	},
	
	/*
	*
	*
	* media control functions:
	*
	* playSound(string whichSound)
	* plays a specific sound. expecting 'next','forcenext','previous','random', or 'first'
	*
	* playCurrentSound()
	* plays the current sound from its last position
	*
	* stopCurrentSound()
	* stops the current sound 
	*
	* toggleCurrentSound()
	* switches between stop and play on the current sound
	*
	* jumpCurrentSoundTo(number ms)
	* jumps the current sound to 
	*
	*
	*/

	playSound: function(whichSound) {
		var sound,
			soundid,
			key = false,
			allSoundKeys = this.sounds.getKeys();
		if (whichSound == 'next') {
			if (this.currentKey == (allSoundKeys.length-1) && this.options.loopPlaylist) {
				key = 0;		
			} else if (this.currentKey == (allSoundKeys.length-1) && !this.options.loopPlaylist) {
				key = false;
			} else {
				key = this.currentKey + 1;
			}
		} else if (whichSound == 'forcenext') {
			// forcenext exists for the next button and the last track. it will force a loop
			// though 'next' will not.
			if (this.currentKey == (allSoundKeys.length-1)) {
				key = 0;
			} else {
				key = this.currentKey + 1;
			}
		} else if (whichSound == 'previous') {
			// check for null, ignore if no sound has been played yet
			if (this.currentSound != null) {
				if (this.currentKey == 0) {
					key = allSoundKeys.length - 1;	
				} else {
					key = this.currentKey - 1;
				}
			}
		} else if (whichSound == 'random') {	
			key = Math.floor(Math.random()*allSoundKeys.length);
		} else if (whichSound == 'first') {
			key = 0;
		}
		if (this.currentSound) {
			this.stopCurrentSound();
		}
		if (key !== false) {
			soundid = allSoundKeys[key];
			sound = this.sounds.get(soundid);
			this.currentKey = key;
			this.currentSound = sound;
			this.currentSound.sound.position = 0;
			this.playCurrentSound();
		}
		return this;
	},
	
	playCurrentSound: function() {
		if (!this.currentSound.sound.playing) {
			this.currentSound.sound.start();
			this.fireEvent('play',[this.currentSound.sound.url,this.currentSound.title,this.currentSound.artist]);
		}
		return this;
	},
	
	stopCurrentSound: function() {
		if (this.currentSound.sound.playing) {
			this.currentSound.sound.stop();
			this.fireEvent('stop');
		}
		return this;
	},
	
	toggleCurrentSound: function() {
		if (this.currentSound) {
			if (!this.currentSound.sound.playing) {
				this.playCurrentSound();
			} else {
				this.stopCurrentSound();
			}
		} else {
			this.playSound('first');
		}
		return this;
	},
	
	jumpCurrentSoundTo: function(ms) {
		this.currentSound.sound.jumpTo(ms);
		this.fireEvent('play',[this.currentSound.sound.url,this.currentSound.title,this.currentSound.artist]);
		return this;
	},
	
	/*
	*
	*
	* set/get information and property functions:
	*
	* registerID3(string url, string tag, string, value)
	* sets ID3 info with the Sound object
	*
	* getSound(string url)
	* returns a Sound object based on the url
	*
	* setVolume(number volume)
	* ranges from 0 (silent) to 1 (full volume)
	*
	* getVolume()
	*
	*
	*/

	registerID3: function(url, tag, value) {
		// update to get/set format
		var sound = this.getSound(url);
		sound.id3.set(tag, value);
		sound.fireEvent('onID3', [tag, value]);
	},

	getSound: function(key) {
		return this.sounds.get(key).sound;
	},
	
	setVolume: function(volume) {
		this.swf.setVolume(volume);
		this.options.volume = volume;
		return this;
	},

	getVolume: function() {
		return this.options.volume;
	},
	
	/*
	*
	*
	* event handler functions:
	*
	* onSoundLoaded(string url)
	*
	* onSoundEnd(string url)
	*
	* onFlashLoaded()
	*
	* onError(string errorType, string errorMessage)
	*
	* onStatusChange(string url, number length, number position, 
	*                number bytesTotal, number bytesLoaded,
	*                number loadPercentage, number approximatePosition)
	*
	*
	*/

	onSoundLoaded: function(url) {
		this.getSound(url).fireEvent('onLoad');
	},

	onSoundEnd: function(url) {
		this.currentSound.sound.position = 0;
		this.fireEvent('soundEnd');
	},

	onFlashLoaded: function() {
		this.flashLoaded = true;
		this.loadQueue.each(function(arr) { this.loadSounds(arr[0], arr[1]); }.bind(this));
		this.setVolume(this.options.volume);
		if (this.options.autostart) {
			this.playSound.delay(100, this, 'first');
		}
		this.fireEvent('ready');
	},
	
	onError: function(errorType,errorMsg) {
		debugMessage(errorType+': '+errorMsg);
	},
	
	onStatusChange: function(url,length,position,bytesTotal,bytesLoaded,loadPercentage,approximatePosition) {
		this.fireEvent('position', approximatePosition);
		this.fireEvent('progress', loadPercentage);
		this.currentSound.sound.position = position;
		this.currentSound.sound.duration = length;
		this.currentSound.sound.fireEvent('onPosition', [position, length]);
		if (!this.currentSound.sound.bytesTotal) {
			this.currentSound.sound.bytesTotal = bytesTotal;
		}
		if (!this.currentSound.sound.loaded) {
			this.currentSound.sound.bytesLoaded = bytesLoaded;
			this.currentSound.sound.fireEvent('onProgress', [bytesLoaded, bytesTotal]);
		}
		this.fireEvent('statusChange');
	},
	
	/*
	*
	*
	* user interface functions:
	*
	* createDomElements()
	* Creates all the DOM elements needed to render the player.
	*
	* addPlayerEffects()
	* Adds the effects that make the seek bar grow and the position indicator move
	*
	* addPlayerEvents()
	* adds listeners that create the interface interaction
	*
	* addControlElements()
	* Adds the basic previous,play/pause,next buttons to the player. Split from the 
	* other DOM elements so it can be more easily extended by a child to add 
	* functionality or re-skin the standard appearance.
	*
	*
	*/

	createDomElements: function() {
		this.playerSpc = new Element('div', {'class': 'player'});
		this.title = new Element('div', {'class':'title'}).inject(this.playerSpc);
		this.seekbarSpc = new Element('div', {
			'class':'seekbarSpc',
			'styles': this.options.seekbarSpcStyle
		}).inject(this.playerSpc);
		this.seekbar = new Element('div', {
			'class':'seekbar',
			'styles': this.options.seekbarStyle
		}).inject(this.seekbarSpc);
		this.position = new Element('div', {
			'class':'position',
			'styles': this.options.positionStyle
		}).inject(this.seekbarSpc);
		this.controls = new Element('div', {
			'class':'controls',
			'styles': this.options.controlsStyle
		}).inject(this.playerSpc);
	},

	addPlayerEffects: function() {
		this.progressFx = new Fx.Tween(this.seekbar, {property: 'width',duration:this.options.statusInterval, unit:'%', link: 'cancel'});
		this.positionFx = new Fx.Tween(this.position, {property: 'left',duration:this.options.statusInterval, unit:'%', link: 'cancel'});
	},
	
	addPlayerEvents: function() {
		this.seekbar.addEvent('click', function(e) {
			var masterCoords = this.seekbarSpc.getCoordinates();
			var progressCoords = this.seekbar.getCoordinates();
			var clickPosition = (e.page.x - progressCoords.left)/masterCoords.width;
			var ms = clickPosition*this.currentSound.sound.duration*(this.currentSound.sound.bytesLoaded/this.currentSound.sound.bytesTotal);
			this.jumpCurrentSoundTo(ms);
			this.positionFx.cancel();
			this.positionFx.set(Math.floor(clickPosition*100));
		}.bind(this));
		this.addEvent('play', function(key,title,artist) {
			if (title) {
				this.title.set('text',title);
			} else {
				this.title.set('text',key);
			}
			if (this.currentSound.sound.loaded) {
				this.progressFx.start(100);
			}
		}.bind(this));
		this.addEvent('soundEnd', function() {
			this.playSound('next');
		}.bind(this));
	},
	
	addControlElements: function() {
		this.previousEl = new Element('img', {
			'class':'prev',alt:'prev',id:'prev',
			src:this.options.controlImages.previous,
			'styles':{'margin-left':'4px','cursor':'pointer'},
			'events': {
				'click': function(){
			       	this.playSound('previous');
		        }.bind(this)
			}
		}).inject(this.controls);
		this.playPauseEl = new Element('img', {
			'class':'play',alt:'play',id:'play',
			src:this.options.controlImages.play,
			'styles':{'margin-left':'4px','cursor':'pointer'},
			'events': {
				'click': function(){
			       	this.toggleCurrentSound();
		        }.bind(this)
			}
		}).inject(this.controls);
		this.nextEl = new Element('img', {
			'class':'next',alt:'next',id:'next',
			src:this.options.controlImages.next,
			'styles':{'margin-left':'4px','cursor':'pointer'},
			'events': {
				'click': function(){
			       this.playSound('forcenext');
		        }.bind(this)
			}
		}).inject(this.controls);
		
		// add image click events:
		this.addEvent('play', function() {
			this.playPauseEl.set('src',this.options.controlImages.pause);
		}.bind(this));
		this.addEvent('pause', function() {
			this.playPauseEl.set('src',this.options.controlImages.play);
		}.bind(this));
		this.addEvent('stop', function() {
			this.playPauseEl.set('src',this.options.controlImages.play);
		}.bind(this));
		
		// add seekbar/position events:
		this.addEvent('progress', function(val) {
			this.progressFx.start(val);
		});
		this.addEvent('position', function(val) {
			this.positionFx.start(val);
		});
	}
});

var Sound = new Class({ 

/*
*
*
* Sound class:
* Largely a storage container for information about and function aliases
* for the main SWF's SoundPlayer Sound objects. Each Sound object is fed
* data and instructions from the SoundPlayer class, which in turn is fed 
* by the SWF
*
* Events detailed in the options object
*
*
*/

	Implements: [Options, Events],

	options: {
		onRegister: $empty,//fires when the sound is registered
		onLoad: $empty,    //fires when the sound is downloaded
		onPlay: $empty,    //fires when the sound begins playing
		onStop: $empty,    //fires when the sound stops playing
		onEnd: $empty, //fires when the sound completes playing
		onProgress: $empty,//fires when download makes progress
		onPosition: $empty,//fires when position within the song changes
		onID3: $empty      //fires when ID3 tags become available
	},

	initialize: function(url, manager, options) {
		this.setOptions(options);
		this.url = url;
		this.id3 = new Hash();
		this.manager = manager;
		this.swf = this.manager.swf;
		this.playing = false;
		this.loaded = false; // added to give a check for cached mp3, set to true on load
		this.bytesLoaded = null;
		this.bytesTotal = null;
		this.duration = null;
		this.position = 0;
		this.addEvents({'onLoad': this.onLoad, 'onStop': this.onStop, 'onPlay': this.onPlay, 'onEnd': this.onEnd});
	},

	start: function(position) {
		var pos = position || this.position;
		this.swf.startSound(this.url, pos);
		this.fireEvent('onPlay');
		return this;
	},

	stop: function() {
		this.swf.stopSound();
		this.position = this.getPosition();
		this.fireEvent('onStop',this.position);
		return this;
	},

	jumpTo: function(seconds) {
		this.start(seconds);
		return this;
	},

	getID3: function(tag) {
		return this.id3.get(tag);	
	},

	getBytesLoaded: function() {
		return this.swf.getBytesLoaded(this.url);
	}, 

	getFilesize: function() {
		return this.swf.getBytesTotal(this.url);
	},

	getPosition: function() {
		if (this.playing) {
			return this.swf.getPosition();
		} else {
			return this.position;
		}
	}, 

	getDuration: function() {
		return this.swf.getDuration(this.url);
	},

	checkProgress: function() {
		this.bytesTotal = this.getFilesize();
		this.bytesLoaded = this.getBytesLoaded();
		this.fireEvent('onProgress', [this.bytesLoaded, this.bytesTotal]); 
	},

	onLoad: function() {
		this.checkProgress();
		this.loaded = true;
	},

	onPlay: function() {
		this.playing = true;
	},
	
	onEnd: function() {
		this.position = 0;
		this.fireEvent('onStop');
	},

	onStop: function(position) {
		this.playing = false;
	}
});