// Colour scheme taken from Colorbrewer: https://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3. new arbitrary colours can be plugged in with any other string

GROUPINGS = ["#98e2bb","#f3d1aa","#b7a9ea","#fdaaf3","#fbffc2","#ecacac","#cdeca7","#a1b7f7","#ffffff","#a3dd36",
"#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
SACC_TYPES = ["#99f3ff","#1ae4ff","#fbfd7c"]; // short, basic, glance
DIRECTIONS = ["#dd4646","#dbd643","#a3dd36","#3dd664","#41d8d8","#4368d6","#8a3dd6","#d83bb1"];
TWIS_COLOURS = ["#dd4646","#dbd643","#a3dd36","#3dd664","#41d8d8","#4368d6","#8a3dd6","#d83bb1","#f3d1aa","#ffffff",
"#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd"];
LENS_COLOURS = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#7f7f7f", "#bcbd22", "#17becf", "#98e2bb", "#f3d1aa", "#fdaaf3", "#fbffc2", "#ecacac", "#a1b7f7", "#dbd643", "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#7f7f7f", "#bcbd22", "#17becf", "#98e2bb", "#f3d1aa", "#fdaaf3", "#fbffc2", "#ecacac", "#a1b7f7", "#dbd643", "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd"];
ORDERED = ["#e9741c","#ffff7c","#74f05c"]; // before, middle, after
MATCOL = ["#FFFFFF","#cb181d","#2171b5"];
OBSERVERS = ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5"];
WHITE = '#FFFFFF'; GREY = '#888888'; DARK="#BBBBBB"; BLACK = '#000000';
SELECTED = '#00FF00'; // the colour we use when an item is selected, currently green
SACC_GRP = []; SACC_COUNT = []; // for sacc export
SACC_SATURATION = true;
FIXS_SATURATION = true;

function update_selector_colours(){
	for(i=0; i< GROUPINGS.length; i++){ document.getElementById('basic_'+i).value = GROUPINGS[i]; }
	generateAOIColorControls();
	for(i=0; i< TWIS_COLOURS.length; i++){ document.getElementById('twic_'+i).value = TWIS_COLOURS[i]; }
	for(i=0; i< DIRECTIONS.length; i++){ document.getElementById('dir_'+i).value = DIRECTIONS[i]; }
	for(i=0; i< SACC_TYPES.length; i++){ document.getElementById('sacc_'+i).value = SACC_TYPES[i]; }
	for(i=0; i< ORDERED.length; i++){ document.getElementById('order_'+i).value = ORDERED[i]; }
	for(i=0; i< MATCOL.length; i++){ document.getElementById('matrix_'+i).value = MATCOL[i]; }
	for(i=0; i< OBSERVERS.length; i++){ document.getElementById('obsv_'+i).value = OBSERVERS[i]; }
	update_group_colors(); update_filter_colors(); update_lens_colors();
}

function qq(x){ return Math.floor( Math.min(255, Math.max(0, x)) ); }
function fromHex(hex){ return parseInt("0x"+hex); }
function makeColor(a, val){ return "rgba(" + fromHex(val.substring(1,3)) +"," + fromHex(val.substring(3,5))+","+fromHex(val.substring(5,7))+","+ a*0.01 +")"; }
function rgbColor(val){ return fromHex(val.substring(1,3)) +','+ fromHex(val.substring(3,5))+','+fromHex(val.substring(5,7))}; 

function cy(a, type){ // colour by type list
	if( legval!=-1 && legval != (type-1) ){ a = 0; }
	return makeColor(a, GROUPINGS[ (type - 1)%GROUPINGS.length ]);
}
function color_wheel(a, x){
	var dir = (Math.floor((x*4)/Math.PI + 0.5) + 8) % 8;
	if( legval!=-1 && legval!=(10+dir)){ a=0; }
	return makeColor( a, DIRECTIONS[dir]);
}
function lens_col(a, x){ return makeColor(a, LENS_COLOURS[x%LENS_COLOURS.length]); }
function lensegroup_col(a, x){ return makeColor(a, LENS_COLOURS[(x - 1)%LENS_COLOURS.length]); }
function white(a){ return makeColor(a, WHITE);}
function grey(a){ return makeColor(a, GREY);}
function dark(a){ return makeColor(a, DARK);}
function black(a){ return makeColor(a, BLACK);}
function sacc_short(a) { if( (legval!=-1) && (legval!=30) ){ a=0; } return makeColor(a, SACC_TYPES[0]); }
function sacc_basic(a) { if( (legval!=-1) && (legval!=31) ){ a=0; } return makeColor(a, SACC_TYPES[1]); }
function sacc_glance(a){ if( (legval!=-1) && (legval!=32) ){ a=0; } return makeColor(a, SACC_TYPES[2]); }
function color_mark(before, after){ // the colour to use for a foreground mark
	if( (legval!=-1) && !( (before&&!after&&(legval==42))||(before&&after&&(legval==41))||(!before&&after&&(legval==40)) ) ){ a=0; }
	if(before && !after){ return makeColor(80, ORDERED[2]); } // just left the lens
	else if(before && after){ return makeColor(80, ORDERED[1]); } // glancing out from the lens
	else if(!before && after){ return makeColor(80, ORDERED[0]); } // about to enter the lens
	return black(0);
}
function matrix_mix(a, b, maxval, alpha){
	let greybright = Math.min(a,b)/maxval;
	let colbright = (Math.max(a,b)-Math.min(a,b))/maxval;
	if( a>b ){ val = MATCOL[1]; }else{ val = MATCOL[2]; }
	// I have my colours and brightnesses, so lets merge 
	r = Math.floor(256*greybright + colbright*fromHex(val.substring(1,3)));
	g = Math.floor(256*greybright + colbright*fromHex(val.substring(3,5)));
	b = Math.floor(256*greybright + colbright*fromHex(val.substring(5,7)));
	return "rgba(" + r +"," + g+","+b+","+ alpha/256 +")";
}
function matrix_mix_stepped(a, b, maxval, alpha){
	let greybright = 0;
	for(var l=0;l<levels.length && levels[l]<Math.min(a,b)/maxval;l++){greybright=levels[l];}
	let colbright = 0;
	for(var l=0;l<levels.length && levels[l]<(Math.max(a,b)-Math.min(a,b))/maxval;l++){colbright=levels[l];}
	if( a>b ){ val = MATCOL[1]; }else{ val = MATCOL[2]; }
	// I have my colours and brightnesses, so lets merge 
	r = Math.floor(256*greybright + colbright*fromHex(val.substring(1,3)));
	g = Math.floor(256*greybright + colbright*fromHex(val.substring(3,5)));
	b = Math.floor(256*greybright + colbright*fromHex(val.substring(5,7)));
	return "rgba(" + r +"," + g+","+b+","+ alpha/256 +")";
}

function update_colour_vals(){
	update_filter_colors(); update_group_colors(); make_dynamic_legend(); update_lens_colors();
	background_changed = true;
}
function update_filter_colors(){
	for(var i=0;i<8;i++){ document.getElementById('t'+ ((i+4)%8) ).style.backgroundColor = DIRECTIONS[i]; }
	document.getElementById('tshort').style.backgroundColor = SACC_TYPES[0];
	document.getElementById('tbasic').style.backgroundColor = SACC_TYPES[1];
	document.getElementById('tglance').style.backgroundColor = SACC_TYPES[2];	
}
function update_group_colors(){
	for(var i=0;i<document.getElementById('mylist').children.length;i++){
		val = parseInt(document.getElementById('mylist').children[i].id);
		document.getElementById(val+"_drag").style.backgroundColor = GROUPINGS[ (DATASETS[val].group - 1) % GROUPINGS.length ];
	}
}

let manualObserverElement = null;
function update_observer_colors() {
    for (var i = 0; i < document.getElementById("notelist").children.length; i++) {
        let child = document.getElementById("notelist").children[i];
        let childId = child.id;

        if (childId && childId.startsWith("note_")) {
            let val = parseInt(childId.split("_")[1]); // Declare `val` here
            let textContent = document.getElementById("note_" + val + "_note_observer").textContent;
            let observerName = textContent.split('Note Taker:')[1].trim();			
			manualObserverElement = document.getElementById("note_" + val + "manual_note_observer");

			if(manualObserverElement && manualObserverElement != "") {
				observers[manualObserverElement.value] = OBSERVERS[observerColourIndex];
			}

            let dragger = child.querySelector(".data_dragger");

            if (dragger) {
				if(observerName) {
					dragger.style.height = "78px";
					dragger.style.backgroundColor = observers[observerName];
					dragger.style.border = `8.5px solid ${observers[observerName]}`;
					dragger.style.display = "block";
				} else if (manualObserverElement) {
					dragger.style.height = "78px";
					dragger.style.backgroundColor = observers[manualObserverElement.value];
					dragger.style.border = `8.5px solid ${observers[manualObserverElement.value]}`;
					dragger.style.display = "block";					
				}
            } else {
                console.warn(`data_dragger not found for note_${val}`);
            }
        } else {
            console.warn("Invalid or missing ID for child:", child);
        }
    }
}
function updateTypeColors() {
	for (var i = 0; i < document.getElementById("notelist").children.length; i++) {
		let child = document.getElementById("notelist").children[i];
		let childId = child.id;

		if (childId && childId.startsWith("note_")) {
			let val = parseInt(childId.split("_")[1]);
			let textContent = document.getElementById("note_" + val + "_note_type").textContent;			
			let typeName = textContent.split('Note Type:')[1].trim();
			
			if (!event_colour_map[typeName]) {
				console.error(`Color not found for type '${typeName}'.`);
				continue;
			}

			let dragger = child.querySelector(".data_dragger");

			if (dragger) {
				dragger.style.height = "78px";
				dragger.style.backgroundColor = event_colour_map[typeName];
				dragger.style.border = `8px solid ${event_colour_map[typeName]}`;
				dragger.style.display = "block";
			} else {
				console.warn(`data_dragger not found for note_${val}`);
			}
		} else {
			console.warn("Invalid or missing ID for child:", child);
		}
	}
}
function updateDefaultNoteColors() {
	for (var i = 0; i < document.getElementById("notelist").children.length; i++) {
		let child = document.getElementById("notelist").children[i];
		let childId = child.id;

		if (childId && childId.startsWith("note_")) {
			let val = parseInt(childId.split("_")[1]);
			let dragger = child.querySelector(".data_dragger");

			if (dragger) {
				dragger.style.height = "78px";
				dragger.style.backgroundColor = "#696b6a";
				dragger.style.border = "8px solid #696b6a";
				dragger.style.display = "block";
			} else {
				console.warn(`data_dragger not found for note_${val}`);
			}
		} else {
			console.warn("Invalid or missing ID for child:", child);
		}
	}
}
function update_lens_colors(){
	for(var i=0;i<document.getElementById('lenslist').children.length;i++){
		val = parseInt(document.getElementById('lenslist').children[i].id.split('_')[1]);		
			if(TIME_DATA=='all') {				
				document.getElementById(val+"_dragger").style.backgroundColor = 'rgba('+rgbColor(LENS_COLOURS[val%LENS_COLOURS.length])+', .75)';
				document.getElementById('aoi_color_group_controls').style.display = "none";
				document.querySelectorAll('[id^="aoigc_"]').forEach(el => {
					el.style.display = "none";
				});
				generateAOIColorControls();
			} 
			else{
				document.getElementById(val+"_dragger").style.backgroundColor = 'rgba('+rgbColor(LENS_COLOURS[(base_lenses[val].group - 1)%LENS_COLOURS.length])+', .75)';
				document.getElementById('aoi_color_controls').style.display = "none";
				document.querySelectorAll('[id^="aoic_"]').forEach(el => {
					el.style.display = "none";
				});
				generateGroupAOIColorControls();
			}
		timeline_changed = true;
		matrix_changed = true;
	}
}

function update_twi_colors(){
	for(var i=0;i<document.getElementById('twilist').children.length;i++){
		val = parseInt(document.getElementById('twilist').children[i].id.split('_')[1]);
		document.getElementById(val+"_twi_dragger").style.backgroundColor = 'rgba('+rgbColor(TWIS_COLOURS[(base_twis[val].group - 1)%TWIS_COLOURS.length])+', .75)';
	}
}

function hexToRGB(h) {
	let r = 0, g = 0, b = 0;
  
	// 3 digits
	if (h.length == 4) {r = "0x" + h[1] + h[1];
	  g = "0x" + h[2] + h[2];
	  b = "0x" + h[3] + h[3];
  
	// 6 digits
	} else if (h.length == 7) {
	  r = "0x" + h[1] + h[2];
	  g = "0x" + h[3] + h[4];
	  b = "0x" + h[5] + h[6];
	}
	
	return "rgb("+ +r + "," + +g + "," + +b + ")";
}

let MULTI_GROUPS = false;
let legval = -1;
function setleg(val){
	if(legval != val){ legval = val; background_changed = true; midground_changed = true; foreground_changed = true; }
}
function make_dynamic_legend(){
	// changed by: >SHOW_FIX, >SHOW_TOPO, >SHOW_SACCADE, changing >COLOUR_MODE, MATRIX_DATA_STATE, 
	let gl = document.getElementById("groups_legend"); gl.innerHTML = "";
	let dl = document.getElementById("directions_legend"); dl.innerHTML = "";
	let tl = document.getElementById("types_legend"); tl.innerHTML = "";
	let ol = document.getElementById("order_legend"); ol.innerHTML = "";
	let haar_metric = document.getElementById("haar_metric"); haar_metric.innerHTML = "";

	if( SHOW_FIX || SHOW_TOPO || ( SHOW_SACCADE && COLOUR_MODE=="group") ){
		SACC_GRP = []; SACC_COUNT = []; // for sacc export
		let htmlvalue = "<table>";
		MULTI_GROUPS = false;
		for(var gp = 0; gp < GROUPINGS.length; gp++){
			used_by = [];
			for(var v=0; v<VALUED.length; v++ ){
				if( DATASETS[VALUED[v]] != undefined && DATASETS[VALUED[v]].included && DATASETS[VALUED[v]].group == gp+1 ){ used_by.push( VALUED[v] ); }
			}
			var fix_total = 0;
			var sacc_total = 0;
			for(var i=0; i<used_by.length; i++){ 
				if(TWI_MODE == 0) {
					for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
						let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
						if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							fix_total += DATASETS[used_by[i]].tois[ j ].j_max - DATASETS[used_by[i]].tois[ j ].j_min; 							
						}
					}
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
						let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
						if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							fix_total += DATASETS[used_by[i]].tois[ j ].j_max - DATASETS[used_by[i]].tois[ j ].j_min; 							
						}
					}
				}else if(TWI_MODE == 2 && selected_twi != -1 && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ] != undefined && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].included) {
					let twi_id = DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						fix_total += DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].j_max - DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].j_min; 						
					}						
				}				
				for(var sc=0; sc<DATASETS[used_by[i]].sacs.length; sc++){ 
					if(DATASETS[used_by[i]].sacs[sc].t1>DATASETS[used_by[i]].tmin && DATASETS[used_by[i]].sacs[sc].t2<DATASETS[used_by[i]].tmax)
					sacc_total += 1
				}
			}			
			if( !(fix_total > -1) ){ fix_total = 0;} // NaN sanity check
			if(used_by.length>0){
				var gpu = gp+1;
				SACC_GRP.push('Group ' + gpu);
				SACC_COUNT.push(sacc_total);
			}
			if(used_by.length >= 2){
				htmlvalue += "<tr onmousedown='setleg("+gp+")' >";
				htmlvalue += "<th style='height:15px; width:15px; background-color:"+ GROUPINGS[gp]+"'></th> <th> group "+(gp+1)+" ("+used_by.length+" samples, "+fix_total+" fixations)</th> </tr>";
				MULTI_GROUPS = true;
			}else if(used_by.length == 1){
				htmlvalue += "<tr onmousedown='setleg("+gp+")' >";
				htmlvalue += "<th style='height:15px; width:15px; background-color:"+ GROUPINGS[gp]+"'></th> <th>("+DATASETS[used_by[0]].name+", "+fix_total+" fixations) </th> </tr>";
			}
		}
		htmlvalue  += "</table>";
		if( htmlvalue != gl.innerHTML ){ gl.innerHTML = htmlvalue; }
	}
	// occ_type = [0, 0, 0]; occ_dir = [0,0,0,0,0,0,0,0,0];
	if( SHOW_SACCADE && COLOUR_MODE=="direction" ){
		let htmlvalue = "<tr> <th style='height:15px;width:15px;background-color:"+DIRECTIONS[5]+"' onmousedown='setleg(15)'>"+occ_dir[1]+"</th>"
		htmlvalue += "<th style='height:15px;width:15px;background-color:"+DIRECTIONS[6]+"' onmousedown='setleg(16)'>"+occ_dir[2]+"</th>";
		htmlvalue += "<th style='height:15px;width:15px;background-color:"+DIRECTIONS[7]+"' onmousedown='setleg(17)'>"+occ_dir[3]+"</th> </tr>";
		htmlvalue += "<tr> <th style='height:15px;width:15px;background-color:"+DIRECTIONS[4]+"' onmousedown='setleg(14)'>"+occ_dir[0]+"</th> <th style='height:15px;width:15px'></th>";
		htmlvalue +="<th style='height:15px;width:15px;background-color:"+DIRECTIONS[0]+"' onmousedown='setleg(10)'>"+occ_dir[4]+"</th> </tr>";
		htmlvalue += "<tr> <th style='height:15px;width:15px;background-color:"+DIRECTIONS[3]+"' onmousedown='setleg(13)'>"+occ_dir[7]+"</th>";
		htmlvalue +="<th style='height:15px;width:15px;background-color:"+DIRECTIONS[2]+"' onmousedown='setleg(12)'>"+occ_dir[6]+"</th>";
		htmlvalue +="<th style='height:15px;width:15px;background-color:"+DIRECTIONS[1]+"' onmousedown='setleg(11)'>"+occ_dir[5]+"</th> </tr>";
		htmlvalue = "<table onmouseexit='setleg(-1)'> <tr> <th> <table>"+ htmlvalue + "</table> </th> <th> Saccades Coloured by directionality </th> </tr> </table>";
		if( htmlvalue != dl.innerHTML ){ dl.innerHTML = htmlvalue; }
	}else if( SHOW_SACCADE && COLOUR_MODE=="type" ){
		let htmlvalue = "<tr> <th style='height:15px;width:15px;background-color:"+SACC_TYPES[0]+"' onmousedown='setleg(30)'></th> <th> Short Saccades ("+occ_type[0]+") </th> </tr>";
		htmlvalue += "<tr> <th style='height:15px;width:15px;background-color:"+SACC_TYPES[1]+"' onmousedown='setleg(31)'></th> <th> Long Saccades ("+occ_type[1]+") </th> </tr>";
		htmlvalue += "<tr> <th style='height:15px;width:15px;background-color:"+SACC_TYPES[2]+"' onmousedown='setleg(32)'></th> <th> Glance Saccades ("+occ_type[2]+") </th> </tr>";
		htmlvalue = "<table onmouseexit='setleg(-1)'>" + htmlvalue + "</table>";
		if( htmlvalue != tl.innerHTML ){ tl.innerHTML = htmlvalue; }
	}
	if( ( selected_lens!=-1 &&  selected_data!=-1 &&  SHOW_FORE != "" ) ){
		let htmlvalue = "<tr> <th style='height:15px;width:15px;background-color:"+ORDERED[0]+"' onmousedown='setleg(40)'></th> <th> Before visit to sel. AOIs </th> </tr>";
		htmlvalue += "<tr> <th style='height:15px;width:15px;background-color:"+ORDERED[1]+"' onmousedown=setleg(41)'></th> <th> During visit or glance outside </th> </tr>";
		htmlvalue += "<tr> <th style='height:15px;width:15px;background-color:"+ORDERED[2]+"' onmousedown='setleg(42)'></th> <th> After visit to sel. AOIs </th> </tr>";
		htmlvalue = "<table onmouseexit='setleg(-1)'>" + htmlvalue + "</table>";
		if( htmlvalue != ol.innerHTML ){ ol.innerHTML = htmlvalue; }
	}

	let HAAR = compute_hit_any_aoi_rate();
	HAAR_VALUE = (HAAR.hit == 0 ? 0 : (HAAR.hit/(HAAR.hit+HAAR.off)).toFixed(2));
	let htmlvalue = "Hit Any AOI Rate: "+ HAAR_VALUE +"<br />";	
	if( htmlvalue != haar_metric.innerHTML ){ haar_metric.innerHTML = htmlvalue; }
}
function reset_legend_mouseovers(){
	setleg(-1);
}

// adapted from https://blog.karenying.com/posts/boost-visual-accessibility-by-auto-flipping-text-color
// calculates relative luminance given a hex string
function getLuminance(colour) {
	let rgb;
	if(colour.indexOf('rgb')==-1){
		let text_rgb = hexToRGB(colour);
		rgb = text_rgb.substring(4,text_rgb.length-1).split(',');
	} else if(colour.indexOf('rgba')!=-1){
		rgb = colour.substring(5,colour.length-1).split(',');
	} else{
		rgb = colour.substring(4,colour.length-1).split(',');
	}

	for(let i=0; i<3; i++) {
		let c = rgb[i];
		c /= 255;
		c = c > 0.03928 ? Math.pow((c + 0.055) / 1.055, 2.4) : (c /= 12.92)
		rgb[i] = c;
	}
	return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  // calculates contrast ratio between two hex strings
function contrastRatioPair(col1, col2) {
	const lum1 = getLuminance(col1);
	const lum2 = getLuminance(col2);
  
	return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  }

function contrast_bw(colour){
	var textcol = ['#000000', '#ffffff']
	return contrastRatioPair(colour, textcol[0])>contrastRatioPair(colour, textcol[1])? textcol[0]:textcol[1]
}

function generateAOIColorControls() {
	// Potentially changeable to if order_lenses.length != base_lenses.length then do following, if not then use order_lenses to get indexes
	const container = document.getElementById('aoi_color_controls');
	container.style.display = "block";
	document.querySelectorAll('[id^="aoic_"]').forEach(el => {
		el.style.display = "block";
	});
	container.innerHTML = "<p>AOI Colours:</p>";
	const startingIndex = order_lenses[0];

	const inputFirst = document.createElement("input");
	inputFirst.type = "color";
	inputFirst.id = `aoic_${startingIndex}`;
	inputFirst.className = "colorer";
	inputFirst.value = LENS_COLOURS[startingIndex] || "#ffffff";

	console.log("Input color for startingIndex", startingIndex, ":", inputFirst.value);

	inputFirst.oninput = function () {
		LENS_COLOURS[startingIndex] = this.value;
		update_colour_vals();

		// Update duplicate color inputs if needed (use exact match!)
		const el = document.getElementById(`aoic_${startingIndex}`);
		if (el && el !== this) el.value = this.value;
	};

	container.appendChild(inputFirst);

	const el = document.getElementById(`aoic_${startingIndex}`);
	if (el && el !== inputFirst) el.value = inputFirst.value;

	for (let i = 0; i < base_lenses.length; i++) {
		if (i === startingIndex) continue;

		const input = document.createElement("input");
		input.type = "color";
		input.id = `aoic_${i}`;
		input.className = "colorer";
		input.value = LENS_COLOURS[i] || "#ffffff";

		input.oninput = function () {
			LENS_COLOURS[i] = this.value;
			update_colour_vals();

			const el = document.getElementById(`aoic_${i}`);
			if (el && el !== this) el.value = this.value;
		};

		container.appendChild(input);

		document.querySelectorAll(`#aoic_${i}`).forEach(el => {
			if (el !== input) el.value = input.value;
		});
	}
}

function generateGroupAOIColorControls() {
	const container = document.getElementById('aoi_color_group_controls');
	container.style.display = "block";
	container.innerHTML = "<p>AOI Group Colours:</p>";

	const groups = [...new Set(base_lenses.map(lens => lens.group).filter(g => g !== 0))];

	for (const group of groups) {
		const input = document.createElement("input");
		input.type = "color";
		input.id = `aoigc_${group}`;
		input.className = "colorer";
		input.value = LENS_COLOURS[(group - 1) % LENS_COLOURS.length] || "#ffffff";

		input.oninput = function () {
			LENS_COLOURS[(group - 1) % LENS_COLOURS.length] = this.value;
			update_colour_vals();
		};

		container.appendChild(input);
	}
}
