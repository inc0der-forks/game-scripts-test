/*
    RPG Paper Maker Copyright (C) 2017-2020 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { Enum, Utils } from "../Common";
import DynamicValueKind = Enum.DynamicValueKind;
import { System, Datas } from "../index";
import { StructIterator } from "../EventCommand";
import { Stack } from "../Manager";
import { ReactionInterpreter } from "../Core";

interface StructJSON
{
    k: DynamicValueKind,
    v: any,
    customStructure?: Record<string, any>,
    customList?: Record<string, any>
}

/** @class
 *  The class who handle dynamic value.
 *  @extends {System.Base}
 *  @param {Record<string, any>} [json=undefined] Json object describing the value
 */
class DynamicValue extends System.Base {
    
    public kind: DynamicValueKind;
    public value: any;
    public customStructure: Record<string, System.DynamicValue>;
    public customList: System.DynamicValue[];

    constructor(json?: Record<string, any>) {
        super(json);
    }

    /** 
     *  Create a new value from kind and value.
     *  @static
     *  @param {DynamicValueKind} [k=DynamicValueKind.None] The kind of value
     *  @param {any} [v=0] The value
     *  @returns {SystemValue}
     */
    static create(k: DynamicValueKind = DynamicValueKind.None, v: any = 0): 
        System.DynamicValue {
        let systemValue = new System.DynamicValue();
        systemValue.kind = k;
        switch (k) {
            case DynamicValueKind.None:
                systemValue.value = null;
                break;
            case DynamicValueKind.Message:
                systemValue.value = Utils.numToString(v);
                break;
            case DynamicValueKind.Switch:
                systemValue.value = Utils.numToBool(v);
                break;
            default:
                systemValue.value = v;
                break;
        }
        return systemValue;
    }

    /** 
     *  Create a new value from a command and iterator.
     *  @static
     *  @param {any[]} command The list describing the command
     *  @param {StructIterator} iterator The iterator
     *  @returns {System.DynamicValue}
     */
    static createValueCommand(command: any[], iterator: StructIterator): 
        System.DynamicValue {
        let k = command[iterator.i++];
        let v = command[iterator.i++];
        return System.DynamicValue.create(k, v);
    }

    /** 
     *  Create a none value.
     *  @static
     *  @returns {System.DynamicValue}
     */
    static createNone(): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.None, null);
    }

    /** 
     *  Create a new value number.
     *  @static
     *  @param {number} n The number
     *  @returns {System.DynamicValue}
     */
    static createNumber(n: number): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.Number, n);
    }

    /**
     *  Create a new value message.
     *  @static
     *  @param {string} m The message
     *  @returns {System.DynamicValue}
     */
    static createMessage(m: string): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.Message, m);
    }

    /** 
     *  Create a new value decimal number.
     *  @static
     *  @param {number} n The number
     *  @returns {System.DynamicValue}
     */
    static createNumberDouble(n: number): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.NumberDouble, n);
    }

    /** 
     *  Create a new value keyBoard.
     *  @static
     *  @param {number} k The key number
     *  @returns {System.DynamicValue}
     */
    static createKeyBoard(k: number): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.KeyBoard, k);
    }

    /** 
     *  Create a new value switch.
     *  @static
     *  @param {boolean} b The value of the switch
     *  @returns {System.DynamicValue}
     */
    static createSwitch(b: boolean): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.Switch, Utils.boolToNum(b));
    }

    /** 
     *  Create a new value variable.
     *  @static
     *  @param {number} id The variable ID
     *  @returns {System.DynamicValue}
     */
    static createVariable(id: number): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.Variable, id);
    }

    /** 
     *  Create a new value parameter.
     *  @static
     *  @param {number} id The parameter ID
     *  @returns {System.DynamicValue}
     */
    static createParameter(id: number): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.Parameter, id);
    }

    /** 
     *  Create a new value property.
     *  @static
     *  @param {number} id The property id
     *  @returns {System.DynamicValue}
     */
    static createProperty(id: number): System.DynamicValue {
        return System.DynamicValue.create(DynamicValueKind.Property, id);
    }

    /** 
     *  Try to read a number value, if not possible put default value.
     *  @static
     *  @param {StructJSONDynamicValue} json The json value
     *  @param {number} [n=0] The default value
     *  @returns {System.DynamicValue}
     */
    static readOrDefaultNumber(json: StructJSON, n: number = 0): 
        System.DynamicValue {
        return Utils.isUndefined(json) ? System.DynamicValue.createNumber(n) : 
            System.DynamicValue.readFromJSON(json);
    }

    /** 
     *  Try to read a double number value, if not possible put default value.
     *  @static
     *  @param {StructJSONDynamicValue} json The json value
     *  @param {number} [n=0] The default value
     *  @returns {System.DynamicValue}
     */
    static readOrDefaultNumberDouble(json: StructJSON, n: number = 0
        ): System.DynamicValue {
        return Utils.isUndefined(json) ? System.DynamicValue.createNumberDouble(
            n) : System.DynamicValue.readFromJSON(json);
    }

    /** 
     *  Try to read a database value, if not possible put default value.
     *  @static
     *  @param {StructJSONDynamicValue} json The json value
     *  @param {number} [id=1] The default value
     *  @returns {System.DynamicValue}
     */
    static readOrDefaultDatabase(json: StructJSON, id: number = 1): 
        System.DynamicValue {
        return Utils.isUndefined(json) ? System.DynamicValue.create(
            DynamicValueKind.DataBase, id) : System.DynamicValue.readFromJSON(
            json);
    }

    /** 
     *  Try to read a message value, if not possible put default value.
     *  @static
     *  @param {StructJSONDynamicValue} json The json value
     *  @param {string} [m=""] The default value
     *  @returns {System.DynamicValue}
     */
    static readOrDefaultMessage(json: StructJSON, m: string = ""): 
        System.DynamicValue {
        return Utils.isUndefined(json) ? System.DynamicValue.create(
            DynamicValueKind.Message, m) : System.DynamicValue.readFromJSON(
            json);
    }

    /** 
     *  Try to read a value, if not possible put none value.
     *  @static
     *  @param {StructJSONDynamicValue} json The json value
     *  @returns {System.DynamicValue}
     */
    static readOrNone(json: StructJSON): System.DynamicValue {
        return Utils.isUndefined(json) ? System.DynamicValue.createNone() : 
            System.DynamicValue.readFromJSON(json);
    }

    /** 
     *  Read a value of any kind and return it.
     *  @static
     *  @param {StructJSONDynamicValue} json The json value
     *  @returns {System.DynamicValue}
     */
    static readFromJSON(json: StructJSON): System.DynamicValue {
        let value = new System.DynamicValue();
        value.read(json);
        return value;
    }

    /** 
     *  Read the JSON associated to the value
     *  @param {StructJSONDynamicValue} json Json object describing the value
     */
    read(json: StructJSON) {
        this.kind = json.k;
        this.value = json.v;

        switch (this.kind) {
            case DynamicValueKind.CustomStructure:
                this.customStructure = {};
                let jsonList = Utils.defaultValue(json.customStructure
                    .properties, []);
                let parameter: System.DynamicValue, jsonParameter: Record<string
                    , any>;
                for (let i = 0, l = jsonList.length; i < l; i++) {
                    jsonParameter = jsonList[i];
                    parameter = System.DynamicValue.readOrDefaultNumber(
                        jsonParameter.value);
                    this.customStructure[jsonParameter.name] = parameter;
                }
                break;
            case DynamicValueKind.CustomList:
                this.customList = [];
                Utils.readJSONSystemList({ list: Utils.defaultValue(json
                    .customList.list, []), listIndexes: this.customList, func: (
                    jsonParameter: Record<string ,any>) =>
                    {
                        return System.DynamicValue.readOrDefaultNumber(
                            jsonParameter.value); 
                    }
                });
                break;
            default:
                break;
        }
    }

    /** 
     *  Get the value
     *  @returns {any}
     */
    getValue(): any {
        switch (this.kind) {
            case DynamicValueKind.Variable:
                return Stack.game.variables[this.value];
            case DynamicValueKind.Parameter:
                return ReactionInterpreter.currentParameters[this.value]
                    .getValue();
            case DynamicValueKind.Property:
                return ReactionInterpreter.currentObject.properties[this.value];
            case DynamicValueKind.Class:
                return Datas.Classes.get(this.value);
            case DynamicValueKind.Hero:
                return Datas.Heroes.get(this.value);
            case DynamicValueKind.Monster:
                return Datas.Monsters.get(this.value);
            case DynamicValueKind.Troop:
                return Datas.Troops.get(this.value);
            case DynamicValueKind.Item:
                return Datas.Items.get(this.value);
            case DynamicValueKind.Weapon:
                return Datas.Weapons.get(this.value);
            case DynamicValueKind.Armor:
                return Datas.Armors.get(this.value);
            case DynamicValueKind.Skill:
                return Datas.Skills.get(this.value);
            case DynamicValueKind.Animation:
                return Datas.Animations.get(this.value);
            case DynamicValueKind.Status:
                //return Datas.Status.get(this.value);
            case DynamicValueKind.Tileset:
                return Datas.Tilesets.get(this.value);
            case DynamicValueKind.FontSize:
                return Datas.Systems.getFontSize(this.value);
            case DynamicValueKind.FontName:
                return Datas.Systems.getFontName(this.value);
            case DynamicValueKind.Color:
                return Datas.Systems.getColor(this.value);
            case DynamicValueKind.WindowSkin:
                return Datas.Systems.getWindowSkin(this.value);
            case DynamicValueKind.Currency:
                return Datas.Systems.getCurrency(this.value);
            case DynamicValueKind.Speed:
                return Datas.Systems.getSpeed(this.value);
            case DynamicValueKind.Detection:
                return Datas.Systems.getDetection(this.value);
            case DynamicValueKind.CameraProperty:
                return Datas.Systems.getCameraProperties(this.value);
            case DynamicValueKind.Frequency:
                return Datas.Systems.getFrequency(this.value);
            case DynamicValueKind.Skybox:
                return Datas.Systems.getSkybox(this.value);
            case DynamicValueKind.BattleMap:
                return Datas.BattleSystems.getBattleMap(this.value);
            case DynamicValueKind.Element:
                return Datas.BattleSystems.getElement(this.value);
            case DynamicValueKind.CommonStatistic:
                return Datas.BattleSystems.getStatistic(this.value);
            case DynamicValueKind.WeaponsKind:
                return Datas.BattleSystems.getWeaponKind(this.value);
            case DynamicValueKind.ArmorsKind:
                return Datas.BattleSystems.getArmorKind(this.value);
            case DynamicValueKind.CommonBattleCommand:
                return Datas.BattleSystems.getBattleCommand(this.value);
            case DynamicValueKind.CommonEquipment:
                return Datas.BattleSystems.getEquipment(this.value);
            case DynamicValueKind.Event:
                return Datas.CommonEvents.getEventUser(this.value);
            case DynamicValueKind.State:
                return this.value;
            case DynamicValueKind.CommonReaction:
                return Datas.CommonEvents.getCommonReaction(this.value);
            case DynamicValueKind.Model:
                return Datas.CommonEvents.getCommonObject(this.value);
            case DynamicValueKind.CustomStructure:
                return this.customStructure;
            case DynamicValueKind.CustomList:
                return this.customList;
            default:
                return this.value;
        }
    }

    /** 
     *  Check if a value is equal to another one
     *  @param {System.DynamicValue} value The value to compare
     *  @returns {boolean}
     */
    isEqual(value: System.DynamicValue): boolean {
        // If keyBoard
        if (this.kind === DynamicValueKind.KeyBoard && value.kind !==
            DynamicValueKind.KeyBoard) {
            return Datas.Keyboards.isKeyEqual(value.value, Datas.Keyboards.get(
                this.value));
        } else if (value.kind === DynamicValueKind.KeyBoard && this.kind !==
            DynamicValueKind.KeyBoard) {
            return Datas.Keyboards.isKeyEqual(this.value, Datas.Keyboards.get(
                value.value));
        } else if (this.kind === DynamicValueKind.Anything || value.kind ===
            DynamicValueKind.Anything) {
            return true;
        }
        // If any other value, compare the direct values
        return this.getValue() === value.getValue();
    }
}

export { StructJSON, DynamicValue }