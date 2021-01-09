import { parse } from 'java-ast';
import { ClassBodyDeclarationContext, ModifierContext, TypeDeclarationContext, VariableDeclaratorContext } from 'java-ast/dist/parser/JavaParser';
import { compact, isEqual } from 'lodash-es';
import * as vscode from 'vscode';
import { Decleration } from './decleration';
import { JavaClass } from './java-class';
import { copyJsonPropertyAnnotationsFromVariablesToSettersGetters } from './settings';

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function lowerCaseFirstLetter(string: string): string {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

export function insertSnippet(snippet: string, editor: vscode.TextEditor) {
    let newLines = editor.document.lineAt(editor.selection.active.line).isEmptyOrWhitespace ? 0 : 1;
    editor.insertSnippet(new vscode.SnippetString(snippet), new vscode.Position(editor.selection.end.line + newLines, 0));
}

export async function getSelectedJavaClass(editor: vscode.TextEditor | undefined, neededFields?: any): Promise<JavaClass> {
    const javaClasses: JavaClass[] = [];
    let selectedText = '';
    if (editor) {
        selectedText = editor.document.getText();
        let parsedCode;
        try {
            parsedCode = parse(selectedText);
        } catch (error) {
            vscode.window.showErrorMessage('error parsing the Java class check for syntax errors');
            return Promise.reject('error parsing the Java class check for syntax errors');
        }
        parsedCode.typeDeclaration().forEach((type: TypeDeclarationContext) => {
            let declerations: Decleration[] = [];
            let className = '';
            let methodsNames: string[] = [];
            let hasEmptyConstructor = false;
            let hasNoneEmptyConstructor = false;
            try {
                className = type.classDeclaration()!.IDENTIFIER()!.text;
            } catch (error) {}
            try {
                let params = compact(
                    type
                        .classDeclaration()!
                        .classBody()
                        .classBodyDeclaration()
                        .map(itit => {
                            try {
                                return itit
                                    .memberDeclaration()!
                                    .fieldDeclaration()!
                                    .variableDeclarators()!
                                    .variableDeclarator()!
                                    .map(it => it.variableDeclaratorId().text)[0];
                            } catch (error) {}
                        })
                );

                type.classDeclaration()!
                    .classBody()!
                    .classBodyDeclaration()
                    .forEach((classBodyDeclaration: ClassBodyDeclarationContext) => {
                        try {
                            if (classBodyDeclaration.memberDeclaration()!.constructorDeclaration()!.formalParameters()!.formalParameterList() === undefined) {
                                hasEmptyConstructor = true;
                            } else {
                                const constructorParams = classBodyDeclaration
                                    .memberDeclaration()!
                                    .constructorDeclaration()!
                                    .formalParameters()!
                                    .formalParameterList()!
                                    .formalParameter()!
                                    .map(it => it.variableDeclaratorId().text);

                                hasNoneEmptyConstructor = hasNoneEmptyConstructor || isEqual((neededFields || params).sort(), constructorParams.sort());
                            }
                        } catch (error) {}

                        try {
                            methodsNames.push(classBodyDeclaration.memberDeclaration()!.methodDeclaration()!.IDENTIFIER()!.text);
                        } catch (error) {}

                        try {
                            let isStatic = false;
                            let isFinal = false;
                            let isFinalValueAlradySet = false;

                            classBodyDeclaration.modifier().forEach((modifier: ModifierContext) => {
                                if (modifier.classOrInterfaceModifier()!.STATIC()) {
                                    isStatic = true;
                                }
                                if (modifier.classOrInterfaceModifier()!.FINAL()) {
                                    isFinal = true;
                                    try {
                                        if (
                                            classBodyDeclaration.memberDeclaration()!.fieldDeclaration()!.variableDeclarators()!.variableDeclarator(0)!.variableInitializer()!.text
                                        ) {
                                            isFinalValueAlradySet = true;
                                        }
                                    } catch (error) {}
                                }
                            });

                            let jsonPropertyAnnotation: string;
                            if (copyJsonPropertyAnnotationsFromVariablesToSettersGetters()) {
                                const modifiers = classBodyDeclaration.modifier();
                                modifiers.forEach(modifire => {
                                    const annotation = modifire.classOrInterfaceModifier()!.annotation();
                                    if (annotation) {
                                        if (annotation.getChild(1).text === 'JsonProperty') {
                                            jsonPropertyAnnotation = annotation.text;
                                        }
                                    }
                                });
                            }
                            const variableType = classBodyDeclaration.memberDeclaration()!.fieldDeclaration()!.typeType().text;

                            if (!isStatic) {
                                classBodyDeclaration
                                    .memberDeclaration()!
                                    .fieldDeclaration()!
                                    .variableDeclarators()!
                                    .variableDeclarator()!
                                    .forEach((variableDeclarator: VariableDeclaratorContext) =>
                                        declerations.push(
                                            new Decleration(variableType, variableDeclarator!.variableDeclaratorId()!.text, isFinal, isFinalValueAlradySet, jsonPropertyAnnotation)
                                        )
                                    );
                            }
                        } catch (error) {}
                    });
            } catch (error) {
                console.error(error);
                vscode.window.showWarningMessage('check for syntax errors before using the generator');
                return Promise.reject('error parsing the Java class check for syntax errors');
            }

            javaClasses.push(new JavaClass(className, declerations, methodsNames, hasEmptyConstructor, hasNoneEmptyConstructor));
        });
    }

    if (javaClasses.length === 0) {
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
            detail: javaClass.name,
        });
    });
    let name = await vscode.window.showQuickPick(items, {
        canPickMany: false,
        placeHolder: 'please pick...',
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
