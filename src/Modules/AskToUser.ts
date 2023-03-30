import { Uri, window } from 'vscode';
import { storageMng, extLogger } from '../extension';
import * as vscode from 'vscode';
import {
    emptyArrayMss,
    invalidNameMss,
    noOpenFolderMessage,
    processAbortedMessage,
} from './Logger/ErrorMessages';
import path from 'path';
import { FileSpotter } from './ItemCreator/FileSpotter';
import { multiSepRegex } from './GlobalConsts';
import { ItemType } from './ItemCreator/ItemType';
import * as errorMessages from './Logger/ErrorMessages';

export class AskToUser {
    static createTemplateFile() {
        window
            .showErrorMessage(
                `The templates file does not exist. Do you want to create it know?`,
                'Yes',
                'No'
            )
            .then((answer) => {
                if (answer === 'Yes') {
                    extLogger.reportWarning(`Creating a new templates files`);
                    storageMng.restoreDefaultUserTemplates(true);
                } else if (answer === 'No') {
                    extLogger.logInfo(`User decided not to continue`);
                }
            });
    }
    static fixErrorsOnTemplateFiles() {
        window
            .showErrorMessage(
                `There are some error(s) in your template files, or it is empty, please fix the error(s) before trying to create a new file`,
                'Open file',
                'Restore to original'
            )
            .then((answer) => {
                if (answer === 'Open file') {
                    storageMng.openUserTemplates();
                } else if (answer === `Restore to original`) {
                    storageMng.restoreDefaultUserTemplates(true);
                }
            });
    }
    /**
     * Prompts an input box, to ask the user a file name, it also clean the name, to avoid having multiple path separators
     * and replace the path separator with the correct for the current OS, in case the user typed the wrong one
     * @param localPath In case there is already a local path
     * @param customName Ex: Class, UnitText
     * @param fileExtension Ex: '.cs'
     * @returns
     */
    static async forAnItemName(
        localPath: string,
        customName: string,
        fileExtension: string
    ) {
        if (!fileExtension.startsWith('.')) {
            fileExtension = '.' + fileExtension;
        }
        let itemName: string | undefined;

        let fullLength = localPath.length + customName.length;
        itemName = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: '',
            prompt: '',
            title: `Adding a new ${customName}${fileExtension}`,
            value: localPath + customName + fileExtension,
            valueSelection: [localPath.length, fullLength],
        });
        if (itemName === undefined || itemName === '') {
            throw new Error(processAbortedMessage);
        }
        let check = itemName.replace(fileExtension, '');
        if (check === '') {
            throw new Error(invalidNameMss);
        }
        itemName = itemName!.replace(multiSepRegex, path.sep);
        if (itemName.startsWith('/') || itemName.startsWith('\\')) {
            itemName = itemName.substring(1);
        }
        if (itemName.endsWith(fileExtension)) {
            itemName = itemName.replace(fileExtension, '');
        }
        return itemName;
    }
    /**
     * Shows a quick pick to allow the user to select one URI, from a URI array
     * Each Uri is shown as follows:
     *  ? Name of the file
     *  ? Full Uri path
     * @param uriArray All the URIs to select from
     * @returns The selected URI
     */
    static async selectAnURI(uriArray: Promise<Uri[]>): Promise<Uri> {
        let projectPicks = (await uriArray).map((project) => {
            return {
                label: FileSpotter.getNameNoExtFromDir(project.fsPath),
                detail: project.fsPath,
            };
        });
        if (projectPicks.length < 1) {
            throw new Error(emptyArrayMss);
        }
        const userSelection = await window.showQuickPick(projectPicks, {
            canPickMany: false,
            ignoreFocusOut: true,
            title: 'Select the project to add reference(s).',
            matchOnDetail: true,
            placeHolder: 'Add a reference to the following project',
        });
        if (userSelection === undefined) {
            throw new Error(processAbortedMessage);
        }
        let selectedProjects = Uri.file(userSelection?.detail!);
        return selectedProjects;
        
    }
    /**
     * Shows a quick pick to allow the user to select multiple URI, from a URI array
     * Each Uri is shown as follows:
     *  ? Name of the file
     *  ? Full Uri path
     * @param uriArray All the URIs to select from
     * @returns All the selected URIs in a new array
     */
    static async selectMultipleURI(uriArray: Uri[]): Promise<Uri[]> {
        if (uriArray.length < 1) {
            throw new Error(emptyArrayMss);
        }
        let projectPicks = uriArray.map((project) => {
            return {
                label: FileSpotter.getNameNoExtFromDir(project.fsPath),
                detail: project.fsPath,
            };
        });
        let selectedProjects: Uri[] = [];
        const userSelection = await window.showQuickPick(projectPicks, {
            canPickMany: true,
            ignoreFocusOut: true,
            title: 'Select the project to be referenced.',
            placeHolder:
                'Make sure you tick the box, either with a click or pressing space!',
        });
        if (userSelection === undefined || userSelection.length < 1) {
            throw new Error(processAbortedMessage);
        }
        userSelection!.forEach((element) => {
            selectedProjects.push(Uri.file(element.detail));
        });
        return selectedProjects;
    }
    /**
     * Ask the user to select a root folder, in case only one is open, it returns it
     * automatically, and in case there are no open folders, it throws an error
     * @returns A root folder with a path separator at the end, as a string
     */
    static async selectARootFolder(): Promise<string> {
        let folders = vscode.workspace.workspaceFolders;
        let selectedRootFolder = '';
        if (folders === undefined) {
            throw new Error(noOpenFolderMessage);
        } else if (folders.length === 1) {
            selectedRootFolder = folders[0].uri.fsPath + path.sep;
        } else {
            const userOption = await vscode.window.showWorkspaceFolderPick({
                ignoreFocusOut: true,
                placeHolder: 'Select the destination folder',
            });
            if (userOption !== undefined) {
                selectedRootFolder = userOption.uri.fsPath + path.sep;
            } else {
                throw new Error(processAbortedMessage);
            }
        }
        return selectedRootFolder;
    }
    static async selectATemplate(templatesMap: any[], itemType: ItemType) {
        // The title of the window depends on the item type
        let winTitle: string =
            itemType === ItemType.default ? 'item' : `custom item`;
        let selection = await window.showQuickPick(templatesMap, {
            canPickMany: false,
            ignoreFocusOut: true,
            placeHolder: `Select a template to create a new ${winTitle}.`,
            title: `Creating a new ${winTitle}.`,
            matchOnDescription: true,
            matchOnDetail: true,
        });
        if (selection === undefined) {
            throw new Error(errorMessages.userAborted);
        }
        return selection;
    }
    static async areYouSureToReplaceTemplates() {
        vscode.window
            .showInformationMessage(
                `Are you sure you want to replace the file? You will lose all the information within it`,
                'Replace it!',
                `Cancel`
            )
            .then((answer) => {
                if (answer === `Replace it!`) {
                    extLogger.reportWarning(
                        `The file is now being overwritten`
                    );
                    storageMng.restoreDefaultUserTemplates(true);
                } else if (answer === 'Cancel') {
                    extLogger.logInfo(
                        `The user decided not no replace the file!`
                    );
                }
            });
    }
}
