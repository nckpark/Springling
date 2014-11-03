define(function() {
	function Camera(stage, active) {
	  this.stage = stage;
	  this.isRendering = active;
	  this.draggable = true;
	}
	return Camera;
});