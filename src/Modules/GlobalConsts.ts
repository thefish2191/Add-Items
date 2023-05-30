// Path separators for all Systems
export const sepRegex = /[\/\\]/gm;

// Multiple separators, next to one each other
export const multiSepRegex = /(\/{2,}|\\{2,})/gm;

// Matches the dir on a path, but ignores the filename
export const pathRegex = /^(.*)([\/\\])/gm;

// Matches filename in paths
export const filenameRegex = /([^\\|\/]+[\w\d\s]+)$/;

// Matches the extension of a file
export const fileExtRegex = /(\.[\w]+)$/;

// Multiple period signs together '.'
export const multiplePeriodRegex = /([\.]{2,})/gm;

// Period at the start and end of string
export const trimPeriods = /(^(\.))|((\.)$)/gm;

// Glob pattern for `.csproj` files
export const csprojPattern = '**/*.csproj';

// Matches the following: `[namespaces]`
export const namespacePattern = /(\[namespace\])/gm;

// TODO: Research a better regex for this
// Regex for matching invalid characters in a namespace
export const invalidNamespaceChars = /[<>:"|?*/\\\-+\s]/gm;
