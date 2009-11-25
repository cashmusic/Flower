var playlist = [
	// object {url:string url, title:string title, artist: string artist]
	// or
	// string url
	{url:'http://diefranksdie.com/music/unep/02_myfriends.mp3',title:'My Friends',artist:'The Franks'},
	{url:'http://www.squidseyerecords.com/sounds/keith_kawaii_fresh_born.mp3',title:'Fresh Born',artist:'Keith Kawaii'},
	{url:'http://s3.amazonaws.com/cash_users/kristinhersh/Speedbath/Rubidoux/Rubidoux_128.mp3',title:'Rubidoux',artist:'Kristin Hersh'},
	{url:'http://s3.amazonaws.com/cash_users/adamgnade/HymnCalifornia/Music/WeLiveNowhere/WeLiveNowhere_160.mp3',title:'We Live Nowhere and Know No One',artist:'Adam Gnade'},
	{url:'http://s3.amazonaws.com/cash_users/colourmusic/colourmusic_YES.mp3',title:'Yes!',artist:'Colourmusic'},
	{url:'http://www.archive.org/download/nineinchnails_ghosts_I_IV/12_Ghosts_II_320kb.mp3',title:'Ghosts II',artist:'NIN'}
];

var player = new SoundPlayer({
	autostart:true,
	playlist:playlist,
	seekbarSpcStyle: {'position':'relative','background-color':'#fff','height':'3px','width':'100%','margin-top':'4px','overflow':'hidden'},
	seekbarStyle: {'position':'absolute','background-color':'#d8d6d3','height':'3px','width':'0%','cursor':'pointer','z-index':'10'},
	positionStyle: {'position':'absolute','left':'0%','width':'3px','height':'3px','background-color':'#f2f0ec','z-index':'15'}
});

player.addEvent('ready', function() {
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