App = function() {
	// Main canvas context
	function main() {		
        new p5(spatialsketch, 'pj1');
        new p5(timelinesketch, 'pj2');
		new p5(matrixsketch, 'pj3');
		
    }
    return { main: main };
	
} ();
