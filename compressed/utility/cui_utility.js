/*	
measurement, detection, and conversion utility scripts
more information/downloads available at: http://uitools.cashmusic.org

distributed under the BSD license
Copyright (c) 2009, CASH Music
All rights reserved.
*/
var CUIUtility=new Class({initialize:function(){this.name="utility";this.version=1;this.donotdebugoptions=true;this.documenthead=$$("head")[0];this.testDiv=null;this.fontsizeListener=null;this.documentInfo=$H({initialFontsize:0,currentFontsize:0});this.mediaInfo=$H();},createTestDiv:function(){this.testDiv=new Element("div",{id:"testDiv"+$random(10000,99999),styles:{position:"absolute",left:-9999,width:"1em"}}).injectInside(document.body);this.updateDocumentInfo();},updateDocumentInfo:function(){var a=this.testDiv.getSize().x,b=this.documentInfo.get("currentFontsize");if(this.documentInfo.get("initialFontsize")==0){this.documentInfo.set("initialFontsize",a);this.documentInfo.set("currentFontsize",a);}else{if(a!=b){this.documentInfo.set("currentFontsize",a);document.fireEvent("fontResize",a);
}}},testMediaQuery:function(d){if(!Browser.Engine.trident){if(!this.mediaInfo.has(d)){var b,a=false,c;if(!this.testDiv){this.createTestDiv();}b=new Element("style",{text:"@media "+d+" { #"+this.testDiv.id+" { cursor:wait !important; } }"}).injectInside(this.documenthead);c=document.defaultView.getComputedStyle(this.testDiv,null).getPropertyValue("cursor");if(c=="wait"){a=true;}b.destroy();this.mediaInfo.set(d,a);return a;}else{return this.mediaInfo.get(d);}}else{return false;}},checkForMobile:function(){if(this.testMediaQuery("handheld")||this.testMediaQuery("only screen and (max-device-width: 480px)")){return true;}else{return false;}},pxToEm:function(a){if(!this.testDiv){this.createTestDiv();}this.updateDocumentInfo();return(a/this.documentInfo.get("currentFontsize"));},emToPx:function(a){if(!this.fontsizeDiv){this.createTestDiv();
}this.updateDocumentInfo();return(a*this.documentInfo.get("currentFontsize"));},detectPluginOrAxo:function(c){var h=false,k=0,a=c,d=$H({flash:["Shockwave Flash","ShockwaveFlash.ShockwaveFlash"],quicktime:["QuickTime","QuickTimeCheckObject.QuickTimeCheck"]}),f=c.toLowerCase(),g,b;if(navigator.plugins&&navigator.plugins.length){k=1;}if(d.has(f)){if(k){a=d.get(f)[0];}else{a=d.get(f)[1];}}if(k){for(g=0;g<navigator.plugins.length;g++){b=navigator.plugins[g];if(b.name.indexOf(a)>-1){h=true;break;}}}else{try{axo=new ActiveXObject(a);}catch(j){axo=false;}if(axo){h=1;if(a.contains("QuickTime")&&!axo.IsQuickTimeAvailable(0)){h=0;}axo=null;}}return h;}});window.addEvent("domready",function(){if(typeof(cashuid)=="object"){cashuid.registerModule(CUIUtility,"utility");}});