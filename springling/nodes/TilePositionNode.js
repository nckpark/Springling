define(["components/Tile", "components/GridXYZ", "components/Position", "components/Display", "ash/Node"], function(Tile, GridXYZ, Position, Display, ashNode) {
	function TilePositionNode() {
	  this.tile = new Tile();
	  this.gridXYZ = new GridXYZ();
	  this.position = new Position();
	  this.display = new Display();
	}
	TilePositionNode.prototype = new ashNode();
	return TilePositionNode;
});