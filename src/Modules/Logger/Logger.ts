import * as vscode from 'vscode';

const prefixInfo = `[ Info ]: `;
const prefixError = `[ Error ]: `;
const prefixWarning = `[ Warning ]: `;

/**
 * A class to allow the extension log important information to the console
 * and allow the user to know that it is doing
 */
export class Logger {
    extensionName: string;
    ctx: vscode.ExtensionContext;
    loggingChannel: vscode.OutputChannel;
    constructor(extName: string, _ctx: vscode.ExtensionContext) {
        (this.ctx = _ctx), (this.extensionName = extName);
        this.loggingChannel = vscode.window.createOutputChannel(extName);
    }
    public logInfo(mess: string) {
        this.loggingChannel.appendLine(prefixInfo + mess);
    }
}
