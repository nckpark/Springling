define(function() {
	function Tile(type, category, walkable) {
	  this.type = type;
	  this.category = category;
	  this.walkable = walkable;
	  this.pattern = null;
	  this.contains = Object.create(null);
	}
	return Tile;
});