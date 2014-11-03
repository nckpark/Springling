define(function() {
function AnimationState(state, stateMap) {
	  this.state = state;
	  this.lastState;
	  this.stateMap = stateMap;
	}
	return AnimationState;
});