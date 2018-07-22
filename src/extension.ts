'use strict';
import * as vscode from 'vscode';

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

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateSetterGetters(textPorperties: string): string {
    let classProperties = textPorperties.split(/\r?\n/).filter(x => x.length > 2).map(x => x.replace(';', ''));

    let result = '';
    for (let lineOfCode of classProperties) {
        let declaration = lineOfCode.replace('final ', ' ').replace('public ', ' ').replace('private ', ' ').trim().split(" ");
        let variableType, variableName, variableNameFirstCapital: string = '';
        let skip = false;

        if (declaration[0].charAt(0) === '@' || declaration[0].charAt(0) === '/') {
            continue;
        }

        declaration.forEach(element => {
            console.log(element);
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
            result +=
                `
\tpublic ${variableType} get${variableNameFirstCapital}(){
\t\treturn this.${variableName};
\t}

\tpublic void ${variableType!.toLowerCase() === "boolean" ? "is" : "set"}${variableNameFirstCapital}(${variableType} ${variableName}){
\t\tthis.${variableName} = ${variableName};
\t}
`;
        }
    }

    return result;
}





export function generateToString(textPorperties: string) {
    let classProperties = textPorperties.split(/\r?\n/).filter(x => x.length > 2).map(x => x.replace(';', ''));

    let result =
        `\n\t@Override
\tpublic String toString() {
\t\treturn "{" +\n`;
    for (let lineOfCode of classProperties) {
        let declaration = lineOfCode.replace('final ', ' ').replace('public ', ' ').replace('private ', ' ').trim().split(" ");
        let variableName, variableNameFirstCapital: string = '';
        let skip = false;
        if (declaration[0].charAt(0) === '@' || declaration[0].charAt(0) === '/') {
            continue;
        }
        declaration.forEach(element => {
            console.log(element);
            if (element === 'static') {
                vscode.window.showWarningMessage(declaration[declaration.length - 1] + ' skiped as it\'s static');
                skip = true;
            }
        });
        if (declaration.length === 1) {
            vscode.window.showWarningMessage(declaration.join(' ') + ' skiped as it\'s unvalid');
            skip = true;
        } else if (declaration.length === 2) {
            variableName = declaration[1];
            variableNameFirstCapital = capitalizeFirstLetter(declaration[1]);
        }

        if (!skip) {
            result += `\t\t\t", ${variableName}='" + get${variableNameFirstCapital}() + "'" +\n`;
        }
    }
    result += `\t\t\t"}";
\t}`;
    return result.replace(',', '');
}



