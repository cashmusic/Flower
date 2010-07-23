/*	

cui_init.js v1.0

CASH UI Tools bootstrap script
more information/downloads available at: http://uitools.cashmusic.org

requires:
mootools v 1.2.4
CUICore

usage:
provides domready block, any module customizations, custom routines and 
CUI initialization — THIS FILE SHOULD *NOT* BE COMPRESSED to allow for debug
and any quick changes

*/
var flowerUID; // store flowerUID main object in global namespace
window.addEvent('domready', function(){
	// 0. pre-CUI page-specific code:

	// 1. assign new CUICore object to flowerUID, set events
	flowerUID = new FlowerCore({debug:1});
	
	// 2. allow for customizations, event listeners, additional module definitions
	// 3. call flowerUID.bootstrap() to autoload necessary modules
	flowerUID.bootstrap();
	
	// 4. call flowerUID.loadModule('name') for any non-automated modules necessary for page scripts
	// 5. call flowerUID.injectScript('url') for any additional scripts needed
	// 6. post-CUI page-specific code:

});
// page-specific code BEFORE domready:
