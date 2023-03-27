import { window } from 'vscode';
import { storageMng, extLogger } from '../extension';
export class AskToUser {
    static createTemplateFile() {
        window
            .showErrorMessage(
                `The templates file does not exist. Do you want to create it know?`,
                'Yes',
                'No'
            )
            .then((answer) => {
                if ((answer = 'Yes')) {
                    extLogger.reportWarning(`Replacing the templates file`);
                    storageMng.restoreDefaultUserTemplates();
                }
            });
    }
    static fixErrorsOnTemplateFiles() {
        window
            .showErrorMessage(
                `There are some error(s) in your template files, please fix the error(s) before trying to create a new file`,
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
}
