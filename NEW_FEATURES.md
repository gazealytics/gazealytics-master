# Gazealytics: New Features (Development Branch)

This repository is a fork of the upstream [gazealytics/gazealytics-master](https://github.com/gazealytics/gazealytics-master) release, extended as part of a field-study research project. The original Gazealytics was designed primarily for controlled lab studies with static stimuli. This fork adds support for the messier reality of field studies: sessions recorded across multiple screens and apps, observational notes taken by human researchers during the session, and video of a dynamic environment where what the participant is looking at changes over time.

## Summary of changes

### New features

**Enhanced Notes system**

In field studies, one or more researchers typically sit alongside participants and write down observations as the session unfolds. These notes are not just reminders; they are a core data source that needs to be analyzed alongside the gaze data. The enhanced notes system turns notes from free-text scratchpad entries into structured records, each tagged with a type (general / technical / alarm / other), the name of the observer who wrote it, a timestamp showing when in the session it occurred, and which participant it refers to. This makes it possible to systematically filter and compare observations across participants and sessions, not just read through them one by one.

---

**Notes import from TSV**

Researchers rarely take notes directly in Gazealytics during a live session. They use dedicated observation tools, spreadsheets, or purpose-built field study software. The TSV import lets you bring those existing notes straight in, with timestamps automatically calculated from the session start time, so you do not have to re-enter anything by hand.

---

**Timeline bookmarks**

Once notes have timestamps, you want to see them in context with the gaze data rather than reading a separate list. Timeline bookmarks place each note as a clickable marker on the timeline at the exact moment it was recorded. This lets you jump straight to interesting moments identified by the observer, and see what the participant's eyes were doing at that point. When multiple events happen close together, they are clustered into a single marker so the timeline does not get cluttered.

---

**Note filtering and color coding**

When you have multiple observers and many types of events across multiple participants, you need to be able to cut the notes down to just what you are looking for. You can filter by note type (e.g., show only alarms), by participant, or by observer. Color coding lets you see at a glance which observer made each note, or which category of event it was, directly on the timeline without having to hover over every marker.

---

**Observer color palette**

Each researcher who contributed notes gets their own color. The palette is customizable via color pickers in the Colouring tab so teams can use colors that match their own conventions or that are accessible for color-blind team members.

---

**AOI groups**

In studies involving complex interfaces or multi-screen setups, individual AOIs often belong to logical categories: all the navigation elements, all the content areas, the toolbar versus the main workspace. Grouping lets you analyze gaze at the category level rather than just at the level of individual drawn regions. AOIs in the same group share a color and are highlighted together, and the matrix view gains new axes for comparing gaze across groups rather than across individual AOIs.

---

**Temporal AOIs**

In a dynamic session, the interface changes over time. A button that only appears during one phase of the task, or a panel that slides in partway through the recording, should not be counted as an AOI for the entire session; doing so would contaminate your metrics with time when that region did not even exist on screen. Temporal AOIs solve this by letting you define time ranges during which each AOI is active. Outside those ranges the AOI is invisible and excluded from metric calculations, so your numbers reflect only the periods when it was actually meaningful.

---

**AOI hierarchy (Screen / App / Interface)**

In multi-screen or multi-app studies, you often want to ask questions at different levels of granularity: not just which button did the participant look at, but which application were they focused on, or which screen? The hierarchy system lets you tag each AOI with a Screen ID, App ID, and Interface ID. A separate popup then visualises all your AOIs as a collapsible tree, so you can get an overview of the whole structure and filter or color-code by level.

---

**AOI duplication**

If the same interface element appears in multiple screens or states (the same close button appearing on three different dialogs, for example), you can draw it once and then duplicate it rather than redrawing from scratch. The duplicate carries over the group, hierarchy tags, and temporal ranges, so you only need to adjust what actually differs.

---

**AOI label visibility toggles**

When you have a large number of AOIs on a dense interface, the name labels can obscure the gaze data underneath. Two toggle buttons let you hide individual AOI name labels and group labels independently, so you can switch between a labeled view for reference and a clean view for actually reading the fixation patterns.

---

**AOI coloring modes**

Coloring AOIs by group rather than by individual AOI makes it immediately obvious which regions belong together, which is especially useful when you have many AOIs spread across a complex layout. Both modes have their own editable color palettes in the Colouring tab.

---

**TWI groups and extended matrix states**

In studies with multiple conditions or phases, individual time windows of interest (TWIs) often belong to a higher-level category: all baseline trials, all task trials, all recovery periods. TWI groups let you aggregate across these categories in the matrix view, so you can compare how gaze differed between conditions rather than having to compare individual time windows one by one.

---

**Video coordinate tracking (`VidRectLens`)**

In field studies, the thing the participant is looking at is often moving. A person they are watching, a vehicle in a traffic study, a moving cursor or interface element. Gaze coordinates are fixed to the stimulus image, but if the region of interest is moving through the frame, you need a way to show where it was at each point in time. The `VidRectLens` is a bounding-box overlay that moves through the spatial canvas frame by frame, driven by a TSV of coordinates you supply. This lets you visually relate the participant's fixations to the moving target throughout the session.

---

**Video trimming and export**

When you want to share a clip of a particular session segment with a collaborator, or include it in a presentation or paper, you do not want to have to open a separate video editor. The trim and export feature clips the loaded video to the currently selected TWI and downloads it as an MP4, entirely in the browser.

---

**Timeline screenshot export**

The timeline panel, once annotated with bookmarks, is a useful artifact in itself for reporting and discussion. The screenshot export captures the full panel including the bookmark overlays as a JPEG, ready to drop into a report or slide deck. Currently accessible from the browser console as `exportCombinedCanvas()`; a button in the UI is planned.

---

**Video and animation synchronisation improvements**

Previously, scrubbing the time slider and playing the video could get out of sync, making it hard to connect what you were seeing in the gaze animation with what was happening in the video. The slider and video now track each other bidirectionally. Dragging the slider seeks the video, and during playback the slider follows the video head. Temporal AOI visibility also updates in real time as you play, so you always see the correct set of active AOIs for the current moment.

### Bugs fixed

| Bug | Fix |
|-----|-----|
| AOI group color persisting after group number was changed | Group color is now cleared and recomputed whenever the group field is edited |
| Color ordering mismatch between the AOI list and the Colouring tab | Color index is now derived consistently from AOI list position |
| Video errors when switching between TWIs | Video state is reset correctly on TWI change |
| Timeline visibility not updating when a TWI eye-icon was toggled | Bookmark visibility is now fully driven by TWI show/hide state |
| AOIs remaining visible after they should have been hidden by the temporal filter | `handleAOITimeChange()` is called on every animation frame and after every filter change |
| Hierarchy popup filter not working correctly | Filter now correctly scopes the tree to the selected screen |
| Fixations appearing outside their valid time range on the timeline | Fixation rendering is gated on the current TWI time window |
| Lens (AOI) draw order being overwritten on reload | Lens list order is now preserved when restoring a saved project |

---

## Detailed feature documentation

## 1. Enhanced Notes System

In a field study, observational notes are often as important as the gaze data itself. They capture context that the eye tracker cannot: what the participant said, what happened in the environment, whether something went wrong technically, or whether a particular moment seemed significant to the observer. The original notes system stored these as unstructured text with no way to filter, compare, or connect them to specific moments in the session. The redesigned notes system treats each note as a proper data record.

### New note fields
| Field | Description |
|-------|-------------|
| **Type** | Category of the note: `general`, `technical`, `alarms`, or `others`. Imported from TSV; manually selectable for hand-entered notes. |
| **Note Taker / Observer** | Name of the person who recorded the note. Imported from TSV; manually entered for hand-created notes. |
| **Timestamp** | When the event occurred, in `hh:mm:ss:ms` format. Relative to the session start time. |
| **Participant** | Which participant/dataset the note belongs to. |

### Per-note controls
Each note in the list now has:
- **Lock / Unlock**: freeze the note so it cannot be accidentally edited once you are happy with it
- **Spatial visibility toggle**: show or hide the note marker on the spatial canvas
- **Timeline visibility toggle**: show or hide the note's bookmark on the timeline canvas
- **Delete** button

### Manual note creation
Notes can still be created manually from the spatial canvas during or after a session. When created manually, the type, observer, and timestamp fields are presented as editable inputs rather than read-only labels.

---

## 2. Notes Import from TSV

Field researchers typically use dedicated software to record observations during a session. This feature lets you import those notes directly rather than copying them in by hand.

A **Load .tsv** button appears in the Notes tab (enabled once samples have been loaded). Clicking it opens a file picker and imports notes from a tab-separated values file.

The expected TSV column layout is:

| Col | Field |
|-----|-------|
| 0 | Session start date |
| 1 | Session start time |
| 4 | Observer (note taker) |
| 6 | Event occurred date |
| 7 | Event occurred time |
| 9 | Event details / content |
| 10 | Event type |
| 11 | Participant ID |

The importer:
- Calculates each note's timestamp as the elapsed time from session start to the event occurrence, so notes align correctly with the gaze timeline
- Groups notes by participant and matches them to loaded datasets
- Collects all distinct note types for use in the filter dropdown

Sample data is available at the link in the original README under "Time-based notes".

---

## 3. Timeline Bookmark Buttons

A list of notes is useful for reading through, but it does not help you understand when in the session events happened or how they relate to what the participant's eyes were doing at the time. Timeline bookmarks solve this by placing each note directly on the timeline at the correct moment.

Notes that have a valid timestamp and are set to be visible on the timeline are rendered as **bookmark buttons** directly overlaid on the timeline canvas.

- Each bookmark is positioned at the correct time offset within the selected TWI
- Notes occurring within 5% of the TWI duration of each other are **grouped** into a single button with a count badge, to avoid overlapping markers on a busy timeline
- The button color reflects the observer who recorded the note (see Section 5)
- A vertical black line is drawn on the canvas at the same x position
- Toggling a TWI's visibility (eye icon on the TWI row) removes its bookmarks from the timeline

---

## 4. Note Filtering and Color Coding

When a study involves multiple participants, multiple observers, and different categories of event, the full set of notes quickly becomes too dense to read usefully all at once. Filtering and color coding let you focus on exactly the subset you care about.

The Notes panel in the control sidebar now has three filter/color controls:

### Filter by Type
A dropdown is populated dynamically from the types found in the imported TSV. Selecting a type hides notes of other types on the timeline, so you can look at just alarm events, or just technical issues, without the other notes getting in the way.

### Filter by Sample
A dropdown lets you restrict visible bookmarks to a single participant, which is useful when comparing sessions or reviewing one participant's data in detail.

### Colour mode
Three coloring options are available via a radio group:

| Option | Effect |
|--------|--------|
| **Default** | All note markers shown in neutral gray |
| **Note Taker** | Each observer gets a distinct color, making it easy to see which team member noticed what |
| **Note Type** | Each type gets a distinct color, making the distribution of event categories visible at a glance |

The color indicator appears as a colored stripe on the left side of each note list item, mirroring the timeline markers.

---

## 5. Observer Color Palette

Each researcher who contributes notes to a session gets their own color. These colors appear on timeline bookmark buttons and on the note list entries when Note Taker color mode is active.

Eight observer color slots (`obsv_0` through `obsv_7`) are shown in the **Colouring** tab. Their default values are a ColorBrewer qualitative palette:

```
#8dd3c7  #ffffb3  #bebada  #fb8072
#80b1d3  #fdb462  #b3de69  #fccde5
```

Each slot has a color picker so you can reassign colors to match your team's preferences or to ensure accessibility.

---

## 6. Video Coordinate Tracking (`VidRectLens`)

In field studies the thing a participant is looking at is often not fixed in place. A person, a vehicle, a moving cursor, or a scrolling interface all shift position across the video frame over time. Standard AOIs are static, so they cannot represent a target that moves. `VidRectLens` is a bounding-box overlay that moves through the spatial canvas frame by frame, letting you visualize where a moving region of interest was at each point in the session and how the participant's fixations related to it.

### Loading video coordinates
A **Load Video Coords** button is added to the video panel. It accepts a `.tsv` file with the following columns:

```
timestamp	x1	y1	x2	y2
```

Each row defines the bounding box for one video frame (or time step). `x1/y1` is the top-left corner and `x2/y2` is the bottom-right corner, in stimulus-space coordinates.

### Behavior
- As the time animation slider advances (or plays), the lens rectangle moves to the coordinates for the current time position
- The lens is rendered on the spatial canvas with a semi-transparent white fill
- When selected and unlocked, resize handles are drawn at the edges
- The lens can be toggled visible/invisible

---

## 7. Video Trimming and Export

When you want to share a specific segment of a session with a collaborator, or include it in a presentation or paper, you should not need to open a separate video editor. This feature clips the loaded video to the time range of the currently selected TWI and downloads it as an MP4, without any server involvement.

- The output is clipped to the TWI's start and end times
- Processing runs entirely in the browser using [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)
- The output filename is taken from the dataset name

---

## 8. Timeline Screenshot Export (html2canvas)

The annotated timeline, showing gaze data alongside observer bookmarks, is a useful artifact for reports, papers, and team discussions. Standard browser screenshots do not always capture the HTML bookmark overlays that sit on top of the canvas element. This export function handles that by compositing the full panel into a single JPEG.

`exportCombinedCanvas()` captures the timeline panel including all HTML bookmark button overlays and downloads the result as a JPEG.

> Note: this feature is currently accessible from the browser console as `exportCombinedCanvas()`. A UI button is planned.

---

## 9. Helper Utilities (`helpers.js`)

A new `helpers.js` module provides shared date/time utilities used internally by the notes importer and the timestamp display. These handle the conversion between the date/time strings produced by common eye tracking export tools and the millisecond values used internally.

| Function | Description |
|----------|-------------|
| `calculateTimeDifference(dateStr1, dateStr2)` | Returns elapsed time between two date strings as `hh:mm:ss:ms` |
| `calculateTimeDifferenceInMs(dateStr1, dateStr2)` | Returns elapsed time in milliseconds |
| `convertToMilliseconds(timestamp)` | Converts `hh:mm:ss:ms` string to milliseconds |

Input date strings are expected in `dd/mm/yyyy hh:mm:ss` format (as produced by common eye tracking export tools).

---

## 10. TWI Visibility Toggle

When reviewing a long session with many time windows of interest, it is useful to be able to show and hide the bookmarks for individual TWIs without deleting them. Each TWI row in the data panel now includes an **eye icon** button. Clicking it:
- Toggles the show/hide state of all bookmark buttons associated with that TWI
- Resets the matrix sort order to "No sort"
- Refreshes matrix and timeline views

---

## 11. AOI Groups (Lens Groups)

In any study involving a complex interface or layout, individual AOIs often belong to logical categories. A navigation bar might contain five separate buttons, each drawn as its own AOI, but for many analyses you care about the navigation bar as a whole. AOI groups let you aggregate at this higher level.

Each AOI on the spatial canvas belongs to a numbered **group** (set via a numeric input in the AOI list entry). AOIs in the same group share a color and are highlighted together when any one of them is selected. The matrix view gains new axes that treat groups as units, so you can compare fixation counts or dwell time across categories of region rather than across individual AOIs.

### Group-level metrics
`metrics.js` computes a parallel set of statistics for lens groups alongside the per-AOI metrics:

| Metric | Description |
|--------|-------------|
| `lensegroup_lenscount` | Fixation count per group |
| `lensegroup_lenstime` | Total dwell time per group |
| `lensegroup_direct_transitions` | Direct transition counts between groups |
| `lensegroup_indirect_transitions` | Indirect transition counts between groups |
| `lensegroup_triples` | Transition triple counts |
| `lensegroup_visit_durations` | Visit duration distributions per group |

### Matrix view states for groups
The matrix can be switched into any view that has `lensegroup` as a row or column axis:

| State | Rows | Columns |
|-------|------|---------|
| `lensegroup_lensegroup` | AOI Groups | AOI Groups |
| `dat_lensegroup` | Datasets | AOI Groups |
| `toi_lensegroup` | TWIs | AOI Groups |
| `twigroup_lensegroup` | TWI Groups | AOI Groups |
| `grp_lensegroup` | Participant Groups | AOI Groups |

Hovering on a group row/column in the matrix highlights the corresponding AOIs on the spatial canvas.

---

## 12. Temporal AOIs

In a dynamic study, the interface or environment changes over time. An AOI that only applies during a specific phase of the task should not accumulate fixation data from the entire session. Temporal AOIs let you define exactly when each region is active, so metrics are only computed for the periods when the AOI was actually present and relevant.

### Making an AOI temporal
Click the **clock** button on the AOI list entry. A green clock icon indicates the AOI is currently temporal.

### Time rows
When temporal mode is on, time-range rows appear below the AOI entry:
- Each row has a **start time** and **end time** input (format `H:MM:SS.ms`)
- Additional ranges can be added with **Add Time Row** to handle regions that appear, disappear, and reappear
- Multiple non-overlapping ranges are supported on a single AOI

### Runtime behavior
As you scrub or play the session, each temporal AOI automatically shows or hides itself based on whether the current time falls within one of its defined ranges. The spatial canvas redraws automatically.

### Filtering
A **Filter AOIs** dropdown lets you restrict the AOI list (and spatial canvas) to:

| Option | Effect |
|--------|--------|
| Show all AOIs | Default; all AOIs visible |
| Show only temporal AOIs | Useful when reviewing your temporal range definitions |
| Show only non-temporal AOIs | Useful when you want a clean view of the static layout |

---

## 13. AOI Label Visibility Toggles

With many AOIs on a dense interface, name labels can overlap and obscure the fixation data underneath. Two toolbar buttons give you independent control:

| Button | Effect |
|--------|--------|
| **All Labels** | Show or hide individual AOI name labels drawn inside each lens |
| **Group Labels** | Show or hide the group number label drawn at the centroid of each AOI |

Both are on by default. Turning off labels is particularly useful when you want to focus on the gaze patterns rather than the AOI definitions.

---

## 14. AOI Hierarchy (Screen / App / Interface)

Studies that involve participants moving between multiple screens, applications, or interface states need a way to understand gaze at a higher level than individual AOIs. Which app was the participant focused on? Which screen? The hierarchy system provides this by letting you tag each AOI with a position in a three-level structure: Screen -> App -> Interface.

Each AOI carries three optional hierarchy fields:

| Field | Description |
|-------|-------------|
| **Screen ID** | Which physical screen or display the AOI belongs to |
| **App ID** | Which application within that screen |
| **Interface ID** | Which view or panel within that app |

### Hierarchy popup (`hierarchy.html`)
A **Show Hierarchy** button opens a popup that visualises all AOIs as a collapsible tree, letting you see the full structure of your session at a glance. You can filter the tree by screen and color-code nodes by level (screen, app, or interface) to understand the distribution of AOIs across the study context.

---

## 15. AOI Duplication

When the same interface element appears in multiple places or multiple states, such as the same button layout appearing on three different screens, you can draw the AOI once and duplicate it rather than redrawing from scratch. The duplicate carries over the group, hierarchy tags, and temporal ranges, so you only need to adjust position or the details that actually differ.

---

## 16. AOI Colouring Modes

The **Colouring** tab now offers two AOI coloring sub-modes:

| Mode | Effect |
|------|--------|
| **By AOI** | Each AOI gets a unique color based on its position in the list |
| **By Group** | All AOIs in the same group share one color |

Coloring by group is particularly useful when you have many AOIs organized into a small number of logical categories and you want the layout to make those categories visually obvious at a glance.

---

## 17. TWI Groups and Extended Matrix View States

Individual time windows of interest in a study often belong to higher-level conditions or phases. For example, a study might have ten TWIs representing baseline periods and ten representing task periods. TWI groups let you aggregate across these categories so that the matrix view can compare conditions rather than individual time windows.

TWIs can be assigned to named groups. This unlocks additional matrix axes for comparing across those groups:

| TWI group axis value | Description |
|----------------------|-------------|
| `twigroup_aoi` | TWI Groups x AOIs |
| `twigroup_dat` | TWI Groups x Datasets |
| `twigroup_toi` | TWI Groups x TWIs |
| `twigroup_lensegroup` | TWI Groups x AOI Groups |
| `twigroup_grp` | TWI Groups x Participant Groups |

When a TWI group is selected, metric aggregation is scoped to only the TWIs belonging to that group.

---

## 18. Video and Animation Synchronization

To make sense of gaze data you need to be able to see the gaze and the video at the same time, in sync. If the slider and the video drift apart, you end up looking at fixations from one moment overlaid on the video frame from a different moment, which makes interpretation unreliable. This fix ensures the two always track each other.

The slider and video are now synced bidirectionally:
- Dragging the slider while video linking is on seeks the video to the matching position
- During playback, the slider follows the video head rather than advancing on its own clock
- The video automatically pauses when it reaches the end of the selected TWI
- Temporal AOI visibility updates on every frame during playback, so you always see the correct set of active AOIs

---

## New Files

| File | Purpose |
|------|---------|
| `helpers.js` | Shared date/time utility functions |
| `ffmpeg.min.js` | FFmpeg WebAssembly build for in-browser video trimming |
| `html2canvas.min.js` | html2canvas library for timeline screenshot export |
| `hierarchy.html` | AOI hierarchy popup (tree view of Screen -> App -> Interface -> AOI) |

---

## Dependencies Added

| Library | Source | Use |
|---------|--------|-----|
| Font Awesome 6 | CDN | Icons throughout the notes panel UI and AOI controls |
| FFmpeg.wasm | Bundled (`ffmpeg.min.js`) | In-browser video trimming |
| html2canvas | Bundled (`html2canvas.min.js`) | Timeline screenshot export |
