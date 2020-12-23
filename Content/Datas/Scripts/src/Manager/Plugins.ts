/*
    RPG Paper Maker Copyright (C) 2017-2020 Wano

    RPG Paper Maker engine is under proprietary license.
    This source code is also copyrighted.

    Use Commercial edition for commercial use of your games.
    See RPG Paper Maker EULA here:
        http://rpg-paper-maker.com/index.php/eula.
*/

import { IO, Paths, Constants } from "../Common";
import { System } from "..";
import { DynamicValue } from "../System";

/** @class
 *  The class who handles plugins of RPG Paper Maker.
 *  @static
 *  @author Nio Kasgami, Wano
 */
class Plugins {

    public static plugins: Record<string, System.Plugin> = {};

    constructor() {
        throw new Error("This is a static class");
    }

    /**
     * Load all the game plugins.
     * @static
     * @async
     */
    static async load() {
        let pluginsNames = (await IO.parseFileJSON(Paths.FILE_SCRIPTS)).plugins;
        for (let i = 0, l = pluginsNames.length; i < l; i++) {
            await this.loadPlugin(pluginsNames[i]);
        }
    }

    /**
     *  Load a particular plugin.
     *  @param {string} pluginName The plugin name to load
     *  @returns {Promise<boolean>}
     */
    static async loadPlugin(pluginName: string): Promise<boolean> {
        let json = await IO.parseFileJSON(Paths.PLUGINS + pluginName + 
            Constants.STRING_SLASH + Paths.FILE_PLUGIN_DETAILS);
        let plugin = new System.Plugin(json);
        this.register(plugin);
        return (await new Promise((resolve, reject) => {
            let url = Paths.PLUGINS + pluginName + Constants.STRING_SLASH + 
                Paths.FILE_PLUGIN_CODE;
            let script = document.createElement("script");
            script.type = "module";
            script.src = url;
            document.body.appendChild(script);
            script.onload = () => { resolve(true); };
        }));
    }

    /**
     *  Register plugin parameters.
     *  @param {System.Plugin} plugin
     */
    static register(plugin: System.Plugin) {
        if (this.plugins.hasOwnProperty(plugin.name)) {
            throw new Error("Duplicate error: " + plugin + " is an duplicate of " 
                + plugin.name);
        } else {
            this.plugins[plugin.name] = plugin;
        }
    }

    /**
     * Return the plugin object
     * @param plugin
     * @returns {any}
     * @deprecated use Plugins.getParameters(pluginName); or Plugins.getParameter(pluginName, parameterName); instead
     */
    static fetch(plugin: string): any {
        /*
        if (!this.plugins.hasOwnProperty(plugin)) {
            throw new Error("Unindenfied plugin error: " + plugin + " doesn't exist in the current workspace!");
        } else {
            return this.plugins[plugin];
        }
        */
    }

    /**
     * check whether the plugin exist or not.
     * It's used for compatbilities purpose 
     * @param id
     * @returns {boolean}
     */
    static exists(pluginName: string): boolean {   
        for (const plugin in this.plugins) {
            if (this.plugins.hasOwnProperty(plugin)) {
                if (this.plugins[plugin].name === pluginName) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     *  Get plugin parameters.
     *  @param {string} pluginName 
     *  @returns {Record<string, DynamicValue>}
     */
    static getParameters(pluginName: string): any {
        return this.plugins[pluginName].parameters;
    }

    /**
     *  Get a plugin parameter.
     *  @param {string} pluginName
     *  @param {string} parameter
     *  @returns {any}
     */
    static getParameter(pluginName: string, parameter: string): any {
        return this.getParameters(pluginName)[parameter].getValue()
    }

    /**
     * Check whether or not the plugin is enabled or not.
     * @param pluginName 
     */
    static isEnabled(pluginName: string): boolean {
        return this.plugins[pluginName].isOn;
    }
    /**
     * Merge the two plugins to extends their plugins data.
     * @usage This function is used to extends the parameters of other plugins See Patch System
     * @experimental This is a experimental features that is yet to be support in RPM
     * @param {string} parent
     * @param {string} child
     */
    static merge(parent: string, child: string) {
        /*
        const par = this.plugins[parent].parameter;
        const chi = this.plugins[child].parameter;
        this.plugins[parent].parameters = { ...par, ...chi };
        */
    }
}

export { Plugins }

