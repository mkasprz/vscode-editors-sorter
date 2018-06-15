'use strict';
import * as vscode from 'vscode';
import {TextDocument} from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    async function getActiveDocument(currentDocument: TextDocument): Promise<TextDocument> {
        let activeDocument: TextDocument;
        do {
            await new Promise(resolve => setTimeout(resolve, 100));
            activeDocument = (vscode.window.activeTextEditor as vscode.TextEditor).document;
        } while (activeDocument == currentDocument);
        return activeDocument;
    }

    let disposable = vscode.commands.registerCommand('editors-sorter.sortEditors', async () => {
        const firstTextEditor = vscode.window.activeTextEditor;
        if (firstTextEditor) {
            let documents: TextDocument[] = [];
            let document = firstTextEditor.document;
            do {
                documents.push(document);
                await vscode.commands.executeCommand('workbench.action.nextEditor');
                document = await getActiveDocument(document);
                // vscode.window.showInformationMessage('B' + document.fileName.slice(document.fileName.lastIndexOf('\\')))
            } while (document != firstTextEditor.document)
            let filesNames = documents.map(document => {
                return document.fileName.toLowerCase();
            });
            filesNames.sort();
            // vscode.window.showInformationMessage(documents.map(document => document.fileName.slice(document.fileName.lastIndexOf('\\'))).toString() + '\n');
            document = firstTextEditor.document;
            do {
                const indexOfDocument = documents.indexOf(document);
                if (indexOfDocument != -1) {
                    let newIndex = filesNames.indexOf(document.fileName.toLowerCase()) + 1;
                    await vscode.commands.executeCommand('moveActiveEditor', {by: 'tab', to: 'position', value: newIndex});
                    documents.splice(indexOfDocument, 1);
                }
                await vscode.commands.executeCommand('workbench.action.nextEditor');
                document = await getActiveDocument(document);
            } while (documents.length)
            vscode.window.showInformationMessage('Done sorting!');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
