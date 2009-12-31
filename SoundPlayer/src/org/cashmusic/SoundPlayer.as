package org.cashmusic {
    import flash.display.Sprite;
    import flash.events.*;
    import flash.external.*;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.media.SoundTransform;
    import flash.net.URLRequest;
    import flash.utils.Timer;
	
	public class SoundPlayer extends Sprite {
		private var channel:SoundChannel = new SoundChannel();
		private var trans:SoundTransform = new SoundTransform(0.5, 0);
		private var sounds:Object = new Object();
		private var data:Object = new Object();
		private var currentSound:Sound = null;
		private var internalTimer:Timer;
		
		public function SoundPlayer() {   	
        	// set the transform on the channel to apply universal volume 
        	this.trans = this.channel.soundTransform;
        	
        	// get the timer interval from flashVars, set it
        	var timerInterval:Number = 500;
        	if (root.loaderInfo.parameters.statusInterval != null) {
        		timerInterval = Number(root.loaderInfo.parameters.statusInterval);
        	}
        	this.internalTimer = new Timer(timerInterval);
        	
        	// start the timer, add event handling for it
        	this.internalTimer.start();
        	this.internalTimer.addEventListener(TimerEvent.TIMER, internalTimerHandler);
        	
        	// add an object to track load status
        	this.data.loadState = new Object();
        	
        	// add all public callbacks
        	ExternalInterface.addCallback("startSound", startSound);
			ExternalInterface.addCallback("getBytesLoaded", getBytesLoaded);
			ExternalInterface.addCallback("getBytesTotal", getBytesTotal);
			ExternalInterface.addCallback("setVolume", setVolume);
			ExternalInterface.addCallback("getPosition", getPosition);
			ExternalInterface.addCallback("getDuration", getDuration);
			ExternalInterface.addCallback("stopSound", stopSound);
			
			ExternalInterface.call(root.loaderInfo.parameters.onLoad);
        }
        
        private function newSound(url:String):Sound {
            var s:Sound = new Sound();
            s.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
            var req:URLRequest = new URLRequest(url);
            s.load(req);
            
            // add events
        	s.addEventListener(Event.COMPLETE, loadCompleteHandler);
			s.addEventListener(Event.ID3, soundID3Handler);
			
			// add loadState to Sound, add Sound to sounds object
			this.sounds[url] = s; 
			this.data.loadState[url] = false;
			
			return s;
		}
        
        private function startSound(url:String, position:Number = 0):Boolean {
			this.stopSound();
			var s:Sound = sounds[url];
			if (s == null) {
			    s = newSound(url);
			}
			this.channel = s.play(position,0,this.trans);
			
			// register the channel's sound complete event...
        	this.channel.addEventListener(Event.SOUND_COMPLETE, soundCompleteHandler);
			
			this.currentSound = s;
			return true;
		}
		
		private function stopSound():void {
			this.channel.stop();
		}
		
		private function setVolume(volume:Number):void {
            this.trans.volume = volume;
            this.channel.soundTransform = this.trans;
        }
		 
		private function getProgress(url:String):Number {
			var s:Sound = sounds[url];
			if (s == null) return 0;
			return Math.floor((s.bytesLoaded / s.bytesTotal) * 100);
		}
		 
		private function getBytesLoaded(url:String):Number {
			var s:Sound = sounds[url];
			if (s == null) return 0;
			return s.bytesLoaded;
		}
		 
		private function getBytesTotal(url:String):Number {
			var s:Sound = sounds[url];
			if (s == null) return 0;
			return s.bytesTotal;
		}
		 
		private function getPosition():Number {
			return Math.floor(this.channel.position);
		}
		 
		private function getDuration(url:String):Number {
			var s:Sound = sounds[url];
			if (s == null) return 0;
			return s.length;
		}
		
		private function ioErrorHandler(event:IOErrorEvent):void {
        	var s = event.target;
            ExternalInterface.call(root.loaderInfo.parameters.onError, s.url, 'ioError', event.text);
        }
        
        private function loadCompleteHandler (event:Event):void {
			var s = event.target;
			//s.loadState = true;
			ExternalInterface.call(root.loaderInfo.parameters.onSoundLoaded, s.url);
		}
		
		private function soundCompleteHandler(event:Event):void {
			ExternalInterface.call(root.loaderInfo.parameters.onSoundEnd, this.currentSound.url);
		}
		
		private function internalTimerHandler(event:Event):void {
			if (this.currentSound !== null) {
				var currentLength:Number = this.currentSound.length;
				var currentPosition:Number = this.channel.position;
				var currentBytesLoaded:Number = this.currentSound.bytesLoaded;
				if (this.currentSound != null && (currentLength != this.data.lastLength || currentPosition != this.data.lastPosition || currentBytesLoaded != this.data.lastBytesLoaded)) {
					// figure out load percentage and use that to estimate the overall position (length
					// measures total time, but based on the loaded file part, not the totalBytes) 
					var loadPercentage:Number = Math.round((currentBytesLoaded/this.currentSound.bytesTotal)*100);
					var aproximatePosition:Number = Math.round(((currentPosition/currentLength)*100)*(loadPercentage/100));
					ExternalInterface.call(root.loaderInfo.parameters.onStatusChange, this.currentSound.url, Math.round(currentLength), Math.round(currentPosition), this.currentSound.bytesTotal, currentBytesLoaded, loadPercentage, aproximatePosition);
					this.data.lastLength = currentLength;
					this.data.lastPosition = currentPosition;
					this.data.lastBytesLoaded = currentBytesLoaded;
				} 
			}
		}
		
		private function soundID3Handler(event:Event):void {
			var s = event.target;
			try {
				for (var prop in s.id3) {
					ExternalInterface.call(root.loaderInfo.parameters.registerID3, s.url, prop, s.id3[prop]);
			    }
			} catch (e:Error) {
				s.removeEventListener(Event.ID3, soundID3Handler);
				ExternalInterface.call(root.loaderInfo.parameters.onError, this.currentSound.url, e.name, e.message);
			}
		}
    }
}