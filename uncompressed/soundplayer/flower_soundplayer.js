var FlowerSoundPlayer = new Class({

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
		volume: 100, //volume to start at - ranges from 0 - 100 
		debug: false, // whether or not to display debug messages
		forceFlash: false,
		sm2LoadTimeout: 1500,
		sm2Location: '/assets/scripts/lib/soundmanager2/soundmanager2.js',
		sm2swfLocation: '/assets/scripts/lib/soundmanager2/swf/'
	},

	initialize: function(options) {
		this.setOptions(options);
		this.name = 'soundplayer';
		this.version = 1.0;
		this.donotdebugoptions = false;
		this.sm2Loaded = false;
		this.currentSound = null;
		this.currentPlaylist = null;
		this.Playlists = new Hash();
		this.soundManager = null;
		this.sm2LoadTimer = null;
		this.sm2LoadTime = 0;
		this.isReady = false; // set to true when soundplayer is ready. used as a check — sm2 fires onready 2x on iphone
		this.isAppleiDevice = false;
		if ((navigator.userAgent.match(/iPad/i) != null) || (navigator.userAgent.match(/iPhone/i) != null) || (navigator.userAgent.match(/iPod/i) != null)) {
			this.isAppleiDevice = true;
		}
		window.addEvent('domready', function() {
			window.SM2_DEFER = true; 
			injected = new Element('script', {
				'type': 'text/javascript',
				'src': this.options.sm2Location
			}).injectInside($$('head')[0]);
			this.sm2LoadTimer = (function() {
				if (typeof(soundManager) != 'undefined') {
					this.initializeSM2();
					$clear(this.sm2LoadTimer);
				} else {
					this.sm2LoadTime += 50;
					if (this.sm2LoadTime > this.options.sm2LoadTimeout) {
						this.onError('soundmanager2 could not be loaded/found.');
						$clear(this.sm2LoadTimer);
					}
				}
			}).periodical(50,this);
		}.bind(this));
	},
	
	initializeSM2: function() {
		window.soundManager = new SoundManager(); // Flash expects window.soundManager.
		soundManager.url = this.options.sm2swfLocation;
		soundManager.flashVersion = 9; // optional: shiny features (default = 8)
		soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
		if (!this.options.forceFlash) {
			soundManager.useHTML5Audio = true;
		}
		soundManager.flashLoadTimeout = this.options.sm2LoadTimeout;
		//soundManager.consoleOnly = true;
		soundManager.debugMode = this.options.debug;
		soundManager.onready(function() {
			if (soundManager.supported()) {
				this.soundManager = soundManager;
				this.onSM2Loaded();
		  } else {
				this.onError('soundmanager2 loaded but is not supported');
		  }
		}.bind(this));
		soundManager.beginDelayedInit(); // start SM2 init.
	},
	
	
	
	
	/*
	*
	*
	*
	*
	Taken directly from imagebox
	*
	*
	*
	*
	*/
	
	attachToElement: function(el) {
		/*
		Function attachToElement(anchor element el)
	
		Scans an anchor for links to images. If found, the function removes any 
		existing click events and adds one to show the linked image
		
		*/
		if (!this.ismobile) {
			if (el.get('tag') == 'a') {
				this.addFromLink(el,'default');
			} else if (el.get('tag') == 'div') {
				var divCollection = 'default',
					elid = el.get('id');
				if (elid) {divCollection = elid;}
				el.getElements('a').each(function(a){	
					var elLink = a.getProperty('href');	
					//
					//
					// check for flash/html5, for flash allow:
					if (theHTML5TestThing == true) {
						if (elLink.toLowerCase().contains('.mp3') || 
							elLink.toLowerCase().contains('.ogg') || 
							elLink.toLowerCase().contains('.wav') || 
							elLink.toLowerCase().contains('.aif')) 
						{
							this.addFromLink(a,divCollection);
						}
					} else {
						if (elLink.toLowerCase().contains('.mp3') || 
							elLink.toLowerCase().contains('.aac')) 
						{
							this.addFromLink(a,divCollection);
						}
					}
				}.bind(this));
			}
		}
	},
	
	addFromLink: function(el,collectionName) {
		/*
		Function attachToElement(anchor element el, string forCollection)
	
		Parses an anchor for a linked image. If found, it adds the image to the 
		specified collection.
		
		*/
		el.removeEvents('click');
		var elLink = el.getProperty('href'),
			elTitle = el.getProperty('title'),
			linkrev = el.getProperty('rev'),
			imgWidth = 0,
			imgHeight = 0,
			alt = 'featured imgage',
			splitArgument,
			collectionPlace;
		if (linkrev) {
			if (linkrev.contains('imagebox:')) {
				$A(linkrev.substring(9,linkrev.length).split(',')).each(function(argument) {
					splitArgument = argument.split('=');
					if (splitArgument[0] == 'width') {
						imgWidth = splitArgument[1];
					} else if (splitArgument[0] == 'height') {
						imgHeight = splitArgument[1];
					} else if (splitArgument[0] == 'alt') {
						alt = splitArgument[1];
					} else if (splitArgument[0] == 'collection') {
						collectionName = splitArgument[1];
					}
				}.bind(this));
			}
		}
		// check for existing collection, create a new one if necessary
		if (!this.collections.get(collectionName)) {this.newCollection(collectionName);}
		collectionPlace = this.collections.get(collectionName).length;
		this.addToCollection(collectionName,elLink,elTitle,alt,imgWidth,imgHeight);
		el.addEvent('click', function(e){
			this.showImage(collectionName,collectionPlace);
			e.stop();
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
		if (!this.sm2Loaded) {
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
	* onSM2Loaded()
	*
	* onError(string errorType, string errorMessage)
	*
	* onStatusChange(string url, number length, number position, 
	*                number bytesTotal, number bytesLoaded,
	*                number loadPercentage, number approximatePosition)
	*
	*
	*/

	onSM2Loaded: function() {
		if (!this.isReady) {
			this.sm2Loaded = true;
			this.soundManager.defaultOptions.volume = this.options.volume;
			this.fireEvent('ready');
			this.isReady = true;
		}
	},
	
	onError: function(errorMsg) {
		this.debugMessage('flower soundplayer error: '+errorMsg);
		this.fireEvent('error');
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
		loopPlaylist: false // whether the playlist should loop after completion of the last song
	},

	initialize: function(name,sounds,options) {
		this.setOptions(options);
		this.SoundPlayer = null;
		this.sounds = new Hash();	
		this.currentSound = null;
		this.currentKey = -1;
		this.usingHTML5 = false;
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
					this.playSound('next'); 
					this.SoundPlayer.fireEvent('soundEnd');
				}.bind(this),
				whileplaying: function() {
					if (!this.currentSound.sound.loaded) {
						currentDuration = this.currentSound.sound.durationEstimate;
					} else {
						currentDuration = this.currentSound.sound.duration;
					}
					approximatePosition = this.currentSound.sound.position / currentDuration;
					this.SoundPlayer.fireEvent('position', approximatePosition);
					
					currentDuration = Math.round(currentDuration / 1000);
					figureSeconds = Math.floor(currentDuration % 60);
					figureSeconds = (String(figureSeconds).length < 2) ? figureSeconds = String("0" + figureSeconds) :  figureSeconds = String(figureSeconds);
					currentDuration = Math.floor(currentDuration / 60) + ':' + figureSeconds;
					
					currentPosition = Math.round(this.currentSound.sound.position / 1000);
					figureSeconds = Math.floor(currentPosition % 60);
					figureSeconds = (String(figureSeconds).length < 2) ? figureSeconds = String("0" + figureSeconds) :  figureSeconds = String(figureSeconds);
					currentPosition = Math.floor(currentPosition / 60) + ':' + figureSeconds;
					
					this.SoundPlayer.fireEvent('positiontime', [currentPosition + ' / ' + currentDuration,this.currentSound.sound.url]);
					if (this.usingHTML5) {
						loadPercentage = this.currentSound.sound.bytesLoaded / this.currentSound.sound.bytesTotal;
						this.SoundPlayer.fireEvent('progress', loadPercentage);
					}
				}.bind(this),
				whileloading: function() {
					if (!this.usingHTML5) {
						loadPercentage = this.currentSound.sound.bytesLoaded / this.currentSound.sound.bytesTotal;
						this.SoundPlayer.fireEvent('progress', loadPercentage);
					}
				}.bind(this),
			}),
			title: theSound.title,
			artist: theSound.artist
		});
		if (this.sounds.get(theSound.url).sound.isHTML5) {
			this.usingHTML5 = true;
		}
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
			this.currentSound.sound.setPosition(0);
			this.stopCurrentSound();
		}
		if (key !== false) {
			soundid = allSoundKeys[key];
			sound = this.sounds.get(soundid);
			this.currentKey = key;
			this.currentSound = sound;
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
		if (this.currentSound.sound.paused) {
			this.currentSound.sound.setPosition(0);
			this.currentSound.sound.resume();
		} else {
			this.currentSound.sound.play();
		}
		this.SoundPlayer.fireEvent('play',[this.currentSound.sound.url,this.currentSound.title,this.currentSound.artist]);
	},
	
	pauseCurrentSound: function() {
		if (this.currentSound.sound.playState == 1) {
			this.currentSound.sound.pause();
			this.SoundPlayer.fireEvent('pause');
		}
	},
	
	stopCurrentSound: function() {
		if (this.currentSound.sound.playState != 0) {
			/*
			this.currentSound.sound.setPosition(0);
			if (this.currentSound.sound.isHTML5) {
				// HTML5 has no true "stop" — unloading the media can cause warnings that confuse and bewilder the iphone
				this.currentSound.sound.pause();
			} else {
			*/
				this.currentSound.sound.stop();
			//}
			this.SoundPlayer.fireEvent('stop');
		}
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


var SoundPlayerUI = new Class({ 

/*
*
* SoundPlayerUI class:
*
*
*/

	Implements: [Options, Events],
	
	options: {
		debug: false
	},
	
	initialize: function(playlist,targetElement,options) {
		this.setOptions(options);
		if (this.options.playlist != false) {
			this.supportsAppleiDevices = true;
			this.targetElement = targetElement;
			this.playlist = playlist;
			this.isAppleiDevice = this.playlist.SoundPlayer.isAppleiDevice;
			this.allSoundKeys = this.playlist.sounds.getKeys();
		} else {
			if (this.options.debug) {
				this.debugMessage('No playlist specified, cannot draw UI.')
			}
		}
	},
	
	debugMessage: function(msg) {
		// a simple way to dump to the console when testing should expand to include
		// more runtime information
		if (typeof(console) == 'object' && this.options.debug) {
			console.log(msg);
		}
	}

});

var defaultSoundPlayerUI = new Class({ 

/*
*
* defaultSoundPlayerUI class:
*
*
*/
	Extends: SoundPlayerUI,
	Implements: [Options, Events],
	
	options: {
		debug: false,
		forceAppleiDevice: false,
		controlImages: {
			// an object specifying URLs for the default control buttons
			'previous': '/assets/images/previous.png',
			'next': '/assets/images/next.png',
			'play': '/assets/images/play.png',
			'pause': '/assets/images/pause.png'
		},
		customElementStyles: null //placeholder — identical Hash to below, applied a second time for user customization of existing styles
	},
	
	initialize: function(playlist,targetElement,options) {
		this.parent(playlist,targetElement,options);
		this.setOptions(options);
		if (this.options.forceAppleiDevice) {
			this.isAppleiDevice = true;
		}
		this.allPlaylistLi = new Hash();
		this.notesSpan = new Element('span',{
			text:'(tap to stop)',
			'styles':{'display':'none','color':'#111','padding-left':'1em'}
		});
		// the following styles correspond to the default DOM elements creating the UI:
		//
		// seekbarSpcStyle - the background of the seekbar, visible during sound load
		// seekbarStyle - the seekbar itself
		// positionStyle - the position indicator
		// controlsStyle - the div containing control buttons
		//
		this.elementStyles = new Hash({
			'seekbarSpc': {'position':'relative','background-color':'#000','height':'9px','width':'100%','margin-top':'4px','overflow':'hidden'},
			'seekbar': {'position':'absolute','background-color':'#00acf1','height':'9px','width':'0%','cursor':'pointer','z-index':'10'},
			'position': {'position':'absolute','left':'0%','width':'3px','height':'9px','background-color':'#fff402','z-index':'15'},
			'controls': {'margin-top':'8px','text-align':'right'},
			'iDeviceLiStyles': {'background':'-webkit-gradient(linear, left top, left bottom, from(#666), to(#222))','color':'#fff'},
			'iDeviceLiStylesClicked': {'background':'-webkit-gradient(linear, left top, left bottom, from(#00acf1), to(#002939))','color':'#ed028d'},
			'controlImageStyles': {'margin-left':'4px','cursor':'pointer'}
		});
	},
	
	//
	//
	//
	//
	//
	//
	// All Playlist functions ->
	
	clearAllPlaylistLi: function() {
		this.notesSpan.setStyle('display','none');
		this.allPlaylistLi.each(function(li) {
			li.get('li').setStyles(this.elementStyles.get('iDeviceLiStyles'));
			li.get('titlespan').setStyle('color','#fff');
			li.get('timespan').set('html','');
		}.bind(this));
	},

	handlePlaylistLiClick: function(url) {
		var sound = this.playlist.sounds.get(url);
		var forcePlay = false;
		if (this.playlist.currentSound) {
			if (this.playlist.currentSound.sound.playState == 0 && this.playlist.currentKey == this.allSoundKeys.indexOf(url)) {
				forcePlay = true;
			}
		}
		if (this.playlist.currentKey != this.allSoundKeys.indexOf(url) || forcePlay) {
			if (this.playlist.currentSound) {
				this.playlist.currentSound.sound.setPosition(0);
				this.playlist.stopCurrentSound();
			}		
			this.playlist.currentKey = this.allSoundKeys.indexOf(url);
			this.playlist.currentSound = sound;
			this.playlist.playCurrentSound();
			this.highlightPlayingLi(url)
		} else {
			this.playlist.stopCurrentSound();
			this.clearAllPlaylistLi();
		}
	},
	
	highlightPlayingLi: function(url) {
		this.clearAllPlaylistLi();
		var liObj = this.allPlaylistLi.get(url);
		var tmpTimeSpan = liObj.get('timespan');
		var tmpTitleSpan = liObj.get('titlespan');
		var tmpLi = liObj.get('li');
		if (tmpTimeSpan.get('html') == '') {
			tmpTimeSpan.set('html','loading...');
		}
		tmpLi.setStyles(this.elementStyles.get('iDeviceLiStylesClicked'));
		tmpTitleSpan.setStyle('color','#000');
		this.notesSpan.inject(tmpLi);
		this.notesSpan.setStyle('display','inline');
	},
	
	addPlaylistElements: function() {
		if (!this.isAppleiDevice) {
			this.mainPlaylistUl = new Element('ol',{'styles':{'font-size':'0.85em','padding':0,'margin':0,'list-style-type':'decimal-leading-zero'}});
			this.playlist.sounds.each(function(track,index) { 
				var tmpLi = new Element('li',{'styles':{'list-style-position':'inside'}}).inject(this.mainPlaylistUl);
				var tmpTitleSpan = new Element('span',{
					text:track.title,
					'styles':{'cursor':'pointer'},
					'events':{
						'click': function(){
							sound = this.playlist.sounds.get(track.sound.url);
							if (this.playlist.currentSound) {
								this.playlist.currentSound.sound.setPosition(0);
								this.playlist.stopCurrentSound();
							}
							this.playlist.currentKey = this.allSoundKeys.indexOf(track.sound.url);
							this.playlist.currentSound = sound;
							this.playlist.playCurrentSound();
				        }.bind(this)
					}
				}).inject(tmpLi);;
			},this);
			
			this.mainPlaylistUl.inject(document.id(this.targetElement));
		} else {
			this.mainPlaylistUl = new Element('ol',{'styles':{'font-size':'0.85em','padding':0,'margin':0,'list-style-type':'decimal-leading-zero'}});
			this.playlist.sounds.each(function(track,index) { 
				var tmpLi = new Element('li',{'styles':{
					'list-style-position':'inside',
					'background':'-webkit-gradient(linear, left top, left bottom, from(#666), to(#222))',
					'border':'1px solid #777',
					'-webkit-border-radius':'3px',
					'margin-bottom':'4px',
					'padding':'3px',
					'height':'4em',
					'cursor':'pointer',
					'color':'#fff'
					}
				}).inject(this.mainPlaylistUl);
				var tmpTitleSpan = new Element('span',{
					text:track.title,
					'styles':{'font-size':'1.5em','line-height':'1em','font-weight':'bold','display':'block'}
				}).inject(tmpLi);
				var tmpTimeSpan = new Element('span',{'styles':{'padding-left':'1.95em','color':'#fff'}}).inject(tmpLi);
				tmpLi.addEvent('click', function(){
		        	this.handlePlaylistLiClick(track.sound.url);
		        }.bind(this));
				this.allPlaylistLi.set(track.sound.url,new Hash({'li':tmpLi,'titlespan':tmpTitleSpan,'timespan':tmpTimeSpan}));
			},this);
			
			this.mainPlaylistUl.inject(document.id(this.targetElement));
		}
	},
	
	addPlaylistEvents: function() {
		if (!this.isAppleiDevice) {
			// placeholder. do bold/color for current track in std playlist
		} else {
			this.playlist.SoundPlayer.addEvent('play',function(url){
				this.highlightPlayingLi(url);
			}.bind(this));
			
			this.playlist.SoundPlayer.addEvent('positiontime',function(val,url){
				this.allPlaylistLi.get(url).get('timespan').set('html',val);
			}.bind(this));
		}
	},
	
	drawPlaylist: function() {
		this.addPlaylistElements();
		this.addPlaylistEvents();
	},
	
	//
	//
	//
	//
	//
	//
	// All Controller (seekbar + buttons) functions ->
	
	addControllerElements: function() {
		this.playerSpc = new Element('div', {'class': 'flower_soundplayer'});
		this.soundtitle = new Element('div', {'class':'flower_soundplayer_title','html':'&nbsp;'}).inject(this.playerSpc);
		this.soundtime = new Element('div', {'class':'flower_soundplayer_time','html':'&nbsp;'}).inject(this.playerSpc);
		this.seekbarSpc = new Element('div', {
			'class':'flower_soundplayer_seekbarcontainer',
			'styles': this.elementStyles.get('seekbarSpc')
		}).inject(this.playerSpc);
		this.seekbar = new Element('div', {
			'class':'flower_soundplayer_seekbar',
			'styles': this.elementStyles.get('seekbar')
		}).inject(this.seekbarSpc);
		this.position = new Element('div', {
			'class':'flower_soundplayer_positionmarker',
			'styles': this.elementStyles.get('position')
		}).inject(this.seekbarSpc);
		this.controls = new Element('div', {
			'class':'flower_soundplayer_controls',
			'styles': this.elementStyles.get('controls')
		}).inject(this.playerSpc);
		
		// play/pause/next buttons
		// click events are included here because they're the only reason for the elements to exist
		this.previousEl = new Element('img', {
			'class':'prev',alt:'prev',id:'prev',
			src:this.options.controlImages.previous,
			'styles': this.elementStyles.get('controlImageStyles'),
			'events': {
				'click': function(){
			       	this.playlist.playSound('previous');
		        }.bind(this)
			}
		}).inject(this.controls);
		this.playPauseEl = new Element('img', {
			'class':'play',alt:'play',id:'play',
			src:this.options.controlImages.play,
			'styles': this.elementStyles.get('controlImageStyles'),
			'events': {
				'click': function(){
			       	this.playlist.toggleCurrentSound();
		        }.bind(this)
			}
		}).inject(this.controls);
		this.nextEl = new Element('img', {
			'class':'next',alt:'next',id:'next',
			src:this.options.controlImages.next,
			'styles': this.elementStyles.get('controlImageStyles'),
			'events': {
				'click': function(){
					this.playlist.playSound('forcenext');
		        }.bind(this)
			}
		}).inject(this.controls);
		
		this.playerSpc.inject(document.id(this.targetElement));
	},
	
	addControllerEvents: function() {
		this.seekbar.addEvent('click', function(e) {
			var currentDuration;
			if (!this.playlist.currentSound.sound.loaded) {
				currentDuration = this.playlist.currentSound.sound.durationEstimate;
			} else {
				currentDuration = this.playlist.currentSound.sound.duration;
			}
			var masterCoords = this.seekbarSpc.getCoordinates();
			var progressCoords = this.seekbar.getCoordinates();
			var clickPosition = (e.page.x - progressCoords.left)/masterCoords.width;
			var ms = clickPosition*currentDuration;
			this.playlist.jumpCurrentSoundTo(ms);
		}.bind(this));
	
		this.playlist.SoundPlayer.addEvent('play', function(key,title,artist) {
			if (title) {
				this.soundtitle.set('text',title);
			} else {
				this.soundtitle.set('text',key);
			}
		}.bind(this));
		
		// add seekbar/position events:
		this.playlist.SoundPlayer.addEvent('progress', function(val) {
			if (val < .95) {
				var totalwidth = this.seekbarSpc.getSize().x;
				this.seekbar.setStyle('width',Math.round(totalwidth*val));
			} else {
				this.seekbar.setStyle('width','100%');
			}
		}.bind(this));
		
		this.playlist.SoundPlayer.addEvent('position', function(val) {
			var totalwidth = this.seekbarSpc.getSize().x;
			this.position.setStyle('left',Math.round(totalwidth*val));
		}.bind(this));
		
		this.playlist.SoundPlayer.addEvent('positiontime',function(val){
			this.soundtime.set('html',val);
		}.bind(this));
		
		// add image play/pause state events:
		this.playlist.SoundPlayer.addEvent('play', function() {
			this.playPauseEl.set('src',this.options.controlImages.pause);
		}.bind(this));

		this.playlist.SoundPlayer.addEvent('resume', function() {
			this.playPauseEl.set('src',this.options.controlImages.pause);
		}.bind(this));

		this.playlist.SoundPlayer.addEvent('pause', function() {
			this.playPauseEl.set('src',this.options.controlImages.play);
		}.bind(this));

		this.playlist.SoundPlayer.addEvent('stop', function() {
			this.playPauseEl.set('src',this.options.controlImages.play);
		}.bind(this));
	},
	
	drawController: function() {
		this.addControllerElements();
		this.addControllerEvents();
	},
	
	//
	//
	//
	//
	//
	//
	// Final logic to draw the UI
	
	drawUI: function() {
		if (this.isAppleiDevice) {
			this.drawPlaylist();
		} else {
			this.drawController();
			this.drawPlaylist();
		}
	}

});
window.addEvent('domready', function(){
	if (typeof(flowerUID) == 'object') {
		// point the SM2 paths relative to the Flower core:
		flowerUID.setModuleOptions('soundplayer',{
			sm2Location: flowerUID.libpath + 'soundplayer/lib/soundmanager2/soundmanager2.js',
			sm2swfLocation: flowerUID.libpath + 'soundplayer/lib/soundmanager2/swf/'
		});
		// register with a delayed call-back:
		var player = flowerUID.registerModule(FlowerSoundPlayer,'soundplayer',true);
		// finish the call-back after the player reports itself ready:
		player.addEvent('ready', function() {
			flowerUID.moduleCallback(player);
		});
	} else {
		// no auto-launch for standalone
	}
});