'use strict';
import { commands, ExtensionContext, OutputChannel, Position, ViewColumn, WebviewPanel, window } from 'vscode';
import { classDeclarationLine, getSelectedJavaClass, idFieldLine, importsHas, insertSnippet, lastImportLocation } from './functions';
import { getGuiHtml } from './gui';
import { JavaClass } from './java-class';
import {
    fluentCallsNormalSetters,
    getFluentMethodPrefix,
    getMethodOpeningBraceOnNewLine,
    includeBeta,
    includeGeneratedAnnotation,
    isGenerateEvenIfExists,
    isIncludeFluentWithSetters,
    isOnlyIdForHashAndEquals,
    isOnlyPrimitiveForToString,
} from './settings';
let existsWarnings: string[] = [];
let log: OutputChannel;

export function activate(context: ExtensionContext) {
    commands.executeCommand('setContext', 'includeBeta', includeBeta());
    log = window.createOutputChannel('JavaCodeGenerator');
    log.show();

    let onePanel: WebviewPanel;
    let generateAll = commands.registerCommand('extension.javaGenerateAll', async () => {
        let editor = window.activeTextEditor!;
        if (!importsHas(editor, 'import java.util.Objects;')) {
            let importLine = lastImportLocation(editor)!;
            editor?.edit(edit => {
                edit.insert(new Position(importLine, 0), 'import java.util.Objects;\n');
            });
        }

        getSelectedJavaClass(editor)
            .then(javaClass => {
                let result = '';
                result += generateEmptyConstructor(javaClass);
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

    let generateConstructorCommand = commands.registerCommand('extension.javaGenerateConstructor', () => {
        runner(generateEmptyConstructor);
    });

    let generateLoggerDebugSelectedText = commands.registerCommand('extension.javaGenerateLoggerDebug', () => {
        var editor = window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        var selection = editor.selection;
        var text = editor.document.getText(selection);
        editor.edit(it => {
            it.insert(
                new Position(selection.active.line, editor!.document.lineAt(selection.active.line).range.end.character),
                `
    log.debug("${text}: {}",${text});`
            );
        });
    });

    let generateConstructorUsingAllFinalFieldsCommand = commands.registerCommand('extension.javaGenerateConstructorUsingAllFinalFields', () => {
        runner(generateConstructorUsingAllFinalFields);
    });

    let generateUsingGui = commands.registerCommand('extension.javaGenerateUsingGui', () => {
        let editor = window.activeTextEditor!;
        getSelectedJavaClass(editor)
            .then(javaClass => {
                onePanel = window.createWebviewPanel(
                    'javaGenerator',
                    'Java Code Generator',
                    { viewColumn: ViewColumn.Two, preserveFocus: true },
                    {
                        enableScripts: true,
                    }
                );
                // let fullClass = Object.assign({}, javaClass);
                onePanel.webview.html = getGuiHtml(javaClass, context);
                onePanel.webview.onDidReceiveMessage(
                    async (message: any) => {
                        let neededFields = message.data.fields;
                        javaClass = await getSelectedJavaClass(editor, neededFields);
                        if (message.data.fields.length === 0 && message.command !== 'emptyConstructor') {
                            window.showWarningMessage('please select at least one field');
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
                            case 'emptyConstructor': {
                                insertSnippet(generateEmptyConstructor(javaClass), editor);
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
                                result += generateEmptyConstructor(javaClass);
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
                        context.workspaceState.update('java-generate-setters-getters.autoClose', message.data.autoClose);
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

    let generateGettersAndSettersCommand = commands.registerCommand('extension.javaGenerateGettersAndSetter', () => {
        runner(generateGettersAndSetter);
    });

    let generateHashCodeAndEqualsCommand = commands.registerCommand('extension.javaGenerateHashCodeAndEquals', () => {
        runner(generateHashCodeAndEquals);
    });

    let generateToStringCommand = commands.registerCommand('extension.javaGenerateToString', () => {
        runner(generateToString);
    });

    let generateConstructorUsingFieldsCommand = commands.registerCommand('extension.javaGenerateConstructorUsingFields', () => {
        runner(generateConstructorUsingFields);
    });

    let generateFluentSettersCommand = commands.registerCommand('extension.javaGenerateFluentSetters', () => {
        runner(generateFluentSetters);
    });

    let generateLombokCommand = commands.registerCommand('extension.javaGenerateLombok', () => {
        generateLombok();
    });

    let generateLombokDataAccessorsHashCommand = commands.registerCommand('extension.javaGenerateLombokDataAccessorsHash', () => {
        generateLombokDataAccessorsHash();
    });

    let generateLombokSlf4jCommand = commands.registerCommand('extension.javaGenerateLombokSlf4j', () => {
        generateLombokSlf4j();
    });

    context.subscriptions.push(generateAll);
    context.subscriptions.push(generateConstructorCommand);
    context.subscriptions.push(generateLoggerDebugSelectedText);
    context.subscriptions.push(generateConstructorUsingAllFinalFieldsCommand);
    context.subscriptions.push(generateUsingGui);
    context.subscriptions.push(generateGettersAndSettersCommand);
    context.subscriptions.push(generateHashCodeAndEqualsCommand);
    context.subscriptions.push(generateToStringCommand);
    context.subscriptions.push(generateConstructorUsingFieldsCommand);
    context.subscriptions.push(generateFluentSettersCommand);
    context.subscriptions.push(generateLombokCommand);
    context.subscriptions.push(generateLombokDataAccessorsHashCommand);
    context.subscriptions.push(generateLombokSlf4jCommand);
}

function showExistsWarningIfFound() {
    let warMessage = '';
    existsWarnings.forEach(war => {
        warMessage += ',' + war;
    });
    warMessage = warMessage.replace(',', '');
    if (existsWarnings.length > 0) {
        window.showWarningMessage('(' + warMessage + ') already exists');
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
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
        if (it.isBoolean()) {
            if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`is${it.variableNameFirstCapital()}`) === -1) {
                result += it.annotation ? `\n\t${it.annotation}` : '';
                result += `\n\tpublic ${it.variableType} is${it.variableNameFirstCapital()}() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn this.${it.variableName};
\t}\n`;
            }
        }
        if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`get${it.variableNameFirstCapital()}`) === -1) {
            result += it.annotation ? `\n\t${it.annotation}` : '';
            result += `\n\tpublic ${it.variableType} get${it.variableNameFirstCapital()}() ${getMethodOpeningBraceOnNewLine()}{
\t\treturn this.${it.variableName};
\t}\n\n`;
        }
        if (!it.isFinal) {
            if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(`set${it.variableNameFirstCapital()}`) === -1) {
                result += includeGeneratedAnnotation() ? `\t@Generated("sohibe.vscode")\n` : '';
                result += it.annotation ? `\t${it.annotation}\n` : '';
                result += `\tpublic void set${it.variableNameFirstCapital()}(${it.variableType} ${it.variableName}) ${getMethodOpeningBraceOnNewLine()}{
\t\tthis.${it.variableName} = ${it.variableName};
\t}\n`;
            }

            if (isIncludeFluentWithSetters()) {
                if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf(it.variableName) === -1) {
                    result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
                    result += it.annotation ? `\n\t${it.annotation}` : '';
                    result += `\n\tpublic ${javaClass.name} ${getFluentMethodPrefix() ? getFluentMethodPrefix() + it.variableNameFirstCapital() : it.variableName}(${
                        it.variableType
                    } ${it.variableName}) ${getMethodOpeningBraceOnNewLine()}{
\t\t${fluentCallsNormalSetters() ? 'set' + it.variableNameFirstCapital() + '(' + it.variableName + ')' : 'this.' + it.variableName + ' = ' + it.variableName};
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
                result += `\n\tpublic ${javaClass.name} ${getFluentMethodPrefix() ? getFluentMethodPrefix() + it.variableNameFirstCapital() : it.variableName}(${it.variableType} ${
                    it.variableName
                }) ${getMethodOpeningBraceOnNewLine()}{
\t\t${fluentCallsNormalSetters() ? 'set' + it.variableNameFirstCapital() + '(' + it.variableName + ')' : 'this.' + it.variableName + ' = ' + it.variableName};
\t\treturn this;
\t}\n`;
            }
        }
    });
    return result;
}

function generateToString(javaClass: JavaClass): string {
    if (isOnlyPrimitiveForToString()) {
        return generateToStringOnlyPrimitives(javaClass);
    }
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('toString') === -1) {
        let result = '';
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
        result += `\n\t@Override
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

function generateToStringOnlyPrimitives(javaClass: JavaClass): string {
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('toString') === -1) {
        let result = '';
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
        result += `\n\t@Override
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

function generateToStringWithoutGetters(javaClass: JavaClass): string {
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

function generateToStringWithoutGettersOnlyPrimitives(javaClass: JavaClass): string {
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

function generateEmptyConstructor(javaClass: JavaClass): string {
    if (isGenerateEvenIfExists() || !javaClass.hasEmptyConstructor) {
        let result = '';
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
        result += `\n\tpublic ${javaClass.name}() ${getMethodOpeningBraceOnNewLine()}{\n\t}\n`;
        return result;
    } else {
        existsWarnings.push('Empty Constructor');
        return '';
    }
}

function generateConstructorUsingFields(javaClass: JavaClass): string {
    log.appendLine('1');

    if (javaClass.hasNoneEmptyConstructor) {
        log.appendLine('2');
        existsWarnings.push('Constructor Using Fields');
        return '';
    }
    log.appendLine('3');

    let result = '';
    result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
    result += `\n\tpublic ${javaClass.name}(`;
    log.appendLine(result);

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

function generateConstructorUsingAllFinalFields(javaClass: JavaClass): string {
    console.log('1');
    if (!javaClass.hasAnyFinalField()) {
        console.log('2');
        return generateEmptyConstructor(javaClass);
    }
    console.log('3');

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

function generateHashCodeAndEquals(javaClass: JavaClass): string {
    if (isOnlyIdForHashAndEquals()) {
        return generateHashCodeAndEqualsOnlyId(javaClass);
    }
    let result = '';
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('equals') === -1) {
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
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
        result = result.slice(0, -4) + `;\n\t}\n`;
    } else {
        existsWarnings.push('equals');
    }
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('hashCode') === -1) {
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
        result += `\n\t@Override
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

function generateHashCodeAndEqualsOnlyId(javaClass: JavaClass): string {
    let result = '';
    if (isGenerateEvenIfExists() || javaClass.methodNames.indexOf('equals') === -1) {
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
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
        result += includeGeneratedAnnotation() ? `\n\t@Generated("sohibe.vscode")` : '';
        result += `\n\t@Override
\tpublic int hashCode() {
\t\treturn Objects.hashCode(id);
\t}
`;
    } else {
        existsWarnings.push('hashCode');
    }
    return result;
}

function runner(fun: any) {
    let editor = window.activeTextEditor!;
    getSelectedJavaClass(editor)
        .then(javaClass => {
            insertSnippet(fun(javaClass), editor);
            showExistsWarningIfFound();
        })
        .catch(err => {
            console.error(err);
        });
}

function generateLombok() {
    const editor = window.activeTextEditor;
    let importLine = lastImportLocation(editor)!;
    let classLine = classDeclarationLine(editor)!;
    editor?.edit(edit => {
        edit.insert(new Position(importLine, 0), 'import lombok.RequiredArgsConstructor;\nimport lombok.extern.slf4j.Slf4j;\n');
        edit.insert(new Position(classLine - 1, 0), '@RequiredArgsConstructor\n@Slf4j\n');
    });
}

function generateLombokDataAccessorsHash() {
    const editor = window.activeTextEditor;
    let importLine = lastImportLocation(editor)!;
    let classLine = classDeclarationLine(editor)!;
    let idLine = idFieldLine(editor);

    editor?.edit(edit => {
        edit.insert(new Position(importLine, 0), 'import lombok.Data;\nimport lombok.EqualsAndHashCode;\nimport lombok.experimental.Accessors;\n');
        edit.insert(new Position(classLine - 1, 0), '@Data\n@Accessors(chain = true)\n@EqualsAndHashCode(callSuper = false, onlyExplicitlyIncluded = true)\n');
        if (idLine && idLine > 0) {
            edit.insert(new Position(idLine - 1, 0), '    @EqualsAndHashCode.Include\n');
        }
    });
}

function generateLombokSlf4j() {
    const editor = window.activeTextEditor;
    let importLine = lastImportLocation(editor)!;
    let classLine = classDeclarationLine(editor)!;
    editor?.edit(edit => {
        edit.insert(new Position(importLine, 0), 'import lombok.extern.slf4j.Slf4j;\n');
        edit.insert(new Position(classLine - 1, 0), '@Slf4j\n');
    });
}
