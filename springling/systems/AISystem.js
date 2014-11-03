//
// systems/AISystem
// Manages AI actor movement based on set 'behaviors'. 
//

define(["nodes/AIBehaviorNode", "TileData", "components/Tile", "components/GridXYZ", "ash/System"], function(AIBehaviorNode, TileData, Tile, GridXYZ, ashSystem) {
  
  function AISystem(mapHelper) {
    
    // Private Properties
    
    var _behaviorNodes;

    // System Functions
    
    this.setup = function(game) {
      // Get reference to AI behviors node list
      _behaviorNodes = game.getNodeList( AIBehaviorNode );
    }

    this.update = function(time) {
      var actor;
      var behavior;
      // Update motion or movement targets for all actors depending on behavior and current state
      for( var i = 0; i < _behaviorNodes.length(); i++ ) {
        actor = _behaviorNodes.at(i);
        behavior = actor.behavior;
        // If the AIBehavior is currently trying to reach movement targets, update actor motion appropriately
        if( behavior.movementTargets.length != 0 ) {
          var nextTargetTile = behavior.movementTargets[0];
          // Check if actor has reached its next target tile
          if( mapHelper.gridDistanceBetween(actor.entity, nextTargetTile) == 0 ) {
            // Actor is on the target tile. Check if all motion inside that tile is complete.
            if( false == _actorCentered(actor, nextTargetTile) ) {
              continue; // Actor has not reached the tile center yet. Motion should continue as set. Move on to the next actor.
            }
            // Otherwise, actor has reached the center of the target tile, and has completed motion for this movementTarget.
            // Advance to next target tile if one exists.
            behavior.movementTargets.shift();
            nextTargetTile = behavior.movementTargets[0];
            if( nextTargetTile === undefined ) {
              // Actor just reached the final movementTarget, stop motion and move to next actor.
              actor.entityState.state = 'standingForward';
              actor.motion.velocity.x = 0;
              actor.motion.velocity.y = 0;
              continue;
            }
            // Actor has new target. Configure motion to advance towards target.
            // Calculate direction scalars for next target
            var targetGridXYZ = nextTargetTile.get(GridXYZ);
            var xDiff = targetGridXYZ.x - actor.gridXYZ.x;
            var yDiff = targetGridXYZ.y - actor.gridXYZ.y;
            // Based on direction scalar, set movement state and vector
            if( xDiff == 0 && yDiff < 0 ) {
              actor.entityState.state = 'walkingForward';
              actor.motion.velocity.x = -1 * behavior.settings.speed.x;
              actor.motion.velocity.y = behavior.settings.speed.y;
            }
            else if( xDiff == 0 && yDiff > 0 ) {
              actor.entityState.state = 'walkingBack';
              actor.motion.velocity.x = behavior.settings.speed.x;
              actor.motion.velocity.y = -1 * behavior.settings.speed.y;
            }
            else if( xDiff < 0 && yDiff == 0 ) {
              actor.entityState.state = 'walkingLeft';
              actor.motion.velocity.x = -1 * behavior.settings.speed.x;
              actor.motion.velocity.y = -1 * behavior.settings.speed.y; 
            }
            else if( xDiff > 0 && yDiff == 0 ) {
              actor.entityState.state = 'walkingRight';
              actor.motion.velocity.x = behavior.settings.speed.x;
              actor.motion.velocity.y = behavior.settings.speed.y;
            }
          } 
        }
        else { // AIBehavior has no movement targets at the moment. Determine next action based on behavior type.
          switch( behavior.type ) {
            case 'wander': // only one behavior in this demo ...
              // Wander behavior: with frequent probability (1 / 30 ticks) pick a new target within set radius of an origin, or 'home tile'
              if( Math.floor( Math.random() * 30) == 1 ) {
                var radiusRandomizer = (behavior.settings.radius * 2) + 1;
                var newTargetX = behavior.settings.origin.x + (Math.floor(Math.random() * radiusRandomizer) - behavior.settings.radius);
                var newTargetY = behavior.settings.origin.y + (Math.floor(Math.random() * radiusRandomizer) - behavior.settings.radius);
                var targetTileEntity = mapHelper.getTileEntityAt(newTargetX, newTargetY);
                // Confirm new target is a valid, walkable tile. If not, skip target selection this update cycle. Better luck next time.
                if( typeof targetTileEntity === "undefined" || targetTileEntity.get(Tile).walkable == false ) {
                  break;
                }
                // Good target picked. Update movement targets with A* path to final target.
                var startTileEntity = mapHelper.getTileEntityAt(actor.gridXYZ.x, actor.gridXYZ.y);
                behavior.movementTargets = mapHelper.findPath(startTileEntity, targetTileEntity);
              }
              break;
          }
        }
      }
    }

    this.detach = function(game) {
      _behaviorNodes = null;
    }

    // Private Functions

    // _actorCentered(AIBehaviorNode, Tile)
    // Returns true/false depending on whether the actor has crossed the tiles center point since the last update.
    var _actorCentered = function(actor, tile) {
      var distance = mapHelper.entityDistanceFromTileCenter(actor.entity, tile);
      if( distance >= actor.behavior.lastCenterDistance ) {
        actor.behavior.lastCenterDistance = TileData.tileHeight + TileData.tileWidth;
        return true;
      }
      actor.behavior.lastCenterDistance = distance;
      return false;
    }
  }

  AISystem.prototype = new ashSystem();
  return AISystem;
});