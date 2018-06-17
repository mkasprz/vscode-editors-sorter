'use strict';
import * as vscode from 'vscode';
import {TextDocument, TextEditor} from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    async function getActiveTextEditor(currentTextEditor?: TextEditor, timeoutBetweenChecks = 100, maximumTotalTimeout = 5000): Promise<TextEditor | undefined> {
        // [TODO] I do believe it can be done better.
        let activeTextEditor = vscode.window.activeTextEditor;
        for (let iteration = 0; (!activeTextEditor || activeTextEditor == currentTextEditor) && iteration < maximumTotalTimeout / 100; iteration++) {
            await new Promise(resolve => setTimeout(resolve, timeoutBetweenChecks));
            activeTextEditor = vscode.window.activeTextEditor;
        }
        return activeTextEditor;
    }

    async function getNextDefinedTextEditor(iterationsLimit = 100): Promise<TextEditor | undefined> {
        let currentTextEditor = vscode.window.activeTextEditor;
        let activeTextEditor: TextEditor | undefined
        for (let iteration = 0; !activeTextEditor && iteration < iterationsLimit; iteration++) {
            await vscode.commands.executeCommand('workbench.action.nextEditor');
            activeTextEditor = await getActiveTextEditor(currentTextEditor);
            currentTextEditor = activeTextEditor;
        }
        return activeTextEditor;
    }

    let disposable = vscode.commands.registerCommand('editors-sorter.sortEditors', async () => {
        const firstTextEditor = vscode.window.activeTextEditor || await getNextDefinedTextEditor();
        if (firstTextEditor) {
            const firstTextDocument = firstTextEditor.document;
            let textDocuments: TextDocument[] = [firstTextDocument];
            let activeTextDocument: TextDocument | undefined = firstTextDocument;
            do {
                let activeTextEditor = await getNextDefinedTextEditor();
                if (activeTextEditor) {
                    activeTextDocument = activeTextEditor.document;
                    if (activeTextDocument != firstTextDocument) {
                        textDocuments.push(activeTextDocument);
                    }
                }
            } while (activeTextDocument != firstTextDocument)

            let filesNames = textDocuments.map(textDocument => {
                return textDocument.fileName.toLowerCase();
            });
            filesNames.sort();

            do {
                if (activeTextDocument) {
                    const indexOfTextDocument = textDocuments.indexOf(activeTextDocument);
                    if (indexOfTextDocument != -1) {
                        await vscode.commands.executeCommand('moveActiveEditor',
                            {by: 'tab', to: 'position', value: filesNames.indexOf(activeTextDocument.fileName.toLowerCase()) + 1});
                        textDocuments.splice(indexOfTextDocument, 1);
                    }
                }
                const activeTextEditor = await getNextDefinedTextEditor();
                activeTextDocument = activeTextEditor ? activeTextEditor.document : undefined;
            } while (textDocuments.length)
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
