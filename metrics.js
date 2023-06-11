

function compute_data_firstlens(data_id){
	fixs = DATASETS[data_id].fixs;
	for(j=0; j<fixs.length; j++){
		v = 0;
		while(v<lenses.length && !lenses[v].inside(fixs[j].x, fixs[j].y) ){ v++; }
		fixs[j].firstlens = v; // first lens == lenses.length means outside all lenses, used for indirect transitions between lens		
		if(v < lenses.length)
			fixs[j].firstlensegroup = lenses[v].group;
		else
			fixs[j].firstlensegroup = -1;
	}
}
function compute_compare(data1, data2){
	
	if(MATRIX_VIEW_STATE == 'dat_dat')
		metric = document.getElementById('metrics_3').value;
	else
		metric = document.getElementById('metrics_0').value;

	result = 0; sump = 0; suma = 0; sumb = 0;
	if(data1 == undefined || data2 == undefined) {return result;};
	try{
		if(metric == 'aoi_sequencescore'){
			if(data1.firstlens != undefined && data2.firstlens != undefined) {
				//pre-process sequence string: make sure adjacent character is different, i.e., compress chars that repeat itself before a different one, because we don't really
				//care about duplicate fixations over the same AOIs.
				let inputSequenceA = [], inputSequenceB = [];
				for(let i = 0; i < data1.firstlens.length; i++) {
					if(data1.firstlens[i] > -1 && data1.firstlens[i] < lenses.length && (inputSequenceA.length == 0 || inputSequenceA[inputSequenceA.length-1] != data1.firstlens[i]))
						inputSequenceA.push(data1.firstlens[i]);
				} 
				for(let i = 0; i < data2.firstlens.length; i++) {
					if(data2.firstlens[i] > -1 && data2.firstlens[i] < lenses.length && (inputSequenceB.length == 0 || inputSequenceB[inputSequenceB.length-1] != data2.firstlens[i]))
						inputSequenceB.push(data2.firstlens[i]);
				} 
				result = compute_sequence_score(inputSequenceA, inputSequenceB, SEQUENCE_SCORE_MISMATCH_PENALTY, SEQUENCE_SCORE_GAP_PENALTY, SEQUENCE_SCORE_SKEW_PENALTY);
			}			
		}else if(metric == 'lensegroup_sequencescore'){
			if(data1.firstlensegroup != undefined && data2.firstlensegroup != undefined) {
				let inputSequenceA = [], inputSequenceB = [];
				for(let i = 0; i < data1.firstlensegroup.length; i++) {
					if(data1.firstlensegroup[i] > -1 && (inputSequenceA.length == 0 || inputSequenceA[inputSequenceA.length-1] != data1.firstlensegroup[i]))
						inputSequenceA.push(data1.firstlensegroup[i]);
				} 
				for(let i = 0; i < data2.firstlensegroup.length; i++) {
					if(data2.firstlensegroup[i] > -1 && (inputSequenceB.length == 0 || inputSequenceB[inputSequenceB.length-1] != data2.firstlensegroup[i]))
						inputSequenceB.push(data2.firstlensegroup[i]);
				}				
				result = compute_sequence_score(inputSequenceA, inputSequenceB, SEQUENCE_SCORE_MISMATCH_PENALTY, SEQUENCE_SCORE_GAP_PENALTY, SEQUENCE_SCORE_SKEW_PENALTY);
			}			
		}else if(metric == 'aoi_cosine'){
			tA = data1.direct_transitions;
			tB = data2.direct_transitions;
			for(l1=0; l1< Math.min(tA.length, tB.length); l1++){
				for(l2=0; l2< Math.min(tA[l1].length, tB[l1].length); l2++){
					ta = tA[l1][l2]; tb = tB[l1][l2];
					sump += ta*tb; suma += ta*ta; sumb += tb*tb;
				}
			}
			if(suma != 0 && sumb != 0){ result = sump / Math.sqrt( suma * sumb ); }
		}else if(metric == 'grid_cosine'){
			tA = data1.grid_transitions;
			tB = data2.grid_transitions;
			for(l1=0; l1< Math.min(tA.length, tB.length); l1++){
				for(l2=0; l2< Math.min(tA[l1].length, tB[l1].length); l2++){
					ta = tA[l1][l2]; tb = tB[l1][l2];
					sump += ta*tb; suma += ta*ta; sumb += tb*tb;
				}
			}
			if(suma != 0 && sumb != 0){ result = sump / Math.sqrt( suma * sumb ); }
		}else if(metric == 'aoi_density'){
			tA = data1.lenstime;
			tB = data2.lenstime;
			suma = data1.totaltime;
			sumb = data2.totaltime;
			if( suma*sumb == 0){ return 0; }
			for(l=0; l < Math.min(tA.length, tB.length, lenses.length); l ++){ ta = tA[l]; tb = tB[l]; sump += Math.min(ta/suma, tb/sumb); }
			result = sump;
		}else if(metric == 'grid_density'){
			tA = data1.grid_density;
			tB = data2.grid_density;
			for(l=0; l < Math.min(tA.length, tB.length, GRID_N**2); l++){ ta = tA[l]; tb = tB[l]; suma += ta; sumb += tb; }
			if( suma*sumb == 0){ return 0; }
			for(l=0; l < Math.min(tA.length, tB.length, GRID_N**2); l++){ ta = tA[l]; tb = tB[l]; sump += Math.min(ta/suma, tb/sumb); }
			result = sump;
		}else if(metric == 'cont_density'){
			tA = data1.values; tA_tot = data1.total_value;
			tB = data2.values; tB_tot = data2.total_value;
			for(var l1=0; l1< Math.min(tA.length, tB.length); l1++){
				for(var l2=0; l2< Math.min(tA[l1].length, tB[l1].length); l2++){
					ta = tA[l1][l2]/ tA_tot; tb = tB[l1][l2]/tB_tot;
					sump += Math.min(ta, tb);
				}
			}
			result = sump;
		}
	}catch(error){
		
	}
	return result;
}

/*
* adapted from https://berthub.eu/nwunsch/
*/
function compute_sequence_score(ain, bin, mispen, gappen, skwpen)
{    
    let i, j ,k;
    let dn,rt,dg;
    let ia = ain.length, ib = bin.length;
    let aout=[]; // .resize(ia+ib);
    let bout=[];
    let num_operations = 0;
    let summary=[];

    let cost=[];
    let marked=[];
    for(n=0 ; n < ia+1 ;++n) {
        cost[n] = new Array(ib+1);
        marked[n] = new Array(ib+1);
    }

    cost[0][0] = 0.;
    for (i=1;i<=ia;i++) cost[i][0] = cost[i-1][0] + skwpen;
    for (i=1;i<=ib;i++) cost[0][i] = cost[0][i-1] + skwpen;
    for (i=1;i<=ia;i++) for (j=1;j<=ib;j++) {
        dn = cost[i-1][j] + ((j == ib)? skwpen : gappen);
        rt = cost[i][j-1] + ((i == ia)? skwpen : gappen);
        dg = cost[i-1][j-1] + ((ain[i-1] == bin[j-1])? -1. : mispen);
        
        cost[i][j] = Math.min(dn,rt,dg);
    }
    i=ia; j=ib; k=0;
    while (i > 0 || j > 0) {
        marked[i][j]=1;       
        dn = rt = dg = 9.99e99;
        if (i>0) dn = cost[i-1][j] + ((j==ib)? skwpen : gappen);
        if (j>0) rt = cost[i][j-1] + ((i==ia)? skwpen : gappen);
        if (i>0 && j>0) dg = cost[i-1][j-1] + ((ain[i-1] == bin[j-1])? -1. : mispen);
        if (dg <= Math.min(dn,rt)) {
            aout[k] = ain[i-1];
            bout[k] = bin[j-1];
            if(ain[i-1] == bin[j-1]) {                
                summary[k++] = '=' ;
            }
            else {
                num_operations++;
                summary[k++] = '!';
            }            
            i--; j--;
        }
        else if (dn < rt) {
            aout[k] = ain[i-1];
            bout[k] = ' ';
            num_operations++;
            summary[k++] = ' ';               
            i--;
        }
        else {
            aout[k] = ' ';
            bout[k] = bin[j-1];
            num_operations++;
            summary[k++] = ' ';
            j--;
        }
        marked[i][j]=1;       
    }

	let num_longest_sequence = Math.max(ain.length, bin.length);
	let sequence_score = 0;
	if(summary.length > 0)
		sequence_score = 1-(num_operations)/summary.length;

	return sequence_score;
}                               

function compute_toi_metrics(data_id, toi_id){
	// set up the values needed
	let data = DATASETS[data_id]; 
	let toi = data.tois[toi_id]; 
	if(!toi.included) return;

	let fixs = data.fixs;
	toi.firstlens = []; toi.lenscount = []; toi.lenstime = []; toi.totalcount = 0; toi.totaltime = 0; toi.visit_durations = []; toi.visit_totals=[];
	toi.lensegroup_lenscount = []; toi.lensegroup_lenstime = []; toi.lensegroup_visit_durations = []; toi.lensegroup_visit_totals = [];
	toi.firstlensegroup = [];
	toi.total_saccadelength = 0;
	toi.number_saccades = 0;

	for(i=0; i<lenses.length; i++){
		toi.lenscount.push(0); toi.lenstime.push(0); toi.visit_durations.push([]); toi.visit_totals.push(0);		
	}
	for(i=0; i<ORDERLENSEGROUPIDARRAYINDEX.length; i++){
		toi.lensegroup_lenscount.push(0); toi.lensegroup_lenstime.push(0); toi.lensegroup_visit_durations.push([]); toi.lensegroup_visit_totals.push(0);
	}
	if(fixs.length == 0){ return; } // escape if the fixation list is empty
	// get the timerange
	ts = data.t_start; te = data.t_end;
	tmin = ts + (te - ts)*toi.range[0]; tmax = ts + (te - ts)*toi.range[1];
	toi.tmin = tmin; toi.tmax = tmax;
	// skip to the start of the selection
	j = 0;
	while(j < fixs.length && fixs[j].t < tmin){ 
		j++; 
	}
	// read in the fixation details
	//if this TWI starts with a partial fixation, we still consider it 
	if(fixs[j] == undefined && j == fixs.length) {
		toi.j_min = -1;
		toi.j_max = -1;
		return;		
	}		
	
	if(fixs[j].t > tmin && fixs[j-1] != undefined && fixs[j-1].t != undefined && fixs[j-1].t + fixs[j-1].dt > tmin)
		toi.j_min = j-1;
	else
		toi.j_min = j;
	for(; j<fixs.length && fixs[j].t < tmax; j++){
		// add to totals
		toi.totalcount += 1;
		toi.totaltime += fixs[j].dt;

		let sac = data.sacs[j];
		if(sac != undefined) {
			toi.total_saccadelength += sac.length;
			toi.number_saccades++;
		}		
		
		for(var l=0; l<lenses.length; l++){
			if(lenses[l].inside(fixs[j].x, fixs[j].y)){				
				toi.lenscount[l] += 1;
				toi.lenstime[l] += fixs[j].dt;
			}
		}
		if(fixs[j].firstlens == undefined) {
			//KT: handle exceptional case where fixs[j].firstlens is undefined
			let v = 0;
			while(v<lenses.length && !lenses[v].inside(fixs[j].x, fixs[j].y) ){ v++; }
			fixs[j].firstlens = v;
			if(v < lenses.length)
				fixs[j].firstlensegroup = lenses[v].group;
			else
				fixs[j].firstlensegroup = -1;
		}			
		toi.firstlens.push(fixs[j].firstlens);
		toi.firstlensegroup.push(fixs[j].firstlensegroup);
		
		// add to lense group
		for(let l=0; l<ORDERLENSEGROUPIDARRAYINDEX.length; l++) {
			for(let l2=0; l2<lenses.length; l2++){
				if(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]] == undefined || LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]] == null)
					console.log("ORDERLENSEGROUPIDARRAYINDEX: "+ORDERLENSEGROUPIDARRAYINDEX+", ORDERLENSEGROUPIDARRAYINDEX["+l+"]="+ORDERLENSEGROUPIDARRAYINDEX[l]+"; LENSEGROUPS: "+LENSEGROUPS.map(x=> x.group));
				if(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]] != undefined && lenses[l2].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]].group && lenses[l2].inside(fixs[j].x, fixs[j].y)){
					toi.lensegroup_lenscount[l] += 1;
					toi.lensegroup_lenstime[l] += fixs[j].dt;
				}
			}	
		}				
	}
		
	toi.j_max = j;
	// visit durations
	var visit_lens = lenses.length;
	var duration = 0;
	for(j=toi.j_min; j<toi.j_max-1; j++){
		var current_lens = lenses.length;
		for(var l=0; l<lenses.length; l++){ if(lenses[l].inside(fixs[j].x, fixs[j].y)){ current_lens = l; } }
		if( current_lens == visit_lens && visit_lens < lenses.length ){
			duration += (fixs[j].t - fixs[j-1].t) + fixs[j].dt;
		}else if( visit_lens < lenses.length ){
			toi.visit_durations[visit_lens].push(duration); toi.visit_totals[visit_lens] += duration;
			visit_lens = current_lens;
			duration = fixs[j].dt;
		}else{
			visit_lens = current_lens;
			duration = fixs[j].dt;
		}		
	}

	// handle visit durations at lense group level
	visit_lens = ORDERLENSEGROUPIDARRAYINDEX.length;
	duration = 0;
	for(j=toi.j_min; j<toi.j_max-1; j++){
		let current_lens = ORDERLENSEGROUPIDARRAYINDEX.length;
		for(let l=0; l<ORDERLENSEGROUPIDARRAYINDEX.length; l++){ 
			for(let l2=0; l2<lenses.length; l2++){
				if(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]] != undefined && lenses[l2].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]].group && lenses[l2].inside(fixs[j].x, fixs[j].y)){
					current_lens = l;
				}
			}
		}
		if( current_lens == visit_lens && visit_lens < ORDERLENSEGROUPIDARRAYINDEX.length ){
			duration += (fixs[j].t - fixs[j-1].t) + fixs[j].dt;
		}else if( visit_lens < ORDERLENSEGROUPIDARRAYINDEX.length ){
			toi.lensegroup_visit_durations[visit_lens].push(duration); toi.lensegroup_visit_totals[visit_lens] += duration;
			visit_lens = current_lens;
			duration = fixs[j].dt;
		}else{
			visit_lens = current_lens;
			duration = fixs[j].dt;
		}		
	}
	//swap comparison order, needed for medians
	toi.lensmedian = []; 
	for(let l=0; l<lenses.length; l++){
		let lenstimes = [];
		j = 0;
		while(j < fixs.length && fixs[j].t < tmin){ j++; }
		for(j = toi.j_min; j<toi.j_max; j++){
			if(lenses[l].inside(fixs[j].x, fixs[j].y)){
				lenstimes.push(fixs[j].dt);
			}
		}
		lenstimes.sort(function(a, b) { return a - b; } );
		let mid = Math.ceil(lenstimes.length / 2);
		toi.lensmedian.push ( lenstimes.length % 2 == 0 ? (lenstimes[mid] + lenstimes[mid - 1]) / 2 : lenstimes[mid - 1] );
	}
	// compute metrics for each lense group
	toi.lensegroup_lensmedian = [];
	for(let l=0; l<ORDERLENSEGROUPIDARRAYINDEX.length; l++){
		let lenstimes = [];
		j = 0;
		while(j < fixs.length && fixs[j].t < tmin){ j++; }
		for(j = toi.j_min; j<toi.j_max; j++){
			for(let l2=0; l2<lenses.length; l2++){
				if(LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]] != undefined && lenses[l2].group == LENSEGROUPS[ORDERLENSEGROUPIDARRAYINDEX[l]].group && lenses[l2].inside(fixs[j].x, fixs[j].y)){
					lenstimes.push(fixs[j].dt);
				}
			}
		}
		lenstimes.sort(function(a, b) { return a - b; } );
		let mid = Math.ceil(lenstimes.length / 2);
		toi.lensegroup_lensmedian.push ( lenstimes.length % 2 == 0 ? (lenstimes[mid] + lenstimes[mid - 1]) / 2 : lenstimes[mid - 1] );
	}

	// read in the reduced firstlens list (only when transitions occur)
	toi.reduced_firstlens = []; toi.reduced_firstlens_nonempty = [];
	toi.lensegroup_reduced_firstlens = []; toi.lensegroup_reduced_firstlens_nonempty = [];

	// make transitions table
	toi.direct_transitions = []; toi.indirect_transitions = []; toi.triples = [];
	for(let a=0; a<=lenses.length; a++){
		toi.direct_transitions.push([]); toi.indirect_transitions.push([]); toi.triples.push([]);
		for(let b=0; b<=lenses.length; b++){
			toi.direct_transitions[a].push(0); toi.indirect_transitions[a].push(0); toi.triples[a].push([]);
			for(let c=0; c<=lenses.length; c++){
				toi.triples[a][b].push(0);
			}
		}
	}
	// make transitions table for each lense group
	toi.lensegroup_direct_transitions = []; toi.lensegroup_indirect_transitions = []; toi.lensegroup_triples = [];
	for(let a=0; a<=ORDERLENSEGROUPIDARRAYINDEX.length; a++){
		toi.lensegroup_direct_transitions.push([]); toi.lensegroup_indirect_transitions.push([]); toi.lensegroup_triples.push([]);
		for(let b=0; b<=ORDERLENSEGROUPIDARRAYINDEX.length; b++){
			toi.lensegroup_direct_transitions[a].push(0); toi.lensegroup_indirect_transitions[a].push(0); toi.lensegroup_triples[a].push([]);
			for(let c=0; c<=ORDERLENSEGROUPIDARRAYINDEX.length; c++){
				toi.lensegroup_triples[a][b].push(0);
			}
		}
	}

	if(toi.firstlens.length > 0){
		toi.reduced_firstlens.push(toi.firstlens[0]);
		for(j = 1; j<toi.firstlens.length; j++){
			jlens = toi.firstlens[j];
			if( jlens!= toi.reduced_firstlens[ toi.reduced_firstlens.length-1 ] ){
				toi.reduced_firstlens.push(jlens);
			}
			else {
				//self-transition
				toi.direct_transitions[ jlens ][ jlens ] += 1;
				toi.indirect_transitions[ jlens ][ jlens ] += 1;
				toi.triples[jlens ][ jlens ][ jlens ] += 1;
			}
			if( jlens != lenses.length && (toi.reduced_firstlens_nonempty.length == 0 || jlens != toi.reduced_firstlens_nonempty[ toi.reduced_firstlens_nonempty.length - 1]) ){
				toi.reduced_firstlens_nonempty.push(jlens);
			}
			
			//handle lense group
			if( jlens < lenses.length && ORDERLENSEGROUPID.indexOf(lenses[jlens].group) != toi.lensegroup_reduced_firstlens[ toi.lensegroup_reduced_firstlens.length-1 ] ){
				toi.lensegroup_reduced_firstlens.push(ORDERLENSEGROUPID.indexOf(lenses[jlens].group));
			}
			else if (jlens < lenses.length && ORDERLENSEGROUPID.indexOf(lenses[jlens].group) == toi.lensegroup_reduced_firstlens[ toi.lensegroup_reduced_firstlens.length-1 ] ){
				//self-transition
				toi.lensegroup_direct_transitions[ ORDERLENSEGROUPID.indexOf(lenses[jlens].group) ][ ORDERLENSEGROUPID.indexOf(lenses[jlens].group) ] += 1;
				toi.lensegroup_indirect_transitions[ ORDERLENSEGROUPID.indexOf(lenses[jlens].group) ][ ORDERLENSEGROUPID.indexOf(lenses[jlens].group) ] += 1;
				toi.lensegroup_triples[ORDERLENSEGROUPID.indexOf(lenses[jlens].group) ][ ORDERLENSEGROUPID.indexOf(lenses[jlens].group) ][ ORDERLENSEGROUPID.indexOf(lenses[jlens].group) ] += 1;
			}
			//KT: below follows the above logic from reduced_firstlens to include AOI transitions to a "non"-AOI, meaning the fixation does not fall into any AOI, verify if this is what we need.
			else if(jlens == lenses.length && ORDERLENSEGROUPID.length != toi.lensegroup_reduced_firstlens[ toi.lensegroup_reduced_firstlens.length-1 ])
				toi.lensegroup_reduced_firstlens.push(ORDERLENSEGROUPID.length);

			if( jlens < lenses.length && lenses.length > 0 && (toi.lensegroup_reduced_firstlens_nonempty.length == 0 || 
				ORDERLENSEGROUPID.indexOf(lenses[jlens].group) != toi.lensegroup_reduced_firstlens_nonempty[ toi.lensegroup_reduced_firstlens_nonempty.length - 1]) ){
				toi.lensegroup_reduced_firstlens_nonempty.push(ORDERLENSEGROUPID.indexOf(lenses[jlens].group));
			}
		}
	}
	// fill direct transitions table
	for(j=0; j<toi.reduced_firstlens.length - 1; j++){
		toi.direct_transitions[ toi.reduced_firstlens[j] ][ toi.reduced_firstlens[j+1] ] += 1;
	}
	for(j=0; j<toi.lensegroup_reduced_firstlens.length - 1; j++){
		toi.lensegroup_direct_transitions[ toi.lensegroup_reduced_firstlens[j] ][ toi.lensegroup_reduced_firstlens[j+1] ] += 1;
	}
	// fill indirect transitions table, triples table
	for(j=0; j<toi.reduced_firstlens_nonempty.length - 1; j++){
		toi.indirect_transitions[ toi.reduced_firstlens_nonempty[j] ][ toi.reduced_firstlens_nonempty[j+1] ] += 1;
		if( j < toi.reduced_firstlens_nonempty.length - 2 ){
			toi.triples[ toi.reduced_firstlens_nonempty[j] ][ toi.reduced_firstlens_nonempty[j+1] ][ toi.reduced_firstlens_nonempty[j+2] ] += 1;
		}
	}
	for(j=0; j<toi.lensegroup_reduced_firstlens_nonempty.length - 1; j++){
		toi.lensegroup_indirect_transitions[ toi.lensegroup_reduced_firstlens_nonempty[j] ][ toi.lensegroup_reduced_firstlens_nonempty[j+1] ] += 1;
		if( j < toi.lensegroup_reduced_firstlens_nonempty.length - 2 ){
			toi.lensegroup_triples[ toi.lensegroup_reduced_firstlens_nonempty[j] ][ toi.lensegroup_reduced_firstlens_nonempty[j+1] ][ toi.lensegroup_reduced_firstlens_nonempty[j+2] ] += 1;
		}
	}
	
	// fill grid transitions table
	toi.grid_transitions = []; toi.grid_density = [];
	for(i=0; i<GRID_N**2; i++){ toi.grid_density.push(0); toi.grid_transitions.push([]); for(j=0; j<GRID_N**2; j++){ toi.grid_transitions[i].push(0); } }
	for(j=0; j<fixs.length && fixs[j].t < tmax; j++){
		if( fixs[j].t > tmin ){
			vx1 = Math.floor( (fixs[j].x * GRID_N)/WIDTH );
			vy1 = Math.floor( (fixs[j].y * GRID_N)/HEIGHT );
			toi.grid_density[ vx1 * GRID_N + vy1 ] += fixs[j].dt;
			if( j < fixs.length - 1 && fixs[j+1].t < tmax ){
				vx2 = Math.floor( (fixs[j+1].x * GRID_N)/WIDTH );
				vy2 = Math.floor( (fixs[j+1].y * GRID_N)/HEIGHT );
				if( vx1 != vx2 || vy1 != vy2){ toi.grid_transitions[ vx1 * GRID_N + vy1 ][ vx2 * GRID_N + vy2 ] += fixs[j].dt; }
			}
		}
	}
}

//pairwise comparisons across more than one sample (DAT) and one or more than one TWI (TOI)
//similarity data 
DAT_DATA_BY_TWI_MODE = [];
GRP_DATA_BY_TWI_MODE = [];
TWI_DATA_BY_DAT_MODE = [];
TWIGROUP_DATA_BY_DAT_MODE = [];

//similarity value
DAT_COMPARE = [];
TOI_COMPARE = []; 
TWI_GROUP_COMPARE = [];
DAT_TOI_COMPARE = [];
DAT_TWIGROUP_COMPARE = [];

twi_group_data = [];
twi_data = [];

let populate_dat_by_twi_mode = () => {
	//First, populate metrics for DAT_DATA_BY_TWI_MODE
	for(let val=0; val<VALUED.length; val++){
		let data = DATASETS[ VALUED[val] ]; 
		
		if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
			let twi_id = data.tois[data.toi_id].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
				DAT_DATA_BY_TWI_MODE[val] = data.tois[data.toi_id];			
		}else {
			DAT_DATA_BY_TWI_MODE[val] = similarity_metrics_factory(DAT_DATA_BY_TWI_MODE[val]);
			aggregate_metrics_data_across_twi(DAT_DATA_BY_TWI_MODE[val], data, false, false, VALUED[val]);							
		}
	}
};

let populate_twi_by_dat_mode = () => {
	//Second, populate metrics for TWI_DATA_BY_DAT_MODE
	for(let a=0; a<order_twis.length; a++){
		if(DAT_MODE == 2 && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined) {

			let data = DATASETS[selected_data];
			let twis = data.tois.map(x=>x.twi_id);
			let toi_id_a = twis.indexOf(order_twis[a]);
			TWI_DATA_BY_DAT_MODE[a] = data.tois[toi_id_a];
		}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){
			TWI_DATA_BY_DAT_MODE[a] = similarity_metrics_factory(TWI_DATA_BY_DAT_MODE[a]);
			for(let val=0; val<VALUED.length; val++){
				if(DATASETS[VALUED[val]].group == selected_grp){
					let data = DATASETS[val];
					let twis = data.tois.map(x=>x.twi_id);
					let toi_id_a = twis.indexOf(order_twis[a]);
					aggregate_similarity_metrics(TWI_DATA_BY_DAT_MODE[a], data.tois[toi_id_a], val, toi_id_a);
				}
			}						
		}else if(DAT_MODE == 0){
			TWI_DATA_BY_DAT_MODE[a] = similarity_metrics_factory(TWI_DATA_BY_DAT_MODE[a]);
			for(let val=0; val<VALUED.length; val++){
				let data = DATASETS[val];
				let twis = data.tois.map(x=>x.twi_id);
				let toi_id_a = twis.indexOf(order_twis[a]);
				aggregate_similarity_metrics(TWI_DATA_BY_DAT_MODE[a], data.tois[toi_id_a], val, toi_id_a);
			}
		}
	}
};

let populate_twigroup_by_dat_mode = () => {
	//Third, populate metrics for TWIGROUP_DATA_BY_DAT_MODE
	for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){
		if(DAT_MODE == 2 && VALUED.indexOf(selected_data) != -1 && DATASETS[selected_data] != undefined) {
			let data = DATASETS[selected_data];
			let twis = data.tois.map(x=>x.twi_id);
			let toi_id_a = twis.indexOf(order_twis[a]);
			TWIGROUP_DATA_BY_DAT_MODE[a] = data.tois[toi_id_a];
		}else if(DAT_MODE == 1 && ORDERGROUPID.indexOf(selected_grp) != -1){
			TWIGROUP_DATA_BY_DAT_MODE[a] = similarity_metrics_factory(TWIGROUP_DATA_BY_DAT_MODE[a]);
			for(let val=0; val<VALUED.length; val++){
				if(DATASETS[VALUED[val]].group == selected_grp){
					let data = DATASETS[val];
					let twis = data.tois.map(x=>x.twi_id);
					let toi_id_a = twis.indexOf(order_twis[a]);
					aggregate_similarity_metrics(TWIGROUP_DATA_BY_DAT_MODE[a], data.tois[toi_id_a], val, toi_id_a);
				}
			}
			
		}else if(DAT_MODE == 0){
			TWIGROUP_DATA_BY_DAT_MODE[a] = similarity_metrics_factory(TWIGROUP_DATA_BY_DAT_MODE[a]);
			for(let val=0; val<VALUED.length; val++){
				let data = DATASETS[val];
				let twis = data.tois.map(x=>x.twi_id);
				let toi_id_a = twis.indexOf(order_twis[a]);
				aggregate_similarity_metrics(TWIGROUP_DATA_BY_DAT_MODE[a], data.tois[toi_id_a], val, toi_id_a);
			}
		}
	}
};

function compute_all_metrics(){
	//compute lense groupings
	compute_lensegroupings();

	//compute twi groupings
	compute_twigroupings();
	
	// compute the firstlens for each fixation
	for(let value=0; value<VALUED.length; value++){
		let val = VALUED[value];
		compute_data_firstlens(val);
		
		for(let c=0; c<DATASETS[val].tois.length; c++){ 
			if (DATASETS[val].tois[c] != undefined && DATASETS[val].tois[c].included)
				compute_toi_metrics(val, c); 
		}
	}

	//similarity data 
	DAT_DATA_BY_TWI_MODE = [];
	GRP_DATA_BY_TWI_MODE = [];
	TWI_DATA_BY_DAT_MODE = [];
	TWIGROUP_DATA_BY_DAT_MODE = [];

	//similarity value
	DAT_COMPARE = [];
	TOI_COMPARE = []; 
	TWI_GROUP_COMPARE = [];
	DAT_TOI_COMPARE = [];
	DAT_TWIGROUP_COMPARE = [];	
	
	if(MATRIX_VIEW_STATE == "twigroup_twigroup") {
		populate_twigroup_by_dat_mode();

		TWI_GROUP_COMPARE = [];
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){ TWI_GROUP_COMPARE.push([]); for(b=0; b<ORDERTWIGROUPIDARRAYINDEX.length; b++){ TWI_GROUP_COMPARE[a].push(1); } }	
		
		for(a=0; a<ORDERTWIGROUPIDARRAYINDEX.length-1; a++){
			for(b=a+1; b<ORDERTWIGROUPIDARRAYINDEX.length; b++){
				let r = compute_compare( TWIGROUP_DATA_BY_DAT_MODE[a], TWIGROUP_DATA_BY_DAT_MODE[b]);
				TWI_GROUP_COMPARE[a][b] = r; TWI_GROUP_COMPARE[b][a] = r;
			}
		}	
	}
	else if(MATRIX_VIEW_STATE == "toi_toi") {
		populate_twi_by_dat_mode();

		TOI_COMPARE = [];
		for(let a=0; a<order_twis.length; a++){
			TOI_COMPARE.push([]); for(b=0; b<order_twis.length; b++){ TOI_COMPARE[a].push(1); }			
		}
		for(a=0; a<order_twis.length-1; a++){
			for(b=a+1; b<order_twis.length; b++){						
				let r = compute_compare( TWI_DATA_BY_DAT_MODE[a], TWI_DATA_BY_DAT_MODE[b]);
				TOI_COMPARE[a][b] = r; TOI_COMPARE[b][a] = r;									
			}
		}
	}		
	else if(MATRIX_VIEW_STATE == "dat_toi" || MATRIX_VIEW_STATE == "toi_dat"){
		populate_twi_by_dat_mode();
		populate_dat_by_twi_mode();

		//populate DAT_TOI table	
		DAT_TOI_COMPARE = [];	
		for(let a=0; a<order_twis.length; a++){
			DAT_TOI_COMPARE.push([]);
			for(let b=0; b<VALUED.length; b++){
				DAT_TOI_COMPARE[a].push( compute_compare( TWI_DATA_BY_DAT_MODE[a], DAT_DATA_BY_TWI_MODE[b]) );						
			}
		}
	}
	else if(MATRIX_VIEW_STATE == "dat_twigroup" || MATRIX_VIEW_STATE == "twigroup_dat") {
		populate_dat_by_twi_mode();
		populate_twigroup_by_dat_mode();

		//populate DAT_TWIGROUP table
		DAT_TWIGROUP_COMPARE = [];
		for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){
			DAT_TWIGROUP_COMPARE.push([]);
			for(let b=0; b<VALUED.length; b++){
				DAT_TWIGROUP_COMPARE[a].push( compute_compare( TWIGROUP_DATA_BY_DAT_MODE[a], DAT_DATA_BY_TWI_MODE[b]) );
			}
		}
	}		
	else if(MATRIX_VIEW_STATE == "dat_dat") {
		populate_dat_by_twi_mode();
		
		// calc trans consine similarity
		DAT_COMPARE = [];
		for(a=0; a<VALUED.length; a++){
			DAT_COMPARE.push([]);
			for(b=0; b<VALUED.length; b++){ DAT_COMPARE[a].push(1);}
		}
		for(a=0; a<VALUED.length-1; a++){
			for(b=a+1; b<VALUED.length; b++){
				r = compute_compare( DAT_DATA_BY_TWI_MODE[a], DAT_DATA_BY_TWI_MODE[b] );
				DAT_COMPARE[a][b] = r; DAT_COMPARE[b][a] = r;
			}
		}
	}	
	else if(MATRIX_VIEW_STATE == "grp_dat" || MATRIX_VIEW_STATE == "dat_grp" ) 
		populate_dat_by_twi_mode();
	else if(MATRIX_VIEW_STATE == "grp_toi" || MATRIX_VIEW_STATE == "toi_grp" ) 
		populate_twi_by_dat_mode();
	else if(MATRIX_VIEW_STATE == "grp_twigroup" || MATRIX_VIEW_STATE == "twigrouop_grp" ) 
		populate_twigroup_by_dat_mode();
		
	
	// compute the group values and measures
	compute_groupings(); update_legend = true; timeline_changed = true;
}

let aggregate_aoi_data_across_twi = (aoi_data, data) => {
	let dat = null; 
	if(TWI_MODE == 2 && selected_twi != -1 && data.tois[data.toi_id] != undefined && data.tois[data.toi_id].included) {
		for(var l=0; l<lenses.length; l++){
			let twi_id = data.tois[data.toi_id].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
				aoi_data.visit_durations[l] = aoi_data.visit_durations[l].concat( data.tois[ data.toi_id ].visit_durations[l] );
				aoi_data.visit_totals[l] += data.tois[ data.toi_id ].visit_totals[l];
		}
		for(var l=0; l<LENSEGROUPS.length; l++){
			let twi_id = data.tois[data.toi_id].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 
				aoi_data.lensegroup_visit_durations[l] = aoi_data.lensegroup_visit_durations[l].concat( data.tois[ data.toi_id ].lensegroup_visit_durations[l] );
				aoi_data.lensegroup_visit_totals[l] += data.tois[ data.toi_id ].lensegroup_visit_totals[l];
		}

		let twi_id = data.tois[data.toi_id].twi_id;
		if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked) 			
			aggregate_aoi_transition_metrics(aoi_data, data.tois[ data.toi_id ]);
	}else if(TWI_MODE == 1 && selected_twigroup != -1){
		for(var l=0; l<lenses.length; l++){
			//sum up metrics aoi_data from individual toi
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
					aoi_data.visit_durations[l] = aoi_data.visit_durations[l].concat( data.tois[ c ].visit_durations[l] );
					aoi_data.visit_totals[l] += data.tois[ c ].visit_totals[l];
				}								
			}
		}
	
		for(var l=0; l<LENSEGROUPS.length; l++){
			//sum up metrics aoi_data from individual toi
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
					aoi_data.lensegroup_visit_durations[l] = aoi_data.lensegroup_visit_durations[l].concat( data.tois[ c ].lensegroup_visit_durations[l] );
					aoi_data.lensegroup_visit_totals[l] += data.tois[ c ].lensegroup_visit_totals[l];
				}								
			}
		}

		//sum up metrics data from individual toi
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
				aggregate_aoi_transition_metrics(aoi_data, data.tois[ c ]);
			}								
		}
		
	}else if(TWI_MODE == 0){
		for(var l=0; l<lenses.length; l++){
			//sum up metrics aoi_data from individual toi
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
					aoi_data.visit_durations[l] = aoi_data.visit_durations[l].concat( data.tois[ c ].visit_durations[l] );
					aoi_data.visit_totals[l] += data.tois[ c ].visit_totals[l];
				}
			}
		}

		for(var l=0; l<LENSEGROUPS.length; l++){
			//sum up metrics aoi_data from individual toi
			for(let c=0; c<data.tois.length; c++) {
				let twi_id = data.tois[c].twi_id;
				if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
					aoi_data.lensegroup_visit_durations[l] = aoi_data.lensegroup_visit_durations[l].concat( data.tois[ c ].lensegroup_visit_durations[l] );
					aoi_data.lensegroup_visit_totals[l] += data.tois[ c ].lensegroup_visit_totals[l];
				}
			}
		}

		//sum up metrics data from individual toi
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			if(data.tois[c].included && twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
				aggregate_aoi_transition_metrics(aoi_data, data.tois[ c ]);
			}
		}
	}
};

let aggregate_aoi_transition_metrics = (aoi_data, toi) => {
	//add each measure to its relavant parent
	aoi_data.totalcount += toi.totalcount; aoi_data.totaltime += toi.totaltime;
	aoi_data.total_saccadelength += toi.total_saccadelength;
	aoi_data.number_saccades += toi.number_saccades;

	//concatenate lenstimes list
	// aoi measures
	for(l1=0;l1<=lenses.length;l1++){
		aoi_data.lenscount[l1] += toi.lenscount[l1]; aoi_data.lenstime[l1] += toi.lenstime[l1];
		for(l2=0;l2<=lenses.length;l2++){
			if(toi.direct_transitions == undefined) continue;

			if(toi.direct_transitions[l1][l2] != undefined)
				aoi_data.direct_transitions[l1][l2] += toi.direct_transitions[l1][l2];
			aoi_data.indirect_transitions[l1][l2] += toi.indirect_transitions[l1][l2];
			for(l3=0;l3<=lenses.length;l3++){
				if(toi.triples[l1][l2] == undefined) 
					console.log("toi: "+base_twis[toi.twi_id].name+", toi.triples: "+toi.triples+", toi.triples["+l1+"]["+l2+"], aoi_data.triples[l1][l2]: "+aoi_data.triples[l1][l2]);
				else
					aoi_data.triples[l1][l2][l3] += toi.triples[l1][l2][l3];
			}
		}
	}
	for(l1=0;l1<=LENSEGROUPS.length;l1++){
		aoi_data.lensegroup_lenscount[l1] += toi.lensegroup_lenscount[l1]; aoi_data.lensegroup_lenstime[l1] += toi.lensegroup_lenstime[l1];
		for(l2=0;l2<=LENSEGROUPS.length;l2++){
			if(toi.lensegroup_direct_transitions == undefined) continue;
			aoi_data.lensegroup_direct_transitions[l1][l2] += toi.lensegroup_direct_transitions[l1][l2];
			aoi_data.lensegroup_indirect_transitions[l1][l2] += toi.lensegroup_indirect_transitions[l1][l2];
			for(l3=0;l3<=LENSEGROUPS.length;l3++){
				if(toi.lensegroup_triples[l1][l2] != undefined) 
					aoi_data.lensegroup_triples[l1][l2][l3] += toi.lensegroup_triples[l1][l2][l3];
			}
		}
	}
	// grid measures
	for(l1=0; l1<GRID_N**2;l1++){
		if(toi.grid_density == undefined) continue;
		aoi_data.grid_density[l1] += toi.grid_density[l1];
		for(l2=0; l2<GRID_N**2;l2++){
			aoi_data.grid_transitions[l1][l2] += toi.grid_transitions[l1][l2];
		}
	}
};

let aggregate_metrics_data_across_twi = (twi_group_data, data, is_twi_group_array, is_twi_array, data_id) => {

	if(is_twi_group_array) {
		//sum up metrics data from individual toi
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			let order_twis_index = order_twis.indexOf(twi_id);
			let order_twis_group_index = ORDERTWIGROUPID.indexOf(base_twis[twi_id].group);

			if(order_twis_index != -1 && base_twis[twi_id].included && base_twis[twi_id].checked && 
					order_twis_group_index > -1) {
				//add to the corresponding twi_group_data based on twi_id group
				//concatenate lenstimes list
				// aoi measures
				aggregate_similarity_metrics(twi_group_data[order_twis_group_index], data.tois[c], data_id, c);
			}				
		}
	}
	else if(is_twi_array) {
		for(let c=0; c<data.tois.length; c++) {
			let twi_id = data.tois[c].twi_id;
			let order_twis_index = order_twis.indexOf(twi_id);

			if(twi_id < base_twis.length && order_twis_index != -1 && base_twis[twi_id].included && base_twis[twi_id].checked) {
				aggregate_similarity_metrics(twi_data[order_twis_index], data.tois[c], data_id, c);
			}
		}		
	}
	else if(TWI_MODE == 1 && selected_twigroup != -1){
		for(let i=0; i < data.tois.length; i++) {
			let twi_id = data.tois[i].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].group == selected_twigroup && base_twis[twi_id].included && base_twis[twi_id].checked ) {
				aggregate_similarity_metrics(twi_group_data, data.tois[i], data_id, i);
			}
		}		
	}
	else if(TWI_MODE == 0){
		for(let i=0; i < data.tois.length; i++) {
			let twi_id = data.tois[i].twi_id;
			if(twi_id < base_twis.length && base_twis[twi_id].included && base_twis[twi_id].checked ) {
				aggregate_similarity_metrics(twi_group_data, data.tois[i], data_id, i);					
			}								
		}
	}
};

let aggregate_similarity_metrics = (twi_group_data, toidata, data_id, toi_id) => {
	if(toidata == undefined || !toidata.included) return;
	//sum up metrics data from individual toi
	twi_group_data.totaltime += toidata.totaltime;
	twi_group_data.firstlens = twi_group_data.firstlens.concat(toidata.firstlens);
	twi_group_data.firstlensegroup = twi_group_data.firstlensegroup.concat(toidata.firstlensegroup);
	for(l1=0;l1<=lenses.length;l1++){
		twi_group_data.lenstime[l1] += toidata.lenstime[l1];
		for(l2=0;l2<=lenses.length;l2++){
			if(toidata.direct_transitions == undefined) continue;

			twi_group_data.direct_transitions[l1][l2] += toidata.direct_transitions[l1][l2];						
		}
	}
	// grid measures
	for(l1=0; l1<GRID_N**2;l1++){
		if(toidata.grid_density == undefined) continue;
		
		twi_group_data.grid_density[l1] += toidata.grid_density[l1];
		for(l2=0; l2<GRID_N**2;l2++){
			if(toidata.grid_transitions == undefined) continue;

			twi_group_data.grid_transitions[l1][l2] += toidata.grid_transitions[l1][l2];
		}
	}
	//topography
	if( toidata.values == undefined ){ give_topography( data_id, toi_id ); } // gives a topography if we don't have one												
	for(i = 0; i <= X_NUM; i++ ){ 
		for(j = 0; j <= Y_NUM; j++){
			twi_group_data.initial [i][j] += toidata.initial[i][j];
		}
	}
		
	twi_group_data.values = apply_shaping(twi_group_data.initial);
	twi_group_data.max_value = 0; twi_group_data.total_value = 0;
	for(i = 0; i <= X_NUM; i++ ){ 
		for(j = 0; j <= Y_NUM; j++){
			twi_group_data.total_value += twi_group_data.values[i][j];
			twi_group_data.max_value = Math.max(twi_group_data.max_value, twi_group_data.values[i][j]);
		}
	}
}

let aoi_metrics_factory = () => {
	let data = {};
	// set up the metrics spaces with zeroes, and them composite by iterating over its dependents
	
	// constants
	data.totalcount = 0; data.totaltime = 0;
	data.total_saccadelength = 0; data.number_saccades = 0;

	// lens membership
	data.lenscount = []; data.lenstime=[];
	data.lensmedian = []; data.lensegroup_lensmedian = [];
	data.lensegroup_lenscount = []; data.lensegroup_lenstime = [];
	// aoi transitions (direct, indirect, triples)
	data.direct_transitions = []; data.indirect_transitions = []; data.triples = [];
	data.lensegroup_direct_transitions = []; data.lensegroup_indirect_transitions = []; data.lensegroup_triples = [];

	for(l1=0;l1<=lenses.length;l1++){
		data.lenscount.push(0); data.lenstime.push(0); data.lensmedian.push(0); 
		data.direct_transitions.push([]); data.indirect_transitions.push([]); data.triples.push([]);
		for(l2=0;l2<=lenses.length;l2++){
			data.direct_transitions[l1].push(0); data.indirect_transitions[l1].push(0); data.triples[l1].push([]);
			for(l3=0;l3<=lenses.length;l3++){
				data.triples[l1][l2].push(0);
			}
		}
	}
	for(l1=0;l1<=LENSEGROUPS.length;l1++){
		data.lensegroup_lenscount.push(0); data.lensegroup_lenstime.push(0); data.lensegroup_lensmedian.push(0);
		data.lensegroup_direct_transitions.push([]); data.lensegroup_indirect_transitions.push([]); data.lensegroup_triples.push([]);
		for(l2=0;l2<=LENSEGROUPS.length;l2++){
			data.lensegroup_direct_transitions[l1].push(0); data.lensegroup_indirect_transitions[l1].push(0); data.lensegroup_triples[l1].push([]);
			for(l3=0;l3<=LENSEGROUPS.length;l3++){
				data.lensegroup_triples[l1][l2].push(0);
			}
		}
	}
	// visit metrics
	data.visit_durations = []; data.visit_totals = [];
	for(var l=0; l<lenses.length; l++){ data.visit_durations.push([]); data.visit_totals.push(0); }
	
	data.lensegroup_visit_durations = []; data.lensegroup_visit_totals = [];
	for(var l=0; l<LENSEGROUPS.length; l++){ data.lensegroup_visit_durations.push([]); data.lensegroup_visit_totals.push(0); }
	
	// grid metrics
	data.grid_density = []; data.grid_transitions = [];
	for(l1=0; l1<GRID_N**2;l1++){
		data.grid_density.push(0);
		data.grid_transitions.push([]);
		for(l2=0; l2<GRID_N**2;l2++){					
			data.grid_transitions[l1].push(0);
		}
	}
	// give it a pseudo-topography
	data.initial = [];
	for(i = 0; i <= X_NUM; i++ ){ 
		data.initial.push([]);
		for(j = 0; j <= Y_NUM; j++){
			data.initial[i].push(0.0);
		}
	}
	return data;	
};

let similarity_metrics_factory = (singletondata) => {
	if(singletondata != null && singletondata != undefined) {
		reset_metrics_data(singletondata);
		return singletondata;
	}
	singletondata = {};
	// constants
	singletondata.totaltime = 0;
	singletondata.lenstime=[];
	singletondata.firstlens=[];
	singletondata.firstlensegroup=[];	

	// aoi transitions (direct, indirect, triples)
	singletondata.direct_transitions = []; 
	for(l1=0;l1<=lenses.length;l1++){
		singletondata.lenstime.push(0);
		singletondata.direct_transitions.push([]); 
		for(l2=0;l2<=lenses.length;l2++){
			singletondata.direct_transitions[l1].push(0); 			
		}
	}

	// grid metrics
	singletondata.grid_density = []; singletondata.grid_transitions = [];
	for(l1=0; l1<GRID_N**2;l1++){
		singletondata.grid_density.push(0);
		singletondata.grid_transitions.push([]);
		for(l2=0; l2<GRID_N**2;l2++){
			singletondata.grid_transitions[l1].push(0);
		}
	}
	
	// give it a pseudo-topography
	singletondata.initial = [];
	for(i = 0; i <= X_NUM; i++ ){ 
		singletondata.initial.push([]);
		for(j = 0; j <= Y_NUM; j++){
			singletondata.initial[i].push(0.0);
		}
	}

	//topography
	singletondata.values = [];
	singletondata.total_value = 0.0;
	for(var i = 0; i <= X_NUM; i++ ){ 
		singletondata.values.push([]);
		for(var j = 0; j <= Y_NUM; j++){
			singletondata.values[i].push(0.0);
		}
	}
	return singletondata;
};

let reset_metrics_data = (data) => {
	// constants
	data.totaltime = 0;
	data.lenstime.splice(0, data.lenstime.length);
	data.firstlens.splice(0, data.firstlens.length);
	data.firstlensegroup.splice(0, data.firstlensegroup.length);

	// aoi transitions (direct, indirect, triples)
	data.direct_transitions.splice(0, data.direct_transitions.length); 
	for(l1=0;l1<=lenses.length;l1++){
		data.lenstime.push(0);
		data.direct_transitions.push([]); 
		for(l2=0;l2<=lenses.length;l2++){
			data.direct_transitions[l1].push(0); 			
		}
	}

	// grid metrics
	data.grid_density.splice(0, data.grid_density.length); data.grid_transitions.splice(0, data.grid_transitions.length);
	for(l1=0; l1<GRID_N**2;l1++){
		data.grid_density.push(0);
		data.grid_transitions.push([]);
		for(l2=0; l2<GRID_N**2;l2++){
			data.grid_transitions[l1].push(0);
		}
	}
	
	// give it a pseudo-topography
	singletondata.initial.splice(0, singletondata.initial.length);
	for(i = 0; i <= X_NUM; i++ ){ 
		singletondata.initial.push([]);
		for(j = 0; j <= Y_NUM; j++){
			singletondata.initial[i].push(0.0);
		}
	}
	
	//topography
	data.values.splice(0, data.values.length);
	data.total_value = 0.0;
	for(var i = 0; i <= X_NUM; i++ ){ 
		data.values.push([]);
		for(var j = 0; j <= Y_NUM; j++){
			data.values[i].push(0.0);
		}
	}	
};

GROUPS = [];
grp_grp = [];
grp_dat = [];
grp_toi = [];
ORDERGROUPIDARRAYINDEX= [];
ORDERGROUPID = [];

LENSEGROUPS = [];
ORDERLENSEGROUPIDARRAYINDEX = [];
ORDERLENSEGROUPID = [];

TWIGROUPS = [];
ORDERTWIGROUPIDARRAYINDEX = [];
ORDERTWIGROUPID = [];

function compute_twigroupings() {
	TWIGROUPS = [];
	//compute the set of groups
	for(v=1; v<TWIS_COLOURS.length+1; v++){
		let is_used = false;
		for(v2=0; v2<base_twis.length; v2++){
			if( base_twis[v2].included && base_twis[v2].checked && base_twis[v2].group == v ){is_used=true;}
		}

		if(is_used){ // the value v represenets at least one active dataset
			data = {group:v};
			TWIGROUPS.push(data);
		}
	}

	let unorderedGroupIds = TWIGROUPS.map(x => x.group);
	//check if there is addition of group
	TWIGROUPS.forEach(function(group) {
		if(!ORDERTWIGROUPID.includes(group.group)) {
			ORDERTWIGROUPID.push(group.group);
			ORDERTWIGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group.group));
		}
	});	
	//check if there is deletion of group
	ORDERTWIGROUPID.forEach(function(group, i) {
		if(unorderedGroupIds.indexOf(group) < 0) {
			ORDERTWIGROUPID.splice(i, 1);
		}			
	});
	//refresh the group index
	ORDERTWIGROUPIDARRAYINDEX.splice(0, ORDERTWIGROUPIDARRAYINDEX.length);
	ORDERTWIGROUPID.forEach(function(group) {
		ORDERTWIGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
	});
}

function compute_lensegroupings(){
	LENSEGROUPS = [];
	//compute the set of groups
	for(v=1; v<LENS_COLOURS.length+1; v++){
		let is_used = false;
		for(v2=0; v2<lenses.length; v2++){
			if( lenses[v2].group == v ){is_used=true;}
		}

		if(is_used){ // the value v represenets at least one active dataset
			data = {group:v};
			LENSEGROUPS.push(data);
		}
	}
	let unorderedGroupIds = LENSEGROUPS.map(x => x.group);
	//check if there is addition of group
	LENSEGROUPS.forEach(function(group) {
		if(!ORDERLENSEGROUPID.includes(group.group)) {
			ORDERLENSEGROUPID.push(group.group);
			ORDERLENSEGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group.group));
		}
	});	
	//check if there is deletion of group
	ORDERLENSEGROUPID.forEach(function(group, i) {
		if(unorderedGroupIds.indexOf(group) < 0) {
			ORDERLENSEGROUPID.splice(i, 1);
		}			
	});
	//refresh the group index
	ORDERLENSEGROUPIDARRAYINDEX.splice(0, ORDERLENSEGROUPIDARRAYINDEX.length);
	ORDERLENSEGROUPID.forEach(function(group) {
		ORDERLENSEGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
	});
}

function compute_groupings(){
	GROUPS = [];
	//compute the set of groups, and their measures
	for(v=1; v<GROUPINGS.length+1; v++){
		let is_used = false;
		for(v2=0; v2<VALUED.length; v2++){
			if( DATASETS[VALUED[v2]].group == v && DATASETS[VALUED[v2]].included){is_used=true;}
		}
		if(is_used){ // the value v represenets at least one active dataset
			let data = {group:v};
			// things we need to give the group: every metric a data.toi has 
			// but composited from the constituent datasets, under their active tois
			// set up the metrics spaces with zeroes, and them composite by iterating over its dependents
			
			// constants
			data.totalcount = 0; data.totaltime = 0;
			data.total_saccadelength = 0; data.number_saccades = 0;
			// lens membership
			data.lenscount = []; data.lenstime=[];
			data.lensmedian = []; data.lensegroup_lensmedian = [];
			data.lensegroup_lenscount = []; data.lensegroup_lenstime = [];
			// aoi transitions (direct, indirect, triples)
			data.direct_transitions = []; data.indirect_transitions = []; data.triples = [];
			data.lensegroup_direct_transitions = []; data.lensegroup_indirect_transitions = []; data.lensegroup_triples = [];

			for(l1=0;l1<=lenses.length;l1++){
				data.lenscount.push(0); data.lenstime.push(0); data.lensmedian.push(0);
				data.direct_transitions.push([]); data.indirect_transitions.push([]); data.triples.push([]);
				for(l2=0;l2<=lenses.length;l2++){
					data.direct_transitions[l1].push(0); data.indirect_transitions[l1].push(0); data.triples[l1].push([]);
					for(l3=0;l3<=lenses.length;l3++){
						data.triples[l1][l2].push(0);
					}
				}
			}
			for(l1=0;l1<=LENSEGROUPS.length;l1++){
				data.lensegroup_lenscount.push(0); data.lensegroup_lenstime.push(0); data.lensegroup_lensmedian.push(0);
				data.lensegroup_direct_transitions.push([]); data.lensegroup_indirect_transitions.push([]); data.lensegroup_triples.push([]);
				for(l2=0;l2<=LENSEGROUPS.length;l2++){
					data.lensegroup_direct_transitions[l1].push(0); data.lensegroup_indirect_transitions[l1].push(0); data.lensegroup_triples[l1].push([]);
					for(l3=0;l3<=LENSEGROUPS.length;l3++){
						data.lensegroup_triples[l1][l2].push(0);
					}
				}
			}

			// visit metrics
			data.visit_durations = []; data.visit_totals = [];
			for(var l=0; l<lenses.length; l++){ data.visit_durations.push([]); data.visit_totals.push(0); }

			data.lensegroup_visit_durations = []; data.lensegroup_visit_totals = [];
			for(var l=0; l<LENSEGROUPS.length; l++){ data.lensegroup_visit_durations.push([]); data.lensegroup_visit_totals.push(0); }

			// grid metrics
			data.grid_density = []; data.grid_transitions = [];
			for(l1=0; l1<GRID_N**2;l1++){
				data.grid_density.push(0);
				data.grid_transitions.push([]);
				for(l2=0; l2<GRID_N**2;l2++){					
					data.grid_transitions[l1].push(0);
				}
			}
			// give it a pseudo-topography
			data.initial = [];
			for(i = 0; i <= X_NUM; i++ ){ 
				data.initial.push([]);
				for(j = 0; j <= Y_NUM; j++){
					data.initial[i].push(0.0);
				}
			}
			
			for(v2=0; v2<VALUED.length; v2++){
				if(DATASETS[VALUED[v2]] != undefined && DATASETS[VALUED[v2]].group == v && DATASETS[VALUED[v2]].included){
					if(lenses.length > 0)
						aggregate_aoi_data_across_twi(data, DATASETS[VALUED[v2]]);
				}
			}
			
			//finally, attach to the group set
			GROUPS.push(data);
		}
	}
	let unorderedGroupIds = GROUPS.map(x => x.group);
	//check if there is addition of group
	GROUPS.forEach(function(group) {
		if(!ORDERGROUPID.includes(group.group)) {
			ORDERGROUPID.push(group.group);
			ORDERGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group.group));
		}
	});	
	//check if there is deletion of group
	ORDERGROUPID.forEach(function(group, i) {
		if(unorderedGroupIds.indexOf(group) < 0) {
			ORDERGROUPID.splice(i, 1);
		}			
	});
	//refresh the group index
	ORDERGROUPIDARRAYINDEX.splice(0, ORDERGROUPIDARRAYINDEX.length);
	ORDERGROUPID.forEach(function(group) {
		ORDERGROUPIDARRAYINDEX.push(unorderedGroupIds.indexOf(group));			
	});

	//after computing the groups, build their comparison metric tables
	grp_grp = [];
	grp_dat = [];
	grp_toi = [];
	grp_twigroup = [];
	
	compute_topos();

	for(x=0;x<GROUPS.length;x++){
		if(MATRIX_VIEW_STATE == "grp_grp") {
			grp_grp.push([]);
			for(y=0;y<GROUPS.length;y++){
				grp_grp[x].push( compute_compare( GROUPS[x], GROUPS[y] ) );
			}
		}
		else if(MATRIX_VIEW_STATE == "dat_grp" || MATRIX_VIEW_STATE == "grp_dat") {
			grp_dat.push([]);
			for(y=0;y<VALUED.length;y++){
				grp_dat[x].push( compute_compare( GROUPS[x], DAT_DATA_BY_TWI_MODE[y] ) );
			}
		}
		else if(selected_data!=-1){
			if(MATRIX_VIEW_STATE == "grp_toi" || MATRIX_VIEW_STATE == "toi_grp") {
				grp_toi.push([]);
				let twis_data = undefined;
				//populate metrics for twis_data
				for(let a=0; a<order_twis.length; a++){
					grp_toi[x].push( compute_compare( GROUPS[x], TWI_DATA_BY_DAT_MODE[a] ) );
				}
			}
			else if(MATRIX_VIEW_STATE == "grp_twigroup" || MATRIX_VIEW_STATE == "twigroup_grp") {
				grp_twigroup.push([]);
				//populate metrics for twis_data
				
				for(let a=0; a<ORDERTWIGROUPIDARRAYINDEX.length; a++){
					grp_twigroup[x].push( compute_compare( GROUPS[x], TWIGROUP_DATA_BY_DAT_MODE[a] ) );
				}
			}			
		}
	}	
}
