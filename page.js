
// useful constants

SPATIAL_CANVAS_WIDTH_PERCENTAGE = 0.525; // percentage of the browser innerWidth
SPATIAL_CANVAS_HEIGHT_PERCENTAGE = 0.7; // percentage of the browser innerHeight
CANVAS_BOX_HEIGHT_PERCENTAGE = 0.97; // percentage of the browser innerHeight
MATRIX_CENTER_WIDTH_PERCERTAGE_OVER_INTERFACE_LAYOUT = 38; // percentage of the matrix center of the interface layout
INTERFACE_LAYOUT_OVER_WINDOWS_WIDTH = 0.88; // percentage of interface_layout width over windows
RESIZE_CONTROL_PADDING = 30; 

spatial_width = window.innerWidth * SPATIAL_CANVAS_WIDTH_PERCENTAGE;
spatial_height = window.innerHeight * SPATIAL_CANVAS_HEIGHT_PERCENTAGE;

SPATIAL = null; MATRIX = null; TIMELINE = null; // the processing sketches on the page
WIDTH = 0; HEIGHT = 0; OFFSET_X = 0; OFFSET_Y = 0; SCALE_X = 1.00; SCALE_Y = 1.00;// the width and height of the underlying data set
BACK_BRIGHT = 0.5; // the brightness of the background image, if we have one
var TIMELINE_MOUSE = false; TIMELINE_MOUSEOVER_WINDOW = -1; // where the mouse is over the timeline for the selected dataset, if it exists (otherwise, -1), the log of the relative width of the scan
FIX_SIZE = 10; FIX_ALPHA = 5; // size and transperancy of the background fixations
FORE_SIZE = 10;
TOPO_SOFTEN = 5; TOPO_SHAPE = 'inv_square'; // controls how "spread out" the weight of a fixation is, for its density map
SACC_BRIGHT = 0; SACC_BLUR = 0; // controls the appearance of the saccades
BUNDLE_K = -6; BUNDLE_H = 0; // rigidity and head of the bundling
NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING = 0; // shows the progress of number of saccades being considered for bundling
var max_dist = 20; var min_time = 0; // effects clustering
var longest_duration = 1; // used for absolute timeline, and time_animate functionality
var ground_x = 0; // to maintain centre when cropped
var ground_y = 0; // to maintain centre when cropped
var offset_xdata = 0; //offset data in relation to other elements (e.g. background image/lens)
var offset_ydata = 0; //offset data in relation to other elements (e.g. background image/lens)
DEFAULT_SYMMETRIC_SORT = 'No_sort';
PREVIOUS_MATRIX_DATA_STATE = '';
NUM_RETRY_BEFORE_DATA_LOADED = 0;
VIDEO_LINKING = true;
VIDEO_IN_PLAY = false;
TIMELINE_SLIDER_DISABLED = false;
DAT_MODE = 0; // to filter datasets selected for metrics (default-0: "All Samples", 1: "selected Sample", 2: "selected Sample group")
TWI_MODE = 0; // to filter datasets selected for metrics (default-0: "All TWIs", 1: "selected TWI", 2: "selected TWI group")
LENSE_MODE = 0; // to filter fixation statistics (default-0: "Selected AOI Group", 1: "Selected AOI")
let simulatedVideoTime = 0;
var loaded = false; //for saved project image cropping
SHOW_LENSLABEL = true;
HAAR_VALUE = 0;
SEQUENCE_SCORE_MISMATCH_PENALTY = 1;
SEQUENCE_SCORE_GAP_PENALTY = 1;
SEQUENCE_SCORE_SKEW_PENALTY = 0.5;
EXPORT_SPATIAL_CANVAS = true;
EXPORT_CROP_SPATIAL_CANVAS = true;
EXPORT_TIMELINE_CANVAS = true;
EXPORT_METRIC_CANVAS = true;
EXPORT_CROP_TIMELINE_CANVAS = true;
TOGGLE_GREEN_BOX_HIGHLIGHTS = true;
let matrix_changed_retry = 0;

function display(bool){ if(bool){return 'block';}else{return 'none';} }
function update_all(){ background_changed=true; midground_changed=true; matrix_changed=true; timeline_changed=true; update_topos=true; }

var tooltip_css = ".tool:hover .tip {$} .tool2:hover .tip {$}";
function toggle_tips(){
	document.getElementById('control_tooltip').classList.toggle( 'toggle-on' );
	TOOL_TIPS = document.getElementById('control_tooltip').classList.value.includes('toggle-on');
	if( TOOL_TIPS ){ document.getElementById('tooltip').innerHTML = tooltip_css.replaceAll('$', 'visibility: visible;'); }
	else{ document.getElementById('tooltip').innerHTML = tooltip_css.replaceAll('$', 'visibility: hidden;'); }
}
function toggle_green_box_highlights(){
	document.getElementById('control_greenbox').classList.toggle( 'toggle-on' );
	TOGGLE_GREEN_BOX_HIGHLIGHTS = document.getElementById('control_greenbox').classList.value.includes('toggle-on');	
}
function toggle_videocursors(){
	document.getElementById('control_video').classList.toggle( 'toggle-on' );
	VIDEO_LINKING = document.getElementById('control_video').classList.value.includes('toggle-on');
}

function on_document_load(){ // is called after the document is loaded
	GRID_N = document.getElementById("GRID_N").value;
	BINS_N = document.getElementById("BINS_N").value;
	HIST_METRIC = document.getElementById("hist_metric").value;
	update_selector_colours();
}

function format_time(t){
	hours = Math.floor(t/3600) + '';
	minutes = Math.floor((t/60)%60) + '';
	while(minutes.length < 2){ minutes = "0" + minutes;}
	seconds = Math.round(t%60*100)/100+ '';
	while(seconds.split('.')[0].length < 2){ seconds = "0" + seconds;}
	return hours + ":" + minutes + ":" + seconds;
}

function get_ms(t){
	var hms = t.split(":");
	try{	
		if(hms.length <2){
			return t*1000
		}else if(hms.length == 2){
			return (parseFloat(hms[0])*60+parseFloat(hms[1]))*1000;
		}else if(hms.length == 3){
			return ((parseFloat(hms[0])*60*60)+(parseFloat(hms[1])*60)+parseFloat(hms[2]))*1000;
		}else{
			return -1;
		}
	}catch(error){console.error(error); return -1;}
}

var g = 0;
var cid = 0;
var bid = 0;
var DATASETS = [];
var VIDEOS = [];
building_lens = false;
selected_lens = -1; selected_data = -1; selected_twi = -1; selected_grp = -1; selected_lensegroup = -1; selected_twigroup = -1;

var image_url = "";
var image_changed = false; image_width = 0; image_height = 0;
var size_changed = false; new_back_image = false;
var background_changed = false, midground_changed = false; foreground_changed = false; foreground_redraw = false; var update_legend = false; var update_metrics = false;
timeline_changed = false; matrix_changed = true; matrix_redraw = true; update_topos = false;
HasVal = false; xval = 0; yval = 0; xdat = undefined; ydat = undefined; var prev_count = 0;

// list dragging control methods, stolen from github
let selected = null;
function dragOver_page(e) {
  par = e.target.parentNode; val = isBefore(selected, par);
  if (val==1) { par.parentNode.insertBefore(selected, par); }
  if(val==-1) { par.parentNode.insertBefore(selected, par.nextSibling); }
}
function dragEnd() { document.getElementById('sort_dropdown').value = 'No_sort'; selected = null;background_changed = true;matrix_changed = true;timeline_changed=true; 
}
function dragStart(e) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', null);  selected = e.target.parentNode; }
function isBefore(el1, el2) {
  let cur;
  if (el2.parentNode === el1.parentNode){for(cur = el1.previousSibling; cur; cur = cur.previousSibling){if (cur === el2) return 1;}}
  return -( el2.parentNode === el1.parentNode )
}

// interface control variables
SHORT_LENGTH = 200; GRID_N = 6; BINS_N = 6; TIME_ANIMATE = 1; TIME_PLAY = false;
LENS_DATA_TYPE = "time"; MATRIX_VIEW_STATE = "aoi_aoi"; MATRIX_DATA_STATE = "trans1";
SACC_FILTER = "none"; COLOUR_MODE = "group";
VALUED = []; 
GROUPIDS = [];
SHOW_FIX = true; SHOW_TOPO = false; SHOW_SACCADE = false; USE_SIZE = false; USE_RELATIVE = false; REMOVE_GAPS = false;
SHOW_FORE = "spatial"; TIME_DATA = "all";
DO_BUNDLE = true; MATRIX_MINIMAP = false;
CONTROL_STATE = "aoi"; SHOW_LENS = true; SHOW_NOTES = true; TIME_STRAT = 'real';
MATRIX_WRITE = false; prev_count=0;

function load_controls(){
	//data binding of AOI, TWI, Sample with DOM

	// rebuild the lens list
	order_lenses = []; lenses = []; LENSIDLIST = [];
	for(var i=0;i<document.getElementById('lenslist').children.length;i++){
		v = parseInt( document.getElementById('lenslist').children[i].id.substring(5) );
		LENSIDLIST[i] = v;
		names = document.getElementById('lens_'+v+'_name').value;
		if(names != base_lenses[v].name){
			base_lenses[v].name = names;
			matrix_changed = true;			
		}
		if( (selected_lens == v) != document.getElementById('lenslist').children[i].classList.value.includes('selected')){
			document.getElementById('lenslist').children[i].classList.toggle('selected');
			midground_changed=true;timeline_changed=true;matrix_changed = true;
		}		
		if( (selected_lens != v) != document.getElementById('lens_'+v+"_values").classList.value.includes('hidden')){
			document.getElementById('lens_'+v+"_values").classList.toggle('hidden');
			document.getElementById('lens_'+v+"_values").innerHTML = base_lenses[v].make_controls();
		}
		if(base_lenses[v].checked != document.getElementById('lens_'+v+'_c').checked) {
			base_lenses[v].checked = document.getElementById('lens_'+v+'_c').checked;
			update_metrics = true;
		}
		
		base_lenses[v].locked = document.getElementById('lens_'+v+'_l').checked;
		let groupnum = parseInt(document.getElementById('lens_'+v+"_lensegroup").value);
		if(groupnum > LENS_COLOURS.length) {
			groupnum = LENS_COLOURS.length
			document.getElementById('lens_'+v+"_lensegroup").value = groupnum;
		}
			
		if(base_lenses[v].group != groupnum){
			base_lenses[v].group = groupnum;
			midground_changed=true;timeline_changed=true;matrix_changed = true;	
			update_lens_colors();			
		}

		if(base_lenses[v].checked && base_lenses[v].included){
			SHOW_LENS = true;
			order_lenses.push( v );
			lenses.push(base_lenses[ v ]);
		}
	}
	for(var i=0; i<base_lenses.length; i++){ base_lenses[i].included = ( document.getElementById('lens_'+i)!=undefined ); }
	// rebuild the data list
	VALUED =  [];
	// Similar to VALUED, MYLISTID stores the current ordered list from 'mylist' but it further stores those that are 'not checked'
	MYLISTID = [];
	
	for(var i=0; i<DATASETS.length; i++){ 
		DATASETS[i].included = ( document.getElementById(i)!=undefined ); 
		for(let j = 0; j < DATASETS[i].tois.length; j++) {
			DATASETS[i].tois[j].included = ( document.getElementById(i+"_twi_"+DATASETS[i].tois[j].twi_id)!=undefined ); 			
		}
	}
	for(var i=0;i<document.getElementById('mylist').children.length;i++){
		val = parseInt(document.getElementById('mylist').children[i].id);
		MYLISTID[i] = val;
		slid_vals = document.getElementById(val+"_sl").noUiSlider.get();
		if(DATASETS[val] != undefined && DATASETS[val].included && DATASETS[val].tois != undefined && DATASETS[val].toi_id != -1 && 
				DATASETS[val].tois[DATASETS[val].toi_id].included) {
			DATASETS[val].tois[DATASETS[val].toi_id].range = slid_vals;
			if(DATASETS[val].slid_vals[0] != slid_vals[0] || DATASETS[val].slid_vals[1] != slid_vals[1]){
				DATASETS[val].slid_vals = slid_vals;
				compute_toi_metrics(val, DATASETS[val].toi_id);
				give_topography(val, DATASETS[val].toi_id);
				background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed |= SHOW_SACCADE;
				foreground_changed = true; timeline_changed = true; matrix_changed = true; update_topos = true;
			}
		}
		else if(DATASETS[val].slid_vals[0] != slid_vals[0] || DATASETS[val].slid_vals[1] != slid_vals[1]){
			DATASETS[val].slid_vals = slid_vals;

			background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed |= SHOW_SACCADE;
			foreground_changed = true; timeline_changed = true; matrix_changed = true; update_topos = true;
		}		
		
		named = document.getElementById(val+'_name').value;
		if(named != DATASETS[val].name){
			DATASETS[val].name = named; make_note_dataset_selectors(); matrix_changed = true; update_legend = true;
		}
		if(DATASETS[val].group != parseInt(document.getElementById(val+"_g").value)){
			let groupnum = parseInt(document.getElementById(val+"_g").value);
			if(groupnum > GROUPINGS.length) {
				groupnum = GROUPINGS.length;
				document.getElementById(val+"_g").value = groupnum;
			}
			
			DATASETS[val].group = groupnum;
			background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed |= SHOW_SACCADE;
			update_metrics = true;
		}
		if(DATASETS[val].checked != document.getElementById(val+"_c").checked){
			DATASETS[val].checked = document.getElementById(val+"_c").checked;
			background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed |= SHOW_SACCADE; matrix_changed = true; timeline_changed = true; make_note_dataset_selectors();
			update_metrics = true;
		}
		DATASETS[val].selected = document.getElementById(val).classList.value.includes('selected');
		DATASETS[val].tmin = DATASETS[val].t_start + (DATASETS[val].t_end - DATASETS[val].t_start)*DATASETS[val].slid_vals[0];
		DATASETS[val].tmax = DATASETS[val].t_start + (DATASETS[val].t_end - DATASETS[val].t_start)*DATASETS[val].slid_vals[1];
		let VALUED_OLD = [...VALUED];
		if(document.getElementById(val+"_c").checked && DATASETS[val].initialised && DATASETS[val].fixs.length > 0 && DATASETS[val].included){ 
			VALUED.push(val); 
			
			if(JSON.stringify(VALUED) == JSON.stringify(VALUED_OLD)){
				make_note_dataset_selectors(); matrix_changed = true;
			}
		}
	}
	if(update_metrics) {compute_all_metrics(); update_metrics = false; }
	if(update_legend){ make_dynamic_legend(); update_legend = false; }

	if(document.getElementById('mylist').childElementCount != prev_count){
		prev_count = document.getElementById('mylist').childElementCount;
		make_note_dataset_selectors();
	}
	
	update_group_colors();

	//rebuild twi list
	order_twis = []; 
	TWILISTID = [];
	for(var i=0; i<base_twis.length; i++){ base_twis[i].included = ( document.getElementById("twi_"+i)!=undefined ); }
	for(let i=0;i<document.getElementById('twilist').children.length;i++){
		let v = parseInt( document.getElementById('twilist').children[i].id.substring(4) );
		let twi_name_before = base_twis[v].name;
		let toi_name = document.getElementById(v+'_twi_name').value;
		
		TWILISTID[i] = v;

		toi_name = toi_name.trim();

		if(toi_name != null && toi_name != undefined && twi_name_before != toi_name && /^[a-zA-Z0-9-_()]+$/.test(toi_name)) {
			update_toi_name(v, toi_name);
			base_twis[v].name = toi_name;
			
			matrix_changed = true;
		}
		else {
			document.getElementById(v+'_twi_name').value = twi_name_before;
		}
		
		base_twis[v].checked = document.getElementById('twi_'+v+'_c').checked;
		let groupnum = parseInt(document.getElementById(v+"_twigroup").value);
		if(groupnum > TWIS_COLOURS.length) {
			groupnum = TWIS_COLOURS.length
			document.getElementById(v+"_twigroup").value = groupnum;
		}
			
		if(base_twis[v].group != groupnum){
			base_twis[v].group = groupnum;
			midground_changed=true;timeline_changed=true;matrix_changed = true;	
			update_twi_colors();
		}

		if(base_twis[v].included && base_twis[v].checked){
			order_twis.push( v );			
		}
	}
	
	//update matrix reordering dropdown 
	var matrixrowcolnames = MATRIX_VIEW_STATE.split("_");
	if(matrixrowcolnames != null && matrixrowcolnames != undefined && matrixrowcolnames.length == 2 && matrixrowcolnames[0] == matrixrowcolnames[1]) {
		document.getElementById("reverse_cuthill_mckee_order").style.display = "block";
		document.getElementById("pca_order").style.display = "block";		
	}
	else {
		if(document.getElementById('sort_dropdown').value == "reverse_cuthill_mckee_order" || document.getElementById('sort_dropdown').value == "pca_order")
			document.getElementById('sort_dropdown').value = 'No_sort';
		document.getElementById("reverse_cuthill_mckee_order").style.display = "none";
		document.getElementById("pca_order").style.display = "none";		
	}	
	//update matrix data selection dropdown
	if(MATRIX_VIEW_STATE.length > 0 && VALUED.length > 0 && order_twis.length > 0 && lenses.length > 0) {
		document.getElementById('sort_button').style.display = "inline";
		
		if(MATRIX_VIEW_STATE != 'dat_dat' && MATRIX_VIEW_STATE != 'grp_grp' && MATRIX_VIEW_STATE != 'dat_aoi' && MATRIX_VIEW_STATE != 'aoi_dat' 
			&& MATRIX_VIEW_STATE != 'grp_aoi' && MATRIX_VIEW_STATE != 'aoi_grp'
			&& MATRIX_VIEW_STATE != 'dat_lensegroup' && MATRIX_VIEW_STATE != 'lensegroup_dat'
			&& MATRIX_VIEW_STATE != 'grp_lensegroup' && MATRIX_VIEW_STATE != 'lensegroup_grp'
			&& MATRIX_VIEW_STATE != 'grp_dat' && MATRIX_VIEW_STATE != 'dat_grp') {
				document.getElementById("dat_mode").style.display =	"inline";
		}
		
		if(MATRIX_VIEW_STATE != 'toi_toi' && MATRIX_VIEW_STATE != 'twigroup_twigroup' && MATRIX_VIEW_STATE != 'toi_aoi' && MATRIX_VIEW_STATE != 'aoi_toi' 
			&& MATRIX_VIEW_STATE != 'twigroup_aoi' && MATRIX_VIEW_STATE != 'aoi_twigroup'
			&& MATRIX_VIEW_STATE != 'toi_lensegroup' && MATRIX_VIEW_STATE != 'lensegroup_toi'
			&& MATRIX_VIEW_STATE != 'twigroup_lensegroup' && MATRIX_VIEW_STATE != 'lensegroup_twigroup') {
				document.getElementById("twi_mode").style.display =	"inline";
		}		
	}
	else {
		document.getElementById('sort_button').style.display = "none";
	}	
	
	if( BACK_BRIGHT != parseFloat(document.getElementById("back_sl").noUiSlider.get())){
		BACK_BRIGHT = parseFloat(document.getElementById("back_sl").noUiSlider.get());
		background_changed = true;
	}
	if( max_dist != parseFloat(document.getElementById("maxdist_sl").noUiSlider.get())){
		max_dist = parseFloat(document.getElementById("maxdist_sl").noUiSlider.get());
		document.getElementById("maxdist_val").innerHTML = max_dist +" Pixels";
	}
	if( min_time != parseFloat(document.getElementById("mintime_sl").noUiSlider.get())){
		min_time = parseFloat(document.getElementById("mintime_sl").noUiSlider.get());
		document.getElementById("mintime_val").innerHTML = min_time +" ms";
	}
	if( TIMELINE_MOUSEOVER_WINDOW != parseFloat(document.getElementById("timewidth").value) ){
		TIMELINE_MOUSEOVER_WINDOW = parseFloat(document.getElementById("timewidth").value);
	}
	if( FIX_SIZE != parseFloat(document.getElementById("fix_size_sl").noUiSlider.get())){
		FIX_SIZE = parseFloat(document.getElementById("fix_size_sl").noUiSlider.get());
		background_changed = SHOW_FIX;
	}
	if( FIX_ALPHA != parseFloat(document.getElementById("fix_alpha_sl").noUiSlider.get())){
		FIX_ALPHA = parseFloat(document.getElementById("fix_alpha_sl").noUiSlider.get());
		background_changed = SHOW_FIX;
	}
	if( TOPO_SOFTEN != parseFloat(document.getElementById("topo_sl").noUiSlider.get())){
		TOPO_SOFTEN = parseFloat(document.getElementById("topo_sl").noUiSlider.get());
		update_topos = true; background_changed = SHOW_TOPO;
	}
	if( TOPO_SHAPE != document.getElementById("topo_shape").value ){
		TOPO_SHAPE = document.getElementById("topo_shape").value;
		update_topos = true; background_changed = SHOW_TOPO;
	}
	if(DEFAULT_SYMMETRIC_SORT != document.getElementById("sort_dropdown").value ){
		//check if data is already loaded before sorting
		var bReady = true;
		if(MATRIX_VIEW_STATE.indexOf("toi") > -1 && matrix_values.length > 0 && matrix_values.length != order_twis.length) {
			bReady = false;
		}
		if(MATRIX_VIEW_STATE.indexOf("aoi") > -1 && matrix_values.length > 0 && matrix_values[0].length != lenses.length) {
			bReady = false;
		}
		if(MATRIX_VIEW_STATE.indexOf("lensegroup") > -1 && matrix_values.length > 0 && matrix_values[0].length != ORDERLENSEGROUPIDARRAYINDEX.length) {
			bReady = false;
		}
		if(MATRIX_VIEW_STATE.indexOf("grp") > -1) {
			if(matrix_values.length > 0 && (matrix_values.length != ORDERGROUPIDARRAYINDEX.length))
				bReady = false;
		}
		if(MATRIX_VIEW_STATE.indexOf("dat")>-1 && MATRIX_VIEW_STATE.indexOf("aoi")>-1) {
			if(matrix_values.length > 0 && (matrix_values.length != VALUED.length || matrix_values[0].length != lenses.length))
				bReady = false;
		}
		else if(MATRIX_VIEW_STATE.indexOf("dat_dat")>-1 && matrix_values.length > 0) {
			let tmp_matrix_values = [];
			// fetch the comparison data table			
			for(let a=0; a<VALUED.length; a++){
				tmp_matrix_values.push([]); 
				for(let b=0; b<VALUED.length; b++){
					tmp_matrix_values[a].push( DAT_COMPARE[a][b] );
				}
			}
			if(JSON.stringify(tmp_matrix_values)!=JSON.stringify(matrix_values))
				bReady = false;
		}
		if(bReady && NUM_RETRY_BEFORE_DATA_LOADED >= 2) {
			DEFAULT_SYMMETRIC_SORT = document.getElementById("sort_dropdown").value;
			reorder_matrix(DEFAULT_SYMMETRIC_SORT);
			NUM_RETRY_BEFORE_DATA_LOADED = 0;
		}			
		else {
			NUM_RETRY_BEFORE_DATA_LOADED++;			
		}			
	}
	if( FORE_SIZE != parseFloat(document.getElementById("fore_size_sl").noUiSlider.get())){
		FORE_SIZE = parseFloat(document.getElementById("fore_size_sl").noUiSlider.get());
		foreground_changed = true; 
	}
	if( !TIMELINE_SLIDER_DISABLED && TIME_ANIMATE != parseFloat(document.getElementById("time_animate_sl").noUiSlider.get())){
		TIME_ANIMATE = parseFloat(document.getElementById("time_animate_sl").noUiSlider.get());

		//update video with the time
		if(VIDEO_LINKING && selected_data != -1 && DATASETS[selected_data] != null && DATASETS[selected_data] != undefined && 
			currentVideoObj != null && currentVideoObj != undefined) {
				
			//get time from dataset
			let data = DATASETS[selected_data]; toi = data.tois[ data.toi_id ];
			let longest_duration = data.tmax - data.tmin;
			let ts = 0;

			if(lenses.length == 0){
				for(let j = toi.j_min; j < toi.j_max && (data.fixs[j].t - data.tmin)/longest_duration < TIME_ANIMATE; j++){
					if(data.fixs[j].t - data.tmin < 0)
						ts = 0;
					else
						ts = (TimeLine.width*(data.fixs[j].t - data.tmin))/longest_duration;					
				}
			}
			//set video time
			VIDEOS[selected_data].videoobj.time((ts*VIDEOS[selected_data].videoobj.duration())/TimeLine.width);
		}
		background_changed = true; timeline_changed = true;
	}else if( TIME_PLAY && TIME_ANIMATE < 1.0 ){
		if(VIDEO_LINKING && selected_data != -1 && VIDEOS[selected_data] != null && VIDEOS[selected_data] != undefined && 
			currentVideoObj != null && currentVideoObj != undefined) {
			
			TIME_ANIMATE = Math.min( 1.0, TIME_ANIMATE + 0.01/100 );
			document.getElementById("time_animate_sl").noUiSlider.set( TIME_ANIMATE );
		}
		else {
			TIME_ANIMATE = Math.min( 1.0, TIME_ANIMATE + 0.01 );
			document.getElementById("time_animate_sl").noUiSlider.set( TIME_ANIMATE );		
		}
		background_changed = true; timeline_changed = true;
	}
	if( SACC_BRIGHT != parseFloat(document.getElementById("sacc_bright_sl").noUiSlider.get())){
		SACC_BRIGHT = parseFloat(document.getElementById("sacc_bright_sl").noUiSlider.get());
		midground_changed = SHOW_SACCADE;
	}
	if( SACC_BLUR != parseFloat(document.getElementById("sacc_blur_sl").noUiSlider.get())){
		SACC_BLUR = parseFloat(document.getElementById("sacc_blur_sl").noUiSlider.get());
		midground_changed = SHOW_SACCADE;
	}
	if( SHORT_LENGTH != parseFloat(document.getElementById("short_sl").noUiSlider.get()) ){
		SHORT_LENGTH = parseFloat(document.getElementById("short_sl").noUiSlider.get());
		document.getElementById("short_val").innerHTML = SHORT_LENGTH +" Pixels";
		midground_changed = true;
	}
	if( NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING != parseInt(document.getElementById("number_saccades_being_considered_in_bundling").innerHTML) ){
		document.getElementById("number_saccades_being_considered_in_bundling").innerHTML = NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING;
	}
	if (MATRIX_MINIMAP != document.getElementById("matrix_minimap").checked){
		MATRIX_MINIMAP = document.getElementById("matrix_minimap").checked;
		matrix_redraw = true;
	}
	//getting colour mode
	var radios = document.getElementsByName('Colour');
	for (var i = 0, length = radios.length; i < length; i++) {
	  if (radios[i].checked) {
		if(COLOUR_MODE != radios[i].value){ COLOUR_MODE = radios[i].value; midground_changed = true; make_dynamic_legend(); }
		break;
	  }
	}
	
	BUNDLE_K = Math.exp(parseFloat(document.getElementById("K_sl").noUiSlider.get())); // rigidity
	BUNDLE_H = Math.exp(parseFloat(document.getElementById("H_sl").noUiSlider.get())); // heat
	
	rowtoi = document.getElementById("row_toi").classList;
	if( rowtoi.value.includes("greyed_out") != (selected_data == -1 || order_twis.length < 2) ){ rowtoi.toggle("greyed_out"); }
	rowtoi = document.getElementById("row_twigroup").classList;
	if( rowtoi.value.includes("greyed_out") != (selected_data == -1 || order_twis.length < 2) ){ rowtoi.toggle("greyed_out"); }
	coltoi = document.getElementById("col_toi").classList;
	if( coltoi.value.includes("greyed_out") != (selected_data == -1 || order_twis.length < 2) ){ coltoi.toggle("greyed_out"); }
	coltoi = document.getElementById("col_twigroup").classList;
	if( coltoi.value.includes("greyed_out") != (selected_data == -1 || order_twis.length < 2) ){ coltoi.toggle("greyed_out"); }
	rowgrp = document.getElementById("row_grp").classList;
	if( rowgrp.value.includes("greyed_out") == MULTI_GROUPS ){ rowgrp.toggle("greyed_out"); }
	colgrp = document.getElementById("col_grp").classList;
	if( colgrp.value.includes("greyed_out") == MULTI_GROUPS ){ colgrp.toggle("greyed_out"); }
	rowdat = document.getElementById("row_dat").classList;
	if( rowdat.value.includes("greyed_out") != (DATASETS.length==0) ){ rowdat.toggle("greyed_out"); }
	coldat = document.getElementById("col_dat").classList;
	if( coldat.value.includes("greyed_out") != (DATASETS.length==0) ){ coldat.toggle("greyed_out"); }
	rowaoi = document.getElementById("row_aoi").classList;
	if( rowaoi.value.includes("greyed_out") != (lenses.length==0) ){ rowaoi.toggle("greyed_out"); }
	colaoi = document.getElementById("col_aoi").classList;
	if( colaoi.value.includes("greyed_out") != (lenses.length==0) ){ colaoi.toggle("greyed_out"); }
	rowaoi = document.getElementById("row_lensegroup").classList;
	if( rowaoi.value.includes("greyed_out") != (lenses.length==0) ){ rowaoi.toggle("greyed_out"); }
	colaoi = document.getElementById("col_lensegroup").classList;
	if( colaoi.value.includes("greyed_out") != (lenses.length==0) ){ colaoi.toggle("greyed_out"); }
	
	if(image_changed){
		rebuild_clustering();
	}

	//KT: temporary fix for the bug where no grouping is loaded yet from zip file
	try{
		for(let a=0; a<ORDERGROUPIDARRAYINDEX.length; a++){ 
			if(!Number.isNaN(GROUPS[ORDERGROUPIDARRAYINDEX[a]].group))
				if(rownames.length > 1)
					MULTI_GROUPS = true;						
		}		
	}catch(e){
		
		if(matrix_changed_retry < 10) {
			matrix_changed = true;
			matrix_changed_retry++;
		}			
		if(e instanceof SyntaxError)
			console.log(e);
	}
}
// for changes to cropping from fields not mouse click
function crop_resize(){
	if(WIDTH != parseFloat(document.getElementById('WIDTH').value)){
		WIDTH = parseFloat(document.getElementById('WIDTH').value);
		WIDTH = Math.ceil(Math.max(0, Math.min((spatial_width * inv_ratio)+OFFSET_X, OFFSET_X+WIDTH) - Math.max(0, Math.min(spatial_width * inv_ratio, OFFSET_X))));
		document.getElementById('WIDTH').value = WIDTH;
		background_changed = true; crop_resized = true;
		crop_stack.push( [OFFSET_X, OFFSET_Y, WIDTH, HEIGHT, limit_select] );
		data_resize();
	}
	if(HEIGHT != parseFloat(document.getElementById('HEIGHT').value)){
		HEIGHT = parseFloat(document.getElementById('HEIGHT').value);
		HEIGHT = Math.ceil(Math.max(0, Math.min((spatial_height * inv_ratio)+OFFSET_Y, OFFSET_Y+HEIGHT) - Math.max(0, Math.min(spatial_height * inv_ratio, OFFSET_Y))));	
		document.getElementById('HEIGHT').value = HEIGHT;
		background_changed = true; crop_resized = true;
		crop_stack.push( [OFFSET_X, OFFSET_Y, WIDTH, HEIGHT, limit_select] );
		data_resize();
	}
	if(OFFSET_X != parseFloat(document.getElementById('OFFSET_X').value)){
		OFFSET_X = parseFloat(document.getElementById('OFFSET_X').value);
		OFFSET_X = Math.ceil(Math.max(0, Math.min(spatial_width * inv_ratio, OFFSET_X)));
		document.getElementById('OFFSET_X').value = OFFSET_X;
		background_changed = true; crop_resized = true;
		crop_stack.push( [OFFSET_X, OFFSET_Y, WIDTH, HEIGHT, limit_select] );
		data_resize();
	}
	if(OFFSET_Y != parseFloat(document.getElementById('OFFSET_Y').value)){
		OFFSET_Y = parseFloat(document.getElementById('OFFSET_Y').value);
		OFFSET_Y = Math.ceil(Math.max(0, Math.min(spatial_height * inv_ratio, OFFSET_Y)));
		document.getElementById('OFFSET_Y').value = OFFSET_Y;
		background_changed = true; crop_resized = true;
		crop_stack.push( [OFFSET_X, OFFSET_Y, WIDTH, HEIGHT, limit_select] );
		data_resize();
	}
}
function reset_crop(){
	if( crop_stack.length == 0){ return; }
	var reset = crop_stack[0];
	OFFSET_X = reset[0]; OFFSET_Y = reset[1]; WIDTH = reset[2]; HEIGHT = reset[3]; limit_select = reset[4];
	crop_stack = [reset];
	document.getElementById('OFFSET_X').value = OFFSET_X;
	document.getElementById('OFFSET_Y').value = OFFSET_Y;
	document.getElementById('WIDTH').value = WIDTH;
	document.getElementById('HEIGHT').value = HEIGHT;
	data_resize();
	crop_resized = true; background_changed = true; image_changed=true;
}
function undo_crop(){
	if( crop_stack.length == 0){ return; 
	} else if ( crop_stack.length > 1 ){ 
		var last = crop_stack[ crop_stack.length - 1 ];
		OFFSET_X = last[0]; OFFSET_Y = last[1]; WIDTH = last[2]; HEIGHT = last[3]; limit_select = last[4];
		document.getElementById('OFFSET_X').value = OFFSET_X;
		document.getElementById('OFFSET_Y').value = OFFSET_Y;
		document.getElementById('WIDTH').value = WIDTH;
		document.getElementById('HEIGHT').value = HEIGHT;
		if( crop_stack.length == 2){ image_changed=true; }
		if( crop_stack.length > 1){ crop_stack.pop(); }
		data_resize();
		crop_resized = true; background_changed = true; 
	}
}
// view collapsibles
function collapse(id){
	panels = document.getElementsByClassName('collapsing');
	for(var i=0; i<panels.length; i++){
		v = panels[i];
		if(v.id == 'part'+id){ v.style.display = 'block'; }else{ v.style.display = 'none'; }
	}
	panels = document.getElementsByClassName('tabbut2');
	for(var i=0; i<panels.length; i++){
		v = panels[i];
		if(v.id == 'tab'+id){ v.style.backgroundColor = 'lightblue'; }else{ v.style.backgroundColor = '#EEE'; }
	}
}
// view panels
function view_panel(id){
	panels = document.getElementsByClassName('data_content');
	for(var i=0; i<panels.length; i++){
		v = panels[i];
		if(v.id == 'cont'+id){ v.style.display = 'block'; }else{ v.style.display = 'none'; }
		if(id == 5 || id == 6) {//colour danel
			v.style["overflow-y"] = "auto";			
		}		
	}
	if(id == 3 && CONTROL_STATE != 'aoi')
		control_state('aoi');
	else if(id == 4 && CONTROL_STATE != 'notes')
		control_state('notes');
	
	panels = document.getElementsByClassName('tabbut');
	for(var i=0; i<panels.length; i++){
		v = panels[i];
		if(v.id == 'cont'+id+'_button'){ v.style.backgroundColor = '#CCC'; }else{ v.style.backgroundColor = '#EEE'; }
	}	
}
function click_shortcut(shortcutname){
	if(shortcutname == "aoi_sequence_shortcut") {
		collapse(3);
		view_panel(3);
		click_time('lens');
		if(!SHOW_SACCADE)
			click_sacs();
		if(!SHOW_TOPO)
			click_topo();
		click_lense_mode();
		timeline_changed = true;
	}
	else if(shortcutname == "saccade_distribution_shortcut") {
		collapse(2);
		view_panel(1);
		click_time('group');
		if(mat_type!='hist')
			type_select('hist');
		if(!SHOW_SACCADE)
			click_sacs();
		if(SHOW_TOPO)
			click_topo();	
		timeline_changed = true;
	}
	else if(shortcutname == "aoi_fixation_mode_shortcut") {
		collapse(1);
		view_panel(1);
		//open density map
		if(SHOW_SACCADE)
			click_sacs();
		if(!SHOW_TOPO)
			click_topo();
		click_time('group');
		timeline_changed = true;
	}
	else if(shortcutname == "report_mode_shortcut") {
		collapse(3);
		view_panel(4);		
		click_time('data');
		timeline_changed = true;
	}	
}
function click_lense_mode(){
	let current_lense_mode = document.getElementsByClassName("lense_mode")[0].innerHTML;
	if( current_lense_mode.indexOf("Selected AOI Group")>-1){
		LENSE_MODE = 1; 
		if(selected_lens > -1)
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI: " + base_lenses[selected_lens].name;	
		else
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI";	
	}
	else if( current_lense_mode.indexOf("Selected AOI")>-1){
		LENSE_MODE = 0; 
		if(selected_lensegroup > -1)
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI Group: "+ selected_lensegroup;	
		else
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI Group";	
	}
	collapse(3);
	view_panel(3);
	click_time('lens');
	timeline_changed = true;
}
function update_lense_mode(){
	if(LENSE_MODE == 1){
		if(selected_lens > -1)
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI: " + base_lenses[selected_lens].name;	
		else
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI";	
	}
	else if(LENSE_MODE == 0) {
		if(selected_lensegroup > -1)
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI Group: "+ selected_lensegroup;	
		else
			document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI Group";	
	}
}
function click_twi_mode(){
	let current_twi_mode = document.getElementsByClassName("twi_mode")[0].innerHTML;
	if( current_twi_mode == "All TWIs" ){
		TWI_MODE = 1; 
		if(selected_twigroup > -1)
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI Group: "+selected_twigroup;	
		else
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI Group";	
	}
	else if( current_twi_mode.indexOf("Selected TWI Group")> -1){
		TWI_MODE = 2; 
		if(selected_twi > -1 && selected_twi < base_twis.length)
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI: "+base_twis[selected_twi].name;
		else
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI";	
	}
	else if( current_twi_mode.indexOf("Selected TWI")>-1){
		TWI_MODE = 0; 
		document.getElementsByClassName("twi_mode")[0].innerHTML =	"All TWIs";	
		let count = base_twis.length;
		if(count > 1) {
			count = 0;
			for(let i = 1; i< base_twis.length; i++)
				if(base_twis[i].included && base_twis[i].checked)
					count++;
			//uncheck "All" in TWI tab on this occasion when there is more than the default All TWI, so there is no overlapping intervals by default.			
			if(count > 0 && base_twis[0].checked) 
				check_main_twi();			
		}
	}
	view_panel(2);
	background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed = SHOW_SACCADE; 
	matrix_changed=true;foreground_changed=true;timeline_changed = true;
}
function update_twi_mode(){
	if(TWI_MODE == 1){
		if(selected_twigroup > -1)
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI Group: "+selected_twigroup;	
		else
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI Group";	
	}
	else if(TWI_MODE == 2){
		if(selected_twi > -1 && selected_twi < base_twis.length)
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI: "+base_twis[selected_twi].name;
		else
			document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI";	
	}
}
function click_dat_mode(){
	let current_dat_mode = document.getElementsByClassName("dat_mode")[0].innerHTML;
	let display_str = "";
	if( current_dat_mode == "All Samples" ){
		DAT_MODE = 1; 
		if(selected_grp > -1)
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample Group: "+selected_grp;	
		else
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample Group";			
	}
	else if( current_dat_mode.indexOf("Selected Sample Group") > -1){
		DAT_MODE = 2; 
		if(selected_data > -1 && selected_data < DATASETS.length)
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample: "+DATASETS[selected_data].name;
		else
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample";	
	}
	else if( current_dat_mode.indexOf("Selected Sample") > -1){
		DAT_MODE = 0; 
		document.getElementsByClassName("dat_mode")[0].innerHTML =	"All Samples";	
	}
	view_panel(1);
	background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed = SHOW_SACCADE; 
	matrix_changed=true;foreground_changed=true;	
}
function update_dat_mode(){
	if(DAT_MODE == 1) {
		if(selected_grp > -1)
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample Group: "+selected_grp;	
		else
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample Group";	
	}
	else if(DAT_MODE == 2) {
		if(selected_data > -1 && selected_data < DATASETS.length)
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample: "+DATASETS[selected_data].name;
		else
			document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample";	
	}
}
function select_fix(id){
	SACC_FILTER=id; midground_changed=true;
}
function dir_filter(middle){
	foreground_changed = true;
	if(middle){
		var mid = document.getElementById('dall').checked;
		for(var i=0;i<8;i++){ document.getElementById('d'+ i).checked = mid; }	
	}
}
function click_fixs(){
	document.getElementById('fixs').classList.toggle( 'toggle-on' );
	SHOW_FIX = document.getElementById('fixs').classList.value.includes('toggle-on');
	if( SHOW_FIX ){document.getElementById('fixs').innerHTML = "Fixations: Shown"}
	else{document.getElementById('fixs').innerHTML = "Fixations: Hidden"}
	background_changed = true;
	
	document.getElementById('fix_controls').style.display = display( SHOW_FIX );
	make_dynamic_legend();
}
function click_topo(){
	document.getElementById('topo').classList.toggle( 'toggle-on' );
	SHOW_TOPO = document.getElementById('topo').classList.value.includes('toggle-on');
	if( SHOW_TOPO ){document.getElementById('topo').innerHTML = "Saliency maps: Shown";}
	else{document.getElementById('topo').innerHTML = "Saliency maps: Hidden";}
	background_changed = true;
	document.getElementById('topo_controls').style.display = display( SHOW_TOPO );
	make_dynamic_legend();
}
function click_sacs(){
	document.getElementById('sacs').classList.toggle( 'toggle-on' );
	SHOW_SACCADE = document.getElementById('sacs').classList.value.includes('toggle-on');
	if( SHOW_SACCADE ){document.getElementById('sacs').innerHTML = "Saccades: Shown"}
	else{document.getElementById('sacs').innerHTML = "Saccades: Hidden"}
	midground_changed = true;
	document.getElementById('saccade_controls').style.display = display( SHOW_SACCADE );
	document.getElementById('sacc_export_button').style.display = display( SHOW_SACCADE );
	make_dynamic_legend();
}
function click_time(val){
	TIME_DATA = val;
	if( (TIME_DATA=='data') != document.getElementById('timedata').classList.value.includes('toggle-on') ){ document.getElementById('timedata').classList.toggle('toggle-on') ; }
	if( (TIME_DATA=='lens') != document.getElementById('timelens').classList.value.includes('toggle-on') ){ document.getElementById('timelens').classList.toggle('toggle-on') ; }
	if( (TIME_DATA=='saccades') != document.getElementById('timesaccades').classList.value.includes('toggle-on') ){ document.getElementById('timesaccades').classList.toggle('toggle-on') ; }
	if( (TIME_DATA=='saccadetype') != document.getElementById('timesaccadetype').classList.value.includes('toggle-on') ){ document.getElementById('timesaccadetype').classList.toggle('toggle-on') ; }	
	if( (TIME_DATA=='all') != document.getElementById('timeall').classList.value.includes('toggle-on') ){ document.getElementById('timeall').classList.toggle('toggle-on') ; }
	if( (TIME_DATA=='group') != document.getElementById('timegroup').classList.value.includes('toggle-on') ){ document.getElementById('timegroup').classList.toggle('toggle-on') ; }
	update_lens_colors();
	timeline_changed = true;
}
function click_relativetime(){
	document.getElementById('relativetime').classList.toggle( 'toggle-on' );
	USE_RELATIVE = document.getElementById('relativetime').classList.value.includes('toggle-on');
	timeline_changed = true;
}
function click_timestrat(){
	document.getElementById('cumulativetime').classList.toggle( 'toggle-on' );
	REMOVE_GAPS = document.getElementById('cumulativetime').classList.value.includes('toggle-on');
	if( REMOVE_GAPS ){ TIME_STRAT='cumulative';}
	else{TIME_STRAT='real'}
	rebuild_clustering();
	timeline_changed = true;background_changed = true; matrix_changed = true; 
}
function click_time_play(){
	document.getElementById('time_play').classList.toggle( 'toggle-on' );
	TIME_PLAY = document.getElementById('time_play').classList.value.includes('toggle-on');
	background_changed = true;

	if (TIME_PLAY) {
		TIMELINE_SLIDER_DISABLED = true;
		document.getElementById("time_animate_sl").setAttribute('disabled', true);
	}		
	else {
		TIMELINE_SLIDER_DISABLED = false;
		document.getElementById("time_animate_sl").removeAttribute('disabled');
	}
		
		
	if(TIME_PLAY && VIDEO_LINKING && selected_data != -1 && DATASETS[selected_data] != null && DATASETS[selected_data] != undefined && 
		currentVideoObj != null && currentVideoObj != undefined) {

		//set video time according to the slider
		VIDEOS[selected_data].videoobj.loop();
		
	}
	else if(!TIME_PLAY && VIDEO_LINKING && selected_data != -1 && VIDEOS[selected_data] != null && VIDEOS[selected_data] != undefined && 
		currentVideoObj != null && currentVideoObj != undefined) {
		VIDEOS[selected_data].videoobj.pause();
		let timelinetime = TT(Math.floor(VIDEOS[selected_data].videoobj.time()*1000));
		document.getElementById("time_animate_sl").noUiSlider.set( parseFloat(timelinetime/TimeLine.width).toFixed(2) );
	}
}
function click_size(){
	document.getElementById('foresize').classList.toggle( 'toggle-on' );
	USE_SIZE = document.getElementById('foresize').classList.value.includes('toggle-on');
	foreground_changed = true;
}
function click_fore(val){
	if( SHOW_FORE == val ){ SHOW_FORE = ""; }
	else{ SHOW_FORE = val; }
	if( (SHOW_FORE == "spatial") != (document.getElementById('fore').classList.value.includes( 'toggle-on' )) ){ document.getElementById('fore').classList.toggle( 'toggle-on' ); }
	if( (SHOW_FORE == "lens") != (document.getElementById('lenshist').classList.value.includes( 'toggle-on' )) ){ document.getElementById('lenshist').classList.toggle( 'toggle-on' ); }
	if( (SHOW_FORE == "time") != (document.getElementById('timehist').classList.value.includes( 'toggle-on' )) ){ document.getElementById('timehist').classList.toggle( 'toggle-on' ); }
	document.getElementById('foreground_controls').style.display = display(SHOW_FORE != "" );
	foreground_changed = true;
	make_dynamic_legend();
}
function click_showlens(){
	document.getElementById('showlens').classList.add( 'toggle-on' );
	SHOW_LENS = document.getElementById('showlens').innerHTML.includes("slash");
	if( SHOW_LENS ){
		document.getElementById('showlens').innerHTML = " <i class='fas fa-eye'></i>  ";
		for(var i=0; i<base_lenses.length; i++){
			if(base_lenses[i].included) {
				document.getElementById('lens_'+i+'_c').innerHTML='<i class="fas fa-eye"></i>';
				document.getElementById('lens_'+i+'_c').checked=true;
			}			
		}
	}else{
		document.getElementById('showlens').innerHTML = " <i class='fas fa-eye-slash'></i> ";
		for(var i=0; i<base_lenses.length; i++){
			if(base_lenses[i].included) {
				document.getElementById('lens_'+i+'_c').innerHTML='<i class="fas fa-eye-slash"></i>';
				document.getElementById('lens_'+i+'_c').checked=false;
			}			
		}
	}
}
function click_showlabel(){
	document.getElementById('show_lenslabel').classList.toggle( 'toggle-on' );
	SHOW_LENSLABEL = document.getElementById('show_lenslabel').classList.value.includes('toggle-on');
	foreground_changed = true;
}
function click_showtwis(){
	document.getElementById('showtwis').classList.add( 'toggle-on' );
	var hidden = document.getElementById('showtwis').innerHTML.includes("slash");
	if( hidden ){
		document.getElementById('showtwis').innerHTML = " <i class='fas fa-eye'></i>  ";
		for(var i=0; i<base_twis.length; i++){
			if(base_twis[i].included) {
				document.getElementById('twi_'+i+'_c').innerHTML='<i class="fas fa-eye"></i>';
				document.getElementById('twi_'+i+'_c').checked=true;
			}			
		}
	}else{
		document.getElementById('showtwis').innerHTML = " <i class='fas fa-eye-slash'></i> ";
		for(var i=0; i<base_twis.length; i++){
			if(base_twis[i].included) {
				document.getElementById('twi_'+i+'_c').innerHTML='<i class="fas fa-eye-slash"></i>';
				document.getElementById('twi_'+i+'_c').checked=false;
			}			
		}
	}
}
function not_all_eye(id){
	document.getElementById(id).innerHTML = " <i class='fas fa-eye'></i>  "
	document.getElementById(id).classList.remove( 'toggle-on' );
}
function click_notes(){
	SHOW_NOTES = document.getElementById('notes').innerHTML.includes( "slash" );
	if( SHOW_NOTES ){document.getElementById('notes').innerHTML = " <i class='fas fa-eye'></i> "}
	else{document.getElementById('notes').innerHTML = " <i class='fas fa-eye-slash'></i> "}
}
function control_state(val){
	if( CONTROL_STATE == val ){ CONTROL_STATE = ""; }
	else{ CONTROL_STATE = val; }
	if( (CONTROL_STATE == "notes") != (document.getElementById('control_notes').classList.value.includes( 'toggle-on' )) ){ document.getElementById('control_notes').classList.toggle( 'toggle-on' ); }
	if( (CONTROL_STATE == "aoi") != (document.getElementById('control_aoi').classList.value.includes( 'toggle-on' )) ){ document.getElementById('control_aoi').classList.toggle( 'toggle-on' ); }
	if( (CONTROL_STATE == "crop") != (document.getElementById('control_crop').classList.value.includes( 'toggle-on' )) ){ document.getElementById('control_crop').classList.toggle( 'toggle-on' ); }
}
function click_bundle(){
	document.getElementById('bundle').classList.toggle( 'toggle-on' );
	DO_BUNDLE = document.getElementById('bundle').classList.value.includes('toggle-on');
	if(DO_BUNDLE & !is_bundling){bundle();}
	else {
		document.getElementById("saccades_bundling_status_txt").innerHTML = "Bundling stopped.";
	}
}

function click_loadfile(){
	if(DATASETS.length !=0){ //ask only when the project is not blank
		var r=confirm("Loading a new project will erase the existing project. Do you want to go ahead?");
		if(r){
			document.getElementById('state_f').click();
		}
	}else{
		document.getElementById('state_f').click();
	}
}

function click_load_toi_list(val){
	var r=confirm("Loading a new TOI will overide the existing TOIs. Do you want to go ahead?");
	if(r){
		document.getElementById(val + '_toi_f').click();
	}
}
// lens creation type controls
function select_lenstype(id){
	new_lens_mode = lens_type_list[id];
	for(var i=0; i<lens_type_list.length; i++){
		control = document.getElementById('lenstype_'+i);
		if( control.classList.value.includes('toggle-on') != (i==id) ){
			control.classList.toggle( 'toggle-on' );
		}
	}
}
TIME_CONTROL = true;
function click_timecontrols(){
	document.getElementById('time_control').classList.toggle( 'toggle-on' );
	TIME_CONTROL = document.getElementById('time_control').classList.value.includes('toggle-on');
	style = document.getElementById("dynamic_stylesheet");
	if( TIME_CONTROL ){ // data_item ; height: 90px;
		style.innerHTML = ".time_controls { display:inline;} .timebox{display:grid;}";
	}else{
		style.innerHTML = ".time_controls { display:none; } .timebox{display:none;}";
	}
}
TIME_CONTROL_CANVAS = true;
function click_timecontrolForCanvas(){
	document.getElementById('time_control_canvas').classList.add( 'toggle-on' );
	TIME_CONTROL_CANVAS = document.getElementById('time_control_canvas').innerHTML.includes("slash");
	if(TIME_CONTROL_CANVAS){
		for(let i=0;i<DATASETS.length;i++){
			document.getElementById('time_control_canvas').innerHTML = " <i class='fas fa-eye'></i>  "
			if(DATASETS[i].should_save !=false && DATASETS[i].included){
				document.getElementById(i+'_c').innerHTML='<i class="fas fa-eye"></i>';
				document.getElementById(i+'_c').checked=true;
			}	
		}
	}
	else{
		for(let i=0;i<DATASETS.length;i++){
			document.getElementById('time_control_canvas').innerHTML = " <i class='fas fa-eye-slash'></i> "
			if(DATASETS[i].should_save !=false && DATASETS[i].included){
				document.getElementById(i+'_c').innerHTML='<i class="fas fa-eye-slash"></i>';
				document.getElementById(i+'_c').checked=false;
			}
		}
	}
}
function not_all(){
	document.getElementById('time_control_canvas').innerHTML = " <i class='fas fa-eye'></i>  "
	document.getElementById('time_control_canvas').classList.remove( 'toggle-on' );
}
// matrix control function and data
mat_row_val = 'aoi'; mat_col_val = 'aoi'; mat_sel_type = 0; mat_options = ['aoi', 'dat', 'toi', 'grp', 'lensegroup', 'twigroup']; type_options = ['video', 'mat', 'hist'];
mat_type = "mat";
function type_select(val){
	mat_type = val;
	for(var i=0; i< type_options.length; i++){
		item = document.getElementById( 'type_'+type_options[i] ).classList;
		if( (type_options[i] == val) != item.value.includes('toggle-on')){ item.toggle( 'toggle-on' ); }
	}
	item = document.getElementById( 'matrix_top_controls' ).classList;
	if( (mat_type != 'mat') != item.value.includes('hidden')){ item.toggle( 'hidden' ); }
	item = document.getElementById( 'matrix_left_controls' ).classList;
	if( (mat_type != 'mat') != item.value.includes('hidden')){ item.toggle( 'hidden' ); }
	item = document.getElementById( 'hist_top_controls' ).classList;
	if( (mat_type != 'hist') != item.value.includes('hidden')){ item.toggle( 'hidden' ); }
	item = document.getElementById( 'video_top_controls' ).classList;
	if( (mat_type != 'video') != item.value.includes('hidden')){ item.toggle( 'hidden' ); }
	matrix_redraw = true;
}
function mat_row_select(val, from_zip=false){
	if( document.getElementById('row_'+val).classList.value.includes("greyed_out") && from_zip==false){return;}
	if( val == mat_row_val ){return;}
	
	mat_row_val = val; matrix_changed = true;
	for(var i=0; i< mat_options.length; i++){
		item = document.getElementById( 'row_'+mat_options[i] ).classList;
		if( (mat_options[i] == val) != item.value.includes('toggle-on')){ item.toggle( 'toggle-on' ); }
	}
	matrix_metric_update();
	//reset sort option and read whatever the drop down shows.
	DEFAULT_SYMMETRIC_SORT = "No_sort";
}
function mat_col_select(val, from_zip=false){
	if( document.getElementById('row_'+val).classList.value.includes("greyed_out") && from_zip==false){return;}
	if( val == mat_col_val ){return;}
	
	mat_col_val = val; matrix_changed = true;
	for(var i=0; i< mat_options.length; i++){
		item = document.getElementById( 'col_'+mat_options[i] ).classList;
		if( (mat_options[i] == val) != item.value.includes('toggle-on')){ item.toggle( 'toggle-on' ); }
	}
	matrix_metric_update();
	//reset sort option and read whatever the drop down shows.
	DEFAULT_SYMMETRIC_SORT = "No_sort";
}
function matrix_metric_update(){
	MATRIX_VIEW_STATE = mat_row_val + '_' + mat_col_val;
	if(MATRIX_VIEW_STATE.indexOf('dat_dat') >= 0) {
		mat_sel_type = 3;
		for(var i=0; i<4; i++){
			if( (i== mat_sel_type ) != document.getElementById('matsel_'+i).classList.value.includes('matsel_shown') ){
				document.getElementById('matsel_'+i).classList.toggle('matsel_shown');
			}
		}
	}else if(MATRIX_VIEW_STATE.indexOf('lensegroup') < 0) {
		mat_sel_type = (mat_row_val=='aoi') + (mat_col_val=='aoi');
		for(var i=0; i<4; i++){
			if( (i== mat_sel_type ) != document.getElementById('matsel_'+i).classList.value.includes('matsel_shown') ){
				document.getElementById('matsel_'+i).classList.toggle('matsel_shown');
			}
		}
	}
	else {
		mat_sel_type = (mat_row_val=='lensegroup' || mat_row_val=='aoi') + (mat_col_val=='lensegroup' || mat_col_val=='aoi');

		for(var i=0; i<4; i++){
			if( (i== mat_sel_type ) != document.getElementById('matsel_'+i).classList.value.includes('matsel_shown') ){
				document.getElementById('matsel_'+i).classList.toggle('matsel_shown');
			}
		}
	}	
	document.getElementById('matrix_minimap').style.display = ['none', 'inline-block'][(mat_sel_type==0 || mat_sel_type==3)+0];
	
	MATRIX_DATA_STATE = document.getElementById('metrics_' + mat_sel_type ).value;
	if(PREVIOUS_MATRIX_DATA_STATE != MATRIX_DATA_STATE) {
		//reset sort option and read whatever the drop down shows.
		DEFAULT_SYMMETRIC_SORT = "No_sort";
		PREVIOUS_MATRIX_DATA_STATE = MATRIX_DATA_STATE;		
	}
	if(MATRIX_DATA_STATE.indexOf('grid')==0 != document.getElementById('grid_num').classList.value.includes('matsel_shown') ){
		document.getElementById('grid_num').classList.toggle('matsel_shown');
	}
	matrix_changed = true; //matrix_redraw = true; // needs to update the comparison metrics
	make_dynamic_legend();
}
// matrix-based sorting functions
function reverse_if_sorted(sort_coef){
	is_sorted = true;
	for(var i=0; i<sort_coef.length - 1 && is_sorted; i++){
		if(sort_coef[i] > sort_coef[i+1]){ is_sorted = false; } 
	}
	if(is_sorted){ // if the list is already sorted, lets sort it reversed! (as in, the user double-clicked)
		sort_coef = sort_coef.reverse();  
	}
}
function fill_up_hidden_list_by_index(full_list, ordered_list, newlist, htmllist) {
	//fill in the hidden list from full_list but is not in ordered_list. This should be inserted.
	if(full_list.length > ordered_list.length) {
		for(let i = 0, VALUEDINDEX = 0, j = 0; i < full_list.length; i++){
			if(full_list[i] != ordered_list[VALUEDINDEX]) {
				newlist[ordered_list.length + j] = htmllist.childNodes[i];
				j++;
			}				
			else
				VALUEDINDEX++;
		}
	}
}
function fill_up_hidden_list_by_content(full_list, ordered_list, newlist, htmllist) {
	//fill in the hidden list from full_list but is not in ordered_list. This should be inserted.
	if(full_list.length > ordered_list.length) {
		for(let i = 0, VALUEDINDEX = 0, j = 0; i < full_list.length; i++){
			if(full_list[i] != ordered_list[VALUEDINDEX]) {
				newlist[ordered_list.length + j] = htmllist.childNodes[full_list[i]];
				j++;
			}				
			else
				VALUEDINDEX++;
		}
	}
}
function reorder_matrix(sort_type){
	if(matrix_values == undefined || matrix_values[0] == undefined) return;
	if(sort_type != 'No_sort'){sort_selected_name = '';}
	else
		return;
	var perm = [], row_perm = [], col_perm = [];
	if(sort_type == 'optimal_leaf_order'){
		var transpose = reorder.transpose(matrix_values),
		dist_rows = reorder.dist()(matrix_values),
		dist_cols = reorder.dist()(transpose),
		order = reorder.optimal_leaf_order(),
		row_perm = order.distanceMatrix(dist_rows)(matrix_values),
		col_perm = order.distanceMatrix(dist_cols)(transpose);		
		
	} else if (sort_type == 'reverse_cuthill_mckee_order'){
		if(MATRIX_VIEW_STATE == 'aoi_aoi' || MATRIX_VIEW_STATE == 'lensegroup_lensegroup'){
			var graph = reorder.mat2graph(matrix_values,true); 
			perm = reorder.reverse_cuthill_mckee_order(graph);
		}else if(MATRIX_VIEW_STATE == 'dat_dat' || MATRIX_VIEW_STATE == 'grp_grp' || MATRIX_VIEW_STATE == 'toi_toi' || MATRIX_VIEW_STATE == 'twigroup_twigroup'){
			var graph = reorder.mat2graph(matrix_values,false); 
			perm = reorder.reverse_cuthill_mckee_order(graph);
		}
	} else if(sort_type == 'pca_order'){
		perm = reorder.pca_order(matrix_values,4);
	}
	var newvalues = [];
	var newlenses = [];
	let newtwis = [];
	var list = document.getElementById('lenslist');
	var list1 = document.getElementById('mylist');
	let twilist = document.getElementById('twilist');

	if(row_perm.length > 0 && col_perm.length > 0) {
		//twi
		if(MATRIX_VIEW_STATE.indexOf("toi") > -1) {
			//html elements twilist
			for(let iter = 0, j = 0; iter < row_perm.length; iter++){
				for(let i = 0; i < TWILISTID.length; i++){
					if(TWILISTID[i] == order_twis[row_perm[iter]]) {
						newtwis[j] = twilist.childNodes[i];
						j++;
						break;
					}				
				}
			}

			fill_up_hidden_list_by_index(TWILISTID, order_twis, newtwis, twilist);

			twilist.innerHTML = '';
			for(let i=0; i< newtwis.length;i++){
				twilist.appendChild( newtwis[i] );
			}			
		}
		//aoi
		if(MATRIX_VIEW_STATE.indexOf("aoi") > -1) {
			//html elements list
			for(let iter = 0, j = 0; iter < col_perm.length; iter++){
				for(let i = 0; i < LENSIDLIST.length; i++){
					if(LENSIDLIST[i] == order_lenses[col_perm[iter]]) {
						newlenses[j] = list.childNodes[i];
						j++;
						break;
					}				
				}
			}

			fill_up_hidden_list_by_index(LENSIDLIST, order_lenses, newlenses, list);

			list.innerHTML = '';
			for(let i=0; i< newlenses.length;i++){
				list.appendChild( newlenses[i] );
			}			
		}
		//dat
		if(MATRIX_VIEW_STATE.indexOf("aoi") > -1 && MATRIX_VIEW_STATE.indexOf("dat") > -1) {
			//html elements list
			for(let iter = 0, j = 0; iter < row_perm.length; iter++){
				for(let i = 0; i < MYLISTID.length; i++){
					if(MYLISTID[i] == VALUED[row_perm[iter]]) {
						newvalues[j] = list1.childNodes[i];
						j++;
						break;
					}				
				}
			}

			fill_up_hidden_list_by_index(MYLISTID, VALUED, newvalues, list1);

			list1.innerHTML = '';
			for(let i=0; i< newvalues.length;i++){
				list1.appendChild( newvalues[i] );
			}
		}
		else if(MATRIX_VIEW_STATE.indexOf("dat_dat") > -1 || (MATRIX_VIEW_STATE.indexOf("grp") > -1 && MATRIX_VIEW_STATE.indexOf("dat") > -1)) {
			//html elements list
			for(let iter = 0, j = 0; iter < col_perm.length; iter++){
				for(let i = 0; i < MYLISTID.length; i++){
					if(MYLISTID[i] == VALUED[col_perm[iter]]) {
						newvalues[j] = list1.childNodes[i];
						j++;
						break;
					}				
				}
			}
			
			fill_up_hidden_list_by_index(MYLISTID, VALUED, newvalues, list1);

			list1.innerHTML = '';
			for(let i=0; i< newvalues.length;i++){
				list1.appendChild( newvalues[i] );
			}
		}
		if(MATRIX_VIEW_STATE.indexOf("lensegroup") > -1) {

			//update the order of group indices			
			let tmpGroupIds =  [];
			ORDERLENSEGROUPID.forEach(function(id){
				tmpGroupIds.push(id);
			});
			for(let i = 0; i < col_perm.length; i++) {
				ORDERLENSEGROUPID[i] = tmpGroupIds[col_perm[i]];
			}
			//refresh the group index
			let unorderedGroupIds = LENSEGROUPS.map(x => x.group);
			ORDERLENSEGROUPIDARRAYINDEX.splice(0, ORDERLENSEGROUPIDARRAYINDEX.length);
			ORDERLENSEGROUPID.forEach(function(group) {
				ORDERLENSEGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
			});	
		}
		if(MATRIX_VIEW_STATE.indexOf("grp") > -1) {

			//update the order of group indices			
			let tmpGroupIds =  [];
			ORDERGROUPID.forEach(function(id){
				tmpGroupIds.push(id);
			});
			for(let i = 0; i < row_perm.length; i++) {
				ORDERGROUPID[i] = tmpGroupIds[row_perm[i]];
			}
			//refresh the group index
			let unorderedGroupIds = GROUPS.map(x => x.group);
			ORDERGROUPIDARRAYINDEX.splice(0, ORDERGROUPIDARRAYINDEX.length);
			ORDERGROUPID.forEach(function(group) {
				ORDERGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
			});				
		}
	}
	else if(perm.length > 0) {
		if(MATRIX_VIEW_STATE == 'aoi_aoi'){
			if(sort_type != 'No_sort'){
				//html elements list
				for(let iter = 0, j = 0; iter < perm.length; iter++){
					for(let i = 0; i < LENSIDLIST.length; i++){
						if(LENSIDLIST[i] == order_lenses[perm[iter]]) {
							newlenses[j] = list.childNodes[i];
							j++;
							break;
						}				
					}
				}

				fill_up_hidden_list_by_index(LENSIDLIST, order_lenses, newlenses, list);

				list.innerHTML = '';
				for(let i=0; i< newlenses.length;i++){
					list.appendChild( newlenses[i] );
				}	
			}
		}
		else if(MATRIX_VIEW_STATE == 'dat_dat'){
			if(sort_type != 'No_sort'){
				//html elements list
				for(let iter = 0, j = 0; iter < perm.length; iter++){
					for(let i = 0; i < MYLISTID.length; i++){
						if(MYLISTID[i] == VALUED[perm[iter]]) {
							newvalues[j] = list1.childNodes[i];
							j++;
							break;
						}				
					}
				}
				
				fill_up_hidden_list_by_index(MYLISTID, VALUED, newvalues, list1);

				list1.innerHTML = '';
				for(let i=0; i< newvalues.length;i++){
					list1.appendChild( newvalues[i] );
				}
			}
		}
		else if(MATRIX_VIEW_STATE == 'toi_toi'){
			if(sort_type != 'No_sort'){
				//html elements list
				for(let iter = 0, j = 0; iter < perm.length; iter++){
					for(let i = 0; i < TWILISTID.length; i++){
						if(TWILISTID[i] == order_twis[perm[iter]]) {
							newtwis[j] = twilist.childNodes[i];
							j++;
							break;
						}				
					}
				}
				
				fill_up_hidden_list_by_index(TWILISTID, order_twis, newtwis, twilist);

				twilist.innerHTML = '';
				for(let i=0; i< newtwis.length;i++){
					twilist.appendChild( newtwis[i] );
				}
			}
		}
		else if(MATRIX_VIEW_STATE == 'twigroup_twigroup'){
			if(sort_type != 'No_sort'){
				//update the order of group indices			
				let tmpGroupIds =  [];
				ORDERTWIGROUPID.forEach(function(id){
					tmpGroupIds.push(id);
				});
				if(tmpGroupIds.length > 0) {
					for(let i = 0; i < perm.length; i++) {
						ORDERTWIGROUPID[i] = tmpGroupIds[perm[i]];
					}
					//refresh the group index
					let unorderedGroupIds = TWIGROUPS.map(x => x.group);
					ORDERTWIGROUPIDARRAYINDEX.splice(0, ORDERTWIGROUPIDARRAYINDEX.length);
					ORDERTWIGROUPID.forEach(function(group) {
						ORDERTWIGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
					});			
				}				
			}
		}
		else if(MATRIX_VIEW_STATE == 'lensegroup_lensegroup'){
			if(sort_type != 'No_sort'){
				//update the order of group indices			
				let tmpGroupIds =  [];
				ORDERLENSEGROUPID.forEach(function(id){
					tmpGroupIds.push(id);
				});
				if(tmpGroupIds.length > 0) {
					for(let i = 0; i < perm.length; i++) {
						ORDERLENSEGROUPID[i] = tmpGroupIds[perm[i]];
					}
					//refresh the group index
					let unorderedGroupIds = LENSEGROUPS.map(x => x.group);
					ORDERLENSEGROUPIDARRAYINDEX.splice(0, ORDERLENSEGROUPIDARRAYINDEX.length);
					ORDERLENSEGROUPID.forEach(function(group) {
						ORDERLENSEGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
					});			
				}
			}
		}
		else if(MATRIX_VIEW_STATE == 'grp_grp'){
			if(sort_type != 'No_sort'){
				//update the order of group indices			
				let tmpGroupIds =  [];
				ORDERGROUPID.forEach(function(id){
					tmpGroupIds.push(id);
				});
				if(tmpGroupIds.length > 0) {
					for(let i = 0; i < perm.length; i++) {
						ORDERGROUPID[i] = tmpGroupIds[perm[i]];
					}
					//refresh the group index
					let unorderedGroupIds = GROUPS.map(x => x.group);
					ORDERGROUPIDARRAYINDEX.splice(0, ORDERGROUPIDARRAYINDEX.length);
					ORDERGROUPID.forEach(function(group) {
						ORDERGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
					});	
				}						
			}
		}		
	}

	if(perm.length > 0 || (row_perm.length > 0 && col_perm.length > 0)) {
		matrix_changed = true;
		load_controls();  timeline_changed = true;
	}	
}

function create_initial_sortList(items,perm){     //Create the initial list again if no sorting option is selected
	var itemsArr = [];
	for (var i in items) {
		if (items[i].nodeType == 1) { 
			itemsArr.push(items[i]);
		}
	}
	itemsArr.sort(function(a, b) {
		return perm.indexOf(Number(a.id.replace(/\D/g,''))) - perm.indexOf(Number(b.id.replace(/\D/g,'')));
	});
	return itemsArr;
}
function sort_lenses(sort_coef){
	
	reverse_if_sorted(sort_coef); 
	document.getElementById('sort_dropdown').value = 'No_sort';
	htmllenslist = document.getElementById('lenslist');

	var newlens = []; 
	//html elements list
	for(let i = 0, VALUEDINDEX = 0, j = 0; i < LENSIDLIST.length; i++){
		if(LENSIDLIST[i] == order_lenses[VALUEDINDEX]) {
			newlens[j] = htmllenslist.childNodes[i];
			j++;
			VALUEDINDEX++;
		}				
	}
	
	for(var i=0;i<sort_coef.length;i++){
		for(var b=0; b<sort_coef.length - 1 - i; b++){
			if(sort_coef[b] >= sort_coef[b+1]){
				[newlens[b], newlens[b+1]] = [newlens[b+1], newlens[b]];	
				[sort_coef[b], sort_coef[b+1]] = [sort_coef[b+1], sort_coef[b]];				
			}
		}
	}
	
	fill_up_hidden_list_by_index(LENSIDLIST, order_lenses, newlens, htmllenslist);

	//update mylist with newlens
	htmllenslist.innerHTML = '';
	for(let i=0; i< newlens.length;i++){
		htmllenslist.appendChild( newlens[i] );
	}
	load_controls(); matrix_changed = true; timeline_changed = true;
}
function data_sort(factor){
	document.getElementById('sort_dropdown').value = 'No_sort';
	var v = [];
	if(factor == 'alphabet'){
		for(var i=0; i<VALUED.length;i++){ v.push( DATASETS[VALUED[i]].name ); }
	}else if(factor == 'duration'){
		for(var i=0; i<VALUED.length;i++){ v.push( DATASETS[VALUED[i]].t_end - DATASETS[VALUED[i]].t_start ); }
	}else if(factor == 'fixations'){
		for(var i=0; i<VALUED.length;i++){ v.push( DATASETS[VALUED[i]].fixs.length ); }
	}else if(factor == 'group'){
		for(var i=0; i<VALUED.length;i++){ v.push( DATASETS[VALUED[i]].group + DATASETS[VALUED[i]].name ); }
	}
	sort_datasets(v);
}
function sort_datasets(sort_coef){
	document.getElementById('sort_dropdown').value = 'No_sort';
	reverse_if_sorted(sort_coef); 
	
	list = document.getElementById('mylist');
	var newvalues = []; 

	//html elements list
	for(let i = 0, VALUEDINDEX = 0, j = 0; i < MYLISTID.length; i++){
		if(MYLISTID[i] == VALUED[VALUEDINDEX]) {
			newvalues[j] = list.childNodes[i];
			j++;
			VALUEDINDEX++;
		}				
	}
	
	for(var i=0;i<sort_coef.length;i++){
		for(var b=0; b<sort_coef.length - 1 - i; b++){
			if(sort_coef[b] >= sort_coef[b+1]){
				[newvalues[b], newvalues[b+1]] = [newvalues[b+1], newvalues[b]];	
				[sort_coef[b], sort_coef[b+1]] = [sort_coef[b+1], sort_coef[b]];
				// list.insertBefore(list.childNodes[b+1], list.childNodes[b]);
			}
		}
	}
	
	fill_up_hidden_list_by_index(MYLISTID, VALUED, newvalues, list);

	//update mylist with newvalues
	list.innerHTML = '';
	for(let i=0; i< newvalues.length;i++){
		list.appendChild( newvalues[i] );
	}
	
	load_controls(); matrix_changed = true; timeline_changed = true;
}

function sort_groups(sort_coef){
	document.getElementById('sort_dropdown').value = 'No_sort';
	reverse_if_sorted(sort_coef); 
	
	list = document.getElementById('mylist');
	var newvalues = []; 

	let newvaluesbygroup = [];
	let GROUPID = [];
	//html elements list
	for(let i = 0, VALUEDINDEX = 0, j = 0; i < MYLISTID.length; i++){
		if(MYLISTID[i] == VALUED[VALUEDINDEX]) {
			let newObj = {"node": list.childNodes[i], "group": DATASETS[VALUED[VALUEDINDEX]].group};
			newvalues[j] = newObj;
			j++;
			if(!GROUPID.includes(DATASETS[VALUED[VALUEDINDEX]].group))
				GROUPID.push(DATASETS[VALUED[VALUEDINDEX]].group);
			VALUEDINDEX++;
		}				
	}
	
	for(var i=0;i<sort_coef.length;i++){
		for(var b=0; b<sort_coef.length - 1 - i; b++){
			if(sort_coef[b] >= sort_coef[b+1]){
				[ORDERGROUPID[b], ORDERGROUPID[b+1]] = [ORDERGROUPID[b+1], ORDERGROUPID[b]];	
				[ORDERGROUPIDARRAYINDEX[b], ORDERGROUPIDARRAYINDEX[b+1]] = [ORDERGROUPIDARRAYINDEX[b+1], ORDERGROUPIDARRAYINDEX[b]];					
				[sort_coef[b], sort_coef[b+1]] = [sort_coef[b+1], sort_coef[b]];				
			}
		}
	}
	
	load_controls(); matrix_changed = true; timeline_changed = true;
}

function datetime_string(){
	var dt = new Date();
	var ds = "_"+dt.getFullYear() + ("0" +(dt.getMonth()+1)).slice(-2)+ ("0" +dt.getDate()).slice(-2)+ "_" +("0" +dt.getHours()).slice(-2)+ ("0" +dt.getMinutes()).slice(-2)+("0" +dt.getSeconds()).slice(-2) + ("00"+dt.getMilliseconds()).slice(-3);
	return ds
}

function download_string(string, filename){
	var encodedUri = encodeURI(string);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", filename);
	document.body.appendChild(link); 
	link.click(); 
}
function export_histogram(){
	let twi_selection_str = TWI_MODE == 0 ? "All TWIs" : TWI_MODE == 1 ? "Selected twigroup "+selected_twigroup : TWI_MODE == 2 ? "Selected twi "+selected_twi : "";
	let sample_selection_str = DAT_MODE == 0 ? "All samples" : DAT_MODE == 1 ? "Selected sample group "+selected_grp : DAT_MODE == 2 ? "Selected sample "+selected_data : "";
	let histogram_data_state_str = "";
	
	if( HIST_METRIC == 'fix_dur'){		
		histogram_data_state_str = "fixation_duration";	
	}
	else if( HIST_METRIC == 'sac_len'){
		histogram_data_state_str = "saccade_length";	
	}
	else if( HIST_METRIC == 'fix_aoi_dur'){
		if(base_lenses[selected_lens].name != undefined)
			histogram_data_state_str = "fixation_duration_of_"+base_lenses[selected_lens].name;
		else
			histogram_data_state_str = "fixation_duration_of_selected_aoi";
	}
	else if( HIST_METRIC == 'fix_lensegroup_dur'){
		if(selected_lensegroup != -1)
			histogram_data_state_str = "fixation_duration_of_"+selected_lensegroup;
		else
			histogram_data_state_str = "fixation_duration_of_selected_aoi_group";		
	}
	else if( HIST_METRIC == 'visit_aoi_dur'){
		if(base_lenses[selected_lens].name != undefined)
			histogram_data_state_str = "visit_duration_of_"+base_lenses[selected_lens].name;
		else
			histogram_data_state_str = "visit_duration_of_selected_aoi";
	}
	else if( HIST_METRIC == 'visit_lensegroup_dur'){
		if(selected_lensegroup != -1)
			histogram_data_state_str = "visit_duration_of_"+selected_lensegroup;
		else
			histogram_data_state_str = "fixation_duration_of_selected_aoi_group";
	}

	if(DAT_MODE == 0)
		histogram_data_state_str += "_by_sample_groups";	
	else
		histogram_data_state_str += "_by_samples";	

	var histogram_string = 'data:text/tsv;charset=utf-8,' + histogram_values_string(histogram_data_state_str, sample_selection_str, twi_selection_str);
	
	var histogram_filename = histogram_data_state_str + "_" + sample_selection_str + "_"+ twi_selection_str+'.tsv';
	download_string(histogram_string, histogram_filename);
}
function export_matrix(){
	let twi_selection_str = TWI_MODE == 0 ? "All TWIs" : TWI_MODE == 1 ? "Selected twigroup "+selected_twigroup : TWI_MODE == 2 ? "Selected twi "+selected_twi : "";
	let sample_selection_str = DAT_MODE == 0 ? "All samples" : DAT_MODE == 1 ? "Selected sample group "+selected_grp : DAT_MODE == 2 ? "Selected sample "+selected_data : "";

	var matrix_string = 'data:text/tsv;charset=utf-8,' + matrix_values_string();
	
	let matrix_view_state_str = MATRIX_VIEW_STATE.replace("dat", "sample");
	matrix_view_state_str = MATRIX_VIEW_STATE.replace("toi", "twi");
	matrix_view_state_str = MATRIX_VIEW_STATE.replace("grp", "sample_group");
	
	let matrix_data_state_str = "";
	if(MATRIX_DATA_STATE == "time") 
		matrix_data_state_str = "fixation_time";	
	else if(MATRIX_DATA_STATE == "ratio") 
		matrix_data_state_str = "mean_fixation_duration";	
	else if(MATRIX_DATA_STATE == "meanfixduration")
		matrix_data_state_str = "mean_fixation_duration_indep_of_aois";
	else if(MATRIX_DATA_STATE == "meansaccadelength")
		matrix_data_state_str = "mean_saccade_length";
	else if(MATRIX_DATA_STATE.indexOf("trans1") > -1)
		matrix_data_state_str = "direct_transitions";
	else if(MATRIX_DATA_STATE.indexOf("trans2") > -1)
		matrix_data_state_str = "indirect_transitions";
	else if(MATRIX_DATA_STATE.indexOf("through") > -1 && MATRIX_VIEW_STATE.indexOf("aoi")> -1) 
		matrix_data_state_str = "transitions_through_lense "+selected_lens;
	else if(MATRIX_DATA_STATE.indexOf("through") > -1 && MATRIX_VIEW_STATE.indexOf("lensegroup")> -1) 
		matrix_data_state_str = "transitions_through_lensegroup "+selected_lensegroup;
	else if(MATRIX_DATA_STATE == "cont_density") 
		matrix_data_state_str = "kernel_density"+selected_lensegroup;
	else 
		matrix_data_state_str = MATRIX_DATA_STATE;
	var matrix_filename = matrix_view_state_str + "_" + matrix_data_state_str + "_" + sample_selection_str + "_"+ twi_selection_str+'.tsv';
	download_string(matrix_string, matrix_filename);
}

function export_spatial_canvas(){
	if(EXPORT_SPATIAL_CANVAS && EXPORT_CROP_SPATIAL_CANVAS)
		SPATIAL.save(SpatialCanvas.get(ground_x, ground_y, cropimage.width, cropimage.height), "spatial.jpg");
	else if(EXPORT_SPATIAL_CANVAS && !EXPORT_CROP_SPATIAL_CANVAS)
		SPATIAL.save(SpatialCanvas, "spatial.jpg");

	if(EXPORT_TIMELINE_CANVAS && EXPORT_CROP_TIMELINE_CANVAS)
		TIMELINE.save(TIMELINE_CANVAS.get(200, 0, TimeLine.width, TimeLine.height), "timelines.jpg");
	else if(EXPORT_TIMELINE_CANVAS && !EXPORT_CROP_TIMELINE_CANVAS)
		TIMELINE.save(TIMELINE_CANVAS, "timelines.jpg");

	if(EXPORT_METRIC_CANVAS)
		MATRIX.save(matrixCanvas1, "metrics.jpg");
}

function export_metrics(){
	var sacc_string = 'data:text/tsv;charset=utf-8,'+ saccades_values_string();
	var sacc_filename = 'export_metrics'+ datetime_string() +'.tsv';
	download_string(sacc_string, sacc_filename)	
}