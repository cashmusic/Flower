/*	

flower_anchor.js

anchor functionality enhancements
part of the CASH Music Flower code
more information/downloads available at: http://cashmusic.org/tools/

revisions:
	FlowerLinkExternal (v1.1),
	FlowerLinkPopup (v1.0),
	FlowerLinkInside(v1.2)

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

var FlowerLinkExternal = new Class({
	/*
	Class FlowerLinkExternal
	
	replaces non-standard target="_blank" with similar functionality
	
	*/
	initialize: function(){
		this.name = 'linkexternal';
		this.version = 1.1;
	},
	
	attachToElement: function(el){
		el.removeEvents('click');
		el.addEvent('click', function(e){
			var extlocation = el.getProperty('href');
			e.stop();
			window.open(extlocation,'flower_'+$random(10000,99999)); 
		});
	}
});

var FlowerLinkPopup = new Class({
	/*
	Class FlowerLinkPopup
	
	opens a link in a popup window. defaults to a 480x320 window size, but
	all options can be overridden by specifying the popup options in the rev 
	property of the link
	
	rev="popup:options"
	
	any window.open options can be specified after 'popup:' in the rev 
	
	*/
	initialize: function(){
		this.name = 'linkpopup';
		this.version = 1.0;
		this.openoptions = 'width=480,height=320,scrollbars=yes,resizable=yes,location=no,directories=no,status=no';
	},
	
	attachToElement: function(el){
		var elRev = el.getProperty('rev'),
			elOptions = this.openoptions;
		el.removeEvents('click');
		if (elRev) {
			if (elRev.contains('popup:')) {
				elOptions = elRev.substring(6,elRev.length);
			}
		}
		el.addEvent('click', function(e){
			var poplocation = el.getProperty('href');
			e.stop();
			window.open(poplocation,'flower_external'+$random(10000,99999),elOptions); 
		}.bind(this));
	}
});

var FlowerLinkInside = new Class({
	/*
	Class FlowerLinkInside
	
	initiates a simple ajax content refresh. defaults to replacing the
	html of the nearest parent div of the specified link (will traverse 
	the DOM upwards until it finds a div element.) a target can be 
	specified by element id, or as 'parent' to replace the immediate
	parent element
	
	rev="linkinside:parent=parent"
	rev="linkinside:parent=elementid"
	
	*/
	initialize: function(){
		this.name = 'linkinside';
		this.version = 1.2;
	},
	
	attachToElement: function(el){ 
		el.removeEvents('click');
		el.addEvent('click', function(e){
			e.stop();
			var reqdata = '',
				reqtarget = '',
				reqlocation = el.getProperty('href'),
				elRev = el.getProperty('rev'),
				immediateParent = false,
				splitArgument,
				theRequest;
			if (reqlocation.contains('?')) {
				reqdata = reqlocation.split('?')[1];
				reqlocation = reqlocation.split('?')[0];
			}
			if (elRev) {
				if (elRev.contains('linkinside:')) {
					$A(elRev.substring(11,elRev.length).split(',')).each(function(argument) {
						splitArgument = argument.split('=');
						if (splitArgument[0] == 'target') {
							reqtarget = splitArgument[1];
						} 
					});
				}
				if (reqtarget == 'parent') {
					immediateParent = true;
				} else if (!reqtarget) {
					reqtarget = document.id(reqtarget);
				}
			}
			if (!reqtarget || reqtarget == 'parent') {
				reqtarget = document.id(el.getParent());
				if (!immediateParent) {
					while (reqtarget.getTag() != 'div') {
						reqtarget = reqtarget.getParent();
					}
				}
			}
			theRequest = new Request.HTML({
				url:reqlocation,
				update:reqtarget,
				data:reqdata,
				onSuccess: function() {
					if (this.flowerCore) {
						this.flowerCore.htmlContentChanged(reqtarget);
					}
				}.bind(this)
			}).get();
		}.bind(this));
	}
});

var FlowerDrawer = new Class({
	Implements: Options,
	
	options: {
		closeOnAttach: false
	},

	initialize: function(options){
		this.name = 'drawer';
		this.version = 1.0;
		this.setOptions(options);
	},

	closedrawer: function(drawer) {
		drawer.setStyle('height', 1);
		drawer.setStyle('display', 'none');
		drawer.store('FlowerDrawer_state',1);
	},
	
	toggle: function(drawer,link) {
		var stripheight;
		if (drawer.retrieve('FlowerDrawer_state') == 11) {
			stripheight = drawer.getScrollSize().y;
			drawer.store('FlowerDrawer_state',10);
			drawer.setStyle('height', stripheight);
			drawer.get('tween', {property: 'height',duration: 250,link: 'cancel'}).start(stripheight,1).chain(function(){
				drawer.setStyle('display', 'none');
				drawer.store('FlowerDrawer_state',1);
				var altText = drawer.retrieve('FlowerDrawer_altText');
				if (altText) {
					drawer.store('FlowerDrawer_altText',link.get('html'));
					link.set('html',altText);
				}
			}.bind(this));
		} else if (drawer.retrieve('FlowerDrawer_state') == 1) {
			drawer.store('FlowerDrawer_state',10);
			drawer.setStyle('display', 'block');
			stripheight = drawer.getScrollSize().y;
			drawer.get('tween', {property: 'height',duration: 250,link: 'cancel'}).start(1,stripheight).chain(function(){
				// set the height back to auto to allow window resize
				drawer.setStyle('height', 'auto');
				drawer.store('FlowerDrawer_state',11);
				var altText = drawer.retrieve('FlowerDrawer_altText');
				if (altText) {
					drawer.store('FlowerDrawer_altText',link.get('html'));
					link.set('html',altText);
				}
			}.bind(this));
		}
	},
	
	attachToElement: function(el){
		var elRev = el.getProperty('rev'),
			drawertarget = false,
			hideLink = false,
			altLinkText = false,
			computedDisplay;
		if (elRev) {
			if (elRev.contains('drawer:')) {
				$A(elRev.substring(7,elRev.length).split(',')).each(function(argument) {
					var splitArgument = argument.split('=');
					switch(splitArgument[0]) {
						case 'target':
							if(splitArgument[1]) {
								drawertarget = document.id(splitArgument[1]);
							}
							break;
						case 'hideLink':
							if(splitArgument[1]) {
								hideLink = splitArgument[1];
							}
							break;
						case 'altLinkText':
							if(splitArgument[1]) {
								// altLinkText cannot currently contain commas
								altLinkText = splitArgument[1];
							}
							break;
					}
				});
			}
			if (drawertarget) {
				var drawertarget_position = drawertarget.getStyle('position');
				if (drawertarget_position != 'absolute' && drawertarget_position != 'relative' && drawertarget_position != 'fixed') {
					drawertarget.setStyles({'position':'relative','overflow':'hidden'});
				} else {
					drawertarget.setStyle('overflow', 'hidden');
				}
				if (altLinkText) {
					drawertarget.store('FlowerDrawer_altText',altLinkText);
				}
				el.removeEvents('click');
				el.setStyle('cursor','pointer');
				// window.getComputedStyle is standard, other solution for IE
				if (drawertarget.currentStyle) {
					computedDisplay = drawertarget.currentStyle.display;
				} else {
					computedDisplay = document.defaultView.getComputedStyle(drawertarget,null);
					if (computedDisplay !== null) {
						computedDisplay = computedDisplay.getPropertyValue('display');
					} else {
						// Safari 2 getComputedStyle() bug workaround:
						computedDisplay = 'none';
					}
				}				
				if (computedDisplay == 'none') {
					this.closedrawer(drawertarget);
				} else {
					drawertarget.store('FlowerDrawer_state',11);
					if (this.options.closeOnAttach) {
						this.toggle(drawertarget,el);
					}
				}
				el.addEvent('click', function(e){
					var altText;
					e.stop();
					this.toggle(drawertarget,el);
					if (hideLink) {
						el.setStyle('display','none');
					}
				}.bind(this));
			} else {
				if(this.debugMsg) {this.debugMsg(1,'invalid target specified');}
			}
		} else {
			if(this.debugMsg) {this.debugMsg(1,'a target must be specified (rev="drawer:target=elementId") with a toggle anchor');}
		}
	}
});

window.addEvent('domready', function(){
	if (typeof(flowerUID) == 'object') {
		flowerUID.registerModule(FlowerLinkExternal,'linkexternal');
		flowerUID.registerModule(FlowerLinkPopup,'linkpopup');
		flowerUID.registerModule(FlowerLinkInside,'linkinside');
		flowerUID.registerModule(FlowerDrawer,'drawer');
	} else {
		var linkexternal = new FlowerLinkExternal(),
			linkpopup = new FlowerLinkPopup(),
			linkinside = new FlowerLinkInside(),
			drawer = new FlowerLinkInside();
		$$('a.external').each(function(a){linkexternal.attachToElement(a);});
		$$('a.popup').each(function(a){linkpopup.attachToElement(a);});
		$$('a.flower_linkinside').each(function(a){linkinside.attachToElement(a);});
		$$('a.flower_drawertoggle').each(function(a){drawer.attachToElement(a);});
	}
});