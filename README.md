#Flower#
Flower provides easily used and easily customized functionality for media pages. 
The primary tools are photo and video lightboxes, some basic behaviors, and an
audio player / playlist manager using SoundManager 2.

This code uses [MooTools](http://mootools.net/), a JavaScript library that provides
enhanced functionality to the JS language. 

Basic usage is as simple as including a few lines of code in the <head> of an
HTML document, or installing a WordPress plugin.

More information at [cashmusic.org/tools/](http://cashmusic.org/tools/)

##Usage##
Flower is designed to be easy to use for the non-nerd, and easy to extend and
use as a base for the nerdier. Most functionality works automatically with
nothing more than a class name added to a div or a link.


###Soundplayer###
To use the Soundplayer module just add the 'flower_soundplayer' class to a 
link or a div. Added to a div it will search the div for links to audio and
populate a player. If no title is present the player will use the text between
the link tag as the track title. If you'd like to specify your own title just
add it to the--wait for it--title of the link.

When added to a link element, the 'flower_soundplayer' class will add [play] to
the end of the link text and it will be playable inline. 

A special 'flower_soundplayer_pageplayer' can be added to a div to create a
player from all stray audio links on the page. This only grabs audio that has 
not already been included in a player or given the 'flower_soundplayer' class.


###Imagebox###
To create an Imagebox collection you need only add the 'flower_imagebox' class 
to a link that points to an image. That image will be loaded in a lightbox. You
can also add the 'flower_imagebox' class to a div and all links to images will
be added automatically. 

By default be included in the 'default' collection. To create multiple 
collections either add an id to each 'flower_imagebox' div, or specify a
collection name in the rev attribute like so: 

    <a href="image.jpg" rev="imagebox:collection=mine">thumbnail</a>


###Moviebox###
The Moviebox works automatically by scanning for links to YouTube, Vimeo,
Google Video, MySpace TV, and Vevo pages. It also works on links to certain
Quicktime media. Flower will automatically determine if a users browser 
supports Quicktime, Flash (and soon HTML5.) Then it plays a movie at the
default size of 640x360. A title can be added using the title attribute of the
link. Size can be changed using the rev attribute:

    <a href="http://vimeo.com/175757" rev="moviebox:width=600,height=450">movie</a>


###Advanced Stuff###
(Advanced documentation and demos coming soon)



##CSS Classes##
The following classes are set when any content is displayed, allowing all
Flower features to be skinned with ease. Be sure to use the !important
declaration in your styles as all elements have been styled to a default set
of styles already.


###CSS Classes: Soundplayer###
    a.flower_soundplayer // add to an audio link for inline play
        span.flower_soundplayer_inlineplaypause // the inserted play / pause text

    div.flower_soundplayer_pageplayer // added to a div for a page player

    div.flower_soundplayer 
        div.flower_soundplayer_ui // everything before the playlist
            div.flower_soundplayer_title // current track title
            div.flower_soundplayer_time // current time / total time
            div.flower_soundplayer_seekbarcontainer // progress bar background
                div.flower_soundplayer_seekbar // loaded progress bar, clickable
                div.flower_soundplayer_positionmarker // the little slidey dude
            div.flower_soundplayer_controls // the space containing the buttons
                img.flower_soundplayer_prev // previous button
                img.flower_soundplayer_play // play button
                img.flower_soundplayer_next // next button
        ol.flower_soundplaylist // the playlist of all the player's sound files
            li.flower_soundplaylist_altli // even numbered lis
		
				
###CSS Classes: Overlays (Moviebox and Imagebox)###
    a.flower_imagebox // add to an image — added to default or specified collection
    div.flower_imagebox // add flower_imagebox to a div to create a collection

    div.flower_overlay_container // holds the overlay, do not restyle
        div.flower_overlay // the semi-transparent backdrop
        div.flower_overlay_contentcontainer // the box holding the image/video
            img.flower_imagebox_img // the actual image (imagebox only)
        div.flower_overlay_captioncontainer // holds the caption and controls
            p.flower_overlay_caption // caption
            div.flower_overlay_controls // the space for controls
                a.flower_overlay_controllink // any control links that appear

  
License
-------
Flower is (c) 2010 CASH Music, licensed under a BSD license: <http://creativecommons.org/licenses/BSD/>
