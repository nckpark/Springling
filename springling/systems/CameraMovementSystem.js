//
// systems/CameraMovementSystem
// Updates camera stage rendering frames based on camera motion or camera locks (cameras taht follow the motion of another entity).
// Camera locks overrule other camera positioning and movement.
//

define(["nodes/CameraMovementNode", "nodes/CameraLockNode", "components/Camera", "components/Position", "ash/System", "easel"], function(CameraMovementNode, CameraLockNode, Camera, Position, ashSystem) {

  function CameraMovementSystem(coordHelper) {
    
    // Private Properties
    
    var _movementNodes;
    var _lockNodes;
    var _cameraLocks;

    // System Functions
    
    this.setup = function(game) {
      // Initialize object to map camera id's to locked entity id's
      _cameraLocks = Object.create(null); 
      // Get reference to CameraMovementNode list
      _movementNodes = game.getNodeList( CameraMovementNode );
      // Get reference to CameraLockNode list, and intialize camera positions to locks to entities
      _lockNodes = game.getNodeList( CameraLockNode );
      for( var i = 0; i < _lockNodes.length(); i++ ) {
        _lockTo( _lockNodes.at(i) );
      }
      _lockNodes.addSubscriber('nodeAdded', _lockTo); // Handle camera locks added after system setup
    }

    this.update = function(time) {
      var node;
      // Update moved camera's rendering stage frame to reflect camera position
      for( var i = 0; i < _movementNodes.length(); i++ ) {
        node = _movementNodes.at(i);
        var stage = node.camera.stage;
        stage.x = -1 * node.position.x;
        stage.y = -1 * node.position.y;
      }
      // Update camera positions and rendering stage frames for cameras locked to follow entities in motion
      time /= 1000.0; // Convert time from ms to seconds for motion calculations
      for( var i = 0; i < _lockNodes.length(); i++ ) {
        node = _lockNodes.at(i);
        // Make sure the camera has been locked to the entity referenced in this node
        var cameraEntity = node.cameraLock.camera;
        if( _cameraLocks[cameraEntity.id] != node.entity.id ) {
          continue; // Camera has been locked by this system to another entity. Each camera can only lock to one entity. Move on.
        }
        // Get camera position
        var camPosition = cameraEntity.get(Position);
        if( typeof camPosition === "undefined" ) {
          continue; // Camera lock is only relevant if the camera has a position.
        }
        // Update camera position to follow lock target's motion
        var targetMotion = node.motion;
        camPosition.x += targetMotion.velocity.x * time;
        camPosition.y += targetMotion.velocity.y * time;
        // Update stage rendering origin to reflect camera movement
        var stage = cameraEntity.get(Camera).stage;
        stage.x = -1 * camPosition.x;
        stage.y = -1 * camPosition.y;
      }
    }

    this.detach = function(game) {
      _lockNodes.removeSubscriber('nodeAdded', _lockTo);
      _lockNodes = null;
      _movementNodes = null;
    }

    // Private Functions

    // _lockTo(CameraLockNode)
    // Sets camera position to center on entity referenced by the lock node, and updates the private cameraLocks data
    var _lockTo = function(lockTarget) {
      var cameraEntity = lockTarget.cameraLock.camera;
      // Confirm this camera is not already locked to an entity. If it is, returns + fails silently. No way to switch camera locks at the moment. (Needs improvement)
      if( cameraEntity.id in _cameraLocks ) {
        return;
      }
      // Calculate screen coordinates of target's grid position, offset with canvas dimensions, to determine screen coords that will center camera on target
      var canvas = cameraEntity.get(Camera).stage.canvas;
      var centerOffset = new createjs.Point((canvas.width / 2) + lockTarget.gridMapping.offset.x, (canvas.height / 2) + lockTarget.gridMapping.offset.y);
      var centeredTargetScreenCoords = coordHelper.gridToScreenCoords(lockTarget.gridXYZ, centerOffset);
      // Set camera position to centered target coords
      var camPosition = cameraEntity.get( Position );
      camPosition.x = centeredTargetScreenCoords.x;
      camPosition.y = centeredTargetScreenCoords.y;
      // Update _cameraLocks data 
      _cameraLocks[cameraEntity.id] = lockTarget.entity.id;
    }
  }

  CameraMovementSystem.prototype = new ashSystem();
  return CameraMovementSystem;
});