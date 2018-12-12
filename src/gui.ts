import { JavaClass } from './java-class';

export function getGuiHtml(javaClass: JavaClass) {
    let guiHTML = /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Java Code Generators</title>
            <style>
            .button {
                background-color: Transparent;
                background-repeat:no-repeat;
                border: none;
                cursor:pointer;
                overflow: absolute;
                outline:none;
                padding: 12px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 12px;
                margin: 4px 2px;
                -webkit-transition-duration: 0.4s; /* Safari */
                transition-duration: 0.4s;
                }

                .generate-button {
                    width:200px;
                    color:white;
                    border: 2px solid #008CBA;
                }

                .generate-button:hover {
                    background-color: #008CBA;
                    color: black;
                }

                .green-button {
                    border: 2px solid #4CAF50 !important;
                }

                .green-button:hover {
                    background-color: #4CAF50 !important;
                    color: black;
                }

                .field-check-box{
                    margin: 5px 5px 5px 15px;
                }
                .select-all-check-box{
                    margin-bottom: 5px;
                    margin-top: 5px;
                }
            </style>

        </head>
        <body>
            <form id="generation-form">
            <input type="checkbox" class="select-all-check-box" name="select-all" checked onClick="toggle(this)" /><strong>Select All</strong> <br />
    `;

    javaClass.declerations.forEach(decleration => {
        guiHTML += /*html*/ `
                <input type="checkbox" class="field-check-box" name="${decleration.variableName}" checked /><strong>${decleration.variableName}</strong> ${
            decleration.variableType
        } <br />  
    `;
    });

    guiHTML += /*html*/ `
            <hr />
            <button class="button generate-button" onclick="generate('constructorUsingFields')">Constructor Using Fields</button> 
            <button class="button generate-button" onclick="generate('gettersAndSetters')">Getters() And Setters()</button> 
            <button class="button generate-button" onclick="generate('javaGenerateFluentSetters')">Fluent Setters()</button> 
            <button class="button generate-button" onclick="generate('onlyGetters')">only Getters()</button> 
            <button class="button generate-button" onclick="generate('hashCodeAndEquals')">HashCode() And Equals()</button> 
            <button class="button generate-button" onclick="generate('toString')">toString()</button> 
            <button class="button generate-button" onclick="generate('toStringWithoutGetters')">toString() without Getters()</button>
            <button class="button generate-button green-button" onclick="generate('all')">Generate All</button> <br />
            <hr />
            <input type="checkbox" id="auto-close-check-box" name="auto-close" checked  /><strong>Auto close this Window after generating!</strong> 
        </form>
        <script>
            const vscode = acquireVsCodeApi();
            function generate(command) {

                var result = { fields: [] };
                result.autoClose = document.getElementById("auto-close-check-box").checked;
                Array.prototype.forEach.call(document.forms[0].elements, function(element) {
                    if (element.checked) {
                        result.fields.push(element.name);
                    }
                });

                var generationForm = document.getElementById('generation-form');
                vscode.postMessage({
                    command: command,
                    data: result
                });
            }
            function toggle(source) {
                var checkboxes = document.querySelectorAll('.field-check-box');
                for (var i = 0; i < checkboxes.length; i++) {
                    checkboxes[i].checked = source.checked;
                }
            }
        </script>
    </body>
</html>
    `;
    return guiHTML;
}
