/*
Thanks to westonruter (http://github.com/westonruter) for the idea of including
base64 encoded files in the tests http://gist.github.com/253174
*/

var CUIAudioTest = new Class({

	Implements: [Events],

	initialize: function(){
		this.name = 'html5 audio test';
		this.version = 1.0;
		this.donotdebugoptions = true;
		this.playableFormats = [];
		this.unPlayableFormats = [];
		this.audioSupport = false;
		this.progress = 0;
		this.addEvents({'completedTest': $empty, 'completedAllTests': $empty});
		this.audioTests = new Hash({
			'mp3': {'extensions':['mp3'],'mime':'audio/mpeg','file':'data:audio/mpeg;base64,//MoxAAAAANIAAAAAExBTUUzLjk2LjFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//MoxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'},
			'ogg': {'extensions':['ogg'],'mime':'audio/ogg','file':'data:audio/ogg;base64,T2dnUwACAAAAAAAAAACEXphXAAAAADKlPqQBHgF2b3JiaXMAAAAAAUSsAAAAAAAAgLsAAAAAAAC4AU9nZ1MAAAAAAAAAAAAAhF6YVwEAAADG29GAD0j/////////////////MgN2b3JiaXM4AAAAQU87IGFvVHVWIGI0YiBbMjAwNTExMTddIChiYXNlZCBvbiBYaXBoLk9yZydzIGxpYlZvcmJpcykAAAAAAQV2b3JiaXMfQkNWAQAAAQAYY1QpRplS0kqJGXOUMUaZYpJKiaWEFkJInXMUU6k515xrrLm1IIQQGlNQKQWZUo5SaRljkCkFmVIQS0kldBI6J51jEFtJwdaYa4tBthyEDZpSTCnElFKKQggZU4wpxZRSSkIHJXQOOuYcU45KKEG4nHOrtZaWY4updJJK5yRkTEJIKYWSSgelU05CSDWW1lIpHXNSUmpB6CCEEEK2IIQNgtCQVQAAAQDAQBAasgoAUAAAEIqhGIoChIasAgAyAAAEoCiO4iiOIzmSY0kWEBqyCgAAAgAQAADAcBRJkRTJsSRL0ixL00RRVX3VNlVV9nVd13Vd13UgNGQVAAABAEBIp5mlGiDCDGQYCA1ZBQAgAAAARijCEANCQ1YBAAABAABiKDmIJrTmfHOOg2Y5aCrF5nRwItXmSW4q5uacc845J5tzxjjnnHOKcmYxaCa05pxzEoNmKWgmtOacc57E5kFrqrTmnHPGOaeDcUYY55xzmrTmQWo21uaccxa0pjlqLsXmnHMi5eZJbS7V5pxzzjnnnHPOOeecc6oXp3NwTjjnnHOi9uZabkIX55xzPhmne3NCOOecc84555xzzjnnnHOC0JBVAAAQAABBGDaGcacgSJ%2BjgRhFiGnIpAfdo8MkaAxyCqlHo6ORUuoglFTGSSmdIDRkFQAACAAAIYQUUkghhRRSSCGFFFKIIYYYYsgpp5yCCiqppKKKMsoss8wyyyyzzDLrsLPOOuwwxBBDDK20EktNtdVYY62555xrDtJaaa211koppZRSSikIDVkFAIAAABAIGWSQQUYhhRRSiCGmnHLKKaigAkJDVgEAgAAAAgAAADzJc0RHdERHdERHdERHdETHczxHlERJlERJtEzL1ExPFVXVlV1b1mXd9m1hF3bd93Xf93Xj14VhWZZlWZZlWZZlWZZlWZZlWYLQkFUAAAgAAIAQQgghhRRSSCGlGGPMMeegk1BCIDRkFQAACAAgAAAAwFEcxXEkR3IkyZIsSZM0S7M8zdM8TfREURRN01RFV3RF3bRF2ZRN13RN2XRVWbVdWbZt2dZtX5Zt3/d93/d93/d93/d93/d1HQgNWQUASAAA6EiOpEiKpEiO4ziSJAGhIasAABkAAAEAKIqjOI7jSJIkSZakSZ7lWaJmaqZneqqoAqEhqwAAQAAAAQAAAAAAKJriKabiKaLiOaIjSqJlWqKmaq4om7Lruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7rui4QGrIKAJAAANCRHMmRHEmRFEmRHMkBQkNWAQAyAAACAHAMx5AUybEsS9M8zdM8TfRET/RMTxVd0QVCQ1YBAIAAAAIAAAAAADAkw1IsR3M0SZRUS7VUTbVUSxVVT1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTVN0zRNIDRkJQAABADAYo3B5SAhJSXl3hDCEJOeMSYhtV4hBJGS3jEGFYOeMqIMct5C4xCDHggNWREARAEAAMYgxxBzyDlHqZMSOeeodJQa5xyljlJnKcWYYs0oldhSrI1zjlJHraOUYiwtdpRSjanGAgAAAhwAAAIshEJDVgQAUQAAhDFIKaQUYow5p5xDjCnnmHOGMeYcc44556B0UirnnHROSsQYc445p5xzUjonlXNOSiehAACAAAcAgAALodCQFQFAnACAQZI8T/I0UZQ0TxRFU3RdUTRd1/I81fRMU1U90VRVU1Vt2VRVWZY8zzQ901RVzzRV1VRVWTZVVZZFVdVt03V123RV3ZZt2/ddWxZ2UVVt3VRd2zdV1/Zd2fZ9WdZ1Y/I8VfVM03U903Rl1XVtW3VdXfdMU5ZN15Vl03Vt25VlXXdl2fc103Rd01Vl2XRd2XZlV7ddWfZ903WF35VlX1dlWRh2XfeFW9eV5XRd3VdlVzdWWfZ9W9eF4dZ1YZk8T1U903RdzzRdV3VdX1dd19Y105Rl03Vt2VRdWXZl2fddV9Z1zzRl2XRd2zZdV5ZdWfZ9V5Z13XRdX1dlWfhVV/Z1WdeV4dZt4Tdd1/dVWfaFV5Z14dZ1Ybl1XRg%2BVfV9U3aF4XRl39eF31luXTiW0XV9YZVt4VhlWTl%2B4ViW3feVZXRdX1ht2RhWWRaGX/id5fZ943h1XRlu3efMuu8Mx%2B%2Bk%2B8rT1W1jmX3dWWZfd47hGDq/8OOpqq%2BbrisMpywLv%2B3rxrP7vrKMruv7qiwLvyrbwrHrvvP8vrAso%2Bz6wmrLwrDatjHcvm4sv3Acy2vryjHrvlG2dXxfeArD83R1XXlmXcf2dXTjRzh%2BygAAgAEHAIAAE8pAoSErAoA4AQCPJImiZFmiKFmWKIqm6LqiaLqupGmmqWmeaVqaZ5qmaaqyKZquLGmaaVqeZpqap5mmaJqua5qmrIqmKcumasqyaZqy7LqybbuubNuiacqyaZqybJqmLLuyq9uu7Oq6pFmmqXmeaWqeZ5qmasqyaZquq3meanqeaKqeKKqqaqqqraqqLFueZ5qa6KmmJ4qqaqqmrZqqKsumqtqyaaq2bKqqbbuq7Pqybeu6aaqybaqmLZuqatuu7OqyLNu6L2maaWqeZ5qa55mmaZqybJqqK1uep5qeKKqq5ommaqqqLJumqsqW55mqJ4qq6omea5qqKsumatqqaZq2bKqqLZumKsuubfu%2B68qybqqqbJuqauumasqybMu%2B78qq7oqmKcumqtqyaaqyLduy78uyrPuiacqyaaqybaqqLsuybRuzbPu6aJqybaqmLZuqKtuyLfu6LNu678qub6uqrOuyLfu67vqucOu6MLyybPuqrPq6K9u6b%2Bsy2/Z9RNOUZVM1bdtUVVl2Zdn2Zdv2fdE0bVtVVVs2TdW2ZVn2fVm2bWE0Tdk2VVXWTdW0bVmWbWG2ZeF2Zdm3ZVv2ddeVdV/XfePXZd3murLty7Kt%2B6qr%2Brbu%2B8Jw667wCgAAGHAAAAgwoQwUGrISAIgCAACMYYwxCI1SzjkHoVHKOecgZM5BCCGVzDkIIZSSOQehlJQy5yCUklIIoZSUWgshlJRSawUAABQ4AAAE2KApsThAoSErAYBUAACD41iW55miatqyY0meJ4qqqaq27UiW54miaaqqbVueJ4qmqaqu6%2Bua54miaaqq6%2Bq6aJqmqaqu67q6Lpqiqaqq67qyrpumqqquK7uy7Oumqqqq68quLPvCqrquK8uybevCsKqu68qybNu2b9y6ruu%2B7/vCka3rui78wjEMRwEA4AkOAEAFNqyOcFI0FlhoyEoAIAMAgDAGIYMQQgYhhJBSSiGllBIAADDgAAAQYEIZKDRkRQAQJwAAGEMppJRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkgppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkqppJRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoplVJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSCgCQinAAkHowoQwUGrISAEgFAACMUUopxpyDEDHmGGPQSSgpYsw5xhyUklLlHIQQUmktt8o5CCGk1FJtmXNSWosx5hgz56SkFFvNOYdSUoux5ppr7qS0VmuuNedaWqs115xzzbm0FmuuOdecc8sx15xzzjnnGHPOOeecc84FAOA0OACAHtiwOsJJ0VhgoSErAYBUAAACGaUYc8456BBSjDnnHIQQIoUYc845CCFUjDnnHHQQQqgYc8w5CCGEkDnnHIQQQgghcw466CCEEEIHHYQQQgihlM5BCCGEEEooIYQQQgghhBA6CCGEEEIIIYQQQgghhFJKCCGEEEIJoZRQAABggQMAQIANqyOcFI0FFhqyEgAAAgCAHJagUs6EQY5Bjw1BylEzDUJMOdGZYk5qMxVTkDkQnXQSGWpB2V4yCwAAgCAAIMAEEBggKPhCCIgxAABBiMwQCYVVsMCgDBoc5gHAA0SERACQmKBIu7iALgNc0MVdB0IIQhCCWBxAAQk4OOGGJ97whBucoFNU6iAAAAAAAAwA4AEA4KAAIiKaq7C4wMjQ2ODo8AgAAAAAABYA%2BAAAOD6AiIjmKiwuMDI0Njg6PAIAAAAAAAAAAICAgAAAAAAAQAAAAICAT2dnUwAELAAAAAAAAACEXphXAgAAAE3ViFYCAQEACg%3D%3D'},
			'wav': {'extensions':['wav'],'mime':'audio/x-wav','file':'data:audio/x-wav;base64,UklGRnwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'},
			'aif': {'extensions':['aif','aiff'],'mime':'audio/x-aiff','file':'data:audio/x-aiff;base64,Rk9STQAAADhBSUZGQ09NTQAAABIAAQAAAAUAEEALu4AAAAAAAABTU05EAAAACgAAAAAAAAAAAAAAAAAAAAAAAA%3D%3D'}
		});
	},
	
	runTests: function() {
		try {	
			this.audioTests.each(function(item, index){
				try {
					var audio = new Audio();
				} catch(e) {
					this.fireEvent('completedAllTests');
				}
				if(audio.canPlayType(item['mime']) != 'no') {
					
					// If this event fires the file can play
					// (Didn't fire properly using moo's addEvent method)
					audio.addEventListener('canplaythrough', function(e){
						this.updateFormats(true,item['mime'],item['extensions']);
					}.bind(this), false);

					// If this event fires the file cannot play
					document.id(audio).addEvent('error', function(e){
						this.updateFormats(false,item['mime'],item['extensions']);
					}.bind(this));
			
					// try loading audio
					audio.src = item['file'];
					audio.load();
			
				} else {
					this.updateFormats(false,item['mime'],item['extensions']);
				}

			}.bind(this));
			
		} catch(e) {
			this.fireEvent('completedAllTests');
		}
		
	},
	
	updateFormats: function(canplay,mime,extensions) {
		if (!this.audioSupport) {
			this.audioSupport = true;
		}
		if (canplay) {
			this.playableFormats.combine(extensions);
		} else {
			this.unPlayableFormats.combine(extensions);
		}
		this.progress += 1;
		this.fireEvent('completedTest',mime);
		if (this.progress == this.audioTests.getLength()) {
			this.fireEvent('completedAllTests');
		}
	},
	
	getPlayableFormats: function() {
		return this.playableFormats;
	},
	
	getUnPlayableFormats: function() {
		return this.unPlayableFormats;
	},
	
	getAudioSupport: function() {
		return this.audioSupport;
	}
});

// everything below here just generates the test page. it'll all get scrapped 
// when we fully integrate and plug HTML5 into the soundplayer...
window.addEvent('domready', function(){
	audiotest = new CUIAudioTest();
	audiotest.addEvent('completedAllTests', function() {
		var resultsdiv = new Element('div', {
			'styles': {'width':400,'margin': '0 auto','padding-top':200,'font-family':'helvetica,arial,sans-serif'}
		}).inject(document.body);
		if (audiotest.getAudioSupport()) {
			new Element('h2', {
				'styles':{'font':'2em/1.5em HelveticaNeueLTStd-UltLt,"HelveticaNeueLT Std UltLt","Helvetica Neue Ultra Light","Helvetica Neue",HelveticaNeue-UltraLight,HelveticaLTStd-Light,Helvetica,Arial,sans-serif','font-weight':'100'},
				html: 'Good News'
			}).inject(resultsdiv);
			var successp = new Element('p', {
				html: 'Your browser supports HTML5 audio, so we can do neat things with it. Specifically, it can play: '
			}).inject(resultsdiv);
			new Element('span', {
				'styles': {'color':'#090','font-weight':'bold'},
				html: audiotest.getPlayableFormats().join(' ')
			}).inject(successp);
			var failp = new Element('p', {
				html: 'Unfortunately all good things have a downside. Your browser stinks at playing: '
			}).inject(resultsdiv);
			new Element('span', {
				'styles': {'color':'#c00','font-weight':'bold'},
				html: audiotest.getUnPlayableFormats().join(' ')
			}).inject(failp);
		} else {
				new Element('h2', {
					html: 'Bad News'
				}).inject(resultsdiv);
				var successp = new Element('p', {
					html: 'Your browser doesn\'t jibe with HTML5 audio. That\'s pretty weak.'
				}).inject(resultsdiv);
		}
	});
	audiotest.runTests();
});