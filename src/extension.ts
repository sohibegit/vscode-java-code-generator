"use strict";
import * as vscode from "vscode";
import {
  getDeclerations,
  getClassName,
  insertSnippet,
  getSelectedText,
  lowerCaseFirstLetter
} from "./functions";
import { Decleration } from "./decleration";

export function activate(context: vscode.ExtensionContext) {
  let generateGettersCommand = vscode.commands.registerCommand(
    "extension.javaGenerateGetters",
    () => {
      insertSnippet(generateGetters(getDeclerations(getSelectedText())));
    }
  );

  let generateSettersGettersCommand = vscode.commands.registerCommand(
    "extension.javaGenerateSettersGetters",
    () => {
      getClassName(vscode.window.activeTextEditor!.document.getText()).then(
        className =>
          insertSnippet(
            generateSetterGetters(className, getDeclerations(getSelectedText()))
          )
      );
    }
  );

  let generateToStringCommand = vscode.commands.registerCommand(
    "extension.javaGenerateToString",
    () => {
      insertSnippet(generateToString(getDeclerations(getSelectedText())));
    }
  );

  let generateConstructorCommand = vscode.commands.registerCommand(
    "extension.javaGenerateConstructor",
    () => {
      getClassName(vscode.window.activeTextEditor!.document.getText()).then(
        className => {
          let result = `\n\tpublic ${className}() {\n\t}\n`;
          insertSnippet(result);
        }
      );
    }
  );

  let generateConstructorUsingFieldsCommand = vscode.commands.registerCommand(
    "extension.javaGenerateConstructorUsingFields",
    () => {
      getClassName(vscode.window.activeTextEditor!.document.getText()).then(
        className => {
          insertSnippet(
            generateConstructorUsingFields(
              getDeclerations(getSelectedText()),
              className
            )
          );
        }
      );
    }
  );

  let generateHashCodeAndEqualsCommand = vscode.commands.registerCommand(
    "extension.javaGenerateHashCodeAndEquals",
    () => {
      getClassName(vscode.window.activeTextEditor!.document.getText()).then(
        className => {
          let classNameFirstLower = lowerCaseFirstLetter(className);
          insertSnippet(
            generateHashCodeAndEquals(
              getDeclerations(getSelectedText()),
              className,
              classNameFirstLower
            )
          );
        }
      );
    }
  );

  let generateFluentSettersCommand = vscode.commands.registerCommand(
    "extension.javaGenerateFluentSetters",
    () => {
      getClassName(vscode.window.activeTextEditor!.document.getText()).then(
        className =>
          insertSnippet(
            generateFluentSetters(getDeclerations(getSelectedText()), className)
          )
      );
    }
  );

  context.subscriptions.push(generateGettersCommand);
  context.subscriptions.push(generateSettersGettersCommand);
  context.subscriptions.push(generateToStringCommand);
  context.subscriptions.push(generateConstructorCommand);
  context.subscriptions.push(generateConstructorUsingFieldsCommand);
  context.subscriptions.push(generateHashCodeAndEqualsCommand);
  context.subscriptions.push(generateFluentSettersCommand);
}

export function deactivate() {}

function generateGetters(declerations: Decleration[]): string {
  let result = "";
  declerations.forEach(it => {
    result += `\n\tpublic ${it.variableType} get${
      it.variableNameFirstCapital
    }() {
\t\treturn this.${it.variableName};
\t}\n`;
  });
  return result;
}

function generateSetterGetters(
  className: string,
  declerations: Decleration[]
): string {
  let result = "";
  declerations.forEach(it => {
    result += `\n\tpublic ${it.variableType} get${
      it.variableNameFirstCapital
    }() {
\t\treturn this.${it.variableName};
\t}

\tpublic void ${it.variableType!.toLowerCase() === "boolean" ? "is" : "set"}${
      it.variableNameFirstCapital
    }(${it.variableType} ${it.variableName}) {
\t\tthis.${it.variableName} = ${it.variableName};
\t}\n`;
  });

  if (
    vscode.workspace
      .getConfiguration("java.code.generators")
      .has("includeFluentWithSettersGetters") &&
    vscode.workspace
      .getConfiguration("java.code.generators")
      .get("includeFluentWithSettersGetters")
  ) {
    declerations.forEach(it => {
      result += `\n\tpublic ${className} ${it.variableName}(${
        it.variableType
      } ${it.variableName}) {
\t\tthis.${it.variableName} = ${it.variableName};
\t\treturn this;
\t}\n`;
    });
  }

  return result;
}

export function generateToString(declerations: Decleration[]): string {
  let result = `\n\t@Override
\tpublic String toString() {
\t\treturn "{" +\n`;

  declerations.forEach(it => {
    result += `\t\t\t", ${it.variableName}='" + get${
      it.variableNameFirstCapital
    }() + "'" +\n`;
  });

  result += `\t\t\t"}";
\t}\n`;

  return result.replace(",", "");
}

export function generateConstructorUsingFields(
  declerations: Decleration[],
  className: string
): string {
  let result = `\n\tpublic ${className}(`;
  declerations.forEach(it => {
    result += `${it.variableType} ${it.variableName}, `;
  });
  result = result.slice(0, -2) + `) {\n`;
  declerations.forEach(it => {
    result += `\t\tthis.${it.variableName} = ${it.variableName};\n`;
  });
  result += `\t}\n`;
  return result;
}

export function generateHashCodeAndEquals(
  declerations: Decleration[],
  className: string,
  classNameFirstLower: string
): string {
  let result = `\n\t@Override
    public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof ${className})) {
            return false;
        }
        ${className} ${classNameFirstLower} = (${className}) o;
        return `;

  declerations.forEach(it => {
    if (it.isPrimitive()) {
      result += `${it.variableName} == ${classNameFirstLower}.${
        it.variableName
      } && `;
    } else {
      result += `Objects.equals(${it.variableName}, ${classNameFirstLower}.${
        it.variableName
      }) && `;
    }
  });
  result = result.slice(0, -4) + `;\n\t}`;

  result += `\n\n\t@Override
\tpublic int hashCode() {\n`;
  if (declerations.length > 1) {
    result += `\t\treturn Objects.hash(`;
  } else {
    result += `\t\treturn Objects.hashCode(`;
  }

  declerations.forEach(it => {
    result += `${it.variableName}, `;
  });
  result = result.slice(0, -2) + `);\n`;

  result += `\t}\n`;
  return result;
}

function generateFluentSetters(
  declerations: Decleration[],
  className: string
): string {
  let result = "";
  declerations.forEach(it => {
    result += `\n\tpublic ${className} ${it.variableName}(${it.variableType} ${
      it.variableName
    }) {
\t\tthis.${it.variableName} = ${it.variableName};
\t\treturn this;
\t}\n`;
  });
  return result;
}
