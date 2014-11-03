define(["components/AnimationState", "components/Display", "ash/Node"], function(AnimationState, Display, ashNode) {
	function AnimationNode() {
	  this.animationState = new AnimationState();
	  this.display = new Display();
	}
	AnimationNode.prototype = new ashNode();
	return AnimationNode;
});