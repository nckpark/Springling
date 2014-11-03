//
// systems/CollisionSystem
// Prevents entities moving across the grid from moving onto unwalkable tiles
//

define(["nodes/GridCollisionNode", "components/GridXYZ", "components/Position", "components/Tile", "ash/System", "easel"], function(GridCollisionNode, GridXYZ, Position, Tile, ashSystem) {
  
  function CollisionSystem(coordHelper) {
  
    // Private Properties
  
    var _actors;

    // System Functions
  
    this.setup = function(game) {
      // Get reference to GridCollisionNode list - managing "actors" that move across and can collide with the tiles on the map grid
      _actors = game.getNodeList( GridCollisionNode );
    }

    this.update = function(time) {
      time /= 1000; // Convert time from ms to s for motion calculations
      // Check all actors for upcoming movement onto unwalkable tiles, stopping their motion in response
      for( var j = 0; j < _actors.length(); j++ ) {
        var actor = _actors.at(j);
        var motion = actor.motion;
        // Calculate actor's intended next screen position based on their motion vector
        var nextPos = new createjs.Point( actor.position.x + actor.collisionPoints.offset.x + (motion.velocity.x * time), 
                                          actor.position.y + actor.collisionPoints.offset.y + (motion.velocity.y * time) );
        // Convert screen coordinates to grid coordinates        
        var nextGrid = coordHelper.screenToGridCoords(nextPos, actor.gridXYZ, false);
        if( typeof nextGrid === "undefined" ) {
          // About to move onto position with no tile! Stop.
          motion.velocity.x = 0;
          motion.velocity.y = 0;
          continue;
        }
        // Check tile at actors next grid coordinates for walkability, and allowed elevation change
        var nextTileEntity = coordHelper.getTileEntityAt(nextGrid.x, nextGrid.y);
        var nextHeight = nextTileEntity.get(GridXYZ).z;
        var currHeight = actor.gridXYZ.z;
        if( nextTileEntity.get(Tile).walkable == false ) {
          motion.velocity.x = 0;
          motion.velocity.y = 0;
        }
        else if( Math.abs(nextHeight - currHeight) > 1 ) {
          motion.velocity.x = 0;
          motion.velocity.y = 0;
        }
      }
    }

    this.detach = function(game) {
      _actors = null;
    }
  }

  CollisionSystem.prototype = new ashSystem();
  return CollisionSystem;
});