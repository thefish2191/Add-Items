import { commands, SnippetString, Uri, window, workspace } from 'vscode';
import { storageMng, extLogger } from '../../extension';
import * as errorMessages from './../Logger/ErrorMessages';
import { AskToUser } from '../AskToUser';
import { FileSpotter } from './FileSpotter';
import { ProjectGatherer } from './LanguageActions/cs/NamespaceGatherer';
import { TemplateParser } from './TemplateParser';
import { ItemType } from './ItemType';
import { getTemplates, mapLanguages, mapTemplates } from './TemplateReader';
import * as vscode from 'vscode';
import path from 'path';

export class ItemCreator {
    static async createItem(
        clicker: Uri,
        itemType: ItemType,
        preReq: string | undefined = undefined
    ) {
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

            // Getting the template file
            let templates: any = await getTemplates(itemType);

            // Mapping the languages in the template files
            let languagesMap: any[] = mapLanguages(templates);

            // Verifying we have at least one language
            if (languagesMap.length < 1) {
                extLogger.logError(`No languages on the template file!`);
                throw new Error(errorMessages.templateFileEmpty);
            } else {
                extLogger.logInfo(`We found ${languagesMap.length} languages`);
            }

            extLogger.logActivity(
                `Waiting for the user to select a language...`
            );
            // getting the stuff for pre requested items
            let preLang: any;
            let preTemplate: any;
            if (preReq !== undefined) {
                preLang = splitLanguage(preReq);
                preTemplate = splitTemplate(preReq);
            }
            // let user select the language they want before continue
            let language: any;
            if (preReq !== undefined) {
                language = templates[preLang];
            } else {
                language = await AskToUser.selectALanguage(languagesMap);
                extLogger.logInfo(`User selected the language: ${language.id}`);
            }

            // Mapping the templates
            let templatesMap: any[];

            // Let the user select a template, based on the language
            let template: any;
            if (preReq !== undefined) {
                extLogger.logInfo(`Pre-defined template requested: ${preReq}`);
                template = templates[preLang]['templates'][preTemplate];
            } else {
                templatesMap = mapTemplates(
                    templates[language.id]['templates']
                );
                // Verifying we have at least one template
                if (templatesMap.length < 1) {
                    extLogger.logError(`No languages on the template file!`);
                    throw new Error(errorMessages.templateFileEmpty);
                } else {
                    extLogger.logInfo(
                        `We found ${languagesMap.length} languages`
                    );
                }
                template = await AskToUser.selectATemplate(
                    templatesMap,
                    itemType
                );
            }

            extLogger.logInfo(`User selected: ${template.label}`);

            // TODO: Verify the template:
            // extLogger.logActivity(`Verifying the snippet before continue`);

            // Ensuring the file extension
            let fileExt: string;
            if (
                template.fileExt === undefined &&
                language.fileExt === undefined
            ) {
                fileExt = ``;
            } else if (template.fileExt !== undefined) {
                fileExt = template.fileExt;
            } else {
                fileExt = language.fileExt;
            }
            if (!String(fileExt).toLocaleLowerCase().startsWith('.')) {
                fileExt = '.' + fileExt;
            }

            extLogger.logInfo(`Waiting for the user to decide an item name`);
            let tempFilename: string;
            tempFilename = await AskToUser.forAnItemName(
                localPath,
                template.filename,
                fileExt
            );

            // Creating a file Uri
            let uriString = selectedRootFolder + tempFilename + fileExt;
            uriString = path.normalize(uriString);
            let fileAsUri = Uri.file(uriString);
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
            template?.body.forEach((element: string) => {
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
                    AskToUser.fixErrorsOnTemplateFiles();
                } else {
                    extLogger.logError(error.name);
                    extLogger.logError(error.message);
                }
            }
        }
    }
}

function splitLanguage(req: string) {
    const langPattern = /^[\w]*/;
    let lang = req.match(langPattern)?.toString();
    if (lang === undefined) {
        throw new Error('Error at requested language');
    }
    return lang;
}
function splitTemplate(req: string) {
    const langPattern = /[\w]*$/;
    let template = req.match(langPattern)?.toString();
    if (template === undefined) {
        throw new Error('Error at requested template');
    }
    return template;
}
