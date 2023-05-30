import { Uri } from 'vscode';
import {
    csprojPattern,
    invalidNamespaceChars,
    multiplePeriodRegex,
    sepRegex,
    trimPeriods,
} from '../../../GlobalConsts';
import { FileSpotter } from '../../FileSpotter';

export class ProjectGatherer {
    /**
     * Returns a Dotnet namespace based on the folder structure
     * and the projects names.
     * @param targetFile The directory where the new Item will be located.
     * @param rootFolder The root directory, where vs code is open used to generate a raw namespace.
     * @returns A fancy and shiny namespace.
     */
    static async generateCSNamespace(
        targetFile: string,
        rootFolder: string
    ): Promise<string> {
        // The folder where our new file is saved
        let filePath = FileSpotter.removeFilenameFromDir(targetFile);
        // The future namespace
        let candidate: string = '';
        // All the projects in the open folder
        let allProjects = FileSpotter.findFilesThanMatchPattern(csprojPattern);
        let allPossibleParents: Uri[] = [];
        if ((await allProjects).length > 0) {
            (await allProjects).forEach((project) => {
                let projectDir = FileSpotter.removeFilenameFromDir(
                    project.fsPath
                );
                if (filePath.startsWith(projectDir)) {
                    allPossibleParents.push(project);
                }
            });
            if (allPossibleParents.length === 1) {
                let projectName = FileSpotter.getNameNoExtFromDir(
                    allPossibleParents[0].fsPath
                );
                let projectDir = FileSpotter.removeFilenameFromDir(
                    allPossibleParents[0].fsPath
                );
                // guardian.repParent(allPossibleParents[0].fsPath);
                let localPath = filePath.replace(projectDir, '');
                candidate = projectName + '.' + localPath;
            } else {
                candidate = this.generateRawNamespace(filePath, rootFolder);
            }
        } else {
            candidate = this.generateRawNamespace(filePath, rootFolder);
        }
        return this.pathToNamespace(candidate);
    }
    /**
     * Converts a local path to a namespace
     * Ex: /ProjectA/Subfolder => ProjectA.Subfolder
     * @param dir The dir to be parsed
     * @returns A beautiful namespace
     */
    static pathToNamespace(dir: string): string {
        dir = dir.replace(sepRegex, '.');
        dir = dir.replace(multiplePeriodRegex, '.');
        dir = dir.replace(trimPeriods, '');
        dir = dir.replace(invalidNamespaceChars, '');
        return dir;
    }
    static generateRawNamespace(target: string, rootFolder: string) {
        let parent = rootFolder.slice(0, -1);
        parent = FileSpotter.getNameFromDir(parent);
        let local = target.replace(rootFolder, '');
        return this.pathToNamespace(parent + '.' + local);
    }
}
