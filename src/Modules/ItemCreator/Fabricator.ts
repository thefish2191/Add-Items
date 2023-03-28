import * as vscode from 'vscode';
import { Uri, SnippetString } from 'vscode';
import { AskToUser } from '../AskToUser';
import { fileExistMessage } from '../Logger/ErrorMessages';
import { FileSpotter } from './FileSpotter';
import { ProjectGatherer } from './LanguageActions/cs/NamespaceGatherer';
import { TemplateParser } from './TemplateParser';
import { extLogger } from '../../extension';

export class Fabricator {
    /**
     * Creates a file with a extension, and adds it a snippet
     * @param clicker The Uri where the click was made, in case the user invoked this method though out the context menu
     * @param itemType To add a snippet
     * @param resolveNameSP Set to true if the file needs a C# namespace
     */
    static async createItem(
        clicker: Uri,
        filename: string,
        fileExt: string,
        snippetString: string
    ) {
        try {
            let tempFilename: string; // The file name, and local path of the new file
            let fileAsUri: Uri; // The full file dir, as a uri
            let localPath = '';
            let itemSnippet: SnippetString;
            let selectedRootFolder: string;
            let nameSP: string = '';
            let fileExist: boolean;

            // ? Assign a root folder
            selectedRootFolder = await FileSpotter.determinateRootFolder(
                clicker
            );
            if (selectedRootFolder === undefined) {
                throw new Error(`Invalid root folder`);
            }

            // ? Determinate local path
            if (clicker !== undefined) {
                localPath = FileSpotter.determinateLocalPath(
                    selectedRootFolder,
                    clicker
                );
            }

            // ? ask the user for a name
            // filename = 'SPEED_TEST'; // Just to test speed
            tempFilename = await AskToUser.forAnItemName(
                localPath,
                filename,
                fileExt
            );

            // ? Resolve dotnet namespace?
            let resolveCSNameSP = false;
            if (fileExt.toLocaleLowerCase() === '.cs') {
                resolveCSNameSP = true;
            } else if (fileExt.toLowerCase() === '.fs') {
                resolveCSNameSP = true;
            }

            // ? Step four: create a uri for the new file
            fileAsUri = Uri.file(selectedRootFolder + tempFilename + fileExt);

            // ? Creating a new file if it doesn't exist
            fileExist = await FileSpotter.checkIfFileExist(fileAsUri);
            let counter = 1;
            while (fileExist) {
                extLogger.logInfo(
                    `The file ${fileAsUri.fsPath} already exist trying with other`
                );
                fileAsUri = Uri.file(
                    selectedRootFolder + tempFilename + counter + fileExt
                );
                fileExist = await FileSpotter.checkIfFileExist(fileAsUri);
                extLogger.logInfo(`Trying with ${fileAsUri.fsPath}`);
                counter++;
            }
            // ? Resolve namespace if needed
            if (resolveCSNameSP) {
                nameSP = await ProjectGatherer.generateNamespace(
                    fileAsUri!.fsPath,
                    selectedRootFolder
                );
            }
            // ? Get the Snippet
            itemSnippet = TemplateParser.newSnippet(snippetString, nameSP);
            if (!fileExist) {
                await vscode.workspace.fs.writeFile(
                    fileAsUri,
                    new Uint8Array()
                );
                // Create the file
                vscode.commands
                    .executeCommand('vscode.open', fileAsUri)
                    .then(() => {
                        vscode.window.activeTextEditor?.insertSnippet(
                            itemSnippet
                        );
                    });
            } else {
                throw new Error(fileExistMessage);
            }
        } catch (error) {
            if (error instanceof Error) {
                extLogger.logError(error.message);
            } else {
            }
        }
    }
}
