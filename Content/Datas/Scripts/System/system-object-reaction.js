/*
    RPG Paper Maker Copyright (C) 2017-2019 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

// -------------------------------------------------------
//
//  CLASS SystemObjectReaction
//
// -------------------------------------------------------

/** @class
*   A reaction to an event.
*   @property {boolean} blockingHero Indicates if this reaction is blocking
*   the hero.
*   @property {Object} labels Hash of all the labels.
*   @property {Tree} commands All the commands.
*/
function SystemObjectReaction(){
    this.labels = new Array; // TODO
}

SystemObjectReaction.prototype = {

    /** Read the JSON associated to the object reaction.
    *   @param {Object} json Json object describing the object.
    */
    readJSON: function(json){
        this.idEvent = json.id;

        // Options
        this.blockingHero = json.bh;

        // Read commands
        var jsonCommands = json.c;
        var commands = new Tree("root");
        this.readChildrenJSON(jsonCommands, commands);
        this.commands = commands;
    },

    // -------------------------------------------------------

    /** Read the JSON children associated to the object reaction.
    *   @param {Object} jsonCommands Json object describing the object.
    *   @param {Tree} commands All the commands (final result).
    */
    readChildrenJSON: function(jsonCommands, commands){
        for (var j = 0, ll = jsonCommands.length; j < ll; j++){
            var node = commands.add(EventCommand.getEventCommand(jsonCommands[j]));
            if (jsonCommands[j].hasOwnProperty("children")) {
                this.readChildrenJSON(jsonCommands[j].children, node);
            }
        }
    },

    // -------------------------------------------------------

    /** Get the first node command of the reaction.
    *   @returns {Node}
    */
    getFirstCommand: function() {
        return this.commands.root.firstChild;
    }
}
