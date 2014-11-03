define(["components/Camera", "components/Position", "components/Motion", "ash/Node"], function(Camera, Position, Motion, ashNode) {
	function CameraMovementNode() {
	  this.camera = new Camera();
	  this.position = new Position();
	  this.motion = new Motion();
	}
	CameraMovementNode.prototype = new ashNode();
	return CameraMovementNode;
});