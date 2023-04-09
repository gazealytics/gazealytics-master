
// lens list function
notebox =  '<div></div>'
+ '<div class="controls">'
+ '<textarea class="tool" id="note_#_content"  value="" oninput="base_notes[#].content = this.value"></textarea>'
+ '<div class="tool inner_button"><button onclick="delete_note(#);"> <i class="far fa-trash-alt"></i> </button><span class="tip">Delete the note</span></div><br >'
+ '<select class="note_dataset" id="#_note_pid" onchange="base_notes[#].pid = this.value*1"></select></div>';

base_notes = [];
order_notes = [];
selected_note = -1;
var LINE_CHAR = "\n";

function new_note(X, Y){
	v = base_notes.length;
	newnote = { pid: selected_data, X:X, Y:Y, content:"", selected:true, max_width:0, included:true };
	base_notes.push(newnote);
	
	q = notebox.replace(/#/g, v);
	var node = document.createElement("li");
	node.innerHTML = q; node.id = "note_"+v;
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
	make_note_dataset_selectors();
	select_note(v);
}
function make_note_dataset_selectors(){
	selectors = document.getElementsByClassName("note_dataset");
	for(var i=0; i<selectors.length; i++){
		selector = selectors[i];
		id = selector.id.split('_')[0]*1;
		selector.innerHTML = ""; content = "";
		for(var j=0; j<DATASETS.length; j++){
			if(DATASETS[j].initialised && DATASETS[j].should_save){
				content += "<option value='"+j+"'>"+DATASETS[j].name+"</option>"
			}
		}
		selector.innerHTML = content;
		selector.value = base_notes[id].pid;
	}
}


function draw_notes( canvas ){
	
	var list = document.getElementById("notelist").children;
	order_notes = [];
	for(var i=0; i<list.length; i++){
		var elem = list[i];
		var id = parseInt( elem.id.split('_')[1] );
		order_notes.push(id);
		var note = base_notes[id];
		note.selected = (id==selected_note);
		var g = note.content.split(LINE_CHAR);
		canvas.fill(white(100)); canvas.stroke(white(100));
		note.max_width = 0;
		for(var j=0; j<g.length; j++){
			note.max_width = Math.max( note.max_width, canvas.textWidth(g[j]) );
			canvas.strokeWeight(0);
			if( VALUED.indexOf(note.pid)!=-1){ canvas.text( g[j], ( (note.X-OFFSET_X) * pos_ratio + ground_x), ( (note.Y-OFFSET_Y) * pos_ratio + ground_y) + j*(canvas.textAscent()) ); }
		}
		if( note.selected && CONTROL_STATE=='notes' ){
			canvas.fill(makeColor(0, SELECTED)); canvas.stroke(makeColor(100, SELECTED)); canvas.strokeWeight(1);
			canvas.rect( ( ((note.X-OFFSET_X) * pos_ratio + ground_x)-(note.max_width/2)) - 2, ( (note.Y-OFFSET_Y) * pos_ratio + ground_y)  - canvas.textAscent() - 2, note.max_width+4, g.length*canvas.textAscent() + 4);
		}
	}
	
}

function select_note(v){
	selected_note = v;
	var list = document.getElementById("notelist").children;
	for(var i=0; i<list.length; i++){
		var id = parseInt( list[i].id.split('_')[1] );
		base_notes[ id ].selected = ( id==v );
		if( base_notes[ id ].selected != list[i].classList.value.includes('selected')){
			list[i].classList.toggle('selected');
		}
	}
	for(var i=0; i<list.length; i++){
		var id = parseInt( list[i].id.split('_')[1] );
		if( base_notes[ id ].content == "" && !base_notes[ id ].selected ){
			delete_note(id);
		}
	}
}
function find_note(canvas, X, Y){
	var selnote = -1;
	if( selected_note != -1 ){ 
		note = base_notes[selected_note]; 
		var g = note.content.split(LINE_CHAR);
	}
	if( (selected_note != -1) && (( ((note.X-OFFSET_X) * pos_ratio + ground_x)-(note.max_width/2)) - 2 <= X* pos_ratio + ground_x) && 
			(( ((note.X-OFFSET_X) * pos_ratio + ground_x)-(note.max_width/2)) + note.max_width+2 >= X* pos_ratio + ground_x) && 
			(( (note.Y-OFFSET_Y) * pos_ratio + ground_y)  - canvas.textAscent() - 2) <= Y* pos_ratio + ground_y &&
			(( (note.Y-OFFSET_Y) * pos_ratio + ground_y)  - canvas.textAscent() - 2)+ g.length*canvas.textAscent() + 4 >= Y* pos_ratio + ground_y && 
			( VALUED.indexOf(note.pid)!=-1 ) ){
		selnote = selected_note;
	}else{
		selnote = -1;
		for(var i=0; i<order_notes.length; i++){
			note = base_notes[order_notes[i]];
			var g = note.content.split(LINE_CHAR);
			if( (( ((note.X-OFFSET_X) * pos_ratio + ground_x)-(note.max_width/2)) - 2 <= X* pos_ratio + ground_x) && 
			(( ((note.X-OFFSET_X) * pos_ratio + ground_x)-(note.max_width/2)) + note.max_width+2 >= X* pos_ratio + ground_x) && 
				(( (note.Y-OFFSET_Y) * pos_ratio + ground_y)  - canvas.textAscent() - 2) <= Y* pos_ratio + ground_y &&
				(( (note.Y-OFFSET_Y) * pos_ratio + ground_y)  - canvas.textAscent() - 2)+ g.length*canvas.textAscent() + 4 >= Y* pos_ratio + ground_y && 
				( VALUED.indexOf(note.pid)!=-1 ) ) {
				selnote = order_notes[i];
			}
		}
	}
	select_note(selnote);
}

function delete_note(id){
	if(base_notes[id].content !== ""){
		var r= confirm("Are you sure you want to delete the note?");
		if(r){
			var elem = document.getElementById('note_'+id);
			elem.parentNode.removeChild(elem);
			base_notes[id].included = false;
			if(id == selected_note){ selected_note = -1; }
		}
	}else{
		var elem = document.getElementById('note_'+id);
		elem.parentNode.removeChild(elem);
		base_notes[id].included = false;
		if(id == selected_note){ selected_note = -1; }
	}
}

function key_note(key){
	if(document.activeElement.className.match("tool")){return;}
	if( selected_note == -1){return;}
	note = base_notes[selected_note];
	if( key == 'Delete' ){
		note.content = "";
	}else if( key == 'Backspace' ){ // doesn't work because apparently the backspace key doesn't register?
		note.content = note.content.substring(0, note.content.length - 1);
	}else if( key == 'Enter' ){ // not the correct symbol for causing a line break
		note.content += LINE_CHAR;
	}else if(key.length == 1){
		note.content += key;
	}
	if( order_notes.indexOf(selected_note) != -1){
		document.getElementById("note_"+selected_note+"_content").value = note.content;
	}
}