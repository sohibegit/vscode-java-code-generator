import * as vscode from 'vscode';

export function getMethodOpeningBraceOnNewLine(): string {
    if (
        vscode.workspace.getConfiguration('java.code.generators').has('methodOpeningBraceOnNewLine') &&
        vscode.workspace.getConfiguration('java.code.generators').get('methodOpeningBraceOnNewLine')
    ) {
        return '\n\t';
    }
    return '';
}

export function isIncludeFluentWithSettersGetters(): boolean | undefined {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('includeFluentWithSettersGetters') &&
        vscode.workspace.getConfiguration('java.code.generators').get('includeFluentWithSettersGetters')
    );
}
