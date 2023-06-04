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
export function mapLanguages(templates: any) {
    let templatesMap = [];
    for (let template in templates) {
        templatesMap.push({
            label: templates[template]['displayName'],
            detail: templates[template]['description'],
            fileExt: templates[template]['fileExt'],
            templates: templates[template]['templates'],
        });
    }
    return templatesMap.sort((langA, langB) => {
        let firstLang = langA.label,
            secondLang = langB.label;
        if (firstLang < secondLang) {
            return -1;
        }
        if (secondLang > firstLang) {
            return 1;
        }
        return 0;
    });
}

export function mapTemplates(templates: any) {
    let templatesMapped = [];
    for (let template in templates) {
        templatesMapped.push({
            label: templates[template]['displayName'],
            detail: templates[template]['description'],
            filename: templates[template]['filename'],
            fileExt: templates[template]['fileExt'],
            body: templates[template]['body'],
            namespace: templates[template]['namespace'],
        });
    }
    return templatesMapped.sort((a, b) => {
        let firstLabel = a.label,
            secondLabel = b.label;
        if (firstLabel < secondLabel) {
            return -1;
        }
        if (secondLabel > firstLabel) {
            return 1;
        }
        return 0;
    });
}
