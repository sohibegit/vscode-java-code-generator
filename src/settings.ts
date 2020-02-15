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

export function isIncludeFluentWithSetters(): boolean | undefined {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('includeFluentWithSettersGetters') &&
        vscode.workspace.getConfiguration('java.code.generators').get('includeFluentWithSettersGetters')
    );
}

export function getFluentMethodPrefix(): string {
    return vscode.workspace.getConfiguration('java.code.generators').get('fluentMethodPrefix') || '';
}

export function isGenerateEvenIfExists(): boolean | undefined {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('generateEvenIfExists') &&
        vscode.workspace.getConfiguration('java.code.generators').get('generateEvenIfExists')
    );
}

export function isOnlyIdForHashAndEquals(): boolean | undefined {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('onlyIdForHashAndEquals') &&
        vscode.workspace.getConfiguration('java.code.generators').get('onlyIdForHashAndEquals')
    );
}

export function isOnlyPrimitiveForToString(): boolean | undefined {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('onlyPrimitiveForToString') &&
        vscode.workspace.getConfiguration('java.code.generators').get('onlyPrimitiveForToString')
    );
}

export function copyJsonPropertyAnnotationsFromVariablesToSettersGetters(): boolean | undefined {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('copyJsonPropertyAnnotationsFromVariablesToSettersGetters') &&
        vscode.workspace.getConfiguration('java.code.generators').get('copyJsonPropertyAnnotationsFromVariablesToSettersGetters')
    );
}
