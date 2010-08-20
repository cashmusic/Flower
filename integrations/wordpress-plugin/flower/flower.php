<?php
/*
Plugin Name: CASH Music Flower
Plugin URI: http://cashmusic.org/tools/
Description: Adds MooTools 1.2.4 and Flower 1.0 to the head of a Wordpress template.
Version: 1.0
Author: Jesse von Doom
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
	
	var $plugin_name;
	var $plugin_base;

	function wpFlowerPlugin() {	
		$this->register_plugin('flower', __FILE__);
		add_action('init', 'insert_flower_scripts');
	}
	
	function register_plugin($name, $base) {
		//the name of the plugin	
		$this->plugin_name = $this->plugin_name = $name;
		//the absolute path base of the plugin
		$this->plugin_base = rtrim(dirname($base), '/');
	}
	
	function caption_shortcode( $atts, $content = null ) {
	   return '<div class="flower_soundplayer_pageplayer"></div>';
	}
	
	function insert_flower_scripts() {
		wp_enqueue_script('mootools', 'http://ajax.googleapis.com/ajax/libs/mootools/1.2.4/mootools-yui-compressed.js');
		wp_enqueue_script('flower_core', this->plugin_base.'/assets/scripts/flower_core.js');
		wp_enqueue_script('flower_init', this->plugin_base.'/assets/scripts/flower_init.js');
	
		add_shortcode('flower_soundplayer_pageplayer', 'caption_shortcode');
		
		return true;
	}

}

$flower = new wpFlowerPlugin();

?>