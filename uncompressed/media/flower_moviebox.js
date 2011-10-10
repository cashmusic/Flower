/*	

flower_moviebox.js v1.3

a mootools based lightbox-type script for movie links and streaming content
part of the CASH Music Flower code
more information/downloads available at: http://cashmusic.org/tools/

inspired by slimbox versions by christophe beyls (http://www.digitalia.be)
and aaron newton (http://clientside.cnet.com/)

requires:
+ mootools v1.2.4
+ flower_overlay v1.0+

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

var FlowerMoviebox = new Class({
	/*
	Class FlowerMoviebox
	
	Flower Moviebox displays Quicktime and some video-sharing site embedded Flash in
	an overlay box. It supports .mov/.mp4 movie files, or content from youtube, 
	myspace tv, google video, or vimeo.com. Intended to be auto-initiated with 
	links pointing to supported content, the Flower Moviebox script should be a low-
	maintenance addition to a page.
	
	
	OPTIONS:
	+ fadelevel (0.85)
	  sets the opacity level of the overlay (between 0 and 1)
	  
	+ overlaycolor ('#000000')
	  sets the background color of the overlay
	  
	+ contentspcbg ('#000000')
	  sets the background color of the content space
	  
	+ linkcolor ('#999999')
	  sets the color of links in captions and default pagination control 
	  
	+ linkovercolor ('#ffffff')
	  sets the hover color of links
	  
	+ textcolor ('#000000')
	  sets the default text color
	  
	+ borderwidth (5)
	  sets the width (in pixels) for the content space border
	  
	+ boxwidth (480)
	  default width of movie
	  
	+ boxeight (320)
	  default width of movie, will be adjusted for ratio and controls for 
	  movie sharing sites
	  
	+ caption ('')
	  the caption to display by default
	  
	+ showcontrols (false)
	  show/hide quicktime controls in embedded movies  
	
	KEY METHODS:
	+ attachToElement(anchor element el)
	  attaches a showMovie click event to an anchor containing a movie link
	  
	+ showMovie(string movType, string movCaption, url movUrl, integer movWidth,
		 integer movHeight)
	  opens an overlay window showthing the specified movie
	
	CSS CLASSES AVAILABLE FOR STYLING (from flower_overlay.js)
	+ .flower_overlay
	+ .flower_overlaycontentspc
	+ .flower_overlaycaptionspc
	+ .flower_overlaycaption
	+ .flower_overlaycontrollink
	
	*/
	Extends: FlowerOverlay,
	Implements: [Options,Events],

	options: {
		caption: '',
		movieObjectID: 'moviebox' + $random(10000,99999),
		showcontrols: 'false'
	},

	initialize: function(options){
		this.name = 'moviebox';
		this.version = 1.3;
		this.donotdebugoptions = false;
		this.currentMovie = null;
		this.movieurl = null;
		// utility object pointer below. change from flowerUID.getModule if using moviebox and
		// utility as standalone scripts
		this.flower_utility = flowerUID.getModule('utility');
		// set global state of moviebox (0 = uninitiated, 1 = hidden, 11 = visible)
		this.state = 0;
		this.setOptions(options);
		this.renderboxheight = this.options.boxheight;
		this.renderboxwidth = this.options.boxwidth;
		// plugin/axo detection
		this.flashDetected = this.flower_utility.detectPluginOrAxo('Flash');
		this.qtDetected = this.flower_utility.detectPluginOrAxo('QuickTime');
		// check for mobile
		this.ismobile = this.flower_utility.checkForMobile();
		this.addKeyEvents();
	},
	
	attachToElement: function(el) {
		/*
		Function attachToElement(anchor element el)
		
		Scans an anchor for links to movies or movie-pages on a video sharing site.
		If found, the function removes any existing click events and adds one to show 
		the linked video
		
		*/
		if (!this.ismobile) {
			var elLink = el.getProperty('href'),
				elLinkLc = elLink.toLowerCase(),
				elTitle = el.getProperty('title'),
				elRev = el.getProperty('rev'),
				elWidth = this.renderboxwidth,
				elHeight = this.renderboxheight,
				elMovieType = false,
				splitArgument;
			// check for custom rev settings
			if (elRev) {
				if (elRev.contains('moviebox:')) {
					$A(elRev.substring(9,elRev.length).split(',')).each(function(argument) {
						var splitArgument = argument.split('=');
						switch(splitArgument[0]) {
							case 'width':
								if(splitArgument[1]) {
									elWidth = splitArgument[1];
								}
								break;
							case 'height':
								if(splitArgument[1]) {
									elHeight = splitArgument[1];
								}
								break;
						}
					});
				}
			}
			// parse and store movie type, tweak dimensions where necessary
			if ((elLinkLc.contains('.mov') || elLinkLc.contains('.mp4')) && this.qtDetected) {
				elMovieType = 'qt';
				if (this.options.showcontrols == 'true') {elHeight += 16;}
			} else if (elLinkLc.contains('youtube.com/watch?v=')) {
				elMovieType = 'yt';
				elHeight = (elWidth*0.5625).round()+25;
			} else if (elLinkLc.test(/vimeo.com\/\d/)) {
				elMovieType = 'vm';
			} else if (elLinkLc.contains('vevo.com/watch') && this.flashDetected) {
				elMovieType = 'vv';
			}
			if (elMovieType) {
				el.removeEvents('click');
				el.addEvent('click', function(e){
					this.showMovie(elMovieType,elTitle,elLink,elWidth,elHeight);
					e.stop();
				}.bind(this));
			}
		}
	},
	
	showMovie: function(movType,movCaption,movUrl,movWidth,movHeight) {
		/*
		Function showMovie(string movType, string movCaption, url movUrl, 
			integer movWidth, integer movHeight)
		
		Initiates a moviebox for the passed url. Can be attached to an anchor click
		event or called directly from an external script. 
		
		*/
		this.movieType = movType;
		this.caption = movCaption;
		this.movieurl = movUrl;
		this.renderboxwidth = movWidth;
		this.renderboxheight = movHeight;
		if (this.state == 0) {
			this.createDomElements();
			this.overlayCloseLink.set('html','close <small>[esc]</small>');
			this.state = 1;
		}
		this.showOverlay();
	},
	
	showOverlay: function() {
		/*
		Function showOverlay()
		
		From the parent flower_overlay. Adds a this.state check to ensure the overlay
		is currently hidden.
		
		*/
		if (this.state == 1) {
			if (window.flowerUID) {
				var sp = flowerUID.getModule('soundplayer');
				if(sp) {
					sp.pauseCurrentSound();
				}
			}
			this.parent();
			// set this.state in showContent()
		}
	},
	
	showContent: function() {
		/*
		Function showContent()
		
		From the parent flower_overlay. Sets the html of the overlayContentSpc DOM element
		placing an object tag containing the specified movie. Uses .set('html',x) rather
		than proper DOM injection due to buggy <object> insertion for QuickTime and as 
		a way around the click-to-enable-Flash 'feature' of some browsers 
		
		*/
		if (this.movieType == 'qt') { 
			if (Browser.Engine.trident) {
				this.overlayContentSpc.set('html','<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" standby="loading quicktime..." codebase="http://www.apple.com/qtactivex/qtplugin.cab" width="'+this.renderboxwidth+'" height="'+this.renderboxheight+'" id="'+this.options.movieObjectID+'"><param name="src" value="'+this.movieurl+'" /><param name="scale" value="aspect" /><param name="controller" value="'+this.options.showcontrols+'" /><param name="cache" value="false" /><param name="autoplay" value="true" /><param name="bgcolor" value="'+this.options.contentspcbg+'" /><param name="enablejavascript" value="true" /></object>');
			} else {
				this.overlayContentSpc.set('html','<object id="'+this.options.movieObjectID+'" standby="loading quicktime..." type="video/quicktime" codebase="http://www.apple.com/qtactivex/qtplugin.cab" data="'+this.movieurl+'" width="'+this.renderboxwidth+'" height="'+this.renderboxheight+'"><param name="src" value="'+this.movieurl+'" /><param name="scale" value="aspect" /><param name="controller" value="'+this.options.showcontrols+'" /><param name="cache" value="false" /><param name="autoplay" value="true" /><param name="bgcolor" value="'+this.options.contentspcbg+'" /><param name="enablejavascript" value="true" /></object>');
			}
			this.currentMovie = document.getElementById(this.options.movieObjectID);
			// delay setting state to allow QT to be fully initialized...helps fix audio bug
			(function(){this.state = 11;}.bind(this)).delay(1200);
		} else if (this.movieType == 'yt' || this.movieType == 'vm') {
			var videoObjURL = this.parseVideoURL(this.movieurl);
			this.overlayContentSpc.set('html','<iframe src="'+videoObjURL+'" width="'+this.renderboxwidth+'" height="'+this.renderboxheight+'" frameborder="0" webkitAllowFullScreen allowFullScreen></iframe>');
			this.currentMovie = document.id(this.options.movieObjectID);
			this.state = 11;
		} else if (this.movieType == 'vv') {
			var videoObjURL = this.parseVideoURL(this.movieurl);
			this.overlayContentSpc.set('html','<object id="'+this.options.movieObjectID+'" standby="loading video..." type="application/x-shockwave-flash" width="'+this.renderboxwidth+'" height="'+this.renderboxheight+'" data="'+videoObjURL+'"><param name="movie" value="'+videoObjURL+'" /><param name="bgcolor" value="'+this.options.contentspcbg+'" /><param name="allowFullScreen" value="true" /><param name="wmode" value="window" /><param name="allowScriptAccess" value="always" /></object>');
			this.currentMovie = document.id(this.options.movieObjectID);
			this.state = 11;
		}
		this.positionCaption();
		this.fireEvent('videoCreated',this.currentMovie);
	},
	
	parseVideoURL: function(url) {
		/*
		Function parseVideoURL(url url)
		
		Accepts a URL, checks for validity against popular video sharing sites, and
		returns a direct URL for the embeddable SWF based on that site's standard
		format. Returns false if no known format is found.
		
		Supports: youtube.com links
				  google video links
				  vimeo.com links
		
		*/
		var newUrl = false,
			urlLc = url.toLowerCase(),
			miscVar;
		if (urlLc.contains('youtube.com/watch?v=')) {
			newUrl = url.replace(/watch\?v\=/i,'embed/');
			miscVar = newUrl.indexOf('&');
			if (miscVar > -1) {newUrl = newUrl.substr(0,miscVar);}
			newUrl += '?autoplay=1&amp;rel=0&amp;hd=1';
		} else if (urlLc.contains('vimeo.com/')) {
			cleanedUrl = this.movieurl.replace('www.','');
			newUrl = cleanedUrl.replace('vimeo.com/','player.vimeo.com/video/');
			newUrl += '?title=1&amp;byline=1&amp;portrait=1&amp;autoplay=1';
		} else if (urlLc.contains('vevo.com/watch')) {
			newUrl = 'http://www.vevo.com/VideoPlayer/Embedded?videoId=';
			miscVar = urlLc.lastIndexOf('/')+1;
			newUrl += urlLc.substr(miscVar,urlLc.length - miscVar);
			newUrl += '&autoplay=1&playerType=embedded&playlist=false';
		} 
		return newUrl;
	},
	
	hideOverlay: function() {
		/*
		Function hideOverlay()
		
		From the parent flower_overlay. Adds a this.state check to ensure the overlay
		is currently shown and not busy, handles video <object> cleanup.
		
		*/
		if (this.state == 11) {
			if (this.movieType == 'qt') {
				if (Browser.Engine.webkit || Browser.Engine.trident) {
					// Stop() is needed for Safari and IE, but not appreciated by others
					// display is set to none for the benefit of IE which doesn't like to let go
					this.currentMovie.Stop();
					this.currentMovie.style.display = 'none';
				}
			} else {
				if (!Browser.Engine.trident && this.movieType == 'vv') {
					// IE doesn't play well with dispose() on an <object>
					this.currentMovie.dispose();
				}
			}
			this.currentMovie = null;
			this.overlayContentSpc.set('html','');
			this.movieType = false;
			this.parent();
			this.state = 1;
		}
	}
});
window.addEvent('domready', function(){
	if (typeof(flowerUID) == 'object') {
		flowerUID.registerModule(FlowerMoviebox,'moviebox');
	} else {
		var moviebox = new FlowerMoviebox();
		// auto-attach to movie links
		$$('a[href$=.mov],a[href$=.mp4],a[href$=.MOV],a[href$=.MP4],a[href^=http://www.youtube.com/watch?v],a[href^=http://youtube.com/watch?v],a[href^=http://vimeo.com/],a[href^=http://www.vimeo.com/],a[href^=http://www.youtube.com/watch?v]').each(function(element){
			moviebox.attachToElement(element);
		});
	}
});