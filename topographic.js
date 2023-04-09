
X_NUM = 120;
Y_NUM = 120;
levels = [0.05,0.15,0.30,0.40,0.60, 0.8]; // controls how many topographic levels are drawn, and at what heights

function apply_shaping(initial){
	values = [];
	for(var i = 0; i <= X_NUM; i++ ){ 
		values.push([]);
		for(var j = 0; j <= Y_NUM; j++){
			values[i].push(0.0);
		}
	}
	r = Math.floor(3*TOPO_SOFTEN); // hard cap on how far out to calculate
	// spread out into values, using soften controllers
	for(var a=0; a<=X_NUM; a++){
		for(var b=0; b<=Y_NUM; b++){
			var w = initial[a][b];
			if( w > 0 ){
				for(var i = Math.max(0, a-r); i < Math.min(X_NUM, a+r); i++){
					for(var j = Math.max(0, b-r); j < Math.min(Y_NUM, b+r); j++){
						q = 0;
						if(TOPO_SHAPE=='inv_square'){q = 1/( (a-i)**2 + (b-j)**2 + TOPO_SOFTEN**2);} // inverse square, might be a bit too spread out
						if(TOPO_SHAPE=='bell'){q = Math.exp( - ( (a-i)**2 + (b-j)**2 )/(TOPO_SOFTEN**2) );} // bell curve
						if(TOPO_SHAPE=='hemisphere'){q = Math.sqrt( TOPO_SOFTEN**2 - (a-i)**2 - (b-j)**2 );} // hemisphere, not bad
						if(TOPO_SHAPE=='pyramid'){q = TOPO_SOFTEN - Math.abs(a-i) - Math.abs(b-j);} // diagonal pyramid shape, not very nice since directionally biased
						if(TOPO_SHAPE=='cone'){q = TOPO_SOFTEN**2 - (a-i)**2 - (b-j)**2;} // cone, not bad
						if(TOPO_SHAPE=='flat'){ if( TOPO_SOFTEN**2 > (a-i)**2 + (b-j)**2 ){ q = 1; };} // flat
						if ( q > 0 ){ values[i][j] += w*q; }
					}
				}
			}
		}
	}
	return values;
}
function give_topography(data_id, toi_id){
	// I don't care about tois just yet, overviews will be whole dataset only for now
	data = DATASETS[data_id];
	if(data == undefined || !data.included || data.tois[toi_id] == undefined || !data.tois[toi_id].included) return;
	
	fixs = data.fixs;
	toi = data.tois[toi_id]; // need to use this to filter the data into the initial set
	toi.update_topo = false; // reset the topo flag, which is probably why we are here at all
	
	ts = data.t_start; te = data.t_end;
	tmin = ts + (te - ts)*toi.range[0]; tmax = ts + (te - ts)*toi.range[1];
	
	var initial = [];
	for(var i = 0; i <= X_NUM; i++ ){ 
		initial.push([]);
		for(var j = 0; j <= Y_NUM; j++){
			initial[i].push(0.0);
		}
	}
	// put the dt weight in their respective boxes, because we don't care about detail below that
	for(var j=0; j<fixs.length; j++){
		if( fixs[j].t > tmin && fixs[j].t < tmax){
			X = (fixs[j].x * X_NUM) / WIDTH; Y = (fixs[j].y * Y_NUM) / HEIGHT; // exact location in the grid
			x = Math.floor(X); y = Math.floor(Y); // nearest grid corner
			w = X - x; h = Y - y; // how close to the left / top, on a scale of 0 to 1
			W = fixs[j].dt; // the weight of the fixation
			 // add the measure to the four corners around its location
			initial[x][y] += W*(1-w)*(1-h);
			initial[x+1][y] += W*w*(1-h);
			initial[x][y+1] += W*(1-w)*h;
			initial[x+1][y+1] += W*w*h;
		}
	}
	var values = apply_shaping(initial);
	var max_value = 0; var total_value = 0;
	for(var i = 0; i < X_NUM; i++ ){
		for(var j = 0; j < Y_NUM; j++){
			total_value += values[i][j];
			if(values[i][j]>max_value){ max_value = values[i][j]; }
		}
	}
	//topography = { values:values, initial:initial, max_value:max_value, total_value:total_value, data_id:data_id}
	//data.tois[toi_id].topo = topography;
	toi.initial = initial;
	toi.values = values;
	toi.max_value = max_value;
	toi.total_value = total_value;
	background_changed = SHOW_TOPO;
	if( (MATRIX_VIEW_STATE == 'dat_dat' && VALUED.indexOf(data_id)!=-1) || (MATRIX_VIEW_STATE == 'toi_toi' && data_id==selected_data) ){ matrix_changed = true; }
}


function compute_topos(){
	for(var v=0;v<VALUED.length;v++){
		if(DATASETS[VALUED[v]] == undefined || !DATASETS[VALUED[v]].included)
			continue;
		if(DAT_MODE == 1 && DATASETS[VALUED[v]].group != selected_grp)
			continue;
		else if(DAT_MODE == 2 && VALUED[v] != selected_data)
			continue;
			
		for(var t=0;t<DATASETS[VALUED[v]].tois.length;t++){
			if( update_topos || DATASETS[ VALUED[v] ].tois[t].update_topo ){ give_topography(VALUED[v], t); }
		}
	}
	update_topos = false;
	for(var v=0; v<GROUPS.length; v++){
		group = GROUPS[v];
		group.initial = [];
		for(let i = 0; i <= X_NUM; i++ ){ group.initial.push([]); for(var j = 0; j <= Y_NUM; j++){ group.initial[i].push(0.0); } }
		// do the rest of the metric measure spaces
		for(let v2=0; v2<VALUED.length; v2++){
			if(DATASETS[VALUED[v2]] == undefined || !DATASETS[VALUED[v2]].included)
				continue;
			if(DAT_MODE == 1 && DATASETS[VALUED[v2]].group != selected_grp)
				continue;
			else if(DAT_MODE == 2 && VALUED[v2] != selected_data)
				continue;
				
			if(DATASETS[ VALUED[v2] ].group == group.group){
				let dat = undefined;
				if(TWI_MODE == 2 && selected_twi != -1 && DATASETS[ VALUED[v2] ].tois[DATASETS[ VALUED[v2] ].toi_id] != undefined) {
					// put the dt weight in their respective boxes, because we don't care about detail below that
					let twi_id = DATASETS[ VALUED[v2] ].tois[DATASETS[ VALUED[v2] ].toi_id].twi_id;
					if(DATASETS[ VALUED[v2] ].tois[ DATASETS[ VALUED[v2] ].toi_id ] != undefined && DATASETS[ VALUED[v2] ].tois[ DATASETS[ VALUED[v2] ].toi_id ].included && 
							twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) {
						dat = DATASETS[ VALUED[v2] ].tois[ DATASETS[ VALUED[v2] ].toi_id ];
						// topographic measures
						if( dat.values == undefined ){ give_topography( v2, DATASETS[ VALUED[v2] ].toi_id ); } // gives a topography if we don't have one												
						for(i = 0; i <= X_NUM; i++ ){ 
							for(j = 0; j <= Y_NUM; j++){
								group.initial [i][j] += dat.initial[i][j];
							}
						}
					}															
				}else if(TWI_MODE == 1 && selected_twigroup != -1) {
					for(let c=0; c < DATASETS[ VALUED[v2] ].tois.length; c++) {
						let twi_id = DATASETS[ VALUED[v2] ].tois[c].twi_id;
						if(DATASETS[ VALUED[v2] ].tois[ c ] != undefined && DATASETS[ VALUED[v2] ].tois[ c ].included && 
								twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							dat = DATASETS[ VALUED[v2] ].tois[ c ];
							// topographic measures
							if( dat.values == undefined ){ give_topography( v2, c ); } // gives a topography if we don't have one												
							for(i = 0; i <= X_NUM; i++ ){ 
								for(j = 0; j <= Y_NUM; j++){
									group.initial [i][j] += dat.initial[i][j];
								}
							}
						}
					}
				}else if(TWI_MODE == 0){
					for(let c=0; c < DATASETS[ VALUED[v2] ].tois.length; c++) {
						let twi_id = DATASETS[ VALUED[v2] ].tois[c].twi_id;
						if(DATASETS[ VALUED[v2] ].tois[ c ] != undefined && DATASETS[ VALUED[v2] ].tois[ c ].included && 
								twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
							dat = DATASETS[ VALUED[v2] ].tois[ c ];
							// topographic measures
							if( dat.values == undefined ){ give_topography( v2, c ); } // gives a topography if we don't have one												
							for(i = 0; i <= X_NUM; i++ ){ 
								for(j = 0; j <= Y_NUM; j++){
									group.initial [i][j] += dat.initial[i][j];
								}
							}
						}
					}
				}
			}
		}
		group.values = apply_shaping(group.initial);
		group.max_value = 0; group.total_value = 0;
		for(i = 0; i <= X_NUM; i++ ){ 
			for(j = 0; j <= Y_NUM; j++){
				group.total_value += group.values[i][j];
				group.max_value = Math.max(group.max_value, group.values[i][j]);
			}
		}
	}
}
