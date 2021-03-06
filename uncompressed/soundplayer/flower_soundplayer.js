/*	

flower_soundplayer.js v1.1

a mootools/SM2 based audio player and playlist manager
part of the CASH Music Flower code
more information/downloads available at: http://cashmusic.org/tools/

uses Scott Schiller's SoundManager2 for audio playback:
http://github.com/scottschiller/SoundManager2

requires:
+ mootools v 1.2.4
+ soundmanager2

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

var FlowerSoundPlayer = new Class({

/*
*
*
* SoundPlayer class:
* The SoundPlayer class manages a playlist of Sound objects, and (by default)
* creates a UI from which they can be controlled.
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
		this.version = 1.2;
		this.donotdebugoptions = false;
		this.sm2Loaded = false;
		this.currentSound = null;
		this.currentPlaylist = null;
		this.Playlists = $H();
		this.soundManager = null;
		this.sm2LoadTimer = null;
		this.sm2LoadTime = 0;
		this.isReady = false; // set to true when soundplayer is ready. used as a check — sm2 fires onready 2x on iphone
		this.isAppleiDevice = false;
		if ((navigator.userAgent.match(/iPad/i) !== null) || (navigator.userAgent.match(/iPhone/i) !== null) || (navigator.userAgent.match(/iPod/i) !== null)) {
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
	
	attachToElement: function(el) {
		/*
		Function attachToElement(anchor element el)
	
		Scans an anchor for links to images. If found, the function removes any 
		existing click events and adds one to show the linked image
		
		*/
		if (!this.ismobile) {
			if (el.get('tag') == 'a') {
				var elRev = el.getProperty('rev'),
					elLink = el.getProperty('href');
				if (this.soundManager.canPlayURL(elLink)) {
					var playlistName = elLink,
						elTitle = el.getProperty('title');
					el.store('isPlaying',false);
					el.store('prePlayTxt','');
					el.store('postPlayTxt',' <span class="flower_soundplayer_inlineplaypause">[play]</span>');
					el.store('prePauseTxt','');
					el.store('postPauseTxt',' <span class="flower_soundplayer_inlineplaypause">[pause]</span>');
					el.store('originalHTML',el.get('html'));
					this.loadPlaylist(playlistName, [{url:elLink,title:elTitle,artist:'Unknown'}]);
					if (elRev) {
						el.store('postPlayTxt','');
						el.store('postPauseTxt','');
						$A(elRev.substring(12,elRev.length).split(',')).each(function(argument) {
							var splitArgument = argument.split('=');
							switch(splitArgument[0]) {
								case 'playTextBefore':
									if(splitArgument[1]) {
										el.store('prePlayTxt',splitArgument[1]);
									}
									break;
								case 'playTextAfter':
									if(splitArgument[1]) {
										el.store('postPlayTxt',splitArgument[1]);
									}
									break;
								case 'pauseTextBefore':
									if(splitArgument[1]) {
										el.store('prePauseTxt',splitArgument[1]);
									}
									break;
								case 'pauseTextAfter':
									if(splitArgument[1]) {
										el.store('postPauseTxt',splitArgument[1]);
									}
									break;
							}
						}.bind(this));
					}
				}
				el.removeEvents('click');
				el.setStyle('cursor','pointer');
				el.set('html',el.retrieve('prePlayTxt') + el.retrieve('originalHTML') + el.retrieve('postPlayTxt'));
				el.addEvent('click', function(e){
					e.stop();
					this.switchPlaylist(playlistName);
					this.currentPlaylist.playOrToggleByURL(el.get('href'));
				}.bind(this));
				
				// add sound state html changes
				this.addEvent('play', function() {
					if (this.currentPlaylist.name == playlistName) {
						el.set('html',el.retrieve('prePauseTxt') + el.retrieve('originalHTML') + el.retrieve('postPauseTxt'));
						el.store('isPlaying',true);
					}
				}.bind(this));

				this.addEvent('resume', function() {
					if (this.currentPlaylist.name == playlistName) {
						el.set('html',el.retrieve('prePauseTxt') + el.retrieve('originalHTML') + el.retrieve('postPauseTxt'));
						el.store('isPlaying',true);
					}
				}.bind(this));

				this.addEvent('pause', function() {
					if (this.currentPlaylist.name == playlistName) {
						el.set('html',el.retrieve('prePlayTxt') + el.retrieve('originalHTML') + el.retrieve('postPlayTxt'));
						el.store('isPlaying',false);
					}
				}.bind(this));

				this.addEvent('stop', function() {
					if (this.currentPlaylist.name == playlistName) {
						el.set('html',el.retrieve('prePlayTxt') + el.retrieve('originalHTML') + el.retrieve('postPlayTxt'));
						el.store('isPlaying',false);
					}
				}.bind(this));
			} else if (el.get('tag') == 'div') {
				if (el.hasClass('flower_soundplayer_pageplayer')) {
					this.createPagePlayer(el);
				} else {
					var elId = el.get('id'),
						playlist = [],
						playlistName,
						playerUI;
					if (elId) {
						playlistName = elId;
					} else {
						playlistName = $random(10000,99999);
					}
					el.getElements('a').each(function(a){	
						var parsedA = this.parseAforPlaylist(a);
						if (parsedA) {
							playlist.push(parsedA);
						}
					}.bind(this));
					if (playlist.length > 0) {
						document.id(el).set('html','');
						this.loadPlaylist(playlistName, playlist);
						playerUI = new defaultSoundPlayerUI(this.currentPlaylist,el);
						playerUI.drawUI();
						el.setStyle('visibility','visible');
					}
				}
			}
		}
	},
	
	parseAforPlaylist: function(a) {
		var elLink = a.getProperty('href'),
			elTitle = a.getProperty('title');
			if (!elTitle) {
				elTitle = a.getProperty('text');
			}
		if (this.soundManager.canPlayURL(elLink)) {
			return {url:elLink,title:elTitle,artist:'Unknown'};
		} else {
			return false;
		}
	},
	
	createPagePlayer: function(targetEl,listname) {
		if (document.id(targetEl)) {
			var playlist = [],
				playlistName,
				playerUI;
			if (listname) {
				playlistName = listname;
			} else {
				playlistName = document.URL;
			}
			$$('a[href$=.mp3]','a[href$=.MP3]','a[href$=.ogg]','a[href$=.OGG]','a[href$=.m4a]','a[href$=.M4A]','a[href$=.wav]','a[href$=.WAV]').each(function(a){	
				var flowerparents = a.getParents('div.flower_soundplayer');
				if(flowerparents.length == 0 && !a.hasClass('flower_soundplayer')) {
					var parsedA = this.parseAforPlaylist(a);
					if (parsedA) {
						playlist.push(parsedA);
					}
					a.removeEvents('click');
					a.addEvent('click', function(e){
						e.stop();
						this.switchPlaylist(playlistName);
						this.currentPlaylist.playOrToggleByURL(a.get('href'));
					}.bind(this));
				}
			}.bind(this));
			if (playlist.length > 0) {
				this.loadPlaylist(playlistName, playlist);
				playerUI = new defaultSoundPlayerUI(this.currentPlaylist,document.id(targetEl));
				playerUI.drawUI();
			}
		}
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
	* this loads sounds based on an array of urls or objects
	* (see playlist format)
	*
	* loadSound(string/array urlOrArray, object options)
	* this loads a sound (from a url, or an object containing url, title, artist)
	*
	*
	*/
	
	loadPlaylist: function(playlistName, sounds) {
		if (!this.sm2Loaded) {
			this.onError('flash object not yet loaded. please use the \'ready\' event.');
		} else {
			this.currentPlaylist = this.Playlists.get(playlistName);
			if (this.currentPlaylist === null) {
				this.Playlists.set(playlistName, new SoundPlaylist(playlistName));
				this.currentPlaylist = this.Playlists.get(playlistName);
			}
			this.currentPlaylist.setSoundPlayer(this);
			sounds.each(function(sound) {
				this.currentPlaylist.loadSound(sound);
			},this);
			this.currentPlaylist.generateKeyIndex();
		}
		return this;
	},
	
	switchPlaylist: function(toPlaylistName) {
		if (this.Playlists.get(toPlaylistName) !== null && this.currentPlaylist.name != toPlaylistName) {
			if (this.currentPlaylist.currentSound) {	
				this.pauseCurrentSound();
			}
			this.currentPlaylist = this.Playlists.get(toPlaylistName);
		}
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
* SoundPlaylist class:
*
*
*/

	Implements: [Events],

	options: {
		loopPlaylist: false // whether the playlist should loop after completion of the last song
	},

	initialize: function(name) {
		this.SoundPlayer = null;
		this.sounds = $H();	
		this.currentSound = null;
		this.currentKey = 0;
		this.usingHTML5 = false;
		this.name = name;
		this.allSoundKeys = null;
	},
	
	/*
	*
	*
	* media control functions:
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
					this.SoundPlayer.fireEvent('stop',this.currentSound.sound.url);
					this.playSound('next');
				}.bind(this),
				whileplaying: function() {
					var s = this.currentSound.sound;
					if (!s.loaded) {
						currentDuration = s.durationEstimate;
					} else {
						currentDuration = s.duration;
					}
					approximatePosition = s.position / currentDuration;
					this.SoundPlayer.fireEvent('position', [approximatePosition,s.url]);
					
					currentDuration = Math.round(currentDuration / 1000);
					figureSec = Math.floor(currentDuration % 60);
					figureSec = (String(figureSec).length < 2) ? figureSec = String("0" + figureSec) :  figureSec = String(figureSec);
					currentDuration = Math.floor(currentDuration / 60) + ':' + figureSec;
					
					currentPosition = Math.round(s.position / 1000);
					figureSec = Math.floor(currentPosition % 60);
					figureSec = (String(figureSec).length < 2) ? figureSec = String("0" + figureSec) :  figureSec = String(figureSec);
					currentPosition = Math.floor(currentPosition / 60) + ':' + figureSec;
					
					this.SoundPlayer.fireEvent('positiontime', [currentPosition + ' / ' + currentDuration,s.url]);
					if (this.usingHTML5) {
						loadPercentage = s.bytesLoaded / s.bytesTotal;
						this.SoundPlayer.fireEvent('progress', loadPercentage);
					}
				}.bind(this),
				whileloading: function() {
					if (!this.usingHTML5) {
						loadPercentage = this.currentSound.sound.bytesLoaded / this.currentSound.sound.bytesTotal;
						this.SoundPlayer.fireEvent('progress', loadPercentage);
					}
				}.bind(this)
			}),
			title: theSound.title,
			artist: theSound.artist
		});
		if (this.sounds.get(theSound.url).sound.isHTML5) {
			this.usingHTML5 = true;
		}
		if (!this.currentSound) {
			this.currentSound = this.sounds.get(theSound.url);
		}
		return this;
	},
	
	generateKeyIndex: function() {
		this.allSoundKeys = this.sounds.getKeys();
	},

	playSound: function(whichSound) {
		this.makeCurrent();
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
			if (this.currentKey == 0) {
				key = allSoundKeys.length - 1;	
			} else {
				key = this.currentKey - 1;
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
		this.makeCurrent();
		if (this.currentSound.sound.paused) {
			this.currentSound.sound.resume();
			this.SoundPlayer.fireEvent('resume',this.currentSound.sound.url);
		}
	},
	
	playCurrentSound: function() {
		this.makeCurrent();
		if (this.currentSound.sound.paused) {
			this.currentSound.sound.setPosition(0);
			this.currentSound.sound.resume();
		} else {
			this.currentSound.sound.play();
		}
		this.SoundPlayer.fireEvent('play',[this.currentSound.sound.url,this.currentSound.title,this.currentSound.artist]);
	},
	
	pauseCurrentSound: function() {
		this.makeCurrent();
		if (this.currentSound.sound.playState == 1) {
			this.currentSound.sound.pause();
			this.SoundPlayer.fireEvent('pause',this.currentSound.sound.url);
		}
	},
	
	stopCurrentSound: function() {
		this.makeCurrent();
		if (this.currentSound.sound.playState != 0) {
			this.currentSound.sound.stop();
			this.SoundPlayer.fireEvent('stop',this.currentSound.sound.url);
		}
	},
	
	toggleCurrentSound: function() {
		this.makeCurrent();
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
	
	playOrToggleByURL: function(url) {
		var sound = this.sounds.get(url);
		if (this.currentSound != sound) {
			this.currentSound.sound.setPosition(0);
			this.stopCurrentSound();
			this.currentKey = this.allSoundKeys.indexOf(url);
			this.currentSound = sound;
			this.playCurrentSound();
		} else {
			this.toggleCurrentSound();
		}
	},
	
	jumpCurrentSoundTo: function(ms) {
		this.makeCurrent();
		this.currentSound.sound.setPosition(ms);
		if (this.currentSound.sound.paused) {
			this.resumeCurrentSound();
		}
		this.SoundPlayer.fireEvent('play',[this.currentSound.sound.url,this.currentSound.title,this.currentSound.artist]);
	},
	
	makeCurrent: function() {
		if (this.SoundPlayer.currentPlaylist != this) {
			this.SoundPlayer.switchPlaylist(this.name);
		}
	}

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
			this.allSoundKeys = this.playlist.allSoundKeys;
		} else {
			if (this.options.debug) {
				this.debugMessage('No playlist specified, cannot draw UI.');
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
		drawController: true,
		drawPlaylist: true,
		loadTitle: 'Press Play',
		assetPath: ''
	},
	
	initialize: function(playlist,targetElement,options) {
		this.parent(playlist,targetElement,options);
		this.setOptions(options);
		var scriptLocation = this.playlist.SoundPlayer.options.sm2swfLocation.replace('/lib/soundmanager2/swf/','');
		this.controlImages = {
			'previous': scriptLocation + '/assets/defaultSoundPlayerUI/images/previous.png',
			'next': scriptLocation + '/assets/defaultSoundPlayerUI/images/next.png',
			'play': scriptLocation + '/assets/defaultSoundPlayerUI/images/play.png',
			'pause': scriptLocation + '/assets/defaultSoundPlayerUI/images/pause.png'
		};
		if (this.options.forceAppleiDevice) {
			this.isAppleiDevice = true;
		}
		this.allPlaylistLi = $H();
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
		this.elementStyles = $H({
			'seekbarSpc': {'position':'relative','background-color':'#666','height':'9px','width':'100%','margin-top':'4px','overflow':'hidden'},
			'seekbar': {'position':'absolute','background-color':'#c00','height':'9px','width':'0%','cursor':'pointer','z-index':'10'},
			'position': {'position':'absolute','left':'0%','width':'3px','height':'9px','background-color':'#000','z-index':'15'},
			'controls': {'margin-top':'8px','text-align':'right'},
			'iDeviceLiStyles': {'background':'-webkit-gradient(linear, left top, left bottom, from(#666), to(#222))','color':'#fff'},
			'iDeviceLiStylesClicked': {'background':'-webkit-gradient(linear, left top, left bottom, from(#00acf1), to(#002939))','color':'#ed028d'},
			'controlImageStyles': {'margin-left':'4px','cursor':'pointer','width':'20px','height':'21px'}
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
		this.playlist.SoundPlayer.switchPlaylist(this.playlist.name);
		this.playlist.playOrToggleByURL(track.sound.url);
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
		var liCount = 1;
		this.mainPlaylistOl = new Element('ol',{
			'class':'flower_soundplaylist',
			'styles':{'font-size':'0.85em','padding':0,'margin':0,'list-style-type':'decimal-leading-zero'}
		});
		this.playlist.sounds.each(function(track,index) { 
			var tmpLi = new Element('li',{'styles':{'list-style-position':'inside'}}).inject(this.mainPlaylistOl);
			if (liCount%2 == 0) {
				tmpLi.addClass('flower_soundplaylist_altli');
			}
			liCount += 1;
			var tmpTitleSpan = new Element('span',{
				text:track.title,
				'styles':{'cursor':'pointer'},
				'events':{
					'click': function(){
						this.playlist.SoundPlayer.switchPlaylist(this.playlist.name);
						this.playlist.playOrToggleByURL(track.sound.url);
			        }.bind(this)
				}
			}).inject(tmpLi);
		},this);
		
		this.mainPlaylistOl.inject(this.playerSpc);
	},
	
	drawPlaylist: function() {
		var calledAlone = false;
		if (!this.playerSpc) {calledAlone = true;}
		if (calledAlone) {this.playerSpc = new Element('div', {'class': 'flower_soundplayer'});}
		this.addPlaylistElements();
		if (calledAlone) {this.playerSpc.inject(document.id(this.targetElement));}
	},
	
	//
	//
	//
	//
	//
	//
	// All Controller (seekbar + buttons) functions ->
	
	addControllerElements: function() {
		this.controlsSpc = new Element('div',{'class':'flower_soundplayer_ui'}).inject(this.playerSpc);
		this.soundtitle = new Element('div', {'class':'flower_soundplayer_title','html':this.options.loadTitle}).inject(this.controlsSpc);
		this.soundtime = new Element('div', {'class':'flower_soundplayer_time','html':'&nbsp;'}).inject(this.controlsSpc);
		this.seekbarSpc = new Element('div', {
			'class':'flower_soundplayer_seekbarcontainer',
			'styles': this.elementStyles.get('seekbarSpc')
		}).inject(this.controlsSpc);
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
		}).inject(this.controlsSpc);
		
		// play/pause/next buttons
		// click events are included here because they're the only reason for the elements to exist
		this.previousEl = new Element('img', {
			'class':'flower_soundplayer_prev',alt:'prev',
			src:this.controlImages.previous,
			'styles': this.elementStyles.get('controlImageStyles'),
			'events': {
				'click': function(){
					this.playlist.playSound('previous');
				}.bind(this)
			}
		}).inject(this.controls);
		this.playPauseEl = new Element('img', {
			'class':'flower_soundplayer_play',alt:'play',
			src:this.controlImages.play,
			'styles': this.elementStyles.get('controlImageStyles'),
			'events': {
				'click': function(){
					this.playlist.toggleCurrentSound();
				}.bind(this)
			}
		}).inject(this.controls);
		this.nextEl = new Element('img', {
			'class':'flower_soundplayer_next',alt:'next',
			src:this.controlImages.next,
			'styles': this.elementStyles.get('controlImageStyles'),
			'events': {
				'click': function(){
					this.playlist.playSound('forcenext');
		        }.bind(this)
			}
		}).inject(this.controls);
	},
	
	addControllerEvents: function() {
		this.seekbar.addEvent('click', function(e) {
			if (this.playlist.SoundPlayer.currentPlaylist != this.playlist) {
				this.playlist.SoundPlayer.switchPlaylist(this.playlist.name);
			}
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
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist) {
				if (title) {
					this.soundtitle.set('text',title);
				} else {
					this.soundtitle.set('text',key);
				}
			}
		}.bind(this));
		
		// add seekbar/position events:
		this.playlist.SoundPlayer.addEvent('progress', function(val) {
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist) {
				if (val < 0.95) {
					var totalwidth = this.seekbarSpc.getSize().x;
					this.seekbar.setStyle('width',Math.round(totalwidth*val));
				} else {
					this.seekbar.setStyle('width','100%');
				}
			}
		}.bind(this));
		
		this.playlist.SoundPlayer.addEvent('position', function(val,url) {
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist && this.playlist.currentSound.sound.url == url) {
				var totalwidth = this.seekbarSpc.getSize().x;
				this.position.setStyle('left',Math.round(totalwidth*val));
			}
		}.bind(this));
		
		this.playlist.SoundPlayer.addEvent('positiontime',function(val,url){
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist && this.playlist.currentSound.sound.url == url) {
				this.soundtime.set('html',val);
			}
		}.bind(this));
		
		// add image play/pause state events:
		this.playlist.SoundPlayer.addEvent('play', function(url) {
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist && this.playlist.currentSound.sound.url == url) {
				this.playPauseEl.set('src',this.controlImages.pause);
			}
		}.bind(this));

		this.playlist.SoundPlayer.addEvent('resume', function(url) {
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist && this.playlist.currentSound.sound.url == url) {
				this.playPauseEl.set('src',this.controlImages.pause);
			}
		}.bind(this));

		this.playlist.SoundPlayer.addEvent('pause', function(url) {
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist && this.playlist.currentSound.sound.url == url) {
				this.playPauseEl.set('src',this.controlImages.play);
			}
		}.bind(this));

		this.playlist.SoundPlayer.addEvent('stop', function(url) {
			if (this.playlist.SoundPlayer.currentPlaylist == this.playlist && this.playlist.currentSound.sound.url == url) {
				this.playPauseEl.set('src',this.controlImages.play);
			}
		}.bind(this));
	},
	
	drawController: function() {
		var calledAlone = false;
		if (!this.playerSpc) {calledAlone = true;}
		if (calledAlone) {this.playerSpc = new Element('div', {'class': 'flower_soundplayer'});}
		this.addControllerElements();
		this.addControllerEvents();
		if (calledAlone) {this.playerSpc.inject(document.id(this.targetElement));}
	},
	
	//
	//
	//
	//
	//
	//
	// Final logic to draw the UI
	
	drawUI: function() {
		this.playerSpc = new Element('div', {'class': 'flower_soundplayer'});
		if (this.options.drawController) {this.drawController();}
		if (this.options.drawPlaylist) {this.drawPlaylist();}
		this.playerSpc.inject(document.id(this.targetElement));
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