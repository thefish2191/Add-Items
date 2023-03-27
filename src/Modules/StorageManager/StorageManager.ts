import * as path from 'path';
import { Uri, ExtensionContext, workspace } from 'vscode';
import { extLogger } from '../../extension';

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
            path.join(this.ctx.globalStorageUri.fsPath, 'UserTemplates.json')
        );
        this.userTemplatesDefaults = Uri.file(
            path.join(
                this.ctx.extensionUri.fsPath,
                '/src/Modules/ItemCreator/DefaultTemplates.json'
            )
        );
        this.ensureStorage();
    }
    private ensureStorage() {
        workspace.fs.createDirectory(this.ctx.globalStorageUri);
    }
    public restoreDefaultUserTemplates(force: boolean = false) {
        workspace.fs.copy(
            this.userTemplatesDefaults,
            this.userTemplates,
            {
                overwrite: force,
            }
        );
    }
    public async fileExit(file: Uri): Promise<boolean> {
        let exist = true;
        try {
            await workspace.fs.readFile(file);
            extLogger.logInfo(`The file ${file} does exist`);
        } catch (error) {
            extLogger.logInfo(`The file: "${file}" does NOT exist`);
        }
        return exist;
    }
}
