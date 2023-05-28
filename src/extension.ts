import * as vscode from 'vscode';
import { Logger } from './Modules/Logger/Logger';
import { StorageManager } from './Modules/StorageManager/StorageManager';
import { registerCommands } from './Modules/commands';

export const extensionName = `add-items`;

export let extLogger: Logger;
export let storageMng: StorageManager;

export async function activate(context: vscode.ExtensionContext) {
    extLogger = new Logger(extensionName, context);
    extLogger.logInfo(`${extensionName} is now up and running!`);
    storageMng = new StorageManager(extensionName, context);
    registerCommands(extensionName, context);
}
// export function deactivate() {}
