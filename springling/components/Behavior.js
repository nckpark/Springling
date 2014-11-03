define(function() {
	function Behavior(type, settings) {
	  this.type = type;
	  this.settings = settings;
	  this.movementTargets = new Array();
	  this.lastCenterDistance = 0;
	}
	return Behavior;
});