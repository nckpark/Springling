define(["components/Position", "components/GridXYZ", "components/GridMapping", "components/CameraLock", "components/Motion", "ash/Node"], function(Position, GridXYZ, GridMapping, CameraLock, Motion, ashNode) {
	function CameraLockNode() {
	  this.position = new Position();
	  this.gridXYZ = new GridXYZ();
	  this.gridMapping = new GridMapping();
	  this.cameraLock = new CameraLock();
	  this.motion = new Motion();
	}
	CameraLockNode.prototype = new ashNode();
	return CameraLockNode;
});