define(["components/GridXYZ", "components/Position", "components/Motion", "components/CollisionPoints", "components/Display", "ash/Node"], function(GridXYZ, Position, Motion, CollisionPoints, Display, ashNode) {
	function GridCollisionNode() {
	  this.gridXYZ = new GridXYZ();
	  this.position = new Position();
	  this.motion = new Motion();
	  this.collisionPoints = new CollisionPoints();
	  this.display = new Display();
	}
	GridCollisionNode.prototype = new ashNode();
	return GridCollisionNode;
});