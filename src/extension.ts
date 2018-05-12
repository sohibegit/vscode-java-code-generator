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
        if (text.length < 2) {
            vscode.window.showErrorMessage('select the properties first.');
            return;
        }
        try {
            editor.edit(
                edit => editor.selections.forEach(
                    selection => {
                        edit.insert(selection.end, generateSetterGetters(text));
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
}

// this method is called when your extension is deactivated
export function deactivate() {
}
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateSetterGetters(textPorperties: string): string {
    var classProperties = textPorperties.split(/\r?\n/).filter(x => x.length > 2).map(x => x.replace(';', ''));

    var result = '';

    for (let lineOfCode of classProperties) {
        let declaration = lineOfCode.trim().split(" ");
        let variableType, variableName, variableNameFirstCapital: string = '';
        let skip = false;

        if (declaration.length === 1) {
            vscode.window.showErrorMessage('select "String variable" or "private String variable"');
            skip = true;
        } else if (declaration.length === 2) {
            variableType = declaration[0];
            variableName = declaration[1];
            variableNameFirstCapital = capitalizeFirstLetter(declaration[1]);
        } else if (declaration.length === 3) {
            variableType = declaration[1];
            variableName = declaration[2];
            variableNameFirstCapital = capitalizeFirstLetter(declaration[2]);
        }

        if (!skip) {
            result +=
                `
\tpublic ${variableType} get${variableNameFirstCapital}()
\t{
\t\treturn this.${variableName};
\t}

\tpublic void ${variableType!.toLowerCase() === "boolean" ? "is" : "set"}${variableNameFirstCapital}(${variableType} ${variableName})
\t{
\t\tthis.${variableName} = ${variableName};
\t}
`;
        }
    }

    return result;
}
