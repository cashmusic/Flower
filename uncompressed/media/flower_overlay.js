/*	

flower_overlay.js v1.1

preps the overlay area for imagebox and moviebox
part of the CASH Music Flower code
more information/downloads available at: http://cashmusic.org/tools/

inspired by slimbox versions by christophe beyls (http://www.digitalia.be)
and aaron newton (http://clientside.cnet.com/)

requires:
+ mootools v1.2

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
var FlowerOverlay = new Class({
	/*
	Class FlowerOverlay
	
	Flower Overlay provides a standard DOM base for lightbox-type scripts. 
	Intended to be extended	by child classes with added functionality.
	
	
	CSS CLASSES AVAILABLE FOR STYLING
	+ .flower_overlay
	+ .flower_overlay_contentcontainer
	+ .flower_overlay_captioncontainer
	+ .flower_overlay_caption
	+ .flower_overlay_controls
	+ .flower_overlay_controllink
	
	*/
	initialize: function(){
		this.name = 'overlay';
		this.version = 1.1;
		this.donotdebugoptions = true;
	},

	options: {
		fadelevel: 0.85,
		overlaycolor: '#000000',
		contentspcbg: '#000000',
		linkcolor: '#999999',
		linkovercolor: '#ffffff',
		textcolor: '#cccccc',
		borderwidth: 5,
		boxwidth: 640,
		boxheight: 360,
		zindex: 1234
	},

	createDomElements: function() {
	/*
	Function createDomElements()
	
	Creates all the DOM elements needed for the overlay and adds their effects/events.
	
	*/
		this.overlaySpc = new Element('div', {
			'class': 'flower_overlay_container',
			'styles': {
				'position': (Browser.Engine.trident4) ? 'absolute' : 'fixed',
				'top': '0px',
				'left': '0px',
				'width': '100%',
				'height': '100%',
				'background': 'transparent',
				'z-index': this.options.zindex,
				'display': 'none'
			}
		}).inject(document.body);
		this.overlay = new Element('div', {
			'class': 'flower_overlay',
			'styles': {	
				'position': 'absolute',
				'top': '0px',
				'left': '0px',
				'width': '100%',
				'height': '100%',
				'visibility': 'hidden',
				'background': this.options.overlaycolor,
				'z-index': '1'
			}
		}).inject(this.overlaySpc);
		this.overlayContentSpc = new Element('div', {
			'class': 'flower_overlay_contentcontainer',
			'styles': {
				'position': 'absolute',
				'top': '50%',
				'left': '50%',
				'margin-top': (0-(this.renderboxheight/2)-this.options.borderwidth)+'px',
				'margin-left': (0-(this.renderboxwidth/2)-this.options.borderwidth)+'px',
				'width': this.renderboxwidth+'px',
				'height': '1px',
				'background-color': this.options.contentspcbg,
				'border': this.options.borderwidth + 'px solid '+this.options.contentspcbg,
				'overflow': 'hidden',
				'visibility': 'hidden',
				'z-index': '10'
			}
		}).inject(this.overlaySpc);
		this.overlayCaptionSpc = new Element('div', {
			'class': 'flower_overlay_captioncontainer',
			'styles': {
				'position': 'absolute',
				'top': '50%',
				'right': '50%',
				'margin-top': ((this.renderboxheight/2)+this.options.borderwidth)+'px',
				'margin-right': 0-(this.renderboxwidth/2)+'px',
				'background-color': 'transparent',
				'width': this.renderboxwidth+'px',
				'text-align': 'right',
				'visibility': 'hidden',
				'z-index': '20'
			}
		}).inject(this.overlaySpc);
		this.overlayCaption = new Element('p', {
			'class': 'flower_overlay_caption',
			'styles': {
				'color': this.options.textcolor,
				'display': 'none',
				'margin': '5px 0 0 0',
				'padding': '0',
				'z-index': '10'
			}
		}).inject(this.overlayCaptionSpc);
		this.addControlElements();
		this.addOverlayEffects();
		this.addOverlayEvents();
		if (Browser.Engine.trident4) {
			this.fixIe6Fixed();
			window.addEvent('scroll', this.fixIe6Fixed.bind(this));
		}
	},
	
	addControlElements: function() {
	/*
	Function addControlElements()
	
	Adds a standard 'close' button and a div for it to sit in. Split from the 
	other DOM elements so it can be more easily extended by a child to add 
	functionality or re-skin the standard appearance.
	
	*/
		this.overlayControlSpc = new Element('div', {
			'class': 'flower_overlay_controls',
			'styles': {
				'margin': '5px 0 0 0',
				'white-space': 'nowrap',
				'z-index': '15'
			}
		}).inject(this.overlayCaptionSpc);
		this.overlayCloseLink = new Element('a', {
			'class': 'flower_overlay_controllink',
			'styles': {
				'color': this.options.linkcolor,
				'margin': '0',
				cursor: 'pointer'
			},
			'html': 'close',
			'events': {
				'mouseover': function(e){
					this.overlayCloseLink.setStyle('color',this.options.linkovercolor);
				}.bind(this),
				'mouseout': function(e){
					this.overlayCloseLink.setStyle('color',this.options.linkcolor);
				}.bind(this),
				'click': function(e){
					this.hideOverlay();
					e.stop();
				}.bind(this)
			}
		}).inject(this.overlayControlSpc);
	},
	
	addOverlayEvents: function() {
	/*
	Function addOverlayEvents()
	
	Adds events to overlay DOM elements, default Fx can be over-written in extending
	classes.
	
	*/
		this.overlay.addEvent('click', this.hideOverlay.bind(this));
	},
	
	addOverlayEffects: function() {
	/*
	Function addOverlayEffects()
	
	Adds Moo Fx to overlay DOM elements, default Fx can be over-written in extending
	classes.
	
	*/
		this.fxOverlay = new Fx.Tween(this.overlay, {property: 'opacity', fps: 33, duration: 250});
		this.fxOpenContentSpc = new Fx.Tween(this.overlayContentSpc, {property: 'height', fps: 33, duration: 500});
	},
	
	addKeyEvents: function() {
		/*
		Function addKeyEvents()
		
		Adds a keydown event hiding the overlay when 'esc' is pressed.
		
		This will not fire if the movie type is a Flash movie with full-screen enabled
		as the Flash event listener will take precedence.
		
		*/
		document.addEvent('keydown', function(e){
			if (this.state == 11 && e.key == 'esc') {
				this.hideOverlay();
			}
		}.bind(this));
	},
	
	showOverlay: function() {
	/*
	Function showOverlay()
	
	Handles the reveal of all overlay DOM elements. Generally called using
	this.parent() in the showOverlay function of the extended element.
	
	*/
		this.overlayContentSpc.setStyles({
			'width': this.renderboxwidth+'px',
			'margin-left': (0-(this.renderboxwidth/2)-this.options.borderwidth)+'px',
			'margin-top': (0-(this.renderboxheight/2)-this.options.borderwidth)+'px'
		});
		this.overlaySpc.setStyle('display', 'block');
		this.fxOverlay.start(0,this.options.fadelevel).chain(function(){
			this.overlayContentSpc.setStyle('visibility', 'visible');
			this.fxOpenContentSpc.start(1,this.renderboxheight).chain(function(){
				// showContent should be defined in extending classes to set overlay content
				this.showContent(); 
			}.bind(this));
		}.bind(this));
	},
	
	positionCaption: function() {
	/*
	Function positionCaption()
	
	Checks whether or not the caption should be shown. Places it below the bottom-
	right corner of the overlaySpc DOM element.
	
	*/
		if (this.caption) {
			this.overlayCaption.set('html',this.caption);
			this.overlayCaption.setStyle('display', 'block');
		} else {
			this.overlayCaption.setStyle('display', 'none');
		}
		this.overlayCaptionSpc.setStyles({
			'width': this.renderboxwidth+'px',
			'margin-top': ((this.renderboxheight/2)+this.options.borderwidth)+'px',
			'margin-right': 0-(this.renderboxwidth/2)+'px',
			'visibility': 'visible'
		});
	},
	
	hideOverlay: function() {
	/*
	Function hideOverlay()
	
	Handles the hiding of all overlay DOM elements. Generally called using
	this.parent() in the hideOverlay function of the extended element.
	
	*/
		this.overlayContentSpc.setStyles({
			'visibility': 'hidden',
			'height': '1px'
		});
		this.overlayCaptionSpc.setStyle('visibility', 'hidden');
		this.fxOverlay.start(this.options.fadelevel,0).chain(function(){
			this.overlay.setStyle('visibility', 'hidden');
			if (!this.caption) {
				this.caption = '';
				this.overlayCaption.set('html','');
			}
			this.overlayCaption.setStyle('display', 'none');
			this.overlaySpc.setStyle('display', 'none');
		}.bind(this));
	},
	
	fixIe6Fixed: function() {
	/*
	Function fixIe6Fixed()
	
	Simulates position:fixed for the overlaySpc DOM element on IE6.
	
	should we even be supporting IE6?
	
	*/
		this.overlaySpc.setStyles({
			'top': window.getScroll().y+'px',
			'left': window.getScroll().x+'px',
			'width': '100%',
			'height': '100%'
		});
	}
});
window.addEvent('domready', function(){
	if (typeof(flowerUID) == 'object') {flowerUID.registerModule(FlowerOverlay,'overlay');}
});