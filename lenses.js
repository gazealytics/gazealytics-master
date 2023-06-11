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
			if(aspect && SHOW_LENSLABEL){proc.text(this.name+", Group "+this.group, disp_w + (this.centx-OFFSET_X) * ratio + gx, disp_h + (this.centy-OFFSET_Y) * ratio + gy);}
			proc.strokeWeight(1);
			if(this.area == undefined && this.getArea == undefined)
				this.area = calculatePolygonArea(this.x, this.y, this.x.length);//this.getArea();
			else if(this.area == undefined)
				this.area = this.getArea();
		}
		make_controls(){
			var g = "";
			for(var i=0; i<this.x.length; i++){
				g += '<tr><th><input class="num" type="number" onchange="base_lenses['+this.id+'].x['+i+']=parseFloat(this.value);lenses_update()" style="width:80px" value='+this.x[i]+'></th>';
				g += '<th><input class="num" type="number" onchange="base_lenses['+this.id+'].y['+i+']=parseFloat(this.value);lenses_update()" style="width:80px" value='+this.y[i]+'></th></tr>';
			}
			g = "<table>"+g+"</table>";
			return g;
		}
		constructor(lid, x1, y1, groupid){
			this.type = 'poly'; this.id = lid; this.name = lid+''; this.locked = false;
			this.x = [x1]; this.y = [y1]; this.centx = x1; this.centy = y1; this.group = groupid;
			this.area = 0;
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
			if(aspect && SHOW_LENSLABEL){proc.text(this.name+", Group "+this.group, (this.centx-OFFSET_X) * ratio + gx, (this.centy-OFFSET_Y) * ratio + gy)};
			proc.strokeWeight(1);
			if(this.area == undefined && this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = calculatePolygonArea(xpoints, ypoints, xpoints.length);	
			}
			else if(this.area == undefined)
				this.area = this.getArea();
		}
		make_controls(){
			var g = '<tr><th><input class="num" type="number" onchange="base_lenses['+this.id+'].x1=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.x1+'></th>';
			g += '<th><input class="num" type="number" onchange="base_lenses['+this.id+'].y1=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.y1+'></th></tr>';
			g += '<tr><th><input class="num" type="number" onchange="base_lenses['+this.id+'].x2=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.x2+'></th>';
			g += '<th><input class="num" type="number" onchange="base_lenses['+this.id+'].y2=parseFloat(this.value);base_lenses['+this.id+'].fix_up();lenses_update()" style="width:80px" value='+this.y2+'></th></tr>';
			g = "<table>"+g+"</table>";
			return g;
		}
		constructor(lid, x1, y1, groupid){
			this.type = 'ellipse'; this.id = lid; this.name = lid+''; this.locked = false;
			this.x1 = x1; this.y1 = y1;
			this.x2 = 0; this.y2 = 0;
			this.xrad = 0; this.yrad = 0;
			this.centx = x1; this.centy = y1;
			this.group = groupid;
			this.area = 0;
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
			if(aspect && SHOW_LENSLABEL){proc.text(this.name+", Group "+this.group, (this.centx-OFFSET_X) * ratio + gx, (this.centy-OFFSET_Y) * ratio + gy)};
			proc.strokeWeight(1);
			if(this.area == undefined && this.getArea == undefined){
				let xpoints = [this.x1, this.x2, this.x2, this.x1];
				let ypoints = [this.y1, this.y1, this.y2, this.y2];
	
				this.area = calculatePolygonArea(xpoints, ypoints, xpoints.length);	
			}
			else if(this.area == undefined)
				this.area = this.getArea();

		}
		constructor(lid, x1, y1, groupid){
			super(lid, x1, y1, groupid); this.type = 'rect';
		}
}

// lens list function
lensbox = '<div class="dragger" draggable="true" ondragend="dragEnd()" ondragover="dragOver_page(event)" ondragstart="dragStart(event)" id="#_dragger"></div>'
+ '<div class="controls"><input type="text" id="lens_#_name" name="#name" style="width:70px" value="aoi#">'
+ '<button id="lens_#_c" checked="true" onclick="not_all_eye("showlens");"> <i class="fas fa-eye"></i> </button>'
+ '<input class="num" type="number" id="lens_#_lensegroup" style="width:50px" value = 1 step=1 min=1 max=20>'
+ '<div class="tool inner_button"><button id="lens_#_l" checked="true" > <i class="fas fa-lock-open"></i> </button><span class="tip">Lock the lens with current values</span></div>'
+ '<div class="tool inner_button"><button onclick="delete_lens(#);"> <i class="far fa-trash-alt"></i> </button><span class="tip">Delete the lens</span></div>'
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
	document.getElementById('lens_'+v+'_c').onclick = function(){ document.getElementById('sort_dropdown').value = 'No_sort'; load_controls(); matrix_changed = true;timeline_changed=true;  this.checked = !this.checked; if(this.checked){this.innerHTML='<i class="fas fa-eye"></i>';}else{this.innerHTML='<i class="fas fa-eye-slash"></i>';} }
	document.getElementById('lens_'+v+'_l').checked = false;
	document.getElementById('lens_'+v+'_l').onclick = function(){ this.checked = !this.checked; if(this.checked){this.innerHTML='<i class="fas fa-lock"></i>';}else{this.innerHTML='<i class="fas fa-lock-open"></i>';} }
	document.getElementById('lens_'+v+'_lensegroup').value = groupid;
	}
function lenses_update(){
	midground_changed = true; timeline_changed = true; matrix_changed = true; SAC_FILTER_CHANGED = true;
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