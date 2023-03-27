import { ExtensionContext, commands, Uri, window } from 'vscode';

export function registerCommands(ctx: ExtensionContext, extensionName: string) {
    // Commands name for item creator methods
    const addItemCommandName = `${extensionName}.AddItem`;
    const addItemCustomCommandName = `${extensionName}.AddItemCustom`;

    // Generic Items
    let addItemCommand = commands.registerCommand(
        addItemCommandName,
        (clicker: Uri) => {}
    );
    // Generic item custom
    let addItemCustomCommand = commands.registerCommand(
        addItemCustomCommandName,
        (clicker: Uri) => {}
    );

    // Commands names for storage management
    
    // Register the commands
    ctx.subscriptions.push(addItemCommand, addItemCustomCommand);
}
