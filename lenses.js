class PolyLens{
		col(a){
			if(TIME_DATA=='all'){ return lens_col(a, this.id); }
			else { return lensegroup_col(a, this.group); }
			return white(a);
		}
		extent(){
			return [Math.min(...this.x), Math.min(...this.y), Math.max(...this.x), Math.max(...this.y)];
		}
		getArea(){
			//area will be changed when adding new vertex or when the aoi editing is ongoing and vetex is being dragged
			return calculatePolygonArea(this.x, this.y, this.x.length);
		}
		add(xn, yn){
			this.centx = (this.centx * this.x.length + xn)/(this.x.length + 1);
			this.centy = (this.centy * this.y.length + yn)/(this.y.length + 1);
			this.x.push(xn); this.y.push(yn);
			if(this.getArea == undefined)
				this.area = calculatePolygonArea(this.x, this.y, this.x.length);//this.getArea();
			else 
				this.area = this.getArea();
				
			document.getElementById('lens_'+this.id+"_values").innerHTML = this.make_controls();
		}		
		inside(xn, yn){
			// ray-casting algorithm based on http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
			xn += OFFSET_X; yn += OFFSET_Y; 
			var r = false;
			for (var i = 0, j = this.x.length - 1; i < this.x.length; j = i++) {
				var xi = this.x[i], yi = this.y[i], xj = this.x[j], yj = this.y[j];
				var intersect = ((yi > yn) != (yj > yn)) && (xn < (xj - xi) * (yn - yi) / (yj - yi) + xi);
				if (intersect) r = !r;
			}
			return r;
		}
		near_start(xn, yn){
			return ( (this.x[0] - xn)**2 * (pos_ratio)**2 + (this.y[0] - yn)**2 * (pos_ratio)**2 < 10**2 ) || 
				( (this.x[this.x.length-1] - xn)**2 * (pos_ratio)**2 + (this.y[this.y.length-1] - yn)**2 * (pos_ratio)**2 < 10**2 );
		}
		move(xstart, ystart, xdiff, ydiff){
			if(this.locked){return;}
			var close_id = -1; var dist = 15**2;
			for(var i=0; i<this.x.length;i++){
				if( (this.x[i] - xstart)**2 * (pos_ratio)**2 + (this.y[i] - ystart)**2 * (pos_ratio)**2 < dist ){
					close_id = i; dist = (this.x[i] - xstart)**2 * (pos_ratio)**2 + (this.y[i] - ystart)**2 * (pos_ratio)**2;
				}
			}
			if(close_id != -1){
				this.x[close_id] += xdiff; this.y[close_id] += ydiff;
				this.centx += xdiff/this.x.length; this.centy += ydiff/this.y.length;
			}else{
				for(var i=0; i<this.x.length;i++){
					this.x[i] += xdiff; this.y[i] += ydiff;
				}
				this.centx += xdiff; this.centy += ydiff;
			}
			document.getElementById('lens_'+this.id+"_values").innerHTML = this.make_controls();
			if(this.getArea == undefined)
				this.area = calculatePolygonArea(this.x, this.y, this.x.length);//this.getArea();
			else 
				this.area = this.getArea();
		}
		draw(proc, building, selected, w, h, disp_w=0, disp_h=0, aspect=true){
			if(aspect){
				var ratio = pos_ratio; var gx = ground_x; var gy = ground_y; 
			}else{
				 var gx = 0; var gy = 0; 
				if(HEIGHT / h > WIDTH / w){
					var ratio = h/HEIGHT;
				}else{
					var ratio = w/WIDTH;
				}
			}
			if(building){
				proc.ellipse(disp_w + (this.x[0]-OFFSET_X) * ratio + gx, disp_h + (this.y[0]-OFFSET_Y) * ratio + gy, 20, 20);
			}
			proc.beginShape();
			for(var j=0; j<this.x.length; j++){
				proc.vertex(disp_w + (this.x[j]-OFFSET_X) * ratio + gx, disp_h + (this.y[j]-OFFSET_Y) * ratio + gy);
			}
			if(!building){
				proc.vertex(disp_w + (this.x[0]-OFFSET_X) * ratio + gx, disp_h + (this.y[0]-OFFSET_Y) * ratio + gy);
			}else if( SPATIAL.mouseIsOver_spatial  ){
				proc.vertex(disp_w + (SPATIAL.mouseX*w)/spatial_width, disp_h + (SPATIAL.mouseY*h)/spatial_height);
			}
			proc.endShape();
			if(selected){
				proc.strokeWeight(1); proc.stroke(this.col(40)); proc.fill(this.col(0));
				if( !this.locked ){
					for(var b=0; b<this.x.length; b++){
						var a = (b+this.x.length-1)%this.x.length; var c = (b+1)%this.x.length;
						var before_ang = ( Math.atan2( this.y[a] - this.y[b], this.x[a] - this.x[b] ) + proc.TWO_PI ) % proc.TWO_PI;
						var after_ang = ( Math.atan2( this.y[b] - this.y[c], this.x[b] - this.x[c] ) + Math.PI ) % proc.TWO_PI;
						// calculating angle order and shifts
						if(before_ang > after_ang){ [before_ang, after_ang] = [after_ang, before_ang]; } // swap them if out of order, since we can't draw an arc backwards
						var mid_ang = (before_ang + after_ang)/2;
						if( !this.inside( this.x[b] + Math.cos(mid_ang) - OFFSET_X, this.y[b] + Math.sin(mid_ang) - OFFSET_Y ) ){
							[before_ang, after_ang] = [after_ang - proc.TWO_PI, before_ang];
						}
						//console.log(before_ang, after_ang);
						proc.arc( disp_w + (this.x[b]-OFFSET_X) * ratio + gx, disp_h + (this.y[b]-OFFSET_Y) * ratio + gy, 30, 30, before_ang, after_ang, proc.PIE );
					}
				}
			}
			proc.fill(this.col(95));
			proc.strokeWeight(0);
			if(aspect && SHOW_LENSLABEL && SHOW_GROUPLABEL) {
				proc.text(this.name+", Group "+this.group, disp_w + (this.centx-OFFSET_X) * ratio + gx, disp_h + (this.centy-OFFSET_Y) * ratio + gy);
			} else if(aspect && SHOW_LENSLABEL) {
				proc.text(this.name, disp_w + (this.centx-OFFSET_X) * ratio + gx, disp_h + (this.centy-OFFSET_Y) * ratio + gy);
			}
			proc.strokeWeight(1);
			if(this.area == undefined && this.getArea == undefined)
				this.area = calculatePolygonArea(this.x, this.y, this.x.length);//this.getArea();
			else if(this.area == undefined)
				this.area = this.getArea();
		}
		make_controls(){
			var g = '<tr><th>Coordinates:</th></tr>';
			for(var i=0; i<this.x.length; i++){
				g += '<tr><th><input class="num" type="number" onchange="base_lenses['+this.id+'].x['+i+']=parseFloat(this.value);lenses_update()" style="width:80px" value='+this.x[i]+'></th>';
				g += '<th><input class="num" type="number" onchange="base_lenses['+this.id+'].y['+i+']=parseFloat(this.value);lenses_update()" style="width:80px" value='+this.y[i]+'></th></tr>';
			}

			g += '<tr><th>Start Time:</th><th>End Time:</th><th>Order:</th><th></th></tr>';


			if (this.isTemporal) {
				this.timeRanges.forEach((range, i) => {
					g += `<tr>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_start_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.start)}">
						</td>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_end_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.end)}">
						</td>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_priority(parseInt(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:32px"
								value="${range.priority !== undefined ? range.priority : 1}">
						</td>
						<td style="vertical-align: middle;">
							<div style="display: flex; gap: 4px;">
								${this.timeRanges.length > 1 ? `<button type="button" onclick="event.stopPropagation(); removeTimeRow(${this.id}, ${i})">-</button>` : ''}
								${i === this.timeRanges.length - 1 ? `<button type="button" onclick="event.stopPropagation(); addExtraTimeRow(${this.id})">+</button>` : ''}
							</div>
						</td>
					</tr>`;
				});
			} else {
				this.timeRanges.forEach((range, i) => {
					g += `<tr>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_start_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.start)}" disabled>
						</td>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_end_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.end)}" disabled>
						</td>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_priority(parseInt(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:32px"
								value="${this.currentPriority}">
						</td>
						<td style="vertical-align: middle;">
							<div style="display: flex; gap: 4px;">
							${this.timeRanges.length > 1 ? 
								`<button type="button" onclick="event.stopPropagation(); removeTimeRow(${this.id}, ${i})" disabled>-</button>`  
								: ''}
							${i === this.timeRanges.length - 1 ? 
								`<button type="button" onclick="event.stopPropagation(); addExtraTimeRow(${this.id})" disabled>+</button>` 
								: ''}
							</div>
						</td>
					</tr>`;
				});
			}

			g += `</tbody>`;

			g = "<table>"+g+"</table>";
			return g;
		}

		edit_start_time(start, index = 0) {
			if (this.isTemporal) {
				this.timeRanges[index].start = start;
				handleAOITimeChange(start, false);
			}
		}

		edit_end_time(end, index = 0) {
			if (this.isTemporal) {
				this.timeRanges[index].end = end;
				handleAOITimeChange(end, false);
			}
		}

		edit_hierarchy(h1, h2, h3){
			this.h1 = h1 ? parseInt(h1) : -1; 
			this.h2 = h2 ? parseInt(h2) : -1; 
			this.h3 = h3 ? parseInt(h3) : -1;

			// Set parent lens. If h3 is not -1, it means is an h3 level lens, its parent is h2.
			if (this.h3 !== -1) {
				// Find the lens with the matching h2
				const parentLens = base_lenses.find(lens => lens.h2 === this.h2 && lens.h1 === this.h1 && lens.h3 === -1);
				if (parentLens) {
					this.parentLens = parentLens;
				}
			} else if (this.h3 === -1 && this.h2 !== -1) {
				// Find the lens with the matching h1
				const parentLens = base_lenses.find(lens => lens.h1 === this.h1 && lens.h2 === -1 && lens.h3 === -1);
				if (parentLens) {
					this.parentLens = parentLens;
				}
			}

			// h1 level lens have no parent
		}

		edit_priority(priority, index = 0) {	
			if (this.isTemporal) {
				this.timeRanges[index].priority = priority;
				handleAOITimeChange(document.getElementById('timeInput').value, true);
			} else {
				this.currentPriority = priority;
			}	
		}
	
		constructor(lid, x1, y1, groupid){
			this.type = 'poly'; this.id = lid; this.name = lid+''; this.locked = false;
			this.x = [x1]; this.y = [y1]; this.centx = x1; this.centy = y1; this.group = groupid;
			this.area = 0;
			this.timeRanges = [{ start: 0, end: maxEndTime, priority: 1 }];
			this.currentPriority = 1;
			this.isTemporal = false;
			this.h1 = -1; this.h2 = -1; this.h3 = -1; //hirarchical id for the lens, h1 for top level.
			this.parentLens = null; // parent lens for h3/h2 level lenses
		}
}
class EllipseLens{
		col(a){
			if(TIME_DATA=='all'){ return lens_col(a, this.id); }
			else { return lensegroup_col(a, this.group); }
			return white(a);
		}
		extent(){
			return [ this.x1, this.y1, this.x2, this.y2 ];
		}
		add(xn, yn){
			this.x2 = xn; this.y2 = yn;
			this.fix_up();
			building_lens_id = -1;
			document.getElementById('lens_'+this.id+"_values").innerHTML = this.make_controls();
			
			if(this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = calculatePolygonArea(xpoints, ypoints, xpoints.length);	
			}
			else
				this.area = this.getArea();
		}
		getArea(){
			let xpoints = [this.x1, this.x2, this.x2, this.x1];
			let ypoints = [this.y1, this.y1, this.y2, this.y2];

			return this.computeArea(xpoints, ypoints);
		}
		computeArea = (xpoints, ypoints) => {
			//area will be changed when adding new vertex or when the aoi editing is ongoing and vetex is being dragged
			let area = Math.PI * Math.floor(this.xrad) * Math.floor(this.yrad);
			console.log("area: Math.PI * "+this.xrad+" * "+this.yrad+"="+ Math.PI * this.xrad * this.yrad);
			return Math.floor(area);
		}
		inside(xn, yn){
			xn += OFFSET_X; yn += OFFSET_Y; 
			if(this.xrad * this.yrad == 0){return false;}
			return ((this.centx - xn)/this.xrad)**2 + ((this.centy - yn)/this.yrad)**2 < 1 ;
		}
		near_start(xn, yn){
			return( (this.x1 - xn)**2 * (pos_ratio)**2 + (this.y1 - yn)**2 * (pos_ratio)**2 < 10**2 );
		}
		fix_up(){
				if(this.x2 < this.x1){ var temp = this.x1; this.x1 = this.x2; this.x2 = temp; }
				if(this.y2 < this.y1){ var temp = this.y1; this.y1 = this.y2; this.y2 = temp; }
				this.xrad = (this.x2 - this.x1)/2; this.yrad = (this.y2 - this.y1)/2;
				this.centx = (this.x1 + this.x2)/2; this.centy = (this.y1 + this.y2)/2;
		}
		move(xstart, ystart, xdiff, ydiff){ // controls how the lens can be dragged, both the whole lens and deformations
			if(this.locked){return;}
			if(this.x2*this.y2 != 0){ // correct the other properties, if the lens hs been finished
				if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x1)*(pos_ratio) < 15 && Math.abs(ystart - this.y1)*(pos_ratio) < 15 ){
					this.x1 += xdiff; this.y1 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x2)*(pos_ratio) < 15 && Math.abs(ystart - this.y1)*(pos_ratio) < 15 ){
					this.x2 += xdiff; this.y1 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x1)*(pos_ratio) < 15 && Math.abs(ystart - this.y2)*(pos_ratio) < 15 ){
					this.x1 += xdiff; this.y2 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x2)*(pos_ratio) < 15 && Math.abs(ystart - this.y2)*(pos_ratio) < 15 ){
					this.x2 += xdiff; this.y2 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x1)*(pos_ratio) < 15 ){
					this.x1 += xdiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x2)*(pos_ratio) < 15 ){
					this.x2 += xdiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(ystart - this.y1)*(pos_ratio) < 15 ){
					this.y1 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(ystart - this.y2)*(pos_ratio) < 15 ){
					this.y2 += ydiff;
				}else{
					this.x1 += xdiff; this.y1 += ydiff;
					if( this.x2*this.ys != 0){
						this.x2 += xdiff; this.y2 += ydiff;
					}
				}
			}else{
				this.x1 += xdiff; this.y1 += ydiff;
			}
			this.fix_up();
			document.getElementById('lens_'+this.id+"_values").innerHTML = this.make_controls();

			if(this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = Math.floor(Math.PI * Math.floor(this.xrad) * Math.floor(this.yrad));
				// console.log("area: Math.PI * "+this.xrad+" * "+this.yrad+"="+ Math.PI * this.xrad * this.yrad);
			}
			else
				this.area = this.getArea();
		}
		draw(proc, building, selected, w, h, disp_w=0, disp_h=0, aspect=true){
			if(aspect){
				var ratio = pos_ratio; var gx = ground_x; var gy = ground_y; 
			}else{
				 var gx = 0; var gy = 0;
				if(HEIGHT / h > WIDTH / w){
					var ratio = h/HEIGHT;
				}else{
					var ratio = w/WIDTH;
				}
			}
			if(building){
				proc.ellipse(disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy, 20, 20);
				proc.ellipse((disp_w +( (this.x1-OFFSET_X) * ratio + gx) + (disp_w + w*SPATIAL.mouseX/spatial_width) )/2, ((disp_h + (this.y1-OFFSET_Y) * ratio + gy) + (h*SPATIAL.mouseY/spatial_height) )/2,
					Math.abs( ((this.x1-OFFSET_X) * ratio + gx) - (w*SPATIAL.mouseX/spatial_width)), Math.abs(((this.y1-OFFSET_Y) * ratio + gy) - (h*SPATIAL.mouseY/spatial_height ) ));
			}else{
				proc.ellipse(disp_w + (this.centx-OFFSET_X) * ratio + gx, disp_h + (this.centy-OFFSET_Y) * ratio + gy,
					this.xrad * 2 * ratio, this.yrad * 2 * ratio);
			}
			if(selected && this.x2*this.y2!=0 && !this.locked){
				proc.strokeWeight(1); proc.stroke(this.col(40)); proc.fill(this.col(0));
				proc.line( disp_w + (this.x1-OFFSET_X) * ratio + gx + Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y1-OFFSET_Y) * ratio + gy,
							disp_w + (this.x1-OFFSET_X) * ratio + gx + Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y2-OFFSET_Y) * ratio + gy );
				proc.line( disp_w + (this.x2-OFFSET_X) * ratio + gx - Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y1-OFFSET_Y) * ratio + gy,
							disp_w + (this.x2-OFFSET_X) * ratio + gx - Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y2-OFFSET_Y) * ratio + gy );
							
				proc.line( disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy + Math.min(15, (this.y2-this.y1)/2*ratio),
							disp_w + (this.x2-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy + Math.min(15, (this.y2-this.y1)/2*ratio) );
				proc.line( disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y2-OFFSET_Y) * ratio + gy - Math.min(15, (this.y2-this.y1)/2*ratio),
							disp_w + (this.x2-OFFSET_X) * ratio + gx, disp_h + (this.y2-OFFSET_Y) * ratio + gy - Math.min(15, (this.y2-this.y1)/2*ratio) );
			}
			proc.fill(this.col(95));
			proc.strokeWeight(0);
			if(aspect && SHOW_LENSLABEL && SHOW_GROUPLABEL) {
				proc.text(this.name+", Group "+this.group, (this.centx-OFFSET_X) * ratio + gx, (this.centy-OFFSET_Y) * ratio + gy)
			} else if(aspect && SHOW_LENSLABEL) {
				proc.text(this.name, (this.centx-OFFSET_X) * ratio + gx, (this.centy-OFFSET_Y) * ratio + gy);
			}
			proc.strokeWeight(1);
			if(this.area == undefined && this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = calculatePolygonArea(xpoints, ypoints, xpoints.length);	
			}
			else if(this.area == undefined)
				this.area = this.getArea();
		}
		make_controls() {
			let g = '<tr><th>Coordinates:</th></tr>';
			g += '<tr><th><input class="num" type="number" onchange="base_lenses['+this.id+'].x1=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.x1+'></th>';
			g += '<th><input class="num" type="number" onchange="base_lenses['+this.id+'].y1=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.y1+'></th></tr>';
			g += '<tr><th><input class="num" type="number" onchange="base_lenses['+this.id+'].x2=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.x2+'></th>';
			g += '<th><input class="num" type="number" onchange="base_lenses['+this.id+'].y2=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.y2+'></th></tr>';
			
			g += '<tr><th>Start Time:</th><th>End Time:</th><th>Order:</th><th></th></tr>';

			if (this.isTemporal) {
				this.timeRanges.forEach((range, i) => {
					g += `<tr>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_start_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.start)}">
						</td>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_end_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.end)}">
						</td>
						<td>
							<input class="num" type="number"
								onchange="base_lenses[${this.id}].edit_priority(parseInt(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:32px"
								value="${range.priority !== undefined ? range.priority : 1}">
						</td>
						<td style="vertical-align: middle;">
							<div style="display: flex; gap: 4px;">
								${this.timeRanges.length > 1 ? `<button type="button" onclick="event.stopPropagation(); removeTimeRow(${this.id}, ${i})">-</button>` : ''}
								${i === this.timeRanges.length - 1 ? `<button type="button" onclick="event.stopPropagation(); addExtraTimeRow(${this.id})">+</button>` : ''}
							</div>
						</td>
					</tr>`;
				});
			} else {
				this.timeRanges.forEach((range, i) => {
					g += `<tr>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_start_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.start)}" disabled>
						</td>
						<td>
							<input class="num" type="text"
								onchange="base_lenses[${this.id}].edit_end_time(parseTimeString(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:80px"
								value="${formatMilliseconds(range.end)}" disabled>
						</td>
						<td>
							<input class="num" type="number"
								onchange="base_lenses[${this.id}].edit_priority(parseInt(this.value), ${i});base_lenses[${this.id}].fix_up();lenses_update()"
								style="width:32px"
								value="${this.currentPriority}">
						</td>
						<td style="vertical-align: middle;">
							<div style="display: flex; gap: 4px;">
							${this.timeRanges.length > 1 ? 
								`<button type="button" onclick="event.stopPropagation(); removeTimeRow(${this.id}, ${i})" disabled>-</button>`  
								: ''}
							${i === this.timeRanges.length - 1 ? 
								`<button type="button" onclick="event.stopPropagation(); addExtraTimeRow(${this.id})" disabled>+</button>` 
								: ''}
							</div>
						</td>
					</tr>`;
				});
			}


			g += `</tbody>`;

			return "<table>" + g + "</table>";
		}

		edit_start_time(start, index = 0) {
			if (this.isTemporal) {
				this.timeRanges[index].start = start;
				handleAOITimeChange(start, false);
			}
		}

		edit_end_time(end, index = 0) {
			if (this.isTemporal) {
				this.timeRanges[index].end = end;
				handleAOITimeChange(end, false);
			}
		}

		edit_hierarchy(h1, h2, h3){
			this.h1 = h1 ? parseInt(h1) : -1; 
			this.h2 = h2 ? parseInt(h2) : -1; 
			this.h3 = h3 ? parseInt(h3) : -1;

			// Set parent lens. If h3 is not -1, it means is an h3 level lens, its parent is h2.
			if (this.h3 !== -1) {
				// Find the lens with the matching h2
				const parentLens = base_lenses.find(lens => lens.h2 === this.h2 && lens.h1 === this.h1 && lens.h3 === -1);
				if (parentLens) {
					this.parentLens = parentLens;
				}
			} else if (this.h3 === -1 && this.h2 !== -1) {
				// Find the lens with the matching h1
				const parentLens = base_lenses.find(lens => lens.h1 === this.h1 && lens.h2 === -1 && lens.h3 === -1);
				if (parentLens) {
					this.parentLens = parentLens;
				}
			}

		}

		edit_priority(priority, index = 0) {
			if (this.isTemporal) {
				this.timeRanges[index].priority = priority;
				handleAOITimeChange(document.getElementById('timeInput').value, true);
				// console.log("Time Input value: " + document.getElementById('timeInput').value)
			} else {
				this.currentPriority = priority;
			}
		}

		constructor(lid, x1, y1, groupid){
			this.type = 'ellipse'; this.id = lid; this.name = lid+''; this.locked = false;
			this.x1 = x1; this.y1 = y1;
			this.x2 = 0; this.y2 = 0;
			this.xrad = 0; this.yrad = 0;
			this.centx = x1; this.centy = y1;
			this.group = groupid;
			this.area = 0;
			this.timeRanges = [{ start: 0, end: maxEndTime, priority: 1 }];
			this.currentPriority = 1;
			this.isTemporal = false;
			this.h1 = -1; this.h2 = -1; this.h3 = -1; //hirarchical id for the lens, h1 for top level.
			this.parentLens = null; // parent lens for h3/h2 level lenses
		}
}
class RectLens extends EllipseLens{
		computeArea = (xpoints, ypoints) => {
			//area will be changed when adding new vertex or when the aoi editing is ongoing and vetex is being dragged
			let area = calculatePolygonArea(xpoints, ypoints, xpoints.length);			
			return area;
		}
		add(xn, yn){
			this.x2 = xn; this.y2 = yn;
			this.fix_up();
			building_lens_id = -1;
			document.getElementById('lens_'+this.id+"_values").innerHTML = this.make_controls();
			
			if(this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = calculatePolygonArea(xpoints, ypoints, xpoints.length);	
			}
			else
				this.area = this.getArea();
		}
		inside(xn, yn){
			xn += OFFSET_X; yn += OFFSET_Y; 
			if(this.xrad * this.yrad == 0){return false;}
			return Math.abs(this.centx - xn) < this.xrad && Math.abs(this.centy - yn) < this.yrad;
		}
		move(xstart, ystart, xdiff, ydiff){ // controls how the lens can be dragged, both the whole lens and deformations
			if(this.locked){return;}
			if(this.x2*this.y2 != 0){ // correct the other properties, if the lens hs been finished
				if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x1)*(pos_ratio) < 15 && Math.abs(ystart - this.y1)*(pos_ratio) < 15 ){
					this.x1 += xdiff; this.y1 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x2)*(pos_ratio) < 15 && Math.abs(ystart - this.y1)*(pos_ratio) < 15 ){
					this.x2 += xdiff; this.y1 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x1)*(pos_ratio) < 15 && Math.abs(ystart - this.y2)*(pos_ratio) < 15 ){
					this.x1 += xdiff; this.y2 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x2)*(pos_ratio) < 15 && Math.abs(ystart - this.y2)*(pos_ratio) < 15 ){
					this.x2 += xdiff; this.y2 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x1)*(pos_ratio) < 15 ){
					this.x1 += xdiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(xstart - this.x2)*(pos_ratio) < 15 ){
					this.x2 += xdiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(ystart - this.y1)*(pos_ratio) < 15 ){
					this.y1 += ydiff;
				}else if( this.x2*this.y2 != 0 && Math.abs(ystart - this.y2)*(pos_ratio) < 15 ){
					this.y2 += ydiff;
				}else{
					this.x1 += xdiff; this.y1 += ydiff;
					if( this.x2*this.ys != 0){
						this.x2 += xdiff; this.y2 += ydiff;
					}
				}
			}else{
				this.x1 += xdiff; this.y1 += ydiff;
			}
			this.fix_up();
			document.getElementById('lens_'+this.id+"_values").innerHTML = this.make_controls();

			if(this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = calculatePolygonArea(xpoints, ypoints, xpoints.length);	
			}
			else
				this.area = this.getArea();
		}
		draw(proc, building, selected, w, h, disp_w=0, disp_h=0, aspect=true){
			if(aspect){
				var ratio = pos_ratio; var gx = ground_x; var gy = ground_y; 
			}else{
				 var gx = 0; var gy = 0; 
				if(HEIGHT / h > WIDTH / w){
					var ratio = h/HEIGHT;
				}else{
					var ratio = w/WIDTH;
				}
			}
			if(building){
				proc.ellipse(disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy, 20, 20);
				proc.rect( disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy,
					(w*SPATIAL.mouseX/spatial_width) - ((this.x1-OFFSET_X) * ratio + gx ), (h*SPATIAL.mouseY/spatial_height) - ((this.y1-OFFSET_Y) * ratio + gy) );
			}else{
				proc.rect(disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy,
					this.xrad * 2 * ratio, this.yrad * 2 * ratio);
			}
			if(selected && this.x2*this.y2!=0 && !this.locked){
				proc.strokeWeight(1); proc.stroke(this.col(40)); proc.fill(this.col(0));
				proc.line( disp_w + (this.x1-OFFSET_X) * ratio + gx + Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y1-OFFSET_Y) * ratio + gy,
							disp_w + (this.x1-OFFSET_X) * ratio + gx + Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y2-OFFSET_Y) * ratio + gy );
				proc.line( disp_w + (this.x2-OFFSET_X) * ratio + gx - Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y1-OFFSET_Y) * ratio + gy,
							disp_w + (this.x2-OFFSET_X) * ratio + gx - Math.min(15, (this.x2-this.x1)/2*ratio), disp_h + (this.y2-OFFSET_Y) * ratio + gy );
							
				proc.line( disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy + Math.min(15, (this.y2-this.y1)/2*ratio),
							disp_w + (this.x2-OFFSET_X) * ratio + gx, disp_h + (this.y1-OFFSET_Y) * ratio + gy + Math.min(15, (this.y2-this.y1)/2*ratio) );
				proc.line( disp_w + (this.x1-OFFSET_X) * ratio + gx, disp_h + (this.y2-OFFSET_Y) * ratio + gy - Math.min(15, (this.y2-this.y1)/2*ratio),
							disp_w + (this.x2-OFFSET_X) * ratio + gx, disp_h + (this.y2-OFFSET_Y) * ratio + gy - Math.min(15, (this.y2-this.y1)/2*ratio) );
			}
			proc.fill(this.col(95));
			proc.strokeWeight(0);
			if(aspect && SHOW_LENSLABEL && SHOW_GROUPLABEL) {
				proc.text(this.name+", Group "+this.group, (this.centx-OFFSET_X) * ratio + gx, (this.centy-OFFSET_Y) * ratio + gy)
			} else if(aspect && SHOW_LENSLABEL) {
				proc.text(this.name, (this.centx-OFFSET_X) * ratio + gx, (this.centy-OFFSET_Y) * ratio + gy);
			}
			proc.strokeWeight(1);
			if(this.area == undefined && this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = calculatePolygonArea(xpoints, ypoints, xpoints.length);	
			}
			else if(this.area == undefined)
				this.area = this.getArea();

		}
		constructor(lid, x1, y1, groupid, sampleId, startTime, endTime){
			super(lid, x1, y1, groupid, sampleId, startTime, endTime); this.type = 'rect';
		}
}

// lens list function
lensbox = '<div class="dragger" draggable="true" ondragend="dragEnd()" ondragover="dragOver_page(event)" ondragstart="dragStart(event)" id="#_dragger"></div>'
+ '<div class="controls" style="display: flex; flex-direction: column;">'
+ '<div style="display: flex; align-items: center;">'
+ '<input type="text" id="lens_#_name" name="#name" style="width:70px" value="aoi#">'
+ '<button id="lens_#_c" checked="true" onclick="not_all_eye(\'showlens\');"><i class="fas fa-eye"></i></button>'
+ '<input class="num" type="number" id="lens_#_lensegroup" style="width:50px" value="1" step="1" min="1" max="30">'
+ '<div class="tool inner_button" style="display: inline-flex; align-items: center;"><button id="lens_#_temporal_btn" onclick="toggleTemporal(#);"><i class="fas fa-clock"></i></button><span class="tip">Make current lens temporal</span></div>'
+ '<div class="tool inner_button" style="display: inline-flex; align-items: center;"><button id="lens_#_l" checked="true"><i class="fas fa-lock-open"></i></button><span class="tip">Lock the lens with current value</span></div>'
+ '<div class="tool inner_button" style="display: inline-flex; align-items: center;"><button onclick="delete_lens(#);"><i class="far fa-trash-alt"></i></button><span class="tip">Delete the lens</span></div>'
+ '<div class="tool inner_button" style="display: inline-flex; align-items: center;"><button onclick="duplicate_lens(#);"><i class="far fa-copy"></i></button><span class="tip">Duplicate the lens</span></div>'
// +'<input type="color" id="aoic_#" class="colorer" style="min-width: 20px; min-height: 21.5px; width: 20px; height: 21.5px;" oninput="LENS_COLOURS[#]=this.value; update_colour_vals();">'
+ `<input type="color" id="aoic_#" class="colorer" style="min-width: 20px; min-height: 21.5px; width: 20px; height: 21.5px;" oninput="LENS_COLOURS[#]=this.value; update_colour_vals(); const other = document.querySelectorAll('[id^=aoic_' + # + ']'); other.forEach(el => { if (el !== this) el.value = this.value; });">`
+ '</div>'
+'<div style="display: flex; gap: 8px; align-items: center; margin: 3px">'
+ '<label>Screen ID<br><input class="num" type="number" id="lens_#_screen_id" name="#name" style="width:70px" step=1 min=1></label>'
+ '<label>App ID<br><input class="num" type="number" id="lens_#_app_id" name="#name" style="width:70px" min=1 step=1></label>'
+ '<label>Interface ID<br><input class="num" type="number" id="lens_#_interface_id" name="#name" style="width:70px" min=1 step=1></label>'
+'<button id="lens_#_aoi_done" onclick="save_aoi(#);"><i class="fas fa-check-circle"></i></button></div>'
+ '<div id="lens_#_values" class="hidden"></div></div>';

lid = 0; selected_lens = -1; building_lens_id = -1;
lenses = []; order_lenses = []; base_lenses = []; new_lens_mode = 'poly';
lens_type_list = ['poly', 'ellipse', 'rect']; LENS_CREATION_MODE = lens_type_list[0];
function create_lens(mx, my){
	v = lid;
	let groupid = LENSEGROUPS.length + 1;
	if(new_lens_mode == 'poly'){
		l = new PolyLens(lid, mx, my, groupid);
	}else if (new_lens_mode == 'ellipse'){
		l = new EllipseLens(lid, mx, my, groupid);
	}else if (new_lens_mode == 'rect'){
		l = new RectLens(lid, mx, my, groupid);
	}
	SAC_FILTER_CHANGED = true; lid += 1;
	selected_lens = v; building_lens_id = v;
	base_lenses.push(l); order_lenses.push(v); lenses.push(l);
	q = lensbox.replace(/#/g, v);
	var node = document.createElement("li");
	node.innerHTML = q; node.id = "lens_"+v;
	//node.setAttribute('onclick', "if(selected_lens!="+v+"){select_lens("+v+");}else{select_lens(-1);}");
	node.setAttribute('class', 'lens_item');
	document.getElementById('lenslist').appendChild(node);
	update_lens_colors();
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
		// console.log('class', ec, 'target', e.target);
	}
	document.getElementById('lens_'+v+'_c').checked = true;
	document.getElementById('lens_'+v+'_c').onclick = function(){ 
		document.getElementById('sort_dropdown').value = 'No_sort'; 
		load_controls(); 
		matrix_changed = true;
		timeline_changed=true;  
		this.checked = !this.checked; 
		if(this.checked){
			this.innerHTML='<i class="fas fa-eye"></i>';
		}else{
			this.innerHTML='<i class="fas fa-eye-slash"></i>';
		} 
	}
	document.getElementById('lens_'+v+'_l').checked = false;
	document.getElementById('lens_'+v+'_l').onclick = function(){ 
		this.checked = !this.checked; 
		if(this.checked){
			this.innerHTML='<i class="fas fa-lock"></i>';
		}else{this.innerHTML='<i class="fas fa-lock-open"></i>';} 
	}
	document.getElementById('lens_'+v+'_lensegroup').value = groupid;
}
function lenses_update(){
	midground_changed = true; timeline_changed = true; matrix_changed = true; SAC_FILTER_CHANGED = true;
}
function save_aoi(id){
	const doneBtn=document.getElementById(`lens_${id}_aoi_done`)
	const icon = doneBtn.querySelector('i');
	const screenEl = document.getElementById(`lens_${id}_screen_id`);
	const appEl = document.getElementById(`lens_${id}_app_id`);
	const interfaceEl = document.getElementById(`lens_${id}_interface_id`);
	
	const screenVal = screenEl?.value?.trim();
	const appVal = appEl?.value?.trim();
	const interfaceVal = interfaceEl?.value?.trim();

	if (!screenVal && !appVal && !interfaceVal) {
		alert('All values cannot be empty');
		return;
	}

	icon.style.color="green";

	const targetLens = lenses.find(lens => lens.id === id);
	if(targetLens) {
		targetLens.edit_hierarchy(screenVal, appVal, interfaceVal);
	} else {
		console.log('Target lens not found');
	}

	window.lenses = targetLens;
	// console.log('target lens:', targetLens)
	alert('AOI saved successfully!');
}
function find_lens(X, Y){

	if( building_lens_id != -1){
		selected_lens = building_lens_id;
	}else if( selected_lens != -1 && base_lenses[selected_lens].inside(X, Y) ){
		//
	}else{
		min_id = -1;
		for(var i=0; i<lenses.length;i++){
			if( lenses[i].inside(X, Y) ){ min_id = i; }
		}
		if( min_id != -1 && building_lens_id==-1){ select_lens(lenses[min_id].id); }
		else if( min_id==-1 && building_lens_id==-1 && CONTROL_STATE!="aoi" ){ select_lens(-1); }
	}
}
function click_lens(X, Y){
	// if we clicked on a lens, find the first one
	if(building_lens_id > -1 && building_lens_id < base_lenses.length && !base_lenses[building_lens_id].included)
		building_lens_id = -1;
	if(selected_lens > -1 && selected_lens < base_lenses.length && !base_lenses[selected_lens].included)
		selected_lens = -1;

	if( selected_lens != -1 && base_lenses[selected_lens].included && base_lenses[selected_lens].inside(X, Y)){
		min_id = order_lenses.indexOf( selected_lens );
	}else{
		min_id = -1;
		for(var i=0; i<lenses.length;i++){
			if( lenses[i].included && lenses[i].inside(X, Y) )
			{
				min_id = i; 
			}
		}
		if( min_id != -1 && building_lens_id==-1){ select_lens(lenses[min_id].id); }
		else if( min_id==-1 && building_lens_id==-1 && CONTROL_STATE=="" ){ select_lens(-1); }
	}
	
	if(building_lens_id >= 0){
		selected_lens = building_lens_id;
		l = base_lenses[building_lens_id];
		if(l.near_start(X+OFFSET_X, Y+OFFSET_Y)){
			if(l.type != 'poly' || l.x.length < 3){
				delete_lens(building_lens_id);
			}
			building_lens_id = -1;
		}else{
			l.add(X+OFFSET_X, Y+OFFSET_Y);
		}
	}else if( min_id == -1 ){
		create_lens(X+OFFSET_X, Y+OFFSET_Y); //otherwise, we are starting a new lens
		view_panel(3);
	}else{ // otherwise, we don't have an active lens and we are builing a new one, so select what we clicked on
		selected_lens = lenses[min_id].id;
	}
	lenses_update();
}
function select_lens(id){
	selected_lens = id; 
	if(id < 0)
		selected_lensegroup = -1;
	else
	selected_lensegroup = base_lenses[id].group; 
	midground_changed = true; timeline_changed=true; matrix_changed = true; SAC_FILTER_CHANGED = true;

	update_lense_mode();
}
function delete_lens(id){
	if( base_lenses[id].locked ){ return; }
	var r = confirm("Are you sure you want to delete the AOI?");
	if(r){
		var elem = document.getElementById('lens_'+id);
		elem.parentNode.removeChild(elem);
		if(id == building_lens_id){ building_lens_id = -1; }
		if(id == selected_lens){ selected_lens = -1; }
		background_changed = true; timeline_changed = true; matrix_changed = true;
	}
}
function dragOver_lens(e) {
  par = e.target.parentNode;
  val = isBefore(selected, par);
  if (val==1) {
    par.parentNode.insertBefore(selected, par);
  }
  if(val==-1) {
    par.parentNode.insertBefore(selected, par.nextSibling)
  }
}

/*
    * X, Y	Arrays of the x and y coordinates of the vertices, traced in a clockwise direction, starting at any vertex. If you trace them counterclockwise, the result will be correct but have a negative sign.
    * numPoints	The number of vertices
    * Returns	the area of the polygon
    */
function calculatePolygonArea(X, Y, numPoints) 
{ 
	let area = 0;   // Accumulates area 
	let j = numPoints-1; 

	for (let i=0; i<numPoints; i++)
	{ 
		area +=  (Math.floor(X[j])+Math.floor(X[i])) * (Math.floor(Y[j])-Math.floor(Y[i])); 
		j = i;  //j is previous vertex to i
	}	
	area = Math.abs(area/2);
	return area;
}


class VidRectLens {
    constructor(x1, y1) {
        this.type = 'vidrect';
        this.x1 = x1; 
        this.y1 = y1; 
        this.x2 = x1; 
        this.y2 = y1; 
        this.locked = true; 
        this.area = 0; 
        this.color = [255, 255, 255, 128];
		this.visible = true;
    }

    computeArea() {
        const width = Math.abs(this.x2 - this.x1);
        const height = Math.abs(this.y2 - this.y1);
        return width * height;
    }

    updateArea() {
        this.area = this.computeArea();
    }

    add(xn, yn) {
        this.x2 = xn;
        this.y2 = yn;
        this.updateArea();
    }

    inside(xn, yn) {
        return xn >= this.x1 && xn <= this.x2 && yn >= this.y1 && yn <= this.y2;
    }

    move(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

	toggleVisibility() {
        this.visible = !this.visible;
    }

    draw(proc, building, selected, spatial_width, spatial_height) {
		if (!this.visible) return;
		const ratioX = spatial_width / WIDTH;
		const ratioY = spatial_height / HEIGHT;
	
		const drawX1 = (this.x1 - OFFSET_X) * ratioX;
		const drawY1 = (this.y1 - OFFSET_Y) * ratioY;
		const drawX2 = (this.x2 - OFFSET_X) * ratioX;
		const drawY2 = (this.y2 - OFFSET_Y) * ratioY;
	
		const drawWidth = drawX2 - drawX1;
		const drawHeight = drawY2 - drawY1;
	
		proc.fill(...this.color); 
		proc.stroke(0); 
		proc.strokeWeight(1);
	
		proc.rect(drawX1, drawY1, drawWidth, drawHeight);
	
		if (building) {
			proc.fill(255, 0, 0, 128);
			proc.ellipse(drawX1, drawY1, 20, 20); 
		}
	
		if (selected && this.x2 * this.y2 !== 0 && !this.locked) {
			proc.strokeWeight(2);
			proc.stroke(0, 255, 0); 
			proc.noFill();
			proc.rect(drawX1, drawY1, drawWidth, drawHeight);
	
			proc.line(drawX1 + Math.min(15, drawWidth / 2), drawY1, 
					  drawX1 + Math.min(15, drawWidth / 2), drawY2);
			proc.line(drawX2 - Math.min(15, drawWidth / 2), drawY1, 
					  drawX2 - Math.min(15, drawWidth / 2), drawY2);
			proc.line(drawX1, drawY1 + Math.min(15, drawHeight / 2), 
					  drawX2, drawY1 + Math.min(15, drawHeight / 2));
			proc.line(drawX1, drawY2 - Math.min(15, drawHeight / 2), 
					  drawX2, drawY2 - Math.min(15, drawHeight / 2));
		}
	
		proc.fill(0);
		proc.strokeWeight(0);

		if (this.area === undefined) {
			this.area = (this.x2 - this.x1) * (this.y2 - this.y1);
		}
	}
}

function formatMilliseconds(ms) {
    ms = Math.round(ms / 10) * 10; // round to nearest 10ms
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.round((ms % 1000) / 10);

    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    const paddedHundredths = hundredths.toString().padStart(2, '0');

    return `${hours}:${paddedMinutes}:${paddedSeconds}.${paddedHundredths}`;
}

function parseTimeString(timeStr) {
    const [hms, ms = "0"] = timeStr.split(".");
    const [hours, minutes, seconds] = hms.split(":").map(Number);
    const hundredths = Number(ms);

    return (
        hours * 3600000 +
        minutes * 60000 +
        seconds * 1000 +
        hundredths * 10
    );
}

function handleAOITimeChange(time, isString) {
	if (isString) {
		time = parseTimeString(time);
	}

	let selectedFilter = document.getElementById('aoiFilterSelect').value;

	for (let i = 0; i < base_lenses.length; i++) {
		const lens = base_lenses[i];
		if (!lens) {
			continue;
		}

		if (!Array.isArray(lens.timeRanges)) {
			lens.timeRanges = [{ start: lens.startTime ?? 0, end: lens.endTime ?? 0, priority: lens.priority ?? 1 }];
		}

		if (selectedFilter === 'temporal') {
			lens.included = (lens.timeRanges.some(range => time >= range.start && time <= range.end) && lens.isTemporal);
			lens.checked = lens.included;
		} else if (selectedFilter === 'non-temporal') {
			continue;
		} else {
			lens.included = (lens.timeRanges.some(range => time >= range.start && time <= range.end) && lens.isTemporal || (!lens.isTemporal && lens.checked));
		}
		// Find the current time range for the lens, set its current priority to that time range's priority
		const currentRange = lens.timeRanges.find(range => time >= range.start && time <= range.end);
		if (currentRange && lens.isTemporal) {
			lens.currentPriority = currentRange.priority;
		}


		const lensElem = document.getElementById(`lens_${i}_c`);
		if (lensElem) {
			lensElem.innerHTML = lens.included
				? '<i class="fas fa-eye"></i>'
				: '<i class="fas fa-eye-slash"></i>';
			lensElem.checked = lens.included;
		}
	}

	matrix_changed = true
}

function addExtraTimeRow(lensId) {
	const lens = base_lenses[lensId];

	lens.timeRanges.push({ start: 0, end: 0, priority: 1 });

	const container = document.getElementById(`lens_${lensId}_values`);
	if (container) {
		container.innerHTML = lens.make_controls();
	} else {
		console.warn(`Container lens_${lensId}_values not found`);
	}
	const btn = document.getElementById(`lens_${lensId}_temporal_btn`);
	const count = lens.timeRanges?.length || 0;
	btn.innerHTML = `
		<span style="display: inline-flex; align-items: center;">
			<i class="fas fa-clock" style="color: green;"></i>
			<span style="font-size: 0.9em;">${count}</span>
		</span>`;
}

function removeTimeRow(lensId, index) {
	const lens = base_lenses[lensId];

	if (lens.timeRanges.length > 1) {
		lens.timeRanges.splice(index, 1);
	}

	const container = document.getElementById(`lens_${lensId}_values`);
	if (container) {
		container.innerHTML = lens.make_controls();
	}
	const btn = document.getElementById(`lens_${lensId}_temporal_btn`);
	const count = lens.timeRanges?.length || 0;
	btn.innerHTML = `
		<span style="display: inline-flex; align-items: center;">
			<i class="fas fa-clock" style="color: green;"></i>
			<span style="font-size: 0.9em;">${count}</span>
		</span>`;
}

function toggleTemporal(id, state = null) {
	const lens = base_lenses[id];

	if (typeof state === "boolean") {
		lens.isTemporal = state;
	} else {
		lens.isTemporal = !lens.isTemporal;
	}

	const container = document.getElementById(`lens_${id}_values`);
	if (container) {
		container.innerHTML = lens.make_controls();
	}

	const btn = document.getElementById(`lens_${id}_temporal_btn`);
	if (btn) {
		if (!lens.isTemporal) {
			btn.innerHTML = '<i class="fas fa-clock"></i>';
		} else {
			const count = lens.timeRanges?.length || 0;
			btn.innerHTML = `
				<span style="display: inline-flex; align-items: center;">
					<i class="fas fa-clock" style="color: green;"></i>
					<span style="font-size: 0.9em;">${count}</span>
				</span>`;
		}
	}
}

function handleAOIFilterChange(filterType) {
	base_lenses.forEach((lens, i) => {
		if (filterType === 'temporal') {
			lens.included = lens.isTemporal;
		} else if (filterType === 'non-temporal') {
			lens.included = !lens.isTemporal;
		} else {
			lens.included = true;
		}

		const lensElem = document.getElementById(`lens_${i}_c`);
		if (lensElem) {
			lensElem.innerHTML = lens.included
			? '<i class="fas fa-eye"></i>'
			: '<i class="fas fa-eye-slash"></i>';
			lensElem.checked = lens.included;
		} else {
			// console.log(`Element lens_${i}_c not found`);
		}
	});

	lenses_update();
}

function updateLensToggleVisual(id, included) {
	const lensElem = document.getElementById(`lens_${id}_c`);
	if (lensElem) {
		lensElem.innerHTML = included
			? '<i class="fas fa-eye"></i>'
			: '<i class="fas fa-eye-slash"></i>';
		lensElem.checked = included;
	} else {
		// console.log(`Element lens_${id}_c not found`);
	}
}


function handleTWIChange() {
	const showlensEl = document.getElementById('showlens');
	if (showlensEl && showlensEl.innerHTML.includes('slash')) {
		return;
	}

	for (const toi of toisOfSelectedTwi) {
		const tstart = toi.tmin;
		const tend = toi.tmax;

		for (let i = 0; i < base_lenses.length; i++) {
			const lens = base_lenses[i];
			const lensTimeRanges = lens.timeRanges;

			let isStatic = false;
			let isPartial = false;

			for (let j = 0; j < lensTimeRanges.length; j++) {
				const range = lensTimeRanges[j];

				if (range.start <= tstart && range.end >= tend) {
					isStatic = true;
					break;
				}

				if (range.end >= tstart && range.start <= tend) {
					isPartial = true;
				}
			}

			if (isStatic) {
				lens.included = true;
				toggleTemporal(i, false, false);
			} else if (isPartial) {
				lens.included = true;
				toggleTemporal(i, true, false);
			} else {
				lens.included = false;
			}
			lens.checked = lens.included;

			updateLensToggleVisual(i, lens.included);
			if (lens.name == "aoi25") {console.log(`Lens ${lens.name} included: ${lens.included}, Static: ${isStatic}, Temporal: ${isPartial}`)};
				
		}
	}

	lenses_update();
}

function duplicate_lens(id) {
	const originalLens = base_lenses[id];
	if (!originalLens) {
		console.warn(`Lens with id ${id} not found`);
		return;
	}

	const type = originalLens.type 
	let newLens;

	const newId = lid++;
	const groupId = originalLens.group;

	// Instantiate the correct lens class
	if (type === 'poly') {
		newLens = new PolyLens(newId, originalLens.x[0], originalLens.y[0], groupId);
		newLens.x = [...originalLens.x];
		newLens.y = [...originalLens.y];

		const [cx, cy] = computeCentroid(newLens.x, newLens.y);
		newLens.centx = cx;
		newLens.centy = cy;
	} else if (type === 'ellipse') {
		newLens = new EllipseLens(newId, originalLens.x1, originalLens.y1, groupId);
		newLens.x2 = originalLens.x2;
		newLens.y2 = originalLens.y2;
		newLens.centx = (newLens.x1 + newLens.x2) / 2;
		newLens.centy = (newLens.y1 + newLens.y2) / 2;
	} else if (type === 'rect') {
		newLens = new RectLens(newId, originalLens.x1, originalLens.y1, groupId);
		newLens.x2 = originalLens.x2;
		newLens.y2 = originalLens.y2;
		newLens.centx = (newLens.x1 + newLens.x2) / 2;
		newLens.centy = (newLens.y1 + newLens.y2) / 2;
	} else {
		console.warn("Unknown lens type; cannot duplicate");
		return;
	}

	newLens.name = originalLens.name + '_copy';
	newLens.isTemporal = originalLens.isTemporal;
	newLens.timeRanges = originalLens.timeRanges.map(r => ({ ...r }));
	newLens.h1 = originalLens.h1;
	newLens.h2 = originalLens.h2;
	newLens.h3 = originalLens.h3;
	newLens.parentLens = originalLens.parentLens;
	newLens.currentPriority = originalLens.currentPriority;

	const v = newLens.id;
	base_lenses.push(newLens);
	order_lenses.push(v);
	lenses.push(newLens);


	const q = lensbox.replace(/#/g, v);
	const node = document.createElement("li");
	node.innerHTML = q;
	node.id = `lens_${v}`;
	node.setAttribute('class', 'lens_item');
	document.getElementById('lenslist').appendChild(node);

	node.onclick = function (e) {
		var ec = e.target.className;
		var ecs = e.target.className.split(' ')[0];
		var ecid = e.target.id.split('_')[2];
		var v = parseInt(this.id.split('_')[1]);
		if (ec != 'num' && ecs != 'fas' && ecid != 'name') {
			if (selected_lens != v) {
				select_lens(v);
			} else {
				select_lens(-1);
			}
		}
		if ((ecid === 'name' || ec === 'fas fa-eye-slash') && selected_lens != v) {
			select_lens(v);
		}
		if ((ec === 'fas fa-eye' || ecs === 'far') && selected_lens === v) {
			select_lens(-1);
		}
	};

	const eyeBtn = document.getElementById(`lens_${v}_c`);
	if (eyeBtn) {
		eyeBtn.checked = true;
		eyeBtn.onclick = function () {
			document.getElementById('sort_dropdown').value = 'No_sort';
			load_controls();
			matrix_changed = true;
			timeline_changed = true;
			this.checked = !this.checked;
			this.innerHTML = this.checked
				? '<i class="fas fa-eye"></i>'
				: '<i class="fas fa-eye-slash"></i>';
		};
	}

	const lockBtn = document.getElementById(`lens_${v}_l`);
	if (lockBtn) {
		lockBtn.checked = false;
		lockBtn.onclick = function () {
			this.checked = !this.checked;
			this.innerHTML = this.checked
				? '<i class="fas fa-lock"></i>'
				: '<i class="fas fa-lock-open"></i>';
		};
	}

	const temporalBtn = document.getElementById(`lens_${v}_temporal_btn`);
	if (temporalBtn) {
		const count = newLens.timeRanges?.length || 0;
		temporalBtn.innerHTML = !newLens.isTemporal
			? '<i class="fas fa-clock"></i>'
			: `<span style="display: inline-flex; align-items: center; gap: 4px;">
					<i class="fas fa-clock" style="color: green;"></i>
					<span style="font-size: 0.9em;">${count}</span>
			</span>`;

		temporalBtn.onclick = function () {
			toggleTemporal(v);
		};
	}

	const groupInput = document.getElementById(`lens_${v}_lensegroup`);
	if (groupInput) {
		groupInput.value = newLens.group;
	}

	const controlPanel = document.getElementById(`lens_${v}_values`);
	if (controlPanel) {
		controlPanel.innerHTML = newLens.make_controls();
	}

	const nameInput = document.getElementById(`lens_${v}_name`);
	if (nameInput) {
		nameInput.value = newLens.name;
	}

	const h1Input = document.getElementById(`lens_${v}_screen_id`);
	if (h1Input) {
		h1Input.value = newLens.h1;
	}
	const h2Input = document.getElementById(`lens_${v}_app_id`);
	if (h2Input) {
		h2Input.value = newLens.h2;
	}
	const h3Input = document.getElementById(`lens_${v}_interface_id`);
	if (h3Input) {
		h3Input.value = newLens.h3;
	}

	generateAOIColorControls();
	update_lens_colors();
	newLens.draw()
}

function computeCentroid(xs, ys) {
	let xSum = 0;
	let ySum = 0;
	for (let i = 0; i < xs.length; i++) {
		xSum += xs[i];
		ySum += ys[i];
	}
	return [xSum / xs.length, ySum / ys.length];
}
