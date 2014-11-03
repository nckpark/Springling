define(["components/GridMapping", "components/GridXYZ", "components/Position", "components/Display", "ash/Node"], function(GridMapping, GridXYZ, Position, Display, ashNode) {
	function GridPositionNode() {
	  this.gridMapping = new GridMapping();
	  this.gridXYZ = new GridXYZ();
	  this.position = new Position();
	  this.display = new Display();
	}
	GridPositionNode.prototype = new ashNode();
	return GridPositionNode;
});