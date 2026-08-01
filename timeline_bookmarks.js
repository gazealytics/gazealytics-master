let bookmarks = [];
const observers = {};
let observerColourIndex = 0;
let DATA_G;
let H2TOP_G;
let H2_G;
let CANVAS_G;
let TOI_BOOKMARK_G;
let show_note_legend = false; let show_note_observer_legend = false;

function addBookmarkButton(data, h2top, h2, canvas, toi_bookmark) {
    let start_time = toi_bookmark.tmin;
    let end_time = toi_bookmark.tmax;
    let participantData = data.notes;
    let max_duration = end_time - start_time;
    let tolerancePercentage = max_duration * 0.05;
	DATA_G = data;
	H2TOP_G = h2top;
	H2_G = h2;
	CANVAS_G = canvas;
	TOI_BOOKMARK_G = toi_bookmark;
	
    removeBookmarkButton(data, toi_bookmark);
    const grouped_events = {};
    const grouped_within_tolerance = {};

    for (let i = 0; i < participantData.events.length; i++) {
        let event = participantData.events[i];
        if (event.visibleOnTimeline === false || event.included === false) {
            continue;
        }
        let observerName = event.observer;
        let selectedBookmark;
        event.eventId = i;
        selectedBookmark = event.eventId;

        if (!observers[observerName]) {
            observers[observerName] = OBSERVERS[observerColourIndex % OBSERVERS.length];
            observerColourIndex++;
        }

        if(!grouped_events[event.timestampMs]) {
            grouped_events[event.timestampMs] = [];
        }

        grouped_events[event.timestampMs].push(event);    
    }

    let sorted_timestamps = Object.keys(grouped_events).map(Number).sort((a, b) => a - b);
	if (sorted_timestamps.length === 0) {
        return;
    }

    let currentGroup = [];
    let currentStartTimestamp = sorted_timestamps[0];

    currentGroup.push(...grouped_events[currentStartTimestamp]);

    for (let i = 1; i < sorted_timestamps.length; i++) {
        let currentTimestamp = sorted_timestamps[i];
        let previousTimestamp = sorted_timestamps[i - 1];

        if((currentTimestamp - previousTimestamp) <= tolerancePercentage) {
            currentGroup.push(...grouped_events[currentTimestamp]);
        } else {
            grouped_within_tolerance[currentStartTimestamp] = currentGroup;
            currentStartTimestamp = currentTimestamp;
            currentGroup = [...grouped_events[currentTimestamp]];
        }
    }
    grouped_within_tolerance[currentStartTimestamp] = currentGroup;

    Object.entries(grouped_within_tolerance).forEach(([timestampMs, events]) => {
        let ts = (canvas.width * (timestampMs - start_time)) / max_duration;

        if (ts >= 0 && ts <= canvas.width) {
            let start_y = h2top;
            let end_y = h2top + h2;
            let center_y = start_y + (end_y - start_y) / 2;    

            events.forEach((event) => {
                let button = document.createElement("button");
                let line = document.createElement("div");
                let canvasRect = TIMELINE_CANVAS.elt.getBoundingClientRect();
                let diff = (TIMELINE_CANVAS.width - canvas.width) / 3;

				line.className = `timeline-line-${data.name}-toi-${toi_bookmark.twi_id}`;
				line.classList.add("timeline_bookmark_line");
				line.style.left = `${canvasRect.left + (diff * 2) + ts}px`;
				line.style.top = `${canvasRect.top + start_y}px`;
				line.style.height = `${end_y - start_y}px`;

				let start_x = ts;
				setTimeout(() => {
					canvas.line(start_x, start_y, start_x, end_y);
					canvas.stroke("black");
					canvas.strokeWeight(1);
				});

				button.className = `timeline-bookmark-${data.name}-toi-${toi_bookmark.twi_id}`;
				button.classList.add("timeline_bookmark_button");
				button.setAttribute("data-observer", event.observer);
				button.setAttribute("data-event-type", event.type);
				button.setAttribute("data-event-detail-id", event.eventId);

				button.style.left = `${canvasRect.left + (diff * 2) + ts - 7.5}px`;
				button.style.top = `${canvasRect.top + center_y - 7.5}px`;
				button.style.background = observers[event.observer];  
                
				let toggleButton;
				if(events.length > 1) {
					toggleButton = document.createElement('button');
					toggleButton.className = `timeline-toggle-${data.name}-toi-${toi_bookmark.twi_id}`;
					toggleButton.classList.add("timeline_bookmark_toggle");
					toggleButton.innerHTML = events.length;
					toggleButton.style.left = `${canvasRect.left + (diff * 2) + ts - 8.5}px`;
					toggleButton.style.top = `${canvasRect.top + center_y - 35}px`;
					document.body.appendChild(toggleButton);
		
					let noteIndex = 0;
					toggleButton.addEventListener("click", () => {
						noteIndex = (noteIndex + 1) % events.length;
						let currentNote = events[noteIndex];
						currentNote.eventId = participantData.events.findIndex(e => e.occuredTimestamp === currentNote.occuredTimestamp && e.content === currentNote.content);
						selectedBookmark = currentNote.eventId;    
						button.style.background = observers[currentNote.observer];
						tooltip.innerHTML = `Timestamp: ${currentNote.occuredTimestamp}<br>Type: ${currentNote.type}<br>Details: ${currentNote.content}<br>Observer: ${currentNote.observer}`;
					});
				}
                
                let tooltip = document.createElement("tooltip");
				tooltip.className = "tooltip";
				tooltip.innerHTML = `Timestamp: ${event.occuredTimestamp}<br>Type: ${event.type}<br>Details: ${event.content}<br>Observer: ${event.observer}`;
                
                button.addEventListener("mouseenter", () => {
                    tooltip.style.visibility = "visible";
                    tooltip.style.opacity = "1";
                    tooltip.style.left = `${parseFloat(button.style.left) + 20}px`;
                    tooltip.style.top = `${parseFloat(button.style.top) - 10}px`;
                    if(!button.classList.contains('selected_bookmark')) {
                        button.style.outline = "2px solid yellow";
                    }
                });
    
                button.addEventListener("mouseleave", () => {
                    tooltip.style.visibility = "hidden";
                    tooltip.style.opacity = "0";
                    if(!button.classList.contains('selected_bookmark')) {
                        button.style.outline = "none";
                    }
                });

                button.addEventListener("click", () => {
                    document.querySelectorAll("[class^='timeline-bookmark-']").forEach(bookmarkButton => {
                        bookmarkButton.classList.remove('selected_bookmark');
                        bookmarkButton.style.outline = "none";
                    });
                    button.classList.add("selected_bookmark");
                    button.style.outline = "2px dashed green"
                    select_note(selectedBookmark);
                });

                document.addEventListener("DOMContentLoaded", filter_observers_by_colour());
				bookmarks.push({
					timestamp: event.timestampMs,
					start_time,
					max_duration,
					button,
					line,
					toggleButton
				});
				
                document.body.appendChild(line);
                document.body.appendChild(button);
                document.body.appendChild(tooltip);
            });
        }
    });
}

function updateBookmarkButton(time_animate) {
	bookmarks.forEach(bookmark => {
		const { timestamp, start_time, max_duration, button, line, toggleButton } = bookmark; 
		let scaledTime = (timestamp - start_time) / max_duration;		
		
		if(button && line) {
			if(scaledTime >= time_animate) {
				button.style.visibility = "hidden";
				line.style.visibility = "hidden";
				if(toggleButton) {
					toggleButton.style.visibility = "hidden";
				}
			}
		}
	})
}

function removeBookmarkButton(data, toi_bookmark) {
	let datasetClass = `timeline-bookmark-${data.name}-toi-${toi_bookmark.twi_id}`;
	let lineClass = `timeline-line-${data.name}-toi-${toi_bookmark.twi_id}`;
	let toggleButtonClass = `timeline-toggle-${data.name}-toi-${toi_bookmark.twi_id}`;

	document.querySelectorAll(`.${lineClass}`).forEach((line) => line.remove());
	document.querySelectorAll(`.${datasetClass}`).forEach((btn) => btn.remove());
	document.querySelectorAll(`.${toggleButtonClass}`).forEach((btn) => btn.remove());
}

function removeAllBookmarkButtons() {
	DATASETS.forEach((data) => {
		data.tois.forEach((toi) => {
			removeBookmarkButton(data, toi);
		});
	});
}

function toggle_notes() {
	// get all the html elements starting with the following classnames
    let toggleButton = document.getElementById("observer_notes");
    let bookmarks = document.querySelectorAll("[class^='timeline-bookmark-']");
	let lines = document.querySelectorAll("[class^='timeline-line-']");
	let multiNotesButton = document.querySelectorAll("[class^='timeline-toggle-']");
    
	// to switch off the notes, lines and multiNotes functions in the timeline
    if (toggleButton.dataset.toggle === "on") {
        bookmarks.forEach((btn) => btn.style.display = "none");
		lines.forEach((line) => line.style.display = "none");
		multiNotesButton.forEach((btn) => btn.style.display = "none");
        toggleButton.dataset.toggle = "off";
        toggleButton.innerHTML = "<i class='fas fa-times-circle'></i>";
		toggleButton.classList.remove("toggle-on");
		toggleButton.classList.add("toggle-off");
    } else {
        bookmarks.forEach((btn) => btn.style.display = "block");
		lines.forEach((line) => line.style.display = "block");
		multiNotesButton.forEach((btn) => btn.style.display = "block");
        toggleButton.dataset.toggle = "on";
        toggleButton.innerHTML = "<i class='fas fa-clock'></i>";
		toggleButton.classList.remove("toggle-off");
		toggleButton.classList.add("toggle-on");
    }
}

// to match all the observers to the observer legend
function colour_match_observer(observers) {
    let container = document.getElementById('legend_container');
    container.innerHTML = "";

	let title = document.createElement('h3');
	title.textContent = "Observer Legend";
	title.classList.add("timeline_legend_title");
	container.appendChild(title);

	let legendRow = document.createElement('ul');
	legendRow.classList.add("timeline_legend_row");
	Object.entries(observers).forEach(([observerName, color]) => {
		let observerDiv = document.createElement('div');
		observerDiv.classList.add("timeline_legend_item");

		let colorIndicator = document.createElement('div');
		colorIndicator.classList.add("timeline_legend_color");
		colorIndicator.style.background = color; 
		let observerText = document.createElement('span');
        observerText.textContent = observerName;

        observerDiv.appendChild(colorIndicator);
        observerDiv.appendChild(observerText);
        legendRow.appendChild(observerDiv);
    });

    container.appendChild(legendRow);
}

// function to filter bookmark colours
function filter_observers_by_colour() {
	let sameCheckbox = document.querySelector('input[value="same"]');
	let differentCheckbox = document.querySelector('input[value="different"]');
	let typeCheckbox = document.querySelector('input[value="note_type_colour"]');

	sameCheckbox.addEventListener('change', () => {
		if (sameCheckbox.checked) {
			differentCheckbox.checked = false;
			typeCheckbox.checked = false;
			show_note_legend = false;
			show_note_observer_legend = false;
			change_all_bookmarks_to_grey();
		}
	})

	differentCheckbox.addEventListener('change', () => {
		if (differentCheckbox.checked) {
			sameCheckbox.checked = false;
			typeCheckbox.checked = false;
			show_note_legend = false;
			show_note_observer_legend = true;
			change_all_bookmarks_to_original();
		}
	});

	typeCheckbox.addEventListener('change', () => {
		if (typeCheckbox.checked) {
			sameCheckbox.checked = false;
			differentCheckbox.checked = false;
			show_note_legend = true;
			show_note_observer_legend = false;
			filter_by_note_type_observer();
		}
	});
}

// function to change the bookmarks to default grey
function change_all_bookmarks_to_grey() {
	let bookmarks = document.querySelectorAll("[class^='timeline-bookmark-']");
	bookmarks.forEach(bookmark => {
		bookmark.style.background = "#696b6a";
		bookmark.style.border = "1px solid black";
	});
	add_note_legend();
	updateDefaultNoteColors();
}

// function to change the bookmark colours to filter by observer 
function change_all_bookmarks_to_original() {
	let bookmarks = document.querySelectorAll("[class^='timeline-bookmark-']");
	bookmarks.forEach(bookmark => {
		let currentObserver = bookmark.getAttribute("data-observer");
		let originalColour = observers[currentObserver];
		if (originalColour) {
			bookmark.style.background = originalColour;
			bookmark.style.border = originalColour;
		}
	});
	add_note_legend();
	update_observer_colors();
}

let event_colour_map = {};

// function to change the bookmark colours to filter by note type
function filter_by_note_type_observer() {
	for(let i=0; i<noteTypes.length; i++) {
		event_colour_map[noteTypes[i]] = OBSERVERS[i];	
	}
	
	let bookmarks = document.querySelectorAll("[class^='timeline-bookmark-']");
	bookmarks.forEach(bookmark => {
		let observer = bookmark.getAttribute("data-event-type");
		let typeColour = event_colour_map[observer];
		if (typeColour) {
			bookmark.style.background = typeColour;
			bookmark.style.border = typeColour;
			add_note_legend();
		}
	})
	updateTypeColors();
}

// function to add a legend to when colour is filtered by note type
function add_note_legend() {
	let container = document.getElementById('note_legend');
	container.innerHTML = "";

	let legendSource = null;
	if(show_note_legend === true) {
		legendSource = event_colour_map;
	} else if(show_note_observer_legend === true) {
		legendSource = observers;
	}
	if(legendSource == null) return;

	let legendRow = document.createElement("ul");
	legendRow.classList.add("timeline_legend_row");

	Object.entries(legendSource).forEach(([label, colour]) => {
		let observerDiv = document.createElement('div');
		observerDiv.classList.add("timeline_legend_item");

		let colorIndicator = document.createElement('div');
		colorIndicator.classList.add("timeline_legend_color");
		colorIndicator.style.background = colour; 
		let observerText = document.createElement('span');
		observerText.textContent = label;

		observerDiv.appendChild(colorIndicator);
		observerDiv.appendChild(observerText);
		legendRow.appendChild(observerDiv);
	});
	container.appendChild(legendRow);
}