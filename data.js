
// dataset list functions
let databox = '<div class="data_dragger" draggable="true" ondragend="dragEnd()" ondragover="dragOver_page(event)" ondragstart="dragStart(event)" id="#_drag"></div>'
+ '<div class="rowsplit">'
+ '<div class="controls">'
+ '<input id="#_f" type="file" name="name" style="display: none;" onchange="load_file(#)"/>'
+ '<input type="text" id="#_name" style="width:110px" value="dat#" onchange="matrix_changed=true">'
+ '<div id="#_col" style="display:inline;width:19px;height:19px;"></div>'
+ '<button id="#_c" checked="true" onclick="not_all_eye("time_control_canvas");"> <i class="fas fa-eye"></i> </button>'
+ '<input class="num" type="number" id="#_g" style="width:50px" value = 1 step=1 min=1 max=20>'
+ '<div class="tool inner_button"><button  id="#_x" onclick="delete_item(#);"> <i class="far fa-trash-alt"></i> </button><span class="tip">Delete the sample file</span></div>'
+ '<div class="tool inner_button"><button  onclick="download_toi(#)"> <i class="far fa-save"></i> </button><span class="tip">Save the sample file</span></div>'
+ '<div class="time_controls" ><ol id="#_toi" class="toi_list">'
+ '<li onclick="set_toi(#, 0)" id="#_twi_0" class="toi_selected"><center>All</center></li>'
+ '<li id="#_addtoi"><div class="tool inner_button"><button onclick="new_toi(#,0,1)"><center><i class="fas fa-plus"></i></center></button><span class="tip">Add new TOI</span></div></li>'
+ '<li id="#_loadtois"><div class="tool inner_button"><input id="#_toi_f" type="file" name="name" style="display: none;" onchange="load_toi_list(#)"/> <button onclick="click_load_toi_list(#)"><center><i class="fas fa-file-upload"></i></center></button><span class="tip">Upload new TOI file</span></div></li>'
+ '<li id="#_deltoi"><div class="tool inner_button"><button onclick="delete_selected_toi(#)"><center> <i class="far fa-trash-alt"></i>  </center></button><span class="tip">Delete the selected TOI</span></div></li></ol>'
+ '<div id="#_nametoi_box" style="display:none;"><input type="text" id="#_nametoi" style="width:80px" disabled=true/> </div></div></div>'
+ '<div class="timebox" id="tb"> <input type="text" id="#_left" value=12:34 onchange="update_timeslider(#)"> <div id="#_sl" class="timeslider"></div> <input type="text" id="#_right" value=12:34:03 onchange="update_timeslider(#)"></div></div></div> ';

let twibox = '<div class="dragger" draggable="true" ondragend="dragEnd()" ondragover="dragOver_page(event)" ondragstart="dragStart(event)" id="#_twi_dragger"></div>'
+ '<div class="controls">'
+ '<input type="text" id="#_twi_name" style="width:110px" value="twi#">'
+ '<div id="#_col" style="display:inline;width:19px;height:19px;"></div>'
+ '<button id="twi_#_c" checked="true" onclick="not_all_eye("showtwis")> <i class="fas fa-eye"></i> </button>'
+ '<input class="num" type="number" id="#_twigroup" style="width:50px" value = 1 step=1 min=1 max=20>'
+ '<div class="tool inner_button"><button  id="#_x" onclick="delete_twi(#);"> <i class="far fa-trash-alt"></i> </button><span class="tip">Delete the TWI</span></div>';


var fileCounter = 0; var filelist; var groupCounter = 0; var relative_w = 0; var relative_h = 0;
var err_row = []; var err_msg = ''; var err_count = 0; var cluster_warn = ''; 
var limit_select = false //used for cropping
var pos_ratio = 1 // for data positioning on screen
var inv_ratio = 1 // for position on screen to data
var height_adjust = 0 // for cropped lens position
var width_adjust = 0 // for cropped lens position
var backimage_empty = true //check for uploaded backimage
var crop_stack = [ [0, 0, 0, 0, false] ];
var ground_x = 0; // to maintain centre when cropped
var ground_y = 0; // to maintain centre when cropped

let base_twis = [];
let order_twis = [0];
let toi_start = -1;
let toi_end = 0;
let previous_toi_name = "";
let current_toi_id = 0;
let tois_to_be_added = [];

class Node {
    constructor(data) {
       this.data = data;
   }

   print() {
	   return this.data;
   }
}

class Queue {
    constructor() {
       this.elements = [];
    }
    
    enqueue(node) {
       this.elements.push(node);
    }
  
    dequeue() {
       if(this.elements.length > 0) { 
           return this.elements.shift();
       } else {
           return 'Queue underflow';
       }
    }
  
    isEmpty() {
       return this.elements.length == 0;
    }
    
    front() {
       if(this.elements.length > 0) {
           return this.elements[0];
       } else {
           return "The Queue is empty!";
       }
    }
    
	size() {
		return this.elements.length;
	}

    print() {
       return JSON.stringify(this.elements);
    }
}

function new_file(){
	document.getElementById("dataset_load_txt").innerHTML = "Loading...";
	document.getElementById("dataset_button").disabled = true;
	filelist = document.getElementById('new_f').files;
	if(filelist.length == 0){return;}
	if(fileCounter == 0){groupCounter = (groupCounter)%GROUPINGS.length + 1;}
	tois_to_be_added.splice(0, tois_to_be_added.length);

	var reader = new FileReader();
	reader.value_id = fileCounter;
	reader.onload = function(event) {
		var newdata = new_dataset(cid);
		try{
			newdata.name = filelist[this.value_id].name.split('.')[0];
			newdata.group = groupCounter;
			str = reader.result;
			table = str.split('\n');
			newdata.t = [];
			newdata.x = [];
			newdata.y = [];			
			err_row = [newdata.name];
			err_count = 0;
			var last_rt = 0;
			var first_reorder = true;
			for (var i=0; i<table.length; i++) {
				r = table[i].split('\t');
				if(r.length >= 3){
					var rt = parseFloat(r[0]);
					var rx = parseFloat(r[1]);
					var ry = parseFloat(r[2]);
					let r_toiname = "";
					if(r.length >= 4){
						r_toiname = String(r[3].trim());
					}
					// console.log("previous_toi_name: "+previous_toi_name+", r_toiname: "+r_toiname+", r_toiname.length: "+r_toiname.length+", toi_start: "+toi_start+", toi_end: "+toi_end+", "+/^[a-zA-Z0-9-_()]+$/.test(r_toiname)+", space: "+/^\s+$/.test(r_toiname));
					if(r_toiname != null && r_toiname != undefined && (r_toiname.length == 0 || /^\s+$/.test(r_toiname) || (r_toiname.length > 0 && /^[a-zA-Z0-9-_()]+$/.test(r_toiname))) && 
						r_toiname != previous_toi_name) {
						if(previous_toi_name != "" && toi_start >= 0 && toi_end > toi_start) {
							// toi_end = rt[]
							//add toi (previous_toi_name, ...)
							
							//before inserting to array, check the toi name, append bracket if the name already appears in the array
							let names = tois_to_be_added.map(x => x.name);
							
							if(names.indexOf(previous_toi_name)>-1) 
								previous_toi_name = get_non_duplicate_name(names, previous_toi_name);

							tois_to_be_added.push({range:[toi_start, toi_end], name:previous_toi_name+''});

							if(r_toiname.length > 0 && /^[a-zA-Z0-9-_()]+$/.test(r_toiname)) {
								toi_start = rt;
								toi_end = 0;
								previous_toi_name = r_toiname;
							}
							else {
								toi_start = -1;
								toi_end = 0;
								previous_toi_name = "";
							}								
							// console.log("tois_to_be_added: "+JSON.stringify(tois_to_be_added));
						}					
						else if(r_toiname.length > 0 && /^[a-zA-Z0-9-_()]+$/.test(r_toiname)){
							toi_start = rt;
							previous_toi_name = r_toiname;
						}						
						else {
							toi_start = -1;
							toi_end = 0;
							previous_toi_name = "";
						}
					}
					
					if(toi_start >= 0)
						toi_end = rt;

					// if there is content that is not a number, skip
					if((r[0].trim().length>0 && isNaN(rt)) || (r[1].trim().length>0 && isNaN(rx)) || (r[2].trim().length>0 && isNaN(ry)) ){
						if(err_row.length==1){err_row.push(i+1)}
						err_count+=1;
					}else{ 
						if(rt<last_rt){
							var pos = index_location(newdata.t, rt);
							newdata.t.splice(pos, 0, rt);
							newdata.x.splice(pos, 0, rx);
							newdata.y.splice(pos, 0, ry);
							if(first_reorder){
								err_msg += '   ' + err_row[0] + ':  data was reordered by the first column (time)\n';
								first_reorder = false;
							}
						} else {
							newdata.t.push(rt);
							newdata.x.push(isNaN(rx) ? 0 : rx);
							newdata.y.push(isNaN(ry) ? 0 : ry);
						}
						last_rt = newdata.t[newdata.t.length - 1];
					 }
				}else if(r[0].length>0){
					if(err_row.length==1){err_row.push(i+1)}
					err_count+=1;
				}
			}

			if(previous_toi_name != "" && toi_start >= 0 && toi_end > toi_start) {
				// toi_end = rt[]
				//add toi (previous_toi_name, ...)
				let names = tois_to_be_added.map(x => x.name);
				let sequence = 0;
				if(names.indexOf(previous_toi_name)>-1) 
					previous_toi_name = get_non_duplicate_name(names, previous_toi_name);
				
				//real_range is the ground truth of the toi start time and end time relating to real timeline (non-cumulative one)
				tois_to_be_added.push({range:[toi_start, toi_end], name:previous_toi_name+''});
			}

			// console.log('err_count', err_count, 'err_msg',err_msg , 'newdata', newdata)
			if(newdata.t.length>1 && newdata.t.length != err_count){
				cluster_dataset(newdata);
				newdata.tois[0].real_range[0] = newdata.t_start;
				newdata.tois[0].real_range[1] = newdata.t_end;
				newdata.initialised = true;
				if(err_row.length>1){err_msg += '   ' + err_row[0] + ':  ' +  err_count + ' row(s) skipped with first issue at row ' + err_row[1] + '\n';}
			}else{ err_msg += '   ' + err_row[0] + ':  no data was able to be uploaded\n';}
		}catch( error ){ console.error(error); }
		
		previous_toi_name = "";
		toi_start = -1;
		toi_end = 0;

		if( newdata.initialised ){ // new load is valid, accept it
			var id = DATASETS.length; DATASETS.push(newdata); VIDEOS.push({}); cid = DATASETS.length;
			
			q = databox.replace(/#/g, id);
			var node = document.createElement("li");
			node.innerHTML = q; node.id = id;
			node.setAttribute('onclick', "select_data("+id+")");
			node.setAttribute('class', 'data_item');
			document.getElementById('mylist').appendChild(node);
			
			noUiSlider.create(document.getElementById(id+'_sl'), {
				start: [0, 1], connect: true, step: 0.0001, id:id,
				range: {'min': 0, 'max': 1},
				format: {to:function(value){return value;}, from:function(value){return Number(value);} }
			});
			document.getElementById(id+'_sl').noUiSlider.on("update", update_times );
			document.getElementById(id+"_g").value = groupCounter;
			document.getElementById(id+'_c').checked = true;
			document.getElementById(id+'_c').onclick = function(){
				document.getElementById('sort_dropdown').value = 'No_sort';
				this.checked = !this.checked; if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';}
				load_controls(); matrix_changed = true;timeline_changed=true; 

			}
			document.getElementById(id+'_name').value = newdata.name;
			
			
			select_data(id); 
			if(base_twis.length == 0){
				base_twis.push({name: "All", group: 1, included: true});
				add_item_to_twilist("All", 0);
				document.getElementById("twi_0_c").onclick = function(){ document.getElementById('sort_dropdown').value = 'No_sort'; load_controls(); matrix_changed = true;timeline_changed=true;  this.checked = !this.checked; if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';} };
			}
			
			for(let i = 0; i < tois_to_be_added.length; i++){
				let range = [0,0];

				if(TIME_STRAT == 'real'){
					//the start time, end time of TWI is based on ground truth
					range[0] = (tois_to_be_added[i].range[0] - newdata.t_start)/(newdata.t_end - newdata.t_start);
					range[1] = (tois_to_be_added[i].range[1] - newdata.t_start)/(newdata.t_end - newdata.t_start);
				}
				else if(TIME_STRAT =='cumulative'){
					convert_from_real_to_cumulative_time(newdata, range, tois_to_be_added[i]);
				}
				
				add_toi(cid-1, range[0], range[1], "", tois_to_be_added[i].name, tois_to_be_added[i].range[0], tois_to_be_added[i].range[1]);				
			}

			tois_to_be_added.splice(0, tois_to_be_added.length);
			if(selected_twi == -1)
				select_twi(0);

			try{ compute_toi_metrics(id, 0); give_topography(id, 0); load_controls();  }catch( error ){ console.error(error); }
			background_changed = true; timeline_changed = true; matrix_changed = true;
			make_note_dataset_selectors();
			if(newdata.fixs.length < 2){cluster_warn+= '   ' +newdata.name+'\n'}
		}
		fileCounter += 1;
		document.getElementById("dataset_load_txt").innerHTML = '';
		document.getElementById("dataset_button").disabled = false;
		if(fileCounter < filelist.length){ new_file(); }
		else{ 
			if(err_msg.length>0){alert('Not all data was formatted as required. Please note:\n' + err_msg);}
			if(cluster_warn.length>0){alert('Note: There are less than 2 fixations in the following dataset(s). Check that clustering values are appropriate.\n\n' + cluster_warn+ '\n' )}
			fileCounter = 0; filelist = document.getElementById('new_f').value = ""; 
			err_msg = '';
			cluster_warn = '';
		}
	}
	reader.readAsText(filelist[fileCounter]);
}
function convert_from_real_to_cumulative_time(data, range, real_range, bLog){
	//KT: convert the start time, end time based on fixtions and gaps of cumulative timeline
	//iterate through the list of fixation start time, end time until twi start time hits the interval	
	let fixs = data.fixs;
	
	if(fixs.length > 0 && fixs[0].real_t_start != undefined 
		&& fixs[0].real_t_end != undefined 
		&& fixs[0].cumul_t_start != undefined 
		&& fixs[0].cumul_t_end != undefined 
		&& real_range != undefined && real_range.length > 0 && real_range[0] != undefined && real_range[0] < real_range[1]) {
		let i = 0;

		//process START time
		for(i = 0; i < fixs.length && fixs[i].real_t_start < real_range[0]; i++) {}
		
		if(i < fixs.length && fixs[i].real_t_start == real_range[0])
			range[0] = fixs[i].cumul_t_start; 
		else if(i > 0){
			i--;
			if(fixs[i].real_t_end > real_range[0]) {
				if(fixs[i+1] != undefined) {
					//KT: ignore fixs[i] as it is not a "full" fixation for this TWI because we consistently take into account only a *full* fixation within a TWI
					range[0] = fixs[i+1].cumul_t_start;					
				}
				else {
					//KT: still take into account non-full fixations for this TWI
					range[0] = fixs[i].cumul_t_start + (real_range[0] - fixs[i].real_t_start); 					
				}
			} 				
			else if(fixs[i].real_t_end == real_range[0])
				range[0] = fixs[i].cumul_t_end; 
			else {
				//The START time hits the gaps between fixations, move it to the earliest end time of a fixation
				range[0] = fixs[i].cumul_t_end; 				
			}
		}			
		range[0] = (range[0] - data.t_start)/(data.t_end - data.t_start);

		//process END time
		for(; i < fixs.length && fixs[i].real_t_start < real_range[1]; i++) {}
		if(i < fixs.length && fixs[i].real_t_start == real_range[1])
			range[1] = fixs[i].cumul_t_start; 
		else if(i > 0){
			i--;
			if(fixs[i].real_t_end > real_range[1]) {
				//linear translation to cumulative start time
				range[1] = fixs[i].cumul_t_start + (real_range[1] - fixs[i].real_t_start); 
			} 				
			else if(fixs[i].real_t_end == real_range[1])
				range[1] = fixs[i].cumul_t_end; 
			else {
				//The END time hits the gaps between fixations, move it to the earliest end time of a fixation
				range[1] = fixs[i].cumul_t_end; 
			}
		}			
		range[1] = (range[1] - data.t_start)/(data.t_end - data.t_start);
	}
	else if(real_range != undefined && real_range.length > 0 && real_range[0] != undefined && real_range[0] < real_range[1]) {
		range[0] = (real_range[0] - data.t_start)/(data.t_end - data.t_start);
		range[1] = (real_range[1] - data.t_start)/(data.t_end - data.t_start);
	}	
}
function check_main_twi(){
	let ele = document.getElementById("twi_0_c");
	document.getElementById('sort_dropdown').value = 'No_sort'; load_controls(); matrix_changed = true;timeline_changed=true;  ele.checked = !ele.checked; if(ele.checked){ele.innerHTML='<i class="fas fa-eye"></i>';}else{ele.innerHTML='<i class="fas fa-eye-slash"></i>';}
}

function new_dataset(v){ // creates the dataset objects, that are stored in k
	dataset = {
		initialised:false, checked:false, selected:false, name:'dat'+v, should_save: true, included: true,
		t:[],x:[],y:[], fixs:[], sacs:[], slid_vals: [0,1], group:0,
		toi_id:0, tois:[ {range:[0, 1], real_range:[0, 1], name:'0', update_topo:true, twi_id: 0} ], t_start:0, t_end:0
	};
	return dataset;
}

function index_location(array, value){ // binary search for array index where value is < index+1
	var s = 0; var e = array.length; 
	while(s<e){
		var m = Math.floor((e+s)/2);
		if(array[m]<value){s=m+1}else{e=m}
	}
	return s;
}
function add_item(){
	var v = cid; cid += 1;
	q = databox.replace(/#/g, v);
	var node = document.createElement("li");
	node.innerHTML = q; node.id = v;
	node.setAttribute('onclick', "select_data("+v+")");
	node.setAttribute('class', 'data_item');
	document.getElementById('mylist').appendChild(node);
	DATASETS.push(new_dataset(v));
	VIDEOS.push({});
	noUiSlider.create(document.getElementById(v+'_sl'), {
		start: [0, 1], connect: true, step: 0.0001, id:v,
		range: {'min': 0, 'max': 1},
		format: {to:function(value){return value;}, from:function(value){return Number(value);} }
	});
	document.getElementById(v+'_sl').noUiSlider.on("update", update_times );
	document.getElementById(v+"_g").value = (v+1)%GROUPINGS.length;
	select_data(v); document.getElementById(v+'_f').click(); make_dynamic_legend();
}
function update_times(){
	list = document.getElementById('mylist').children;
	let bUpdateVideo = false; 
	let set_video_cursor = 0;

	for(var i=0; i<list.length; i++){
		val = list[i].id;
		range = document.getElementById(val+'_sl').noUiSlider.get();
		if(DATASETS[val].fixs.length >= 2){
			t0 = DATASETS[val].t_start; t1 = DATASETS[val].t_end;
			tmin = range[0] * ( t1 - t0 ) + t0; tmax = range[1] * ( t1 - t0 ) + t0;
			text_min = format_time(tmin/1000); text_max = format_time(tmax/1000);
			if(text_min != document.getElementById(val+'_left').value)
			{
				document.getElementById(val+'_left').value = text_min;

				if(selected_data != -1 && DATASETS[selected_data] != null && DATASETS[selected_data] != undefined){
					bUpdateVideo = true;
					set_video_cursor = tmin/1000;
				}
			}
			if(text_max != document.getElementById(val+'_right').value)
			{
				document.getElementById(val+'_right').value = text_max;

				//if bUpdateVideo is set to true, then skip the following update
				if(!bUpdateVideo && selected_data != -1 && DATASETS[selected_data] != null && DATASETS[selected_data] != undefined){
					bUpdateVideo = true;
					set_video_cursor = tmax/1000;
				}
			}
		}else{
			document.getElementById(val+'_left').value = format_time(0);
			document.getElementById(val+'_right').value = format_time(0);
		}
	}

	//update video with the time
	if(bUpdateVideo && selected_data != -1 && DATASETS[selected_data] != null && DATASETS[selected_data] != undefined && 
		currentVideoObj != null && currentVideoObj != undefined) {
		// type_select('video');
		VIDEOS[selected_data].videoobj.time(set_video_cursor);
	}
}
function update_timeslider(val){
	range = document.getElementById(val+'_sl').noUiSlider.get();
	ms_min = get_ms(document.getElementById(val+'_left').value); 
	ms_max = get_ms(document.getElementById(val+'_right').value);
	t0 = DATASETS[val].t_start; t1 = DATASETS[val].t_end;
	smin = (ms_min-t0) / ( t1 - t0 ) ;
	smax = (ms_max-t0) / ( t1 - t0 ) ;
	if(ms_min == -1){
		update_times();
	}else if(smin != range[0]){
		document.getElementById(val+'_sl').noUiSlider.set([smin, null]);		
	}
	if(ms_max == -1){
		update_times();
	}else if(smax != range[1]){
		document.getElementById(val+'_sl').noUiSlider.set([null, smax]);
	}
}
function delete_item(id){
	note_selectors = document.getElementsByClassName("note_dataset");
	note_list = [];
	for(var i=0; i<note_selectors.length; i++){
		if(note_selectors[i].value == id){
			note_list.push(note_selectors[i].id)
		}
	}
	if(note_list.length > 0){ var r = confirm("Are you sure? There are notes attached that will also be deleted.");
		if(r){
			for(var i=0; i<note_list.length; i++){
				note_id = note_list[i].split('_')[0]*1;
				var elem = document.getElementById('note_'+note_id);
				elem.parentNode.removeChild(elem);
				base_notes[note_id].included = false;
				if(note_id == selected_note){ selected_note = -1; }
			}
		}
	}else{ var r = confirm("Are you sure?");}
	if (r == true) {
	  	var element = document.getElementById(id);
		element.parentNode.removeChild(element);
		DATASETS[id].should_save = false;
		background_changed = true; timeline_changed = true; matrix_changed = true; make_note_dataset_selectors();
	}
	make_dynamic_legend();	
}
function select_data(id){
	list = document.getElementById('mylist').children;
	for(i =0;i < list.length; i++){
		if( (list[i].id == id) != list[i].classList.value.includes('selected') ){
			list[i].classList.toggle('selected');
		}
	}
	selected_data = id;
	if(id < DATASETS.length)
		selected_grp = DATASETS[id].group;
	update_dat_mode();
	foreground_changed = true; timeline_changed = true; matrix_changed = true; 
	// background_changed = true;
	background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed = SHOW_SACCADE; 
	if(SHOW_TOPO)
		update_topos = true;
	// background_changed |= SHOW_FIX||SHOW_TOPO;
	// if(SHOW_TOPO) image_changed = true;
}
function select_twi(id){
	list = document.getElementById('twilist').children;
	for(i =0;i < list.length; i++){
		let listid = parseInt( list[i].id.substring(4) );
		if( (listid == id) != list[i].classList.value.includes('selected') ){
			list[i].classList.toggle('selected');
		}
	}
	
	selected_twi = id;
	if(id < base_twis.length)
		selected_twigroup = base_twis[id].group;

	update_twi_mode();
	
	//iterate through all samples
	for(let data_id = 0; data_id < DATASETS.length; data_id++){
		if(DATASETS[data_id].included)
			set_toi(data_id, id);
	}
	background_changed |= SHOW_FIX||SHOW_TOPO;
	if(SHOW_TOPO) update_topo = true;
}

function set_toi(data_id, twi_id){
	//allows to set a twi of a selected sample for the purpose of renaming twi and configuring its time interval
	var data_items = document.getElementsByClassName('data_item');
	let twis = DATASETS[data_id].tois.map(x=>x.twi_id);

	let ltoi = document.getElementById(data_id+"_toi");

	let data = DATASETS[data_id];
	data.toi_id = twis.indexOf(twi_id);

	let ele = document.getElementById(data_id+"_twi_"+twi_id);
	
	for(let c = 0; c < ltoi.children.length; c++) {
		//de-select tois
		if(ele == null || ele == undefined) {
			if(ltoi.children[c].classList.value.includes('toi_selected'))
				ltoi.children[c].classList.toggle('toi_selected');
		}
		else if( (( (data_id+"_twi_"+twi_id) == ltoi.children[c].id) != ltoi.children[c].classList.value.includes('toi_selected'))){
			ltoi.children[c].classList.toggle('toi_selected');			
		}
	}

	slider = document.getElementById(data_id+'_sl').noUiSlider;
	//if(data.toi_id > 0){ data.tois[data.toi_id].range = slider.get(); }

	if(data.toi_id != -1 && (data.tois[data.toi_id] == undefined || !data.tois[data.toi_id].included)) 
		data.toi_id = -1;
		
	if(data.toi_id != -1) {		
		if( twi_id == 0 ){ data.tois[0].range = [0, 1]; data.tois[0].update_topo = true; } // clicking 'all' resets toi to all, even from itself
		slider.set(data.tois[data.toi_id].range);
		
		background_changed |= SHOW_FIX||SHOW_TOPO; midground_changed = SHOW_SACCADE; timeline_changed = true; matrix_changed = true;
		if( data.toi_id == 0 ){ 
			document.getElementById(data_id+"_nametoi_box").style.display = 'none'; 
			for(let i = 0; i < data_items.length; i++){
				document.getElementsByClassName('data_item')[i].style.width='290px';
			}
		}
		else{ 
			document.getElementById(data_id+"_nametoi_box").style.display = 'block'; 
			for(let i = 0; i < data_items.length; i++){
				document.getElementsByClassName('data_item')[i].style.width='320px';
			} 
		}	
		document.getElementById(data_id+"_nametoi").value = data.tois[data.toi_id].name; 
	}
	else {
		document.getElementById(data_id+"_nametoi_box").style.display = 'none'; 
		document.getElementById(data_id+"_nametoi").value = "";
	}	
}
function update_toi_name(twi_id, toi_name){
	for(let data_id = 0; data_id < DATASETS.length; data_id++){
		data = DATASETS[data_id];
		if(data == undefined || !data.included)
			continue;
		
		//iterate through twis of each sample
		let toi_index=0;
		for(toi_index=0; toi_index < data.tois.length; toi_index++) {
			if(data.tois[toi_index] == undefined || !data.tois[toi_index].included)
				continue;

			if(data.tois[toi_index].twi_id == twi_id) {
				data.tois[toi_index].name = toi_name;
				document.getElementById(data_id+"_nametoi").value = toi_name;				
				document.getElementById(data_id+"_twi_"+twi_id).innerHTML = toi_name;	
				break;
			}				
		}				
	}
}
function delete_twi(id){
	if(id == 0){ return; }
	let r = confirm("Are you sure you want to delete "+id+" the selected TWI for all the samples?");
	if(r){
		//iterate through all samples
		for(let data_id = 0; data_id < DATASETS.length; data_id++){
			if(DATASETS[data_id].included)
				delete_toi(data_id, id);
		}

		//delete selected twi from twilist		
		let ele = document.getElementById('twi_'+id);
		if(ele != null && ele != undefined ) {
			ele.parentNode.removeChild( ele );			
		}
	}
}
function delete_selected_toi(data_id){ 
	let r = confirm("Are you sure you want to delete the selected TWI?");
	if(r){
		delete_toi(data_id, DATASETS[data_id].tois[DATASETS[data_id].toi_id].twi_id); 
	}
}

function delete_toi(data_id, twi_id){
	if(twi_id == 0){ return; }
	set_toi(data_id, 0);
	let elem = document.getElementById(data_id+"_twi_"+twi_id);
	if(elem != null && elem != undefined)
		elem.parentNode.removeChild( elem );
}
function add_item_to_twilist(name, twi_id){
	//add to DOM twi list	
	v = twi_id;
	q = twibox.replace(/#/g, v);
	node = document.createElement("li");
	node.innerHTML = q; node.id = "twi_"+v;
	//node.setAttribute('onclick', "if(selected_lens!="+v+"){select_lens("+v+");}else{select_lens(-1);}");
	node.setAttribute('onclick', "select_twi("+twi_id+")");
	node.setAttribute('class', 'data_item');
	document.getElementById('twilist').appendChild(node);
	update_twi_colors();
	
	document.getElementById('twi_'+v+'_c').checked = true;
	document.getElementById('twi_'+v+'_c').onclick = function(){ document.getElementById('sort_dropdown').value = 'No_sort'; load_controls(); matrix_changed = true;timeline_changed=true;  this.checked = !this.checked; if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';} }
	document.getElementById(v+'_twi_name').value = name;
	document.getElementById(v+'_twigroup').value = base_twis[v].group;
}

function new_toi(data_id, t0, t1, type, name) {
	let names = base_twis.map((x) => {
		if(x.included)
			return x.name;
	});

	let suggested_twi_name = "TWI1";
	if(names.indexOf(suggested_twi_name)>-1) 
		suggested_twi_name = get_non_duplicate_name(names, suggested_twi_name);

	let toi_name = prompt("Please enter a TWI name (accepting alphanumeric, underscore, or space", suggested_twi_name);
	if(toi_name != null && toi_name != undefined) {
		while(!(/^[a-zA-Z0-9-_()]+$/.test(toi_name))) {
			toi_name = prompt("Please enter a valid TWI name (accepting alphanumeric, underscore, or space", suggested_twi_name);
			if(toi_name == null)
				break;		
		}
	}
	
	if(toi_name != null && toi_name != undefined) {
		toi_name = toi_name.trim();
		let toi_index = names.indexOf(toi_name);
		let dat_toi_names = DATASETS[data_id].tois.map(
			(x) => {
				if(x.included)
					return x.name;
			}
		);

		if(toi_index > -1 && dat_toi_names.indexOf(toi_name) > -1) 
			toi_name = get_non_duplicate_name(names, toi_name);

		if(TIME_STRAT == 'real')
			add_toi(data_id, t0, t1, "", toi_name, 
			t0 * (DATASETS[data_id].t_end-DATASETS[data_id].t_start) + DATASETS[data_id].t_start,
			t1 * (DATASETS[data_id].t_end-DATASETS[data_id].t_start) + DATASETS[data_id].t_start);
		else
			add_toi(data_id, t0, t1, "", toi_name, 0, 0);
	}	
}
function add_toi(data_id, t0, t1, type, name, t0_real, t1_real){
	ltoi = document.getElementById(data_id+"_toi");
	addtoi = document.getElementById(data_id+"_addtoi");
	var node = document.createElement("li");

	//search for base_twis if same twi type already exists
	//if not, insert one into base_twis
	let names = base_twis.map((x) => {
		if(x.included)
			return x.name;
	});
	let twi_id = names.indexOf(name);

	if(twi_id == -1) {
		let groupnum = base_twis.length+1;
		if(groupnum > TWIS_COLOURS.length)
			groupnum = TWIS_COLOURS.length;
		base_twis.push({name: name, group: groupnum});
		twi_id = base_twis.length-1;
		order_twis.push(twi_id);	
		add_item_to_twilist(name, twi_id);
	}
	
	c = DATASETS[data_id].tois.length;
	if(name == null || name == undefined || name == "")
		name = c;

	//unique identification of the corresponding DOM element
	node.id = data_id + "_twi_"+ twi_id;

	node.innerHTML = '<center>'+name+'</center>';
	node.setAttribute('onclick', "set_toi("+data_id+","+twi_id+")");
	DATASETS[data_id].tois.push( {range:[t0, t1], real_range:[t0_real, t1_real], name:name+'', twi_id: twi_id, included: true} );
	ltoi.insertBefore(node, addtoi);
	//c gives the array index of the tois
	give_topography(data_id, c);
	DATASETS[data_id].tois[c].update_topo = true;

	// add_dat_to_twilist(twi_id, data_id, DATASETS[data_id].name);

	matrix_changed = true;
	if(type!='uploaded'){compute_all_metrics();}
}
function get_non_duplicate_name(names, inputstr) {
	let new_toi_name = "";
	let sequence = 0;
	do {
		new_toi_name = inputstr+'('+(++sequence)+')';		
	}while(names.indexOf(new_toi_name)>-1);
	return new_toi_name;
}

var max_dist = 20; var min_time = 0;  
function cluster_dataset(data){ // clusters raw data into a fixation list
	
	// set a default size to data height/width if no image and not cropped
	if(backimage_empty && limit_select == false) {
		for(i =0;i < data.y.length; i++){
			if(data.y[i]>HEIGHT){HEIGHT = data.y[i] + 1}
			if(data.x[i]>WIDTH){WIDTH = data.x[i] + 1}
		}
		document.getElementById('HEIGHT').value = HEIGHT; 
		document.getElementById('WIDTH').value = WIDTH; 
		if(HEIGHT/ spatial_height > WIDTH / spatial_width){
			pos_ratio = spatial_height/HEIGHT;
			inv_ratio = HEIGHT/spatial_height;
		}else{
			pos_ratio = spatial_width/WIDTH;
			inv_ratio = WIDTH/spatial_width;}
		ground_x = 0;
		ground_y = 0;
		crop_stack = [ [OFFSET_X, OFFSET_Y, WIDTH, HEIGHT, limit_select] ]; // reset baseline frame of reference
	}

	let fixations = [];
	
	if(max_dist == 0 && min_time == 0){
		//Display the raw gaze data w/o fixation identification if both max_dist and min_time are both 0
		if(TIME_STRAT == 'real'){
			data.t_start = data.t[0]; data.t_end = data.t[data.t.length-1];
			fixations = [];
			var i=0;
			
			while(i < data.t.length){
				while(  ((data.x[i] == 0 && data.y[i] == 0) || (Number.isNaN(data.x[i]) || Number.isNaN(data.y[i]))) ){ i += 1; }
				start = i;
				if(i+1 >= data.t.length)
					break;
				fix = {x: ((data.x[i] *SCALE_X)- offset_xdata), y: ((data.y[i] *SCALE_Y)- offset_ydata), t: data.t[i], dt: (data.t[i+1] - data.t[i]),
					real_t_start: 0, real_t_end: 0, cumul_t_start: 0, cumul_t_end: 0 };
				i += 1;
				if(i+1 >= data.t.length) {
					//insert the last fixation above before exiting otherwise we are losing one fixation
					if( fix.x > 0 && fix.x < WIDTH && fix.y > 0 && fix.y < HEIGHT && fix.dt > min_time && !(fix.x == -offset_xdata && fix.y == -offset_ydata) ){ fixations.push(fix); }
					break;
				}
					
				//max cluster distance is used as a parameter for clustering
				//KT: modify the clustering algorithm to conform to I-DT; get max and min x, y of the gaze point in this time window, if difference is more than max cluster distance, then don't cluster
				while( i+1 < data.t.length && ( ((data.x[i] *SCALE_X)- offset_xdata) - fix.x)**2 + ( ((data.y[i] *SCALE_Y)- offset_ydata) - fix.y)**2 < max_dist**2 && (data.x[i] == 0 && data.y[i] == 0)!= true && !Number.isNaN(data.x[i]) && !Number.isNaN(data.y[i])){
					ddt = data.t[i+1] - data.t[i];
					fix.x = (fix.dt*fix.x + ((data.x[i] *SCALE_X)- offset_xdata)*ddt ) / (fix.dt + ddt);
					fix.y = (fix.dt*fix.y + ((data.y[i] *SCALE_Y)- offset_ydata)*ddt ) / (fix.dt + ddt);
					fix.dt += ddt;
					i += 1;
				}
				fix.dt = data.t[i] - data.t[start];
				//min fixation time is used as a threshold to include or exclude fixations
				if( fix.x > 0 && fix.x < WIDTH && fix.y > 0 && fix.y < HEIGHT && fix.dt > min_time && !(fix.x == -offset_xdata && fix.y == -offset_ydata) ){ fixations.push(fix); }
			}
			data.fixs = fixations;
		}else if(TIME_STRAT == 'cumulative'){
			var cumul = 0;
			data.t_start = cumul; 
			fixations = [];
			var i=0;
			while(i < data.t.length){
				while(  ((data.x[i] == 0 && data.y[i] == 0) || (Number.isNaN(data.x[i]) || Number.isNaN(data.y[i]))) ){ i += 1; }
				start = i;
				if(i+1 >= data.t.length)
					break;
				fix = {x: ((data.x[i] *SCALE_X)- offset_xdata), y: ((data.y[i] *SCALE_Y)- offset_ydata), t: data.t[i], dt: (data.t[i+1] - data.t[i]),
					real_t_start: data.t[i], real_t_end: 0, cumul_t_start: cumul, cumul_t_end: 0};
				i += 1;
				if(i+1 >= data.t.length) {
					//insert the last fixation above before exiting otherwise we are losing one fixation
					if( fix.x > 0 && fix.x < WIDTH && fix.y > 0 && fix.y < HEIGHT && fix.dt > min_time && !(fix.x == -offset_xdata && fix.y == -offset_ydata) ){ 
						fix.t = cumul;
						cumul += fix.dt; // append fixation time to cumulative time
						fix.real_t_end = data.t[i];
						fix.cumul_t_end = cumul;
						fixations.push(fix); 
					}
					break;
				}
				while( i+1 < data.t.length && ( ((data.x[i] *SCALE_X)- offset_xdata) - fix.x)**2 + ( ((data.y[i] *SCALE_Y)- offset_ydata) - fix.y)**2 < max_dist**2 && (data.x[i] == 0 && data.y[i] == 0)!= true && !Number.isNaN(data.x[i]) && !Number.isNaN(data.y[i])){
					ddt = data.t[i+1] - data.t[i];
					fix.x = (fix.dt*fix.x + ((data.x[i] *SCALE_X)- offset_xdata)*ddt ) / (fix.dt + ddt);
					fix.y = (fix.dt*fix.y + ((data.y[i] *SCALE_Y)- offset_ydata)*ddt ) / (fix.dt + ddt);
					fix.dt += ddt;
					i += 1;
				}
				fix.dt = data.t[i] - data.t[start];
				fix.real_t_end = data.t[i];
				fix.t = cumul;
				if( fix.x > 0 && fix.x < WIDTH && fix.y > 0 && fix.y < HEIGHT && fix.dt > min_time && !(fix.x == -offset_xdata && fix.y == -offset_ydata) ){
					cumul += fix.dt; // append fixation time to cumulative time
					fix.cumul_t_end = cumul;
					fixations.push(fix);
				}
			}
			data.t_end = cumul;
			data.fixs = fixations;						
		}
	}
	else {
		//fixation detection implementation based on dispersion-based algorithm (I-DT) 
		if(TIME_STRAT == 'real'){
			data.t_start = data.t[0]; data.t_end = data.t[data.t.length-1];
			let window_points = new Queue();
			let start = -1;
			fixations = [];
			let i = 0;
			let max_x = -1, min_x = Number.MAX_VALUE, max_y = -1, min_y = Number.MAX_VALUE;
			
			let fix = null;

			while(i < data.t.length){
				while( ((data.x[i] == 0 && data.y[i] == 0) || (data.x[i] <= 0 || data.x[i] >= WIDTH) || (data.y[i] <= 0 || data.y[i] >= HEIGHT) || (Number.isNaN(data.x[i]) || Number.isNaN(data.y[i]))) && i < data.t.length){ 
					i += 1; 
				}
				if(i >= data.t.length)
					break;

				if(window_points.isEmpty()) 
					start = i;				

				//Step 1: Initialise window over first points to cover the duration threshold 
				//first check if window_points already covers the duration threshold
				if(!window_points.isEmpty() && i-1 > start && (data.t[i-1] - data.t[start] >= min_time) ){
					;
				}
				else {
					while( i < data.t.length && (data.t[i] - data.t[start] < min_time) ){
						//insert valid gaze point into window_points
						if((data.x[i] == 0 && data.y[i] == 0)!= true && 
							((data.x[i] <= 0 || data.x[i] >= WIDTH) || (data.y[i] <= 0 || data.y[i] >= HEIGHT))!=true
								&& !Number.isNaN(data.x[i]) && !Number.isNaN(data.y[i])) {
							if(max_x < data.x[i]) max_x = data.x[i];
							if(min_x > data.x[i]) min_x = data.x[i];
							if(max_y < data.y[i]) max_y = data.y[i];
							if(min_y > data.y[i]) min_y = data.y[i];
							window_points.enqueue(new Node({"pointIndex": i}));										
						}
						i += 1;				
					}
				}

				//Step 2: check if dispersion of window points <= dispersion threshold 
				if((!window_points.isEmpty() && max_x - min_x + max_y - min_y) < max_dist) {
					let j = window_points.front().data.pointIndex;
					let tail = i - 1;

					if(j + 1 < data.t.length) {						
						fix = {x: ((data.x[j] *SCALE_X)- offset_xdata), y: ((data.y[j] *SCALE_Y)- offset_ydata), t: data.t[j], dt: (data.t[j+1] - data.t[j]),
							real_t_start: 0, real_t_end: 0, cumul_t_start: 0, cumul_t_end: 0 };
						j += 1;

						//Step 3: Determine fixation based on window_points
						while(j <= tail){

							//check if this is a valid gaze point
							if((data.x[j] == 0 && data.y[j] == 0)!= true && 
							((data.x[j] <= 0 || data.x[j] >= WIDTH) || (data.y[j] <= 0 || data.y[j] >= HEIGHT))!=true
								&& !Number.isNaN(data.x[j]) && !Number.isNaN(data.y[j])) {

									if(fix == null && j + 1 < data.t.length) {			
										fix = {x: ((data.x[j] *SCALE_X)- offset_xdata), y: ((data.y[j] *SCALE_Y)- offset_ydata), t: data.t[j], dt: (data.t[j+1] - data.t[j]),
											real_t_start: 0, real_t_end: 0, cumul_t_start: 0, cumul_t_end: 0 };
									}	
									else if(j + 1 < data.t.length){
										ddt = data.t[j+1] - data.t[j];
										fix.x = (fix.dt*fix.x + ((data.x[j] *SCALE_X)- offset_xdata)*ddt ) / (fix.dt + ddt);
										fix.y = (fix.dt*fix.y + ((data.y[j] *SCALE_Y)- offset_ydata)*ddt ) / (fix.dt + ddt);
										fix.dt += ddt;
									}
							}
							j+=1;
						}
						//Step 4: Add additional points to the window until dispersion > threshold
						while( i < data.t.length ){

							//insert valid gaze point into window_points
							if((data.x[i] == 0 && data.y[i] == 0)!= true && 
								((data.x[i] <= 0 || data.x[i] >= WIDTH) || (data.y[i] <= 0 || data.y[i] >= HEIGHT))!=true
									&& !Number.isNaN(data.x[i]) && !Number.isNaN(data.y[i])) {
								if(max_x < data.x[i]) max_x = data.x[i];
								if(min_x > data.x[i]) min_x = data.x[i];
								if(max_y < data.y[i]) max_y = data.y[i];
								if(min_y > data.y[i]) min_y = data.y[i];

								//check if dispersion of window points <= dispersion threshold 
								if((max_x - min_x + max_y - min_y) < max_dist) {
									//Note a fixation
									if(i + 1 < data.t.length){
										ddt = data.t[i+1] - data.t[i];
										fix.x = (fix.dt*fix.x + ((data.x[i] *SCALE_X)- offset_xdata)*ddt ) / (fix.dt + ddt);
										fix.y = (fix.dt*fix.y + ((data.y[i] *SCALE_Y)- offset_ydata)*ddt ) / (fix.dt + ddt);
										fix.dt += ddt;
										window_points.enqueue(new Node({"pointIndex": i}));										
									}									
								}
								else
									break;
							}
							i += 1;				
						}
						//Step 5: insert fixation into fixs
						fixations.push(fix);

						//Step 6: Reraovewindow points from points 
						while(!window_points.isEmpty())
							window_points.dequeue();
						fix = null;
						start = -1;
						max_x = -1; min_x = Number.MAX_VALUE; max_y = -1; min_y = Number.MAX_VALUE;
					}
				}
				else {
					//Remove first point from window 
					window_points.dequeue();
					if(!window_points.isEmpty())					
						start = window_points.front().data.pointIndex;
					fix = null;

					//update min, max value for dispersion calculation
					let j = start;
					let tail = i - 1;

					max_x = -1; min_x = Number.MAX_VALUE; max_y = -1; min_y = Number.MAX_VALUE;

					while(j <= tail){
						if(max_x < data.x[j]) max_x = data.x[j];
						if(min_x > data.x[j]) min_x = data.x[j];
						if(max_y < data.y[j]) max_y = data.y[j];
						if(min_y > data.y[j]) min_y = data.y[j];
						j+=1;
					}
				}
			}
			data.fixs = fixations;

		}else if(TIME_STRAT == 'cumulative'){
			var cumul = 0;
			data.t_start = cumul; 
			fixations = [];			
						
			let window_points = new Queue();
			let start = -1;
			let i = 0;
			let max_x = -1, min_x = Number.MAX_VALUE, max_y = -1, min_y = Number.MAX_VALUE;

			let fix = null;

			while(i < data.t.length){
				while( ((data.x[i] == 0 && data.y[i] == 0) || (data.x[i] <= 0 || data.x[i] >= WIDTH) || (data.y[i] <= 0 || data.y[i] >= HEIGHT) || (Number.isNaN(data.x[i]) || Number.isNaN(data.y[i]))) && i < data.t.length){ 
					i += 1; 
				}
				if(i >= data.t.length)
					break;

				if(window_points.isEmpty()) 
					start = i;				

				//Step 1: Initialise window over first points to cover the duration threshold 
				//first check if window_points already covers the duration threshold
				if(!window_points.isEmpty() && i-1 > start && (data.t[i-1] - data.t[start] >= min_time) ){
					;
				}
				else {
					while( i < data.t.length && (data.t[i] - data.t[start] < min_time) ){

						//insert valid gaze point into window_points
						if((data.x[i] == 0 && data.y[i] == 0)!= true && 
							((data.x[i] <= 0 || data.x[i] >= WIDTH) || (data.y[i] <= 0 || data.y[i] >= HEIGHT))!=true
								&& !Number.isNaN(data.x[i]) && !Number.isNaN(data.y[i])) {
							if(max_x < data.x[i]) max_x = data.x[i];
							if(min_x > data.x[i]) min_x = data.x[i];
							if(max_y < data.y[i]) max_y = data.y[i];
							if(min_y > data.y[i]) min_y = data.y[i];
							window_points.enqueue(new Node({"pointIndex": i}));										
						}
						i += 1;				
					}
				}

				//Step 2: check if dispersion of window points <= dispersion threshold 
				if((!window_points.isEmpty() && max_x - min_x + max_y - min_y) < max_dist) {
					let j = window_points.front().data.pointIndex;
					let tail = i - 1;

					if(j + 1 < data.t.length) {						
						fix = {x: ((data.x[j] *SCALE_X)- offset_xdata), y: ((data.y[j] *SCALE_Y)- offset_ydata), t: data.t[j], dt: (data.t[j+1] - data.t[j]),
								real_t_start: data.t[i], real_t_end: 0, cumul_t_start: cumul, cumul_t_end: 0};
						j += 1;

						//Step 3: Determine fixation based on window_points
						while(j <= tail){

							//check if this is a valid gaze point
							if((data.x[j] == 0 && data.y[j] == 0)!= true && 
							((data.x[j] <= 0 || data.x[j] >= WIDTH) || (data.y[j] <= 0 || data.y[j] >= HEIGHT))!=true
								&& !Number.isNaN(data.x[j]) && !Number.isNaN(data.y[j])) {

									if(fix == null && j + 1 < data.t.length) {			
										fix = {x: ((data.x[j] *SCALE_X)- offset_xdata), y: ((data.y[j] *SCALE_Y)- offset_ydata), t: data.t[j], dt: (data.t[j+1] - data.t[j]),
											real_t_start: 0, real_t_end: 0, cumul_t_start: 0, cumul_t_end: 0 };
									}	
									else if(j + 1 < data.t.length){
										ddt = data.t[j+1] - data.t[j];
										fix.x = (fix.dt*fix.x + ((data.x[j] *SCALE_X)- offset_xdata)*ddt ) / (fix.dt + ddt);
										fix.y = (fix.dt*fix.y + ((data.y[j] *SCALE_Y)- offset_ydata)*ddt ) / (fix.dt + ddt);
										fix.dt += ddt;
										fix.real_t_end = data.t[j];
										fix.t = cumul;
									}
							}
							j+=1;
						}
						//Step 4: Add additional points to the window until dispersion > threshold
						while( i < data.t.length ){

							//insert valid gaze point into window_points
							if((data.x[i] == 0 && data.y[i] == 0)!= true && 
								((data.x[i] <= 0 || data.x[i] >= WIDTH) || (data.y[i] <= 0 || data.y[i] >= HEIGHT))!=true
									&& !Number.isNaN(data.x[i]) && !Number.isNaN(data.y[i])) {
								if(max_x < data.x[i]) max_x = data.x[i];
								if(min_x > data.x[i]) min_x = data.x[i];
								if(max_y < data.y[i]) max_y = data.y[i];
								if(min_y > data.y[i]) min_y = data.y[i];

								//check if dispersion of window points <= dispersion threshold 
								if((max_x - min_x + max_y - min_y) < max_dist) {
									//Note a fixation
									if(i + 1 < data.t.length){
										ddt = data.t[i+1] - data.t[i];
										fix.x = (fix.dt*fix.x + ((data.x[i] *SCALE_X)- offset_xdata)*ddt ) / (fix.dt + ddt);
										fix.y = (fix.dt*fix.y + ((data.y[i] *SCALE_Y)- offset_ydata)*ddt ) / (fix.dt + ddt);
										fix.dt += ddt;
										fix.real_t_end = data.t[i];
										fix.t = cumul;
										window_points.enqueue(new Node({"pointIndex": i}));										
									}									
								}
								else
									break;
							}
							i += 1;				
						}
						//Step 5: insert fixation into fixs
						cumul += fix.dt; // append fixation time to cumulative time
						fix.cumul_t_end = cumul;
						fixations.push(fix);

						//Step 6: Reraovewindow points from points 
						while(!window_points.isEmpty())
							window_points.dequeue();
						fix = null;
						start = -1;
						max_x = -1; min_x = Number.MAX_VALUE; max_y = -1; min_y = Number.MAX_VALUE;
					}
				}
				else {
					//Remove first point from window 
					window_points.dequeue();
					if(!window_points.isEmpty())					
						start = window_points.front().data.pointIndex;
					fix = null;

					//update min, max value for dispersion calculation
					let j = start;
					let tail = i - 1;

					max_x = -1; min_x = Number.MAX_VALUE; max_y = -1; min_y = Number.MAX_VALUE;

					while(j <= tail){
						if(max_x < data.x[j]) max_x = data.x[j];
						if(min_x > data.x[j]) min_x = data.x[j];
						if(max_y < data.y[j]) max_y = data.y[j];
						if(min_y > data.y[j]) min_y = data.y[j];
						j+=1;
					}
				}
			}
			data.t_end = cumul;
			data.fixs = fixations;
		}
	}
	saccades = []; SAC_STEP_LENGTH = Math.max( WIDTH/30, HEIGHT/30 );
	for(var i=0; i<fixations.length - 1; i++){
		sac = {x1:fixations[i].x, y1:fixations[i].y, x2:fixations[i+1].x, y2:fixations[i+1].y, t1:fixations[i].t, t2:fixations[i+1].t,
		length:0, glance:false, xs:[], ys:[], n:0 };
		sac.length = Math.sqrt((sac.x1 - sac.x2)**2 + (sac.y1 - sac.y2)**2);
		if(i>0){
			dist_before = Math.sqrt((sac.x2 - fixations[i-1].x)**2 + (sac.y2 - fixations[i-1].y)**2);
			if(dist_before * 3 < sac.length){ sac.glance = true; }
		}
		if(i+2 < fixations.length){
			dist_after = Math.sqrt((sac.x1 - fixations[i+2].x)**2 + (sac.y1 - fixations[i+2].y)**2);
			if(dist_after * 3 < sac.length){ sac.glance = true; }
		}
		sac.n = Math.max(2, Math.floor(sac.length / SAC_STEP_LENGTH));
		for(m=0; m<sac.n; m++){
			sac.xs.push( (sac.x1*(sac.n-m-1) + sac.x2*m)/(sac.n-1) );
			sac.ys.push( (sac.y1*(sac.n-m-1) + sac.y2*m)/(sac.n-1) );
		}
		sac.tan = Math.atan2(sac.y1 - sac.y2, sac.x1 - sac.x2);
		saccades.push(sac);
	}
	data.sacs = saccades;

	background_changed = true; timeline_changed = true; foreground_changed = true;
	NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING = 0;
}
function rebuild_clustering(){
	if(DATASETS.length == 0) return;
	for(var i=0; i<DATASETS.length; i++){
		if(DATASETS[i] != undefined && DATASETS[i].included) {
			cluster_dataset(DATASETS[i]);

			if( DATASETS[i].tois.length > 1 ){
				//iterate through TWIs, update TWI range to reflect time strategy
				for(let toi=0;toi<DATASETS[i].tois.length; toi++){
					if(DATASETS[i].tois[toi] != undefined && DATASETS[i].tois[toi].included) {
						if(TIME_STRAT == 'real' && DATASETS[i].tois[toi].real_range != undefined && DATASETS[i].tois[toi].real_range[0] != undefined){
							DATASETS[i].tois[toi].range[0] = (DATASETS[i].tois[toi].real_range[0] - DATASETS[i].t_start)/(DATASETS[i].t_end - DATASETS[i].t_start);
							DATASETS[i].tois[toi].range[1] = (DATASETS[i].tois[toi].real_range[1] - DATASETS[i].t_start)/(DATASETS[i].t_end - DATASETS[i].t_start);
						}
						else if(TIME_STRAT =='cumulative'){
							
							convert_from_real_to_cumulative_time(DATASETS[i], DATASETS[i].tois[toi].range, DATASETS[i].tois[toi].real_range, false);
							
						}
					}					
				}	
				if(DATASETS[i].toi_id > 0) { //non-default TWI
					slider = document.getElementById(i+'_sl').noUiSlider;
					slider.set(DATASETS[i].tois[DATASETS[i].toi_id].range);			
				}
			}
		}			
	}	
	window.setTimeout(update_all, 100);
	compute_all_metrics();
}
function data_resize(){
	offset_xdata = +document.getElementById('offset_xdata').value;
	offset_ydata = +document.getElementById('offset_ydata').value;
	var crop_ref = crop_stack[0];
	if(OFFSET_X != crop_ref[0] || OFFSET_Y != crop_ref[1] || WIDTH != crop_ref[2] || HEIGHT != crop_ref[3]){limit_select = true}
	offset_xdata = offset_xdata + OFFSET_X;
	offset_ydata = offset_ydata + OFFSET_Y;
	rebuild_clustering(); 
	background_changed=true;
}
function check_sacc_filter(sac){
	//directional filter
	dir = (Math.floor( (sac.tan * 4) / Math.PI + 0.5) + 4) % 8;
	if( !document.getElementById('d'+dir).checked){ return false;}
	//type filter
	if(sac.length < SHORT_LENGTH){ if(!document.getElementById('dshort').checked){return false;} }
	else if(sac.glance){ if(!document.getElementById('dglance').checked){return false;} }
	else{ if(!document.getElementById('dbasic').checked){return false;} }
	if( SACC_FILTER == 'none' ){ return true; }
	x1 = sac.x1; y1 = sac.y1; x2 = sac.x2; y2=sac.y2;
	// across, between, inside
	if(lenses.length == 0){ return true; }
	
	if( SACC_FILTER=='between' || selected_lens==-1){ // filters that don't need the selected lens
		enters = false; leaves = false; inside = false;
		for(i = 0; i < lenses.length; i++){
			a = lenses[i].inside(x1,y1); b = lenses[i].inside(x2,y2);
			if(a && !b){ leaves = true;}
			if(b && !a){ enters = true;}
			if(b &&  a){ inside = true;}
		}
		if( SACC_FILTER == 'between' ){
			return enters && leaves;
		}else if( SACC_FILTER == 'tofrom'){
			return enters || leaves;
		}else if( SACC_FILTER == 'inside'){
			return inside;
		}else if( SACC_FILTER == 'around'){
			return !enters && !leaves;
		}
	}
	l = base_lenses[selected_lens];
	starts = l.inside(x1,y1); ends = l.inside(x2,y2);
	
	if( SACC_FILTER == 'tofrom'){
		return starts != ends;
	}else if( SACC_FILTER == 'inside'){
		return starts && ends;
	}else if( SACC_FILTER == 'around'){
		return !starts && !ends;
	}
	return false;
}
SAC_FILTER_CHANGED = true;
let filter_saccade_by_toi = (saccades, toi) => {
	let j = 0;
	while(j < saccades.length && saccades[j].t1 < toi.tmin){ 
		j += 1;
		//KT: handle exception when saccades[j] is undefined; need to find out the root cause why it is undefined
		while(saccades[j] == undefined) {
			j += 1;
			if(j >= saccades.length)
				break;
		}
	}
	for(; j<saccades.length && saccades[j].t2 < toi.tmax; j++){
		saccades[j].filter = check_sacc_filter(saccades[j]);
	}
}
function filter_saccades(){
	for(im=0;im<VALUED.length;im++){
		v = VALUED[im];
		if(v>=0 && v<DATASETS.length && DATASETS[v].initialised){
			let data = DATASETS[v];
			
			if(data == undefined || !data.included)
				continue;
			if(DAT_MODE == 1 && data.group != selected_grp)
				continue;
			else if(DAT_MODE == 2 && v != selected_data)
				continue;

			let saccades = DATASETS[v].sacs;
			
			//reset all sacs to default
			saccades.forEach((saccade) => {if(saccade != undefined) saccade.filter = false;});

			//filter sacs by TWI_MODE
			if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
				let twi_id = data.tois[data.toi_id].twi_id;
				if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
					filter_saccade_by_toi(saccades, data.tois[data.toi_id]);					
				}
			}else if(TWI_MODE == 1 && selected_twigroup != -1){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						filter_saccade_by_toi(saccades, data.tois[c]);	
					}
				}
			}else if(TWI_MODE == 0){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						filter_saccade_by_toi(saccades, data.tois[c]);	
					}
				}
			}
		}
	}
	SAC_FILTER_CHANGED = false;
}
// bundle
is_bundling = false; last_response = '';
function bundle(){
	if(DATASETS.length == 0) return;
	is_bundling = true; ATTACH_DATA = []; SEND_DATA = [];
	document.getElementById("saccades_bundling_status_txt").innerHTML = "Bundling in progress.";
	NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING = 0;
	use_dir = 0; if(COLOUR_MODE == "direction"){use_dir=1;}
	if(COLOUR_MODE == "group" || COLOUR_MODE == "direction"){
		// build the data structure
		for(v=0;v<VALUED.length;v++){
			if(DATASETS[VALUED[v]] == undefined || !DATASETS[VALUED[v]].included)
				continue;
			sacs = DATASETS[VALUED[v]].sacs;
			read = []; L = []; X = []; Y = [];
			for(i=0; i<sacs.length;i++){
				if(sacs[i].filter && sacs[i].xs.length > 2){
					read.push(i);
					L.push(1); X.push(Math.floor(sacs[i].xs[0])); Y.push(Math.floor(sacs[i].ys[0]));
					for(j=1; j<sacs[i].xs.length-1; j++){
						L.push(0); X.push(Math.floor(sacs[i].xs[j])); Y.push(Math.floor(sacs[i].ys[j]));
					}
					L.push(1); X.push(Math.floor(sacs[i].xs[sacs[i].xs.length-1])); Y.push(Math.floor(sacs[i].ys[sacs[i].xs.length-1]));
				}
			}
			ATTACH_DATA.push(read);
			NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING += read.length;
			SEND_DATA.push([VALUED[v], use_dir, BUNDLE_K, BUNDLE_H, L, X, Y]);			
		}
	}else if(COLOUR_MODE == "type"){
		// build the data structure
		for(v=0;v<VALUED.length;v++){
			if(DATASETS[VALUED[v]] == undefined || !DATASETS[VALUED[v]].included)
				continue;
			sacs = DATASETS[VALUED[v]].sacs;
			// do the glances
			read = []; L = []; X = []; Y = [];
			for(i=0; i<sacs.length;i++){
				if(sacs[i].filter &&  sacs[i].glance && sacs[i].xs.length > 2 && sacs[i].length > SHORT_LENGTH){
					read.push(i);
					L.push(1); X.push(Math.floor(sacs[i].xs[0])); Y.push(Math.floor(sacs[i].ys[0]));
					for(j=1; j<sacs[i].xs.length-1; j++){
						L.push(0); X.push(Math.floor(sacs[i].xs[j])); Y.push(Math.floor(sacs[i].ys[j]));
					}
					L.push(1); X.push(Math.floor(sacs[i].xs[sacs[i].xs.length-1])); Y.push(Math.floor(sacs[i].ys[sacs[i].xs.length-1]));
				}
			}
			ATTACH_DATA.push(read);
			NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING += read.length;
			SEND_DATA.push([VALUED[v], use_dir, BUNDLE_K, BUNDLE_H, L, X, Y]);
			// do the non glances
			read = []; L = []; X = []; Y = [];
			for(i=0; i<sacs.length;i++){
				if(sacs[i].filter &&  !sacs[i].glance && sacs[i].xs.length > 2 && sacs[i].length > SHORT_LENGTH){
					read.push(i);
					L.push(1); X.push(Math.floor(sacs[i].xs[0])); Y.push(Math.floor(sacs[i].ys[0]));
					for(j=1; j<sacs[i].xs.length-1; j++){
						L.push(0); X.push(Math.floor(sacs[i].xs[j])); Y.push(Math.floor(sacs[i].ys[j]));
					}
					L.push(1); X.push(Math.floor(sacs[i].xs[sacs[i].xs.length-1])); Y.push(Math.floor(sacs[i].ys[sacs[i].xs.length-1]));
				}
			}
			ATTACH_DATA.push(read);
			NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING += read.length;
			SEND_DATA.push([VALUED[v], use_dir, BUNDLE_K, BUNDLE_H, L, X, Y]);
		}
	}
	// send the post request
	req = new XMLHttpRequest(); req.ATTACH_DATA = ATTACH_DATA;
	req.open('POST', "bundle", true);
	req.send(JSON.stringify(SEND_DATA));
	req.onreadystatechange=function(){
		if(this.readyState==4 && this.status==200){ // reattach computed result
			if(!DO_BUNDLE){is_bundling=false;return;}
			if(this.responseText != "failed"){
				last_response = this.responseText;
				try {
					result = JSON.parse(this.responseText);
					for(i=0; i < result.length; i++){
						val = result[i][0]; X = result[i][1]; Y = result[i][2];
						counter = 0;
						// console.log(i, val, this.ATTACH_DATA[i].length);
						for(v=0; v < this.ATTACH_DATA[i].length;v++){
							counter += 1;
							for(j=1; j<DATASETS[val].sacs[this.ATTACH_DATA[i][v]].xs.length-1; j++){
								DATASETS[val].sacs[this.ATTACH_DATA[i][v]].xs[j] = X[counter];
								DATASETS[val].sacs[this.ATTACH_DATA[i][v]].ys[j] = Y[counter];
								counter += 1;
							} counter += 1;
						}
					}
					midground_changed = true;
				}catch(e) {
					if(e instanceof SyntaxError)
						console.log(e);
				}
				// console.log('finish bundle');
			}
			if(DO_BUNDLE){bundle();}
			else{
				is_bundling = false;
				NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING = 0;
				document.getElementById("saccades_bundling_status_txt").innerHTML = "Bundling stopped.";
			}
		}
	}
}


