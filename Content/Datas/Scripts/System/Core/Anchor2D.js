"use strict";
/*
    RPG Paper Maker Copyright (C) 2017-2020 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anchor2D = void 0;
const Common_1 = require("../Common");
/**
 * The data class for anchors
 */
class Anchor2D {
    /**
     * The data class for 2D anchors
     * @param x the x anchors (capped from 0 to 1)
     * @param y the y anchors (capped from 0 to 1)
     */
    constructor(x = 0.5, y = 0) {
        this.x = Common_1.Mathf.clamp(x, 0, 1);
        this.y = Common_1.Mathf.clamp(y, 0, 1);
    }
    /**
     * Set the anchors using object format. (can also use premade)
     * @param {{x: number, y: number}} anchors
     */
    set(anchors) {
        this.x = Common_1.Mathf.clamp(anchors.x, 0, 1);
        this.y = Common_1.Mathf.clamp(anchors.y, 0, 1);
    }
}
exports.Anchor2D = Anchor2D;
Anchor2D.MIDDLE_TOP = { x: 0, y: 1 };
Anchor2D.MIDDLE = { x: 0.5, y: 0.5 };
Anchor2D.MIDDLE_BOTTOM = { x: 0.5, y: 0 };
Anchor2D.LEFT_TOP = { x: 0, y: 1 };
Anchor2D.LEFT_MIDDLE = { x: 0, y: 0.5 };
Anchor2D.LEFT_BOTTOM = { x: 0, y: 0 };
Anchor2D.RIGHT_TOP = { x: 1, y: 1 };
Anchor2D.RIGHT_MIDDLE = { x: 1, y: 0.5 };
Anchor2D.RIGHT_BOTTOM = { x: 1, y: 0 };