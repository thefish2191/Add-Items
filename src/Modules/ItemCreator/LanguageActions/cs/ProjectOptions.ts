import { Uri, window } from 'vscode';
import { AskToUser } from '../../../AskToUser';
import { csprojPattern } from '../../../GlobalConsts';
import { noProjectsFoundMss } from '../../../Logger/ErrorMessages';
import { FileSpotter } from '../../FileSpotter';

export class ProjectOptions {
    /**
     * Adds references to a csproj
     * @param project The project to add reference
     * @param references The project(s) to reference
     */
    static async addReference(project: Uri) {
        try {
            let projects: Promise<Uri[]>;
            let projectsAbleToReference: Uri[];
            let projectsToReference: Uri[];
            let allProjectsString = '';
            let command = `cd [project] && dotnet add reference`;

            // ensure the project to reference
            projects = FileSpotter.findFilesThanMatchPattern(csprojPattern);
            if ((await projects).length < 1) {
                throw new Error(noProjectsFoundMss);
            }
            if (project === undefined) {
                project = await AskToUser.selectAnURI(projects);
            }
            // unsure the projects to be referenced
            projectsAbleToReference = this.removeUri(project, await projects);
            if (projectsAbleToReference.length < 1) {
                throw new Error(noProjectsFoundMss);
            }
            projectsToReference = await AskToUser.selectMultipleURI(
                projectsAbleToReference
            );
            projectsToReference.forEach((item) => {
                allProjectsString += ` ${item.fsPath}`;
            });
            command += allProjectsString;
            command = command.replace(
                `[project]`,
                FileSpotter.removeFilenameFromDir(project.fsPath)
            );
            this.excecuteConsoleCommand(command);
            // vscode.window.createTerminal().sendText(command);
        } catch (error) {
            if (error instanceof Error) {
            } else {
            }
        }
    }
    static async build(selectedProject: Uri) {
        let projects: Promise<Uri[]>;
        projects = FileSpotter.findFilesThanMatchPattern(csprojPattern);

        if (selectedProject === undefined) {
            selectedProject = await AskToUser.selectAnURI(projects);
        }
        let command = `cd [project] && dotnet build`;
        command = command.replace(
            `[project]`,
            FileSpotter.removeFilenameFromDir(selectedProject.fsPath)
        );
        this.excecuteConsoleCommand(command);
        window.activeTerminal?.sendText(command);
    }
    /**
     * Remove a URI from a URI array.
     * A new URI[] is returned every time
     * @param uriToRemove
     * @param uriArray
     * @returns A URI[]
     */
    static removeUri(uriToRemove: Uri, uriArray: Uri[]) {
        let allUriStrings: string[] = [];
        let allUri: Uri[] = [];
        uriArray.forEach((element) => {
            if (element.fsPath !== uriToRemove.fsPath) {
                allUriStrings.push(element.fsPath);
            }
        });
        allUriStrings.forEach((element) => {
            allUri.push(Uri.file(element));
        });
        return allUri;
    }
    /**
     * Excecute a command in a new terminal
     * @param command A valid command
     */
    static excecuteConsoleCommand(command: string) {
        let myTerminalName = 'csharp-stuff';
        window
            .createTerminal({
                name: myTerminalName,
            })
            .sendText(command);
    }
}
