import { SnippetString, Uri, window } from 'vscode';
import DefaultTemplates from './DefaultTemplates.json';
import { storageMng, extLogger } from '../../extension';
import * as commentJson from 'comment-json';
import * as errorMessages from './../Logger/ErrorMessages';
import { AskToUser } from '../AskToUser';
import { Fabricator } from './Fabricator';

export class ItemCreator {
    static async createItem(clicker: Uri, itemType: ItemType) {
        try {
            extLogger.logInfo(`Creating a new ${itemType} item.`);
            let templates: any;
            if (itemType === ItemType.custom) {
                if (await storageMng.fileExist(storageMng.userTemplates)) {
                    let tempTemplates = storageMng.readUserTemplates();
                    try {
                        templates = commentJson.parse(await tempTemplates);
                    } catch (error) {
                        extLogger.logError(
                            `Error at reading the templates file`
                        );
                        throw new Error(errorMessages.templateFileParsingError);
                    }
                } else {
                    throw new Error(errorMessages.templatesFileMissing);
                }
            } else {
                templates = DefaultTemplates;
            }

            let templatesMap = [];
            for (let template in templates) {
                templatesMap.push({
                    label: templates[template]['displayName'],
                    detail: templates[template]['description'],
                    filename: templates[template]['filename'],
                    fileExt: templates[template]['fileExt'],
                    body: templates[template]['body'],
                });
            }

            // Verifying we have at least one template
            if (templatesMap.length < 1) {
                extLogger.logError(`No item templates found!`);
                throw new Error(errorMessages.templateFileEmpty);
            } else {
                extLogger.logInfo(`We found ${templatesMap.length} templates`);
            }

            // The title of the window depends on the item type
            let winTitle: string =
                itemType === ItemType.default ? 'item' : `custom item`;

            extLogger.logActivity(
                `Waiting for the user to select a template...`
            );
            // let user select the template they want
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

            let snippetAsString = '';
            selection?.body.forEach((element: string) => {
                snippetAsString += element + '\r';
            });
            extLogger.logInfo(`Template string created!`);

            extLogger.logInfo(`Template resolution complete`);
            Fabricator.createItem(
                clicker,
                selection.filename,
                selection.fileExt,
                snippetAsString
            );
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
                }
            }
        }
    }
}

export enum ItemType {
    custom = 'custom',
    default = 'default',
}
