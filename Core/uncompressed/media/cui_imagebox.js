/*	

cui_imagebox.js v1.2

a mootools based lightbox-type script
part of the CASH UI Tools
more information/downloads available at: http://uitools.cashmusic.org

inspired by slimbox versions by christophe beyls (http://www.digitalia.be)
and aaron newton (http://clientside.cnet.com/)

requires:
• mootools v 1.2.4
• cui_overlay v1.0+

distributed under the BSD license, terms:
Copyright (c) 2009, CASH Music
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

var CUIImagebox = new Class({
	/*
	Class CUIImagebox
	
	CUI Imagebox is an image gallery script that automatically collects images
	and displays those collections in an overlay box. It supports full or dynamic 
	pre-loading, multiple collections, key controlled collection viewing, and fixed 
	width/height. Intended to be auto-initiated with links of class 'CUIImagebox', 
	or contained within a DIV of class 'CUIImagebox', the CUI Imagebox script should
	be a low-maintenance addition to a page.
	
	
	OPTIONS:
	• fadelevel (0.85)
	  sets the opacity level of the overlay (between 0 and 1)
	  
	• overlaycolor ('#000000')
	  sets the background color of the overlay
	  
	• contentspcbg ('#ffffff')
	  sets the background color of the content space
	  
	• linkcolor ('#999999')
	  sets the color of links in captions and default pagination control 
	  
	• linkovercolor ('#ffffff')
	  sets the hover color of links
	  
	• textcolor ('#cccccc')
	  sets the default text color
	  
	• borderwidth (5)
	  sets the width (in pixels) for the content space border
	  
	• boxwidth (60)
	  default width of images, shown at first opening of overlay
	  
	• boxheight (60)
	  default height of images, shown at first opening of overlay
	  
	• zindex (1234)
	  sets default z-index for the overlay DIV
	  
	• fixedSize (false)
	  if true, width and height will not be computed — images will all be forced to 
	  the default boxwidth and boxheight
	  
	• fullPreload (true)
	  choose between a full pre-load (true) of all images, or a dynamic pre-load 
	  (false) for larger collections. dynamic pre-load loads the current, next, and
	  previous images as requested.
	
	KEY METHODS:
	• attachToElement(anchor element el)
	  attaches a showImage click event to an anchor containing an image link
	  
	• newCollection(string collectionName)
	  creates a new collection with the specified name
	  
	• addToCollection(string collectionName, string link, string caption,
			string alt, integer imgWidth, integer imgHeight)
	  adds an image to a specified collection
	  
	• showImage(string collectionName, integer collectionPlace)
	  opens an overlay window showing the specified image
	
	CSS CLASSES AVAILABLE FOR STYLING (from cui_overlay.js)
	• .cui_overlay
	• .cui_overlaycontentspc
	• .cui_overlaycaptionspc
	• .cui_overlaycaption
	• .cui_overlaycontrollink
	
	*/
	Extends: CUIOverlay,
	Implements: Options,

	options: {
		contentspcbg: '#ffffff',
		boxwidth: 60,
		boxheight: 60,
		fixedSize: false,
		fullPreload: true
	},

	initialize: function(options){
		this.name = 'imagebox';
		this.version = 1.0;
		this.donotdebugoptions = false;
		// uses cui_utility module for checkForMobile() call. if using as standalone script
		// simply copy that function into this class for efficiency 
		this.ismobile = cashuid.getModule('utility').checkForMobile();
		// set global state of imagebox (0 = uninitiated, 1 = hidden, 10 = visible/busy, 11 = visible/normal)
		this.state = 0;
		this.setOptions(options);
		this.caption = '';
		this.renderboxheight = this.options.boxheight;
		this.renderboxwidth = this.options.boxwidth;
		this.collections = $H();
		this.newCollection('default');
		this.addKeyEvents();
		this.computeMaxSize();
	},
	
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
					if (elLink.toLowerCase().contains('.jpg') || 
						elLink.toLowerCase().contains('.jpeg') || 
						elLink.toLowerCase().contains('.gif') || 
						elLink.toLowerCase().contains('.png')) 
					{
						this.addFromLink(a,divCollection);
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
	
	showImage: function(collectionName,collectionPlace) {
		/*
		Function showImage(string collectionName, integer collectionPlace)
		
		Initiates display of the imagebox, opening to the specified collection and place
		
		*/
		this.currentCollection = collectionName;
		this.currentPlace = collectionPlace;
		if (this.state == 0) {
			this.createDomElements();
			this.resizeContentSpc = new Fx.Morph(this.overlayContentSpc, {duration: 400});
			this.fadeOverlayCaptionSpc = new Fx.Tween(this.overlayCaptionSpc,{property: 'opacity',duration:100, link:'cancel'});
			this.createImages();
			this.currentImg.fade('hide');
			this.state = 1;
		} 
		this.showOverlay();
	},
	
	addControlElements: function() {
		/*
		Function addControlElements()
		
		From the parent cui_overlay. Extended to add previous and next links
		
		*/
		this.parent();
		this.overlayCloseLink.set('html','close <small>[esc]</small>');
		this.overlayPrevLink = new Element('a', {
			'class': 'cui_overlaycontrollink',
			'styles': {
				'color': this.options.linkcolor,
				'margin': '0 1.3em 0 0',
				cursor: 'pointer'
			},
			'html': 'previous <small>[&#8592;]</small>',
			'events': {
				'mouseover': function(e){
					this.overlayPrevLink.setStyle('color',this.options.linkovercolor);
				}.bind(this),
				'mouseout': function(e){
					this.overlayPrevLink.setStyle('color',this.options.linkcolor);
				}.bind(this),
				'click': function(e){
					this.previousImage();
					e.stop();
				}.bind(this)
			}
		}).inject(this.overlayCloseLink,'before');
		this.overlayNextLink = new Element('a', {
			'class': 'cui_overlaycontrollink',
			'styles': {
				'color': this.options.linkcolor,
				'margin': '0 0 0 1.3em',
				cursor: 'pointer'
			},
			'html': 'next <small>[&#8594;]</small>',
			'events': {
				'mouseover': function(e){
					this.overlayNextLink.setStyle('color',this.options.linkovercolor);
				}.bind(this),
				'mouseout': function(e){
					this.overlayNextLink.setStyle('color',this.options.linkcolor);
				}.bind(this),
				'click': function(e){
					this.nextImage();
					e.stop();
				}.bind(this)
			}
		}).inject(this.overlayCloseLink,'after');
	},
	
	addKeyEvents: function() {
		/*
		Function addKeyEvents()
		
		Adds keybindings for 'esc' (close), 'left' (previous), and 'right' (next)
		
		*/
		document.addEvent('keydown', function(e){
			if (this.state == 11) {
				switch (e.key) {
					case 'left':
						this.previousImage();
						break;
					case 'right':
						this.nextImage();
						break;
					case 'esc':
						this.hideOverlay();
						break;
				}
			}
		}.bind(this));
	},
	
	computeMaxSize: function() {
		/*
		Function computeMaxSize()
		
		Tests the current window size and sets appropriate max height/width for an image
		
		*/
		var windowSize =  window.getSize();
		this.maxSize = $H({
			'x': windowSize.x - 80,
			'y': windowSize.y - 120
		});
	},
	
	newCollection: function(collectionName) {
		/*
		Function newCollection(string collectionName)
		
		Wrapper function creates a new collection in collections Hash
		
		*/
		this.collections.set(collectionName, []);
	},
	
	addToCollection: function(collectionName,link,caption,alt,imgWidth,imgHeight) {
		/*
		Function addToCollection(string collectionName, string link, string caption,
			string alt, integer imgWidth, integer imgHeight)
		
		Adds image data to the specified collection
		
		imgData: [0] href, 
				 [1] caption, 
				 [2] specified 'alt', 
				 [3] width, 
				 [4] height,
				 [5] loaded

		*/
		var imgData = [link,caption,alt,imgWidth,imgHeight,-1],
			currentCollection = this.collections.get(collectionName);
		currentCollection.push(imgData);
		if (this.options.fullPreload) {
			var collectionPlace = currentCollection.length - 1;
			this.preloadAndMeasure(collectionName,collectionPlace);
		}
	},
	
	preloadAndMeasure: function(collectionName,collectionPlace) {
		/*
		Function preloadAndMeasure(string collectionName, integer collectionPlace)
		
		Attempts to pre-load and measure a given image. Stores load status, width,
		and height in the collection Hash. If an image fails to load (onError) it 
		removes the image from its parent collection.
		
		Status Codes: -1 (uninitiated), 
					  0 (attempting to load), 
					  1 (loaded)
		
		*/
		var imgData = this.collections.get(collectionName)[collectionPlace],
		link,imgWidth,imgHeight,imgObj;
		if (imgData && imgData[5] == -1) {
			imgData[5] = 0;
			link = imgData[0],
			imgWidth = imgData[3],
			imgHeight = imgData[4],
			imgObj = new Image();
			imgObj.onload = function(){
				if (imgWidth == 0 || imgHeight ==0) {
					imgData[3] = imgObj.width;
					imgData[4] = imgObj.height;
				}
				imgData[5] = 1;
			};
			imgObj.onerror = function(){
				// onError remove from collection and remove click event
				var currentCollection = this.collections.get(collectionName);
				var newCollection = currentCollection.filter(function(item, index){
					return index != collectionPlace;
				});
				this.collections.set(collectionName, newCollection);
				// write debug message:
				if(this.debugMsg) {this.debugMsg(1,'cannot load "' + imgObj.src +
					'", removing it from collection "' + collectionName + '"');}
			}.bind(this);
			// set the src AFTER event declarations to ensure it fires in IE6 when cached
			imgObj.src = link;
		}
	},
	
	createImages: function() {
		/*
		Function createImages()
		
		Creates the main image in the overlayContentSpc DIV
		
		*/
		this.currentImg = new Element('img', {
			'class': 'CUIImageboximg',
			'src': '',
			'alt': '',
			'styles': {
				'visibility': 'hidden',
				'position': 'relative',
				'width': '100%',
				'height': '100%',
				'z-index': 10
			}
		}).inject(this.overlayContentSpc);
		this.currentImg.addEvent('click', function(){
			this.nextImage();
		}.bind(this));
		this.fadeCurrentImage = new Fx.Tween(this.currentImg,{property: 'opacity',duration:200, link:'chain'});
	},
	
	changeImage: function(collectionName,collectionPlace) {
		/*
		Function nextImage(string collectionName, integer collectionPlace)
		
		Checks load status of requested image, handles dynamic pre-load, and when
		ready it changes from the current image to the requested image
		
		*/
		var imgData = this.collections.get(collectionName)[collectionPlace];
		this.currentPlace = collectionPlace;
		// begin preload and status checks
		if (!imgData) {
			// if !imgData, check collection length. if zero, close imagebox entirely.
			if (this.collections.get(collectionName).length) {
				this.nextImage();
			} else {
				this.state = 11;
				this.hideOverlay();
			}
		} else if (imgData[5] < 1) {
			// if imgData[5] = -1, call preloadAndMeasure, changeImage.delay(100) then return false 
			this.state = 11;
			this.preloadAndMeasure(collectionName,collectionPlace);
			(function() {this.changeImage(collectionName,collectionPlace);}.bind(this)).delay(100);
		} else {
			// loaded and ok...open up
			this.state = 10;
			// preload next/previous
			this.preloadAndMeasure(this.currentCollection,this.nextPlace());
			this.preloadAndMeasure(this.currentCollection,this.previousPlace());
			this.fadeCurrentImage.start(0);
			if (!this.options.fixedSize) {	
				this.computeMaxSize();	
				// check if dimensions have been set by preload or manually, if not use standard size
				if (imgData[3] == 0) {this.renderboxwidth = this.options.boxwidth;} else {this.renderboxwidth = imgData[3];}
				if (imgData[4] == 0) {this.renderboxheight = this.options.boxheight;} else {this.renderboxheight = imgData[4];}
				var currentMaxWidth = this.maxSize.get('x'),
					currentMaxHeight = this.maxSize.get('y');
				if (this.renderboxwidth > currentMaxWidth || this.renderboxheight > currentMaxHeight) {
					var ratiox = this.renderboxwidth,
						ratioy = this.renderboxheight,
						deltax = ratiox - currentMaxWidth,
						deltay = ratioy - currentMaxHeight;
					if (deltax > deltay) {
						this.renderboxwidth = currentMaxWidth;
						this.renderboxheight = (ratioy * (currentMaxWidth/ratiox)).round();
					} else {
						this.renderboxheight = currentMaxHeight;
						this.renderboxwidth = (ratiox * (currentMaxHeight/ratioy)).round();
					}
				}
			}
			// check alt and caption
			this.caption = imgData[1];
			this.currentImg.set('alt',imgData[2]);
			this.fadeOverlayCaptionSpc.set(0);
			this.positionCaption();
			this.state = 10;
			this.resizeContentSpc.start({
				'height': this.renderboxheight,
				'width': this.renderboxwidth,
				'margin-top': (0-(this.renderboxheight/2)-this.options.borderwidth),
				'margin-left': (0-(this.renderboxwidth/2)-this.options.borderwidth)
			}).chain(function(){
				this.currentImg.src = imgData[0];
				(function(){
					this.fadeCurrentImage.start(1).chain(function() {
						this.state = 11;
					}.bind(this));
					this.fadeOverlayCaptionSpc.start(1);
				}.bind(this)).delay(120);
			}.bind(this));
		}
	},
	
	nextPlace: function() {
		/*
		Function previousPlace()
	
		Determines the target image for nextImage(). Separated to allow access
		for dynamic pre-loading.
		
		*/
		var collectionLength = this.collections.get(this.currentCollection).length,
			nextIndex = 0;
		if (this.currentPlace+2 <= collectionLength) {
			nextIndex = this.currentPlace + 1;
		} 
		return nextIndex;
	},
	
	previousPlace: function() {
		/*
		Function previousPlace()
		
		Determines the target image for previousImage(). Separated to allow access
		for dynamic pre-loading.
		
		*/
		var collectionLength = this.collections.get(this.currentCollection).length,
			previousIndex;
		if (this.currentPlace > 0) {
			previousIndex = this.currentPlace - 1;
		} else {
			previousIndex = collectionLength - 1;
		}
		return previousIndex;
	},
	
	nextImage: function() {
		/*
		Function nextImage()
		
		Checks collection length and calls changeImage() for the appropriate image
		
		*/
		if (this.state == 11) {
			var collectionLength = this.collections.get(this.currentCollection).length;
			if (collectionLength > 1) {	
				this.changeImage(this.currentCollection,this.nextPlace());
			}
		}
	},
	
	previousImage: function() {
		/*
		Function previousImage()
		
		Checks collection length and calls changeImage() for the appropriate image
	
		*/
		if (this.state == 11) {
			var collectionLength = this.collections.get(this.currentCollection).length;
			if (collectionLength > 1) {		
				this.changeImage(this.currentCollection,this.previousPlace());
			}
		}
	},
	
	showOverlay: function() {
		/*
		Function showOverlay()
		
		From the parent cui_overlay. Adds a this.state check to ensure the overlay
		is currently hidden, and deals with previous/next button styles.
		
		*/
		if (this.state == 1) {
			if (this.collections.get(this.currentCollection).length < 2) {
				this.overlayPrevLink.setStyle('display','none');
				this.overlayNextLink.setStyle('display','none');
			}
			this.parent();
			// set state to 10 (busy) to ensure opening animation completes properly
			this.state = 10;
		}
	},
	
	showContent: function() {
		/*
		Function showContent()
		
		Called from the parent cui_overlay.
		
		*/
		this.fadeCurrentImage.set(0);
		this.changeImage(this.currentCollection,this.currentPlace);		
	},	
	
	hideOverlay: function() {
		/*
		Function hideOverlay()
		
		From the parent cui_overlay. Adds a this.state check to ensure the overlay
		is currently shown and not busy, handles image and style cleanup.
		
		*/
		if (this.state == 11) {
			this.currentImg.setStyle('visibility','hidden');
			this.currentImg.src = '';
			if (!this.options.fixedSize) {			
				this.renderboxheight = this.options.boxheight;
				this.renderboxwidth = this.options.boxwidth;
				this.overlayContentSpc.setStyles({
					'height': this.renderboxheight,
					'width': this.renderboxwidth,
					'margin-top': (0-(this.renderboxheight/2)),
					'margin-left': (0-(this.renderboxwidth/2))
				});
			}
			this.overlayCaptionSpc.fade('hide');
			this.parent();
			if (this.collections.get(this.currentCollection).length < 2) {
				this.overlayPrevLink.setStyle('display','inline');
				this.overlayNextLink.setStyle('display','inline');
			}
			this.state = 1;
		}
	}
});
window.addEvent('domready', function(){
	if (typeof(cashuid) == 'object') {
		cashuid.registerModule(CUIImagebox,'imagebox');
	} else {
		var imagebox = new CUIImagebox();
		// auto-attach to .cui_imagebox links and .cui_imagebox div links
		$$('a.cui_imagebox,div.cui_imagebox').each(function(element){
			imagebox.attachToElement(element);
		});
	}
});