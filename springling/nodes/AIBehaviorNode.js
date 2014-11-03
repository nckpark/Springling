define(["components/EntityState", "components/Behavior", "components/GridXYZ", "components/Motion", "ash/Node"], function(EntityState, Behavior, GridXYZ, Motion, ashNode) {
	function AIBehaviorNode() {
	  this.entityState = new EntityState();
	  this.behavior = new Behavior();
	  this.gridXYZ = new GridXYZ();
	  this.motion = new Motion();
	}
	AIBehaviorNode.prototype = new ashNode();
	return AIBehaviorNode;
});