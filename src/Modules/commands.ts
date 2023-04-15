import { ExtensionContext, commands, Uri, window } from 'vscode';
import { extLogger, storageMng } from '../extension';
import { ItemCreator } from './ItemCreator/ItemCreator';
import { AskToUser } from './AskToUser';
import { ItemType } from './ItemCreator/ItemType';

export function registerCommands(extensionName: string, ctx: ExtensionContext) {
    // Generic Items
    let addItemCmd = commands.registerCommand(
        `${extensionName}.addItem`,
        (clicker: Uri, preReq: any[] | string) => {
            extLogger.logInfo(`AddItem command invoked!`);
            // preReq = 'csharp.class';
            if (preReq instanceof String || typeof preReq === 'string') {
                extLogger.logInfo(`Requested: ${preReq}`);
                ItemCreator.createItem(
                    clicker,
                    ItemType.default,
                    String(preReq)
                );
            } else {
                extLogger.logInfo(`No default requested`);
                ItemCreator.createItem(clicker, ItemType.default);
            }
        }
    );
    // Generic item custom
    let addItemCustomCmd = commands.registerCommand(
        `${extensionName}.addItemCustom`,
        (clicker: Uri, preReq: any[] | string) => {
            extLogger.logInfo(`Command: addItemCustom was Invoked`);
            if (preReq instanceof String || typeof preReq === 'string') {
                extLogger.logInfo(`Requested: ${preReq}`);
                ItemCreator.createItem(
                    clicker,
                    ItemType.custom,
                    String(preReq)
                );
            } else {
                extLogger.logInfo(`No default requested`);
                ItemCreator.createItem(clicker, ItemType.custom);
            }
        }
    );

    // Commands for storage management
    let restoreTemplatesCmd = commands.registerCommand(
        `${extensionName}.restoreTemplateFiles`,
        () => {
            extLogger.logInfo(`restoreTemplatesFiles command invoked`);
            extLogger.logActivity(`Asking the user if they are sure...`);
            AskToUser.areYouSureToReplaceTemplates();
        }
    );
    let openUserTemplates = commands.registerCommand(
        `${extensionName}.openUserTemplates`,
        () => {
            storageMng.openUserTemplates();
        }
    );
    let addClass = commands.registerCommand(
        'add-items.addClass',
        (clicker: Uri) => {
            commands.executeCommand(
                `add-items.addItem`,
                clicker,
                'others.JSON'
            );
        }
    );

    // Register the commands
    ctx.subscriptions.push(
        addItemCmd,
        addItemCustomCmd,
        restoreTemplatesCmd,
        openUserTemplates,
        addClass
    );
}
