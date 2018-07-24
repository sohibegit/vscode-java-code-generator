'use strict';
import * as vscode from 'vscode';
import { Decleration } from './decleration';

export function activate(context: vscode.ExtensionContext) {


    let disposable = vscode.commands.registerCommand('extension.javaGenerateSettersGetters', () => {

        let editor = vscode.window.activeTextEditor!;
        if (!editor) {
            return;
        }
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        let insertNewLine = text.charAt(text.length - 1) !== '\n';
        if (text.length < 2) {
            vscode.window.showErrorMessage('select the properties first.');
            return;
        }
        try {
            editor.edit(
                edit => editor.selections.forEach(
                    selection => {
                        if (insertNewLine) {
                            edit.insert(selection.end, '\n' + generateSetterGetters(text));
                        } else {
                            edit.insert(selection.end, generateSetterGetters(text));
                        }
                    }
                )
            );
        }
        catch (error) {
            console.error(error);
            vscode.window.showErrorMessage(error.getText);
        }

    });

    let disposable2 = vscode.commands.registerCommand('extension.javaGenerateToString', () => {
        let editor = vscode.window.activeTextEditor!;
        if (!editor) {
            return;
        }
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        let insertNewLine = text.charAt(text.length - 1) !== '\n';
        if (text.length < 2) {
            vscode.window.showErrorMessage('select the properties first.');
            return;
        }
        try {
            editor.edit(
                edit => editor.selections.forEach(
                    selection => {
                        if (insertNewLine) {
                            edit.insert(selection.end, '\n' + generateToString(text));
                        } else {
                            edit.insert(selection.end, generateToString(text));
                        }
                    }
                )
            );
        }
        catch (error) {
            console.error(error);
            vscode.window.showErrorMessage(error.getText);
        }


    });

    let generateConstructor = vscode.commands.registerCommand('extension.javaGenerateConstructor', () => {
        let editor = vscode.window.activeTextEditor!;
        if (!editor) {
            return;
        }
        let className = getClassName(editor.document.getText());
        console.log(className);
        let result = `\n\tpublic ${className}() {\n\t}\n`;
        let snippet = new vscode.SnippetString();
        snippet.appendText(result);
        editor.insertSnippet(snippet, new vscode.Position(editor.selection.active.line, 0));
    });

    let generateConstructorUsingFields = vscode.commands.registerCommand('extension.javaGenerateConstructorUsingFields', () => {
        let editor = vscode.window.activeTextEditor!;
        if (!editor) {
            return;
        }
        let className = getClassName(editor.document.getText());
        console.log(className);
        let result = `\n\tpublic ${className}(`;

        let selection = editor.selection;
        let text = editor.document.getText(selection);
        let insertNewLine = text.charAt(text.length - 1) !== '\n';
        if (text.length < 2) {
            vscode.window.showErrorMessage('select the properties first.');
            return;
        }

        getDeclerations(text).forEach(it => {
            result += `${it.variableType} ${it.variableName}, `;
        });
        result = result.slice(0, -2) + `) {\n`;

        getDeclerations(text).forEach(it => {
            result += `\t\tthis.${it.variableName} = ${it.variableName};\n`;
        });

        result += `\t}\n`;

        editor.edit(
            edit => editor.selections.forEach(
                selection => {
                    if (insertNewLine) {
                        edit.insert(selection.end, '\n' + result);
                    } else {
                        edit.insert(selection.end, result);
                    }
                }
            )
        );

    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(generateConstructor);
    context.subscriptions.push(generateConstructorUsingFields);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateSetterGetters(textPorperties: string): string {
    let result = '';
    getDeclerations(textPorperties).forEach(it => {
        result +=
            `
\tpublic ${it.variableType} get${it.variableNameFirstCapital}() {
\t\treturn this.${it.variableName};
\t}

\tpublic void ${it.variableType!.toLowerCase() === "boolean" ? "is" : "set"}${it.variableNameFirstCapital}(${it.variableType} ${it.variableName}) {
\t\tthis.${it.variableName} = ${it.variableName};
\t}
`;
    });
    return result;
}





export function generateToString(textPorperties: string) {
    let result =
        `\n\t@Override
\tpublic String toString() {
\t\treturn "{" +\n`;

    getDeclerations(textPorperties).forEach(it => {
        result += `\t\t\t", ${it.variableName}='" + get${it.variableNameFirstCapital}() + "'" +\n`;
    });

    result += `\t\t\t"}";
\t}`;

    return result.replace(',', '');
}



export function getDeclerations(slectedText: string): Decleration[] {
    const declerations: Decleration[] = [];

    let classProperties = slectedText.split(/\r?\n/).filter(x => x.length > 2).map(x => x.replace(';', ''));

    for (let lineOfCode of classProperties) {
        let declaration = lineOfCode.split('=')[0].replace('final ', ' ').replace('public ', ' ').replace('private ', ' ').trim().split(" ");
        let variableType, variableName, variableNameFirstCapital: string = '';
        let skip = false;

        if (declaration[0].charAt(0) === '@' || declaration[0].charAt(0) === '/') {
            continue;
        }

        declaration.forEach(element => {
            if (element === 'static') {
                vscode.window.showWarningMessage(declaration[declaration.length - 1] + ' skiped as it\'s static');
                skip = true;
            }
        });

        if (declaration.length === 1) {
            vscode.window.showWarningMessage(declaration.join(' ') + ' skiped as it\'s unvalid');
            continue;
        } else if (declaration.length === 2) {
            variableType = declaration[0];
            variableName = declaration[1];
            variableNameFirstCapital = capitalizeFirstLetter(declaration[1]);
        }

        if (!skip) {
            declerations.push(new Decleration(variableType, variableName, variableNameFirstCapital));
        }
    }
    return declerations;
}

export function getClassName(classFile: string): string {
    let regex = /(class|interface|enum)\s([^\n\s]*)/;
    //  console.log(regex.exec(classFile));
    let classDecleration = regex.exec(classFile);
    if (classDecleration) {
        return classDecleration[2];
    } else {
        vscode.window.showErrorMessage('couldn\'t parse the class name please file an issue');
        throw new Error('couldn\'t parse the class name please file an issue');
    }
}