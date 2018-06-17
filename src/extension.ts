'use strict';
import * as vscode from 'vscode';
import {TextDocument, TextEditor} from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    async function getActiveTextEditor(currentTextEditor?: TextEditor, timeoutBetweenChecks = 100, maximumTotalTimeout = 3000): Promise<TextEditor | undefined> {
        // [TODO] I do believe it can be done better.
        let activeTextEditor = vscode.window.activeTextEditor;
        for (let iteration = 0; (!activeTextEditor || activeTextEditor == currentTextEditor) && iteration < maximumTotalTimeout / 100; iteration++) {
            await new Promise(resolve => setTimeout(resolve, timeoutBetweenChecks));
            activeTextEditor = vscode.window.activeTextEditor;
        }
        return activeTextEditor;
    }

    async function getNextTextEditor(currentTextEditor?: TextEditor) {
        await vscode.commands.executeCommand('workbench.action.nextEditor');
        return await getActiveTextEditor(currentTextEditor);
    }

    async function getNextDefinedTextEditor(iterationsLimit = 100): Promise<TextEditor | undefined> {
        let activeTextEditor = vscode.window.activeTextEditor;
        for (let iteration = 0; !iteration || !activeTextEditor && iteration < iterationsLimit; iteration++) {
            activeTextEditor = await getNextTextEditor(activeTextEditor);
        }
        return activeTextEditor;
    }

    let disposable = vscode.commands.registerCommand('editors-sorter.sortEditors', async () => {
        const firstTextEditor = vscode.window.activeTextEditor || await getNextDefinedTextEditor();
        if (firstTextEditor) {
            await vscode.commands.executeCommand('moveActiveEditor', {by: 'tab', to: 'position', value: 2});
            const firstTextDocument = firstTextEditor.document;
            let textDocuments: TextDocument[] = [firstTextDocument];
            let numberOfNonTextEditors = 0;
            let activeTextDocument: TextDocument | undefined;
            let activeTextEditor: TextEditor | undefined = firstTextEditor;
            do {
                activeTextEditor = await getNextTextEditor(activeTextEditor);
                if (activeTextEditor) {
                    activeTextDocument = activeTextEditor.document;
                    if (activeTextDocument != firstTextDocument) {
                        textDocuments.push(activeTextDocument);
                    }
                } else {
                    numberOfNonTextEditors++;
                }
            } while (activeTextDocument != firstTextDocument)

            const filesNames = textDocuments.map(textDocument => {
                return textDocument.fileName.toLowerCase();
            });
            const numberOfTextEditors = filesNames.length;
            filesNames.sort();
            let sortedNonTextEditors = 0;

            do {
                if (activeTextDocument) {
                    const indexOfTextDocument = textDocuments.indexOf(activeTextDocument);
                    if (indexOfTextDocument != -1) {
                        const newPosition = filesNames.indexOf(activeTextDocument.fileName.toLowerCase()) + 1;
                        await vscode.commands.executeCommand('moveActiveEditor',
                            {by: 'tab', to: 'position', value: newPosition});
                        textDocuments.splice(indexOfTextDocument, 1);
                        if (newPosition == numberOfTextEditors && sortedNonTextEditors) {
                            sortedNonTextEditors--;
                        }
                    }
                } else {
                    await vscode.commands.executeCommand('moveActiveEditor',
                        {by: 'tab', to: 'position', value: numberOfTextEditors + numberOfNonTextEditors});
                    sortedNonTextEditors++;
                }
                const activeTextEditor = await getNextTextEditor(vscode.window.activeTextEditor);
                activeTextDocument = activeTextEditor ? activeTextEditor.document : undefined;
            } while (textDocuments.length && sortedNonTextEditors != numberOfNonTextEditors)
            vscode.window.showInformationMessage('Done sorting!');
        } else {
            vscode.window.showInformationMessage('Do You truly have at least 100 non-text editors opened? \
                They will not be sorted. Close some of them, as they can extremely slow down the process \
                or at least select some regular text editor and try again.');
        }
    });
    context.subscriptions.push(disposable);
}

export function deactivate() {
}
