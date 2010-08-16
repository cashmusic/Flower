/*	

cui_utility.js v1.0

measurement, detection, and conversion utility scripts
part of the CASH Music Flower code
more information/downloads available at: http://cashmusic.org/tools/

requires:
+ mootools v1.2.4

distributed under the BSD license, terms:
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
var FlowerUtility = new Class({
	/*
	Class FlowerUtility
	
	Flower Utility provides measurement, detection, and conversion utilities. 
	It also stores basic document and media information for repeat access, 
	and enables the use of a document.fontResize method.


	EVENTS:
	+ document.fontResize(int newFontSize)
	
	KEY METHODS:
	+ testMediaQuery(string queryString)
	  tests a CSS @media query, returns true or false
	  
	+ checkForMobile()
	  uses Moo and CSS @media query to detect mobile device
	  
	+ pxToEm(int pixels)
	  converts given pixel amount to ems (per base document ems)
	  
	+ emToPx(int ems)
	  converts given em amount to pixels (per base document ems)
	  
	+ detectPluginOrAxo(string searchName)
	  scans plugins/activex for the given search name, accepts 'flash' and
	 'quicktime' as universal shortcuts
	
	*/
	initialize: function(){
		this.name = 'utility';
		this.version = 1.1;
		this.donotdebugoptions = true;
		this.documenthead = $$('head')[0];
		this.testDiv = null;
		this.documentInfo = $H({
			initialFontsize: 0,
			currentFontsize: 0
		});
		this.mediaInfo = $H();
	},
	
	createTestDiv: function() {
		/*
		Function createTestDiv()
		
		Creates an absolutely positioned DIV off-screen that can be tested by
		various functions.
		
		*/
		this.testDiv = new Element('div', {
			'id': 'testDiv' + $random(10000,99999),
			'styles': {
				'position': 'absolute',
				'left': -9999,
				'width': '1em'
			}
		}).injectInside(document.body);
	},
	
	testMediaQuery: function(queryString) {
		/*
		Function testMediaQuery(string queryString)
		
		Injects a style object containing a media query based on the queryString.
		Attempts to change the cursor property of this.testDiv and tests the computed
		style. Removes the style element, stores the result in this.mediaInfo then 
		returns true or false.
		
		inspired by http://dev.opera.com/articles/view/media-query-library/
			
		always returns false for IE6 due to lack of support for media queries...
			
		*/
		if (!Browser.Engine.trident) {
			if (!this.mediaInfo.has(queryString)) {
				var mQTestStyle,
					passedTest = false,
					computedCursor;
				if (!this.testDiv) {
					this.createTestDiv();
				}
				// IE6 strongly objects to setting the text for a style element:
				mQTestStyle = new Element('style',{
					'text': '@media ' + queryString + ' { #' + this.testDiv.id + ' { cursor:wait !important; } }'
				}).injectInside(this.documenthead);
				computedCursor = document.defaultView.getComputedStyle(this.testDiv,null).getPropertyValue('cursor');
				if (computedCursor == 'wait') {
					passedTest = true;
				}
				mQTestStyle.destroy();
				this.mediaInfo.set(queryString,passedTest);
				return passedTest;
			} else {
				return this.mediaInfo.get(queryString);
			}
		} else {
			return false;
		}
	},
	
	checkForMobile: function() {
		/*
		Function checkForMobile()
		
		Uses Moo (Browser.Platform.ipod) and a media query (@media handheld) to test
		if the current browser is a mobile device. Returns true or false.
			
		*/
		if (this.testMediaQuery('handheld') || 
			this.testMediaQuery('only screen and (max-device-width: 480px)')) {
			return true;
		} else {
			return false;
		}
	},
	
	pxToEm: function(px) {
		/*
		Function pxToEm(integer px)
		
		Converts pixels to base ems.
			
		*/
		if (!this.testDiv) {
			this.createTestDiv();
		}
		this.updateDocumentInfo();
		return(px / this.documentInfo.get('currentFontsize'));
	},
	
	emToPx: function(em) {
		/*
		Function emToPx(integer px)
		
		Converts base ems to pixels.
			
		*/
		if (!this.testDiv) {
			this.createTestDiv();
		}
		this.updateDocumentInfo();
		return(em * this.documentInfo.get('currentFontsize'));
	},
	
	detectPluginOrAxo: function(searchName) {
		/*
		Function detectPluginOrAxo(sting searchName)
		
		Searches for a plugin (or ActiveX object) based on the given search name. Can
		also accept a short-name to provide better cross browser support.
		
		Short Names Accepted: flash, quicktime
			
		*/
		var detected = false,
			standardPlugins = 0,
			searchFor = searchName,
			nameTranslation = $H({
				// searchstring (lowercase): Array(plugin name, activex name)
				'flash': ['Shockwave Flash','ShockwaveFlash.ShockwaveFlash'],
				'quicktime': ['QuickTime','QuickTimeCheckObject.QuickTimeCheck']
			}),
			searchForLower = searchName.toLowerCase(),
			i,
			currentPlugin;
		if (navigator.plugins && navigator.plugins.length) {standardPlugins = 1;}
		if (nameTranslation.has(searchForLower)) {
			if (standardPlugins) {
				searchFor = nameTranslation.get(searchForLower)[0];
			} else {
				searchFor = nameTranslation.get(searchForLower)[1];
			}
		}
		if (standardPlugins) {
			for (i=0; i < navigator.plugins.length; i++) {
				currentPlugin = navigator.plugins[i];
				if (currentPlugin.name.indexOf(searchFor) > -1) {
					detected = true;
					break;
				}
			}
		} else {
			try {
				axo = new ActiveXObject(searchFor);
			} catch(e) {
				axo = false;
			}
			if (axo) {
				detected = 1;
				if (searchFor.contains('QuickTime') && !axo.IsQuickTimeAvailable(0)) {detected = 0;}
				axo = null;
			} 
		}
		return detected;
	}
});
window.addEvent('domready', function(){
	if (typeof(flowerUID) == 'object') {flowerUID.registerModule(FlowerUtility,'utility');}
});