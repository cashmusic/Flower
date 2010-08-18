/*	
CASH Music Flower bootstrap script
more information/downloads available at: http://cashmusic.org/tools/
*/
var flowerUID;
window.addEvent('domready', function(){
	flowerUID = new FlowerCore({debug:1});
	flowerUID.bootstrap();
});
