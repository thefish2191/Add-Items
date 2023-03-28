import { SnippetString } from 'vscode';
import { namespacePattern } from '../GlobalConsts';

export class TemplateParser {
    static newSnippet(snippetStg: string, nameSP: string) {
        let fancySnippet = snippetStg.replace(namespacePattern, nameSP);
        return new SnippetString(fancySnippet);
    }
}
