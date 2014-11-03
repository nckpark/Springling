//
// systems/RenderSystem
// Render all entities with display objects
//

define(["nodes/RenderNode", "components/Camera", "ash/System", "easel"], function(RenderNode, Camera, ashSystem) {
  
  function RenderSystem() {
  
    // Private Properties
    var _renderNodes;
    var _stages = new Array();

    // System Functions

    this.setup = function(game) {
      // Get reference to RenderNode list, add all display objects to stages, and set up subscriptions to handle creation / removal of new display objects
      _renderNodes = game.getNodeList( RenderNode );
      for( var i = 0; i < _renderNodes.length(); i++ ) {
        _addToDisplay( _renderNodes.at(i) );
      }
      _renderNodes.addSubscriber('nodeAdded', _addToDisplay);
      _renderNodes.addSubscriber('nodeRemoved', _removeFromDisplay);
    }

    this.update = function(time) {
      var node;
      // Update display object positions
      for( var i = 0; i < _renderNodes.length(); i++ ) {
        node = _renderNodes.at(i);
        var displayObject = node.display.displayObject;
        var position = node.position;
        displayObject.x = position.x;
        displayObject.y = position.y;
      }
      // Render all objects on active stages
      for( var i = 0; i < _stages.length; i++ ) {
        _stages[i].update();
      }
    }

    this.detach = function(game) {
      _renderNodes.removeSubscriber('nodeAdded', _addToDisplay);
      _renderNodes.removeSubscriber('nodeRemoved', _removeFromDisplay);
      _renderNodes = null;
    }

    // Private Functions

    // _addToDisplay(RenderNode)
    // Adds new display object to the correct stage
    var _addToDisplay = function(renderNode) {
      var stage = renderNode.display.camera.get(Camera).stage;
      // Add at specific display index if specified, otherwise add to end of display list
      if( typeof renderNode.display.displayIndex !== "undefined" ) {
        stage.addChildAt(renderNode.display.displayObject, renderNode.display.displayIndex);
      }
      else {
        stage.addChild(renderNode.display.displayObject);
      }
      
      // If this stage is not already in the update list, add it
      if( _stages.indexOf(stage) == -1 ) {
        _stages.push(stage);
      }
    }

    // _removeFromDisplay(RenderNode)
    // Remove display object from its stage
    var _removeFromDisplay = function(renderNode) {
      // Remove display object from stage
      var stage = renderNode.display.camera.get(Camera).stage;
      stage.removeChild(renderNode.display.displayObject );
      // If stage has no child display objects to render, remove it from the update list
      if( stage.getNumChildren() == 0 ) {
        var idx = _stages.indexOf(stage);
        _stages.splice(idx, 1);
      }
    }
  }    

  RenderSystem.prototype = new ashSystem();
  return RenderSystem;
});