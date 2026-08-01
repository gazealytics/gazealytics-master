// lens list function
notebox =
	'<div class="data_dragger" draggable="false" id="#_note_drag"></div>' +
	'<div class="rowsplit">' +
	'<div class="controls">' +
	'<div class="tool inner_button">' +
	'<button id="notes_#_l" onclick="toggleNoteLock(#)"> <i class="fas fa-lock-open"></i> </button>' +
	'<span class="tip">Lock the lens with current values</span></div>' +
	'<div class="tool inner_button">' +
	'<button id="notes_#_v" class="toggler toggle-on" onclick="toggleSpatialVisibility(#)"> <i class="fas fa-eye"></i> </button>' +
	'<span class="tip">Toggle visibility of note on spatial canvas</span></div>' +
	'<div class="tool inner_button">' +
	'<button id="notes_#_t" class="toggler toggle-on" onclick="toggleTimeVisibility(#)"> <i class="fas fa-clock"></i> </button>' +
	'<span class="tip">Toggle visibility of note on timeline canvas</span></div>' +
	'<div class="tool inner_button"><button onclick="delete_note(#);"><i class="far fa-trash-alt"></i></button>' +
	'<span class="tip">Delete the note</span></div><br>' +
	'<select class="note_dataset" id="#_note_pid" onchange="changeNotePid(#, this.value)"></select>' +
	"</div>";

var base_notes = [];
var order_notes = [];
var importedNotes = {};
var preFilteredBaseNotes = [];
var noteTypes = [];
var selected_note = -1;
var LINE_CHAR = "\n";
const NOTE_TYPES = ["general", "technical", "alarms", "others"];
let isObserver = false;
function new_note(
	X,
	Y,
	content,
	noteBelongTo,
	type = "N/A",
	timestamp = "00:00:00:00",
	timestampMs = 0,
	occuredTimestamp = "00:00:00:00",
	observer = "N/A",
	visibleOnCanvas = true,
	visibleOnTimeline = true,
	isPreloaded = false,
	isLocked = false
) {
	let v = base_notes.length;

	// If preloading, assign PID from preloaded data
	let notePID = selected_data;
	if (isPreloaded) {
		notePID = noteBelongTo;
	} else {
		DATASETS.forEach((d, i) => {
			if (d.name === noteBelongTo) {
				notePID = i;
			}
		});
	}

	let newnote = {
		pid: notePID,
		X: X,
		Y: Y,
		content: content,
		selected: false,
		max_width: 0,
		included: true,
		type: type,
		timestamp: timestamp,
		observer: observer,
		timestampMs: timestampMs,
		occuredTimestamp: occuredTimestamp,
		shownInList: true,
		locked: isLocked,
		visibleOnCanvas: visibleOnCanvas,
		visibleOnTimeline: visibleOnTimeline,
	};

	base_notes.push(newnote);

	let q = notebox.replace(/#/g, v);
	let node = document.createElement("li");
	node.innerHTML = q;
	node.id = "note_" + v;

	let noteContentContainer = document.createElement("div");
	noteContentContainer.className = "note_content_container";

	let textarea = document.createElement("textarea");
	textarea.className = "tool";
	textarea.id = "note_" + v + "_content";
	textarea.value = content;

	let typeLabel;
	let typeContent = null;
	let typeDropdown = null;
	if(type === "N/A") {
		typeContent = document.createElement("div");
		typeContent.className = "tool";

		typeLabel = document.createElement("label");
		typeLabel.className = "tool";
		typeLabel.id = "note_" + v + "_note_type";
		typeLabel.textContent = "Note Type: "

		typeDropdown = document.createElement("select");
		typeDropdown.className = "tool";
		typeDropdown.id = "note_" + v + "_note_type"; 
		typeDropdown.textContent = "Select Type";
		typeDropdown.value = "";
		typeDropdown.style.marginLeft = "2px";

		const placeholderOption = document.createElement("option");
		placeholderOption.value = "";
		placeholderOption.textContent = "Select Type";
		placeholderOption.selected = true;
		placeholderOption.disabled = true;
		typeDropdown.appendChild(placeholderOption);

		NOTE_TYPES.forEach((option) => {
			let optionElement = document.createElement("option");
			optionElement.value = option;
			optionElement.textContent = option;
			typeDropdown.appendChild(optionElement);
		})

		typeContent.appendChild(typeLabel);
		typeContent.appendChild(typeDropdown);
	} else {
		typeLabel = document.createElement("label");
		typeLabel.className = "tool note_type";
		typeLabel.id = "note_" + v + "_note_type";
		typeLabel.textContent = `Note Type: ${type}`;
	}

	let observerLabel;
	let observerContent = null;
	let observerTextArea = null;
	if(observer === "N/A") {
		observerContent = document.createElement("div");
		observerContent.className = "tool";
		observerContent.style.display = "flex";

		observerLabel = document.createElement("label");
		observerLabel.id = "note_" + v + "_note_observer";
		observerLabel.className = "tool";
		observerLabel.textContent = "Note Taker: "

		observerTextArea = document.createElement("input");
		observerTextArea.id = "note_" + v + "manual_note_observer";		
		observerTextArea.className = "tool";
		observerTextArea.style.marginLeft = "2px";
		observerTextArea.style.width = "90px";
		observerTextArea.type = "text";
		observerTextArea.placeholder = "Name"
		observerTextArea.value = "";

		observerContent.appendChild(observerLabel);
		observerContent.appendChild(observerTextArea);
	} else {
		observerLabel = document.createElement("label");
		observerLabel.className = "tool note_observer";
		observerLabel.id = "note_" + v + "_note_observer";
		observerLabel.textContent = `Note Taker: ${observer}`;
	}

	let timestampLabel;
	let timestampContent = null;
	let timestampTextArea = null;
	if(occuredTimestamp === "00:00:00:00") {
		timestampContent = document.createElement("div");
		timestampContent.className = "tool";
		timestampContent.style.display = "flex";

		timestampLabel = document.createElement("label");
		timestampLabel.textContent = "Timestamp: ";

		timestampTextArea = document.createElement("input");
		timestampTextArea.id = "timestampTextArea_" + v + "_content";
		timestampTextArea.className = "tool";
		timestampTextArea.style.marginLeft = "2px";
		timestampTextArea.style.width = "90px"; 
		timestampTextArea.placeholder = "hh:mm:ss:ms";
		timestampTextArea.type = "text";
		timestampTextArea.value = "00:00:00:00";

		let parts = timestampTextArea.value.split(":").map(Number);
		while(parts.length < 4) {
			parts.push(0);
		}
		let formattedInput = parts.slice(0, 4).map((num) => String(num).padStart(2, "0")).join(":");
		newnote.occuredTimestamp = formattedInput;
		newnote.timestampMs = convertToMilliseconds(formattedInput);

		timestampContent.appendChild(timestampLabel);
		timestampContent.appendChild(timestampTextArea);
	} else {
		timestampLabel = document.createElement("label");
		timestampLabel.className = "tool note_timestamp";
		timestampLabel.id = "note_" + v + "_note_timestamp";
		timestampLabel.textContent = `Timestamp: ${occuredTimestamp}`;
	}

	if(typeContent) {
		noteContentContainer.appendChild(typeContent);
	} else {
		noteContentContainer.appendChild(typeLabel);
	}

	if(observerContent) {
		noteContentContainer.append(observerContent);
	} else {
		noteContentContainer.append(observerLabel);
	}

	if(timestampContent) {
		noteContentContainer.appendChild(timestampContent);			
	} else {
		noteContentContainer.append(timestampLabel);
	}

	if(typeContent) {
		typeDropdown.addEventListener("change", function() {
			newnote.type = typeDropdown.value;
		});
	}

	if(observerTextArea) {
		observerTextArea.addEventListener("input", function() {
			newnote.observer = observerTextArea.value;
		});
	}

	let formattedInput;
	if(timestampTextArea) {
		timestampTextArea.addEventListener("input", function() {
			let inputVal = timestampTextArea.value;
			let parts = inputVal.split(":").map(Number);

			while(parts.length < 4) {
				parts.push(0);
			}

			formattedInput = parts.slice(0, 4).map((num) => String(num).padStart(2, "0")).join(":");
			newnote.occuredTimestamp = formattedInput;
			newnote.timestampMs = convertToMilliseconds(formattedInput);
			newnote.visibleOnTimeline = true;	
		});
		if (DATA_G && DATA_G.notes) { DATA_G.notes.events.push(newnote); }
	}

	textarea.addEventListener("input", function () {
		if (!base_notes[v].locked) {
			base_notes[v].content = this.value;
		} else {
			this.value = base_notes[v].content;
		}
	});

	noteContentContainer.appendChild(textarea);
	if(timestampTextArea && observerTextArea) {
		let saveButton = document.createElement("button");
		saveButton.textContent = "Save";
		noteContentContainer.appendChild(saveButton);
		saveButton.addEventListener("click", function() {
			update_observer_colors();
			timestampTextArea.value = formattedInput;
			addBookmarkButton(DATA_G, H2TOP_G, H2_G, CANVAS_G, TOI_BOOKMARK_G);
		});
	}
 	node.appendChild(noteContentContainer);

	// Click event for selection
	node.onclick = function (e) {
		var v = parseInt(this.id.split("_")[1]);
		var isEditableField = ["INPUT", "SELECT", "OPTION", "TEXTAREA"].includes(e.target.tagName);
		if (isEditableField) {
			if (selected_note !== v) {
				select_note(v);
			}
		} else {
			if (selected_note !== v) {
				select_note(v);
			} else {
				select_note(-1);
			}
		}
	};

	node.setAttribute("class", "note_item");
	document.getElementById("notelist").appendChild(node);

	if (!visibleOnCanvas) {
		let eyeButton = document.getElementById(`notes_${v}_v`);
		if (eyeButton) {
			eyeButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
			eyeButton.classList.remove("toggle-on");
			eyeButton.classList.add("toggle-off");
		}
	}

	let timeButton = document.getElementById(`notes_${v}_t`);
	if (!visibleOnTimeline && !isPreloaded) {
		if (timeButton) {
			timeButton.innerHTML = '<i class="fas fa-ban"></i>';
			timeButton.classList.remove("toggle-on");
			timeButton.classList.add("toggle-off");
			timeButton.disabled = true;

			let tipSpan = timeButton.parentElement.querySelector(".tip");
			if (tipSpan) {
				tipSpan.textContent = "Time-based notes are disabled";
			}
		}
	} else if (!visibleOnTimeline) {
		if (timeButton) {
			timeButton.innerHTML = '<i class="fas fa-times-circle"></i>';
			timeButton.classList.remove("toggle-on");
			timeButton.classList.add("toggle-off");
		}
	}

	make_note_dataset_selectors();
	setTimeout(update_observer_colors(), 0);

	if (!isPreloaded) {
		select_note(v);
	}

	if (isLocked) {
		lockNote(v);
	}
}


function make_note_dataset_selectors() {
	selectors = document.getElementsByClassName("note_dataset");
	for (var i = 0; i < selectors.length; i++) {
		selector = selectors[i];
		id = selector.id.split("_")[0] * 1;
		selector.innerHTML = "";
		content = "";
		for (var j = 0; j < DATASETS.length; j++) {
			if (
				DATASETS[j].initialised &&
				DATASETS[j].should_save &&
				DATASETS[j].included
			) {
				content +=
					"<option value='" +
					j +
					"'>" +
					DATASETS[j].name +
					"</option>";
			}
		}
		selector.innerHTML = content;
		selector.value = base_notes[id].pid;
	}
}

function draw_notes(canvas) {
	var list = document.getElementById("notelist").children;
	order_notes = [];
	for (var i = 0; i < list.length; i++) {
		var elem = list[i];
		var id = parseInt(elem.id.split("_")[1]);
		order_notes.push(id);
		var note = base_notes[id];
		note.selected = id == selected_note;

		if (!note.visibleOnCanvas) {
			continue;
		}

		var g = note.content.split(LINE_CHAR);
		canvas.fill(white(100));
		canvas.stroke(white(100));
		note.max_width = 0;
		for (var j = 0; j < g.length; j++) {
			note.max_width = Math.max(note.max_width, canvas.textWidth(g[j]));
			canvas.strokeWeight(0);
			if (VALUED.indexOf(note.pid) != -1) {
				canvas.text(
					g[j],
					(note.X - OFFSET_X) * pos_ratio + ground_x,
					(note.Y - OFFSET_Y) * pos_ratio +
						ground_y +
						j * canvas.textAscent()
				);
			}
		}
		if (note.selected && CONTROL_STATE == "notes") {
			canvas.fill(makeColor(0, SELECTED));
			canvas.stroke(makeColor(100, SELECTED));
			canvas.strokeWeight(1);
			canvas.rect(
				(note.X - OFFSET_X) * pos_ratio +
					ground_x -
					note.max_width / 2 -
					2,
				(note.Y - OFFSET_Y) * pos_ratio +
					ground_y -
					canvas.textAscent() -
					2,
				note.max_width + 4,
				g.length * canvas.textAscent() + 4
			);
		}
	}
}

function select_note(v) {
	selected_note = v;
	var list = document.getElementById("notelist").children;
	for (var i = 0; i < list.length; i++) {
		var id = parseInt(list[i].id.split("_")[1]);
		base_notes[id].selected = id == v;
		if (
			base_notes[id].selected !=
			list[i].classList.value.includes("selected")
		) {
			list[i].classList.toggle("selected");
		}
	}
	for (var i = 0; i < list.length; i++) {
		var id = parseInt(list[i].id.split("_")[1]);
		if (base_notes[id].content == "" && !base_notes[id].selected) {
			delete_note(id);
		}
	}
}

function find_note(canvas, X, Y) {
	var selnote = -1;
	if (selected_note != -1) {
		note = base_notes[selected_note];
		var g = note.content.split(LINE_CHAR);
	}
	if (
		selected_note != -1 &&
		(note.X - OFFSET_X) * pos_ratio + ground_x - note.max_width / 2 - 2 <=
			X * pos_ratio + ground_x &&
		(note.X - OFFSET_X) * pos_ratio +
			ground_x -
			note.max_width / 2 +
			note.max_width +
			2 >=
			X * pos_ratio + ground_x &&
		(note.Y - OFFSET_Y) * pos_ratio + ground_y - canvas.textAscent() - 2 <=
			Y * pos_ratio + ground_y &&
		(note.Y - OFFSET_Y) * pos_ratio +
			ground_y -
			canvas.textAscent() -
			2 +
			g.length * canvas.textAscent() +
			4 >=
			Y * pos_ratio + ground_y &&
		VALUED.indexOf(note.pid) != -1
	) {
		selnote = selected_note;
	} else {
		selnote = -1;
		for (var i = 0; i < order_notes.length; i++) {
			note = base_notes[order_notes[i]];
			var g = note.content.split(LINE_CHAR);
			if (
				(note.X - OFFSET_X) * pos_ratio +
					ground_x -
					note.max_width / 2 -
					2 <=
					X * pos_ratio + ground_x &&
				(note.X - OFFSET_X) * pos_ratio +
					ground_x -
					note.max_width / 2 +
					note.max_width +
					2 >=
					X * pos_ratio + ground_x &&
				(note.Y - OFFSET_Y) * pos_ratio +
					ground_y -
					canvas.textAscent() -
					2 <=
					Y * pos_ratio + ground_y &&
				(note.Y - OFFSET_Y) * pos_ratio +
					ground_y -
					canvas.textAscent() -
					2 +
					g.length * canvas.textAscent() +
					4 >=
					Y * pos_ratio + ground_y &&
				VALUED.indexOf(note.pid) != -1
			) {
				selnote = order_notes[i];
			}
		}
	}
	select_note(selnote);
}

function delete_note(id) {
	if (base_notes[id].content !== "") {
		var r = confirm("Are you sure you want to delete the note?");
		if (r) {
			var elem = document.getElementById("note_" + id);
			elem.parentNode.removeChild(elem);
			base_notes[id].included = false;
			if (id == selected_note) {
				selected_note = -1;
			}
		}
	} else {
		var elem = document.getElementById("note_" + id);
		elem.parentNode.removeChild(elem);
		base_notes[id].included = false;
		if (id == selected_note) {
			selected_note = -1;
		}
	}
	draw_time_all(TimeLine);
}

function key_note(key) {
	if (document.activeElement.className.match("tool")) {
		return;
	}
	if (selected_note == -1) {
		return;
	}
	note = base_notes[selected_note];
	if (key == "Delete") {
		note.content = "";
	} else if (key == "Backspace") {
		// doesn't work because apparently the backspace key doesn't register?
		note.content = note.content.substring(0, note.content.length - 1);
	} else if (key == "Enter") {
		// not the correct symbol for causing a line break
		note.content += LINE_CHAR;
	} else if (key.length == 1) {
		note.content += key;
	}
	if (order_notes.indexOf(selected_note) != -1) {
		document.getElementById("note_" + selected_note + "_content").value =
			note.content;
	}
}

let loadNotesFromTSV = () => {
	DATASETS.forEach((d, i) => {
		const sampleId = d.name;
		currentSampleNote = importedNotes[sampleId];		
		
		d.notes = {};
		if (d.initialised && d.should_save && d.included && currentSampleNote) {
			d.notes.startTime = currentSampleNote.startTime;

			currentSampleNote.events.forEach((n, j) => {
				new_note(
					200,
					200,
					n.eventDetails,
					d.name,
					n.type,
					n.timestamp,
					n.timestamp_ms,
					n.occured_timestamp,
					n.observer,
					false,
					true
				);
			});
		}
	});
	loadNotesIntoDatasets();
	draw_time_all(TimeLine);
	update_observer_colors();
};

function addSamplesToNotesFilter() {
	let noteSampleDropdown = document.getElementById("note_sample_dropdown");
	noteSampleDropdown.innerHTML = "";
	DATASETS.forEach((d, _) => {
		label = `<label><input type="checkbox" name="note_sample" value="${d.name}"> ${d.name}</label>`;
		noteSampleDropdown.innerHTML += label;
	});
	document
		.querySelectorAll('#note_type_dropdown input[name="note_type"]')
		.forEach((checkbox) => {
			checkbox.addEventListener("change", filterNotes);
		});
	document
		.querySelectorAll('#note_sample_dropdown input[name="note_sample"]')
		.forEach((checkbox) => {
			checkbox.addEventListener("change", filterNotes);
		});
}

function filterNotes() {
    let selectedTypes = Array.from(
        document.querySelectorAll(
            '#note_type_dropdown input[name="note_type"]:checked'
        )
    ).map((checkbox) => checkbox.value);
    let selectedSamples = Array.from(
        document.querySelectorAll(
            '#note_sample_dropdown input[name="note_sample"]:checked'
        )
    ).map((checkbox) => checkbox.value);

    if (preFilteredBaseNotes.length === 0) {
        preFilteredBaseNotes = JSON.parse(JSON.stringify(base_notes));
    }

    if (selectedTypes.length === 0 && selectedSamples.length === 0) {
		base_notes = JSON.parse(JSON.stringify(preFilteredBaseNotes));
        preFilteredBaseNotes = [];
    }else {
		base_notes = JSON.parse(JSON.stringify(preFilteredBaseNotes));
	}

    base_notes.forEach((note) => {
        const noteType = note.type.toLowerCase();
        const noteSample = DATASETS[note.pid]?.name;

        const typeMatch = (selectedTypes.length === 0) || selectedTypes.includes(noteType);
        const sampleMatch = (selectedSamples.length === 0) || selectedSamples.includes(noteSample);

        note.shownInList = typeMatch && sampleMatch;
        note.visibleOnCanvas = note.shownInList && note.visibleOnCanvas;
        note.visibleOnTimeline = note.shownInList && note.visibleOnTimeline;
    });

    const noteList = document.getElementById("notelist").children;
    for (let i = 0; i < noteList.length; i++) {
        const elem = noteList[i];
        const id = parseInt(elem.id.split("_")[1], 10);
        const note = base_notes[id];
        elem.style.display = note.shownInList ? "" : "none";
    }

    loadNotesIntoDatasets();
    draw_time_all(TimeLine);
    make_note_dataset_selectors();
}

function toggleNoteLock(id) {
	let note = base_notes[id];
	note.locked = !note.locked;

	let lockButton = document.getElementById(`notes_${id}_l`);
	if (note.locked) {
		lockButton.innerHTML = '<i class="fas fa-lock"></i>';
	} else {
		lockButton.innerHTML = '<i class="fas fa-lock-open"></i>';
	}

	let textarea = document.getElementById(`note_${id}_content`);
	textarea.readOnly = note.locked;
}

function lockNote(id) {
	let note = base_notes[id];
	if (note.locked) {
		let lockButton = document.getElementById(`notes_${id}_l`);
		lockButton.innerHTML = '<i class="fas fa-lock"></i>';
		let textarea = document.getElementById(`note_${id}_content`);
		textarea.readOnly = note.locked;
	}
}

function toggleSpatialVisibility(id) {
	let note = base_notes[id];
	let eyeButton = document.getElementById(`notes_${id}_v`);

	if (!note.visibleOnCanvas) {
		note.visibleOnCanvas = true;
		eyeButton.innerHTML = '<i class="fas fa-eye"></i>';
		eyeButton.classList.remove("toggle-off");
		eyeButton.classList.add("toggle-on");
	} else {
		note.visibleOnCanvas = false;
		eyeButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
		eyeButton.classList.remove("toggle-on");
		eyeButton.classList.add("toggle-off");
	}

	loadNotesIntoDatasets();
	draw_time_all(TimeLine);
	if (typeof draw_notes === "function" && typeof canvas !== "undefined") {
		draw_notes(canvas);
	}
}

function toggleTimeVisibility(id) {
	let note = base_notes[id];
	let timeButton = document.getElementById(`notes_${id}_t`);

	if (!note.visibleOnTimeline) {
		note.visibleOnTimeline = true;
		timeButton.innerHTML = '<i class="fas fa-clock"></i>';
		timeButton.classList.remove("toggle-off");
		timeButton.classList.add("toggle-on");
	} else {
		note.visibleOnTimeline = false;
		timeButton.innerHTML = '<i class="fas fa-times-circle"></i>';
		timeButton.classList.remove("toggle-on");
		timeButton.classList.add("toggle-off");
	}

	loadNotesIntoDatasets();
	draw_time_all(TimeLine);
	if (typeof draw_notes === "function" && typeof canvas !== "undefined") {
		draw_notes(canvas);
	}
}

function changeNotePid(id, value) {
	let note = base_notes[id];
	if (!note.locked) {
		note.pid = parseInt(value);
	} else {
		document.getElementById(`${id}_note_pid`).value = note.pid;
	}
}

function loadNotesIntoDatasets() {
	currentPid = -1;
	base_notes.forEach((note) => {
		if (note.pid !== currentPid) {
			currentPid = note.pid;
			DATASETS[currentPid].notes = { events: [] };
		}
		DATASETS[note.pid].notes.events.push(note);
	});
}

const updateNoteTypeDropdown = () => {
    const dropdown = document.getElementById("note_type_dropdown");
    dropdown.innerHTML = "";

    if (noteTypes.length === 0) {
        dropdown.innerHTML = "<label>No types available</label>";
    } else {
        noteTypes.forEach(type => {
            const capitalisedType = type.charAt(0).toUpperCase() + type.slice(1);
            const label = document.createElement("label");
            label.innerHTML = `<input type="checkbox" name="note_type" value="${type}"> ${capitalisedType}`;
            dropdown.appendChild(label);
        });
    }
    addSamplesToNotesFilter();
};
