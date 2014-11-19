# Springling

A 2.5D isometric game engine demo built with [AshJS](https://github.com/nckpark/ashjs). See it in action [here](http://nckpark.com/projects/ashjs/). Some notable features include dynamic tile transparency to prevent character occlusion, a map editor, and basic AI behaviors and pathfinding. 

AshJS is a Javascript port of the Ash entity system framework for game development, and follows the component / entity / system model of development. Components are data only objects combined into game entities (the conceptual pieces of the game world) and operated on by systems. For more information on entity systems, read Ash author Richard Lord's post [What is an entity system framework for game development?](http://www.richardlord.net/blog/what-is-an-entity-framework) In exploring this code base, I would suggest starting with springling.js, and then diving into the springling/systems directory and springling/EntityCreator.js. Systems are provided components on which to operate through Nodes - collections of components that when present together in an entity should be processed by at least one system.

[EaselJS](http://www.createjs.com/#!/EaselJS) is used for rendering to the HTML5 canvas, and JQuery is used for some DOM manipulation when loading the map editor. 
