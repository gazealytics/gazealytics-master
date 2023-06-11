

function download_zip(filename, base64) {
  var element = document.createElement('a');
  element.setAttribute('href', "data:application/zip;base64," + base64);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function make_zip(){
	var zip = new JSZip();
	zip.file('example.txt', 'example text content \nthat we can put \non multiple lines');
	zip.folder("nested").file("hello.txt", "Hello World\n");
	
	zip.file('background.png', );
	zip.generateAsync({type:"base64"}).then(function (base64) { download_zip('veta.zip', base64); });
}

function save_zip(){
	if (DATASETS.length == 0){
		alert("Cannot save blank project!");
		return;
	}
	document.getElementById("project_txt").innerHTML = 'Status: Generating zip file. This may take some time.';
	document.getElementById("save_button").disabled = true;

	zip = new JSZip();
	zip.file('back.png', image_url.substring(image_url.indexOf('base64,')+7), {base64: true});
	console.log("save...", "offset_xdata", offset_xdata, "offset_ydata", offset_ydata,
	"OFFSET_X", OFFSET_X, "OFFSET_Y", OFFSET_Y, "WIDTH", WIDTH, "HEIGHT", HEIGHT , "crop_stack", crop_stack);
	let content = {
			cid:cid, lid:lid,
			//lenshtml: document.getElementById('lenslist').innerHTML, base_lenses: base_lenses, selected_lens: selected_lens, building_lens_id: building_lens_id,
			//datahtml: document.getElementById('mylist').innerHTML, datasets: DATASETS, selected_data: selected_data,
			//image_url: image_url,
			width: WIDTH, height: HEIGHT, offset_x: OFFSET_X, offset_y: OFFSET_Y, 
			offset_xdata: offset_xdata, offset_ydata: offset_ydata, scale_x: SCALE_X, scale_y: SCALE_Y, limit_select: limit_select, 
			pos_ratio: pos_ratio, inv_ratio: inv_ratio, height_adjust:height_adjust, width_adjust:width_adjust, crop_stack: crop_stack,
			grid_n: GRID_N, back_bright:BACK_BRIGHT, time_window: TIMELINE_MOUSEOVER_WINDOW,
			fix_size: FIX_SIZE, fix_alpha: FIX_ALPHA, topo_soften: TOPO_SOFTEN, topo_shape: TOPO_SHAPE,
			min_time: min_time, max_dist: max_dist,
			sacc_bright: SACC_BRIGHT, sacc_blur: SACC_BLUR,
			sacc_filter: SACC_FILTER, colour_mode: COLOUR_MODE, filter_switches: [],
			short_sacc_length: SHORT_LENGTH,
			bundle_k: BUNDLE_K, bundle_h: BUNDLE_H, 
			number_sacc_considered_in_bundling: NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING,
			fore_size: FORE_SIZE,
			// simple switches
			show_fix: SHOW_FIX, show_topo: SHOW_TOPO, show_saccade: SHOW_SACCADE,
			use_size: USE_SIZE, show_fore: SHOW_FORE,
			time_data: TIME_DATA, show_lens: SHOW_LENS,
			// matrix controls
			mat_row_val: mat_row_val, mat_col_val:mat_col_val, matrix_data_state: MATRIX_DATA_STATE, matrix_values: matrix_values , matrix_colours: matrix_colours,
			matrix_write: MATRIX_WRITE, matrix_minimap: MATRIX_MINIMAP, default_symmetric_sort: DEFAULT_SYMMETRIC_SORT, sort_selected_name: sort_selected_name,
			is_sort_initiated_column: is_sort_initiated_column, is_sort_initiated_rows: is_sort_initiated_rows, previous_matrix_data_state: PREVIOUS_MATRIX_DATA_STATE,
			mat_type: mat_type, hist_metric: HIST_METRIC, type_hist: type_hist, bins_n: BINS_N,
			// colour controls
			GROUPINGS:GROUPINGS, SACC_TYPES:SACC_TYPES, DIRECTIONS:DIRECTIONS, ORDERED:ORDERED, MATCOL:MATCOL, TWIS_COLOURS: TWIS_COLOURS, LENS_COLOURS: LENS_COLOURS,
			// GUI aspect ratio controls
			MATRIX_CANVAS_WIDTH_PERCENTAGE: MATRIX_CANVAS_WIDTH_PERCENTAGE, MATRIX_CANVAS_HEIGHT_PERCENTAGE: MATRIX_CANVAS_HEIGHT_PERCENTAGE, DATA_TOP_WIDTH_PERCENTAGE: DATA_TOP_WIDTH_PERCENTAGE,
			DATA_TOP_WIDTH_PERCENTAGE_times_100: DATA_TOP_WIDTH_PERCENTAGE_times_100, DATA_TOP_HEIGHT_PERCENTAGE: DATA_TOP_HEIGHT_PERCENTAGE, MATRIX_WRAPPER_HEIGHT_PERCENTAGE: MATRIX_WRAPPER_HEIGHT_PERCENTAGE,
			MATRIX_WRAPPER_HEIGHT_PERCENTAGE_times_100: MATRIX_WRAPPER_HEIGHT_PERCENTAGE_times_100,
			// DAT_MODE and TWI_MODE
			DAT_MODE: DAT_MODE, TWI_MODE: TWI_MODE, LENSE_MODE: LENSE_MODE,
			HAAR_VALUE: HAAR_VALUE,
			TIME_STRAT: TIME_STRAT
			};
	//attach the on/off values of the saccade filters by type and direction
	for(i=0; i<8; i++){
		content.filter_switches.push( document.getElementById('d'+i).checked == true );
	}
	content.filter_switches.push( document.getElementById('dshort').checked == true );
	content.filter_switches.push( document.getElementById('dglance').checked == true );
	content.filter_switches.push( document.getElementById('dbasic').checked == true );
	json_content = JSON.stringify(content);
	zip.file('settings.json', json_content);
	
	json_lenses = JSON.stringify( { base_notes:base_notes, selected_note:selected_note } );
	zip.file('notes.json', json_lenses);
	
	json_lenses = JSON.stringify( { base_lenses: base_lenses, order_lenses:order_lenses, selected_lens: selected_lens, building_lens_id: building_lens_id, selected_lensegroup: selected_lensegroup } );
	zip.file('AOIs.json', json_lenses);
	
	json_twis = JSON.stringify( { base_twis: base_twis, order_twis:order_twis, selected_twi: selected_twi, selected_twigroup: selected_twigroup } );
	zip.file('TWIs.json', json_twis);

	json_datasets = JSON.stringify( { datasets: DATASETS, selected_data: selected_data, selected_grp: selected_grp } );
	zip.file('Participants.json', json_datasets);
	
	zip.file('tois.tsv', list_tois());
	zip.file('matrix.tsv', list_matrix_values());
	let hit_aoi_index = -1;
	let hit_aoi_group_index = -1;
	for(var V=0; V<VALUED.length; V++){
		if (DATASETS[VALUED[V]].should_save != false){
			filename = DATASETS[VALUED[V]].name + '.tsv';
			
			file = 't\tx\ty\tdt'; // header line
			for(l=0;l<lenses.length;l++){ file += '\t'+lenses[l].name; }
			file += '\thit_aoi_index\thit_aoi_group_index';
			file += '\n';
			
			data = DATASETS[VALUED[V]]; fixs = data.fixs; toi = data.tois[DATASETS[VALUED[V]].toi_id];
			for(j=0;j<fixs.length;j++){
				hit_aoi_index = -1;
				hit_aoi_group_index = -1;
				if( fixs[j].t >= data.tmin && fixs[j].t < data.tmax ){
					file += fixs[j].t+'\t'+fixs[j].x+'\t'+fixs[j].y+'\t'+fixs[j].dt;
					for(l=0;l<lenses.length;l++){ 
						let bHit = lenses[l].inside(fixs[j].x, fixs[j].y);
						file += '\t'+ bHit; 
						if(bHit && hit_aoi_index < 0) {
							hit_aoi_index = l;
							hit_aoi_group_index = ORDERLENSEGROUPID.indexOf(lenses[l].group);
						}						
					}
					file += "\t" + hit_aoi_index + "\t" + hit_aoi_group_index;
					file += "\n";
				}
			}
			zip.file(filename, file);
		}
	}
	
	//zip.generateAsync({type:"base64"}).then(function (base64) { download_zip(zip_name(), base64); console.log('zipping complete'); });
	zip.generateAsync({type:"blob"}).then(function (data) { console.log("zip downloading"); saveAs(data, zip_name()); console.log('zipping complete'); document.getElementById("project_txt").innerHTML = '';	document.getElementById("save_button").disabled = false;});
}

function zip_name(){
	date = new Date(Date.now());
	datevalues = [
	   date.getFullYear(),
	   date.getMonth()+1,
	   date.getDate(),
	   date.getHours(),
	   date.getMinutes(),
	   date.getSeconds(),
	];
	return 'Gazealytics_' + ( date.getMonth()+1 ) + '-' + date.getDate() + '-' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.zip';
}


function load_zip(){
	document.getElementById("project_txt").innerHTML = 'Loading...';
	document.getElementById("load_button").disabled = true;
	f = document.getElementById('state_f').files[0];
	if(f==undefined){
		document.getElementById("project_txt").innerHTML = '';
		document.getElementById("load_button").disabled = false;
		return;
	}
	JSZip.loadAsync(f)                                   // 1) read the Blob
		.then(function(zip) {
			zip.file("back.png").async("base64").then(function (data) {
					image_url = "data:image/png;base64," + data;
					image_changed = true; loaded = true; 
				});
			zip.file("AOIs.json").async("string").then(function (data) {
					try{
						let content = JSON.parse(data);
						// update lenses array, rebuild lens functions
						base_lenses = content.base_lenses; order_lenses = content.order_lenses; lid = base_lenses.length;
						selected_lens = content.selected_lens; building_lens_id = content.building_lens_id; selected_lensegroup = content.selected_lensegroup

						base_lenses.forEach((lense) => {
							lense.processed = false;
						})
						
						//backward compatibility
						if(selected_lensegroup == null || selected_lensegroup == undefined)
							selected_lensegroup = 0;

						for(let v=0; v < base_lenses.length; v++){						
							//backward compatibility
							if(selected_lens >= 0){
								if(selected_lens == base_lenses[v].id) {
									selected_lens = v; 
									selected_lensegroup = base_lenses[v].group;
								}									
							}
							if(selected_lens >= 0 && !base_lenses[selected_lens].included) {
								selected_lens = -1;
								selected_lensegroup = -1;
							}								
							base_lenses[v].id = v;
						}

						// = content.lenshtml;
						list = document.getElementById('lenslist');
						list.innerHTML = "";

						//reload the order of lenses
						for(let i = 0; i < order_lenses.length; i++) {
							let v = order_lenses[i];

							base_lenses[v].processed = true;
							if( base_lenses[v].included ){
								q = lensbox.replace(/#/g, v);
								var node = document.createElement("li");
								node.innerHTML = q; node.id = "lens_"+v;
								// node.setAttribute('onclick', "if(selected_lens!="+v+"){select_lens("+v+");}else{select_lens(-1);}console.log('target', e.target);");
								node.onclick = function(e){
									var ec = e.target.className;
									var ecs = e.target.className.split(' ')[0];
									var ecid = e.target.id.split('_')[2];
									var v = parseInt(this.id.split('_')[1]);
									// selection conditions
									if( ec != 'num' && ecs != 'fas' && ecid != 'name'){
										if(selected_lens!=v){select_lens(v);}else{select_lens(-1);}
									}
									if((ecid === 'name' || ec === 'fas fa-eye-slash') && selected_lens!=v){select_lens(v);}
									if((ec === 'fas fa-eye' || ecs === 'far') && selected_lens === v){select_lens(-1);}
									// var targ = e.target;
								}
								node.setAttribute('class', 'lens_item');
								list.appendChild(node);
								item = document.getElementById('lens_'+v+'_name');
								item.value = base_lenses[v].name;
								item = document.getElementById('lens_'+v+'_c');
								item.checked = base_lenses[v].checked;
								if(item.checked){item.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';}
								item.onclick = function(){ 
									document.getElementById('sort_dropdown').value = 'No_sort'; load_controls(); matrix_changed = true;timeline_changed=true;
									this.checked = !this.checked; 
									if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';}
									not_all_eye('showlens');
								} 
								item = document.getElementById('lens_'+v+'_l');
								item.checked = base_lenses[v].locked;
								if(item.checked){item.innerHTML='<i class="fas fa-lock"></i>';}else{item.innerHTML='<i class="fas fa-lock-open"></i>';} 
								item.onclick = function(){ this.checked = !this.checked; if(this.checked){this.innerHTML='<i class="fas fa-lock"></i>';}else{this.innerHTML='<i class="fas fa-lock-open"></i>';} }
								item = document.getElementById('lens_'+v+'_lensegroup');
								if(!Number.isInteger(base_lenses[v].group) || base_lenses[v].group == undefined || base_lenses[v].group == null)
									base_lenses[v].group = v % LENS_COLOURS.length;								
								
								item.value = base_lenses[v].group;
							}
						}
						//process the remaining lenses
						for(let v=0; v < base_lenses.length; v++){
							if( !base_lenses[v].processed && base_lenses[v].included ){
								q = lensbox.replace(/#/g, v);
								var node = document.createElement("li");
								node.innerHTML = q; node.id = "lens_"+v;
								// node.setAttribute('onclick', "if(selected_lens!="+v+"){select_lens("+v+");}else{select_lens(-1);}console.log('target', e.target);");
								node.onclick = function(e){
									var ec = e.target.className;
									var ecs = e.target.className.split(' ')[0];
									var ecid = e.target.id.split('_')[2];
									var v = parseInt(this.id.split('_')[1]);
									// selection conditions
									if( ec != 'num' && ecs != 'fas' && ecid != 'name'){
										if(selected_lens!=v){select_lens(v);}else{select_lens(-1);}
									}
									if((ecid === 'name' || ec === 'fas fa-eye-slash') && selected_lens!=v){select_lens(v);}
									if((ec === 'fas fa-eye' || ecs === 'far') && selected_lens === v){select_lens(-1);}
									// var targ = e.target;
								}
								node.setAttribute('class', 'lens_item');
								list.appendChild(node);
								item = document.getElementById('lens_'+v+'_name');
								item.value = base_lenses[v].name;
								item = document.getElementById('lens_'+v+'_c');
								item.checked = base_lenses[v].checked;
								if(item.checked){item.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';}
								item.onclick = function(){ 
									document.getElementById('sort_dropdown').value = 'No_sort'; load_controls(); matrix_changed = true;timeline_changed=true;
									this.checked = !this.checked; 
									if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';}
									not_all_eye('showlens');
								} 
								item = document.getElementById('lens_'+v+'_l');
								item.checked = base_lenses[v].locked;
								if(item.checked){item.innerHTML='<i class="fas fa-lock"></i>';}else{item.innerHTML='<i class="fas fa-lock-open"></i>';} 
								item.onclick = function(){ this.checked = !this.checked; if(this.checked){this.innerHTML='<i class="fas fa-lock"></i>';}else{this.innerHTML='<i class="fas fa-lock-open"></i>';} }
								item = document.getElementById('lens_'+v+'_lensegroup');
								if(!Number.isInteger(base_lenses[v].group) || base_lenses[v].group == undefined || base_lenses[v].group == null)
									base_lenses[v].group = v % LENS_COLOURS.length;								
								
								item.value = base_lenses[v].group;
								
								console.log("aoi json: "+base_lenses.map(aoi => aoi.group));
								// console.log("document.getElementById(["+v+"].group="+document.getElementById('lens_'+v+'_lensegroup'));		
							}
							else if(!Number.isInteger(base_lenses[v].group) || base_lenses[v].group == undefined || base_lenses[v].group == null)
								base_lenses[v].group = v % LENS_COLOURS.length;	
						}
						for(var iter=0; iter < base_lenses.length; iter++){
							proto = undefined;
							if(base_lenses[iter].type == 'poly'){
								proto = PolyLens.prototype;
							}else if(base_lenses[iter].type == "ellipse"){
								proto = EllipseLens.prototype;
								base_lenses[iter].fix_up = proto.fix_up;
								// base_lenses[iter].computeArea = proto.computeArea;								
							}else if(base_lenses[iter].type == "rect"){
								proto = RectLens.prototype;
								base_lenses[iter].fix_up = proto.fix_up;
							}
							if(proto != undefined){
								base_lenses[iter].col = proto.col;
								base_lenses[iter].add = proto.add;
								base_lenses[iter].inside = proto.inside;
								base_lenses[iter].near_start = proto.near_start;
								base_lenses[iter].move = proto.move;
								base_lenses[iter].draw = proto.draw;
								base_lenses[iter].make_controls = proto.make_controls;
								// base_lenses[iter].getArea = proto.getArea;
							}
						}
						update_lens_colors();
						background_changed = true; matrix_changed = true; timeline_changed = true;
					}catch (error) { console.error(error); }
				});
				zip.file("TWIs.json").async("string").then(function (data) {
					try{
						let content = JSON.parse(data);
						
						// update lenses array, rebuild lens functions
						base_twis = content.base_twis; order_twis = content.order_twis;
						selected_twi = content.selected_twi; selected_twigroup = content.selected_twigroup;

						// = content.lenshtml;
						list = document.getElementById('twilist');
						list.innerHTML = "";
						for(var v=0; v < base_twis.length; v++){
							if( base_twis[v].included ){
								q = twibox.replace(/#/g, v);
								var node = document.createElement("li");
								node.innerHTML = q; node.id = "twi_"+v;
								// node.setAttribute('onclick', "if(selected_lens!="+v+"){select_lens("+v+");}else{select_lens(-1);}console.log('target', e.target);");
								node.setAttribute('onclick', "select_twi("+v+")");
								node.setAttribute('class', 'data_item');
								list.appendChild(node);
								
								// console.log(" append child");
								item = document.getElementById(v+'_twi_name');
								item.value = base_twis[v].name;

								item = document.getElementById('twi_'+v+'_c');
								item.checked = base_twis[v].checked;
								if(item.checked){item.innerHTML='<i class="fas fa-eye"></i>';}else{item.innerHTML='<i class="fas fa-eye-slash"></i>';}
								item.onclick = function(){ 
									document.getElementById('sort_dropdown').value = 'No_sort'; load_controls(); matrix_changed = true;timeline_changed=true; 
									this.checked = !this.checked; 
									if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';} 
									not_all_eye("showtwis");
								}
								
								document.getElementById(v+'_twigroup').value = base_twis[v].group;
							}
						}
						update_twi_colors();
						background_changed = true; matrix_changed = true; timeline_changed = true;
					}catch (error) { console.error(error); }
				});
			zip.file("Participants.json").async("string").then(function (data) {
					try{
						let content = JSON.parse(data);
						// update datasets array
						DATASETS = content.datasets;
						for(let i = 0; i<DATASETS.length; i++) VIDEOS.push({});
						selected_data = content.selected_data;
						selected_grp = content.selected_grp;
						// console.log("@@@@@ 1 selected_twi: "+selected_twi+", ele: "+document.getElementById("twi_"+selected_twi).classList.value);
						list = document.getElementById('mylist');
						list.innerHTML = "";//content.datahtml;
						for(var v=0; v < DATASETS.length; v++){
							if( DATASETS[v].included ){
								q = databox.replace(/#/g, v);
								var node = document.createElement("li");
								node.innerHTML = q; node.id = v;
								node.setAttribute('onclick', "select_data("+v+")");
								node.setAttribute('class', 'data_item');
								document.getElementById('mylist').appendChild(node);
								// add tois
								for( var i=1; i < DATASETS[v].tois.length; i++ ){
									ltoi = document.getElementById(v+"_toi");
									addtoi = document.getElementById(v+"_addtoi");
									let twi_id = DATASETS[v].tois[i].twi_id;
									if(base_twis[twi_id].included && DATASETS[v].tois[i].included) {
										let node2 = document.createElement("li");
										node2.id = v + "_twi_"+ DATASETS[v].tois[i].twi_id;
										node2.innerHTML = '<center>'+DATASETS[v].tois[i].name+'</center>';
										node2.setAttribute('onclick', "set_toi("+v+","+DATASETS[v].tois[i].twi_id+")");
										ltoi.insertBefore(node2, addtoi);
									}									
								}

								// set controls
								document.getElementById(v+'_name').value = DATASETS[v].name;
								document.getElementById(v+"_c").checked = DATASETS[v].checked;
								document.getElementById(v+'_c').onclick = function(){
									document.getElementById('sort_dropdown').value = 'No_sort';
									this.checked = !this.checked; 
									if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';}
									not_all_eye("time_control_canvas");
									load_controls(); matrix_changed = true;timeline_changed=true; 
								}
								if(DATASETS[v].checked){
									document.getElementById(v+'_c').innerHTML='<i class="fas fa-eye"></i>';
								}
								else{
									document.getElementById(v+'_c').innerHTML='<i class="fas fa-eye-slash"></i>';
								}
								document.getElementById(v+"_g").value = DATASETS[v].group+'';
								noUiSlider.create(document.getElementById(v+'_sl'), {
									start: DATASETS[v].slid_vals, connect: true, step: 0.0001,
									range: {'min': 0, 'max': 1},
									format: {to:function(value){return value;}, from:function(value){return Number(value);} }
								});
								document.getElementById(v+'_sl').noUiSlider.on("update", update_times );

								//backward compatibility
								for(let toi = 0; toi < DATASETS[v].tois.length; toi++){
									if(DATASETS[v].tois[toi].real_range == undefined && TIME_STRAT == 'real') {
										DATASETS[v].tois[toi].real_range = [];
										DATASETS[v].tois[toi].real_range[0] = (DATASETS[v].tois[toi].range[0])*(DATASETS[v].t_end - DATASETS[v].t_start)+DATASETS[v].t_start;
										DATASETS[v].tois[toi].real_range[1] = (DATASETS[v].tois[toi].range[1])*(DATASETS[v].t_end - DATASETS[v].t_start)+DATASETS[v].t_start;
									}
								}
							}
							if(selected_data == v)
								select_data(v);
						}
						if(selected_twi != -1 && document.getElementById("twi_"+selected_twi) != undefined)
							select_twi(selected_twi);
						update_all();
					}catch (error) { console.error(error); }
				});
			zip.file("notes.json").async("string").then(function (data) {
					try{
						let content = JSON.parse(data);
						//json_lenses = JSON.stringify( { base_notes:base_notes, order_notes:order_notes, selected_note:selected_note } );
						list = document.getElementById('notelist');
						list.innerHTML = "";//content.datahtml;
						base_notes = content.base_notes;
						for(var v=0; v < base_notes.length; v++){
							if( base_notes[v].included ){
								q = notebox.replace(/#/g, v);
								var node = document.createElement("li");
								node.innerHTML = q; node.id = "note_"+v;
								// node.setAttribute('onclick', "if(selected_note!="+v+"){select_note("+v+");}else{select_note(-1);}");
								node.onclick = function(e){
									var v = parseInt(this.id.split('_')[1]);
									var e_type = e.target.id.split('_')[2];
									// selection conditions
									if( e_type != 'content' && e_type != 'pid'){
										if(selected_note!=v){select_note(v);}else{select_note(-1);}
									}else{
										if(selected_note!=v){select_note(v);}
									}
								}
								node.setAttribute('class', 'note_item');
								document.getElementById('notelist').appendChild(node);
								document.getElementById('note_'+v+"_content").value = base_notes[v].content;
							}
						}
						select_note( content.selected_note );
					}catch (error) { console.error(error); }
				});
			zip.file("settings.json").async("string").then(function (data) {
					try{
						let content = JSON.parse(data);
						cid = content.cid; //lid = content.lid;
						// update background image
						limit_select = content.limit_select;
						crop_resized = true; crop_stack = content.crop_stack;
						pos_ratio= content.pos_ratio; inv_ratio= content.inv_ratio; height_adjust= content.height_adjust; width_adjust= content.width_adjust;
						// essential numerical values
						if (typeof content.scale_x !== 'undefined') {document.getElementById('SCALE_X').value = content.scale_x; SCALE_X = content.scale_x;}
						if (typeof content.scale_y !== 'undefined') {document.getElementById('SCALE_Y').value = content.scale_y; SCALE_Y = content.scale_y;}
						if (typeof content.offset_xdata !== 'undefined') {document.getElementById('offset_xdata').value = content.offset_xdata - content.offset_x; offset_xdata = content.offset_xdata;}
						if (typeof content.offset_ydata !== 'undefined') {document.getElementById('offset_ydata').value = content.offset_ydata - content.offset_y; offset_ydata = content.offset_ydata;}
						document.getElementById('WIDTH').value = content.width; WIDTH = content.width;
						document.getElementById('HEIGHT').value = content.height; HEIGHT = content.height;
						document.getElementById('OFFSET_X').value = content.offset_x; OFFSET_X = content.offset_x;
						document.getElementById('OFFSET_Y').value = content.offset_y; OFFSET_Y = content.offset_y;
						document.getElementById('GRID_N').value = content.grid_n; GRID_N = content.grid_n;
						document.getElementById("back_sl").noUiSlider.set(content.back_bright); BACK_BRIGHT = content.back_bright;
						document.getElementById("maxdist_sl").noUiSlider.set(content.max_dist); max_dist = content.max_dist;
						document.getElementById("maxdist_val").innerHTML = max_dist +" Pixels";

						document.getElementById("mintime_sl").noUiSlider.set(content.min_time); min_time = content.min_time;
						document.getElementById("mintime_val").innerHTML = min_time +" ms";

						document.getElementById("timewidth").value = content.time_window; TIMELINE_MOUSEOVER_WINDOW = content.time_window;
						document.getElementById('fore_size_sl').noUiSlider.set(content.fore_size); FORE_SIZE = content.fore_size;
						document.getElementById('fix_size_sl').noUiSlider.set(content.fix_size); FIX_SIZE = content.fix_size;
						document.getElementById('fix_alpha_sl').noUiSlider.set(content.fix_alpha); FIX_ALPHA = content.fix_alpha;
						document.getElementById('topo_sl').noUiSlider.set(content.topo_soften); TOPO_SOFTEN = content.topo_soften;
						document.getElementById('topo_shape').value = content.topo_shape; TOPO_SHAPE = content.topo_shape;
						// saccade values: brightness, blur, sacc filter, colour choice, directional and type filters, bundle, bundle rigidity, bundle heat,
						document.getElementById("sacc_bright_sl").noUiSlider.set(content.sacc_bright); SACC_BRIGHT = content.sacc_bright;
						document.getElementById("sacc_blur_sl").noUiSlider.set(content.sacc_blur); SACC_BLUR = content.sacc_blur;
						document.getElementById("aoi_filter_list").value = content.sacc_filter;
						select_fix(content.sacc_filter);
						document.getElementById(content.colour_mode).checked = true; COLOUR_MODE = content.colour_mode;
						for(i=0; i<8; i++){
							document.getElementById('d'+i).checked = content.filter_switches[i];
						}
						document.getElementById('dshort').checked = content.filter_switches[8];
						document.getElementById('dglance').checked = content.filter_switches[9];
						document.getElementById('dbasic').checked == content.filter_switches[10];
						// backward compatibility
						if(content.short_sacc_length != undefined && content.short_sacc_length != null) {
							// short saccade length
							document.getElementById("short_sl").noUiSlider.set(parseInt(content.short_sacc_length)); 
						}		
						if(content.number_sacc_considered_in_bundling != undefined && content.short_sacc_length != null) {
							NUMBER_OF_SACCADE_BEING_CONSIDERED_FOR_BUNDLING = content.number_sacc_considered_in_bundling;
						}
						// bundling values
						document.getElementById("K_sl").noUiSlider.set(Math.log(content.bundle_k)); BUNDLE_K = content.bundle_k;
						document.getElementById("H_sl").noUiSlider.set(Math.log(content.bundle_h)); BUNDLE_H = content.bundle_h;
						// simple switches
						if( SHOW_FIX != content.show_fix){ click_fixs(); }
						if( SHOW_TOPO != content.show_topo){ click_topo(); }
						if( SHOW_SACCADE != content.show_saccade){ click_sacs(); }
						if( TIME_DATA != content.time_data){ click_time(content.time_data); }
						if( USE_SIZE != content.use_size){ click_size(); }
						if( SHOW_FORE != content.show_fore){ click_fore(content.show_fore); }
						if( SHOW_LENS != content.show_lens){ click_lens(); }
						// matrix controls
						mat_row_select(content.mat_row_val, true); mat_col_select(content.mat_col_val, true);
						if(content.matrix_write != undefined){MATRIX_WRITE = content.matrix_write; document.getElementById('matrix_write').checked = content.matrix_write;}
						if(content.matrix_minimap != undefined){MATRIX_MINIMAP = content.matrix_minimap; document.getElementById('matrix_minimap').checked = content.matrix_minimap; }
						if(content.default_symmetric_sort != undefined){DEFAULT_SYMMETRIC_SORT= content.default_symmetric_sort; document.getElementById('sort_dropdown').value = content.default_symmetric_sort;}
						if(content.sort_selected_name != undefined){sort_selected_name = content.sort_selected_name; }
						if(content.is_sort_initiated_column != undefined){is_sort_initiated_column= content.is_sort_initiated_column; }
						if(content.is_sort_initiated_rows != undefined){is_sort_initiated_rows= content.is_sort_initiated_rows;}
						if(content.mat_type != undefined){mat_type = content.mat_type}
						if(content.hist_metric != undefined){HIST_METRIC = content.hist_metric}
						if(content.type_hist != undefined){type_hist = content.type_hist}
						if(content.bins_n != undefined){BINS_N = content.bins_n}
						if(content.previous_matrix_data_state != undefined){ PREVIOUS_MATRIX_DATA_STATE = content.previous_matrix_data_state}
						if(content.matrix_values != undefined){matrix_values = content.matrix_values}
						if(content.matrix_colours != undefined){matrix_colours = content.matrix_colours}
						document.getElementById('metrics_' + mat_sel_type ).value = content.matrix_data_state;
						type_select(mat_type);
						matrix_metric_update();
						
						matrix_redraw=true;
						// colour controls
						// handle backward compatibility
						if(GROUPINGS.length >= content.GROUPINGS.length) {
							for(let i = 0; i < content.GROUPINGS.length; i++){
								GROUPINGS[i] = content.GROUPINGS[i];
							}
						}
						else
							GROUPINGS = content.GROUPINGS;
						DIRECTIONS = content.DIRECTIONS;
						SACC_TYPES = content.SACC_TYPES;
						ORDERED = content.ORDERED;
						MATCOL = content.MATCOL;
						DAT_MODE = content.DAT_MODE;
						LENSE_MODE = content.LENSE_MODE != undefined ? content.LENSE_MODE : 0;
						TWI_MODE = content.TWI_MODE;
						if(TWIS_COLOURS.length >= content.TWIS_COLOURS.length) {
							for(let i = 0; i < content.TWIS_COLOURS.length; i++){
								TWIS_COLOURS[i] = content.TWIS_COLOURS[i];
							}
						}
						else
							TWIS_COLOURS = content.TWIS_COLOURS;
						if(LENS_COLOURS.length >= content.LENS_COLOURS.length) {
							for(let i = 0; i < content.LENS_COLOURS.length; i++){
								LENS_COLOURS[i] = content.LENS_COLOURS[i];
							}
						}
						else
							LENS_COLOURS = content.LENS_COLOURS;
						
						if(TWI_MODE == 0) {
							document.getElementsByClassName("twi_mode")[0].innerHTML =	"All TWIs";	
						}
						else if(TWI_MODE == 1) {
							document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI Group";	
						}
						else if(TWI_MODE == 2) {
							document.getElementsByClassName("twi_mode")[0].innerHTML =	"Selected TWI";	
						}

						if(DAT_MODE == 0) {
							document.getElementsByClassName("dat_mode")[0].innerHTML =	"All Samples";								
						}
						else if(DAT_MODE == 1) {
							document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample Group";	
						}
						else if(DAT_MODE == 2) {
							document.getElementsByClassName("dat_mode")[0].innerHTML =	"Selected Sample";	
						}

						if(LENSE_MODE == 0){
							document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI Group";	
						}
						else if(LENSE_MODE == 1){
							document.getElementsByClassName("lense_mode")[0].innerHTML =	"Selected AOI";	
						}
						update_selector_colours();
						if(HIST_METRIC!= undefined && HIST_METRIC != null)
							document.getElementById("hist_metric").value = HIST_METRIC;
						//force updates
						load_controls();
						make_note_dataset_selectors();
						reorder_matrix(DEFAULT_SYMMETRIC_SORT);
						background_changed = true; matrix_changed = true; timeline_changed = true;
					}catch (error) { console.error(error); }
				});
			document.getElementById("project_txt").innerHTML = '';
			document.getElementById("load_button").disabled = false;
		}).catch(function (err) {
			console.log('Unable to parse', err);
			document.getElementById("project_txt").innerHTML = '';
			document.getElementById("load_button").disabled = false;
			});
}











