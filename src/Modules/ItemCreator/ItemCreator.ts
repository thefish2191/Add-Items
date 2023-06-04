import { commands, SnippetString, Uri, window, workspace } from 'vscode';
import { extLogger } from '../../extension';
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
        preRequestedItem: string | undefined = undefined
    ) {
        try {
            // Stops the programs if the user is not in a workspace
            let selectedRootFolder = await FileSpotter.determinateRootFolder(
                clicker,
                itemType
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

            // Reading the templates file, and mapping the languages, and templates
            let rawTemplateFile: any = await getTemplates(itemType);
            let languagesArray: any[] = mapLanguages(rawTemplateFile);
            let selectedLanguage: any = [];
            let selectedTemplate: any = [];
            let selectedLanguageTemplates: any = [];

            // Verifying we have at least one language
            if (languagesArray.length < 1) {
                extLogger.logError(`No languages on the template file!`);
                throw new Error(errorMessages.templateFileEmpty);
            } else {
                extLogger.logInfo(
                    `We found ${languagesArray.length} languages to work with!`
                );
            }
            extLogger.logActivity(
                `Waiting for the user to select a language...`
            );

            // Allows the user to select a language, if the user has a pre-defined language, we will use that
            let preSelectedLanguage: any;
            let preSelectedTemplate: any;
            if (preRequestedItem !== undefined) {
                preSelectedLanguage = splitLanguageString(preRequestedItem);
                preSelectedTemplate = splitTemplate(preRequestedItem);
                selectedLanguage = rawTemplateFile[preSelectedLanguage];
                selectedLanguageTemplates = selectedLanguage.templates;
            } else {
                selectedLanguage = await AskToUser.selectALanguage(
                    languagesArray
                );
            }
            extLogger.logInfo(`User selected: ${selectedLanguage.displayName}`);

            extLogger.logActivity(
                'Waiting for the user to select a template...'
            );
            // Let the user select a template, based on the language
            if (
                (preSelectedTemplate !== undefined ||
                    preSelectedTemplate !== '') &&
                preRequestedItem !== undefined
            ) {
                selectedTemplate =
                    rawTemplateFile[preSelectedLanguage]['templates'][
                        preSelectedTemplate
                    ];
            } else {
                selectedLanguageTemplates = mapTemplates(
                    selectedLanguage.templates
                );
                // Verifying we have at least one template
                if (selectedLanguageTemplates.length < 1) {
                    extLogger.logError(
                        `No templates for the selected language!`
                    );
                    throw new Error(errorMessages.templateFileEmpty);
                } else {
                    extLogger.logInfo(
                        `We found ${selectedLanguageTemplates.length} templates to work with!`
                    );
                }
                selectedTemplate = await AskToUser.selectATemplate(
                    selectedLanguageTemplates,
                    itemType
                );
            }

            extLogger.logInfo(`User selected: ${selectedTemplate.displayName}`);

            // Ensuring the file extension
            let fileExt: string;
            if (
                selectedTemplate['fileExt'] === undefined &&
                selectedLanguage.fileExt === undefined
            ) {
                fileExt = `.txt`;
            } else if (selectedTemplate.fileExt !== undefined) {
                fileExt = selectedTemplate.fileExt;
            } else {
                fileExt = selectedLanguage.fileExt;
            }
            if (!String(fileExt).toLocaleLowerCase().startsWith('.')) {
                fileExt = '.' + fileExt;
            }

            extLogger.logInfo(`Waiting for the user to decide an item name`);
            let tempFilename: string;
            tempFilename = await AskToUser.forAnItemName(
                localPath,
                selectedTemplate.filename,
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

            // Creating the snippet
            let actualSnippet: SnippetString;
            let snippetAsString = '';
            selectedTemplate?.body.forEach((element: string) => {
                snippetAsString += element + '\r';
            });
            extLogger.logInfo(`Template string created!`);
            if (
                selectedLanguage.namespace === true ||
                selectedTemplate.namespace === true
            ) {
                let nameSP: string = '';
                extLogger.logActivity(`Resolving DotNet namespace...`);
                nameSP = await ProjectGatherer.generateCSNamespace(
                    fileAsUri!.fsPath,
                    selectedRootFolder
                );
                actualSnippet = TemplateParser.newSnippet(
                    snippetAsString,
                    nameSP
                );
                extLogger.logInfo(`Namespace resolved: ${nameSP}`);
            } else {
                actualSnippet = TemplateParser.newSnippet(snippetAsString);
                extLogger.logInfo(`There is no need for a namespace`);
            }

            // Creating the file and adding the snippet
            if (!fileExist) {
                extLogger.logActivity(`Creating the actual file now...`);
                await workspace.fs.writeFile(fileAsUri, new Uint8Array());
                commands
                    .executeCommand('vscode.open', fileAsUri)
                    .then(() => {
                        extLogger.logActivity(`Inserting the snippet...`);
                        window.activeTextEditor?.insertSnippet(actualSnippet);
                    })
                    .then(() => {
                        extLogger.logSuccess(`Snippet inserted!!`);
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

function splitLanguageString(req: string) {
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
