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

export function isIncludeFluentWithSetters(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('includeFluentWithSettersGetters') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('includeFluentWithSettersGetters')! as boolean)
    );
}

export function getFluentMethodPrefix(): string {
    return vscode.workspace.getConfiguration('java.code.generators').get('fluentMethodPrefix') || '';
}

export function isGenerateEvenIfExists(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('generateEvenIfExists') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('generateEvenIfExists')! as boolean)
    );
}

export function isOnlyIdForHashAndEquals(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('onlyIdForHashAndEquals') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('onlyIdForHashAndEquals')! as boolean)
    );
}

export function isOnlyPrimitiveForToString(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('onlyPrimitiveForToString') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('onlyPrimitiveForToString')! as boolean)
    );
}

export function copyJsonPropertyAnnotationsFromVariablesToSettersGetters(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('copyJsonPropertyAnnotationsFromVariablesToSettersGetters') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('copyJsonPropertyAnnotationsFromVariablesToSettersGetters')! as boolean)
    );
}

export function includeGeneratedAnnotation(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('includeGeneratedAnnotation') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('includeGeneratedAnnotation')! as boolean)
    );
}

export function fluentCallsNormalSetters(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('fluentCallsNormalSetters') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('fluentCallsNormalSetters')! as boolean)
    );
}

export function includeBeta(): boolean {
    return (
        vscode.workspace.getConfiguration('java.code.generators').has('includeBeta') &&
        (vscode.workspace.getConfiguration('java.code.generators').get<boolean>('includeBeta')! as boolean)
    );
}
