import { Uri, window } from 'vscode';
import DefaultTemplates from './DefaultTemplates.json';
import { storageMng, extLogger } from '../../extension';
import { templatesFileMissing } from '../Logger/ErrorMessages';
import * as commentJson from 'comment-json';
import * as errorMessages from './../Logger/ErrorMessages';
import { AskToUser } from '../AskToUser';

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
                    throw new Error(templatesFileMissing);
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
            extLogger.logInfo(`We found ${templatesMap.length} templates`);
            if (templatesMap.length < 1) {
                throw new Error(errorMessages.templateFileEmpty);
            }
            extLogger.logSuccess(`Create ${itemType} item process finished`);
        } catch (error) {
            // We solve most of the problems here:
            if (error instanceof Error) {
                if (error.message === templatesFileMissing) {
                    extLogger.logActivity(
                        `Asking te user to create a new template file`
                    );
                    AskToUser.createTemplateFile();
                }
                if (error.message === errorMessages.templateFileParsingError) {
                    extLogger.logActivity(
                        `Asking the user to fix error(s) on template file`
                    );
                    AskToUser.fixErrorsOnTemplateFiles();
                }
            }
        }
    }
}

export enum ItemType {
    custom = 'custom',
    default = 'default',
}
