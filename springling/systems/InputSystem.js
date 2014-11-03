//
// systems/InputSystem 
// Captures and tracks key presses that occur while the game canvas has focus (TODO), updating entity state and/or motion based on key mappings contained in 
// entities' StateControlNodes and MotionControlNodes respectively. 
//

define(["nodes/StateControlNode", "nodes/MotionControlNode", "ash/System"], function(StateControlNode, MotionControlNode, ashSystem) {
  
  function InputSystem(gameCanvas) {

    // Private Properties

    var _keysPressed = Object.create(null);
    var _lastKeyUp = null;

    var _stateControlNodes;
    var _motionControlNodes;
    
    // System Functions

    this.setup = function(game) {
      // Get references to node lists this system will operate on
      _motionControlNodes = game.getNodeList( MotionControlNode );
      _stateControlNodes = game.getNodeList( StateControlNode );

      // Set up keyboard handlers to track key presses when gameCanvas has focus
      gameCanvas.onkeydown = function(event) {
        _keysPressed[event.which] = true;
        event.preventDefault();
      };
      
      gameCanvas.onkeyup = function(event) {
        _keysPressed[event.which] = false;
        _lastKeyUp = event.which;
      };

      gameCanvas.onkeypress = function(event) { 
        event.preventDefault();
      };
    }

    this.update = function(time) {
      var node;

      // State Controls
      for( var i = 0; i < _stateControlNodes.length(); i++ ) {
        node = _stateControlNodes.at(i);
        if( node.controls.type == 'keyboard' ) {
          // Check status of keys mapped to control entity state in the controls stateMap
          var stateMap = node.controls.stateMap;
          for( var key in stateMap ) {
            if( _keysPressed[key] && 'keydown' in stateMap[key] ) {
              // Key is down, set entity state to mapped keydown state
              node.entityState.state = stateMap[key].keydown; 
            }
            else if( _lastKeyUp == key && 'keyup' in stateMap[key] ) {
              // Key was just released, set entity state to mapped keyup state
              node.entityState.state = stateMap[key].keyup;
            }
          }
        }
      }

      // Motion Controls
      for( var i = 0; i < _motionControlNodes.length(); i++ ) {
        node = _motionControlNodes.at(i);
        if( node.controls.type == 'keyboard' ) {
          // Check status of keys mapped to control motion in the controls controlMap
          var controlMap = node.controls.controlMap;
          for( var key in controlMap ) {
            var motionVector = null;
            if( _lastKeyUp == key && 'keyup' in  controlMap[key] ) {
              // Key was just released, set motion vector to mapped keyup value
              motionVector = controlMap[key].keyup;
            }
            if( _keysPressed[key] && 'keydown' in controlMap[key] ) {
              // Key is down, set motion vector to mapped keydown value
              motionVector = controlMap[key].keydown;
            }
            // If input should create motion, update node motion component with motionVecor
            if( motionVector !== null ) {
              node.motion.velocity.x = ('x' in motionVector) ? motionVector.x : 0;
              node.motion.velocity.y = ('y' in motionVector) ? motionVector.y : 0;
              node.motion.angularVelocity = ('angular' in motionVector) ? motionVector.angular : 0; 
            }
          }
        }
      }

      _lastKeyUp = null; // Clear key up
    }

    this.detach = function(game) {
      // Destroy node list referecnes
      _stateControlNodes = null;
      _motionControlNodes = null;
      // Remove keyboard handlers
      gameCanvas.onkeydown = null;
      gameCanvas.onkeyup = null;
      gameCanvas.onkeypress = null;
    }
  }

  InputSystem.prototype = new ashSystem();
  return InputSystem;
});