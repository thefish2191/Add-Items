import { SnippetString } from 'vscode';
import { namespacePattern } from '../GlobalConsts';

export class TemplateParser {
    static newSnippet(snippetStg: string, nameSP = '') {
        if (nameSP !== '') {
            snippetStg = snippetStg.replace(namespacePattern, nameSP);
        } else {
        }
        return new SnippetString(snippetStg);
    }
}
