import { GlobPattern, Uri } from 'vscode';
import * as vscode from 'vscode';
import * as path from 'path';
import { fileExtRegex, filenameRegex, pathRegex } from '../GlobalConsts';
import { AskToUser } from '../AskToUser';
import { ItemType } from './ItemType';

export class FileSpotter {
    /**
     * Automatically assign a root folder if a valid URI was provided, otherwise
     * ask the user to select a folder if there are multiple folders open, if
     * only one is open, returns it automatically
     * @param clicker In case the user invoked this method with the context menu
     * a URI will will be given, use it here.
     * @returns A string path of a folder, terminated with a path separator
     */
    static async determinateRootFolder(
        clicker: Uri,
        itemType: ItemType
    ): Promise<string> {
        if (clicker === undefined) {
            return await AskToUser.selectARootFolder(itemType);
        } else {
            return await this.assignRootFolder(clicker);
        }
    }

    /**
     * Assign a root folder, from the opened folder list, that matches the
     * given URI. If there is nested open folders, it will not check for errors
     * @param clicker the origin to search for a root folder
     * @returns A root folder with a path separator at the end as a string
     */
    private static async assignRootFolder(clicker: Uri) {
        let temClicker = clicker.fsPath + path.sep;
        let folders = vscode.workspace.workspaceFolders;
        let foldersArray: string[] = [];
        let matchFolder: string[] = [];
        let assignedRootFolder: string;
        if (folders === undefined) {
            throw new Error('There are no folders in this workspace!');
        } else {
            folders.forEach((element) => {
                foldersArray.push(element.uri.fsPath + path.sep);
            });
        }
        foldersArray.forEach((element) => {
            if (temClicker.startsWith(element)) {
                matchFolder.push(element);
            }
        });
        assignedRootFolder = matchFolder[0];

        return assignedRootFolder;
    }
    /**
     * Determine the local path, using the root folder as a reference,
     * cutting the part where they match
     * @param rootFolder Where vscode is open
     * @param clicker The full item/folder path
     * @returns a local path string
     */
    static determinateLocalPath(rootFolder: string, clicker: Uri) {
        let tempClicker = clicker.fsPath + path.sep;
        let localPath = tempClicker.replace(rootFolder, '');
        return localPath;
    }
    /**
     * Checks of the file exist by trying to read it
     * @param file the file to check
     * @returns true if the file exist
     */
    static async checkIfFileExist(file: Uri): Promise<boolean> {
        let fileExist = true;
        try {
            await vscode.workspace.fs.readFile(file);
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'EntryNotFound (FileSystemError)') {
                    fileExist = false;
                }
            }
        }
        return fileExist;
    }
    /**
     * Search in all open folders in vscode for all files that matches the
     * given pattern.
     * @param pattern more info here: https://www.malikbrowne.com/blog/a-beginners-guide-glob-patterns/
     * @returns An array of URI of all the matches
     */
    static async findFilesThanMatchPattern(pattern: GlobPattern) {
        let matchesDirs: Uri[] = [];
        let rawDirsWithName = await vscode.workspace.findFiles(pattern);
        rawDirsWithName.forEach((element) => {
            matchesDirs.push(element);
        });
        return matchesDirs;
    }
    /**
     * Removes the filename of a path using a regex
     * @param path the path to remove the name
     * @returns just the path
     */
    static removeFilenameFromDir(path: string): string {
        let temp = path.replace(filenameRegex, '');
        return temp;
    }
    /**
     * Returns the name of a file from a full path
     * @param path the full path of a file
     * @returns just the name
     */
    static getNameFromDir(path: string) {
        return path.replace(pathRegex, '');
    }
    /**
     * Removes both the name and the file extension from a full path
     * @param path the full path of a file
     * @returns just the name
     */
    static getNameNoExtFromDir(path: string) {
        let temp = this.getNameFromDir(path);
        return temp.replace(fileExtRegex, '');
    }
}
