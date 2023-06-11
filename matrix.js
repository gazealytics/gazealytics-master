let MatrixBack;
let draggableRectx = 0,draggableRecty = 0, draggableRectw = 0, draggableRecth = 0;

let draggingX = false, draggingY = false; // Is the object being dragged?

let num_format = (num, digs) => {
	if ( Number.isInteger(num) ){
		return num.toFixed(0);
	}
	else if(num != null && num != undefined)
		return num.toFixed( Math.min(8, Math.max(0, digs - Math.floor( Math.log10(10**-10 + Math.abs(num)) ) ) ) );
	else
		return 0;
};

xmin = 0; xtot = 0; xh = 0; xnum = 0; // the number of columns
ymin = 0; ytot = 0; yh = 0; ynum = 0; // the number of rows

colnames = []; rownames = []; matrix_values = []; matrix_colours = []; coldatas = []; rowdatas = []; colspecial = -1; rowspecial = -1;
overlay_string = "";flipped = false; sort_selected_name = ""; is_sort_initiated_rows=false; is_sort_initiated_column=false;
trans_max = 0;

MATRIX_CANVAS_WIDTH_PERCENTAGE = 0.33; // percentage of the browser innerWidth
MATRIX_CANVAS_HEIGHT_PERCENTAGE = 0.33; // percentage of the browser innerHeight
DATA_TOP_WIDTH_PERCENTAGE = 0.38;
DATA_TOP_WIDTH_PERCENTAGE_times_100 = 38;

DATA_TOP_HEIGHT_PERCENTAGE = 0.5;
MATRIX_WRAPPER_HEIGHT_PERCENTAGE = 0.43;
MATRIX_WRAPPER_HEIGHT_PERCENTAGE_times_100 = 43;

let matrix_width = 0;
let matrix_height = 0;
let matrixCanvas1 = 0;
let matrixCanvas2 = 0;

let playing = false;
let currentVideoObj = null;
let videoCurrentTimeChanged = false;
let videoCurrentTime = 0;
let button;
let videoinput;
let toi_start_timestamp_button = null;
let toi_end_timestamp_button = null;
let setvideotime;
let videomoderadio;
let videoloaded = false;
let videotime = 0;

let colcolours = [];
let rowcolours = [];

let matrixsketch = (p) => {
	let f = {
		"fontName": "Arial",
		"fontSize": 18
	}; 

	let fb = {
		"fontName": "Arial",
		"fontSize": 18
	}; // the font size used for general text writing applications. defined in setup
	
	p.initConfig = (windowWidth, windowHeight) => {
		p.textFont(f.fontName);
		p.textSize(f.fontSize);
		
		xmin = p.width*0.15; ymin = p.height*0.15; 
		xtot = p.width*0.8; ytot = p.height*0.8;
		matrix_changed = true;

		// Starting location
		draggableRectx = p.width-15;
		draggableRecty = p.height-15;
		// Dimensions
		draggableRectw = 15;
		draggableRecth = p.height;
	};

	p.setup = () => {
		let data_top_height = Math.floor(p.windowHeight*DATA_TOP_HEIGHT_PERCENTAGE);
		let matrix_wrapper_height = Math.floor(p.windowHeight*MATRIX_WRAPPER_HEIGHT_PERCENTAGE);
		let matrix_center_height = Math.floor(p.windowHeight*MATRIX_CANVAS_HEIGHT_PERCENTAGE);

		MATRIX_WRAPPER_HEIGHT_PERCENTAGE = MATRIX_CANVAS_HEIGHT_PERCENTAGE / 0.93;
		DATA_TOP_HEIGHT_PERCENTAGE = 0.93 - MATRIX_WRAPPER_HEIGHT_PERCENTAGE;
		
		document.getElementById("left_box").style.height = data_top_height+'px';
		document.getElementsByClassName("matrix_wrapper")[0].style.height = matrix_wrapper_height+'px';
		document.getElementById("matrix_center").style.height = matrix_center_height+'px';
		document.getElementsByClassName("data_box")[0].style.height = (p.windowHeight*CANVAS_BOX_HEIGHT_PERCENTAGE)+"px";

		matrix_width = Math.floor(p.windowWidth * MATRIX_CANVAS_WIDTH_PERCENTAGE);
		matrix_height = matrix_center_height;

		matrixCanvas1 = p.createCanvas(matrix_width, matrix_height, p.P2D);
		MatrixBack = p.createGraphics(p.width, p.height, p.P2D);
		
		MATRIX = p;
		p.initConfig(p.windowWidth, p.windowHeight);
		
		matrixCanvas1.mouseOver(() => { p.mouseIsOver_matrix = true; });
		
		matrixCanvas1.mouseClicked(() => {
			if(p.mouseX < 0 || p.mouseY < 0 || p.mouseX > p.width || p.mouseY > p.height) return;
			if( matrix_values.length == 0 ){ return; } // nothing to sort by
			xclose = p.mouseX < xmin; yclose = p.mouseY < ymin; sort_coef = [];
			if( !(xclose || yclose) ){ return; } // didn't click on the parts that apply sorting
			// get sorting values
			sort_selected_name = "";
			is_sort_initiated_column=false;
			is_sort_initiated_rows=false;
			if(xclose && yclose){
				for(let i=0; i<rownames.length; i++){
					sort_coef.push( rownames[i]  );
				}
			}else if(xclose && (MATRIX_VIEW_STATE=='dat_aoi' || MATRIX_VIEW_STATE=='grp_aoi' || MATRIX_VIEW_STATE=='grp_dat')){
				is_sort_initiated_column = true;
				yval = Math.floor( (p.mouseY - ymin) / yh );
				for(let i=0; i<rownames.length; i++){
					sort_coef.push( matrix_values[yval][i] );
				}
				sort_selected_name +=colnames[yval];
			}else if(xclose && (MATRIX_VIEW_STATE=='aoi_dat' || MATRIX_VIEW_STATE=='aoi_grp' || MATRIX_VIEW_STATE=='dat_grp')){
				is_sort_initiated_column = true;
				yval = Math.floor( (p.mouseY - ymin) / yh );
				for(let i=0; i<colnames.length; i++){
					sort_coef.push( matrix_values[i][yval] );
				}
				sort_selected_name +=rownames[yval];
			}else if(yclose && (MATRIX_VIEW_STATE=='dat_aoi' || MATRIX_VIEW_STATE=='grp_aoi' || MATRIX_VIEW_STATE=='grp_dat')){
				is_sort_initiated_rows = true;
				xval = Math.floor( (p.mouseX - xmin) / xh );
				for(let i=0; i<colnames.length; i++){
					sort_coef.push( matrix_values[i][xval] );
				}
				sort_selected_name +=rownames[xval];
			}else if(yclose && (MATRIX_VIEW_STATE=='aoi_dat' || MATRIX_VIEW_STATE=='aoi_grp' || MATRIX_VIEW_STATE=='dat_grp')){
				is_sort_initiated_rows = true;
				xval = Math.floor( (p.mouseX - xmin) / xh );
				for(let i=0; i<rownames.length; i++){
					sort_coef.push( matrix_values[xval][i] );
				}
				sort_selected_name +=colnames[xval];
			}else if(yclose){
				is_sort_initiated_rows = true;
				xval = Math.floor( (p.mouseX - xmin) / xh );
				for(let i=0; i<rownames.length; i++){
					sort_coef.push( matrix_values[xval][i] );
				}
				sort_selected_name +=rownames[xval];
			}else if(xclose){
				is_sort_initiated_column = true;
				yval = Math.floor( (p.mouseY - ymin) / yh );
				for(let i=0; i<colnames.length; i++){
					sort_coef.push( matrix_values[i][yval] );
				}
				sort_selected_name +=colnames[yval];
			}
			// apply the sorting coef on the appropriate list (lens or dataset, TOIs coming soon maybe?)
			if(xclose){
				if(MATRIX_VIEW_STATE.substring(4,7)=='aoi'){
					sort_lenses(sort_coef);
				}else if(MATRIX_VIEW_STATE.substring(4,7)=='dat'){
					sort_datasets(sort_coef);
				}else if(MATRIX_VIEW_STATE.substring(4,7)=='grp'){
					sort_groups(sort_coef);
				}
	
			}else{
				if(MATRIX_VIEW_STATE.indexOf('aoi')==0){
					sort_lenses(sort_coef);
				}else if(MATRIX_VIEW_STATE.indexOf('dat')==0){
					sort_datasets(sort_coef);
				}else if(MATRIX_VIEW_STATE.indexOf('grp')==0){
					sort_groups(sort_coef);
				}
			}
		});
		
		matrixCanvas1.mouseOut(() => { p.mouseIsOver_matrix = false; });
		p.resizeElements(true, true);
		
		
	};
	
	p.draw = () => {
		//draw draggable bar for resizing canvas
		//drag and drop
		p.stroke(126);
		// Is mouse over object
		if (p.mouseX > draggableRectx && p.mouseX < draggableRectx + draggableRectw && p.mouseY > draggableRecty && p.mouseY < draggableRecty + draggableRecth) {
		  rollover = true;
		} 
		else {
		  rollover = false;
		}
		p.background(0,0,0);

		if(matrix_changed){
			matrix_changed = false;
			try{
				compute_all_metrics();
				load_data();
				matrix_redraw = true;
			}catch (error) {
				colnames = []; rownames = []; matrix_values = []; matrix_colours = []; overlay_string = "%VAL";
				console.error(error);
				matrix_changed = true;
			}
		}
		
		if(( mat_type=='mat' || mat_type=='hist') && (VALUED.length == 0 || order_twis.length == 0)){ // initial message
			p.stroke(grey(100)); 
			p.noFill(); 
			p.strokeWeight(0);
			p.rect(0,0,p.width,p.height);
			p.fill(white(100));
			p.textFont(fb.fontName);
			p.textSize(fb.fontSize); 
			p.textAlign( p.CENTER );
			p.text("Metrics Canvas, shows computed\n statistics about the data", p.width/2, p.height/2);
			if(currentVideoObj != null && currentVideoObj != undefined) {
				currentVideoObj.pause();
				currentVideoObj.hide();				
			}				
			return;
		}
		else if( VALUED.length == 0){ // initial message
			p.stroke(grey(100)); 
			p.noFill(); 
			p.strokeWeight(0);
			p.rect(0,0,p.width,p.height);
			p.fill(white(100));
			p.textFont(fb.fontName);
			p.textSize(fb.fontSize); 
			p.textAlign( p.CENTER );
			p.text("Metrics Canvas, shows computed\n statistics about the data", p.width/2, p.height/2);
			if(currentVideoObj != null && currentVideoObj != undefined) {
				currentVideoObj.pause();
				currentVideoObj.hide();
			}				
			return;
		}
		else if(MATRIX_VIEW_STATE == "aoi_aoi" && DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1){ // show hlet message
			p.stroke(grey(100)); 
			p.noFill(); 
			p.strokeWeight(0);
			p.rect(0,0,p.width,p.height);
			p.fill(white(100));
			p.textFont(fb.fontName);
			p.textSize(fb.fontSize); 
			p.textAlign( p.CENTER );
			p.text("Selected dataset "+DATASETS[selected_data].name+" is slashed\n out or removed. Unslash or\n select other sample to see the data", p.width/2, p.height/2);
			if(currentVideoObj != null && currentVideoObj != undefined) {
				currentVideoObj.pause();
				currentVideoObj.hide();
			}				
			return;
		}
		
		if(matrix_redraw){
			matrix_redraw = false;
			try{
				if(mat_type=='mat'){ p.matrix_draw(MatrixBack);  }
				else if(mat_type=='hist'){ p.hist_draw(MatrixBack); }

				if(mat_type=='mat' || mat_type=='hist') {
					if(currentVideoObj != null && currentVideoObj != undefined) {
						currentVideoObj.pause();
						currentVideoObj.hide();
					}
				}
				else if(mat_type=='video'){ p.video_draw(); }
			}catch (error) {
				colnames = []; rownames = []; matrix_values = []; matrix_colours = []; overlay_string = "%VAL";
				console.error(error);
				matrix_changed = true;
			}
		}
		
		try{
			if(mat_type=='mat' || mat_type=='hist') 
				p.image(MatrixBack, 0, 0);
			else if(VIDEO_LINKING && mat_type=='video' && currentVideoObj != null && currentVideoObj != undefined && VIDEOS[selected_data] != null && 
				VIDEOS[selected_data] != undefined && VIDEOS[selected_data].videoobj != null && VIDEOS[selected_data].videoobj != undefined) {
				if(videoCurrentTime != VIDEOS[selected_data].videoobj.time()) {
					videoCurrentTimeChanged = true;
					VIDEO_IN_PLAY = true;
					videoCurrentTime = VIDEOS[selected_data].videoobj.time();
				}
				else
					VIDEO_IN_PLAY = false;
			}				
			p.mouseOverNotes();
		}catch (error) { console.error(error); matrix_redraw=true; }	
	};

	p.keyPressed = () => {if(p.key=='s'){p.noLoop();}};

	p.mouseDragged = () => {
		// Adjust location if being dragged
		if (draggingX) {
		  draggableRectx = p.mouseX + p.offsetX;
		}
		if(draggingY) {
			draggableRecty = (matrix_height-p.mouseY) + p.offsetY;
		}
	}
	
	p.mousePressed = () => {
		if(p.mouseX < 0 || p.mouseY < 0 || p.mouseX > p.width || p.mouseY > p.height) return;
		
		if (p.mouseY > 0 && p.mouseY < RESIZE_CONTROL_PADDING && p.mouseX > 0 && p.mouseX < p.width) {
			draggingY = true;
			// If so, keep track of relative location of click to corner of rectangle
			p.offsetY = draggableRecty-(matrix_height-p.mouseY);
		}

		if (p.mouseX > p.width-RESIZE_CONTROL_PADDING && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
			draggingX = true;
			// If so, keep track of relative location of click to corner of rectangle
			p.offsetX = draggableRectx-p.mouseX;
		}
		
	}

	p.mouseReleased = () => {
		// Quit dragging; Resizing canvas
		if(draggingX) {
			draggingX = false;

			let matrix_center_width = draggableRectx;
			
			MATRIX_CANVAS_WIDTH_PERCENTAGE = matrix_center_width / p.windowWidth;
			
			// let data_top_width = Math.floor((matrix_center_width * 100) / 94.5);
			let data_top_width = Math.floor(matrix_center_width / 0.902);
			
			let interface_layout_width = Math.floor(p.windowWidth * INTERFACE_LAYOUT_OVER_WINDOWS_WIDTH);
			DATA_TOP_WIDTH_PERCENTAGE = data_top_width / interface_layout_width;
			
			SPATIAL_CANVAS_WIDTH_PERCENTAGE = 1 - DATA_TOP_WIDTH_PERCENTAGE - 0.1;

			p.resizeElements(true, false);		
			
			SPATIAL.resizeElements(true, false);
			TIMELINE.resizeElements(true, false);
		}	
		
		if(draggingY) {
			draggingY = false;
			let matrix_center_height = draggableRecty+15;			
			MATRIX_CANVAS_HEIGHT_PERCENTAGE = matrix_center_height / p.windowHeight;
			MATRIX_WRAPPER_HEIGHT_PERCENTAGE = MATRIX_CANVAS_HEIGHT_PERCENTAGE / 0.93;
			DATA_TOP_HEIGHT_PERCENTAGE = 0.93 - MATRIX_WRAPPER_HEIGHT_PERCENTAGE;
			p.resizeElements(false, true);	
		}
	};

	p.resizeElements = (width_changed, height_changed) => {		
		matrix_height = Math.floor(p.windowHeight * MATRIX_CANVAS_HEIGHT_PERCENTAGE);

		if(width_changed) {
			//calculate width
			let interface_layout_width = Math.floor(p.windowWidth * INTERFACE_LAYOUT_OVER_WINDOWS_WIDTH);
			let data_top_width = Math.floor(interface_layout_width * DATA_TOP_WIDTH_PERCENTAGE);
			let matrix_wrapper_width = Math.floor(data_top_width * 0.96);
			matrix_width = Math.floor(matrix_wrapper_width * 0.94);
			
			MATRIX_CENTER_WIDTH_PERCERTAGE_OVER_INTERFACE_LAYOUT = Math.floor(100 * data_top_width / interface_layout_width);
			DATA_TOP_WIDTH_PERCENTAGE_times_100 = 100 * DATA_TOP_WIDTH_PERCENTAGE;

			//update width
			document.getElementsByClassName("data_top")[0].style.width = data_top_width+'px';
			document.getElementsByClassName("matrix_wrapper")[0].style.width = matrix_wrapper_width+'px';
			document.getElementById("matrix_center").style.width = matrix_width+'px';

			document.getElementsByClassName("interface_layout")[0].style["grid-template-columns"] = DATA_TOP_WIDTH_PERCENTAGE_times_100+"% 0.5% " + 
				(100-DATA_TOP_WIDTH_PERCENTAGE_times_100) + "%";
		}

		if(height_changed) {
			//calculate height

			let data_box_height = Math.floor(p.windowHeight * CANVAS_BOX_HEIGHT_PERCENTAGE);
			let data_top_height = Math.floor(data_box_height*DATA_TOP_HEIGHT_PERCENTAGE);			
			let matrix_wrapper_height = Math.floor(data_box_height*MATRIX_WRAPPER_HEIGHT_PERCENTAGE);
			MATRIX_WRAPPER_HEIGHT_PERCENTAGE_times_100 = 100 * MATRIX_WRAPPER_HEIGHT_PERCENTAGE;
			
			//update height
			document.getElementsByClassName("data_top")[0].style.height = data_top_height+'px'; //data_top element
			document.getElementsByClassName("matrix_wrapper")[0].style.height = matrix_wrapper_height+'px';
			document.getElementById("matrix_center").style.height = matrix_height+'px';
			document.getElementsByClassName("data_box")[0].style["grid-template-rows"] = (93-MATRIX_WRAPPER_HEIGHT_PERCENTAGE_times_100)+"% " + MATRIX_WRAPPER_HEIGHT_PERCENTAGE_times_100+"%";
			
			document.getElementsByClassName("data_box")[0].style.height = data_box_height+"px";	
		}
		
		let data_top_height = Math.floor(p.windowHeight*DATA_TOP_HEIGHT_PERCENTAGE);
		let matrix_wrapper_height = Math.floor(p.windowHeight*MATRIX_WRAPPER_HEIGHT_PERCENTAGE);
		let matrix_center_height = Math.floor(p.windowHeight*MATRIX_CANVAS_HEIGHT_PERCENTAGE);

		for(let i = 0; i<VIDEOS.length; i++) {
			if(VIDEOS[i].videoobj != null && VIDEOS[i].videoobj != undefined) {
				VIDEOS[i].videoobj.size(matrix_width*0.8, matrix_height*0.8);
				VIDEOS[i].videoobj.position(matrix_width*0.2, matrix_height*0.2 + data_top_height + matrix_wrapper_height - matrix_center_height);
			}
		}
		p.resizeCanvas(matrix_width, matrix_height);
		MatrixBack = p.createGraphics(p.width, p.height, p.P2D);
		p.initConfig(p.windowWidth, p.windowHeight);

		matrix_changed = true;	
	};

	p.windowResized = () => {
		p.resizeElements(true, true);
	};	

	p.mouseIsOver_matrix = false;
	
	p.mouseOverNotes = () => {
		if (p.mouseIsOver_matrix && p.mouseX > p.width-RESIZE_CONTROL_PADDING && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
			document.getElementById("matrix_center").style.cursor = 'ew-resize';
		}
		else if (p.mouseIsOver_matrix && p.mouseY > 0 && p.mouseY < RESIZE_CONTROL_PADDING && p.mouseX > 0 && p.mouseX < p.width) {
			document.getElementById("matrix_center").style.cursor = 'ns-resize';
		}								
		else {
			document.getElementById("matrix_center").style.cursor = 'default';
		}

		HasVal = false; xdat = undefined; ydat = undefined; mouse_bin = -1;
		
		if( mat_type == 'mat'){
			if( matrix_values.length == 0){ return; } // no mouseOver values to attach
			p.fill(white(100)); p.stroke(white(100)); p.textFont(f); p.textSize(18); p.textAlign(p.CENTER);
			xclose = p.mouseX < xmin; yclose = p.mouseY < ymin;
			if( !p.mouseIsOver_matrix  || p.mouseX>xmin+xtot-7 || p.mouseY>ymin+ytot-7  ){ return; } //|| p.mouseX < xmin || p.mouseY < ymin
			// mouse isn't over the data, so we don't care, otherwise:
			if( p.mouseX < xmin || p.mouseY < ymin){
				m1 = "";
				xval = Math.floor( (p.mouseX - xmin) / xh ); yval = Math.floor( (p.mouseY - ymin) / yh ); 
				//display row or column names based on selection 
					if(xval >= 0 && yval < 0){
						if(flipped){
						m1= rownames[xval];
						}
						else{
						m1=colnames[xval];
						}
					}
					else{
						if(flipped){
						m1= colnames[yval];
						}
						else{
						m1=rownames[yval];
						}
					}
				
					p.text(m1, p.width/2, p.height-5);
			}
			xval = Math.floor( (p.mouseX - xmin) / xh ); yval = Math.floor( (p.mouseY - ymin) / yh ); 
			try{
				let m = "";
				if(p.mouseX > xmin && p.mouseY > ymin){
					HasVal = true;
					if(flipped && colnames[yval] != undefined && rownames[xval] != undefined){
						m = overlay_string.replaceAll( "%ROW", rownames[xval] ).replace( "%COL", colnames[yval]).replaceAll("%VAL", num_format(matrix_values[yval][xval], 5) );
					}
					else if(colnames[xval] != undefined && rownames[yval] != undefined){ 
						m = overlay_string.replaceAll( "%ROW", rownames[yval] ).replace( "%COL", colnames[xval] ).replaceAll("%VAL", num_format(matrix_values[xval][yval], 5) ); 
					}
					
					//x = max(xmin, min(xmin + xtot - p.textWidth(m), p.mouseX - p.textWidth(m)/2));
					if(m.length > 0)
						p.text(m, p.width/2, p.height-5);
				}				
			}catch (error) { console.error(error); }
			if(p.mouseX > xmin && p.mouseY > ymin){
				if( mat_col_val == 'twigroup' ){
					xdat = TWIGROUP_DATA_BY_DAT_MODE[xval];
				}else if( mat_col_val == 'toi' ){
					xdat = TWI_DATA_BY_DAT_MODE[xval];										
				}else if( mat_col_val == 'dat' ){
					xdat = DAT_DATA_BY_TWI_MODE[xval];
				}else if( mat_col_val == 'grp' ){
					xdat = GROUPS[ xval ];
				}

				if( mat_col_val == 'twigroup' ){
					ydat = TWIGROUP_DATA_BY_DAT_MODE[yval];
				}else if( mat_row_val == 'toi' ){
					ydat = TWI_DATA_BY_DAT_MODE[yval];
				}else if( mat_row_val == 'dat' ){
					ydat = DAT_DATA_BY_TWI_MODE[yval];
				}else if( mat_row_val == 'grp' ){
					ydat = GROUPS[ yval ];
				}
				if(mat_col_val == 'toi' && mat_row_val == 'toi' && (xdat == null || ydat == null))
					p.text("No TWI data", p.width/2, p.height-5);
			}
			
		}else if( mat_type == 'hist' ){
			if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) == -1)
				return;
			else if(DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1)
				return;

			if( !p.mouseIsOver_matrix ){ return; } // no mouseover to refer to
			mouse_bin = Math.floor( BINS_N * ( (p.mouseX/p.width)/0.9 - 0.05 ) );
			if( mouse_bin < 0 || mouse_bin >= BINS_N ){ mouse_bin = -1; return; }else{ HasVal = true; }
			let message = "";
			let aoi_name = "";
				
			if( HIST_METRIC == 'fix_dur' ){
				message = "Fixations with duration between %MIN and %MAX ms: %VAL";
			}else if( HIST_METRIC == 'fix_aoi_dur' ){
				if(base_lenses[selected_lens].name != undefined)
					aoi_name = base_lenses[selected_lens].name;			
				message = "Fixations at AOI %AOI with duration between %MIN and %MAX ms: %VAL";
			}else if( HIST_METRIC == 'fix_lensegroup_dur' ){
				message = "Fixations at AOI group %AOI with duration between %MIN and %MAX ms: %VAL";
				aoi_name = selected_lensegroup;
			}else if( HIST_METRIC == 'visit_aoi_dur' ){
				if(base_lenses[selected_lens].name != undefined)
					aoi_name = base_lenses[selected_lens].name;
				message = "Visitations at AOI %AOI with duration between %MIN and %MAX ms: %VAL";				
			}else if( HIST_METRIC == 'visit_lensegroup_dur' ){
				message = "Visitations at AOI group %AOI with duration between %MIN and %MAX ms: %VAL";
			}else if( HIST_METRIC == 'sac_len' ){
				if(DAT_MODE == 0)
					message = "Average saccade length by Group between %MIN and %MAX pixels: %VAL";
				else
					message = "Saccades with length between %MIN and %MAX pixels: %VAL";
			}
			p.fill(white(100)); p.stroke(white(100)); p.textFont(f); p.textSize(18); p.textAlign(p.CENTER);

			p.text(message.replace( "%MIN", num_format(max_val*mouse_bin/BINS_N )).replace( "%AOI", aoi_name).replace( "%MAX", num_format(max_val*(mouse_bin+1)/BINS_N)).replace( "%VAL", bins[mouse_bin]), p.width/2, p.height-5);
		}
	};

	p.aggregate_hist_metrics = (data, fixs, toi, bins, lense) => {
		if( HIST_METRIC == 'fix_dur'){		
			let val_list = [];	
			for(let i=toi.j_min; i<toi.j_max; i++){  val_list.push( fixs[i].dt ); }
			min_val = 0; max_val = 1000;
			for(let i=0; i<val_list.length; i++){ bins[ Math.min(bins.length-1, Math.floor( (val_list[i]-min_val)/(max_val-min_val)*BINS_N ) ) ] += 1; }
		}
		else if( HIST_METRIC == 'sac_len'){
			let val_list = [];
			for(let i=toi.j_min; i<toi.j_max-1; i++){ val_list.push( data.sacs[i].length ); }
			min_val = 0; max_val = Math.sqrt( WIDTH**2 + HEIGHT**2 );//Math.max( WIDTH, HEIGHT);
			for(let i=0; i<val_list.length; i++){ bins[ Math.min(bins.length-1, Math.floor( (val_list[i]-min_val)/(max_val-min_val)*BINS_N ) ) ] += 1; }			
		}
		else {
			if(HIST_METRIC.indexOf("lensegroup") > -1){
				for(let l2=0; l2<lenses.length; l2++){
					if(lenses[l2].group == selected_lensegroup) {						
						let val_list = [];
						if( HIST_METRIC == 'fix_lensegroup_dur'){	
							let val_list = [];		
							for(let i=toi.j_min; i<toi.j_max; i++){ if( lense!=-1 && lenses[l2].inside(fixs[i].x, fixs[i].y) ){ val_list.push( fixs[i].dt ); } }
							min_val = 0; max_val = 1000;
							for(let i=0; i<val_list.length; i++){ bins[ Math.min(bins.length-1, Math.floor( (val_list[i]-min_val)/(max_val-min_val)*BINS_N ) ) ] += 1; }
						}else if( lense!=-1 && HIST_METRIC == 'visit_lensegroup_dur' && ORDERLENSEGROUPID.indexOf(selected_lensegroup) != -1 ){
							val_list = toi.lensegroup_visit_durations[ ORDERLENSEGROUPID.indexOf(selected_lensegroup)];
							min_val = 0; max_val = 20000;
							for(let i=0; i<val_list.length; i++){ bins[ Math.min(bins.length-1, Math.floor( (val_list[i]-min_val)/(max_val-min_val)*BINS_N ) ) ] += 1; }
						}
					}	
					if(lense==-1)
						break;				
				}
			}
			else if(HIST_METRIC.indexOf("aoi") > -1){
				let val_list = [];
				if( lense!=-1 && HIST_METRIC == 'fix_aoi_dur'){	
					let val_list = [];		
					for(let i=toi.j_min; i<toi.j_max; i++){ if( lense!=-1 && lense.inside(fixs[i].x, fixs[i].y) ){ val_list.push( fixs[i].dt ); } }
					min_val = 0; max_val = 1000;
					for(let i=0; i<val_list.length; i++){ bins[ Math.min(bins.length-1, Math.floor( (val_list[i]-min_val)/(max_val-min_val)*BINS_N ) ) ] += 1; }
				}else if( lense!=-1 && HIST_METRIC == 'visit_aoi_dur'){
					val_list = toi.visit_durations[ order_lenses.indexOf(selected_lens) ];
					min_val = 0; max_val = 20000;
					for(let i=0; i<val_list.length; i++){ bins[ Math.min(bins.length-1, Math.floor( (val_list[i]-min_val)/(max_val-min_val)*BINS_N ) ) ] += 1; }
				}
			}
		}
	};

	p.hist_draw = (canvas) => {
		canvas.background(black(100)); canvas.textFont(fb); canvas.textAlign(p.LEFT);
		
		//check dat_mode, twi_mode, lense_mode
		
		if( selected_data == -1){ return; }
		if( order_lenses.indexOf(selected_lens) != -1){ lense = base_lenses[selected_lens]; }else{ lense=-1; }

		bins = []; for(let i=0; i < BINS_N; i++){ bins.push(0); }
		min_val = 0; max_val = 0;
		let max = 0;
		//determine the max value for normalising the bin height and line height
		let tmp_bins = []; for(let i=0; i < BINS_N; i++){ tmp_bins.push(0); }
		if(DAT_MODE == 1 || DAT_MODE == 2) {
			for(let v=0; v<VALUED.length; v++){				
				data = DATASETS[VALUED[v]]; 
				
				if(VALUED.indexOf(selected_data) == -1 || data == undefined || !data.included)
					continue;
				for(let i=0; i < BINS_N; i++){ tmp_bins[i] = 0; }

				//filter fixations by TWI_MODE
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						p.aggregate_hist_metrics(data, data.fixs, data.tois[data.toi_id], tmp_bins, lense);
					}
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							p.aggregate_hist_metrics(data, data.fixs, data.tois[c], tmp_bins, lense);
						}
					}
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							p.aggregate_hist_metrics(data, data.fixs, data.tois[c], tmp_bins, lense);
						}
					}
				}	
							
				let tmp_max = Math.max(...tmp_bins);
				if(tmp_max > max) {
					max = tmp_max;				
				}					
			}
		}
		else {
			for(let gp = 0; gp < GROUPINGS.length; gp++){
				if(DAT_MODE == 1 && gp+1 != selected_grp)
					continue;
				used_by = [];
				for(let i=0; i < BINS_N; i++){ tmp_bins[i] = 0; }

				for(let v=0; v<VALUED.length; v++ ){
					if( DATASETS[VALUED[v]] != undefined && DATASETS[VALUED[v]].included && DATASETS[VALUED[v]].group == gp+1 ){ used_by.push( VALUED[v] ); }
				}
				for(let i=0; i<used_by.length; i++){ 
					if(TWI_MODE == 0) {
						for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
							let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
							if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
							}
						}
					}else if(TWI_MODE == 1 && selected_twigroup != -1){
						for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
							let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
							if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
							}
						}
					}else if(TWI_MODE == 2 && selected_twi != -1 && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ] != undefined && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].included) {
						let twi_id = DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].twi_id;
						if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
							p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[DATASETS[used_by[i]].toi_id], tmp_bins, lense);
						}						
					}				
				}
				if(used_by.length > 0)
					for(let i=0; i < BINS_N; i++){ Math.floor(tmp_bins[i] /= used_by.length); }
				let tmp_max = Math.max(...tmp_bins);
				if(tmp_max > max) {
					max = tmp_max;					
				}
			}
		}

		//render bins
		for(let i=0; i < BINS_N; i++){ bins[i] = 0; }
		used_by = [];
		for(let k=0; k<VALUED.length && VALUED.length < 100; k++){
			let data = DATASETS[VALUED[k]]; 

			if(data == undefined || !data.included)
				continue;
			else if((DAT_MODE == 1 || DAT_MODE == 2) && VALUED[k] != selected_data)
				continue;
			else if((DAT_MODE == 0) && data.group != selected_grp)
				continue;

			if(DAT_MODE == 1 || DAT_MODE == 2)
				for(let i=0; i < BINS_N; i++){ bins[i] = 0; }

			if(DAT_MODE == 0)
				used_by.push(0);
			for(let w=0; w<data.tois.length; w++){
				if(data.tois[w] != undefined && data.tois[w].included) {
					let twi_id = data.tois[w].twi_id;
					if(TWI_MODE == 2 && selected_twi != -1 && data.tois[w] != undefined && data.tois[w].included) {
						if(twi_id == selected_twi && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
							p.aggregate_hist_metrics(data, data.fixs, data.tois[data.toi_id], bins, lense);
							break;
						}						
					}else if(TWI_MODE == 1 && selected_twigroup != -1){
						if(data.tois[w].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							p.aggregate_hist_metrics(data, data.fixs, data.tois[w], bins, lense);
						}						
					}else if(TWI_MODE == 0){
						if(data.tois[w].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							p.aggregate_hist_metrics(data, data.fixs, data.tois[w], bins, lense);
						}
					}
				}
			}			
		}
		if(DAT_MODE == 0) {
			if(used_by.length > 0)
				for(let i=0; i < BINS_N; i++){ Math.floor(bins[i] /= used_by.length); }
		}
		canvas.stroke( white(40) ); canvas.strokeWeight(1); canvas.fill(grey(20));
		for(let i=0; i < bins.length; i++){
			canvas.rect( 0.05*canvas.width + (0.9*canvas.width*i)/(bins.length), 0.85*canvas.height, 0.9*canvas.width/(bins.length), - (0.8*canvas.height*bins[i]/max) );
		}
		canvas.fill( white(100) );
		canvas.textAlign(p.LEFT);
		canvas.textSize(fb.fontSize);
		canvas.text(num_format(min_val, 4), 0.05*canvas.width, 0.9*canvas.height);
		canvas.textAlign(p.RIGHT);
		canvas.text(num_format(max_val, 4), 0.95*canvas.width, 0.9*canvas.height);
		canvas.textAlign(p.LEFT);
		canvas.text(num_format(max, 4), 0.05*canvas.width, 0.85*canvas.height-0.8*canvas.height);
		
		//comparison lines
		if(DAT_MODE == 2) {
			for(let v=0; v<VALUED.length; v++){
				tmp_bins = []; for(let i=0; i < BINS_N; i++){ tmp_bins.push(0); }
				data = DATASETS[VALUED[v]]; 
				if( data == undefined || !data.included)
					continue;
	
				//filter fixations by TWI_MODE
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						p.aggregate_hist_metrics(data, data.fixs, data.tois[data.toi_id], tmp_bins, lense);
					}
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							p.aggregate_hist_metrics(data, data.fixs, data.tois[c], tmp_bins, lense);
						}
					}
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							p.aggregate_hist_metrics(data, data.fixs, data.tois[c], tmp_bins, lense);
						}
					}
				}	
							
				canvas.stroke( cy(100, data.group) ); canvas.strokeWeight(1); canvas.noFill();
				for(let i=0; i < tmp_bins.length-1; i++){
					canvas.line(0.05*canvas.width + (0.9*canvas.width*(i+0.5))/(tmp_bins.length), 0.85*canvas.height - (0.8*canvas.height*tmp_bins[i]/max),
								0.05*canvas.width + (0.9*canvas.width*(i+1.5))/(tmp_bins.length), 0.85*canvas.height - (0.8*canvas.height*tmp_bins[i+1]/max) );
				}
			}
		}
		else if(DAT_MODE == 1){
			for(let gp = 0; gp < GROUPINGS.length; gp++){
				if(DAT_MODE == 1 && gp+1 != selected_grp)
					continue;
				used_by = [];
				for(let v=0; v<VALUED.length; v++ ){
					if( DATASETS[VALUED[v]] != undefined && DATASETS[VALUED[v]].included && DATASETS[VALUED[v]].group == gp+1 ){ used_by.push( VALUED[v] ); }
				}
				for(let i=0; i<used_by.length; i++){ 
					tmp_bins = []; for(let i=0; i < BINS_N; i++){ tmp_bins.push(0); }
				
					if(TWI_MODE == 0) {
						for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
							let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
							if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
							}
						}
					}else if(TWI_MODE == 1 && selected_twigroup != -1){
						for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
							let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
							if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
							}
						}
					}else if(TWI_MODE == 2 && selected_twi != -1 && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ] != undefined && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].included) {
						let twi_id = DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].twi_id;
						if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
							p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[DATASETS[used_by[i]].toi_id], tmp_bins, lense);
						}						
					}				
					canvas.stroke( cy(100, gp+1) ); canvas.strokeWeight(1); canvas.noFill();
					for(let i=0; i < tmp_bins.length-1; i++){
						canvas.line(0.05*canvas.width + (0.9*canvas.width*(i+0.5))/(tmp_bins.length), 0.85*canvas.height - (0.8*canvas.height*tmp_bins[i]/max),
									0.05*canvas.width + (0.9*canvas.width*(i+1.5))/(tmp_bins.length), 0.85*canvas.height - (0.8*canvas.height*tmp_bins[i+1]/max) );
					}
				}
			}
		}
		else {
			for(let gp = 0; gp < GROUPINGS.length; gp++){
				used_by = [];
				tmp_bins = []; for(let i=0; i < BINS_N; i++){ tmp_bins.push(0); }

				for(let v=0; v<VALUED.length; v++ ){
					if( DATASETS[VALUED[v]] != undefined && DATASETS[VALUED[v]].included && DATASETS[VALUED[v]].group == gp+1 ){ used_by.push( VALUED[v] ); }
				}
				for(let i=0; i<used_by.length; i++){ 
					if(TWI_MODE == 0) {
						for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
							let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
							if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
							}
						}
					}else if(TWI_MODE == 1 && selected_twigroup != -1){
						for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
							let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
							if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
								p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
							}
						}
					}else if(TWI_MODE == 2 && selected_twi != -1 && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ] != undefined && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].included) {
						let twi_id = DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].twi_id;
						if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
							p.aggregate_hist_metrics(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[DATASETS[used_by[i]].toi_id], tmp_bins, lense);
						}						
					}								
				}
				if(used_by.length > 0)
					for(let i=0; i < BINS_N; i++){ Math.floor(tmp_bins[i] /= used_by.length); }
				canvas.stroke( cy(100, gp+1) ); canvas.strokeWeight(1); canvas.noFill();
				for(let i=0; i < tmp_bins.length-1; i++){
					canvas.line(0.05*canvas.width + (0.9*canvas.width*(i+0.5))/(tmp_bins.length), 0.85*canvas.height - (0.8*canvas.height*tmp_bins[i]/max),
								0.05*canvas.width + (0.9*canvas.width*(i+1.5))/(tmp_bins.length), 0.85*canvas.height - (0.8*canvas.height*tmp_bins[i+1]/max) );
				}
			}
		}
	};
	
	p.matrix_draw = (canvas) => { // naively draws the values in its setup information
		canvas.background(black(100)); canvas.textFont(fb); canvas.textAlign(p.LEFT);
		if(matrix_values.length == 0){ return; } // nothing to draw here
		valname = "";
	
		// make colourcode labels (red and blue bars)
		if ( MATRIX_VIEW_STATE.indexOf('aoi') == -1 && MATRIX_VIEW_STATE.indexOf('lensegroup') == -1 ){
			canvas.fill( makeColor( 100, MATCOL[2] ) );
			canvas.rect( xmin, ymin, -10, ytot);
			canvas.fill( makeColor( 100, MATCOL[1] ) );
			canvas.rect( xmin, ymin, xtot, -10);
		}
		// find the maximal value in the table
		// sort out the drawing number and coordinates
		trans_max = 0;
		canvas.strokeWeight(1); canvas.stroke(black(100)); canvas.fill(white(100));
		for(let a=0; a<matrix_values.length; a++){
			for(let b=0; b<matrix_values[a].length; b++){
				if(matrix_values[a][b] > trans_max){ trans_max = matrix_values[a][b]; }
			}
		}
		// draw labels
		if( flipped ){
			ynum = matrix_values.length; xnum = matrix_values[0].length;
			xh = Math.floor(xtot/xnum); yh = Math.floor(ytot/ynum);
			canvas.stroke(makeColor(100, SELECTED)); canvas.strokeWeight(1);
			for(let a=0; a<colnames.length; a++){
				
				if(colnames[a].length > 10){valname=colnames[a].substring(0,10);}else{valname=colnames[a];}
				ys = ymin + (a+0.5)*yh + 5; w = canvas.textWidth(valname); h = canvas.textAscent();
				ysn = ymin + a*yh+2;
				canvas.stroke( colcolours[a]); canvas.fill(colcolours[a]);
				canvas.rect( 3, ysn, xmin-10 , yh-4 );
				canvas.stroke(black(100)); canvas.fill(white(100));
				if( a == colspecial ){
					canvas.strokeWeight(2);
					canvas.stroke( makeColor(80, SELECTED)); canvas.fill( makeColor(10, SELECTED));
					canvas.rect( 2, ys+2, w+4, -h-4 );
					canvas.stroke(black(100)); canvas.fill(white(100));
					canvas.strokeWeight(1);
				}
				canvas.strokeWeight(0);
				if( is_sort_initiated_column && colnames[a] == sort_selected_name){canvas.strokeWeight(1);canvas.stroke(contrast_bw(colcolours[a]));}
				canvas.fill(contrast_bw(colcolours[a]));
				canvas.text(valname, 4, ys);
				canvas.stroke(black(100)); canvas.fill(white(100)); canvas.strokeWeight(1);
			}
			for(let a=0; a<rownames.length; a++){
				
				if(rownames[a].length > 10){valname=rownames[a].substring(0,10);}else{valname=rownames[a];}
				xs = xmin + (a+0.5)*xh; w = canvas.textWidth(valname); h = canvas.textAscent();
				xsn = xmin + a*xh+2;
				canvas.stroke( rowcolours[a]); canvas.fill(rowcolours[a]);
				canvas.rect( xsn, 8, xh-4, ymin-18 );
				canvas.stroke(black(100)); canvas.fill(white(100));
				if( a == rowspecial ){
					canvas.strokeWeight(2);
					canvas.stroke( makeColor(80, SELECTED)); canvas.fill( makeColor(10, SELECTED));
					canvas.rect( xs - w/2 -2, 27, w+4, -h-4 );
					canvas.stroke(black(100)); canvas.fill(white(100));
					canvas.strokeWeight(1);
				}
				canvas.strokeWeight(0);
				if( is_sort_initiated_rows && rownames[a] == sort_selected_name){canvas.strokeWeight(1);canvas.stroke(contrast_bw(rowcolours[a]));}
				canvas.fill(contrast_bw(rowcolours[a]));
				canvas.text(valname, xs- w/2, 25);
				canvas.strokeWeight(1);	canvas.stroke(black(100)); canvas.fill(white(100));
			}
			// fill with values
			canvas.textFont(f); canvas.textAlign(p.CENTER, p.CENTER);
			for(let a=0; a<xnum; a++){
				for(let b=0; b<ynum; b++){
					xs = xmin + a*xh; ys = ymin + b*yh;
					val = 100*Math.sqrt( matrix_values[b][a]/trans_max );
					canvas.fill( makeColor( val, MATCOL[0] ) );
					canvas.rect(xs, ys, xh, yh );
					if( MATRIX_WRITE ){
						if(val < 60){ canvas.fill(white(100)); }else{ canvas.fill(black(100)); }
						canvas.strokeWeight(0);
						canvas.text( num_format(matrix_values[b][a], 2), xs + xh/2, ys + yh/2);
						canvas.strokeWeight(1);
					}
				}
			}
		}else{
			xnum = matrix_values.length; ynum = matrix_values[0].length;
			xh = Math.floor(xtot/xnum); yh = Math.floor(ytot/ynum);
			for(let a=0; a<rownames.length; a++){
				
				if(rownames[a].length > 10){valname=rownames[a].substring(0,10);}else{valname=rownames[a];}
				ys = ymin + (a+0.5)*yh + 5; w = canvas.textWidth(valname); h = canvas.textAscent();
				ysn = ymin + a*yh+2;
				canvas.stroke( rowcolours[a]); canvas.fill(rowcolours[a]);
				canvas.rect( 3, ysn, xmin-10 , yh-4 );
				canvas.stroke(black(100)); canvas.fill(white(100));
				if( a == rowspecial ){
					canvas.strokeWeight(2);
					canvas.stroke( makeColor(80, SELECTED)); canvas.fill( makeColor(10, SELECTED));
					canvas.rect( 2, ys+2, w+4, -h-4 );
					canvas.stroke(black(100)); canvas.fill(white(100));
					canvas.strokeWeight(1);
				}
				canvas.strokeWeight(0);
				if( is_sort_initiated_column && rownames[a] == sort_selected_name){canvas.strokeWeight(1);canvas.stroke(contrast_bw(rowcolours[a]));}
				canvas.fill(contrast_bw(rowcolours[a]));
				canvas.text(valname, 4, ys);
				canvas.stroke(black(100)); canvas.fill(white(100)); canvas.strokeWeight(1);
			}
			for(let a=0; a<colnames.length; a++){
				
				if(colnames[a].length > 10){valname=colnames[a].substring(0,10);}else{valname=colnames[a];}
				xs = xmin + (a+0.5)*xh;  w = canvas.textWidth(valname); h = canvas.textAscent();
				xsn = xmin + a*xh+2;
				canvas.stroke( colcolours[a]); canvas.fill(colcolours[a]);
				canvas.rect( xsn, 8, xh-4, ymin-18 );
				canvas.stroke(black(100)); canvas.fill(white(100));
				if( a == colspecial ){
					canvas.strokeWeight(2);
					canvas.stroke( makeColor(80, SELECTED)); canvas.fill( makeColor(10, SELECTED));
					canvas.rect( xs - w/2 -2, 27, w+4, -h-4 );
					canvas.stroke(black(100)); canvas.fill(white(100));
					canvas.strokeWeight(1);
				}
				canvas.strokeWeight(0);
				if( is_sort_initiated_rows && colnames[a] == sort_selected_name){canvas.strokeWeight(1);canvas.stroke(contrast_bw(colcolours[a]));}
				canvas.fill(contrast_bw(colcolours[a]));
				canvas.text(valname, xs - w/2, 22);
				canvas.strokeWeight(1); canvas.stroke(black(100)); canvas.fill(white(100));
			}
			// fill with values
			canvas.textFont(f); canvas.textAlign(p.CENTER, p.CENTER);
			for(let a=0; a<xnum; a++){
				for(let b=0; b<ynum; b++){
					xs = xmin + a*xh; ys = ymin + b*yh;
					val = 100*Math.sqrt( matrix_values[a][b]/trans_max );
					canvas.fill( makeColor( val, MATCOL[0] ) );
					canvas.rect(xs, ys, xh, yh );
					if( MATRIX_WRITE ){
						if(val < 60){ canvas.fill(white(100)); }else{ canvas.fill(black(100)); }
						canvas.strokeWeight(0);
						canvas.text( num_format(matrix_values[a][b], 2), xs + xh/2, ys + yh/2);
						canvas.strokeWeight(1);
					}
				}
			}
		}
		// draw the mini maps, if necessary
		if( MATRIX_MINIMAP && rowdatas.length * coldatas.length > 0){
			for(dI=0;dI<rowdatas.length; dI++){
				for(dJ=0;dJ<coldatas.length;dJ++){
					if(flipped){
						dat_compare(canvas, xmin + xh*dI+10, ymin+yh*dJ+10, xh-20, yh-20, coldatas[dJ], rowdatas[dI]);
					}else{
						dat_compare(canvas, xmin + xh*dJ+10, ymin+yh*dI+10, xh-20, yh-20, coldatas[dJ], rowdatas[dI]);
					}
				}
			}
		}
	};

	p.video_draw = () => {
		p.textFont(fb); p.textAlign(p.LEFT);
		if( selected_data == -1){ 
			if(currentVideoObj != null || currentVideoObj != undefined) {
				currentVideoObj.pause();
				currentVideoObj.hide();
			}				
			document.getElementById("videofilename").innerHTML = "";
			document.getElementById("selecteddataset").innerHTML = "";
			return; 
		}
		
		if(VIDEOS[selected_data].videoobj != null && VIDEOS[selected_data].videoobj != undefined && VIDEOS[selected_data].videoobj.src.length > 0) {
			if(currentVideoObj != null && currentVideoObj != undefined && VIDEOS[selected_data].videoobj.src != currentVideoObj.src) {
				currentVideoObj.pause();
				currentVideoObj.hide();	
				currentVideoObj = VIDEOS[selected_data].videoobj;
				document.getElementById("videofilename").innerHTML = VIDEOS[selected_data].videofilename;				
			}
			else if(currentVideoObj == null || currentVideoObj == undefined)
				currentVideoObj = VIDEOS[selected_data].videoobj;
			currentVideoObj.show();
		}
		else if(VIDEOS[selected_data].videofilename == null || VIDEOS[selected_data].videofilename == undefined || VIDEOS[selected_data].videofilename.length == 0) {
			if(currentVideoObj != null && currentVideoObj != undefined){
				currentVideoObj.pause();
				currentVideoObj.hide();
				document.getElementById("videofilename").innerHTML = "";
				currentVideoObj = null;
			}	
			if(videoinput == null || videoinput == undefined) 
			{
				let data_top_height = Math.floor(p.windowHeight*DATA_TOP_HEIGHT_PERCENTAGE);
				let matrix_wrapper_height = Math.floor(p.windowHeight*MATRIX_WRAPPER_HEIGHT_PERCENTAGE);
				let matrix_center_height = Math.floor(p.windowHeight*MATRIX_CANVAS_HEIGHT_PERCENTAGE);
				videoinput = p.createFileInput(p.load_video);
				videoinput.parent("selectfileinput");
			}						
		}
		else {
			document.getElementById("videofilename").innerHTML = VIDEOS[selected_data].videofilename;
			if(currentVideoObj != null && currentVideoObj != undefined) {
				if(VIDEOS[selected_data].videoobj.src != currentVideoObj.src) {
					currentVideoObj.pause();
					currentVideoObj.hide();	
					currentVideoObj = VIDEOS[selected_data].videoobj;					
				}
			}	
			else {
				currentVideoObj = VIDEOS[selected_data].videoobj;
			}	
			currentVideoObj.show();
		}
		document.getElementById("selecteddataset").innerHTML = DATASETS[selected_data].name;
	};

	p.set_twi_start_time = () => {
		if(selected_data != -1 && VIDEOS[selected_data] != null && VIDEOS[selected_data] != undefined && DATASETS[selected_data] != undefined &&
			DATASETS[selected_data].fixs.length >= 2){
			document.getElementById(selected_data+'_left').value = format_time(VIDEOS[selected_data].videoobj.time());
			update_timeslider(selected_data);		
		}
	};

	p.set_twi_end_time = () => {
		if(selected_data != -1 && VIDEOS[selected_data] != null && VIDEOS[selected_data] != undefined && DATASETS[selected_data] != undefined &&
			DATASETS[selected_data].fixs.length >= 2){
			document.getElementById(selected_data+'_right').value = format_time(VIDEOS[selected_data].videoobj.time());
			update_timeslider(selected_data);			
		}
		
	};

	p.load_video = (file) => {
		videoloaded = true;
		if(currentVideoObj != undefined && currentVideoObj != null )
			currentVideoObj.remove();
		try{
			VIDEOS[selected_data].videoobj = p.createVideo(file.data, () => {});			
		}catch (error) { console.error(error); matrix_redraw=true; }	
	
		currentVideoObj = VIDEOS[selected_data].videoobj;
		document.getElementById("videofilename").innerHTML = file.name;
		VIDEOS[selected_data].videofilename = file.name;
		currentVideoObj.showControls(); 

		//compute position for videoobj
		let data_top_height = Math.floor(p.windowHeight*DATA_TOP_HEIGHT_PERCENTAGE);
		let matrix_wrapper_height = Math.floor(p.windowHeight*MATRIX_WRAPPER_HEIGHT_PERCENTAGE);
		let matrix_center_height = Math.floor(p.windowHeight*MATRIX_CANVAS_HEIGHT_PERCENTAGE);

		currentVideoObj.position(matrix_width*0.2, matrix_height*0.2 + data_top_height + matrix_wrapper_height - matrix_center_height);
		currentVideoObj.size(matrix_width*0.8, matrix_height*0.8);

		if(toi_start_timestamp_button == null) {
			toi_start_timestamp_button = p.createButton('Set TWI Start Time');
			toi_start_timestamp_button.mousePressed(p.set_twi_start_time);
			toi_start_timestamp_button.parent("selectfileinput");
			toi_start_timestamp_button.style("margin-right: 4px");
		}
		if(toi_end_timestamp_button == null) {
			toi_end_timestamp_button = p.createButton('Set TWI End Time');
			toi_end_timestamp_button.mousePressed(p.set_twi_end_time);
			toi_end_timestamp_button.parent("selectfileinput");
		}
	};
};

let delete_video = () => {
	if(mat_type == "video" && selected_data != -1 && VIDEOS[selected_data] != null && VIDEOS[selected_data] != undefined && VIDEOS[selected_data].videoobj != null &&
		VIDEOS[selected_data].videoobj != undefined) {
			let r = confirm("Are you sure?");
			if(r) {
				VIDEOS[selected_data].videoobj.remove();
				VIDEOS[selected_data].videoobj = null;
				VIDEOS[selected_data].videofilename = "";
				document.getElementById("videofilename").innerHTML = "";
				currentVideoObj = null;
			}			
	}
}

let getTimstamp = () => {
	//set toi timestamp

	console.log("current time: "+currentVideoObj.time()+", duration: "+currentVideoObj.duration());
};

let toggleVid = () => {
	if (playing) {
	  currentVideoObj.pause();
	  button.html('play');
	} else {
	  currentVideoObj.loop();
	  button.html('pause');
	}
	playing = !playing;
};     

let load_data = () => {
	colnames = []; rownames = []; matrix_values = []; overlay_string = "%VAL"; flipped = false;
	rowdatas = []; coldatas = []; matrix_colours = []; rowcolours = []; colcolours = [];
	if( ['dat_aoi', 'toi_aoi', 'grp_aoi', 'twigroup_aoi', 'toi_dat', 'twigroup_dat', 'grp_dat', 'grp_toi', 'grp_twigroup', 'dat_lensegroup', 'grp_lensegroup', 'toi_lensegroup', 'twigroup_lensegroup'].indexOf(MATRIX_VIEW_STATE) != -1 ){ flipped = true; }
	
	if(MATRIX_VIEW_STATE == "lensegroup_lensegroup"){
		//check if summary is ticked
		if( DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if( DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions

		let metric_sum = [];
		for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){ 
			rownames.push("AOI G"+LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group); 
			colnames.push("AOI G"+LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group); 
			rowcolours.push(get_lensegroup_col(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group));
			colcolours.push(get_lensegroup_col(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group));
			metric_sum.push(0);
		}
		colspecial = ORDERLENSEGROUPID.indexOf(selected_lensegroup); rowspecial = colspecial;
		// transitions data function
		if( MATRIX_DATA_STATE == "probability_trans1" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
					metric_sum[b] += matrix_values[a][b];
				}
			}
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}	
			overlay_string = "Prob. Direct Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "probability_trans2" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));				
					metric_sum[b] += matrix_values[a][b];
				}
			}
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}	
			overlay_string = "Prob. Indirect Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "probability_glances" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));					
					metric_sum[b] += matrix_values[a][b];
				}
			}
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}	
			overlay_string = "Prob. Glances from %ROW -> %COL -> %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "probability_through" ){
			if( ORDERLENSEGROUPID.indexOf(selected_lensegroup) == -1 ){ return; }
			let lensegroup = ORDERLENSEGROUPID.indexOf(selected_lensegroup);
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, lensegroup));					
					metric_sum[b] += matrix_values[a][b];
				}
			}
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}	
			overlay_string = "Prob. Transitions from %ROW -> "+base_lenses[selected_lensegroup].name+" -> %COL: %VAL";		
		}else if( MATRIX_DATA_STATE == "trans1" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
				}
			}
			overlay_string = "Direct Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "trans2" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));				
				}
			}
			overlay_string = "Indirect Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "glances" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));					
				}
			}
			overlay_string = "Glances from %ROW -> %COL -> %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "through" ){
			if( ORDERLENSEGROUPID.indexOf(selected_lensegroup) == -1 ){ return; }
			let lensegroup = ORDERLENSEGROUPID.indexOf(selected_lensegroup);
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, lensegroup));					
				}
			}
			overlay_string = "Transitions from %ROW -> "+base_lenses[selected_lensegroup].name+" -> %COL: %VAL";
		}
		else if( MATRIX_DATA_STATE == "mean_trans1" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, -1));
				}
			}
			overlay_string = "Mean Direct Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "mean_trans2" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, -1));				
				}
			}
			overlay_string = "Mean Indirect Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "mean_glances" ){
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, -1));					
				}
			}
			overlay_string = "Mean Glances from %ROW -> %COL -> %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "mean_through" ){
			if( ORDERLENSEGROUPID.indexOf(selected_lensegroup) == -1 ){ return; }
			let lensegroup = ORDERLENSEGROUPID.indexOf(selected_lensegroup);
			for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, lensegroup));					
				}
			}
			overlay_string = "Mean Transitions from %ROW -> "+base_lenses[selected_lensegroup].name+" -> %COL: %VAL";
		}
	}
	else if( MATRIX_VIEW_STATE == "aoi_aoi"){
		//check if summary is ticked
		if( DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if( DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions

		// let dat = VALUED.indexOf(selected_data);
		let metric_sum = [];
		for(let a=0; a<lenses.length; a++){ metric_sum.push(0); rownames.push(lenses[a].name); colnames.push(lenses[a].name); colcolours.push(lenses[a].col(95)); rowcolours.push(lenses[a].col(95));}
		colspecial = order_lenses.indexOf(selected_lens); rowspecial = order_lenses.indexOf(selected_lens);
		// transitions data function
		if( MATRIX_DATA_STATE == "probability_trans1" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
					metric_sum[b] += matrix_values[a][b];
				}				
			}
			for(let a=0; a<lenses.length; a++){
				for(let b=0; b<lenses.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}			
			overlay_string = "Prob. Direct Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "probability_trans2" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
					metric_sum[b] += matrix_values[a][b];
				}
			}
			for(let a=0; a<lenses.length; a++){
				for(let b=0; b<lenses.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}
			overlay_string = "Prob. Indirect Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "probability_glances" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
					metric_sum[b] += matrix_values[a][b];
				}
			}
			for(let a=0; a<lenses.length; a++){
				for(let b=0; b<lenses.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}
			overlay_string = "Prob. Glances from %ROW -> %COL -> %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "probability_through" ){
			if( order_lenses.indexOf(selected_lens) == -1 ){ return; }
			lens = order_lenses.indexOf(selected_lens);
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, lens));					
					metric_sum[b] += matrix_values[a][b];
				}
			}
			for(let a=0; a<lenses.length; a++){
				for(let b=0; b<lenses.length; b++){
					if(metric_sum[b] > 0) matrix_values[a][b] = matrix_values[a][b] / metric_sum[b];
					else matrix_values[a][b] = 0;
				}
			}
			overlay_string = "Prob. Transitions from %ROW -> "+base_lenses[selected_lens].name+" -> %COL: %VAL";		
		}else if( MATRIX_DATA_STATE == "trans1" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
				}
			}
			overlay_string = "Direct Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "trans2" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
				}
			}
			overlay_string = "Indirect Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "glances" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, -1));
				}
			}
			overlay_string = "Glances from %ROW -> %COL -> %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "through" ){
			if( order_lenses.indexOf(selected_lens) == -1 ){ return; }
			lens = order_lenses.indexOf(selected_lens);
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi(a, b, lens));					
				}
			}
			overlay_string = "Transitions from %ROW -> "+base_lenses[selected_lens].name+" -> %COL: %VAL";
		}
		else if( MATRIX_DATA_STATE == "mean_trans1" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, -1));
				}
			}
			overlay_string = "Mean Direct Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "mean_trans2" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, -1));
				}
			}
			overlay_string = "Mean Indirect Transitions from %ROW to %COL: %VAL";
		}else if( MATRIX_DATA_STATE == "mean_glances" ){
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, -1));
				}
			}
			overlay_string = "Mean Glances from %ROW -> %COL -> %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "mean_through" ){
			if( order_lenses.indexOf(selected_lens) == -1 ){ return; }
			lens = order_lenses.indexOf(selected_lens);
			for(let a=0; a<lenses.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(aggregate_aoi_metrics_across_dat_twi_mean_values(a, b, lens));					
				}
			}
			overlay_string = "Mean Transitions from %ROW -> "+base_lenses[selected_lens].name+" -> %COL: %VAL";
		}
	}else if( MATRIX_VIEW_STATE == "lensegroup_dat" || MATRIX_VIEW_STATE == "dat_lensegroup" ){
		if( VALUED.length == 0 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){ rownames.push("AOI G"+LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group); rowcolours.push(get_lensegroup_col(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group));}
		for(let a=0; a<VALUED.length; a++){ colnames.push(DATASETS[VALUED[a]].name); colcolours.push(get_dat_col(VALUED[a]));}
		colspecial = VALUED.indexOf(selected_data); rowspecial = ORDERLENSEGROUPID.indexOf(selected_lensegroup);
		
		if(MATRIX_DATA_STATE == "aoiarea") {					
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			for(let c=0; c<lenses.length; c++) {
				let group_num = base_lenses[order_lenses[c]].group;
				let group_index = ORDERLENSEGROUPID.indexOf(group_num);
				if(group_index != -1 && group_index < sum_of_aoi_area.length)
					sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
			}				

			for(let a=0; a<VALUED.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(sum_of_aoi_area[b]);
				}				
			}
		}
		//identical scenario as aoi case 
		else if(MATRIX_DATA_STATE == "haar") {					
			for(let a=0; a<VALUED.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				aggregate_hit_any_aoi_rate_across_twi(DATASETS[VALUED[a]], HAAR);
				let HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}				
			}
		}
		else {
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			if(MATRIX_DATA_STATE.indexOf("density") > -1) {
				for(let c=0; c<lenses.length; c++) {
					let group_num = base_lenses[order_lenses[c]].group;
					let group_index = ORDERLENSEGROUPID.indexOf(group_num);
					if(group_index != -1 && group_index < sum_of_aoi_area.length)
						sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
				}
			}			

			for(let a=0; a<VALUED.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push( aggregate_aoi_metrics_across_twi(DATASETS[VALUED[a]], b, sum_of_aoi_area) );
				}
			}
		}
		
		if(MATRIX_DATA_STATE == "aoiarea") {
			overlay_string = "Area in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "densitytime" ){
			overlay_string = "Fixation density in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "densitycount" ){
			overlay_string = "Fixation density in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "time" ){
			overlay_string = "Fixation time in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "percent" ){
			overlay_string = "Percentage of fixation time in %ROW: %VAL%";
		}else if( MATRIX_DATA_STATE == "count" ){
			overlay_string = "Fixation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "ratio" ){
			overlay_string = "Mean fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			overlay_string = "Mean fixation duration: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			overlay_string = "Mean saccade length: %VAL pixels";		
		}else if( MATRIX_DATA_STATE == "median" ){
			overlay_string = "Median fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "haar" ){
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		}else if( MATRIX_DATA_STATE == "visitcount" ){
			overlay_string = "Visitation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "visitmean" ){
			overlay_string = "Mean visitation duration in %ROW: %VAL ms";
		}
	}else if( MATRIX_VIEW_STATE == "aoi_dat" || MATRIX_VIEW_STATE == "dat_aoi" ){
		if( VALUED.length == 0 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		for(let a=0; a<lenses.length; a++){ rownames.push(lenses[a].name); rowcolours.push(lenses[a].col(95));}
		for(let a=0; a<VALUED.length; a++){ colnames.push(DATASETS[VALUED[a]].name); colcolours.push(get_dat_col(VALUED[a]));}
		colspecial = VALUED.indexOf(selected_data); rowspecial = order_lenses.indexOf(selected_lens);
		// fixation time
		if(MATRIX_DATA_STATE == "aoiarea") {					
			for(let a=0; a<VALUED.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(base_lenses[order_lenses[b]].area);
				}				
			}
		}
		else if(MATRIX_DATA_STATE == "haar") {					
			for(let a=0; a<VALUED.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				aggregate_hit_any_aoi_rate_across_twi(DATASETS[VALUED[a]], HAAR);
				let HAAR_VALUE = parseFloat((HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2)));
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}				
			}
		}
		else {
			for(let a=0; a<VALUED.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push( aggregate_aoi_metrics_across_twi(DATASETS[VALUED[a]], b, null) );
				}
			}
		}
		
		if(MATRIX_DATA_STATE == "aoiarea") {
			overlay_string = "Area in AOI %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "densitytime" ){
			overlay_string = "Fixation density in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "densitycount" ){
			overlay_string = "Fixation density in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "time" ){
			overlay_string = "Fixation time in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "percent" ){
			overlay_string = "Percentage of fixation time in %ROW: %VAL%";
		}else if( MATRIX_DATA_STATE == "count" ){
			overlay_string = "Fixation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "ratio" ){
			overlay_string = "Mean fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			overlay_string = "Mean fixation duration: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			overlay_string = "Mean saccade length: %VAL pixels";
		}else if( MATRIX_DATA_STATE == "median" ){
			overlay_string = "Median fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "haar" ){
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		}else if( MATRIX_DATA_STATE == "visitcount" ){
			overlay_string = "Visitation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "visitmean" ){
			overlay_string = "Mean visitation duration in %ROW: %VAL ms";
		}
	}else if( MATRIX_VIEW_STATE == "lensegroup_toi" || MATRIX_VIEW_STATE == "toi_lensegroup" ){
		if((DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1) || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if( DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions

		for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){ rownames.push("AOI G"+LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group); rowcolours.push(get_lensegroup_col(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group)); }
		for(let a=0; a<order_twis.length; a++){ colnames.push(base_twis[order_twis[a]].name); colcolours.push(get_twi_col(order_twis[a]));}
		colspecial = order_twis.indexOf(selected_twi); rowspecial = ORDERLENSEGROUPID.indexOf(selected_lensegroup);

		if(MATRIX_DATA_STATE == "aoiarea") {					
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			for(let c=0; c<lenses.length; c++) {
				let group_num = base_lenses[order_lenses[c]].group;
				let group_index = ORDERLENSEGROUPID.indexOf(group_num);
				if(group_index != -1 && group_index < sum_of_aoi_area.length)
					sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
			}				

			for(let a=0; a<order_twis.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(sum_of_aoi_area[b]);
				}				
			}
		}
		//identical scenario as aoi case 
		else if(MATRIX_DATA_STATE == "haar") {
			for(let a=0; a<order_twis.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				aggregate_hit_any_aoi_rate_across_dat(order_twis[a], HAAR);
				let HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));

				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}				
			}
		}
		else {
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			if(MATRIX_DATA_STATE.indexOf("density") > -1) {
				for(let c=0; c<lenses.length; c++) {
					let group_num = base_lenses[order_lenses[c]].group;
					let group_index = ORDERLENSEGROUPID.indexOf(group_num);
					if(group_index != -1 && group_index < sum_of_aoi_area.length)
						sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
				}
			}					

			for(let a=0; a<order_twis.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push (aggregate_aoi_metrics_across_dat(order_twis[a], b, sum_of_aoi_area));
				}					
			}
		}
		// fixation time
		if(MATRIX_DATA_STATE == "aoiarea") {
			overlay_string = "Area in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "densitytime" ){
			overlay_string = "Fixation density in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "densitycount" ){
			overlay_string = "Fixation density in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "time" ){
			overlay_string = "Fixation time in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "percent" ){
			overlay_string = "Percentage of fixation time in %ROW: %VAL%";
		}else if( MATRIX_DATA_STATE == "count" ){
			overlay_string = "Fixation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "ratio" ){
			overlay_string = "Mean fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			overlay_string = "Mean fixation duration: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			overlay_string = "Mean saccade length: %VAL pixels";
		}else if( MATRIX_DATA_STATE == "median" ){
			overlay_string = "Median fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "haar" ){
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		}else if( MATRIX_DATA_STATE == "visitcount" ){
			overlay_string = "Visitation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "visitmean" ){
			overlay_string = "Mean visitation duration in %ROW: %VAL ms";
		}
	}else if( MATRIX_VIEW_STATE == "lensegroup_twigroup" || MATRIX_VIEW_STATE == "twigroup_lensegroup" ){
		if((DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1) || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if( DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if(ORDERTWIGROUPIDARRAYINDEX.indexOf(-1) != -1) return;

		for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){ rownames.push("AOI G"+LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group); rowcolours.push(get_lensegroup_col(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group)); }
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ colnames.push("TWI G"+TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group); 
			colcolours.push(get_twigroup_col(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group)); }
		colspecial = ORDERTWIGROUPID.indexOf(selected_twigroup);  rowspecial = ORDERLENSEGROUPID.indexOf(selected_lensegroup);

		if(MATRIX_DATA_STATE == "aoiarea") {					
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			for(let c=0; c<lenses.length; c++) {
				let group_num = base_lenses[order_lenses[c]].group;
				let group_index = ORDERLENSEGROUPID.indexOf(group_num);
				if(group_index != -1 && group_index < sum_of_aoi_area.length)
					sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
			}				

			for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(sum_of_aoi_area[b]);
				}				
			}
		}
		//identical scenario as aoi case 
		else if(MATRIX_DATA_STATE == "haar") {
			for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				let HAAR_VALUE = 0;
				for(let c=0; c<order_twis.length; c++)	{
					let order_twis_group_index = ORDERTWIGROUPID.indexOf(base_twis[order_twis[c]].group);
		
					if(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group == base_twis[order_twis[c]].group &&
							order_twis_group_index != -1 && base_twis[order_twis[c]].included && base_twis[order_twis[c]].checked) {
						aggregate_hit_any_aoi_rate_across_dat(order_twis[c], HAAR);						
					}
				}				
				HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}				
			}
		}
		else {
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			if(MATRIX_DATA_STATE.indexOf("density") > -1) {
				for(let c=0; c<lenses.length; c++) {
					let group_num = base_lenses[order_lenses[c]].group;
					let group_index = ORDERLENSEGROUPID.indexOf(group_num);
					if(group_index != -1 && group_index < sum_of_aoi_area.length)
						sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
				}
			}

			for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);
	
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++) {
					let total_sum = 0;
					let total_number_of_addup = 0;
					for(let c=0; c<order_twis.length; c++)	{
						let order_twis_group_index = ORDERTWIGROUPID.indexOf(base_twis[order_twis[c]].group);
			
						if(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group == base_twis[order_twis[c]].group &&
								order_twis_group_index != -1 && base_twis[order_twis[c]].included && base_twis[order_twis[c]].checked) {
							let tmp_value = aggregate_aoi_metrics_across_dat(order_twis[c], b, sum_of_aoi_area);				
							if(tmp_value > 0) {
								total_sum += tmp_value;
								total_number_of_addup++;
							}
						}
					}
					if((MATRIX_DATA_STATE == "densitytime" || MATRIX_DATA_STATE == "densitycount" || MATRIX_DATA_STATE == "percent" || MATRIX_DATA_STATE == "ratio" || MATRIX_DATA_STATE == "meanfixduration" || MATRIX_DATA_STATE == "meansaccadelength" ||
					 MATRIX_DATA_STATE == "median" || MATRIX_DATA_STATE == "visitmean") && total_number_of_addup > 0) 
						total_sum = total_sum/total_number_of_addup;
					matrix_values[a].push (total_sum);
				}
			}
		}
		// fixation time
		if(MATRIX_DATA_STATE == "aoiarea") {
			overlay_string = "Area in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "densitytime" ){
			overlay_string = "Fixation density in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "densitycount" ){
			overlay_string = "Fixation density in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "time" ){
			overlay_string = "Fixation time in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "percent" ){
			overlay_string = "Percentage of fixation time in %ROW: %VAL%";
		}else if( MATRIX_DATA_STATE == "count" ){
			overlay_string = "Fixation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "ratio" ){
			overlay_string = "Mean fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			overlay_string = "Mean fixation duration: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			overlay_string = "Mean saccade length: %VAL pixels";
		}else if( MATRIX_DATA_STATE == "median" ){
			overlay_string = "Median fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "haar" ){
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		}else if( MATRIX_DATA_STATE == "visitcount" ){
			overlay_string = "Visitation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "visitmean" ){
			overlay_string = "Mean visitation duration in %ROW: %VAL ms";
		}
	}else if( MATRIX_VIEW_STATE == "aoi_toi" || MATRIX_VIEW_STATE == "toi_aoi" ){
		if((DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1) || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if( DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions

		for(let a=0; a<lenses.length; a++){ rownames.push(lenses[a].name); rowcolours.push(lenses[a].col(95));}
		for(let a=0; a<order_twis.length; a++){ colnames.push(base_twis[order_twis[a]].name); colcolours.push(get_twi_col(order_twis[a]));}
		colspecial = order_twis.indexOf(selected_twi); rowspecial = order_lenses.indexOf(selected_lens);

		if(MATRIX_DATA_STATE == "aoiarea") {					
			for(let a=0; a<order_twis.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(base_lenses[order_lenses[b]].area);
				}				
			}
		}
		else if(MATRIX_DATA_STATE == "haar") {					
			for(let a=0; a<order_twis.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				aggregate_hit_any_aoi_rate_across_dat(order_twis[a], HAAR);
				let HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}				
			}
		}
		else {
			// fixation time
			for(let a=0; a<order_twis.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);			
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push (aggregate_aoi_metrics_across_dat(order_twis[a], b, null));
				}		
			}
		}
		
		// fixation time
		if(MATRIX_DATA_STATE == "aoiarea") {
			overlay_string = "Area in AOI %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "densitytime" ){
			overlay_string = "Fixation density in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "densitycount" ){
			overlay_string = "Fixation density in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "time" ){
			overlay_string = "Fixation time in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "percent" ){
			overlay_string = "Percentage of fixation time in %ROW: %VAL%";
		}else if( MATRIX_DATA_STATE == "count" ){
			overlay_string = "Fixation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "ratio" ){
			overlay_string = "Mean fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			overlay_string = "Mean fixation duration: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			overlay_string = "Mean saccade length: %VAL pixels";
		}else if( MATRIX_DATA_STATE == "median" ){
			overlay_string = "Median fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "haar" ){
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		}else if( MATRIX_DATA_STATE == "visitcount" ){
			overlay_string = "Visitation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "visitmean" ){
			overlay_string = "Mean visitation duration in %ROW: %VAL ms";
		}
	}else if( MATRIX_VIEW_STATE == "aoi_twigroup" || MATRIX_VIEW_STATE == "twigroup_aoi" ){
		if((DAT_MODE == 2 && VALUED.indexOf(selected_data) == -1) || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if( DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) == -1 || lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		if(ORDERTWIGROUPIDARRAYINDEX.indexOf(-1) != -1) return;
		for(let a=0; a<lenses.length; a++){ rownames.push(lenses[a].name); rowcolours.push(lenses[a].col(95));}
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ colnames.push("TWI G"+TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group); 
			colcolours.push(get_twigroup_col(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group)); }
		colspecial = ORDERTWIGROUPID.indexOf(selected_twigroup);  rowspecial = order_lenses.indexOf(selected_lens);

		if(MATRIX_DATA_STATE == "haar") {					
			for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				let HAAR_VALUE = 0;
				for(let c=0; c<order_twis.length; c++)	{
					let order_twis_group_index = ORDERTWIGROUPID.indexOf(base_twis[order_twis[c]].group);
		
					if(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group == base_twis[order_twis[c]].group &&
							order_twis_group_index != -1 && base_twis[order_twis[c]].included && base_twis[order_twis[c]].checked) {
						aggregate_hit_any_aoi_rate_across_dat(order_twis[c], HAAR);						
					}
				}
				HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}				
			}
		}
		else {
			for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ 
				matrix_values.push([]); matrix_colours.push([]);			
	
				for(let b=0; b<lenses.length; b++) {
					let total_sum = 0;
					if(MATRIX_DATA_STATE == "aoiarea") {
						total_sum = base_lenses[order_lenses[b]].area;
					}
					else {
						let total_number_of_addup = 0;
						for(let c=0; c<order_twis.length; c++)	{
							let order_twis_group_index = ORDERTWIGROUPID.indexOf(base_twis[order_twis[c]].group);
				
							if(order_twis_group_index != -1 && TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group == base_twis[order_twis[c]].group &&
									 base_twis[order_twis[c]].included && base_twis[order_twis[c]].checked) {
								let tmp_value = aggregate_aoi_metrics_across_dat(order_twis[c], b, null);
								if(tmp_value > 0) {
									total_sum += tmp_value;
									total_number_of_addup++;
								}
							}
						}	
						if((MATRIX_DATA_STATE == "densitytime" || MATRIX_DATA_STATE == "densitycount" || MATRIX_DATA_STATE == "percent" || MATRIX_DATA_STATE == "ratio" || MATRIX_DATA_STATE == "meanfixduration" || MATRIX_DATA_STATE == "meansaccadelength" || 
							MATRIX_DATA_STATE == "median" || MATRIX_DATA_STATE == "visitmean") && total_number_of_addup > 0) 
							total_sum = total_sum/total_number_of_addup;
					}				
					matrix_values[a].push (total_sum);
				}
			}
		}
		// fixation time
		if(MATRIX_DATA_STATE == "aoiarea") {
			overlay_string = "Area in AOI %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "densitytime" ){
			overlay_string = "Fixation density in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "densitycount" ){
			overlay_string = "Fixation density in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "time" ){
			overlay_string = "Fixation time in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "percent" ){
			overlay_string = "Percentage of fixation time in %ROW: %VAL%";
		}else if( MATRIX_DATA_STATE == "count" ){
			overlay_string = "Fixation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "ratio" ){
			overlay_string = "Mean fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			overlay_string = "Mean fixation duration: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			overlay_string = "Mean saccade length: %VAL pixels";
		}else if( MATRIX_DATA_STATE == "median" ){
			overlay_string = "Median fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "haar" ){
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		}else if( MATRIX_DATA_STATE == "visitcount" ){
			overlay_string = "Visitation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "visitmean" ){
			overlay_string = "Mean visitation duration in %ROW: %VAL ms";
		}
	}else if( MATRIX_VIEW_STATE == "lensegroup_grp" || MATRIX_VIEW_STATE == "grp_lensegroup" ){
		if( lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		for(let a=0; a<ORDERLENSEGROUPIDARRAYINDEX.length; a++){ rownames.push("AOI G"+LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group); rowcolours.push(get_lensegroup_col(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[a]].group));}
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){ colnames.push("Sample G"+GROUPS[ORDERGROUPIDARRAYINDEX[a]].group+''); colcolours.push(get_grp_col(GROUPS[ORDERGROUPIDARRAYINDEX[a]].group));}
		colspecial = ORDERGROUPID.indexOf(selected_grp); rowspecial = ORDERLENSEGROUPID.indexOf(selected_lensegroup);

		if(MATRIX_DATA_STATE == "aoiarea") {					
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			for(let c=0; c<lenses.length; c++) {
				let group_num = base_lenses[order_lenses[c]].group;
				let group_index = ORDERLENSEGROUPID.indexOf(group_num);
				if(group_index != -1 && group_index < sum_of_aoi_area.length)
					sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
			}				

			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(sum_of_aoi_area[b]);
				}				
			}
			overlay_string = "Area in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "haar" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				aggregate_hit_any_aoi_rate_across_twi(DATASETS[VALUED[a]], HAAR);
				let HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));
				for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}	
			}			
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		}else {
			//Since GROUPS data is already filtered by TWI_MODE (see compute_groupings), we need not call aggregate_aoi_metrics_across_twi
			let sum_of_aoi_area = [];
			for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++)
				sum_of_aoi_area.push(0);

			if(MATRIX_DATA_STATE.indexOf("density") > -1) {
				for(let c=0; c<lenses.length; c++) {
					let group_num = base_lenses[order_lenses[c]].group;
					let group_index = ORDERLENSEGROUPID.indexOf(group_num);
					if(group_index != -1 && group_index < sum_of_aoi_area.length)
						sum_of_aoi_area[group_index] += base_lenses[order_lenses[c]].area;
				}
			}
			
			// fixation time
			if(MATRIX_DATA_STATE == "densitytime") {
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						if(sum_of_aoi_area[b] > 0)
							matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenstime[b] / sum_of_aoi_area[b]);
						else
							matrix_values[a].push(0);
					}
				}
				overlay_string = "Fixation density in %ROW: %VAL ms";
			}else if(MATRIX_DATA_STATE == "densitycount") {
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						if(sum_of_aoi_area[b] > 0)
							matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenscount[b] / sum_of_aoi_area[b]);
						else
							matrix_values[a].push(0);
					}
				}
				overlay_string = "Fixation density in %ROW: %VAL";
			}
			else if( MATRIX_DATA_STATE == "time" ){
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenstime[b] );
					}
				}
				overlay_string = "Fixation time in %ROW: %VAL ms";
			}else if( MATRIX_DATA_STATE == "percent" ){
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].totaltime > 0)
							matrix_values[a].push( 100 * GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenstime[b] / GROUPS[ORDERGROUPIDARRAYINDEX[a]].totaltime );
						else
							matrix_values[a].push(0);
					}
				}
				overlay_string = "Percentage of fixation time in %ROW: %VAL%";
			}else if( MATRIX_DATA_STATE == "count" ){
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenscount[b] );
					}
				}
				overlay_string = "Fixation count in %ROW: %VAL";
			}else if( MATRIX_DATA_STATE == "ratio" ){
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						if ( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenscount[b] > 0 ){
							matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenstime[b] / GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenscount[b] );
						}else{ matrix_values[a].push( 0 ); }
					}
				}
				overlay_string = "Mean fixation duration in %ROW: %VAL ms";
			}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					let mean_fix_duration = 0; 
					if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].totalcount > 0)
						mean_fix_duration = GROUPS[ORDERGROUPIDARRAYINDEX[a]].totaltime / GROUPS[ORDERGROUPIDARRAYINDEX[a]].totalcount;
						
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						matrix_values[a].push( mean_fix_duration );						
					}
				}
				overlay_string = "Mean fixation duration: %VAL ms";
			}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					let mean_saccade_length = 0; 
					if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].number_saccades > 0)
						mean_saccade_length = GROUPS[ORDERGROUPIDARRAYINDEX[a]].total_saccadelength / GROUPS[ORDERGROUPIDARRAYINDEX[a]].number_saccades;
						
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						matrix_values[a].push( mean_saccade_length );						
					}
				}		
				overlay_string = "Mean saccade length: %VAL pixels";
			}else if( MATRIX_DATA_STATE == "median" ){
				for(let a=0; a<GROUPS.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						if ( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lenscount[b] > 0 ){
							matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_lensmedian[b] );
						}else{ matrix_values[a].push( 0 ); }
					}
				}
				overlay_string = "Median fixation duration in %ROW: %VAL ms";
			}else if( MATRIX_DATA_STATE == "visitcount" ){
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_visit_durations[b].length );
					}
				}
				overlay_string = "Visitation count in %ROW: %VAL";
			}else if( MATRIX_DATA_STATE == "visitmean" ){
				for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
					matrix_values.push([]); matrix_colours.push([]);
					for(let b=0; b<ORDERLENSEGROUPIDARRAYINDEX.length; b++){
						if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_visit_durations[b].length > 0)
							matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_visit_totals[b]/GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensegroup_visit_durations[b].length );
						else
							matrix_values[a].push(0);
					}
				}
				overlay_string = "Mean visitation duration in %ROW: %VAL ms";
			}
		}
		
	}else if( MATRIX_VIEW_STATE == "aoi_grp" || MATRIX_VIEW_STATE == "grp_aoi" ){
		if( lenses.length == 0 ){ return; } // metric is meaningless without these conditions
		
		for(let a=0; a<lenses.length; a++){ rownames.push(lenses[a].name); rowcolours.push(lenses[a].col(95));}
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
			//to handle case when group hasn't been initialised
			if(ORDERGROUPIDARRAYINDEX[a] < 0)
				return; 
			colnames.push("Sample G"+GROUPS[ORDERGROUPIDARRAYINDEX[a]].group+''); 
			colcolours.push(get_grp_col(GROUPS[ORDERGROUPIDARRAYINDEX[a]].group));
		}
		colspecial = ORDERGROUPID.indexOf(selected_grp); rowspecial = order_lenses.indexOf(selected_lens);
		//Since GROUPS data is already filtered by TWI_MODE (see compute_groupings), we need not call aggregate_aoi_metrics_across_twi
		// fixation time
		if(MATRIX_DATA_STATE == "aoiarea") {
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push( base_lenses[order_lenses[b]].area );
				}
			}
			overlay_string = "Area in AOI %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "haar" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				let HAAR = {"hit": 0, "off": 0, "haar": 0};
				aggregate_hit_any_aoi_rate_across_twi(DATASETS[VALUED[a]], HAAR);
				let HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push(100 * HAAR_VALUE);
				}	
			}
			overlay_string = "Hit any AOI rate in %COL: %VAL%";
		
		}else if(MATRIX_DATA_STATE == "densitytime") {
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					if(base_lenses[order_lenses[b]].area > 0)
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenstime[b] / base_lenses[order_lenses[b]].area);
					else
						matrix_values[a].push(0);
				}
			}
			overlay_string = "Fixation density in %ROW: %VAL ms";
		}else if(MATRIX_DATA_STATE == "densitycount") {
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					if(base_lenses[order_lenses[b]].area > 0)
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenscount[b] / base_lenses[order_lenses[b]].area);
					else
						matrix_values[a].push(0);
				}
			}
			overlay_string = "Fixation density in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "time" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenstime[b] );
				}
			}
			overlay_string = "Fixation time in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "percent" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].totaltime > 0)
						matrix_values[a].push( 100 * GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenstime[b] / GROUPS[ORDERGROUPIDARRAYINDEX[a]].totaltime );
					else
						matrix_values[a].push(0);
				}
			}
			overlay_string = "Percentage of fixation time in %ROW: %VAL%";
		}else if( MATRIX_DATA_STATE == "count" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenscount[b] );
				}
			}
			overlay_string = "Fixation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "ratio" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					if ( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenscount[b] > 0 ){
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenstime[b] / GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenscount[b] );
					}else{ matrix_values[a].push( 0 ); }
				}
			}
			overlay_string = "Mean fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				let mean_fix_duration = 0; 
				if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].totalcount > 0)
					mean_fix_duration = GROUPS[ORDERGROUPIDARRAYINDEX[a]].totaltime / GROUPS[ORDERGROUPIDARRAYINDEX[a]].totalcount;

				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push( mean_fix_duration );					
				}
			}
			overlay_string = "Mean fixation duration: %VAL ms";
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				let mean_saccade_length = 0; 
				if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].number_saccades > 0)
					mean_saccade_length = GROUPS[ORDERGROUPIDARRAYINDEX[a]].total_saccadelength / GROUPS[ORDERGROUPIDARRAYINDEX[a]].number_saccades;

				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push( mean_saccade_length );					
				}
			}
			overlay_string = "Mean saccade length: %VAL pixels";
		}else if( MATRIX_DATA_STATE == "median" ){
			for(let a=0; a<GROUPS.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					if ( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lenscount[b] > 0 && GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensmedian != undefined){
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].lensmedian[b] );
					}else{ matrix_values[a].push( 0 ); }
				}
			}
			overlay_string = "Median fixation duration in %ROW: %VAL ms";
		}else if( MATRIX_DATA_STATE == "visitcount" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].visit_durations[b].length );
				}
			}
			overlay_string = "Visitation count in %ROW: %VAL";
		}else if( MATRIX_DATA_STATE == "visitmean" ){
			for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
				matrix_values.push([]); matrix_colours.push([]);
				for(let b=0; b<lenses.length; b++){
					if(GROUPS[ORDERGROUPIDARRAYINDEX[a]].visit_durations[b].length > 0)
						matrix_values[a].push( GROUPS[ORDERGROUPIDARRAYINDEX[a]].visit_totals[b]/GROUPS[ORDERGROUPIDARRAYINDEX[a]].visit_durations[b].length );
					else
						matrix_values[a].push(0);
				}
			}
			overlay_string = "Mean visitation duration in %ROW: %VAL ms";
		}
	}else if( MATRIX_VIEW_STATE == "toi_dat" || MATRIX_VIEW_STATE == "dat_toi" ){ 
		for(let a=0; a<order_twis.length; a++){ colnames.push(base_twis[order_twis[a]].name); colcolours.push(get_twi_col(order_twis[a]));}
		for(let a=0; a<VALUED.length; a++){ rownames.push(DATASETS[VALUED[a]].name); rowcolours.push(get_dat_col(VALUED[a]));}

		colspecial = order_twis.indexOf(selected_twi); rowspecial = VALUED.indexOf(selected_data);

		//fetch objects with similarity metrics from the table
		for(let a=0; a<order_twis.length; a++){ coldatas.push( TWI_DATA_BY_DAT_MODE[a] ); }
		for(let a=0; a<VALUED.length; a++){ rowdatas.push( DAT_DATA_BY_TWI_MODE[a] ); }
		// fetch value from the table
		for(let a=0; a<order_twis.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<VALUED.length; b++){
				matrix_values[a].push( DAT_TOI_COMPARE[a][b] );
			}
		}
	}else if( MATRIX_VIEW_STATE == "twigroup_dat" || MATRIX_VIEW_STATE == "dat_twigroup" ){ 
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ colnames.push("TWI G"+TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group); colcolours.push(get_twigroup_col(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group));}
		for(let a=0; a<VALUED.length; a++){ rownames.push(DATASETS[VALUED[a]].name); rowcolours.push(get_dat_col(VALUED[a]));}

		colspecial = ORDERTWIGROUPID.indexOf(selected_twigroup); rowspecial = VALUED.indexOf(selected_data);

		//fetch objects with similarity metrics from the table
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ coldatas.push( TWIGROUP_DATA_BY_DAT_MODE[a] ); }
		for(let a=0; a<VALUED.length; a++){ rowdatas.push( DAT_DATA_BY_TWI_MODE[a] ); }
		// fetch value from the table
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<VALUED.length; b++){
				matrix_values[a].push( DAT_TWIGROUP_COMPARE[a][b] );
			}
		}
	}else if( MATRIX_VIEW_STATE == "twigroup_twigroup" ){
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ rownames.push("TWI G"+TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group); colnames.push("TWI G"+TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group); 
			colcolours.push(get_twigroup_col(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group)); rowcolours.push(get_twigroup_col(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group));}
		
		colspecial = ORDERTWIGROUPID.indexOf(selected_twigroup); rowspecial = colspecial;
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ 
			coldatas.push( TWIGROUP_DATA_BY_DAT_MODE[a] ); 
			rowdatas.push( TWIGROUP_DATA_BY_DAT_MODE[a] ); 				
		}
		// fetch the comparison data table
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<ORDERTWIGROUPIDARRAYINDEX.length; b++){
				matrix_values[a].push( TWI_GROUP_COMPARE[a][b] );
			}
		}			
	}else if( MATRIX_VIEW_STATE == "toi_toi" ){
		colspecial = order_twis.indexOf(selected_twi); rowspecial = colspecial;

		for(let a=0; a<order_twis.length; a++){ rownames.push(base_twis[order_twis[a]].name); colnames.push(base_twis[order_twis[a]].name); colcolours.push(get_twi_col(order_twis[a])); rowcolours.push(get_twi_col(order_twis[a]));}			
		for(let a=0; a<order_twis.length; a++){ 				
			coldatas.push( TWI_DATA_BY_DAT_MODE[a] ); 
			rowdatas.push( TWI_DATA_BY_DAT_MODE[a] ); 								
		}
		
		// fetch the comparison data table
		for(let a=0; a<order_twis.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<order_twis.length; b++){
				matrix_values[a].push( TOI_COMPARE[a][b] );
			}
		}
	}else if( MATRIX_VIEW_STATE == "dat_dat" ){
		if( VALUED.length == 0 ){ return; } // metric is meaningless without these conditions
		for(let a=0; a<VALUED.length; a++){ rownames.push(DATASETS[VALUED[a]].name); colnames.push(DATASETS[VALUED[a]].name); rowcolours.push(get_dat_col(VALUED[a])); colcolours.push(get_dat_col(VALUED[a]));}
		for(let a=0; a<VALUED.length; a++){ coldatas.push( DAT_DATA_BY_TWI_MODE[a] ); rowdatas.push( DAT_DATA_BY_TWI_MODE[a] ); }
		colspecial = VALUED.indexOf(selected_data); rowspecial = VALUED.indexOf(selected_data);
		// fetch the comparison data table
		for(let a=0; a<VALUED.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<VALUED.length; b++){
				matrix_values[a].push( DAT_COMPARE[a][b] );
			}
		}
	}else if( MATRIX_VIEW_STATE == 'grp_dat' || MATRIX_VIEW_STATE == 'dat_grp' ){
		if(ORDERGROUPIDARRAYINDEX.indexOf(-1) != -1) return;
		for(let a=0; a<VALUED.length; a++){ rownames.push(DATASETS[VALUED[a]].name); rowdatas.push(DAT_DATA_BY_TWI_MODE[a]); rowcolours.push(get_dat_col(VALUED[a]));}
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){ colnames.push("Sample G"+GROUPS[ORDERGROUPIDARRAYINDEX[a]].group+''); coldatas.push(GROUPS[ORDERGROUPIDARRAYINDEX[a]]); colcolours.push(get_grp_col(GROUPS[ORDERGROUPIDARRAYINDEX[a]].group));}
		colspecial = ORDERGROUPID.indexOf(selected_grp); rowspecial = VALUED.indexOf(selected_data);
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<VALUED.length; b++){
				matrix_values[a].push( grp_dat[ORDERGROUPIDARRAYINDEX[a]][b] );
			}
		}
	}else if( MATRIX_VIEW_STATE == 'grp_toi' || MATRIX_VIEW_STATE == 'toi_grp' ){
		for(let a=0; a<order_twis.length; a++){ rownames.push(base_twis[order_twis[a]].name); rowcolours.push(get_twi_col(order_twis[a])); rowdatas.push( TWI_DATA_BY_DAT_MODE[a] );}
		colspecial = ORDERGROUPID.indexOf(selected_grp); rowspecial = order_twis.indexOf(selected_twi);
		for(let a=0; a<GROUPS.length; a++){ colnames.push(GROUPS[a].group+''); coldatas.push(GROUPS[a]); colcolours.push(get_grp_col(GROUPS[a].group));}
		for(let a=0; a<GROUPS.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<order_twis.length; b++){
				matrix_values[a].push( grp_toi[a][b] );
			}
		}
	}else if( MATRIX_VIEW_STATE == 'grp_twigroup' || MATRIX_VIEW_STATE == 'twigroup_grp' ){
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ rownames.push("TWI G"+TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group); 
			rowcolours.push(get_twigroup_col(TWIGROUPS[ORDERTWIGROUPIDARRAYINDEX[a]].group)); 
			rowdatas.push( TWIGROUP_DATA_BY_DAT_MODE[a] );
		}
		colspecial = ORDERGROUPID.indexOf(selected_grp); rowspecial = ORDERTWIGROUPID.indexOf(selected_twigroup);
		for(let a=0; a<GROUPS.length; a++){ colnames.push(GROUPS[a].group+''); coldatas.push(GROUPS[a]); colcolours.push(get_grp_col(GROUPS[a].group));}
		for(let a=0; a<GROUPS.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<ORDERTWIGROUPIDARRAYINDEX.length; b++){
				matrix_values[a].push( grp_twigroup[a][b] );
			}
		}
	}else if( MATRIX_VIEW_STATE == 'grp_grp' ){
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){ rownames.push("Sample G"+GROUPS[ORDERGROUPIDARRAYINDEX[a]].group+''); rowdatas.push(GROUPS[ORDERGROUPIDARRAYINDEX[a]]); rowcolours.push(get_grp_col(GROUPS[ORDERGROUPIDARRAYINDEX[a]].group));}
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){ colnames.push("Sample G"+GROUPS[ORDERGROUPIDARRAYINDEX[a]].group+''); coldatas.push(GROUPS[ORDERGROUPIDARRAYINDEX[a]]); colcolours.push(get_grp_col(GROUPS[ORDERGROUPIDARRAYINDEX[a]].group));}
		colspecial = ORDERGROUPID.indexOf(selected_grp); rowspecial = colspecial;
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){
			matrix_values.push([]); matrix_colours.push([]);
			for(let b=0; b<ORDERGROUPIDARRAYINDEX.length; b++){
				matrix_values[a].push( grp_grp[ORDERGROUPIDARRAYINDEX[a]][ORDERGROUPIDARRAYINDEX[b]] );
			}
		}
	}
	if( MATRIX_DATA_STATE == "aoi_sequencescore" ){ overlay_string = "AOI Sequence Score %ROW|%COL: %VAL"; }
	if( MATRIX_DATA_STATE == "lensegroup_sequencescore" ){ overlay_string = "AOI Group Sequence Score %ROW|%COL: %VAL"; }	
	if( MATRIX_DATA_STATE == "aoi_cosine" || MATRIX_DATA_STATE == "grid_cosine" ){ overlay_string = "Cosine of Transitions %ROW|%COL: %VAL"; }
	if( MATRIX_DATA_STATE == "grid_density" ){ overlay_string = "Overlap of density over cells, %ROW|%COL: %VAL"; }
	if( MATRIX_DATA_STATE == "aoi_density" ){ overlay_string = "Overlap of density over AOIs, %ROW|%COL: %VAL"; }
	if( MATRIX_DATA_STATE == "cont_density" ){ overlay_string = "Overlap of density Distrubution, %ROW|%COL: %VAL"; }
};

let get_aoi_fixation_metric_by_name = (toi, lens, sum_of_aoi_area ) => {
	if(MATRIX_VIEW_STATE.indexOf("lensegroup") > -1){
		if(MATRIX_DATA_STATE == "densitytime") {
			if(sum_of_aoi_area != null && sum_of_aoi_area != undefined && sum_of_aoi_area[lens] > 0)
				return toi.lensegroup_lenstime[lens] / sum_of_aoi_area[lens];
			else
				return 0;
		}else if(MATRIX_DATA_STATE == "densitycount") {
			if(sum_of_aoi_area != null && sum_of_aoi_area != undefined && sum_of_aoi_area[lens] > 0)
				return toi.lensegroup_lenscount[lens] / sum_of_aoi_area[lens];
			else
				return 0;
		}else if(MATRIX_DATA_STATE == "time")
			return toi.lensegroup_lenstime[lens];
		else if(MATRIX_DATA_STATE == "percent") {
			if(toi.totaltime > 0)
				return 100* toi.lensegroup_lenstime[lens] / toi.totaltime;
		}			
		else if(MATRIX_DATA_STATE == "count")
			return toi.lensegroup_lenscount[lens];
		else if(MATRIX_DATA_STATE == "ratio") {
			if ( toi.lensegroup_lenscount[lens] > 0 )
				return toi.lensegroup_lenstime[lens] / toi.lensegroup_lenscount[lens] ;			
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			if ( toi.totalcount > 0 )
				return toi.totaltime / toi.totalcount ;				
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			if(toi.number_saccades > 0)			
				return toi.total_saccadelength / toi.number_saccades;	
		}else if(MATRIX_DATA_STATE == "median") {
			if ( toi.lensegroup_lenscount[lens] > 0 )
				return toi.lensegroup_lensmedian[lens];	
		}			
		else if(MATRIX_DATA_STATE == "visitcount")
			return toi.lensegroup_visit_durations[lens].length;	
		else if(MATRIX_DATA_STATE == "visitmean") {
			if(toi.lensegroup_visit_durations[lens].length > 0)
				return toi.lensegroup_visit_totals[lens]/toi.lensegroup_visit_durations[lens].length;
		}	
	}else if(MATRIX_VIEW_STATE.indexOf("aoi") > -1){
		if(MATRIX_DATA_STATE == "densitytime") {
			if(base_lenses[order_lenses[lens]].area > 0)
				return toi.lenstime[lens] / base_lenses[order_lenses[lens]].area;
			else 
				return 0;		
		}
		else if(MATRIX_DATA_STATE == "densitycount") {
			if(base_lenses[order_lenses[lens]].area > 0)
				return toi.lenscount[lens] / base_lenses[order_lenses[lens]].area;
			else 
				return 0;		
		}else if(MATRIX_DATA_STATE == "time")
			return toi.lenstime[lens];
		else if(MATRIX_DATA_STATE == "percent") {
			if(toi.totaltime > 0)
				return 100* toi.lenstime[lens] / toi.totaltime;
		}			
		else if(MATRIX_DATA_STATE == "count")
			return toi.lenscount[lens];
		else if(MATRIX_DATA_STATE == "ratio") {
			if ( toi.lenscount[lens] > 0 )
				return toi.lenstime[lens] / toi.lenscount[lens] ;	
		}else if( MATRIX_DATA_STATE == "meanfixduration" ) {
			if ( toi.totalcount > 0 )
				return toi.totaltime / toi.totalcount ;				
		}else if( MATRIX_DATA_STATE == "meansaccadelength" ) {
			if(toi.number_saccades > 0)			
				return toi.total_saccadelength / toi.number_saccades;	
		}		
		else if(MATRIX_DATA_STATE == "median") {
			if ( toi.lenscount[lens] > 0 )
				return toi.lensmedian[lens];	
		}			
		else if(MATRIX_DATA_STATE == "visitcount")
			return toi.visit_durations[lens].length;	
		else if(MATRIX_DATA_STATE == "visitmean") {
			if(toi.visit_durations[lens].length > 0)
				return toi.visit_totals[lens]/toi.visit_durations[lens].length;
		}			
	}
	return 0;
}
let aggregate_aoi_metrics_across_dat = (twi_id, lens, sum_of_aoi_area) => {
	let total_sum = 0;
	let total_number_of_addup = 0;
	if(DAT_MODE == 2 && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined) {
		let data = DATASETS[selected_data];
		//search for toi_id that matches twi_id
		for(let c=0; c < data.tois.length; c++) {
			if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
				return get_aoi_fixation_metric_by_name(data.tois[ c ], lens, sum_of_aoi_area);
			}
		}
	}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){

		for(let val=0; val<VALUED.length; val++){
			if(DATASETS[VALUED[val]].group == selected_grp){
				let data = DATASETS[ VALUED[val] ];	
				//search for toi_id that matches twi_id
				for(let c=0; c < data.tois.length; c++) {
					if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						let tmp_value = get_aoi_fixation_metric_by_name(data.tois[ c ], lens, sum_of_aoi_area);
						if(tmp_value > 0 && MATRIX_DATA_STATE != "percent") {
							total_sum += tmp_value;
							total_number_of_addup++;
						}
						else if(MATRIX_DATA_STATE == "percent"){
							total_sum += tmp_value;
							total_number_of_addup++;
						}
					}
				}
			}						
		}		
	}else if(DAT_MODE == 0){
		for(let val=0; val<VALUED.length; val++){
			let data = DATASETS[ VALUED[val] ];	

			for(let c=0; c < data.tois.length; c++) {
				if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					let tmp_value = get_aoi_fixation_metric_by_name(data.tois[ c ], lens, sum_of_aoi_area);
					if(tmp_value > 0 && MATRIX_DATA_STATE != "percent") {
						total_sum += tmp_value;
						total_number_of_addup++;
					}
					else if(MATRIX_DATA_STATE == "percent"){
						total_sum += tmp_value;
						total_number_of_addup++;
					}
				}
			}
		}
	}
	if((MATRIX_DATA_STATE == "densitytime" || MATRIX_DATA_STATE == "densitycount" || MATRIX_DATA_STATE == "percent" || MATRIX_DATA_STATE == "ratio" || MATRIX_DATA_STATE == "meanfixduration" || MATRIX_DATA_STATE == "meansaccadelength" || 
		MATRIX_DATA_STATE == "median" || MATRIX_DATA_STATE == "visitmean") && total_number_of_addup > 0) 
		return total_sum/total_number_of_addup;
	return total_sum;
}
let aggregate_hit_any_aoi_rate_across_dat = (twi_id, HAAR) => {
	//calculate aggregated HAAR	
	if(DAT_MODE == 2 && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined) {
		let data = DATASETS[selected_data];
		let group = data.group;
		let fixs = data.fixs; 
		//search for toi_id that matches twi_id
		for(let c=0; c < data.tois.length; c++) {
			if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
				compute_hit_any_aoi_rate_by_twi(HAAR, data, group, data.tois[c], fixs);
			}
		}
	}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){

		for(let val=0; val<VALUED.length; val++){
			if(DATASETS[VALUED[val]].group == selected_grp){
				let data = DATASETS[ VALUED[val] ];	
				//search for toi_id that matches twi_id
				for(let c=0; c < data.tois.length; c++) {
					if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						compute_hit_any_aoi_rate_by_twi(HAAR, data, group, data.tois[c], fixs);
					}
				}
			}						
		}		
	}else if(DAT_MODE == 0){
		for(let val=0; val<VALUED.length; val++){
			let data = DATASETS[ VALUED[val] ];	

			for(let c=0; c < data.tois.length; c++) {
				if(data.tois[c].included && twi_id == data.tois[c].twi_id && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					compute_hit_any_aoi_rate_by_twi(HAAR, data, group, data.tois[c], fixs);
				}
			}
		}
	}
}
let aggregate_hit_any_aoi_rate_across_twi = (data, HAAR) => {
	//calculate aggregated HAAR	

	//filter by twi_mode		
	let fixs = data.fixs; 
	let group = data.group;

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
let aggregate_aoi_metrics_across_twi = (data, lens, sum_of_aoi_area) => {
	let total_sum = 0;
	let total_number_of_addup = 0;

	if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
		let twi_id = data.tois[data.toi_id].twi_id;
		if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
			//matrix_values[a].push( FULL_TRANSITIONS[dat][ DATASETS[selected_data].toi_id ][a][b] );
			return get_aoi_fixation_metric_by_name(data.tois[ data.toi_id ], lens, sum_of_aoi_area);
	}else if(TWI_MODE == 1 && selected_twigroup != -1){		
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
				let tmp_value = get_aoi_fixation_metric_by_name(data.tois[ c ], lens, sum_of_aoi_area);				
				if(tmp_value > 0 && MATRIX_DATA_STATE != "percent") {
					total_sum += tmp_value;
					total_number_of_addup++;
				}
				else if(MATRIX_DATA_STATE == "percent"){
					total_sum += tmp_value;
					total_number_of_addup++;
				}			
			}				
		}		
	}else if(TWI_MODE == 0){
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
				let tmp_value = get_aoi_fixation_metric_by_name(data.tois[ c ], lens, sum_of_aoi_area);
				if(tmp_value > 0 && MATRIX_DATA_STATE != "percent") {
					total_sum += tmp_value;
					total_number_of_addup++;
				}
				else if(MATRIX_DATA_STATE == "percent"){
					total_sum += tmp_value;
					total_number_of_addup++;
				}
			}
		}
	}
	
	if((MATRIX_DATA_STATE == "densitytime" || MATRIX_DATA_STATE == "densitycount" || MATRIX_DATA_STATE == "percent" || MATRIX_DATA_STATE == "ratio" || MATRIX_DATA_STATE == "meanfixduration" || MATRIX_DATA_STATE == "meansaccadelength" || 
		MATRIX_DATA_STATE == "median" || MATRIX_DATA_STATE == "visitmean") && total_number_of_addup > 0) 
		return total_sum/total_number_of_addup;
	return total_sum;
}
let get_aoi_transition_metric_by_name = (toi, a, b, lens ) => {
	if(MATRIX_VIEW_STATE == "lensegroup_lensegroup"){
		if(MATRIX_DATA_STATE.indexOf("trans1") > -1) {
			if(toi.lensegroup_direct_transitions == undefined)
				return 0;
			return toi.lensegroup_direct_transitions[b][a];
		}			
		else if(MATRIX_DATA_STATE.indexOf("trans2") > -1) {
			if(toi.lensegroup_indirect_transitions == undefined)
				return 0;
			return toi.lensegroup_indirect_transitions[b][a];
		}
		else if(MATRIX_DATA_STATE.indexOf("glances") > -1){
			if(toi.lensegroup_triples == undefined)
				return 0;
			return toi.lensegroup_triples[b][a][b];
		}			
		else if(MATRIX_DATA_STATE.indexOf("through") > -1){
			if(toi.lensegroup_triples == undefined)
				return 0;
			return toi.lensegroup_triples[b][lens][a];
		}			
	}else if(MATRIX_VIEW_STATE == "aoi_aoi"){
		if(MATRIX_DATA_STATE.indexOf("trans1") > -1) {
			if(toi.direct_transitions == undefined)
				return 0;
			return toi.direct_transitions[b][a];
		}
		else if(MATRIX_DATA_STATE.indexOf("trans2") > -1){
			if(toi.indirect_transitions == undefined)
				return 0;
			return toi.indirect_transitions[b][a];
		}
		else if(MATRIX_DATA_STATE.indexOf("glances") > -1){
			if(toi.triples == undefined)
				return 0;
			return toi.triples[b][a][b];
		}			
		else if(MATRIX_DATA_STATE.indexOf("through") > -1){
			if(toi.triples == undefined)
				return 0;
			return toi.triples[b][lens][a];	
		}			
	}
	return 0;
}
let aggregate_aoi_metrics_across_dat_twi = (a, b, lens) => {
	if(DAT_MODE == 0) {
		//sum up all the values enabled in VALUED
		let total_sum = 0;

		for(let d=0; d<VALUED.length; d++) {
			let data = DATASETS[VALUED[ d ]];
			if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
				let twi_id = data.tois[data.toi_id].twi_id;
				if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
					total_sum += get_aoi_transition_metric_by_name(data.tois[ data.toi_id ], a, b, lens);
			}else if(TWI_MODE == 1 && selected_twigroup != -1){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
						total_sum += get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);					
				}								
			}else if(TWI_MODE == 0){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						total_sum += get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);														
					}						
				}
			}
		}						
		return total_sum;
	}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){
		//sum up all the values enabled in VALUED
		let total_sum = 0;

		for(let d=0; d<VALUED.length; d++) {
			let data = DATASETS[VALUED[ d ]];
			if(data.group == selected_grp){
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
						total_sum += get_aoi_transition_metric_by_name(data.tois[ data.toi_id ], a, b, lens);
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
							total_sum += get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);						
					}								
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							// console.log("=== a: "+a+", total_sum: "+total_sum+", direct transition: "+get_aoi_transition_metric_by_name(data.tois[ c ], a, b, c));
							total_sum += get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);														
						}							
					}
				}
			}							
		}						
		return total_sum;
	}
	else if(DAT_MODE == 2) {
		let data = DATASETS[selected_data];
		if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
			let twi_id = data.tois[data.toi_id].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
				//matrix_values[a].push( FULL_TRANSITIONS[dat][ DATASETS[selected_data].toi_id ][a][b] );
				return get_aoi_transition_metric_by_name(data.tois[ data.toi_id ], a, b, lens);
		}else if(TWI_MODE == 1 && selected_twigroup != -1){
			let total_sum = 0;
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) 
					total_sum += get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);				
			}
			return total_sum;
		}else if(TWI_MODE == 0){
			let total_sum = 0;
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
					total_sum += get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);
				}
			}
			return total_sum;
		}						
	}
	return 0;
};

let aggregate_aoi_metrics_across_dat_twi_mean_values = (a, b, lens) => {
	if(DAT_MODE == 0) {
		//sum up all the values enabled in VALUED
		let total_sum = 0;
		let total_number_of_addup = 0;
		for(let d=0; d<VALUED.length; d++) {
			let data = DATASETS[VALUED[ d ]];
			if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
				let twi_id = data.tois[data.toi_id].twi_id;
				if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					let tmp_value = get_aoi_transition_metric_by_name(data.tois[ data.toi_id ], a, b, lens);
					if(tmp_value > 0) {
						total_sum += tmp_value;
						total_number_of_addup++;
					}
				}					
			}else if(TWI_MODE == 1 && selected_twigroup != -1){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						let tmp_value = get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);					
						if(tmp_value > 0) {
							total_sum += tmp_value;
							total_number_of_addup++;
						}	
					}						
				}								
			}else if(TWI_MODE == 0){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						let tmp_value = get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);														
						if(tmp_value > 0) {
							total_sum += tmp_value;
							total_number_of_addup++;
						}						
					}						
				}
			}
		}						
		return total_number_of_addup > 0 ? total_sum/total_number_of_addup : 0;
	}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){
		//sum up all the values enabled in VALUED
		let total_sum = 0;
		let total_number_of_addup = 0;
		for(let d=0; d<VALUED.length; d++) {
			let data = DATASETS[VALUED[ d ]];
			if(data.group == selected_grp){
				if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
					let twi_id = data.tois[data.toi_id].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						let tmp_value = get_aoi_transition_metric_by_name(data.tois[ data.toi_id ], a, b, lens);
						if(tmp_value > 0) {
							total_sum += tmp_value;
							total_number_of_addup++;
						}
					}
						
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							let tmp_value = get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);						
							if(tmp_value > 0) {
								total_sum += tmp_value;
								total_number_of_addup++;
							}
						}
							
					}								
				}else if(TWI_MODE == 0){
					for(let c=0; c<data.tois.length; c++) {
						let twi_id = data.tois[c].twi_id;
						if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							let tmp_value = get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);														
							if(tmp_value > 0) {
								total_sum += tmp_value;
								total_number_of_addup++;
							}
						}							
					}
				}
			}							
		}						
		return total_number_of_addup > 0 ? total_sum/total_number_of_addup : 0;
	}
	else if(DAT_MODE == 2) {
		let data = DATASETS[selected_data];
		if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
			let twi_id = data.tois[data.toi_id].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
				//matrix_values[a].push( FULL_TRANSITIONS[dat][ DATASETS[selected_data].toi_id ][a][b] );
				return get_aoi_transition_metric_by_name(data.tois[ data.toi_id ], a, b, lens);
		}else if(TWI_MODE == 1 && selected_twigroup != -1){
			let total_sum = 0;
			let total_number_of_addup = 0;
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
					let tmp_value = get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);
					if(tmp_value > 0) {
						total_sum += tmp_value;
						total_number_of_addup++;
					}					
				}					
			}
			return total_number_of_addup > 0 ? total_sum/total_number_of_addup : 0;
		}else if(TWI_MODE == 0){
			let total_sum = 0;
			let total_number_of_addup = 0;
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
					let tmp_value = get_aoi_transition_metric_by_name(data.tois[ c ], a, b, lens);
					if(tmp_value > 0) {
						total_sum += tmp_value;
						total_number_of_addup++;
					}
				}
			}
			return total_number_of_addup > 0 ? total_sum/total_number_of_addup : 0;
		}						
	}
	return 0;
};

let dat_compare = (canvas, disp_x, disp_y, width, height, topo1, topo2) => {
	if(MATRIX_DATA_STATE.indexOf('aoi')==0 || MATRIX_DATA_STATE.indexOf('lensegroup')==0){ // do the aoi drawing minimap
		// if( topo1.totaltime == 0 || topo2.totaltime) return;
		canvas.noStroke(); canvas.fill(black(100)); canvas.textSize(0); canvas.textAlign(canvas.CENTER);
		canvas.rect(disp_x, disp_y, width, height);
		max_val = 0; // find the maximum value, so I can colour relative to it
		for(a = 0; a<lenses.length; a++){ max_val = Math.max(max_val, topo1.lenstime[a] / topo1.totaltime, topo2.lenstime[a] / topo2.totaltime ); }
		for(a = 0; a<lenses.length; a++){
			vx = topo1.lenstime[a] / topo1.totaltime; vy = topo2.lenstime[a] / topo2.totaltime;
			canvas.fill( matrix_mix( vx, vy, max_val, 200 ) );
			lenses[a].draw(canvas, false, false, width, height, disp_x, disp_y, false);
		}
	}else if(MATRIX_DATA_STATE.indexOf('grid')==0){ // do the grid drawing minimap
		max_val = Math.max(topo1.max_value / topo1.total_value, topo2.max_value / topo2.total_value);
		canvas.noStroke(); canvas.fill(black(100));
		canvas.rect(disp_x, disp_y, width, height);
		w = width/GRID_N; h = height/GRID_N;
		max_val = 0;
		for(a = 0; a<GRID_N**2; a++){ max_val = Math.max(max_val, topo1.grid_density[a] / topo1.totaltime, topo2.grid_density[a] / topo2.totaltime ); }
		for(I = 0; I < GRID_N; I++ ){
			for(J = 0; J < GRID_N; J++){
				v1 = topo1.grid_density[I*GRID_N + J] / topo1.totaltime;
				v2 = topo2.grid_density[I*GRID_N + J] / topo2.totaltime;
				canvas.fill( matrix_mix(v1, v2, max_val, 256) );
				canvas.rect( Math.floor(disp_x + w*I), Math.floor(disp_y + h*J), Math.floor(disp_x + w*I+w)-Math.floor(disp_x + w*I), Math.floor(disp_y + h*J+h)-Math.floor(disp_y + h*J));
			}
		}
	}else{ // do the continuous drawing minimap, but now I want to filter onto levels
		max_val = Math.max(topo1.max_value / topo1.total_value, topo2.max_value / topo2.total_value);
		canvas.noStroke(); canvas.fill(black(100));
		canvas.rect(disp_x, disp_y, width, height);
		w = width/X_NUM; h = height/Y_NUM;
		for(I = 0; I < X_NUM; I++ ){
			for(J = 0; J < Y_NUM; J++){
				v1 = topo1.values[I][J] / topo1.total_value;
				v2 = topo2.values[I][J] / topo2.total_value;
				canvas.fill( matrix_mix_stepped(v1, v2, max_val, 256) );
				canvas.rect( Math.floor(disp_x + w*I), Math.floor(disp_y + h*J), Math.floor(disp_x + w*I+w)-Math.floor(disp_x + w*I), Math.floor(disp_y + h*J+h)-Math.floor(disp_y + h*J));
			}
		}
	}
};


let get_grp_col = (group) => {return GROUPINGS[ group-1 % GROUPINGS.length ]};
let get_toi_col = (data_id = selected_data) => {return GROUPINGS[ (DATASETS[data_id].group - 1) % GROUPINGS.length ]};
let get_twi_col = (twi_id) => {return TWIS_COLOURS[(base_twis[twi_id].group - 1)%TWIS_COLOURS.length]};
let get_twigroup_col = (group) => {
	let tgc;
	for(let l=0; l<order_twis.length; l++){
		let twi_id = order_twis[l];
		if(base_twis[twi_id].group == group){tgc = TWIS_COLOURS[(base_twis[twi_id].group - 1)%TWIS_COLOURS.length]; break;}
	}
	return tgc;
};
let get_dat_col = (id) => {return GROUPINGS[ (DATASETS[id].group-1) % GROUPINGS.length ];};
let get_aoi_col = (lens) => {return lens.col(95)};
let get_lensegroup_col = (lens_group) => {
	let lgc;
	for(let l=0; l<lenses.length; l++){
		if(lenses[l].group == lens_group){lgc = lenses[l].col(95); break;}
	}
	return lgc;
};
