import { ExtensionContext, commands, Uri, window } from 'vscode';
import { extLogger, storageMng } from '../extension';
import { ItemCreator, ItemType } from './ItemCreator/ItemCreator';

export function registerCommands(extensionName: string, ctx: ExtensionContext) {
    // Generic Items
    let addItemCmd = commands.registerCommand(
        `${extensionName}.addItem`,
        (clicker: Uri) => {
            extLogger.logInfo(`Command: addItem was Invoked`);
            ItemCreator.createItem(clicker, ItemType.default);
        }
    );
    // Generic item custom
    let addItemCustomCmd = commands.registerCommand(
        `${extensionName}.addItemCustom`,
        (clicker: Uri) => {
            extLogger.logInfo(`Command: addItemCustom was Invoked`);
            ItemCreator.createItem(clicker, ItemType.custom);
        }
    );

    // Commands for storage management
    let restoreTemplatesCmd = commands.registerCommand(
        `${extensionName}.restoreTemplateFiles`,
        () => {
            extLogger.logInfo(`Command: restoreTemplates was Invoked`);
            storageMng.restoreDefaultUserTemplates(true);
        }
    );
    let openUserTemplates = commands.registerCommand(
        `${extensionName}.openUserTemplates`,
        () => {
            storageMng.openUserTemplates();
        }
    );

    // Register the commands
    ctx.subscriptions.push(
        addItemCmd,
        addItemCustomCmd,
        restoreTemplatesCmd,
        openUserTemplates
    );
}
