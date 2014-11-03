//
// systems/MovementSystem
// Updates entity position over time based on their movement vector.
//

define(["nodes/MovementNode", "ash/System"], function(MovementNode, ashSystem) {
  
  function MovementSystem() {
   
    // Private Properties
   
    var _movementNodes;

    // System Functions
   
    this.setup = function(game) {
      // Get reference to MovementNode list
      _movementNodes = game.getNodeList( MovementNode );
    }

    this.update = function(time) {
      var node;
      // Update entity position based on motion vector
      time /= 1000.0; // Convert time from ms to seconds for motion calculations
      for( var i = 0; i < _movementNodes.length(); i++ ) {
        node = _movementNodes.at(i);
        node.position.x += node.motion.velocity.x * time;
        node.position.y += node.motion.velocity.y * time;
      }
    }

    this.detach = function(game) {
      _movementNodes = null;
    }
  }
  
  MovementSystem.prototype = new ashSystem();
  return MovementSystem;
});