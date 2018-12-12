'use strict';
import { parse } from 'java-ast';
import * as vscode from 'vscode';
import { Decleration } from './decleration';
import { JavaClass } from './java-class';

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function lowerCaseFirstLetter(string: string): string {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

export function insertSnippet(snippet: string, editor: any) {
    let newLines = editor.document.lineAt(editor.selection.active.line).isEmptyOrWhitespace ? 0 : 1;
    editor.insertSnippet(new vscode.SnippetString(snippet), new vscode.Position(editor.selection.end.line + newLines, 0));
}

export async function getSelectedJavaClass(editor: vscode.TextEditor | undefined): Promise<JavaClass> {
    const javaClasses: JavaClass[] = [];
    let selectedText = '';
    if (editor) {
        // selectedText = editor.document.getText(editor.selection);
        // if (selectedText.length >= 2) {
        //     selectedText = `package TmpSohibeTmp; public class TmpSohibeTmp { ${selectedText} }`;
        // } else {
        selectedText = editor.document.getText();
        // }
        let parsedCode;
        try {
            parsedCode = parse(selectedText);
        } catch (error) {
            vscode.window.showErrorMessage('error parsing the Java class check for syntax errors');
            return Promise.reject('error parsing the Java class check for syntax errors');
        }
        parsedCode.typeDeclaration().forEach(type => {
            let declerations: Decleration[] = [];
            let className = '';
            let methodsNames: string[] = [];
            let hasEmptyConstructor = false;
            let hasNoneEmptyConstructor = false;
            try {
                className = type.classDeclaration()!.IDENTIFIER()!.text;
            } catch (error) {}
            try {
                type.classDeclaration()!
                    .classBody()!
                    .classBodyDeclaration()
                    .forEach(classBodyDeclaration => {
                        try {
                            if (
                                classBodyDeclaration
                                    .memberDeclaration()!
                                    .constructorDeclaration()!
                                    .formalParameters()!
                                    .formalParameterList() === undefined
                            ) {
                                hasEmptyConstructor = true;
                            } else {
                                hasNoneEmptyConstructor = true;
                            }
                        } catch (error) {}

                        try {
                            methodsNames.push(
                                classBodyDeclaration
                                    .memberDeclaration()!
                                    .methodDeclaration()!
                                    .IDENTIFIER()!.text
                            );
                        } catch (error) {}

                        try {
                            let isStatic = false;
                            let isFinal = false;
                            let isFinalValueAlradySet = false;

                            classBodyDeclaration.modifier().forEach(modifier => {
                                if (modifier.classOrInterfaceModifier()!.STATIC()) {
                                    isStatic = true;
                                }
                                if (modifier.classOrInterfaceModifier()!.FINAL()) {
                                    isFinal = true;
                                    try {
                                        if (
                                            classBodyDeclaration
                                                .memberDeclaration()!
                                                .fieldDeclaration()!
                                                .variableDeclarators()!
                                                .variableDeclarator(0)!
                                                .variableInitializer()!.text
                                        ) {
                                            isFinalValueAlradySet = true;
                                        }
                                    } catch (error) {}
                                }
                            });

                            const variableType = classBodyDeclaration
                                .memberDeclaration()!
                                .fieldDeclaration()!
                                .typeType().text;

                            const variablenameName = classBodyDeclaration
                                .memberDeclaration()!
                                .fieldDeclaration()!
                                .variableDeclarators()!
                                .variableDeclarator()[0]
                                .variableDeclaratorId().text;

                            if (!isStatic) {
                                declerations.push(new Decleration(variableType, variablenameName, isFinal, isFinalValueAlradySet));
                            }
                        } catch (error) {}
                    });
            } catch (error) {
                vscode.window.showWarningMessage('check for syntax errors before using the generator');
                return Promise.reject('error parsing the Java class check for syntax errors');
            }

            javaClasses.push(new JavaClass(className, declerations, methodsNames, hasEmptyConstructor, hasNoneEmptyConstructor));
            console.log(javaClasses);
        });
    }

    if (javaClasses.length === 0) {
        console.log('javaClasses.length === 0');
        vscode.window.showErrorMessage('error parsing the Java class please file an issue');
        return Promise.reject('error parsing the Java class please file an issue');
    }

    if (javaClasses.length === 1) {
        return javaClasses[0];
    }

    let items: vscode.QuickPickItem[] = [];

    javaClasses!.forEach(javaClass => {
        items.push({
            label: javaClass.name,
            detail: javaClass.name
        });
    });
    let name = await vscode.window.showQuickPick(items, {
        canPickMany: false,
        placeHolder: 'please pick...'
    });

    for (let index = 0; index < javaClasses.length; index++) {
        const javaClass = javaClasses[index];
        if (name && javaClass.name === name.label) {
            return javaClass;
        }
    }

    vscode.window.showErrorMessage('error parsing the Java class please file an issue');
    return Promise.reject('error parsing the Java class please file an issue');
}
