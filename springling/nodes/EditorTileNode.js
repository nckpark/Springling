define(["components/EditorData", "components/Display", "components/Tile", "components/GridXYZ", "ash/Node"], function(EditorData, Display, Tile, GridXYZ, ashNode) {
	function EditorTileNode() {
	  this.editorData = new EditorData;
	  this.display = new Display();
	  this.tile = new Tile();
	  this.gridXYZ = new GridXYZ();
	}
	EditorTileNode.prototype = new ashNode();
	return EditorTileNode;
});