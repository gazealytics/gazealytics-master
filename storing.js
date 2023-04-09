
// load essential data
function load_file(id){
	f = document.getElementById(id+'_f').files[0];
	var reader = new FileReader();
	newdata = new_dataset(id);
    reader.onload = function(event) {
		try{
			str = reader.result;
			table = str.split('\n');
			newdata.t = [];
			newdata.x = [];
			newdata.y = [];
			for (var i=0; i<table.length; i++) {
				r = table[i].split('\t');
				if(r.length >= 3){
					newdata.t.push(parseFloat(r[0]));
					newdata.x.push(parseFloat(r[1]));
					newdata.y.push(parseFloat(r[2]));
				}
			}
			cluster_dataset(newdata);
			newdata.tois[0].real_range[0] = newdata.t_start;
			newdata.tois[0].real_range[1] = newdata.t_end;
			newdata.initialised = true;			
		}catch( error ){ console.error(error); }
		if( newdata.initialised && newdata.fixs.length > 2){ // new load is valid, accept it
			DATASETS[id] = newdata;
			give_topography(id, 0);
			document.getElementById(id+'_c').checked = true;
			background_changed = true; timeline_changed = true; matrix_changed = true;
		}else if( !DATASETS[v].initialised ){ delete_item(v); } // new load is invalid, and the first load
    }
	reader.readAsText(f);
}

function load_image(){
	f = document.getElementById('im_f').files[0];
	document.getElementById('im_f').value = null;
	var reader = new FileReader();
    reader.onload = function(event) {
		image_url = reader.result; 
		image_changed = true;
		loaded = false;
    }
	reader.readAsDataURL(f);
}
// saving a dataset
function save_data(id){
	data = DATASETS[id]; fixs = data.fixs;
	result = "";
	for(var i=0; i<fixs.length; i++){
		fix = fixs[i];
		line = [fix.t, fix.x, fix.y, fix.dt]
		line.push( fix.t < data.tmax && fix.t > data.tmin );
		for(var j=0; j<lenses.length; j++){
			line.push( lenses[j].inside( fix.x, fix.y ) );
		}
		result += line.join('\t ') + '\n';
	}
	download_file(data.name + ".tsv", result);
}
// downloading an object
function download_file(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
function download_toi(data_id){
	filename = DATASETS[data_id].name + '.tsv';
	
	file = 't\tx\ty\tdt'; // header line
	for(var l=0;l<lenses.length;l++){ file += '\t'+lenses[l].name; }
	file += '\n';
	
	data = DATASETS[data_id]; fixs = data.fixs; toi = data.tois[DATASETS[data_id].toi_id];
	for(var j=0;j<fixs.length;j++){
		if( fixs[j].t >= data.tmin && fixs[j].t < data.tmax ){
			file += fixs[j].t+'\t'+fixs[j].x+'\t'+fixs[j].y+'\t'+fixs[j].dt;
			for(l=0;l<lenses.length;l++){ file += '\t'+lenses[l].inside(fixs[j].x, fixs[j].y); }
			file += "\n";
		}
	}
	download_file(filename, file);
}

function list_tois(){
	file = 'data_id\tdata_name\tgroup\tstart_time\tend_time\ttwi_id\ttoi_name\tstart_time\tend_time' + '\n';
	for(let i=0; i<DATASETS.length; i++){
		let dat = DATASETS[i];
		if( dat.included ){
			t_start = dat.t_start; t_end = dat.t_end; dat_name = dat.name; dat_group = dat.group;
			for(var j=0; j<dat.tois.length; j++){
				toi_name = dat.tois[j].name;
				let twi_id = dat.tois[j].twi_id;
				tmin = t_start + (t_end - t_start) *  dat.tois[j].range[0];
				tmax = t_start + (t_end - t_start) *  dat.tois[j].range[1];
				file += [i, dat_name, dat_group, t_start, t_end, twi_id, toi_name, tmin, tmax].join('\t') + '\n';
			}
		}
	}
	return file;
}
function list_matrix_values(){
	file = overlay_string + '\t' + rownames.join('\t') + '\n';
	for(var i=0; i<colnames.length; i++){
		file += colnames[i];
		file += '\t'
		file += matrix_values[i].join('\t') + '\n';
	}
	return file;
}
function aggregate_hist_metrics_for_export (data, fixs, toi, bins, lense) {
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
}
function histogram_values_string(histogram_data_state_str, sample_selection_str, twi_selection_str){
	
	let file_string = histogram_data_state_str.replaceAll("_", " ") + ' (' + sample_selection_str.replaceAll("_", " ")  + "; "+twi_selection_str.replaceAll("_", " ")+')\n'+'\t';	
	//bins -> coluumns
	//samples -> rows	
	let message = "";
	let aoi_name = "";
	let min_val = 0;
	if( HIST_METRIC == "fix_dur" || HIST_METRIC == "fix_aoi_dur" ) {		
		max_val = 1000;		
	}		
	else if(HIST_METRIC == 'fix_lensegroup_dur' || HIST_METRIC == 'visit_aoi_dur' || HIST_METRIC == 'visit_lensegroup_dur') {
		max_val = 20000;
	}
	else if( HIST_METRIC == "sac_len" )
		max_val = Math.floor(Math.sqrt( WIDTH**2 + HEIGHT**2 ));

	for(let i=0; i < BINS_N; i++){ 
		if( HIST_METRIC == 'fix_dur' ){
			message = "Fixations with duration between %MIN and %MAX ms";
		}else if( HIST_METRIC == 'fix_aoi_dur' ){
			if(base_lenses[selected_lens].name != undefined)
				aoi_name = base_lenses[selected_lens].name;			
			message = "Fixations at AOI %AOI with duration between %MIN and %MAX ms";
		}else if( HIST_METRIC == 'fix_lensegroup_dur' ){
			message = "Fixations at AOI group %AOI with duration between %MIN and %MAX ms";
			aoi_name = selected_lensegroup;
		}else if( HIST_METRIC == 'visit_aoi_dur' ){
			if(base_lenses[selected_lens].name != undefined)
				aoi_name = base_lenses[selected_lens].name;
			message = "Visitations at AOI %AOI with duration between %MIN and %MAX ms";				
		}else if( HIST_METRIC == 'visit_lensegroup_dur' ){
			message = "Visitations at AOI group %AOI with duration between %MIN and %MAX ms";
		}else if( HIST_METRIC == 'sac_len' ){
			if(DAT_MODE == 0)
				message = "Average saccade length by Group between %MIN and %MAX pixels";
			else
				message = "Saccades with length between %MIN and %MAX pixels";
		}
		file_string += (message.replace( "%MIN", num_format(max_val*i/BINS_N )).replace( "%AOI", aoi_name).replace( "%MAX", num_format(max_val*(i+1)/BINS_N)));		
		file_string += "\t";	
	}
	file_string += "\n";

	//fill the data into tmp_bins
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
					aggregate_hist_metrics_for_export(data, data.fixs, data.tois[data.toi_id], tmp_bins, lense);
				}
			}else if(TWI_MODE == 1 && selected_twigroup != -1){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						aggregate_hist_metrics_for_export(data, data.fixs, data.tois[c], tmp_bins, lense);
					}
				}
			}else if(TWI_MODE == 0){
				for(let c=0; c<data.tois.length; c++) {
					let twi_id = data.tois[c].twi_id;
					if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
						aggregate_hist_metrics_for_export(data, data.fixs, data.tois[c], tmp_bins, lense);
					}
				}
			}	
				
			file_string += data.name;
			for(let i=0; i < tmp_bins.length; i++){
				file_string += '\t'
				file_string += tmp_bins[i];
			}
			file_string += '\n';
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
							aggregate_hist_metrics_for_export(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
						}
					}
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
						let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
						if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							aggregate_hist_metrics_for_export(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
						}
					}
				}else if(TWI_MODE == 2 && selected_twi != -1 && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ] != undefined && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].included) {
					let twi_id = DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						aggregate_hist_metrics_for_export(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[DATASETS[used_by[i]].toi_id], tmp_bins, lense);
					}						
				}

				file_string += DATASETS[used_by[i]].name;			
				for(let i=0; i < tmp_bins.length; i++){
					file_string += '\t'
					file_string += tmp_bins[i];
				}
				file_string += '\n';
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
							aggregate_hist_metrics_for_export(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
						}
					}
				}else if(TWI_MODE == 1 && selected_twigroup != -1){
					for(let j=0; j < DATASETS[used_by[i]].tois.length; j++) {
						let twi_id = DATASETS[used_by[i]].tois[j].twi_id;
						if(DATASETS[used_by[i]].tois[j] != undefined && DATASETS[used_by[i]].tois[j].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							aggregate_hist_metrics_for_export(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[j], tmp_bins, lense);
						}
					}
				}else if(TWI_MODE == 2 && selected_twi != -1 && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ] != undefined && DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].included) {
					let twi_id = DATASETS[used_by[i]].tois[ DATASETS[used_by[i]].toi_id ].twi_id;
					if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						aggregate_hist_metrics_for_export(DATASETS[used_by[i]], DATASETS[used_by[i]].fixs, DATASETS[used_by[i]].tois[DATASETS[used_by[i]].toi_id], tmp_bins, lense);
					}						
				}								
			}
			
			if(used_by.length > 0) {
				file_string += ""+(gp+1);

				for(let i=0; i < BINS_N; i++){ Math.floor(tmp_bins[i] /= used_by.length); }

				for(let i=0; i < tmp_bins.length; i++){
					file_string += '\t'
					file_string += tmp_bins[i];
				}
				file_string += '\n';
			}
		}
	}
	return file_string;
}
function matrix_values_string(){
	mat_sel_type = (mat_row_val=='aoi') + (mat_col_val=='aoi');
	var e1 = document.getElementById('metrics_' + mat_sel_type );
	var metric_string = e1.options[e1.selectedIndex].text;
	var sort_string = '';
	var e2 = document.getElementById('sort_dropdown');
	var sort_val = e2.options[e2.selectedIndex].text;
	if(sort_val != '---Choose a matrix reordering method'){sort_string = sort_val+' of '}

	file_string = metric_string + ' (' +sort_string+ MATRIX_VIEW_STATE  +')\n'+'\t'
	
	if(flipped){
		file_string += rownames.join('\t') + '\n';
		for(var i=0; i<colnames.length; i++){
			file_string += colnames[i];
			file_string += '\t'
			file_string += matrix_values[i].join('\t') + '\n';
		}
	}
	else{
		file_string += colnames.join('\t') + '\n';
		for(var r=0; r<rownames.length; r++){
			file_string += rownames[r];
			for(var i=0; i<colnames.length; i++){
				file_string += '\t'
				file_string += matrix_values[i][r] ;
			}
			file_string += '\n'
		}
	}
	return file_string;
}

function saccades_values_string(){
	var sacc_string = '\tSaccade_Count\n';
	for(var r = 0; r < SACC_COUNT.length; r++){
		sacc_string += SACC_GRP[r] + '\t' + SACC_COUNT[r] + '\n';
	}
	sacc_string += 'Short\t' + occ_type[0] + '\nBasic\t' + occ_type[1] +'\nGlance\t' + occ_type[2] +'\n';
	sacc_string += 'N\t' + occ_dir[2] +
					 '\nE\t' + occ_dir[4] +
					 '\nS\t' + occ_dir[6] +
					 '\nW\t' + occ_dir[0] +
					 '\nNE\t' + occ_dir[3] +
					 '\nSE\t' + occ_dir[5] +
					 '\nSW\t' + occ_dir[7] +
					 '\nNW\t' + occ_dir[1] +
					 '\nHit_Any_AOI_Rate\t' + HAAR_VALUE +'\n';
	
	return sacc_string;
}

function load_toi_list(id){
	f = document.getElementById(id+'_toi_f').files[0];
	var reader = new FileReader();
	reader.id = id;
    reader.onload = function(event) {
		try{
			let previous_toi_name = "";
			let tois_to_be_added = [];
			str = this.result;
			table = str.split('\n');
			if( table.length == 0 ){ return; }
			id = this.id;
			let dat = DATASETS[id];
			// while(dat.tois.length > 1){ delete_toi(id, dat.tois[1].twi_id); } // remove any existing tois
			let err_count = 0;
			let toi_start = -1;
		 	let toi_end = 0;
			for(var j=0; j<table.length; j++){
				let row = table[j].split('\t');
				let r_toiname = String(row[0].trim());
				toi_start = row[1]; 
				toi_end = row[2];
				let valid_file = true;
				if(toi_start < dat.t_start || toi_start > dat.t_end) {
					valid_file = false;
					alert("invalid toi: start time should be within the range of the sample's time interval");
				}					
				else if(toi_end < dat.t_start || toi_end > dat.t_end) {
					valid_file = false;
					alert("invalid toi: end time should be within the range of the sample's time interval");
				}				
				if(valid_file) {
					if(r_toiname != null && r_toiname != undefined && (r_toiname.length == 0 || /^\s+$/.test(r_toiname) || (r_toiname.length > 0 && /^[a-zA-Z0-9-_()]+$/.test(r_toiname))) 
						) {
						if(r_toiname != "" && toi_start >= 0 && toi_end > toi_start) {
							//add toi (previous_toi_name, ...)
							
							//before inserting to array, check the toi name, append bracket if the name already appears in the array
							let names = tois_to_be_added.map(x => x.name);
							
							if(names.indexOf(r_toiname)>-1) 
								r_toiname = get_non_duplicate_name(names, r_toiname);

							tois_to_be_added.push({range:[toi_start, toi_end], name:r_toiname+''});
						}											
					}
					
					// if there is content that is not a number, skip
					if(row[1] != undefined && row[2] != undefined) {
						if((row[1].trim().length>0 && isNaN(row[1])) || (row[2].trim().length>0 && isNaN(row[2])) ){
							err_count+=1;
						}
					}						
				}				
			}
			if(previous_toi_name != "" && toi_start >= 0 && toi_end > toi_start) {
				//add toi (previous_toi_name, ...)
				let names = tois_to_be_added.map(x => x.name);
				let sequence = 0;
				if(names.indexOf(previous_toi_name)>-1) 
					previous_toi_name = get_non_duplicate_name(names, previous_toi_name);
				
				tois_to_be_added.push({range:[toi_start, toi_end], name:previous_toi_name+''});
			}

			for(let i = 0; i < tois_to_be_added.length; i++){
				
				let range = [0,0];
				if(TIME_STRAT == 'real'){
					//the start time, end time of TWI is based on ground truth
					range[0] = (tois_to_be_added[i].range[0] - dat.t_start)/(dat.t_end - dat.t_start);
					range[1] = (tois_to_be_added[i].range[1] - dat.t_start)/(dat.t_end - dat.t_start);
				}
				else if(TIME_STRAT =='cumulative'){
					convert_from_real_to_cumulative_time(data, range, tois_to_be_added[i]);
				}

				add_toi(id, range[0], range[1], "", tois_to_be_added[i].name, tois_to_be_added[i].range[0], tois_to_be_added[i].range[1]);				
			}	

			tois_to_be_added.splice(0, tois_to_be_added.length);
			if(selected_twi == -1)
				select_twi(0);

			try{ compute_toi_metrics(id, 0); give_topography(id, 0); load_controls();  }catch( error ){ console.error(error); }
			background_changed = true; timeline_changed = true; matrix_changed = true;

			if(err_count > 0) {
				let err_msg = '';
				if(err_count == 1)
					err_msg += ' row are not formatted correctly. Expected format: TWI_name	start_time	end_time';
				else 
					err_msg += ' rows are not formatted correctly. Expected format: TWI_name	start_time	end_time';
				if(err_msg.length>0){alert('Not all data was formatted as required. Please note:\n' + err_msg);}
			} 
			matrix_changed = true;			
		}catch( error ){ console.error(error); }		
	}
	reader.readAsText(f);
}