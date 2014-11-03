define(["components/Motion", "components/Position", "components/MotionControls", "ash/Node"], function(Motion, Position, MotionControls, ashNode) {
	function MotionControlNode() {
	  this.motion = new Motion();
	  this.position = new Position();
	  this.controls = new MotionControls();
	}
	MotionControlNode.prototype = new ashNode();
	return MotionControlNode;
});