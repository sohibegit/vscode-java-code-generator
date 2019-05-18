'use strict';
import * as vscode from 'vscode';
import { getSelectedJavaClass, insertSnippet } from './functions';
import { JavaClass } from './java-class';
import { getMethodOpeningBraceOnNewLine, isIncludeFluentWithSetters, isGenerateEvenIfExists, isOnlyPrimitiveForToString, isOnlyIdForHashAndEquals } from './settings';
import { getGuiHtml } from './gui';
let existsWarnings: string[] = [];
export function activate(context: vscode.ExtensionContext) {
    let onePanel: vscode.WebviewPanel;
    let generateAll = vscode.commands.registerCommand('extension.javaGenerateAll', () => {
        let editor = vscode.window.activeTextEditor!;
        getSelectedJavaClass(editor)
            .then(javaClass => {
                let result = '';
                result += generateEmptyConstrucor(javaClass);
                result += generateConstructorUsingFields(javaClass);
                result += generateGettersAndSetter(javaClass);
                if (!isIncludeFluentWithSetters()) {
                    result += generateFluentSetters(javaClass);
                }
                result += generateHashCodeAndEquals(javaClass);
                result += generateToString(javaClass);
                insertSnippet(result, editor);
                showExistsWarningIfFound();
            })
            .catch(err => {
                console.error(err);
            });
    });

    let generateConstructorCommand = vscode.commands.registerCommand('extension.javaGenerateConstructor', () => {
        runner(generateEmptyConstrucor);
    });

    let generateConstructorUsingAllFinalFieldsCommand = vscode.commands.registerCommand('extension.javaGenerateConstructorUsingAllFinalFields', () => {
        runner(generateConstructorUsingAllFinalFields);
    });

    let generateUsingGui = vscode.commands.registerCommand('extension.javaGenerateUsingGui', () => {
        let editor = vscode.window.activeTextEditor!;

        getSelectedJavaClass(editor)
            .then(javaClass => {
                onePanel = vscode.window.createWebviewPanel('javaGenerator', 'Java Generator', vscode.ViewColumn.Two, {
                    enableScripts: true
                });

                onePanel.webview.html = getGuiHtml(javaClass);

                onePanel.webview.onDidReceiveMessage(
                    message => {
                        if (message.data.fields.length === 0) {
                            return;
                        }
                        javaClass.declerations = javaClass.declerations.filter(dic => {
                            return message.data.fields.includes(dic.variableName);
                        });

                        switch (message.command) {
                            case 'onlyGetters': {
                                insertSnippet(generateOnlyGetters(javaClass), editor);
                                break;
                            }
                            case 'gettersAndSetters': {
                                insertSnippet(generateGettersAndSetter(javaClass), editor);
                                break;
                            }
                            case 'constructorUsingFields': {
                                insertSnippet(generateConstructorUsingFields(javaClass), editor);
                                break;
                            }
                            case 'hashCodeAndEquals': {
                                insertSnippet(generateHashCodeAndEquals(javaClass), editor);
                                break;
                            }
                            case 'javaGenerateFluentSetters': {
                                insertSnippet(generateFluentSetters(javaClass), editor);
                                break;
                            }
                            case 'toString': {
                                insertSnippet(generateToString(javaClass), editor);
                                break;
                            }
                            case 'toStringWithoutGetters': {
                                insertSnippet(generateToStringWithoutGetters(javaClass), editor);
                                break;
                            }
                            case 'all': {
                                let result = '';
                                result += generateEmptyConstrucor(javaClass);
                                result += generateConstructorUsingFields(javaClass);
                                result += generateGettersAndSetter(javaClass);
                                if (!isIncludeFluentWithSetters()) {
                                    result += generateFluentSetters(javaClass);
                                }
                                result += generateHashCodeAndEquals(javaClass);
                                result += generateToString(javaClass);
                                insertSnippet(result, editor);
                                break;
                            }
                        }
                        if (message.data.autoClose) {
                            onePanel.dispose();
                        }
                        showExistsWarningIfFound();

                        return;
                    },
                    undefined,
                    context.subscriptions
                );
            })
            .catch(error => {
                console.error(error);
            });
    });

    context.subscriptions.push(generateAll);
    context.subscriptions.push(generateConstructorCommand);
    context.subscriptions.push(generateConstructorUsingAllFinalFieldsCommand);
    context.subscriptions.push(generateUsingGui);
}

function showExistsWarningIfFound() {
    let warMessage = '';
    existsWarnings.forEach(war => {
        warMessage += ',' + war;
    });
    warMessage = warMessage.replace(',', '');
    if (existsWarnings.length > 0) {
        vscode.window.showWarningMessage('(' + warMessage + ') already exists');
        existsWarnings = [];
    }
}

export function deactivate() {}

function generateOnlyGetters(javaClass: JavaClass): string {
    let result = '';
    javaClass.declerations.forEach(it => {
        if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`get${it.variableNameFirstCapital()}`) === -1) {
            result += `\n\tpublic ${it.variableType} get${it.variableNameFirstCapital()}() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn this.${it.variableName};
\t}\n`;
        }

        if (it.isBoolean()) {
            if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`is${it.variableNameFirstCapital()}`) === -1) {
                result += `\n\tpublic ${it.variableType} is${it.variableNameFirstCapital()}() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn this.${it.variableName};
\t}\n`;
            }
        }
    });
    return result;
}

function generateGettersAndSetter(javaClass: JavaClass): string {
    let result = '';
    javaClass.declerations.forEach(it => {
        if (it.isBoolean()) {
            if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`is${it.variableNameFirstCapital()}`) === -1) {
                result += `\n\tpublic ${it.variableType} is${it.variableNameFirstCapital()}() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn this.${it.variableName};
\t}\n`;
            }
        }

        if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`get${it.variableNameFirstCapital()}`) === -1) {
            result += `\n\tpublic ${it.variableType} get${it.variableNameFirstCapital()}() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn this.${it.variableName};
\t}\n\n`;
        }
        if (!it.isFinal) {
            if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`set${it.variableNameFirstCapital()}`) === -1) {
                result += `\tpublic void set${it.variableNameFirstCapital()}(${it.variableType} ${it.variableName}) ${getMethodOpeningBraceOnNewLine()}{
\t\tthis.${it.variableName} = ${it.variableName};
\t}\n`;
            }

            if (isIncludeFluentWithSetters()) {
                if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(it.variableName) === -1) {
                    result += `\n\tpublic ${javaClass.name} ${it.variableName}(${it.variableType} ${it.variableName}) ${getMethodOpeningBraceOnNewLine()}{
\t\tthis.${it.variableName} = ${it.variableName};
\t\treturn this;
\t}\n`;
                }
            }
        }
    });

    return result;
}

function generateFluentSetters(javaClass: JavaClass): string {
    let result = '';
    javaClass.declerations.forEach(it => {
        if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(it.variableName) === -1) {
            if (!it.isFinal) {
                result += `\n\tpublic ${javaClass.name} ${it.variableName}(${it.variableType} ${it.variableName}) ${getMethodOpeningBraceOnNewLine()}{
\t\tthis.${it.variableName} = ${it.variableName};
\t\treturn this;
\t}\n`;
            }
        }
    });
    return result;
}

export function generateToString(javaClass: JavaClass): string {
    if (isOnlyPrimitiveForToString()) {
        return generateToStringOnlyPrimitives(javaClass);
    }
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('toString') === -1) {
        let result = `\n\t@Override
\tpublic String toString() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn "{" +\n`;

        javaClass.declerations.forEach(it => {
            result += `\t\t\t", ${it.variableName}='" + ${it.variableType.toLowerCase() === 'boolean' ? 'is' : 'get'}${it.variableNameFirstCapital()}() + "'" +\n`;
        });

        result += `\t\t\t"}";
\t}\n`;
        return result.replace(',', '');
    } else {
        existsWarnings.push('toString');
        return '';
    }
}

export function generateToStringOnlyPrimitives(javaClass: JavaClass): string {
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('toString') === -1) {
        let result = `\n\t@Override
\tpublic String toString() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn "{" +\n`;

        javaClass.declerations.forEach(it => {
            if (it.isBoolean() || it.isString() || it.isPrimitive() || it.isPrimitiveWrapper()) {
                result += `\t\t\t", ${it.variableName}='" + ${it.variableType.toLowerCase() === 'boolean' ? 'is' : 'get'}${it.variableNameFirstCapital()}() + "'" +\n`;
            }
        });

        result += `\t\t\t"}";
\t}\n`;
        return result.replace(',', '');
    } else {
        existsWarnings.push('toString');
        return '';
    }
}

export function generateToStringWithoutGetters(javaClass: JavaClass): string {
    if (isOnlyPrimitiveForToString()) {
        return generateToStringWithoutGettersOnlyPrimitives(javaClass);
    }
    let result = `\n\t@Override
\tpublic String toString() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn "{" +\n`;

    javaClass.declerations.forEach(it => {
        result += `\t\t\t", ${it.variableName}='" + ${it.variableName} + "'" +\n`;
    });

    result += `\t\t\t"}";
\t}\n`;

    return result.replace(',', '');
}

export function generateToStringWithoutGettersOnlyPrimitives(javaClass: JavaClass): string {
    let result = `\n\t@Override
\tpublic String toString() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn "{" +\n`;

    javaClass.declerations.forEach(it => {
        if (it.isBoolean() || it.isString() || it.isPrimitive() || it.isPrimitiveWrapper()) {
            result += `\t\t\t", ${it.variableName}='" + ${it.variableName} + "'" +\n`;
        }
    });

    result += `\t\t\t"}";
\t}\n`;

    return result.replace(',', '');
}

export function generateConstructorUsingFields(javaClass: JavaClass): string {
    if (javaClass.declerations.length === 0) {
        return generateEmptyConstrucor(javaClass);
    }
    let result = `\n\tpublic ${javaClass.name}(`;
    javaClass.declerations.forEach(it => {
        if (!it.isFinalValueAlradySet) {
            result += `${it.variableType} ${it.variableName}, `;
        }
    });
    result = result.slice(0, -2) + `) ${getMethodOpeningBraceOnNewLine()}{\n`;
    javaClass.declerations.forEach(it => {
        if (!it.isFinalValueAlradySet) {
            result += `\t\tthis.${it.variableName} = ${it.variableName};\n`;
        }
    });
    result += `\t}\n`;
    return result;
}

export function generateConstructorUsingAllFinalFields(javaClass: JavaClass): string {
    if (!javaClass.hasAnyFinalField()) {
        return generateEmptyConstrucor(javaClass);
    }
    let result = `\n\tpublic ${javaClass.name}(`;
    javaClass.declerations.forEach(it => {
        if (it.isFinal && !it.isFinalValueAlradySet) {
            result += `${it.variableType} ${it.variableName}, `;
        }
    });
    result = result.slice(0, -2) + `) ${getMethodOpeningBraceOnNewLine()}{\n`;
    javaClass.declerations.forEach(it => {
        if (it.isFinal && !it.isFinalValueAlradySet) {
            result += `\t\tthis.${it.variableName} = ${it.variableName};\n`;
        }
    });
    result += `\t}\n`;
    return result;
}

export function generateHashCodeAndEquals(javaClass: JavaClass): string {
    if (isOnlyIdForHashAndEquals()) {
        return generateHashCodeAndEqualsOnlyId(javaClass);
    }
    let result = '';
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('equals') === -1) {
        result += `\n\t@Override
    public boolean equals(Object o) ${getMethodOpeningBraceOnNewLine()}{
        if (o == this)
            return true;
        if (!(o instanceof ${javaClass.name})) {
            return false;
        }
        ${javaClass.name} ${javaClass.nameLowerCase()} = (${javaClass.name}) o;
        return `;

        javaClass.declerations.forEach(it => {
            if (it.isPrimitive()) {
                result += `${it.variableName} == ${javaClass.nameLowerCase()}.${it.variableName} && `;
            } else {
                result += `Objects.equals(${it.variableName}, ${javaClass.nameLowerCase()}.${it.variableName}) && `;
            }
        });
        result = result.slice(0, -4) + `;\n\t}`;
    } else {
        existsWarnings.push('equals');
    }
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('hashCode') === -1) {
        result += `\n\n\t@Override
\tpublic int hashCode() ${getMethodOpeningBraceOnNewLine()}{\n`;
        if (javaClass.declerations.length > 1) {
            result += `\t\treturn Objects.hash(`;
        } else {
            result += `\t\treturn Objects.hashCode(`;
        }

        javaClass.declerations.forEach(it => {
            result += `${it.variableName}, `;
        });
        result = result.slice(0, -2) + `);\n`;

        result += `\t}\n`;
    } else {
        existsWarnings.push('hashCode');
    }
    return result;
}

export function generateHashCodeAndEqualsOnlyId(javaClass: JavaClass): string {
    let result = '';
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('equals') === -1) {
        result += `\n\t@Override
    public boolean equals(Object o) ${getMethodOpeningBraceOnNewLine()}{
        if (o == this)
            return true;
        if (!(o instanceof ${javaClass.name})) {
            return false;
        }
        ${javaClass.name} ${javaClass.nameLowerCase()} = (${javaClass.name}) o;
        return `;

        result += `Objects.equals(id, ${javaClass.nameLowerCase()}.id) && `;

        result = result.slice(0, -4) + `;\n\t}\n`;
    } else {
        existsWarnings.push('equals');
    }

    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('hashCode') === -1) {
        result += `
\t@Override
\tpublic int hashCode() {
\t\treturn Objects.hashCode(id);
\t}
`;
    } else {
        existsWarnings.push('hashCode');
    }
    return result;
}

function generateEmptyConstrucor(javaClass: JavaClass): string {
    if (isGenerateEvenIfExists() || !javaClass.hasEmptyConstructor) {
        return `\n\tpublic ${javaClass.name}() ${getMethodOpeningBraceOnNewLine()}{\n\t}\n`;
    } else {
        existsWarnings.push('Empty Constructor');
        return '';
    }
}

function runner(fun: any) {
    let editor = vscode.window.activeTextEditor!;
    getSelectedJavaClass(editor)
        .then(javaClass => {
            insertSnippet(fun(javaClass), editor);
            showExistsWarningIfFound();
        })
        .catch(err => {
            console.error(err);
        });
}
