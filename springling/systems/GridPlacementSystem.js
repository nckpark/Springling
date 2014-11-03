//
// systems/GridPlacementSystem
// Maps grid coordinates to screen coordinates for static tiles in the map, and for objects placed or moving on the grid
//

define(["nodes/TilePositionNode", "nodes/GridPositionNode", "components/Display", "components/Position", "components/Tile", "components/Camera", "components/GridXYZ", "ash/System", "easel"], function(TilePositionNode, GridPositionNode, Display, Position, Tile, Camera, GridXYZ, ashSystem) {

  function GridPlacementSystem(coordHelper) {

    // Private Properties

    var _tiles;
    var _gridMappings;

    // System Functions

    this.setup = function(game) {
      // Get reference to TilePositionNode list, place all tiles with screen coords, and set up subscriber to handle placing new tiles
      _tiles = game.getNodeList( TilePositionNode );
      for( var i = 0; i < _tiles.length(); i++ ) {
        _placeTile( _tiles.at(i) );
      }
      _tiles.addSubscriber('nodeAdded', _placeTile);

      // Get reference to GridPositionNode list, intialize screen to grid coord mappings, and set up subscriber to handle future mappings
      _gridMappings = game.getNodeList( GridPositionNode );
      for( var i = 0; i < _gridMappings.length(); i++ ) {
        _initializeMapping( _gridMappings.at(i) );
      }
      _gridMappings.addSubscriber('nodeAdded', _initializeMapping);
    }

    this.update = function(time) {
      var transparentTileData = Object.create(null);
      // Map objects moving in world space back to grid space
      for( var i = 0; i < _gridMappings.length(); i++ ) {
        var node = _gridMappings.at(i);
        var stage = node.display.camera.get(Camera).stage;
        var oldXYZ = node.gridMapping.lastMapping;
        
        // Map node entity's screen coordinates to grid coordinates
        var screenCoords = new createjs.Point(node.position.x, node.position.y);
        if( typeof node.gridMapping.offset !== "undefined" && node.gridMapping.offset != null ) {
          screenCoords.x += node.gridMapping.offset.x;
          screenCoords.y += node.gridMapping.offset.y;
        }
        var gridCoords = coordHelper.screenToGridCoords(screenCoords, node.gridXYZ, false);
        // Update gridXYZ component to new coords, as long as a valid screen to grid mapping was found
        if( typeof gridCoords != "undefined" ) {
          node.gridXYZ.x = gridCoords.x;
          node.gridXYZ.y = gridCoords.y;
          node.gridXYZ.z = gridCoords.z;
        }
        
        // If mapped entity has moved to a new tile, update rendering data
        if( oldXYZ.x != node.gridXYZ.x || oldXYZ.y != node.gridXYZ.y || oldXYZ.z != node.gridXYZ.z ) {
          // If elevation has changed, modify rendering y pos to show step up / down
          if( oldXYZ.z != node.gridXYZ.z ) {
            node.position.y -= ((node.gridXYZ.z - oldXYZ.z) * coordHelper.tileDepth)
          }
          // Place dynamic objects in correct depth order for rendering
          stage.removeChild(node.display.displayObject); // Temporarily remove object we're placing to find the correct render list index
          var tileEntity = coordHelper.getTileEntityAt(node.gridXYZ.x, node.gridXYZ.y);
          var displayIndex = stage.getChildIndex(tileEntity.get(Display).displayObject); // Find tile display index
          if( displayIndex != -1 ) { // Place mapped entity immediately after tile in rendering order
            stage.addChildAt(node.display.displayObject, displayIndex + 1);
            node.display.displayIndex = displayIndex;
          }
          else { // Tile was not found in render list. Render mapped entity last.
            stage.addChild(node.display.displayObject);
          }
          // Update gridMapping last mapping for use in future update cycles
          node.gridMapping.lastMapping.x = node.gridXYZ.x;
          node.gridMapping.lastMapping.y = node.gridXYZ.y;
          node.gridMapping.lastMapping.z = node.gridXYZ.z;
        }

        // Find tiles obscuring mapped entity that need to be made transparent
        // (This could be done more efficiently, but the brute force method works for now)
        for( var x = node.gridXYZ.x; x <= node.gridXYZ.x + 1; x++ ) {
          for( var y = node.gridXYZ.y - 1; y <= node.gridXYZ.y; y++ ) {
            var tileEntity = coordHelper.getTileEntityAt(x, y);
            if( typeof tileEntity !== "undefined" && tileEntity.get(GridXYZ).z > node.gridXYZ.z + 1 ) {
              transparentTileData[x+","+y] = tileEntity.get(GridXYZ).z;
            }
          }
        }
      }

      // Set Tile Transparencies for obscuring tiles in transparentTileData
      for( var i = 0; i < _tiles.length(); i++ ) {
        node = _tiles.at(i);
        var coordString = node.gridXYZ.x + "," + node.gridXYZ.y;
        if( coordString in transparentTileData && node.gridXYZ.z != 0 ) {
          node.display.displayObject.alpha = 0.1 + ((0.4 / transparentTileData[coordString]) * node.gridXYZ.z);
        }
        else {
          node.display.displayObject.alpha = 1;
        } 
      }
    }

    this.detach = function(game) {
      _tiles.removeSubscriber('nodeAdded', _placeTile);
      _tiles = null;

      _gridMappings.removeSubscriber('nodeAdded', _initializeMapping);
      _gridMappings = null;
    }

    // Private functions

    // _placeTile(TilePositionNode)
    // Set tile screen coordinates based on its grid position
    var _placeTile = function(tileNode) {
      var placement = coordHelper.gridToScreenCoords(tileNode.gridXYZ);
      tileNode.position.x = placement.x;
      tileNode.position.y = placement.y;
    }

    // _initializeMapping(GridPositionNode)
    // Set intitial screen coordinates for a new entity based on its grid position 
    var _initializeMapping = function(node) {
      // Ensure this mapped object hasn't already been placed
      if( node.gridMapping.initalized == true ) {
        return;
      }
      
      // Determine screen coordinates
      var screenCoords = coordHelper.gridToScreenCoords(node.gridXYZ, node.gridMapping.offset);
      node.position.x = screenCoords.x;
      node.position.y = screenCoords.y;
      
      // Initialize last mapping 
      node.gridMapping.lastMapping.x = node.gridXYZ.x;
      node.gridMapping.lastMapping.y = node.gridXYZ.y;
      node.gridMapping.lastMapping.z = node.gridXYZ.z;
      
      // Set intial display index to render correctly when added to the stage
      var initialTile = coordHelper.getTileEntityAt(node.gridXYZ.x, node.gridXYZ.y);
      var stage = node.display.camera.get(Camera).stage; 
      node.display.displayIndex = stage.getChildIndex( initialTile.get(Display).displayObject ) + 1;

      // Mark mapping as intiailized
      node.gridMapping.initalized = true;
    }

  }

  GridPlacementSystem.prototype = new ashSystem();
  return GridPlacementSystem;
});