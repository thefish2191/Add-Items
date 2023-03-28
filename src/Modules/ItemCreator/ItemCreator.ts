import { commands, SnippetString, Uri, window, workspace } from 'vscode';
import { storageMng, extLogger } from '../../extension';
import * as errorMessages from './../Logger/ErrorMessages';
import { AskToUser } from '../AskToUser';
import { FileSpotter } from './FileSpotter';
import { ProjectGatherer } from './LanguageActions/cs/NamespaceGatherer';
import { TemplateParser } from './TemplateParser';
import { ItemType } from './ItemType';
import { getTemplates, mapTemplates } from './TemplateReader';
import * as vscode from 'vscode';

export class ItemCreator {
    static async createItem(clicker: Uri, itemType: ItemType, preReq = '') {
        try {
            // Prepare the file according to vs work workspace
            let selectedRootFolder = await FileSpotter.determinateRootFolder(
                clicker
            );
            if (selectedRootFolder === undefined) {
                vscode.window.showErrorMessage(`Please select a valid folder`);
                throw new Error(`Invalid root folder`);
            }
            extLogger.logInfo(`Root folder is: ${selectedRootFolder}`);
            let localPath = '';
            if (clicker !== undefined) {
                localPath = FileSpotter.determinateLocalPath(
                    selectedRootFolder,
                    clicker
                );
            }
            extLogger.logInfo(`Local path is: ${localPath}`);

            // Getting the templates
            let templates: any = await getTemplates(itemType);
            let templatesMap: any[] = await mapTemplates(templates);

            // Verifying we have at least one template
            if (templatesMap.length < 1) {
                extLogger.logError(`No item templates found!`);
                throw new Error(errorMessages.templateFileEmpty);
            } else {
                extLogger.logInfo(`We found ${templatesMap.length} templates`);
            }

            extLogger.logActivity(
                `Waiting for the user to select a template...`
            );
            // let user select the template they want
            let selection: any;
            if (preReq === '') {
                selection = await AskToUser.selectATemplate(
                    templatesMap,
                    itemType
                );
                console.log(selection);
            } else {
                extLogger.logInfo(`Pre-defined template requested: ${preReq}`);
                selection[preReq];
            }
            extLogger.logInfo(`User selected: ${selection.label}`);

            extLogger.logActivity(`Verifying the snippet before continue`);
            if (
                selection.label === undefined ||
                selection.filename === undefined ||
                selection.fileExt === undefined ||
                selection.body === undefined
            ) {
                throw new Error(errorMessages.templateError);
            }
            extLogger.logInfo(`Template looks good!`);

            let fileExt: string = selection.fileExt;
            if (!String(fileExt).toLocaleLowerCase().startsWith('.')) {
                fileExt = '.' + fileExt;
            }

            extLogger.logInfo(`Waiting for the user to decide a item name`);
            let tempFilename: string;
            tempFilename = await AskToUser.forAnItemName(
                localPath,
                selection.filename,
                fileExt
            );

            // Creating a file Uri
            let fileAsUri = Uri.file(
                selectedRootFolder + tempFilename + fileExt
            );
            let fileExist = await FileSpotter.checkIfFileExist(fileAsUri);
            let counter = 1;
            extLogger.logInfo(`The new file is: ${fileAsUri.fsPath}`);
            while (fileExist) {
                extLogger.logInfo(
                    `The file ${fileAsUri.fsPath} already exist!`
                );
                fileAsUri = Uri.file(
                    selectedRootFolder + tempFilename + counter + fileExt
                );
                fileExist = await FileSpotter.checkIfFileExist(fileAsUri);
                extLogger.logInfo(`Trying with ${fileAsUri.fsPath}`);
                counter++;
            }

            // Crating the snippet
            let actualSnippet: SnippetString;
            let snippetAsString = '';
            selection?.body.forEach((element: string) => {
                snippetAsString += element + '\r';
            });
            extLogger.logInfo(`Template string created!`);
            if (
                fileExt.toLocaleLowerCase() === '.cs' ||
                fileExt.toLowerCase() === '.fs'
            ) {
                let nameSP: string = '';
                extLogger.logActivity(`Resolving DotNet namespace...`);
                nameSP = await ProjectGatherer.generateNamespace(
                    fileAsUri!.fsPath,
                    selectedRootFolder
                );
                actualSnippet = TemplateParser.newSnippet(
                    snippetAsString,
                    nameSP
                );
            } else {
                actualSnippet = TemplateParser.newSnippet(snippetAsString);
                extLogger.logInfo(`There is no need for a namespace`);
            }

            // Creating the file and adding the snippet
            if (!fileExist) {
                extLogger.logActivity(`Creating the file now...`);
                await workspace.fs.writeFile(fileAsUri, new Uint8Array());
                commands.executeCommand('vscode.open', fileAsUri).then(() => {
                    extLogger.logActivity(`Inserting the snippet`);
                    window.activeTextEditor?.insertSnippet(actualSnippet);
                });
            } else {
                throw new Error(errorMessages.fileExistMessage);
            }
            extLogger.logSuccess(`Create ${itemType} item process finished`);
        } catch (error) {
            // We solve most of the problems here:
            if (error instanceof Error) {
                if (error.message === errorMessages.templatesFileMissing) {
                    extLogger.logActivity(
                        `Asking te user to create a new template file`
                    );
                    AskToUser.createTemplateFile();
                } else if (
                    error.message === errorMessages.templateFileParsingError ||
                    error.message === errorMessages.templateFileEmpty
                ) {
                    extLogger.logActivity(
                        `Asking the user to fix error(s) on template file`
                    );
                    AskToUser.fixErrorsOnTemplateFiles();
                } else if (error.message === errorMessages.userAborted) {
                    extLogger.logError(`Process aborted by the user`);
                } else if (error.message === errorMessages.templateError) {
                    extLogger.logError(`Template has missing properties`);
                } else {
                    extLogger.logError(error.name);
                    extLogger.logError(error.message);
                }
            }
        }
    }
}

export { ItemType };
