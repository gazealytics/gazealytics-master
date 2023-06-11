let backimage, cropimage;
let Minimap;
let SpatialBackground, SpatialMidground, SpatialForeground;
let SpatialCanvas;

let spatialsketch = (p) => {
	let f = {
		"fontName": "Arial",
		"fontSize": 18
	}; 

	let fb = {
		"fontName": "Arial",
		"fontSize": 18
	}; // the font used for general text writing applications. defined in setup

	p.initConfig = (windowWidth, windowHeight) => {
		p.textFont(f.fontName);
		p.textSize(f.fontSize);
	};

	p.setup = () => {
		SpatialCanvas = p.createCanvas(Math.floor(spatial_width), Math.floor(spatial_height));
		document.getElementById('pj1').style.height = Math.floor(spatial_height)+'px';
		document.getElementById('canvas_box').style.height = Math.floor(p.windowHeight * CANVAS_BOX_HEIGHT_PERCENTAGE)+'px';
		
		SPATIAL = p;
		p.initConfig(p.windowWidth, p.windowHeight);
		Minimap = p.createGraphics(p.width/2, p.height/2, p.P2D);
		SpatialBackground = p.createGraphics(Math.floor(spatial_width), Math.floor(spatial_height), p.P2D);
		SpatialMidground = p.createGraphics(Math.floor(spatial_width), Math.floor(spatial_height), p.P2D);
		SpatialForeground = p.createGraphics(Math.floor(spatial_width), Math.floor(spatial_height), p.P2D);
		background_changed = true;
		update_filter_colors();

		SpatialCanvas.mouseOver(() => { 
			p.mouseIsOver_spatial = true; 
		});

		SpatialCanvas.mouseOut(() => { p.mouseIsOver_spatial = false; });

		SpatialCanvas.mousePressed(() => {
			p.pressedX = p.mouseX; 
			p.pressedY = p.mouseY;
			p.mouseIsPressed_spatial = true;
			p.mouseDragX = p.mouseX; 
			p.mouseDragY = p.mouseY;
			X = (p.mouseX-ground_x)*inv_ratio; Y = (p.mouseY-ground_y)*inv_ratio;
			if( SHOW_LENS && CONTROL_STATE=="aoi" ){
				find_lens(X, Y);
			}else if( SHOW_NOTES && CONTROL_STATE=="notes" ){
				find_note(p, X, Y);
				if(selected_note == -1){
					view_panel(4);
					new_note(X+OFFSET_X, Y+OFFSET_Y);
				}				
			}else{
				find_lens(X, Y);
			}
		});
		SpatialCanvas.mouseClicked(() => {
			p.pressedX = p.mouseX; p.pressedY = p.mouseY;
			X = (p.mouseX-ground_x)*inv_ratio; Y = (p.mouseY-ground_y)*inv_ratio;
			
			if( SHOW_LENS && CONTROL_STATE=="aoi" ){
				if(p.mouseIsDragged) {
					p.mouseIsDragged = false;
					return; //assumed this is to action on an active lens such as dragging to adjust size or panning
				}
				click_lens(X, Y);
			}else if( SHOW_NOTES && CONTROL_STATE=="notes" ){
				
			}
		});

		SpatialCanvas.mouseReleased(() => {
			p.mouseIsPressed_spatial = false;
			if( CONTROL_STATE == 'crop' ){
				let x1 = (p.pressedX - ground_x) *inv_ratio + OFFSET_X;
				let y1 = (p.pressedY - ground_y)*inv_ratio + OFFSET_Y;
				let x2 = (p.mouseX- ground_x)*inv_ratio + OFFSET_X;
				let y2 = (p.mouseY- ground_y)*inv_ratio + OFFSET_Y;
				if( Math.abs(x1-x2) + Math.abs(y1 - y2) < 10 ){ // restrict to a lens extent if one was clicked
					find_lens(x2, y2);
					if(selected_lens == -1){ return; }
					[x1, y1, x2, y2] = base_lenses[ selected_lens ].extent();
				}
				if( x1 > x2 ){ [x1, x2] = [x2, x1]; }
				if( y1 > y2 ){ [y1, y2] = [y2, y1]; }
				x1 = Math.floor(x1); y1 = Math.floor(y1); x2 = Math.ceil(x2); y2 = Math.ceil(y2);
				crop_stack.push( [OFFSET_X, OFFSET_Y, WIDTH, HEIGHT, limit_select] );
				OFFSET_X = x1; OFFSET_Y = y1; // cropping resets offsets
				WIDTH = x2-x1; HEIGHT = y2-y1;
				document.getElementById('OFFSET_X').value = OFFSET_X;
				document.getElementById('OFFSET_Y').value = OFFSET_Y;
				document.getElementById('WIDTH').value = WIDTH;
				document.getElementById('HEIGHT').value = HEIGHT;
				crop_resized = true;
				limit_select = true;
				if(HEIGHT / spatial_height > WIDTH / spatial_width){
					pos_ratio = spatial_height/HEIGHT; // ratio to position data on canvas
					inv_ratio = HEIGHT/spatial_height; // inverse ratio to record canvas position in data
					height_adjust = 0;
					width_adjust = spatial_width - (spatial_height/HEIGHT* spatial_width);
				}else{ 
					pos_ratio = spatial_width/WIDTH;
					inv_ratio = WIDTH/spatial_width;
					height_adjust = spatial_height - (spatial_width/WIDTH * spatial_height);
					width_adjust = 0;
				}
				ground_x = Math.ceil((spatial_width - (WIDTH * pos_ratio))/2);
				ground_y = Math.ceil((spatial_height - (HEIGHT * pos_ratio))/2);
				data_resize();
				control_state('aoi');
			}
		});
	};
	p.draw = () => {
		try{
			load_controls();		
			if( (image_url == "" && VALUED.length == 0 && lenses.length == 0 && base_notes.length == 0) || order_twis.length == 0){ // initial message
				p.background(0,0,0);
				p.stroke(grey(100)); 
				p.noFill(); 
				p.strokeWeight(0);
				p.rect(0,0,p.width,p.height);
				p.fill(white(100));
				p.textFont(f.fontName);
				p.textSize(f.fontSize); 
				p.textAlign( p.CENTER );
				p.text("Spatial Canvas, shows the spatial arrangement\nof the data", p.width/2, p.height/2);
				if(image_url == "")
					image_changed=false;
			}else{
				p.do_draw();
			}
			if(HasVal){ do_matrix_overlay(p); }
			if(TIMELINE_MOUSE){
				if( TIME_DATA=='lens' || TIME_DATA=='data'||TIME_DATA=='all'||TIME_DATA=='group'){
					if( selected_data != -1 && DATASETS[selected_data] != undefined){
						let data = DATASETS[selected_data];
						let twi_id = -1, tmin = 0, tmax = 0, fixs = null, jmin = -1, jmax = -1, twi = null;

						if(selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
							twi = data.tois[data.toi_id];
							twi_id = twi.twi_id;
		
							if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) ;
							else twi_id = -1;
						}
						
						if(twi_id > 0) {
							tmin = twi.tmin; tmax = twi.tmax; 
						}							
						else {
							tmin = data.tmin; tmax = data.tmax; 
						}							
						fixs = data.fixs;
						v = (TIMELINE.mouseX - 200)/(spatial_width-300)*(tmax-tmin) + tmin;
						p.stroke( cy(90, data.group) ); 
						p.strokeWeight(2);
						if(twi_id > 0) {
							for(let j=twi.j_min; j<twi.j_max-1; j++){
								let jt = fixs[j].t;
								if( jt > v && jt - v < TIMELINE_MOUSEOVER_WINDOW*1000 ){
									p.line( fixs[j].x*pos_ratio+ground_x, fixs[j].y*pos_ratio+ground_y, fixs[j+1].x*pos_ratio+ground_x, fixs[j+1].y*pos_ratio+ground_y );
								}else if( jt - v > TIMELINE_MOUSEOVER_WINDOW*1000 ){ j = twi.j_max;}
							}
						}
						else {
							for(let j=0; j<fixs.length-1; j++){
								let jt = fixs[j].t;
								if( jt > v && jt - v < TIMELINE_MOUSEOVER_WINDOW*1000 ){
									p.line( fixs[j].x*pos_ratio+ground_x, fixs[j].y*pos_ratio+ground_y, fixs[j+1].x*pos_ratio+ground_x, fixs[j+1].y*pos_ratio+ground_y );
								}else if( jt - v > TIMELINE_MOUSEOVER_WINDOW*1000 ){ j = fixs.length;}
							}
						}						
					}
				}				
			}
		}catch(error){ console.error(error); background_changed = true; }
		if(p.mouseIsPressed_spatial && CONTROL_STATE == 'crop'){
			p.fill(white(30)); 
			p.stroke(white(30)); 
			p.rect( p.pressedX, p.pressedY, p.mouseX - p.pressedX, p.mouseY - p.pressedY );
		}
		if(p.mouseIsOver_spatial){ // mouse
			p.fill(white(30)); 
			p.stroke(white(30)); 
			p.strokeWeight(2);
			p.ellipse(p.mouseX, p.mouseY, 12, 12);
		}
	};

	p.do_draw = () => {
		p.background(black(100));
		// background draw functionality
		if(image_url.length > 0){
			if(image_changed){ // refresh the image content
				image_changed=false; new_back_image=true;
				backimage = p.loadImage(image_url);
				cropimage = undefined; crop_resized = true; 
				if(loaded == false){limit_select = false;}
			}
			if(new_back_image && backimage.width > 1 && backimage.height > 1){ // update the scaling
				backimage_empty = false; new_back_image = false;
				if(loaded == false){
					WIDTH = backimage.width; HEIGHT = backimage.height; 
					document.getElementById('WIDTH').value = WIDTH; document.getElementById('HEIGHT').value = HEIGHT;
					OFFSET_X = 0; OFFSET_Y = 0;
					document.getElementById('OFFSET_X').value = 0; document.getElementById('OFFSET_Y').value = 0;
				
					if(HEIGHT / spatial_height > WIDTH / spatial_width){ // checking which relationship limits resize
						pos_ratio = spatial_height/HEIGHT; // ratio to position data on canvas
						inv_ratio = HEIGHT/spatial_height; // inverse ratio to record canvas position in data
						height_adjust = 0;
						width_adjust = spatial_width - (spatial_height/HEIGHT* spatial_width);
					}else{pos_ratio = spatial_width/WIDTH;
						inv_ratio = WIDTH/spatial_width;
						height_adjust = spatial_height - (spatial_width/WIDTH * spatial_height);
						width_adjust = 0 ;
					}
					ground_x = Math.ceil((spatial_width - (WIDTH * pos_ratio))/2);
					ground_y = Math.ceil((spatial_height - (HEIGHT * pos_ratio))/2);
					crop_stack = [ [OFFSET_X, OFFSET_Y, WIDTH, HEIGHT, limit_select] ];
				}
				background_changed = true;
				data_resize();
			}
		}else if(image_changed){ image_changed = false; background_changed = true; }
	
		if(background_changed){ // includes background fixation density maps
			SpatialBackground.background(black(100));
			
			background_changed = false; midground_changed = true;
			
			if( backimage!= undefined && backimage.width*backimage.height>1 ){	
				backimage_empty = false;				
				if(backimage != undefined && limit_select == false){
					try{ // attach background
						cropimage =  backimage.get(0, 0, backimage.width, backimage.height);
						if(HEIGHT / spatial_height > WIDTH / spatial_width){
							cropimage.resize( 0, spatial_height );
						}else{cropimage.resize( spatial_width, 0);}
						ground_x = Math.ceil((spatial_width - (WIDTH * pos_ratio))/2);
						ground_y = Math.ceil((spatial_height - (HEIGHT * pos_ratio))/2);
			
						SpatialBackground.image(cropimage, ground_x, ground_y); //, -OFFSET_X*(cropimage.width/spatial_width), -OFFSET_Y*(cropimage.height/spatial_height) );
						SpatialBackground.fill( black(100*(1 - BACK_BRIGHT)) ); SpatialBackground.noStroke();
						SpatialBackground.rect(ground_x,ground_y,spatial_width,spatial_height);
		
					}catch (error) { console.error(error); }
				}
				if( limit_select && crop_resized ){
					cropimage = undefined;
					cropimage =  backimage.get(OFFSET_X, OFFSET_Y, WIDTH, HEIGHT);
					if(HEIGHT / spatial_height > WIDTH / spatial_width){
						cropimage.resize( 0, spatial_height );
						pos_ratio = spatial_height/HEIGHT; // ratio to position data on canvas
						inv_ratio = HEIGHT/spatial_height; // inverse ratio to record canvas position in relation to data (e.g. for AOI drawing)
						height_adjust = 0;
						width_adjust = spatial_width - (spatial_height/HEIGHT* spatial_width);
					}else{cropimage.resize( spatial_width, 0 ); 
						pos_ratio = spatial_width/WIDTH;
						inv_ratio = WIDTH/spatial_width;
						height_adjust = spatial_height - (spatial_width/WIDTH * spatial_height);
						width_adjust = 0 ;
					}
					ground_x = Math.ceil((spatial_width - (WIDTH * pos_ratio))/2);
					ground_y = Math.ceil((spatial_height - (HEIGHT * pos_ratio))/2);
					
					crop_resized = false;					
				}
				
				if(cropimage != undefined){
					try{ // attach background
						SpatialBackground.image(cropimage, ground_x, ground_y); //, -OFFSET_X*(cropimage.width/spatial_width), -OFFSET_Y*(cropimage.height/spatial_height) );
						SpatialBackground.fill( black(100*(1 - BACK_BRIGHT)) ); SpatialBackground.noStroke();
						SpatialBackground.rect(ground_x,ground_y,p.width,p.height);
					}catch (error) { console.error(error); }
				}
			} else {	

				if(HEIGHT / spatial_height >WIDTH  / spatial_width){
					pos_ratio = spatial_height/HEIGHT; // ratio to position data on canvas
					inv_ratio = HEIGHT/spatial_height; // inverse ratio to record canvas position in data
					height_adjust = 0;
					width_adjust = spatial_width - (spatial_height/HEIGHT* spatial_width);
				}else{pos_ratio = spatial_width/WIDTH;
					inv_ratio = WIDTH/spatial_width;
					height_adjust = spatial_height - (spatial_width/WIDTH * spatial_height);
					width_adjust = 0 ;
				}
				ground_x = Math.ceil((spatial_width - (WIDTH * pos_ratio))/2);
				ground_y = Math.ceil((spatial_height - (HEIGHT * pos_ratio))/2);				
			} 
			// fixation list draw loop
			if(SHOW_FIX){draw_fixs(SpatialBackground);}
			if(SHOW_TOPO){draw_topo(SpatialBackground);}				
		}
		if(midground_changed){ // includes the saccades
			midground_changed = false; foreground_changed = true;
			SpatialMidground.background(black(100));
			SpatialMidground.image(SpatialBackground, 0,0 );
			if(SHOW_SACCADE){draw_sacs(SpatialMidground);}	
		}
		
		if(foreground_changed || foreground_redraw){ // includes the foreground marks
			SpatialForeground.background(black(100));
			SpatialForeground.image(SpatialMidground, 0,0 );
			// mask for lens outside cropped area (when cropped)
			if(backimage_empty == false || limit_select ){
				if(HEIGHT / spatial_height > WIDTH / spatial_width){
					draw_mask( SpatialForeground, 0, 0, ground_x, spatial_height);
					draw_mask( SpatialForeground, spatial_width - ground_x, 0, ground_x, spatial_height);
				}else{
					draw_mask( SpatialForeground, 0, 0, spatial_width, ground_y);
					draw_mask( SpatialForeground, 0, spatial_height - ground_y, spatial_width, ground_y);
				}
			}
			if(selected_data != -1 && selected_lens != -1 && DATASETS[selected_data] != undefined && DATASETS[selected_data].initialised && SHOW_FORE != "" ){
				if( foreground_changed ){ compute_fore_list(); }
				if( foreground_redraw ){
					draw_fore(SpatialForeground); 
				}
			}else{ foreground_changed = false; foreground_redraw = false; }
		}
		p.image(SpatialForeground, 0, 0);
		//notes
		if( SHOW_NOTES ){
			p.stroke(white(100)); p.fill(white(100)); p.textFont(f);
			draw_notes( p );
		}
		// lenses 
		if( SHOW_LENS ){
			for(let i=0; i<order_lenses.length; i++){
				let l = base_lenses[order_lenses[i]];
				p.fill(l.col(20)); p.stroke(l.col(60)); p.strokeWeight(2);
				if( building_lens_id==order_lenses[i] || selected_lens==order_lenses[i]){
					p.fill(l.col(20)); p.stroke(l.col(75)); p.strokeWeight(5);
				}
				l.draw(p, building_lens_id==order_lenses[i],
					selected_lens==order_lenses[i],
					spatial_width, spatial_height);
			}
		}
	};
	
	p.keyPressed = () => {
		if( CONTROL_STATE=="notes" ){
			key_note( p.key );
			return;
		}
		if(p.key=='s'){p.noLoop();}
		if(p.key==p.DELETE ){
			try{
				delete_lens(selected_lens);
			}catch(error){ console.error(error); }
		}
	};

	p.mouseDragged = () => {
		if(!p.mouseIsPressed_spatial || p.mouseX < 0 || p.mouseY < 0 || p.mouseX > p.width || p.mouseY > p.height) return;
		p.mouseIsDragged = true;
		let mouseDx = p.mouseX - p.mouseDragX; 
		let mouseDy = p.mouseY - p.mouseDragY;
		if( SHOW_LENS && CONTROL_STATE=="aoi" ){
			if ( selected_lens == -1 ){ return; }
			min_id = selected_lens;
			base_lenses[min_id].move( (p.mouseDragX-ground_x)*inv_ratio+ OFFSET_X, (p.mouseDragY-ground_y)*inv_ratio+ OFFSET_Y, mouseDx*inv_ratio, mouseDy*inv_ratio);
			midground_changed = true; 
			timeline_changed = true; 
			matrix_changed = true; 
			SAC_FILTER_CHANGED = true;
		}else if( SHOW_NOTES && CONTROL_STATE=="notes" ){
			if( selected_note != -1){
				base_notes[selected_note].X += mouseDx*inv_ratio;
				base_notes[selected_note].Y += mouseDy*inv_ratio;
			}
		}
		p.mouseDragX = p.mouseX; p.mouseDragY = p.mouseY;
	};

	p.mouseIsOver_spatial = false; 
	p.mouseIsPressed_spatial = false;
	p.mouseIsDragged = false;

	p.pressedX = 0; 
	p.pressedY = 0; 
	p.mouseDragX = 0;
	p.mouseDragY = 0;

	p.resizeElements = (width_changed, height_changed) => {		
		spatial_width = p.windowWidth * SPATIAL_CANVAS_WIDTH_PERCENTAGE;
		spatial_height = p.windowHeight * SPATIAL_CANVAS_HEIGHT_PERCENTAGE;

		if(width_changed) {
			//update width
			document.getElementById('pj1').style.width = Math.floor(spatial_width)+'px';
			document.getElementById('canvas_box').style.width = Math.floor(p.windowWidth * SPATIAL_CANVAS_WIDTH_PERCENTAGE)+'px';
		}
		if(height_changed) {
			//update height
			document.getElementById('pj1').style.height = Math.floor(spatial_height)+'px';
			document.getElementById('canvas_box').style.height = Math.floor(p.windowHeight * CANVAS_BOX_HEIGHT_PERCENTAGE)+'px';
		}
		
		p.resizeCanvas(Math.floor(spatial_width), Math.floor(spatial_height));		
		p.initConfig(p.windowWidth, p.windowHeight);

		Minimap = p.createGraphics(p.width/2, p.height/2, p.P2D);
		SpatialBackground = p.createGraphics(Math.floor(spatial_width), Math.floor(spatial_height), p.P2D);
		SpatialMidground = p.createGraphics(Math.floor(spatial_width), Math.floor(spatial_height), p.P2D);
		SpatialForeground = p.createGraphics(Math.floor(spatial_width), Math.floor(spatial_height), p.P2D);

		image_changed = true;
		loaded = true;
		background_changed = true;
	};

	p.windowResized = () => {
		p.resizeElements(true, true);
	};
};

let draw_mask = (canvas, x, y, w, h) => {
	canvas.fill(4); canvas.noStroke(); canvas.rect(x, y, w, h);
	if(x !=0){canvas.stroke(200); canvas.strokeWeight(1); canvas.line(x, 0, x, h);canvas.line(w, 0, w, h);}
	if(y !=0){canvas.stroke(200); canvas.strokeWeight(1); canvas.line(0, y, w, y);canvas.line(0, h, w, h);}
};

let draw_fixs_by_twi = (canvas, data, group, twi, fixs) => {
	if( !USE_RELATIVE ){ longest_duration = twi.tmax-twi.tmin; }
	let j = 0;
	let max_val = twi.j_max - twi.j_min -1;
	if(fixs.length == 0) {
		return;
	}
	
	for(let j = twi.j_min, seq=0; j<twi.j_max && (fixs[j].t - twi.tmin)/longest_duration < TIME_ANIMATE; j++,seq++){
		if(fixs[j] != undefined && (fixs[j].t - twi.tmin)/longest_duration < TIME_ANIMATE){
			let size = Math.exp(FIX_SIZE);
			if(FIXS_SATURATION && legval == -1 || legval == group-1) {
				let val = 75.5*seq/max_val + 30.0; //interpolation of transparency (saliency) in desired alpha range (30.0, 105.5)  
				canvas.noStroke();
				if(seq == 0)
					canvas.fill( cy(105.5, 5)); 
				else if(seq == max_val)
					canvas.fill( cy(val, 14)); 			 
				else
					canvas.fill( cy(val, group)); 
			}
			else {
				canvas.fill(cy(100*Math.exp(FIX_ALPHA), group)); canvas.noStroke();
			}
			
			canvas.ellipse(fixs[j].x * pos_ratio + ground_x, fixs[j].y * pos_ratio + ground_y,
				size*Math.sqrt(fixs[j].dt), size*Math.sqrt(fixs[j].dt));
			
			let textsize = 20 * (FIX_SIZE + 3) / 6 + 10; //interpolation of textsize in desired text size (10, 30) from FIX_SIZE in (-3, 3) 
			textsize -= 5;
		}
	}
}
let draw_fixs = (canvas) => {
	try{
		for(let i=0;i<VALUED.length;i++){
			let v = VALUED[i];
			if(DATASETS[v] == undefined || !DATASETS[v].included)
				continue;
			if(DAT_MODE == 1 && DATASETS[v].group != selected_grp)
				continue;
			else if(DAT_MODE == 2 && v != selected_data)
				continue;

			if(v>=0 && v<DATASETS.length && DATASETS[v].initialised  && DATASETS[v].checked){
				//filter by twi_mode		
				let data = DATASETS[v]; let fixs = data.fixs; 
				let group = DATASETS[v].group;

				//filter fixations by TWI_MODE
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						draw_fixs_by_twi(canvas, data, group, data.tois[data.toi_id], fixs);
					}
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							draw_fixs_by_twi(canvas, data, group, data.tois[c], fixs);
						}
					}
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							draw_fixs_by_twi(canvas, data, group, data.tois[c], fixs);
						}
					}
				}
			}
		}
	}catch (error) { console.error(error); background_changed = true; }
};

function compute_hit_any_aoi_rate_by_twi(HAAR, data, group, twi, fixs){
	for(let j = twi.j_min; j<twi.j_max; j++){
		if(fixs[j] != undefined){
			if(fixs[j].firstlens > -1 && fixs[j].firstlens < lenses.length)
				HAAR.hit++;
			else
				HAAR.off++;
		}
	}
}
function compute_hit_any_aoi_rate(){
	//calculate aggregated HAAR	
	let HAAR = {"hit": 0, "off": 0, "haar": 0};

	for(let i=0;i<VALUED.length;i++){
		let v = VALUED[i];
		if(v>=0 && v<DATASETS.length && DATASETS[v].initialised  && DATASETS[v].checked && DATASETS[v].included){
			//filter by twi_mode		
			let data = DATASETS[v]; let fixs = data.fixs; 
			let group = DATASETS[v].group;

			//filter fixations by TWI_MODE
			if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
				let twi_id = data.tois[data.toi_id].twi_id;
				
				if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					compute_hit_any_aoi_rate_by_twi(HAAR, data, group, data.tois[data.toi_id], fixs);
				}
			}else if(TWI_MODE == 1 && selected_twigroup != -1){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						compute_hit_any_aoi_rate_by_twi(HAAR, data, group, data.tois[c], fixs);
					}
				}
			}else if(TWI_MODE == 0){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						compute_hit_any_aoi_rate_by_twi(HAAR, data, group, data.tois[c], fixs);
					}
				}
			}
		}
	}
	
	return HAAR;
}

let draw_pixel_poly = (canvas, point_vector) => {
	canvas.beginShape();
	for(let vertex=0; vertex<point_vector.length; vertex+=2){ canvas.vertex( Math.floor(point_vector[vertex]), Math.floor(point_vector[vertex+1]) ); }
	canvas.endShape();
};

let draw_topo = (canvas) => {
	let found_flag = false;
	for(let v=0;v<VALUED.length;v++){
		if(DATASETS[VALUED[v]] == undefined || !DATASETS[VALUED[v]].included)
			continue;
		if(DAT_MODE == 1 && DATASETS[VALUED[v]].group != selected_grp)
			continue;
		else if(DAT_MODE == 2 && VALUED[v] != selected_data)
			continue;
			
		for(let t=0;t<DATASETS[VALUED[v]].tois.length;t++){
			if( DATASETS[ VALUED[v] ].tois[t] != undefined && DATASETS[ VALUED[v] ].tois[t].included && 
				DATASETS[ VALUED[v] ].tois[t].update_topo ){ 
					give_topography(VALUED[v], t); 
					found_flag = true; 
			}
		}
	}
	if(update_topos || found_flag){ compute_topos(); }
	
	try{
		for(let V=0;V<GROUPS.length;V++){
			let group = GROUPS[V].group;
			if((DAT_MODE == 1 || DAT_MODE == 2) && group != selected_grp)
				continue;
			
			let values = GROUPS[V].values; let max_value = GROUPS[V].max_value;
			let width = canvas.width; let height = canvas.height;
			canvas.strokeWeight(1);
			for(let l=0; l<levels.length; l++){
				let v = levels[l]*max_value;
				for(let i = 0; i < X_NUM- 1; i++ ){
					for(let j = 0; j < Y_NUM - 1; j++){
						tl = values[i][j]; tr = values[i][j+1];
						bl = values[i+1][j]; br = values[i+1][j+1];
						// need to divide the line drawing into cases 
						num = 0;
						if(tl < v){ num += 1; }
						if(tr < v){ num += 2; }
						if(bl < v){ num += 4; }
						if(br < v){ num += 8; }
						// cases are now controlled by the num, with 0 or 15 being "all on one side"
						ls = Math.min(1, Math.max(0, (v-tl)/(bl-tl) ));
						rs = Math.min(1, Math.max(0, (v-tr)/(br-tr) ));
						ts = Math.min(1, Math.max(0, (v-tl)/(tr-tl) ));
						bs = Math.min(1, Math.max(0, (v-bl)/(br-bl) ));
						
						canvas.stroke( cy( Math.sqrt(levels[l]) * 256, group) ); canvas.noFill();
						if( num == 3 || num == 12){ // vertical line case
							canvas.line( (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
							
						}else if( num == 5 || num == 10){ // horizontal line case
							canvas.line( (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
							
						}else if( num == 1 || num == 14){
							canvas.line( (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
						}else if( num == 2 || num == 13){
							canvas.line( (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
						}else if( num == 4 || num == 11){
							canvas.line( (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
						}else if( num == 8 || num == 7){
							canvas.line( (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
						}else if( num == 9 || num == 6){ // weird double-diagonal case, pick the diagonal pairing that is shorter
							if( ls + ts < bs + rs ){
								canvas.line( (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
								canvas.line( (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
							}else{
								canvas.line( (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
								canvas.line( (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y);
							}
						}
						// fill step
						if(max_value > 0)
							canvas.fill( cy( 15, group) ); 
						canvas.noStroke();
						if( num == 0 ){ // entire square is above the layer
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y]);
						}else if( num == 12 ){ // half segments
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y]);
						}else if( num == 3 ){
							draw_pixel_poly(canvas, [(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y]);
						}else if( num == 10 ){
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y]);
						}else if( num == 5 ){
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y]);
						}else if( num == 1 ){ // three corner above segments
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y]);
						}else if( num == 14 ){ // one corner above segments
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
						}else if( num == 2 ){ // three corner above segments
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
						}else if( num == 13 ){ // one corner above segments
							draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
						}else if( num == 4 ){ // three corner above segments
							draw_pixel_poly(canvas, [(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
						}else if( num == 11 ){ // one corner above segments
							draw_pixel_poly(canvas, [(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
						}else if( num == 8 ){ // three corner above segments
							draw_pixel_poly(canvas, [(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
								(i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
						}else if( num == 7 ){ // one corner above segments
							draw_pixel_poly(canvas, [(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
						}else if( num == 9 ){ // weird double-diagonal case, pick the diagonal pairing that is shorter
							if( ls + ts < bs + rs ){ // two triangles case
								draw_pixel_poly(canvas, [(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
								draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
							}else{ // hexagon case
								draw_pixel_poly(canvas, [
									(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
							}
						}else if( num == 6 ){ // weird double-diagonal case, pick the diagonal pairing that is shorter
							if( ls + ts < bs + rs ){ // hexagon case
								draw_pixel_poly(canvas, [
									(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y,
									(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
							}else{ // two triangles case
								draw_pixel_poly(canvas, [(i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+bs)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+1)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+ls)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
								draw_pixel_poly(canvas, [(i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+ts)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y, (i+rs)*(WIDTH*pos_ratio)/X_NUM+ground_x, (j+1)*(HEIGHT*pos_ratio)/Y_NUM+ground_y ]);
							}
						}
					}
				}
			}
		}
	}catch (error) { console.error(error); background_changed = true; }
};

coef_splat = [2,6,10,14,16,20];
coef_weight = [];
occ_type = [0, 0, 0]; occ_dir = [0,0,0,0,0,0,0,0,0];

let draw_saccade_by_twi = (canvas, sacs, data, group, toi, longest_duration, new_type, new_dir, coef_weight) => {
	let max_val = toi.j_max - toi.j_min -1;
	
	if( !USE_RELATIVE ){ longest_duration = toi.tmax-toi.tmin; }
	for(let j = toi.j_min, seq = 0; j<toi.j_max-1 && (sacs[j].t2 - toi.tmin)/longest_duration < TIME_ANIMATE; j++, seq++){
		if( sacs[j].filter ){
			if(sacs[j].length < SHORT_LENGTH){ new_type[0] += 1;}
			else if(sacs[j].glance){ new_type[2] += 1;}
			else{ new_type[1] += 1; }
			new_dir[ (Math.floor( (sacs[j].tan * 4) / Math.PI + 0.5) + 4) % 8 ] += 1; 
			
			for(let splat=0; splat<coef_splat.length; splat++){
				if(coef_splat[splat] > 0){
					canvas.noFill(); canvas.strokeWeight(coef_splat[splat]);
					if(COLOUR_MODE == "group"){ 
						if(SACC_SATURATION && legval == -1 || legval == group-1) {
							canvas.strokeWeight(3);							
							let val = 25.5*seq/max_val + 3.0; //interpolation of transparency (saliency) in desired alpha range (3.0, 25.5)  
							canvas.stroke( cy(val, group)); 
						}
						else {
							canvas.stroke(cy(coef_weight[splat], group)); 
						}
					}
					else if(COLOUR_MODE == "direction"){ canvas.stroke(color_wheel(coef_weight[splat], sacs[j].tan)); }
					else if(COLOUR_MODE == "type"){
						if(sacs[j].length < SHORT_LENGTH){ canvas.stroke( sacc_short(coef_weight[splat]) );}
						else if(sacs[j].glance){ canvas.stroke( sacc_glance(coef_weight[splat]) );}
						else{ canvas.stroke( sacc_basic(coef_weight[splat]) ); }
					}
					canvas.beginShape();
					for(let m=0;m<sacs[j].xs.length;m++){
						canvas.vertex(sacs[j].xs[m] * pos_ratio + ground_x, sacs[j].ys[m] * pos_ratio + ground_y);
					}
					canvas.endShape();
				}
			}
		}
	}

	if(SACC_SATURATION) {
		if(data.fixs.length == 0) {
			return;
		}
		let textsize = 20 * (FIX_SIZE + 3) / 6 + 10; //interpolation of textsize in desired text size (10, 30) from FIX_SIZE in (-3, 3) 
		// textsize -= 5;
		for(let j = toi.j_min, seq=0; j<toi.j_max && (data.fixs[j].t - toi.tmin)/longest_duration < TIME_ANIMATE; j++,seq++){
			if(data.fixs[j] != undefined && (data.fixs[j].t - toi.tmin)/longest_duration < TIME_ANIMATE){				
	
				if(FIXS_SATURATION && legval == -1 || legval == group-1) {
					//draw text label
					canvas.strokeWeight(0);
					canvas.fill(black(100));
					canvas.textSize(textsize);
					if(max_val <= 10){
						if(seq%2 == 0) {
							canvas.text( num_format(seq, 2), data.fixs[j].x * pos_ratio + ground_x-7, data.fixs[j].y * pos_ratio + ground_y+7);
						}
					}						
					else if(seq%5 == 0 || seq+1 == toi.j_max)
						canvas.text( num_format(seq, 2), data.fixs[j].x * pos_ratio + ground_x-7, data.fixs[j].y * pos_ratio + ground_y+7);
					console.log("text size: "+textsize+", data.fixs_size: "+FIX_SIZE);
					canvas.textSize(f.fontSize);
					canvas.strokeWeight(1);				
				}				
			}
		}
	}
};
let draw_sacs = (canvas) => {
	filter_saccades();
	coef_weight = [];
	for(let i=0; i<coef_splat.length; i++){ // compute splat weights from control parameters
		coef_weight.push( Math.floor( Math.exp( SACC_BRIGHT - Math.exp(-SACC_BLUR)*(coef_splat[i]-2)**2 ) ) );
		if(i>0){ coef_weight[i-1] -= coef_weight[i]; }
	}
	try{
		new_type = [0, 0, 0]; new_dir = [0,0,0,0,0,0,0,0,0];
		for(let i=0;i<VALUED.length;i++){
			let v = VALUED[i];
			if(DATASETS[v] == undefined || !DATASETS[v].included)
				continue;
			if(DAT_MODE == 1 && DATASETS[v].group != selected_grp)
				continue;
			else if(DAT_MODE == 2 && v != selected_data)
				continue;

			if(v>=0 && v<DATASETS.length && DATASETS[v].initialised  && DATASETS[v].checked){
				//filter by twi_mode
				
				let data = DATASETS[v]; let sacs = data.sacs; let group = data.group; 
				
				//filter sacs by TWI_MODE
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						draw_saccade_by_twi(canvas, sacs, data, group, data.tois[data.toi_id], longest_duration, new_type, new_dir, coef_weight);
					}
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							draw_saccade_by_twi(canvas, sacs, data, group, data.tois[c], longest_duration, new_type, new_dir, coef_weight);							
						}
					}
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							draw_saccade_by_twi(canvas, sacs, data, group, data.tois[c], longest_duration, new_type, new_dir, coef_weight);
						}
					}
				}
			}
		}
		let diff=false;
		for(let i=0;i<3;i++){diff |= (new_type[i]!=occ_type[i]); }
		for(let i=0;i<7;i++){diff |= (new_dir[i]!=occ_dir[i]); }
		if( diff ){ occ_type=new_type; occ_dir=new_dir; update_legend=true; }
	}catch (error) { console.error(error); midground_changed = true; }
};

FORE_LIST = [];

let compute_fore_list = () => {
	try{
		foreground_changed = false;
		let l = base_lenses[selected_lens];

		let toi_list = [];
		let fixs_list = [];

		//aggregate based on DAT_MODE and TWI_MODE 
		if(DAT_MODE == 0) {
			for(let d=0; d<VALUED.length; d++) {
				let data = DATASETS[VALUED[ d ]];
				let fixs = data.fixs;
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						toi_list.push(data.tois[data.toi_id]);
						fixs_list.push(fixs);
					}
						
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							toi_list.push(data.tois[c]);
							fixs_list.push(fixs);
						}
					}								
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							toi_list.push(data.tois[c]);
							fixs_list.push(fixs);
						}
					}
				}
			}
		}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){
			for(let d=0; d<VALUED.length; d++) {
				if(DATASETS[VALUED[d]].group == selected_grp){
					let data = DATASETS[VALUED[d]];
					let fixs = data.fixs;
					if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
						let twi_id = data.tois[data.toi_id].twi_id;
						if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
							toi_list.push(data.tois[data.toi_id]);
							fixs_list.push(fixs);
						}
							
					}else if(TWI_MODE == 1 && selected_twigroup != -1){
						for(let c=0; c<data.tois.length; c++) {
							let twi_id = data.tois[c].twi_id;
							if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								toi_list.push(data.tois[c]);
								fixs_list.push(fixs);
							}
						}								
					}else if(TWI_MODE == 0){
						for(let c=0; c<data.tois.length; c++) {
							let twi_id = data.tois[c].twi_id;
							if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								toi_list.push(data.tois[c]);
								fixs_list.push(fixs);
							}
						}
					}
				}			
			}
		}else if(DAT_MODE == 2 && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined && lenses.length > 0) {
			data = DATASETS[selected_data]; fixs = data.fixs;
			if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
				let twi_id = data.tois[data.toi_id].twi_id;
				if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					toi_list.push(data.tois[data.toi_id]);
					fixs_list.push(fixs);
				}
					
			}else if(TWI_MODE == 1 && selected_twigroup != -1){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						toi_list.push(data.tois[c]);
						fixs_list.push(fixs);
					}
				}								
			}else if(TWI_MODE == 0){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						toi_list.push(data.tois[c]);
						fixs_list.push(fixs);
					}						
				}
			}
		}

		for(let i = 0; i<fixs_list.length; i++) {
			for(let j = 0; j<fixs_list[i].length; j++){ // compute interaction with the selected lens
				fixs_list[i][j].in_selected = l.inside(fixs_list[i][j].x, fixs_list[i][j].y);
			}
		}
				
		let lens_bins = 60; lens_vals = [];
		let time_bins = 60; time_vals = [];
		
		// find lens edges and build lens hist values list
		for(let i=0;i<lens_bins;i++){
			lens_vals.push(10); angle = SPATIAL.TWO_PI*((i+0.5)/lens_bins); step = 50;
			for(let k=1;k<30;k++){ // step out to the edge
				if( l.inside((l.centx + Math.cos(angle)*lens_vals[i]*inv_ratio)-OFFSET_X, (l.centy + Math.sin(angle)*lens_vals[i]*inv_ratio)-OFFSET_Y)){ lens_vals[i]+=step ; }else{ lens_vals[i]-=step; step /= 2; }
			}
			lens_vals[i] += 10;			
		}
		// build time hist values list
		for(let i=0;i<time_bins;i++){ time_vals.push(20); }
		  
		// construct relevance list with all three sets of locations
		FORE_LIST = [];
		for(let i = 0; i<fixs_list.length; i++){
			for(let j = 0; j<fixs_list[i].length - 1; j++){
				if( fixs_list[i][j].t > toi_list[i].tmin && fixs_list[i][j].t < toi_list[i].tmax){
					before = j<fixs_list[i].length-1 && fixs_list[i][j+1].in_selected;
					now = fixs_list[i][j].in_selected;
					after = j>0 && fixs_list[i][j-1].in_selected;
					if(!now && (before || after) ){
						s = Math.exp(FORE_SIZE); if(USE_SIZE){ s *= Math.sqrt(fixs_list[i][j].dt)*0.04; }
						
						lens_bin = Math.floor(lens_bins*(Math.PI+Math.atan2(l.centy-OFFSET_Y-fixs_list[i][j].y, l.centx-OFFSET_X-fixs_list[i][j].x))/SPATIAL.TWO_PI) % lens_bins;
						angle = SPATIAL.TWO_PI*((lens_bin+0.5)/lens_bins);
						time_bin = Math.floor( time_bins * (fixs_list[i][j].t -toi_list[i].tmin) / (toi_list[i].tmax - toi_list[i].tmin) ) % time_bins;
						lens_vals[lens_bin] += 0.75*s;
						time_vals[time_bin] += 0.75*s;
						
						FORE_LIST.push({fix:fixs_list[i][j], before:before, after:after, size:s,
								spatial_x:fixs_list[i][j].x * pos_ratio + ground_x, spatial_y:fixs_list[i][j].y * pos_ratio + ground_y,
								lens_x: (l.centx-OFFSET_X) * pos_ratio + ground_x + lens_vals[lens_bin]*Math.cos(angle), lens_y: (l.centy-OFFSET_Y) * pos_ratio + ground_y  + lens_vals[lens_bin]*Math.sin(angle),
								time_x: (time_bin * (spatial_width-200))/time_bins + 100, time_y: spatial_height - time_vals[time_bin]
								});
						
						lens_vals[lens_bin] += 0.75*s;
						time_vals[time_bin] += 0.75*s;
					}
				}
			}
		}
		
		foreground_redraw = true;
		
	}catch (error) { console.error(error); foreground_changed = true; }
};

SPLIT_STATE = [1.0, 0.0, 0.0]; STEPS = 20;

let draw_fore = (canvas) => {
	foreground_redraw = false;
	canvas.noStroke();
	for(let j = 0; j<FORE_LIST.length; j++){
		fix = FORE_LIST[j];
		canvas.fill(color_mark(fix.before, fix.after));
		canvas.ellipse(
			SPLIT_STATE[0]*fix.spatial_x + SPLIT_STATE[1]*fix.lens_x + SPLIT_STATE[2]*fix.time_x,
			SPLIT_STATE[0]*fix.spatial_y + SPLIT_STATE[1]*fix.lens_y + SPLIT_STATE[2]*fix.time_y,
			fix.size, fix.size);
	}
	if( SHOW_FORE == 'spatial'){
		if( SPLIT_STATE[0] != 1 ){ SPLIT_STATE[0] = Math.min(1, SPLIT_STATE[0] + 1/STEPS ); foreground_redraw = true; }
		if( SPLIT_STATE[1] != 0 ){ SPLIT_STATE[1] = Math.max(0, SPLIT_STATE[1] - 1/STEPS ); foreground_redraw = true; }
		if( SPLIT_STATE[2] != 0 ){ SPLIT_STATE[2] = Math.max(0, SPLIT_STATE[2] - 1/STEPS ); foreground_redraw = true; }
	}else if( SHOW_FORE == 'lens'){
		if( SPLIT_STATE[0] != 0 ){ SPLIT_STATE[0] = Math.max(0, SPLIT_STATE[0] - 1/STEPS ); foreground_redraw = true; }
		if( SPLIT_STATE[1] != 1 ){ SPLIT_STATE[1] = Math.min(1, SPLIT_STATE[1] + 1/STEPS ); foreground_redraw = true; }
		if( SPLIT_STATE[2] != 0 ){ SPLIT_STATE[2] = Math.max(0, SPLIT_STATE[2] - 1/STEPS ); foreground_redraw = true; }
	}else if( SHOW_FORE == 'time'){
		if( SPLIT_STATE[0] != 0 ){ SPLIT_STATE[0] = Math.max(0, SPLIT_STATE[0] - 1/STEPS ); foreground_redraw = true; }
		if( SPLIT_STATE[1] != 0 ){ SPLIT_STATE[1] = Math.max(0, SPLIT_STATE[1] - 1/STEPS ); foreground_redraw = true; }
		if( SPLIT_STATE[2] != 1 ){ SPLIT_STATE[2] = Math.min(1, SPLIT_STATE[2] + 1/STEPS ); foreground_redraw = true; }
	}
};

let do_histogram_overlay = (p, data, fixs, toi, isSpaceView, callback) => {
	let j=0;
	let sacs = data.sacs;
	min_val = 0; 
	
	if( HIST_METRIC == "fix_dur" || HIST_METRIC == "fix_aoi_dur" ) {		
		max_val = 1000;		
	}		
	else if(HIST_METRIC == 'fix_lensegroup_dur' || HIST_METRIC == 'visit_aoi_dur' || HIST_METRIC == 'visit_lensegroup_dur') {
		max_val = 20000;
	}
	else if( HIST_METRIC == "sac_len" )
		max_val = Math.floor(Math.sqrt( WIDTH**2 + HEIGHT**2 ));

	if( HIST_METRIC != "sac_len" ){
		min_dt = mouse_bin*(max_val/BINS_N); 
		max_dt = (mouse_bin+1)*(max_val/BINS_N);
		if( max_dt > max_val ){ max_dt = 1e10; }				
	}
	
	while( j<fixs.length - 1 && fixs[j].t < toi.tmin ){ j++; }
	for(; j<fixs.length - 1 && fixs[j+1].t < toi.tmax; j++){
		if(fixs[j+1] == undefined)
			continue;
		if(mat_type == "hist"){
			if( HIST_METRIC == "fix_dur" ){
				let fix = fixs[j];
				if( fix.dt < max_dt && fix.dt > min_dt ){
					if( fix.t > data.tmin && fix.t < data.tmax){
						let size = Math.exp(FIX_SIZE);
						if(isSpaceView)
							p.ellipse(fix.x * pos_ratio + ground_x, fix.y * pos_ratio + ground_y, size*Math.sqrt(fix.dt), size*Math.sqrt(fix.dt));
						else
							p.rect( TT(fixs[j].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[j].t), 10);
					}
				}				
			}
			else if( HIST_METRIC == "sac_len" ){
				min_len = mouse_bin*(max_val/BINS_N); max_len = (mouse_bin+1)*(max_val/BINS_N);
				if( max_len > max_val ){ max_len = 1e10; }
				let sac = sacs[j];
				if( sac.length < max_len && sac.length > min_len ){
					if( sac.t1 > toi.tmin && sac.t2 < toi.tmax){
						if(isSpaceView)
							p.line( sac.x1 * pos_ratio + ground_x, sac.y1 * pos_ratio + ground_y, sac.x2 * pos_ratio + ground_x, sac.y2 * pos_ratio + ground_y);
						else
							p.rect( TT(fixs[j].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[j].t), 10);
					}
				}				
			}	
			else {
				if(HIST_METRIC.indexOf("lensegroup") > -1){
					for(let l2=0; l2<lenses.length; l2++){
						if(lenses[l2].group == selected_lensegroup) {
							if( HIST_METRIC == 'fix_lensegroup_dur'){	
								let fix = fixs[j];
								if( fix.dt < max_dt && fix.dt > min_dt ){
									if( fix.t > data.tmin && fix.t < data.tmax && lense!=-1 && lenses[l2].inside(fixs[j].x, fixs[j].y)){
										let size = Math.exp(FIX_SIZE);
										if(isSpaceView)
											p.ellipse(fix.x * pos_ratio + ground_x, fix.y * pos_ratio + ground_y, size*Math.sqrt(fix.dt), size*Math.sqrt(fix.dt));
										else
											p.rect( TT(fixs[j].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[j].t), 10);
									}
								}
							}							
						}	
						if(lense==-1)
							break;				
					}
				}
				else if(HIST_METRIC.indexOf("aoi") > -1){
					let val_list = [];
					if( lense!=-1 && HIST_METRIC == 'fix_aoi_dur'){	
						let fix = fixs[j];
						if( fix.dt < max_dt && fix.dt > min_dt ){
							if( fix.t > data.tmin && fix.t < data.tmax && lense!=-1 && lense.inside(fixs[j].x, fixs[j].y)){								
								let size = Math.exp(FIX_SIZE);
								if(isSpaceView)
									p.ellipse(fix.x * pos_ratio + ground_x, fix.y * pos_ratio + ground_y, size*Math.sqrt(fix.dt), size*Math.sqrt(fix.dt));
								else
									p.rect( TT(fixs[j].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[j].t), 10);
							}
						}						
					}					
				}
			}		
		}
	}
};

let do_aoi_transition_overlay = (p, data, fixs, toi, isSpaceView, callback) => {
	let j=0;
	while( j<fixs.length - 1 && fixs[j].t < toi.tmin ){ j++; }
	for(; j<fixs.length - 1 && fixs[j+1].t < toi.tmax; j++){
		if(fixs[j+1] == undefined)
			continue;
		if( MATRIX_VIEW_STATE == 'lensegroup_lensegroup'){ // first case, lensegroup_lensegroup data
			if( MATRIX_DATA_STATE.indexOf('trans1') > -1) {
				if( fixs[j].firstlens < lenses.length && 
					fixs[j+1].firstlens < lenses.length && 
					xval < ORDERLENSEGROUPID.length && 
					yval < ORDERLENSEGROUPID.length &&
					lenses[fixs[j].firstlens].group == ORDERLENSEGROUPID[yval] && 
					lenses[fixs[j+1].firstlens].group == ORDERLENSEGROUPID[xval] ){
					if(isSpaceView)
						p.line( fixs[j].x * pos_ratio + ground_x, fixs[j].y * pos_ratio + ground_y, fixs[j+1].x * pos_ratio + ground_x, fixs[j+1].y * pos_ratio + ground_y );
					else
						p.rect( TT(fixs[j].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[j].t), 10);
				}
			}else if( MATRIX_DATA_STATE.indexOf('trans2') > -1) {
				let q = j;
				if( fixs[j].firstlens < lenses.length && 
					yval < ORDERLENSEGROUPID.length && 
					lenses[fixs[j].firstlens].group == ORDERLENSEGROUPID[yval]){									
					while( j<fixs.length - 1 && fixs[j+1].firstlens == lenses.length ){ j++; }	
					if(fixs[j+1] == undefined)
						continue;
					if( 						
						fixs[j+1].firstlens < lenses.length && 
						xval < ORDERLENSEGROUPID.length && 
						j<fixs.length - 1 && 
						lenses[fixs[j+1].firstlens].group == ORDERLENSEGROUPID[xval]){
						if(isSpaceView)
							p.line( fixs[q].x * pos_ratio + ground_x, fixs[q].y * pos_ratio + ground_y, fixs[j+1].x * pos_ratio + ground_x, fixs[j+1].y * pos_ratio + ground_y );
						else
							p.rect( TT(fixs[q].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[q].t), 10);
					}
				}
			}else if( MATRIX_DATA_STATE.indexOf('glances') > -1 || MATRIX_DATA_STATE.indexOf('through') > -1){ // finding patterns from the filtered triples
				if( ORDERLENSEGROUPID.indexOf(selected_lensegroup) == -1 ){ return; }
				before = 0; middle = 0; after = 0;
				if( MATRIX_DATA_STATE == 'glances' ){ before = yval; middle = xval; after = yval; }
				else if( MATRIX_DATA_STATE == 'through' ){ before = yval; middle = ORDERLENSEGROUPID.indexOf(selected_lensegroup); after = xval; }

				if( fixs[j].firstlens < lenses.length && 
					before < ORDERLENSEGROUPIDARRAYINDEX.length && 
					lenses[fixs[j].firstlens].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[before]].group
					){ // must start in before state
						
					q1 = j; // record last in before state
					while( j<fixs.length - 1 && 
						fixs[j+1].firstlens < lenses.length &&
						(lenses[fixs[j+1].firstlens].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[before]].group || 
						fixs[j+1].firstlens == lenses.length) ) // advance through before||none, record last before	
					{ 
						j++; 
						if(fixs[j].firstlens == before){ q1=j; } 
					} 			
					if( j<fixs.length - 1 && 
						fixs[j+1].firstlens < lenses.length && 
						lenses[fixs[j+1].firstlens].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[middle]].group
						){ // next element must be from middle state
						j++;
						if(fixs[j+1] == undefined)
							continue;
						q2 = j; q3 = j; // record first and last in the middle state
						while( j<fixs.length - 1 && 
							fixs[j+1].firstlens < lenses.length && 
							(lenses[fixs[j+1].firstlens].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[middle]].group || fixs[j+1].firstlens == lenses.length) ){ 
							j++; 
							if(fixs[j+1] == undefined)
								continue;
							if(lenses[fixs[j].firstlens].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[middle]].group){ q3=j; } 
						} // advance through middle||none, record last middle
						if( j<fixs.length - 1 && 
							fixs[j+1].t < toi.tmax && 
							fixs[j+1].firstlens < lenses.length && 
							lenses[fixs[j+1].firstlens].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[after]].group
						)
						{ // then must go to final state;

							q4 = j+1;
							if(isSpaceView){
								p.stroke(color_mark(0, 1));
								p.line( fixs[q1].x * pos_ratio + ground_x, fixs[q1].y * pos_ratio + ground_y, fixs[q2].x * pos_ratio + ground_x, fixs[q2].y * pos_ratio + ground_y );
								p.stroke(color_mark(1, 1));
								p.line( fixs[q2].x * pos_ratio + ground_x, fixs[q2].y * pos_ratio + ground_y, fixs[q3].x * pos_ratio + ground_x, fixs[q3].y * pos_ratio + ground_y );
								p.stroke(color_mark(1, 0));
								p.line( fixs[q3].x * pos_ratio + ground_x, fixs[q3].y * pos_ratio + ground_y, fixs[q4].x * pos_ratio + ground_x, fixs[q4].y * pos_ratio + ground_y );
							}else {
								p.fill(color_mark(0, 1));
								p.rect( TT(fixs[q1].t), timeline_highlight_position, TT(fixs[q2].t)-TT(fixs[q1].t), 10);
								
								p.fill(color_mark(1, 1));
								p.rect( TT(fixs[q2].t), timeline_highlight_position, TT(fixs[q3].t)-TT(fixs[q2].t), 10);
								
								p.fill(color_mark(1, 0));
								p.rect( TT(fixs[q3].t), timeline_highlight_position, TT(fixs[q4].t)-TT(fixs[q3].t), 10);
							}							
						}
					}
				}
			}
		}else if( MATRIX_VIEW_STATE == 'aoi_aoi'){ // first case, aoi_aoi data
			if( MATRIX_DATA_STATE.indexOf('trans1') > -1) {
				if( fixs[j].firstlens == yval && fixs[j+1].firstlens == xval ){
					if(isSpaceView)
						p.line( fixs[j].x * pos_ratio + ground_x, fixs[j].y * pos_ratio + ground_y, fixs[j+1].x * pos_ratio + ground_x, fixs[j+1].y * pos_ratio + ground_y );
					else
						p.rect( TT(fixs[j].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[j].t), 10)
				}	
			}else if( MATRIX_DATA_STATE.indexOf('trans2') > -1 ){
				q = j;
				if( fixs[j].firstlens == yval ){
					while( j<fixs.length - 1 && fixs[j+1].firstlens == lenses.length ){ j++; }						
					if(fixs[j+1] == undefined)
						continue;
					if( j<fixs.length - 1 && fixs[j+1].firstlens == xval ){
						if(isSpaceView)
							p.line( fixs[q].x * pos_ratio + ground_x, fixs[q].y * pos_ratio + ground_y, fixs[j+1].x * pos_ratio + ground_x, fixs[j+1].y * pos_ratio + ground_y );
						else 
							p.rect( TT(fixs[q].t), timeline_highlight_position, TT(fixs[j+1].t)-TT(fixs[q].t), 10);
					}
				}
			}else if( MATRIX_DATA_STATE.indexOf('glances') > -1 || MATRIX_DATA_STATE.indexOf('through') > -1) { // finding patterns from the filtered triples
				before = 0; middle = 0; after = 0;
				if( MATRIX_DATA_STATE == 'glances' ){ before = yval; middle = xval; after = yval; }
				else if( MATRIX_DATA_STATE == 'through' ){ before = yval; middle = order_lenses.indexOf(selected_lens); after = xval; }

				if( fixs[j].firstlens == before ){ // must start in before state
					q1 = j; // record last in before state
					while( j<fixs.length - 1 && (fixs[j+1].firstlens == before || fixs[j+1].firstlens == lenses.length) ){ j++; if(fixs[j].firstlens == before){ q1=j; } } // advance through before||none, record last before				
					if( j<fixs.length - 1 && fixs[j+1].firstlens == middle ){ // next element must be from middle state
						j++;
						if(fixs[j+1] == undefined)
							continue;
						q2 = j; q3 = j; // record first and last in the middle state
						while( j<fixs.length - 1 && (fixs[j+1].firstlens == middle || fixs[j+1].firstlens == lenses.length) ){ j++; if(fixs[j].firstlens == middle){ q3=j; } } // advance through middle||none, record last middle
						if( j<fixs.length - 1 && fixs[j+1].t < toi.tmax && fixs[j+1].firstlens == after ){ // then must go to final state;
							q4 = j+1;
							if(isSpaceView) {
								p.stroke(color_mark(0, 1));
								p.line( fixs[q1].x * pos_ratio + ground_x, fixs[q1].y * pos_ratio + ground_y, fixs[q2].x * pos_ratio + ground_x, fixs[q2].y * pos_ratio + ground_y );
								p.stroke(color_mark(1, 1));
								p.line( fixs[q2].x * pos_ratio + ground_x, fixs[q2].y * pos_ratio + ground_y, fixs[q3].x * pos_ratio + ground_x, fixs[q3].y * pos_ratio + ground_y );
								p.stroke(color_mark(1, 0));
								p.line( fixs[q3].x * pos_ratio + ground_x, fixs[q3].y * pos_ratio + ground_y, fixs[q4].x * pos_ratio + ground_x, fixs[q4].y * pos_ratio + ground_y );
							}else {
								p.fill(color_mark(0, 1));
								p.rect( TT(fixs[q1].t), timeline_highlight_position, TT(fixs[q2].t)-TT(fixs[q1].t), 10);
								
								p.fill(color_mark(1, 1));
								p.rect( TT(fixs[q2].t), timeline_highlight_position, TT(fixs[q3].t)-TT(fixs[q2].t), 10);
								
								p.fill(color_mark(1, 0));
								p.rect( TT(fixs[q3].t), timeline_highlight_position, TT(fixs[q4].t)-TT(fixs[q3].t), 10);
							}							
						}
					}
				}
			}
		}
	}
};

let aggregate_fixation_data_across_dat_twi = (p, isSpaceView, callback) => {
	if(DAT_MODE == 0) {
		for(let d=0; d<VALUED.length; d++) {
			let data = DATASETS[VALUED[ d ]];
			let fixs = data.fixs;
			if(isSpaceView)
				p.stroke(cy(100, data.group));
			else {
				p.fill(cy(80, data.group)); 
				p.noStroke();
			}				
			if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
				let twi_id = data.tois[data.toi_id].twi_id;
				if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					do_aoi_transition_overlay(p, data, fixs, data.tois[data.toi_id], true, callback);
				}					
			}else if(TWI_MODE == 1 && selected_twigroup != -1){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
						do_aoi_transition_overlay(p, data, fixs, data.tois[c], true, callback);
				}								
			}else if(TWI_MODE == 0){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) 
						do_aoi_transition_overlay(p, data, fixs, data.tois[c], true, callback);
				}
			}
		}
	}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){
		for(let d=0; d<VALUED.length; d++) {
			if(DATASETS[VALUED[d]].group == selected_grp){
				let data = DATASETS[VALUED[d]];
				let fixs = data.fixs;
				p.stroke(cy(100, data.group));
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						do_aoi_transition_overlay(p, data, fixs, data.tois[data.toi_id], true, callback);
					}
						
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
							do_aoi_transition_overlay(p, data, fixs, data.tois[c], true, callback);
					}								
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) 
							do_aoi_transition_overlay(p, data, fixs, data.tois[c], true, callback);
					}
				}
			}			
		}
	}else if(DAT_MODE == 2 && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined && lenses.length > 0) {
		data = DATASETS[selected_data]; fixs = data.fixs;
		if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
			let twi_id = data.tois[data.toi_id].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
				do_aoi_transition_overlay(p, data, fixs, data.tois[data.toi_id], true, callback);
			}
				
		}else if(TWI_MODE == 1 && selected_twigroup != -1){
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
					do_aoi_transition_overlay(p, data, fixs, data.tois[c], true, callback);
			}								
		}else if(TWI_MODE == 0){
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) 
					do_aoi_transition_overlay(p, data, fixs, data.tois[c], true, callback);
			}
		}
	}
};

let do_aoi_fixation_overlay = (p, data, fixs, toi, lens, isSpaceView, callback) => {
	if(data != null){
		// draw the fixations in intersection of toi and lens, for the dataset:
		fixs = data.fixs;
		tmin = toi.range[0]*(data.t_end-data.t_start) + data.t_start; tmax = toi.range[1]*(data.t_end-data.t_start) + data.t_start;
		if(isSpaceView) {
			p.fill(cy(100, data.group));
			p.noStroke();
			for(j = 0; j<fixs.length - 1; j++){
				if(MATRIX_VIEW_STATE.indexOf('lensegroup')!= -1) {
					for(let j2 = 0; j2 < lenses.length; j2++) {
						if( fixs[j].t > tmin && fixs[j].t < tmax && lens > -1 && lens < ORDERLENSEGROUPID.length &&
							lenses[j2].group == ORDERLENSEGROUPID[lens] && lenses[j2].inside(fixs[j].x, fixs[j].y) ){
							s = Math.exp(FIX_SIZE) * Math.sqrt(fixs[j].dt);
							// p.fill( white(90) );
							p.ellipse(fixs[j].x * pos_ratio + ground_x, fixs[j].y * pos_ratio + ground_y, s, s);
						}
					}
				}else if(MATRIX_VIEW_STATE.indexOf('aoi')!= -1) {
					if( fixs[j].t > tmin && fixs[j].t < tmax && lens.inside(fixs[j].x, fixs[j].y) ){
						s = Math.exp(FIX_SIZE) * Math.sqrt(fixs[j].dt);
						// p.fill( white(90) );
						p.ellipse(fixs[j].x * pos_ratio + ground_x, fixs[j].y * pos_ratio + ground_y, s, s);
					}
				}								
			}
		}else {
			p.fill( cy(80, data.group) );
			for(j = 0; j<fixs.length; j++){
				ts = (spatial_width-300)*(fixs[j].t - tmin)/(tmax-tmin);
				td = ( (spatial_width-300)*fixs[j].dt )/(tmax-tmin);
				if(USE_RELATIVE){
					ts = (spatial_width-300)*(fixs[j].t - tmin)/longest_duration;
					td = ( (spatial_width-300)*fixs[j].dt )/longest_duration;
				}
				if(MATRIX_VIEW_STATE.indexOf('lensegroup')!= -1) {					
					for(let j2 = 0; j2 < lenses.length; j2++) {
						if( ts > 0 && ts+td < spatial_width-300 && lens > -1 && lens < ORDERLENSEGROUPID.length &&
							lenses[j2].group == ORDERLENSEGROUPID[lens] && lenses[j2].inside(fixs[j].x, fixs[j].y) ){
							if(td > 1){
								p.noStroke(); p.rect( 200 + ts, timeline_highlight_position, td, 10 );
							}else{
								p.stroke(cy(80, data.group)); p.line(200 + ts, timeline_highlight_position, 200+ts, timeline_highlight_position+10);
							}
						}
					}
				}else if(MATRIX_VIEW_STATE.indexOf('aoi')!= -1) {
					if( ts > 0 && ts+td < spatial_width-300 && lens.inside(fixs[j].x, fixs[j].y) ){
						if(td > 1){
							p.noStroke(); p.rect( 200 + ts, timeline_highlight_position, td, 10 );
						}else{
							p.stroke(cy(80, data.group)); p.line(200 + ts, timeline_highlight_position, 200+ts, timeline_highlight_position+10);
						}
					}
				}
			}
		}		
	}
};

let aggregate_fixation_data_across_twi = (p, data, lens, isSpaceView, callback) => {
	if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
		let twi_id = data.tois[data.toi_id].twi_id;
		if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
			do_aoi_fixation_overlay(p, data, fixs, data.tois[ data.toi_id ], lens, isSpaceView, callback);
	}else if(TWI_MODE == 1 && selected_twigroup != -1){
		
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
				do_aoi_fixation_overlay(p, data, fixs, data.tois[ c ], lens, isSpaceView, callback);
		}		
	}else if(TWI_MODE == 0){
		let total_sum = 0;
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
				do_aoi_fixation_overlay(p, data, fixs, data.tois[ c ], lens, isSpaceView, callback);
			}
		}
	}
};

let aggregate_fixation_data_across_dat = (p, twi_id, lens, isSpaceView, callback) => {
	if(DAT_MODE == 2 && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined) {
		let data = DATASETS[selected_data];
		//search for toi_id that matches twi_id
		for(let c=0; c < data.tois.length; c++) {
			if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
				do_aoi_fixation_overlay(p, data, fixs, data.tois[ c ], lens, isSpaceView, callback);
			}
		}
	}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){

		for(let val=0; val<VALUED.length; val++){
			if(DATASETS[VALUED[val]].group == selected_grp){
				let data = DATASETS[ VALUED[val] ];	
				//search for toi_id that matches twi_id
				for(let c=0; c < data.tois.length; c++) {
					if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						do_aoi_fixation_overlay(p, data, fixs, data.tois[ c ], lens, isSpaceView, callback);
					}
				}
			}						
		}		
	}else if(DAT_MODE == 0){
		for(let val=0; val<VALUED.length; val++){
			let data = DATASETS[ VALUED[val] ];	

			for(let c=0; c<data.tois.length; c++) {
				if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					do_aoi_fixation_overlay(p, data, fixs, data.tois[ c ], lens, isSpaceView, callback);
				}
			}
		}
	}
};

let aggregate_histogram_across_dat_twi = (p, data, isSpaceView, callback) => {
	if(isSpaceView) {
		if( HIST_METRIC != "sac_len"){
			p.fill(cy(100, data.group));
			p.noStroke();
		}
		else if( HIST_METRIC == "sac_len" ){
			p.strokeWeight(2);
			p.stroke(cy(90, data.group));
		}
	}		
	else {
		p.fill(cy(80, data.group)); 
		p.noStroke();
	}				

	if(DAT_MODE == 0 && ORDERGROUPID.indexOf(selected_grp) != -1){
		for(let d=0; d<VALUED.length; d++) {
			if(DATASETS[VALUED[d]].group == selected_grp){
				let data = DATASETS[VALUED[d]];
				let fixs = data.fixs;
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						do_histogram_overlay(p, data, fixs, data.tois[data.toi_id], isSpaceView, null);
					}
						
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
							do_histogram_overlay(p, data, fixs, data.tois[c], isSpaceView, null);
					}								
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) 
							do_histogram_overlay(p, data, fixs, data.tois[c], isSpaceView, null);
					}
				}
			}			
		}
	}else if((DAT_MODE == 1 || DAT_MODE == 2) && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined && lenses.length > 0) {
		data = DATASETS[selected_data]; fixs = data.fixs;
		if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
			let twi_id = data.tois[data.toi_id].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
				do_histogram_overlay(p, data, fixs, data.tois[data.toi_id], isSpaceView, null);
			}
				
		}else if(TWI_MODE == 1 && selected_twigroup != -1){
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
					do_histogram_overlay(p, data, fixs, data.tois[c], isSpaceView, null);
			}								
		}else if(TWI_MODE == 0){
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) 
					do_histogram_overlay(p, data, fixs, data.tois[c], isSpaceView, null);
			}
		}
	}
};

let do_matrix_overlay = (p) => {
	if( mat_type == 'mat' ){		
		if( MATRIX_VIEW_STATE == 'lensegroup_lensegroup'){ // first case, lensegroup_lensegroup data
			p.stroke(cy(100, data.group)); p.strokeWeight(2);
			aggregate_fixation_data_across_dat_twi(p, true, null);			
		}else if( MATRIX_VIEW_STATE == 'aoi_aoi'){ // second case, aoi_aoi data
			p.stroke(cy(100, data.group)); p.strokeWeight(2);
			aggregate_fixation_data_across_dat_twi(p, true, null);	
		}else if( MATRIX_VIEW_STATE == 'lensegroup_dat' || MATRIX_VIEW_STATE == 'dat_lensegroup'){ 
			let data = null;
			let aoi = -1;
			if( mat_col_val == 'dat' ){
				if(xval == -1 || xval >= VALUED.length) return;
				if(yval == -1 || yval >= ORDERLENSEGROUPID.length) return;
				data = DATASETS[ VALUED[xval] ];
				aoi = yval;
			}else if( mat_row_val == 'dat' ){
				if(xval == -1 || xval >= ORDERLENSEGROUPID.length) return;
				if(yval == -1 || yval >= VALUED.length) return;
				data = DATASETS[ VALUED[yval] ];
				aoi = xval;
			}
			aggregate_fixation_data_across_twi(p, data, aoi, true, null);
		}else if( MATRIX_VIEW_STATE == 'aoi_dat' || MATRIX_VIEW_STATE == 'dat_aoi'){ 
			let data = null;
			let aoi = null;
			if( mat_col_val == 'dat' ){
				if(xval == -1 || xval >= VALUED.length) return;
				if(yval == -1 || yval >= lenses.length) return;
				data = DATASETS[ VALUED[xval] ];
				aoi = lenses[ yval ];
			}else if( mat_row_val == 'dat' ){
				if(xval == -1 || xval >= lenses.length) return;
				if(yval == -1 || yval >= VALUED.length) return;
				data = DATASETS[ VALUED[yval] ];
				aoi = lenses[ xval ];
			}
			aggregate_fixation_data_across_twi(p, data, aoi, true, null);
		}else if( MATRIX_VIEW_STATE == 'lensegroup_toi' || MATRIX_VIEW_STATE == 'toi_lensegroup'){ 
			let twi_id = -1;
			let aoi = -1;
			if( mat_col_val == 'toi' ){
				if(xval == -1 || xval >= order_twis.length) return;
				if(yval == -1 || yval >= ORDERLENSEGROUPID.length) return;
				twi_id = order_twis[ xval ];
				aoi = yval;
			}else if( mat_row_val == 'toi' ){
				if(xval == -1 || xval >= ORDERLENSEGROUPID.length) return;
				if(yval == -1 || yval >= order_twis.length) return;
				twi_id = order_twis[ yval ];
				aoi = xval;
			}
			aggregate_fixation_data_across_dat(p, twi_id, aoi, true, null);
		}else if( MATRIX_VIEW_STATE == 'aoi_toi' || MATRIX_VIEW_STATE == 'toi_aoi'){ 
			let twi_id = -1;
			let aoi = null;
			if( mat_col_val == 'toi' ){
				if(xval == -1 || xval >= order_twis.length) return;
				if(yval == -1 || yval >= lenses.length) return;
				twi_id = order_twis[ xval ];
				aoi = lenses[ yval ];
			}else if( mat_row_val == 'toi' ){
				if(xval == -1 || xval >= lenses.length) return;
				if(yval == -1 || yval >= order_twis.length) return;
				twi_id = order_twis[ yval ];
				aoi = lenses[ xval ];
			}
			aggregate_fixation_data_across_dat(p, twi_id, aoi, true, null);
		}else if( MATRIX_VIEW_STATE == 'lensegroup_twigroup' || MATRIX_VIEW_STATE == 'twigroup_lensegroup'){ 
			let twigroup_id = -1;
			let aoi = -1;
			if( mat_col_val == 'twigroup' ){
				if(xval == -1 || xval >= ORDERTWIGROUPID.length) return;
				if(yval == -1 || yval >= ORDERLENSEGROUPID.length) return;
				twigroup_id = ORDERTWIGROUPID[ xval ];
				aoi = yval;
			}else if( mat_row_val == 'twigroup' ){
				if(xval == -1 || xval >= ORDERLENSEGROUPID.length) return;
				if(yval == -1 || yval >= ORDERTWIGROUPID.length) return;
				twigroup_id = ORDERTWIGROUPID[ yval ];
				aoi = xval;
			}
			for(let c=0; c<order_twis.length; c++)	{
				let order_twis_group_index = ORDERTWIGROUPID.indexOf(base_twis[order_twis[c]].group);
	
				if(order_twis_group_index != -1  && twigroup_id == base_twis[order_twis[c]].group &&
					base_twis[order_twis[c]].included && base_twis[order_twis[c]].checked) {
						aggregate_fixation_data_across_dat(p, order_twis[c], aoi, true, null);
				}
			}
		}else if( MATRIX_VIEW_STATE == 'aoi_twigroup' || MATRIX_VIEW_STATE == 'twigroup_aoi'){ 
			let twigroup_id = -1;
			let aoi = null;
			if( mat_col_val == 'twigroup' ){
				if(xval == -1 || xval >= ORDERTWIGROUPID.length) return;
				if(yval == -1 || yval >= lenses.length) return;
				twigroup_id = ORDERTWIGROUPID[ xval ];
				aoi = lenses[ yval ];
			}else if( mat_row_val == 'twigroup' ){
				if(xval == -1 || xval >= lenses.length) return;
				if(yval == -1 || yval >= ORDERTWIGROUPID.length) return;
				twigroup_id = ORDERTWIGROUPID[ yval ];
				aoi = lenses[ xval ];
			}
			for(let c=0; c<order_twis.length; c++)	{
				let order_twis_group_index = ORDERTWIGROUPID.indexOf(base_twis[order_twis[c]].group);
	
				if(order_twis_group_index != -1  && twigroup_id == base_twis[order_twis[c]].group &&
					base_twis[order_twis[c]].included && base_twis[order_twis[c]].checked) {
						aggregate_fixation_data_across_dat(p, order_twis[c], aoi, true, null);
				}
			}

		}else if( MATRIX_VIEW_STATE.indexOf('lensegroup')!= -1 && MATRIX_VIEW_STATE.indexOf('grp')!=-1){ // this is an lensegroup-grp or grp-lensegroup state
			// grab the dataset, toi, and lensegroup that we are considering
			let data = null;
			let grp = -1;
			let aoi = -1;
			if( mat_col_val == 'grp' ){
				grp = xval;
				aoi = yval;
			}else if( mat_row_val == 'grp' ){
				grp = yval;
				aoi = xval;
			}			
			if(grp != -1 && aoi != -1 && grp < ORDERGROUPIDARRAYINDEX.length && aoi < ORDERLENSEGROUPID.length){
				for(let i = 0; i < VALUED.length; i++) {
					if(DATASETS[ VALUED[i] ].group == GROUPS[ORDERGROUPIDARRAYINDEX[grp]].group) {
						// draw the fixations in intersection of toi and aoi, for the dataset:						
						data = DATASETS[ VALUED[i] ];
						aggregate_fixation_data_across_twi(p, data, aoi, true, null);
					}
				}				
			}
		}
		else if( MATRIX_VIEW_STATE.indexOf('aoi')!= -1 && MATRIX_VIEW_STATE.indexOf('grp')!=-1){ // this is an aoi-grp or grp-aoi state
			// grab the dataset, toi, and lensegroup that we are considering
			let data = null;
			let grp = -1;
			let aoi = null;
			if( mat_col_val == 'grp' ){
				grp = xval;
				aoi = lenses[ yval ];
			}else if( mat_row_val == 'grp' ){
				grp = yval;
				aoi = lenses[ xval ];
			}			
			
			if(grp != -1 && aoi != -1 && grp < ORDERGROUPIDARRAYINDEX.length && aoi != undefined){
				for(let i = 0; i < VALUED.length; i++) {
					if(DATASETS[ VALUED[i] ].group == GROUPS[ORDERGROUPIDARRAYINDEX[grp]].group) {
						// draw the fixations in intersection of toi and aoi, for the dataset:						
						data = DATASETS[ VALUED[i] ];
						aggregate_fixation_data_across_twi(p, data, aoi, true, null);
					}
				}				
			}
		}
		if(MATRIX_DATA_STATE.indexOf('aoi') == 0){ // some aoi metric is being used, so lets draw the grid overview
			// do the comparison maps
			if( xdat != undefined && ydat != undefined && xdat.totaltime > 0 && ydat.totaltime > 0){
				p.noStroke();
				c1 = MATCOL[1]; c2 = MATCOL[2]; // fetch all the colour values I need, from their tables
				r1 = fromHex(c1.substring(1,3)), g1 = fromHex(c1.substring(3,5)), b1 = fromHex(c1.substring(5,7));
				r2 = fromHex(c2.substring(1,3)), g2 = fromHex(c2.substring(3,5)), b2 = fromHex(c2.substring(5,7));
				max_val = 0; // find the maximum value, so I can colour relative to it
				for(a = 0; a<lenses.length; a++){ max_val = Math.max(max_val, xdat.lenstime[a] / xdat.totaltime, ydat.lenstime[a] / ydat.totaltime ); }
				
				for(a = 0; a<lenses.length; a++){
						vx = xdat.lenstime[a] / xdat.totaltime; vy = ydat.lenstime[a] / ydat.totaltime;
						p.fill( matrix_mix( vx, vy, max_val, 200 ) );
						lenses[a].draw(p, building_lens_id==order_lenses[a],
																selected_lens==order_lenses[a],
																spatial_width, spatial_height);
				}
			}
		}else if(MATRIX_DATA_STATE.indexOf('grid') == 0){ // some grid metric is being used, so lets draw the grid overview
			// do the comparison maps
			if( xdat != undefined && ydat != undefined && xdat.totaltime > 0 && ydat.totaltime > 0){
				p.noStroke();
				c1 = MATCOL[1]; c2 = MATCOL[2]; // fetch all the colour values I need, from their tables
				r1 = fromHex(c1.substring(1,3)), g1 = fromHex(c1.substring(3,5)), b1 = fromHex(c1.substring(5,7));
				r2 = fromHex(c2.substring(1,3)), g2 = fromHex(c2.substring(3,5)), b2 = fromHex(c2.substring(5,7));
				max_val = 0; // find the maximum value, so I can colour relative to it
				for(a = 0; a<GRID_N**2; a++){ max_val = Math.max(max_val, xdat.grid_density[a] / xdat.totaltime, ydat.grid_density[a] / ydat.totaltime ); }
				for(a = 0; a<GRID_N; a++){
					for(b = 0; b<GRID_N; b++){
						vx = xdat.grid_density[a*GRID_N + b] / xdat.totaltime;
						vy = ydat.grid_density[a*GRID_N + b] / ydat.totaltime;
						p.fill( matrix_mix( vx, vy, max_val, 200 ) );
						p.rect( Math.floor(p.width*a/GRID_N), Math.floor(p.height*b/GRID_N), Math.floor(p.width*(a+1)/GRID_N) - Math.floor(p.width*a/GRID_N), Math.floor(p.height*(b+1)/GRID_N) - Math.floor(p.height*b/GRID_N));
					}
				}
			}
		}
	}else if(mat_type == "hist"){
		//check data filtering and selected metrics
		
		aggregate_histogram_across_dat_twi(p, data, true, null);
	}
};
