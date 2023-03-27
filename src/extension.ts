import * as vscode from 'vscode';
import { Logger } from './Modules/Logger/Logger';
import { StorageManager } from './Modules/StorageManager/StorageManager';

export const extensionName = `Add-Items`;

export let extLogger: Logger;
export let storageMng: StorageManager;

export async function activate(context: vscode.ExtensionContext) {
    extLogger = new Logger(extensionName, context);
    storageMng = new StorageManager(extensionName, context);

    if (await storageMng.fileExit(storageMng.userTemplates)) {
        extLogger.logInfo(`File exist`);
    }

    let disposable = vscode.commands.registerCommand(
        'add-items.helloWorld',
        () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage('Hello World from Add-Items!');
        }
    );
    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
