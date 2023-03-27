import * as vscode from 'vscode';

const prefixInfo = `[  Info ]: `;
const prefixError = `[ Error ]: `;
const prefixWarning = `[Warning]: `;
const prefixActivity = `[ Doing ]: `;

/**
 * A class to allow the extension log important information to the console
 * and allow the user to know that it is doing
 */
export class Logger {
    private extensionName: string;
    private ctx: vscode.ExtensionContext;
    private loggingChannel: vscode.OutputChannel;
    constructor(extName: string, _ctx: vscode.ExtensionContext) {
        (this.ctx = _ctx), (this.extensionName = extName);
        this.loggingChannel = vscode.window.createOutputChannel(extName);
    }
    public logInfo(mess: string) {
        this.loggingChannel.appendLine(prefixInfo + mess);
    }
    public logActivity(message: string) {
        this.loggingChannel.appendLine(prefixActivity + message);
    }
    public logError(message: string) {
        this.loggingChannel.appendLine(prefixError + message);
        this.loggingChannel.appendLine(``);
    }
    public logSuccess(message: string) {
        this.loggingChannel.appendLine(`😎😎 ` + message);
        this.loggingChannel.appendLine(``);
    }
    public reportWarning(message: string) {
        this.loggingChannel.appendLine(prefixWarning + message);
    }
}
