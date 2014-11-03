define(["components/EntityState", "components/StateControls", "ash/Node"], function(EntityState, StateControls, ashNode) {
	function StateControlNode() {
	  this.entityState = new EntityState();
	  this.controls = new StateControls();
	}
	StateControlNode.prototype = new ashNode();
	return StateControlNode;
});