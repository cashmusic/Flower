<?php
/*
Plugin Name: CASH Music Flower
Plugin URI: http://cashmusic.org/tools/
Description: Adds MooTools 1.2.4 and Flower 1.0 to the head of a Wordpress template.
Version: 1.0
Author: CASH Music
Author URI: http://cashmusic.org/
License: BSD


distributed under a BSD license, terms:
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

class wpFlowerPlugin {
	
	function wpFlowerPlugin() {	
		add_action('init', array('wpFlowerPlugin','insert_flower_scripts'));
	}
	
	function flower_shortcode( $atts, $content = null ) {
	   return '<div class="flower_soundplayer_pageplayer"></div>';
	}
	
	function insert_flower_scripts() {
		$corepath = plugins_url('/assets/scripts/flower_core.js', __FILE__);
		$initpath = plugins_url('/assets/scripts/flower_init.js', __FILE__);
		
		add_shortcode('flower_soundplayer_pageplayer', array('wpFlowerPlugin','flower_shortcode'));
		
		wp_enqueue_script('mootools', 'http://ajax.googleapis.com/ajax/libs/mootools/1.2.4/mootools-yui-compressed.js');
		wp_enqueue_script('flower_core', $corepath,array('mootools'),1.0);
		wp_enqueue_script('flower_init', $initpath,array('mootools','flower_core'),1.0);
		
		return true;
	}

}

$flower = new wpFlowerPlugin();

?>