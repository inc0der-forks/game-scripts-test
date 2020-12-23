import { CommonSkillItem } from "./CommonSkillItem";
/** @class
 *  An item of the game.
 *  @extends CommonSkillItem
 *  @param {Record<string, any>} [json=undefined] Json object describing the item
 */
declare class Item extends CommonSkillItem {
    constructor(json?: Record<string, any>);
    /**
     *  Read the JSON associated to the item.
     *  @param {Record<string, any>} json Json object describing the item
     */
    read(json: Record<string, any>): void;
    /** Get the item type.
     *  @returns {string}
     */
    getStringType(): string;
}
export { Item };
