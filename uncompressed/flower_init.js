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
var cashuid; // store cashuid main object in global namespace
window.addEvent('domready', function(){
	// 0. pre-CUI page-specific code:

	// 1. assign new CUICore object to cashuid, set events
	cashuid = new CUICore({debug:1});
	
	// 2. allow for customizations, event listeners, additional module definitions
	// 3. call cashuid.bootstrap() to autoload necessary modules
	cashuid.bootstrap();
	
	// 4. call cashuid.loadModule('name') for any non-automated modules necessary for page scripts
	// 5. call cashuid.injectScript('url') for any additional scripts needed
	// 6. post-CUI page-specific code:

});
// page-specific code BEFORE domready:
