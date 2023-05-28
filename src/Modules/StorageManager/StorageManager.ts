import * as path from 'path';
import { Uri, ExtensionContext, workspace } from 'vscode';
import { extLogger } from '../../extension';
import * as vscode from 'vscode';
import { AskToUser } from '../AskToUser';

export class StorageManager {
    // Important fields
    private extensionName: string;
    private ctx: ExtensionContext;

    // Default folder
    // User templates
    userTemplates: Uri; // Uri to the user templates files
    private userTemplatesDefaults: Uri; // Default

    constructor(extName: string, _ctx: ExtensionContext) {
        (this.extensionName = extName), (this.ctx = _ctx);
        this.userTemplates = Uri.file(
            path.join(this.ctx.globalStorageUri.fsPath, 'UserTemplates.jsonc')
        );
        this.userTemplatesDefaults = Uri.file(
            path.join(
                this.ctx.extensionUri.fsPath,
                'UserTemplatesDefault.jsonc'
            )
        );
        // workspace.fs.createDirectory(this.ctx.globalStorageUri);
        // this.ensureStorage();
    }
    private async ensureStorage() {
        // try {
        // } catch (error) {
        //     if (error instanceof Error) {
        //         extLogger.logError(error.name);
        //         extLogger.logError(error.message);
        //     }
        // }
    }
    public async restoreDefaultUserTemplates(force: boolean = false) {
        try {
            await workspace.fs
                .copy(this.userTemplatesDefaults, this.userTemplates, {
                    overwrite: force,
                })
                .then(() => {
                    this.openUserTemplates();
                });
        } catch (error) {
            if (error instanceof Error) {
                extLogger.logError(error.name);
                extLogger.logError(error.message);
            }
        }
    }
    public async fileExist(file: Uri): Promise<boolean> {
        let exist = true;
        try {
            await workspace.fs.readFile(file);
            extLogger.logInfo(`The file ${file} exist`);
        } catch (error) {
            extLogger.logInfo(`The file: "${file}" does NOT exist`);
            exist = false;
        }
        return exist;
    }
    public async readUserTemplates(): Promise<string> {
        extLogger.logActivity(`Reading user templates...`);
        let templatesString = await workspace.fs.readFile(this.userTemplates);
        return templatesString.toString();
    }
    public async openUserTemplates() {
        if (await this.fileExist(this.userTemplates)) {
            await vscode.commands.executeCommand(
                'vscode.open',
                this.userTemplates
            );
        } else {
            extLogger.logError(`The file does not exist`);
            AskToUser.createTemplateFile();
        }
    }
}
