define(function() {
	function Display(displayObj, cameraRef, displayListIndex) {
	  this.displayObject = displayObj;
	  this.camera = cameraRef;
	  this.displayIndex = displayListIndex;
	}
	return Display;
});