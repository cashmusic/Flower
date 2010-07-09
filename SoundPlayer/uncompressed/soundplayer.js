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
		statusInterval: 20, // how often the SWF will send status updates, in miliseconds
		volume: 100, //volume to start at - ranges from 0 - 100 
		debug: false, // whether or not to display debug messages
		sm2Location: '/assets/scripts/lib/soundmanager2/soundmanager2.js',
		sm2swfLocation: '/assets/scripts/lib/soundmanager2/swf/'
	},

	initialize: function(options) {
		this.setOptions(options);
		this.flashLoaded = false;
		this.currentSound = null;
		this.currentPlaylist = null;
		this.Playlists = new Hash();
		this.soundManager = null;
		if (!this.options.noInterface) {
			this.createDomElements();
			this.addControlElements();
			this.addPlayerEvents();
		}
		window.addEvent('domready', function() {
			window.SM2_DEFER = true; 
			injected = new Element('script', {
				'type': 'text/javascript',
				'src': this.options.sm2Location
			}).injectInside($$('head')[0]);
			(function(){ 
				window.soundManager = new SoundManager(); // Flash expects window.soundManager.
				soundManager.url = this.options.sm2swfLocation;
				soundManager.flashVersion = 9; // optional: shiny features (default = 8)
				soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
				soundManager.useHTML5Audio = true;
				soundManager.consoleOnly = true;
				soundManager.onready(function() {
					if (soundManager.supported()) {
						this.soundManager = soundManager;
						this.onFlashLoaded();
				  } else {
						this.onError('soundmanager2 loaded but is not supported');
				  }
				}.bind(this));
				soundManager.beginDelayedInit(); // start SM2 init.
			}.bind(this)).delay(250);
		}.bind(this));
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
	* loadPlaylist(array sounds, object options)
	* this either loads of queues sounds based on an array of urls or objects
	* (see playlist format)
	*
	* loadSound(string/array urlOrArray, object options)
	* this loads a sound (from a url, or an object containing url, title, artist)
	*
	*
	*/
	
	loadPlaylist: function(playlistName, sounds, options) {
		if (!this.flashLoaded) {
			this.onError('flash object not yet loaded. please use the \'ready\' event.');
		} else {
			this.currentPlaylist = this.Playlists.get(playlistName);
			if (this.currentPlaylist === null) {
				this.Playlists.set(playlistName, new SoundPlaylist(options));
				this.currentPlaylist = this.Playlists.get(playlistName);
			}
			this.currentPlaylist.setSoundPlayer(this);
			sounds.each(function(sound) {
				this.currentPlaylist.loadSound(sound);
			},this);
		}
		return this;
	},
	
	/*
	*
	*
	* media control functions:
	*
	* pass-through functions for the Playlist object
	*
	*
	*/

	//playAdHocSound: function(whichSound) {
	//	this.currentPlaylist.playSound(whichsound);
	//},
	
	playCurrentSound: function() {
		if (this.currentPlaylist === null) {
			this.onError('there are no playlists loaded.');
		} else {
			this.currentPlaylist.playCurrentSound();
		}
	},
	
	stopCurrentSound: function() {
		if (this.currentPlaylist === null) {
			this.onError('there are no playlists loaded.');
		} else {
			this.currentPlaylist.stopCurrentSound();
		}
	},
	
	resumeCurrentSound: function() {
		if (this.currentPlaylist === null) {
			this.onError('there are no playlists loaded.');
		} else {
			this.currentPlaylist.resumeCurrentSound();
		}
	},
	
	pauseCurrentSound: function() {
		if (this.currentPlaylist === null) {
			this.onError('there are no playlists loaded.');
		} else {
			this.currentPlaylist.pauseCurrentSound();
		}
	},
	
	toggleCurrentSound: function() {
		if (this.currentPlaylist === null) {
			this.onError('there are no playlists loaded.');
		} else {
			this.currentPlaylist.toggleCurrentSound();
		}
	},
	
	jumpCurrentSoundTo: function(ms) {
		if (this.currentPlaylist === null) {
			this.onError('there are no playlists loaded.');
		} else {
			this.currentPlaylist.jumpCurrentSoundTo(ms);
		}
	},
	
	/*
	*
	*
	* set/get information and property functions:
	*
	* setVolume(number volume)
	* ranges from 0 (silent) to 100 (full volume)
	*
	* getVolume()
	*
	*
	*/
	
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

	onFlashLoaded: function() {
		this.flashLoaded = true;
		this.soundManager.defaultOptions.volume = this.options.volume;
		if (!this.options.noInterface) {
			this.playerSpc.inject(document.id(this.options.injectInto));
		}
		this.fireEvent('ready');
	},
	
	onError: function(errorMsg) {
		debugMessage('flower soundplayer error: '+errorMsg);
		this.fireEvent('error');
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
	
	addPlayerEvents: function() {
		this.seekbar.addEvent('click', function(e) {
			var masterCoords = this.seekbarSpc.getCoordinates();
			var progressCoords = this.seekbar.getCoordinates();
			var clickPosition = (e.page.x - progressCoords.left)/masterCoords.width;
			var ms = clickPosition*this.currentPlaylist.currentSound.sound.duration*(this.currentPlaylist.currentSound.sound.bytesLoaded/this.currentPlaylist.currentSound.sound.bytesTotal);
			this.jumpCurrentSoundTo(ms);
		}.bind(this));
		this.addEvent('play', function(key,title,artist) {
			if (title) {
				this.title.set('text',title);
			} else {
				this.title.set('text',key);
			}
		}.bind(this));
	},
	
	addControlElements: function() {
		this.previousEl = new Element('img', {
			'class':'prev',alt:'prev',id:'prev',
			src:this.options.controlImages.previous,
			'styles':{'margin-left':'4px','cursor':'pointer'},
			'events': {
				'click': function(){
			       	this.currentPlaylist.playSound('previous');
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
			       this.currentPlaylist.playSound('forcenext');
		        }.bind(this)
			}
		}).inject(this.controls);
		
		// add image click events:
		this.addEvent('play', function() {
			this.playPauseEl.set('src',this.options.controlImages.pause);
		}.bind(this));
		this.addEvent('resume', function() {
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
			if (val < .95) {
				var totalwidth = this.seekbarSpc.getSize().x;
				this.seekbar.setStyle('width',Math.round(totalwidth*val));
			} else {
				this.seekbar.setStyle('width','100%');
			}
		});
		this.addEvent('position', function(val) {
			var totalwidth = this.seekbarSpc.getSize().x;
			this.position.setStyle('left',Math.round(totalwidth*val));
		});
	}
});

var SoundPlaylist = new Class({ 

/*
*
*
* Playlist class:
*
*
*/

	Implements: [Options, Events],

	options: {
		loopPlaylist: true // whether the playlist should loop after completion of the last song
	},

	initialize: function(name,sounds,options) {
		this.setOptions(options);
		this.SoundPlayer = null;
		this.setOptions(options);
		this.sounds = new Hash();	
		this.currentSound = null;
		this.currentKey = -1;
	},
	
	/*
	*
	*
	* media control functions:
	*
	* playSound(string whichSound)
	* plays a specific sound. expecting 'next','forcenext','previous','random', or 'first'
	*
	* resumeCurrentSound()
	* plays the current sound from its last position
	*
	* pauseCurrentSound()
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
	
	setSoundPlayer: function(SoundPlayerObj) {
		this.SoundPlayer = SoundPlayerObj;
		return this;
	},
	
	loadSound: function(urlOrArray) {
		var theSound = urlOrArray;
		if (typeof(urlOrArray) == 'string') {
			theSound = {url: urlOrArray, title: false, artist: false};
		}
		this.sounds.set(theSound.url, {
			sound: this.SoundPlayer.soundManager.createSound({
				id: theSound.url, 
				url: theSound.url,
				onfinish: function() {
					this.SoundPlayer.fireEvent('soundEnd');
					this.playSound('next');
				}.bind(this),
				whileplaying: function() {
					approximatePosition = this.currentSound.sound.position / this.currentSound.sound.duration;
					this.SoundPlayer.fireEvent('position', approximatePosition);
				}.bind(this),
				whileloading: function() {
					loadPercentage = this.currentSound.sound.bytesLoaded / this.currentSound.sound.bytesTotal;
					this.SoundPlayer.fireEvent('progress', loadPercentage);
				}.bind(this),
			}),
			title: theSound.title,
			artist: theSound.artist
		});
		return this;
	},

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
	},
	
	resumeCurrentSound: function() {
		if (this.currentSound.sound.paused) {
			this.currentSound.sound.resume();
			this.SoundPlayer.fireEvent('resume');
		}
	},
	
	playCurrentSound: function() {
			this.currentSound.sound.play();
			this.SoundPlayer.fireEvent('play',[this.currentSound.sound.url,this.currentSound.title,this.currentSound.artist]);
	},
	
	pauseCurrentSound: function() {
		if (this.currentSound.sound.playState == 1) {
			this.currentSound.sound.pause();
			this.SoundPlayer.fireEvent('pause');
		}
	},
	
	stopCurrentSound: function() {
		this.currentSound.sound.stop();
		this.SoundPlayer.fireEvent('stop');
	},
	
	toggleCurrentSound: function() {
		if (this.currentSound) {
			if (this.currentSound.sound.playState == 0) {
				this.playCurrentSound();
			} else {
				if (this.currentSound.sound.paused) {
					this.resumeCurrentSound();
				} else {
					this.pauseCurrentSound();
				}
			}
		} else {
			this.playSound('first');
		}
	},
	
	jumpCurrentSoundTo: function(ms) {
		this.currentSound.sound.setPosition(ms);
		if (this.currentSound.sound.paused) {
			this.resumeCurrentSound();
		}
		this.fireEvent('play',[this.currentSound.sound.url,this.currentSound.title,this.currentSound.artist]);
	},

});