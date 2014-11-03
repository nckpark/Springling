define(["components/EntityState", "components/AnimationState", "ash/Node"], function(EntityState, AnimationState, ashNode) {
	function EntityAnimationNode() {
	  this.entityState = new EntityState();
	  this.animationState = new AnimationState();
	}
	EntityAnimationNode.prototype = new ashNode();
	return EntityAnimationNode;
});