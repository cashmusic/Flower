var playlist = [
	// object {url:string url, title:string title, artist: string artist]
	// or
	// string url
	{url:'http://diefranksdie.com/music/unep/02_myfriends.mp3',title:'My Friends',artist:'The Franks'},
	{url:'http://www.archive.org/download/VenaCava/02Vena_Cava_vbr.mp3',title:'Vena Cava',artist:'50FOOTWAVE'},
	{url:'http://www.archive.org/download/nineinchnails_ghosts_I_IV/12_Ghosts_II_320kb.mp3',title:'Ghosts II',artist:'NIN'}
];

var player = new SoundPlayer({
	playlist:playlist,
	swfLocation:'assets/scripts/SoundPlayer.swf',
	controlImages:{previous:'assets/images/previous.png',next:'assets/images/next.png',play:'assets/images/play.png',pause:'assets/images/pause.png'},
	seekbarSpcStyle: {'position':'relative','background-color':'#000','height':'3px','width':'100%','margin-top':'4px','overflow':'hidden'},
	seekbarStyle: {'position':'absolute','background-color':'#c00','height':'3px','width':'0%','cursor':'pointer','z-index':'10'},
	positionStyle: {'position':'absolute','left':'0%','width':'3px','height':'3px','background-color':'#fc0','z-index':'15'}
});

player.addEvent('ready', function() {
	$('soundplayerspc').getElement('div.title').set('text','Press Play');
	var mainUl = new Element('ol',{'styles':{'padding':0,'margin':0,'list-style-type':'decimal-leading-zero'}}).inject(this.controls);
	this.options.playlist.each(function(track,index) { 
		var tmpLi = new Element('li',{'styles':{'list-style-position':'inside'}}).inject(mainUl);
		var tmpSpan = new Element('span',{
			text:track.artist + ' - ' + track.title,
			'styles':{'cursor':'pointer'},
			'events':{
				'click': function(){
		        	allSoundKeys = this.sounds.getKeys();
					sound = this.sounds.get(track.url);
					this.currentKey = allSoundKeys.indexOf(track.url);
					this.currentSound = sound;
					this.playCurrentSound();
		        }.bind(this)
			}
		}).inject(tmpLi);;
	},this);
	mainUl.inject($('soundplayer_playlist'));
});