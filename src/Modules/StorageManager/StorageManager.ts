import * as path from 'path';
import { Uri, ExtensionContext, workspace } from 'vscode';
import { extLogger } from '../../extension';
import * as errorMessages from './../Logger/ErrorMessages';
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
                'src',
                'Modules',
                'StorageManager',
                'UserTemplatesDefault.jsonc'
            )
        );
        this.ensureStorage();
    }
    private ensureStorage() {
        workspace.fs.createDirectory(this.ctx.globalStorageUri);
    }
    public restoreDefaultUserTemplates(force: boolean = false) {
        workspace.fs
            .copy(this.userTemplatesDefaults, this.userTemplates, {
                overwrite: force,
            })
            .then(() => {
                this.openUserTemplates();
            });
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
            vscode.commands.executeCommand('vscode.open', this.userTemplates);
        } else {
            AskToUser.createTemplateFile();
            extLogger.logError(`The file does not exist`);
        }
    }
}
