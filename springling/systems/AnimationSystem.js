//
// systems/AnimationSystem
// Tracks changes in entity states that map to animations, and plays animations as necessary
//

define(["nodes/EntityAnimationNode", "nodes/AnimationNode", "ash/System"], function(EntityAnimationNode, AnimationNode, ashSystem) {

  function AnimationSystem() {

    // Private Properties

    var _entityStateLinks;
    var _animations;

    // System Functions

    this.setup = function(game) {
      // Get node list references
      _entityStateLinks = game.getNodeList( EntityAnimationNode );
      _animations = game.getNodeList( AnimationNode );
    }

    this.update = function(time) {
      var node;
      
      // Update animation states to match changed animation states
      for( var i = 0; i < _entityStateLinks.length(); i++ ) {
        node = _entityStateLinks.at(i);
        if( node.entityState.state != node.animationState.state ) {
          node.animationState.state = node.entityState.state;
        }
      }

      // Play animations based on animation state
      for( var i = 0; i < _animations.length(); i++ ) {
        node = _animations.at(i);
        if( node.animationState.state != node.animationState.lastState ) {
          // Animation state has changed, need to update playing animation.
          var state = node.animationState.state;
          node.animationState.lastState = state;
          if( state in node.animationState.stateMap ) {
            node.display.displayObject.gotoAndPlay( node.animationState.stateMap[state] );
          }
        }
      }
    }

    this.detach = function(game) {
      _animations = null;
    }
  }

  AnimationSystem.prototype = new ashSystem();
  return AnimationSystem;
});