/*
    RPG Paper Maker Copyright (C) 2017 Marie Laporte

    This file is part of RPG Paper Maker.

    RPG Paper Maker is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    RPG Paper Maker is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
*   Enum for the different map elements kind.
*   @enum {number}
*   @readonly
*/
var ElementMapKind = {
    None: 0,
    Floors: 1,
    Autotiles: 2,
    Water: 3,
    SpritesFace: 4,
    SpritesFix: 5,
    SpritesDouble: 6,
    SpritesQuadra: 7,
    SpritesWall: 8,
    Object: 9
};
Object.freeze(ElementMapKind);

// -------------------------------------------------------
//
//  [CLASS MapPortion]
//
// -------------------------------------------------------

/** @class
*   A portion of the map.
*   @property {THREE.Vector3} positionOrigin The position of the origin of the
*   portion.
*   @property {THREE.Mesh} staticFloorsMesh The mesh used for drawing all the
*   floors.
*   @property {THREE.Mesh[]} staticSpritesList List of all the static sprites in
*   the scene.
*   @property {MapObject[]} objectsList List of all the objects in the portion.
*   @property {THREE.Mesh[]} faceSpritesList List of all the face sprites in the
*   scene.
*   @param {number} realX The real x portion.
*   @param {number} realY The real y portion.
*   @param {number} realZ The real z portion.
*/
function MapPortion(realX, realY, realZ){
    var i, l;

    this.realX = realX;
    this.realY = realY;
    this.realZ = realZ;
    this.staticFloorsMesh = null;
    this.staticSpritesMesh = null;
    l = $PORTION_SIZE * $PORTION_SIZE;
    this.boundingBoxesLands = new Array($PORTION_SIZE * $PORTION_SIZE);
    this.boundingBoxesSprites = new Array($PORTION_SIZE * $PORTION_SIZE);
    for (i = 0; i < l; i++) {
        this.boundingBoxesLands[i] = new Array;
        this.boundingBoxesSprites[i] = new Array;
    }
    this.staticAutotilesMesh = new Array;
    this.objectsList = new Array;
    this.faceSpritesList = new Array;
    this.staticWallsList = new Array;
}

// -------------------------------------------------------

MapPortion.checkCollisionRay = function(positionBefore, positionAfter, object) {
    var portion, mapPortion;
    var direction = new THREE.Vector3();
    direction.subVectors(positionAfter, positionBefore).normalize();
    var jpositionBefore = RPM.getPosition(positionBefore);
    var jpositionAfter = RPM.getPosition(positionAfter);
    var i, j, k;
    var startI, endI, startJ, endJ, startK, endK;
    var positionAfterPlus = new THREE.Vector3();
    var testedCollisions = new Array;

    // Squares to inspect according to the direction of the object
    if (direction.x > 0) {
        startI = 0;
        endI = object.boundingBoxSettings.w;
    }
    else if (direction.x < 0) {
        startI = -object.boundingBoxSettings.w;
        endI = 0;
    }
    else {
        startI = -object.boundingBoxSettings.w;
        endI = object.boundingBoxSettings.w;
    }
    if (object.boundingBoxSettings.k) {
        startK = 0;
        endK = 0;
    }
    else if (direction.z > 0) {
        startK = 0;
        endK = object.boundingBoxSettings.w;
    }
    else if (direction.z < 0) {
        startK = -object.boundingBoxSettings.w;
        endK = 0;
    }
    else {
        startK = -object.boundingBoxSettings.w;
        endK = object.boundingBoxSettings.w;
    }
    startJ = 0;
    endJ = 0;

    // Check collision outside
    for (i = startI; i <= endI; i++) {
        for (j = startJ; j <= endJ; j++) {
            for (k = startK; k <= endK; k++) {
                positionAfterPlus.set(positionAfter.x + i * $SQUARE_SIZE,
                                      positionAfter.y + j * $SQUARE_SIZE,
                                      positionAfter.z + k * $SQUARE_SIZE);
                portion = $currentMap.getLocalPortion(RPM.getPortion(
                                                          positionAfterPlus));
                mapPortion = $currentMap.getMapPortionByPortion(portion);
                if (mapPortion !== null &&
                    mapPortion.checkCollision(jpositionBefore,
                                              [
                                                  jpositionAfter[0] + i,
                                                  jpositionAfter[1] + j,
                                                  jpositionAfter[2] + k
                                              ],
                                              positionBefore,
                                              positionAfter, object,
                                              direction, testedCollisions))
                {
                    return true;
                }
            }
        }
    }

    // Check collision inside & with other objects
    portion = $currentMap.getLocalPortion(RPM.getPortion(positionAfter));
    mapPortion = $currentMap.getMapPortionByPortion(portion);


    return mapPortion === null ? true :
           mapPortion.checkLandsCollisionInside(jpositionBefore, jpositionAfter,
                                                direction) ||
           mapPortion.checkObjectsCollision(object, positionAfter);
}

// -------------------------------------------------------

MapPortion.applyBoxLandTransforms = function(box, boundingBox) {

    // Cancel previous geometry transforms
    box.geometry.translate(-box.previousTranslate[0],
                           -box.previousTranslate[1],
                           -box.previousTranslate[2]);
    box.geometry.rotateY(-box.previousRotate * Math.PI / 180.0);
    box.geometry.scale(1 / box.previousScale[0],
                       1 / box.previousScale[1],
                       1 / box.previousScale[2]);

    // Update to the new ones
    box.geometry.scale(boundingBox[3], 1, boundingBox[4]);
    box.geometry.translate(boundingBox[0], boundingBox[1], boundingBox[2]);

    // Register previous transforms to current
    box.previousTranslate = [boundingBox[0], boundingBox[1], boundingBox[2]];
    box.previousRotate = 0;
    box.previousScale = [boundingBox[3], 1, boundingBox[4]];

    // Update geometry now
    box.updateMatrixWorld();
}

// -------------------------------------------------------

MapPortion.applyBoxSpriteTransforms = function(box, boundingBox) {

    // Cancel previous geometry transforms
    box.geometry.translate(-box.previousTranslate[0],
                           -box.previousTranslate[1],
                           -box.previousTranslate[2]);
    box.geometry.rotateY(-box.previousRotate * Math.PI / 180.0);
    box.geometry.scale(1 / box.previousScale[0],
                       1 / box.previousScale[1],
                       1 / box.previousScale[2]);

    // Update to the new ones
    box.geometry.scale(boundingBox[3], boundingBox[4], 1);
    box.geometry.rotateY(boundingBox[5] * Math.PI / 180.0);
    box.geometry.translate(boundingBox[0], boundingBox[1], boundingBox[2]);

    // Register previous transforms to current
    box.previousTranslate = [boundingBox[0], boundingBox[1], boundingBox[2]];
    box.previousRotate = boundingBox[5];
    box.previousScale = [boundingBox[3], boundingBox[4], 1];

    // Update geometry now
    box.updateMatrixWorld();
}

// -------------------------------------------------------

MapPortion.applyOrientedBoxTransforms = function(box, boundingBox) {
    var size = Math.floor(boundingBox[3] / Math.sqrt(2));

    // Cancel previous geometry transforms
    box.geometry.translate(-box.previousTranslate[0],
                           -box.previousTranslate[1],
                           -box.previousTranslate[2]);

    box.geometry.rotateY(-Math.PI / 4);
    box.geometry.scale(1 / box.previousScale[0],
                       1 / box.previousScale[1],
                       1 / box.previousScale[2]);

    // Update to the new ones
    box.geometry.scale(size, boundingBox[4], size);
    box.geometry.rotateY(Math.PI / 4);
    box.geometry.translate(boundingBox[0], boundingBox[1], boundingBox[2]);

    // Register previous transforms to current
    box.previousTranslate = [boundingBox[0], boundingBox[1], boundingBox[2]];
    box.previousScale = [size, boundingBox[4], size];

    // Update geometry now
    box.updateMatrixWorld();
}

// -------------------------------------------------------

MapPortion.createBox = function() {
    var box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
                             $INVISIBLE_MATERIAL);
    box.previousTranslate = [0, 0, 0];
    box.previousRotate = 0;
    box.previousScale = [1, 1, 1];

    return box;
}

// -------------------------------------------------------

MapPortion.createOrientedBox = function() {
    var box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
                             $INVISIBLE_MATERIAL);
    box.previousTranslate = [0, 0, 0];
    box.previousScale = [1, 1, 1];
    box.geometry.rotateY(Math.PI / 4);

    return box;
}

// -------------------------------------------------------

MapPortion.prototype = {

    /** Read the JSON associated to the map portion.
    *   @param {Object} json Json object describing the object.
    *   @param {boolean} isMapHero Indicates if this map is where the hero is
    *   at the beginning of the game.
    */
    read: function(json, isMapHero){
        this.readLands(json.lands);
        this.readSprites(json.sprites);
        this.readObjects(json.objs.list, isMapHero);
        this.overflow = json.overflow;
    },

    // -------------------------------------------------------

    /** Read the JSON associated to the lands in the portion.
    *   @param {Object} json Json object describing the object.
    */
    readLands: function(json){
        this.readFloors(json.floors);
        this.readAutotiles(json.autotiles);
    },

    // -------------------------------------------------------

    /** Read the JSON associated to the floors in the portion.
    *   @param {Object} json Json object describing the object.
    */
    readFloors: function(json){
        var jsonFloor, floor, collision, objCollision, position, boundingBox;
        var tilesetCollisions = $currentMap.mapInfos.tileset.picture.collisions;
        var material = $currentMap.textureTileset;
        var width = material.map.image.width;
        var height = material.map.image.height;
        var geometry = new THREE.Geometry();
        geometry.faceVertexUvs[0] = [];

        for (var i = 0, length = json.length; i < length; i++){
            jsonFloor = json[i];
            position = jsonFloor.k;
            floor = new Floor();
            floor.read(jsonFloor.v);
            objCollision = floor.updateGeometry(geometry, position, width,
                                               height, i);
            if (objCollision !== null) {
                this.boundingBoxesLands[RPM.positionJSONToIndex(position)]
                .push(objCollision);
            }
        }

        geometry.uvsNeedUpdate = true;

        // Creating the plane
        this.staticFloorsMesh = new THREE.Mesh(geometry, material);
        $currentMap.scene.add(this.staticFloorsMesh);
    },

    // -------------------------------------------------------

    /** Read the JSON associated to the autotiles in the portion.
    *   @param {Object} json Json object describing the object.
    */
    readAutotiles: function(json){
        if (!json)
            return;

        var jsonAutotile;
        var autotile, autotiles, textureAutotile, texture = null, objCollision;
        var i, l, index, autotilesLength = $currentMap.texturesAutotiles.length;
        var position;

        // Create autotiles according to the textures
        for (i = 0; i < autotilesLength; i++) {
            this.staticAutotilesMesh.push(
                 new Autotiles($currentMap.texturesAutotiles[i]));
        }

        // Read and update geometry
        for (i = 0, l = json.length; i < l; i++) {
            jsonAutotile = json[i];
            position = jsonAutotile.k;
            autotile = new Autotile;
            autotile.read(jsonAutotile.v);

            index = 0;
            for (; index < autotilesLength; index++) {

                textureAutotile = $currentMap.texturesAutotiles[index];
                if (textureAutotile.isInTexture(autotile.autotileID,
                                                autotile.texture))
                {
                    texture = textureAutotile;
                    autotiles = this.staticAutotilesMesh[index];
                    break;
                }
            }

            if (texture !== null && texture.texture !== null) {
                objCollision = autotiles.updateGeometry(position, autotile);
                if (objCollision !== null) {
                    this.boundingBoxesLands[RPM.positionJSONToIndex(position)]
                    .push(objCollision);
                }
            }
        }

        // Update all the geometry uvs and put it in the scene
        for (i = 0, l = this.staticAutotilesMesh.length; i < l; i++) {
            autotiles = this.staticAutotilesMesh[i];
            autotiles.uvsNeedUpdate = true;
            autotiles.createMesh();
            $currentMap.scene.add(autotiles.mesh);
        }
    },

    // -------------------------------------------------------

    /** Read the JSON associated to the sprites in the portion.
    *   @param {Object} json Json object describing the object.
    */
    readSprites: function(json){
        this.readSpritesGlobals(json.list);
        this.readSpritesWalls(json.walls);
    },

    // -------------------------------------------------------

    /** Read the JSON associated to the sprites in the portion.
    *   @param {Object} json Json object describing the object.
    */
    readSpritesGlobals: function(json){
        var localPosition, plane, s, position, ss, sprite, result;
        var collisions, positionPlus;
        var material = $currentMap.textureTileset;
        var i, count = 0, l;
        var staticGeometry = new THREE.Geometry(), geometry;
        staticGeometry.faceVertexUvs[0] = [];

        for (i = 0, l = json.length; i < l; i++) {
            s = json[i];
            position = s.k;
            ss = s.v;
            sprite = new Sprite();
            sprite.read(ss);
            localPosition = RPM.positionToVector3(position);
            if (sprite.kind === ElementMapKind.SpritesFace) {
                result = sprite.createGeometry(
                            material.map.image.width,
                            material.map.image.height,
                            true, position);
                geometry = result[0];
                collisions = result[1][1];
                plane = new THREE.Mesh(geometry, material);
                plane.position.set(localPosition.x, localPosition.y,
                                   localPosition.z);
                this.faceSpritesList.push(plane);
                $currentMap.scene.add(plane);
            }
            else {
                result = sprite.updateGeometry(
                            staticGeometry, material.map.image.width,
                            material.map.image.height, position, count,
                            true, localPosition);
                count = result[0];
                collisions = result[1];
            }
            this.updateCollisionSprite(collisions, position);
        }

        staticGeometry.uvsNeedUpdate = true;
        this.staticSpritesMesh = new THREE.Mesh(staticGeometry, material);
        $currentMap.scene.add(this.staticSpritesMesh);
    },

    // -------------------------------------------------------

    /** Read the JSON associated to the sprites in the portion.
    *   @param {Object} json Json object describing the object.
    */
    readSpritesWalls: function(json) {
        var i, l, wallsIds, count;
        var hash, geometry, material, obj, mesh, result, collisions;
        wallsIds = $currentMap.texturesWalls.length;
        hash = new Array(wallsIds);
        for (i = 0; i < wallsIds; i++)
            hash[i] = null;

        for (i = 0, l = json.length; i < l; i++) {

            // Getting sprite
            var s = json[i];
            var position = s.k;
            var ss = s.v;
            var sprite = new SpriteWall();
            sprite.read(ss);

            // Constructing the geometry
            obj = hash[sprite.id];
            if (obj === null) {
                obj = {};
                geometry = new THREE.Geometry();
                geometry.faceVertexUvs[0] = [];
                material = $currentMap.texturesWalls[sprite.id];
                count = 0;
                obj.geometry = geometry;
                obj.material = material;
                obj.c = count;
                hash[sprite.id] = obj;
            }
            else {
                geometry = obj.geometry;
                material = obj.material;
                count = obj.c;
            }

            result = sprite.updateGeometry(geometry, position,
                                          material.map.image.width,
                                          material.map.image.height, count);
            obj.c = result[0];
            this.updateCollisionSprite(result[1], position);
        }

        for (i = 0; i < wallsIds; i++) {
            obj = hash[i];
            if (obj !== null) {
                geometry = obj.geometry;
                geometry.uvsNeedUpdate = true;
                mesh = new THREE.Mesh(geometry, obj.material);
                this.staticWallsList.push(mesh);
                $gameStack.top().scene.add(mesh);
            }
        }
    },

    // -------------------------------------------------------

    /** Read the JSON associated to the objects in the portion.
    *   @param {Object} json Json object describing the object.
    *   @param {boolean} isMapHero Indicates if this map is where the hero is
    *   at the beginning of the game.
    */
    readObjects: function(json, isMapHero){
        var datas, objects, index, i, l, j, ll;
        datas = $currentMap.getObjectsAtPortion(this.realX, this.realY,
                                                this.realZ);
        objects = datas.m;
        ll = objects.length;

        for (i = 0, l = json.length; i < l; i++){
            var jsonObject = json[i];
            var position = jsonObject.k;
            var jsonObjectValue = jsonObject.v;
            var object = new SystemObject;
            object.readJSON(jsonObjectValue);

            // Check if the object is moving (so no need to add it to the scene)
            index = -1;
            for (j = 0; j < ll; j++) {
                if (objects[j].system.id === object.id) {
                    index = j;
                    break;
                }
            }

            /* If it is the hero, you should not add it to the list of
            objects to display */
            if ((!isMapHero ||
                $datasGame.system.idObjectStartHero !== object.id) &&
                index === -1)
            {
                var localPosition = RPM.positionToVector3(position);
                position = new THREE.Vector3(localPosition.x,
                                             localPosition.y,
                                             localPosition.z);
                var mapObject = new MapObject(object, position);
                mapObject.changeState();
                this.objectsList.push(mapObject);
            }
        }

        // Add moved objects to the scene
        objects = datas.min;
        for (i = 0, l = objects.length; i < l; i++)
            objects[i].addToScene();
        objects = datas.mout;
        for (i = 0, l = objects.length; i < l; i++)
            objects[i].addToScene();
    },

    // -------------------------------------------------------

    /** Remove all the objects from the scene.
    */
    cleanAll: function(){
        var i, l, datas, objects, object, index;
        datas = $game.mapsDatas
                [$currentMap.id][this.realX][this.realY][this.realZ];

        // Static stuff
        $currentMap.scene.remove(this.staticFloorsMesh);
        $currentMap.scene.remove(this.staticSpritesMesh);
        for (i = 0, l = this.faceSpritesList.length; i < l; i++)
            $currentMap.scene.remove(this.faceSpritesList[i]);
        for (i = 0, l = this.staticWallsList.length; i < l; i++)
            $currentMap.scene.remove(this.staticWallsList[i]);

        // Objects
        for (i = 0, l = this.objectsList.length; i < l; i++)
            $currentMap.scene.remove(this.objectsList[i].mesh);

        // Remove moved objects from the scene
        objects = datas.min;
        for (i = 0, l = objects.length; i < l; i++)
            objects[i].removeFromScene();
        objects = datas.mout;
        for (i = 0, l = objects.length; i < l; i++)
            objects[i].removeFromScene();
    },

    // -------------------------------------------------------

    /** Search for the object with the ID.
    *   @param {number} id The ID of the object.
    *   @returns {MapObject}
    */
    getObjFromID: function(json, id){
        for (var i = 0, l = json.length; i < l; i++){
            var jsonTextures = json[i];
            var texture = jsonTextures.k;
            var jsonObjects = jsonTextures.v;
            for (var j = 0, ll = jsonObjects.length; j < ll; j++){
                var jsonObject = jsonObjects[j];
                var position = jsonObject.k;
                var jsonObjectValue = jsonObject.v;
                var object = new SystemObject;
                if (jsonObjectValue.id === id){
                    object.readJSON(jsonObjectValue);
                    var localPosition = RPM.positionToVector3(position);
                    position = new THREE.Vector3(localPosition.x,
                                                 localPosition.y,
                                                 localPosition.z);
                    var mapObject = new MapObject(object, position);
                    mapObject.changeState();

                    return mapObject;
                }
            }
        }

        return null;
    },

    // -------------------------------------------------------

    /** Get hero model.
    *   @param {Object} json Json object describing the object.
    *   @returns {MapObject}
    */
    getHeroModel: function(json){
        json = json.objs.list;
        for (var i = 0, l = json.length; i < l; i++){
            var jsonObject = json[i];
            var position = jsonObject.k;
            var jsonObjectValue = jsonObject.v;

            if ($datasGame.system.idObjectStartHero === jsonObjectValue.id){
                var object = new SystemObject;
                object.readJSON(jsonObjectValue);
                var localPosition = RPM.positionToVector3(position);
                position = new THREE.Vector3(localPosition.x,
                                             localPosition.y,
                                             localPosition.z);
                return new MapObject(object, position);
            }
        }

        return null;
    },

    // -------------------------------------------------------

    /** Update the face sprites orientation.
    *   @param {number} angle The angle on the Y axis.
    */
    updateFaceSprites: function(angle){
        var i, l;

        for (i = 0, l = this.faceSpritesList.length; i < l; i++)
            this.faceSpritesList[i].rotation.y = angle;

        for (i = 0, l = this.objectsList.length; i < l; i++)
            this.objectsList[i].update(angle);
    },

    // -------------------------------------------------------

    /** Update the face sprites orientation.
    *   @param {number} angle The angle on the Y axis.
    */
    updateCollisionSprite: function(collisions, position) {
        var objCollision, positionPlus, z;

        for (var i = 0, l = collisions.length; i < l; i++) {
            objCollision = collisions[i];
            for (var a = -objCollision.w; a <= objCollision.w; a++)
            {
                for (var b = -objCollision.h; b <= objCollision.h; b++)
                {
                    if (objCollision.k) {
                        var e = 0;
                        e = 0;
                    }

                    z = objCollision.k ? 0 : objCollision.w;
                    for (var c = -z; c <= z; c++)
                    {
                        positionPlus = [
                            position[0] + a,
                            position[1] + b,
                            position[3] + c
                        ];
                        if ($currentMap.isInMap(positionPlus)) {
                            this.boundingBoxesSprites[RPM.positionToIndex(
                                positionPlus)].push(objCollision);
                        }
                    }
                }
            }
        }
    },

    // -------------------------------------------------------

    /** Check if there is a collision at this position.
    *   @returns {boolean}
    */
    checkCollision: function(jpositionBefore, jpositionAfter, positionBefore,
                             positionAfter, object, direction, testedCollisions)
    {
        return (this.checkLandsCollision(jpositionBefore, jpositionAfter,
                                     positionBefore, positionAfter, object,
                                     direction, testedCollisions) ||
                this.checkSpritesCollision(jpositionAfter, testedCollisions,
                                           object));
    },

    // -------------------------------------------------------

    /** Check if there is a collision with floors at this position.
    *   @returns {boolean}
    */
    checkLandsCollision: function(jpositionBefore, jpositionAfter,
                                  positionBefore, positionAfter, object,
                                  direction, testedCollisions)
    {
        var lands = this.boundingBoxesLands[
                    RPM.positionToIndex(jpositionAfter)];
        var i, l, objCollision, positionCollision, boundingBox, collision;

        if (lands !== null) {
            for (i = 0, l = lands.length; i < l; i++) {
                objCollision = lands[i];
                if (testedCollisions.indexOf(objCollision) === -1) {
                    testedCollisions.push(objCollision);
                    boundingBox = objCollision.b;
                    collision = objCollision.c;

                    if (this.checkIntersectionLand(collision, boundingBox,
                                                   object) ||
                        this.checkDirections(jpositionBefore, jpositionAfter,
                                             collision, boundingBox, direction,
                                             object))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    },

    // -------------------------------------------------------

    /** Check if there is a collision with floors at this position.
    *   @returns {boolean}
    */
    checkLandsCollisionInside: function(jpositionBefore, jpositionAfter,
                                        direction)
    {
        var lands = this.boundingBoxesLands[
                    RPM.positionToIndex(jpositionBefore)];
        var i, l, objCollision, positionCollision, collision;

        if (lands !== null) {
            for (i = 0, l = lands.length; i < l; i++) {
                objCollision = lands[i];
                collision = objCollision.c;
                if (this.checkDirectionsInside(
                         jpositionBefore, jpositionAfter, collision,
                         direction))
                {
                    return true;
                }
            }
        }

        return false;
    },

    // -------------------------------------------------------

    /** Check intersection between ray and an object.
    *   @returns {boolean}
    */
    checkIntersectionLand: function(collision, boundingBox, object) {
        if (collision !== null)
            return false;

        MapPortion.applyBoxLandTransforms($BB_BOX, boundingBox);

        return CollisionsUtilities.obbVSobb(object.meshBoundingBox.geometry,
                                            $BB_BOX.geometry);
    },

    // -------------------------------------------------------

    /** Check directions.
    *   @returns {boolean}
    */
    checkDirections: function(jpositionBefore, jpositionAfter, collision,
                              boundingBox, direction, object)
    {
        if (collision === null)
            return false;

        if (jpositionBefore[0] !== jpositionAfter[0] ||
            jpositionBefore[1] !== jpositionAfter[1] ||
            jpositionBefore[2] !== jpositionAfter[2])
        {
            if (this.checkIntersectionLand(null, boundingBox, object)) {
                if (direction.x > 0)
                    return !collision.left;
                if (direction.x < 0)
                    return !collision.right;
                if (direction.z > 0)
                    return !collision.top;
                if (direction.z < 0)
                    return !collision.bot;
           }
        }

        return false;
    },

    // -------------------------------------------------------

    /** Check directions.
    *   @returns {boolean}
    */
    checkDirectionsInside: function(jpositionBefore, jpositionAfter, collision,
                                    direction)
    {
        if (collision === null)
            return false;

        if (jpositionBefore[0] !== jpositionAfter[0] ||
            jpositionBefore[1] !== jpositionAfter[1] ||
            jpositionBefore[2] !== jpositionAfter[2])
        {
            if (direction.x > 0)
                return !collision.right;
            if (direction.x < 0)
                return !collision.left;
            if (direction.z > 0)
                return !collision.bot;
            if (direction.z < 0)
                return !collision.top;
        }

        return false;
    },

    // -------------------------------------------------------

    /** Check if there is a collision with sprites at this position.
    *   @returns {boolean}
    */
    checkSpritesCollision: function(jpositionAfter, testedCollisions, object)
    {
        var sprites = this.boundingBoxesSprites[
                      RPM.positionToIndex(jpositionAfter)];
        var i, l, objCollision;

        if (sprites !== null) {
            for (i = 0, l = sprites.length; i < l; i++) {
                objCollision = sprites[i];
                if (testedCollisions.indexOf(objCollision) === -1) {
                    testedCollisions.push(objCollision);

                    if (this.checkIntersectionSprite(objCollision.b,
                                                     objCollision.k, object))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    },

    // -------------------------------------------------------

    /** Check intersection between ray and an object.
    *   @returns {boolean}
    */
    checkIntersectionSprite: function(boundingBox, fix, object) {
        if (boundingBox === null)
            return false;

        if (fix) {
            MapPortion.applyBoxSpriteTransforms($BB_BOX, boundingBox);
            return CollisionsUtilities.obbVSobb(object.meshBoundingBox.geometry,
                                                $BB_BOX.geometry);
        }
        else {
            MapPortion.applyOrientedBoxTransforms($BB_ORIENTED_BOX, boundingBox);
            return CollisionsUtilities.obbVSobb(object.meshBoundingBox.geometry,
                                                $BB_ORIENTED_BOX.geometry);
        }
    },

    // -------------------------------------------------------

    /** Check collision with objects.
    *   @returns {boolean}
    */
    checkObjectsCollision: function(object, position) {
        var datas = $currentMap.getObjectsAtPortion(this.realX, this.realY,
                                                    this.realZ);

        return this.checkObjectsCollisionList(this.objectsList, object,
                                              position) ||
               this.checkObjectsCollisionList(datas.min, object, position) ||
               this.checkObjectsCollisionList(datas.mout, object, position);
    },

    // -------------------------------------------------------

    /** Check collision with objects.
    *   @returns {boolean}
    */
    checkObjectsCollisionList: function(list, object, position) {
        var obj;

        for (var i = 0, l = list.length; i < l; i++) {
            obj = list[i];
            if (true && obj !== object) {
                test = true;
                if (object.checkCollisionObject(obj, position))
                    return true;
            }
        }

        return false;
    }
}
