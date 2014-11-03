define(function() {
	function GridMapping(startingPos, offsetPoint, type) { 
	  this.lastMapping = startingPos;
	  this.offset = offsetPoint;
	  this.entityType = type;
	  this.initialized = false;
	}
	return GridMapping;
});