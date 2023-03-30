import * as commentJson from 'comment-json';
import { storageMng, extLogger } from '../../extension';
import { ItemType } from './ItemType';
import * as errorMessages from './../Logger/ErrorMessages';
import DefaultTemplates from './DefaultTemplates.json';

export async function getTemplates(itemType: ItemType) {
    extLogger.logInfo(`Creating a new ${itemType} item.`);
    let templates: any;
    if (itemType === ItemType.custom) {
        if (await storageMng.fileExist(storageMng.userTemplates)) {
            let tempTemplates = storageMng.readUserTemplates();
            try {
                templates = commentJson.parse(await tempTemplates);
            } catch (error) {
                extLogger.logError(`Error at reading the templates file`);
                throw new Error(errorMessages.templateFileParsingError);
            }
        } else {
            throw new Error(errorMessages.templatesFileMissing);
        }
    } else {
        templates = DefaultTemplates;
    }
    return templates;
}
export function mapTemplates(templates: any) {
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
    return templatesMap;
}
export function mapTemplate(templates: any) {
    let templatesMap = [];
    for (let template in templates) {
        templatesMap.push({
            label: templates['displayName'],
            detail: templates['description'],
            filename: templates['filename'],
            fileExt: templates['fileExt'],
            body: templates['body'],
        });
    }
    return templatesMap;
}