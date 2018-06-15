'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {TextDocument} from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "editors-sorter" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    let editorsNames: string[] = [];
    let onDidChangeActiveTextEditorDisposable: vscode.Disposable | undefined;

    async function getActiveDocument(currentDocument: TextDocument): Promise<TextDocument> {
        let activeDocument: TextDocument;
        do {
            await new Promise(resolve => setTimeout(resolve, 100));
            activeDocument = (vscode.window.activeTextEditor as vscode.TextEditor).document;
        } while (activeDocument == currentDocument);
        return activeDocument;
    }

    let sortEditorsDisposable = vscode.commands.registerCommand('extension.sortEditors', async () => {
        // await vscode.commands.executeCommand('workbench.action.nextEditor');
        const firstTextEditor = vscode.window.activeTextEditor;
        if (firstTextEditor) {
            let documents: TextDocument[] = [];
            let document = firstTextEditor.document;
            do {
                documents.push(document);
                await vscode.commands.executeCommand('workbench.action.nextEditor');
                document = await getActiveDocument(document);
                vscode.window.showInformationMessage('B' + document.fileName.slice(document.fileName.lastIndexOf('\\')))
            } while (document != firstTextEditor.document)
            let filesNames = documents.map(document => {
                // let fileName = editor.document.fileName.toLowerCase();
                // return fileName.slice(fileName.lastIndexOf('\\'));
                return document.fileName.toLowerCase();
            });
            filesNames.sort();
            vscode.window.showInformationMessage(documents.map(document => document.fileName.slice(document.fileName.lastIndexOf('\\'))).toString() + '\n');
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
                // document = (vscode.window.activeTextEditor as vscode.TextEditor).document;
            } while (documents.length)
            vscode.window.showInformationMessage('Done sorting!');
        }
    });

    let sortingServiceDisposable = vscode.commands.registerCommand('extension.toggleSortingService', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        if (!onDidChangeActiveTextEditorDisposable) {

            onDidChangeActiveTextEditorDisposable = vscode.window.onDidChangeActiveTextEditor((event) => {
                const activeTextEditor = vscode.window.activeTextEditor;
                if (activeTextEditor) {
                    let activeEditorFileName = activeTextEditor.document.fileName.toLowerCase();
                    activeEditorFileName = activeEditorFileName.slice(activeEditorFileName.lastIndexOf('\\') + 1);

                    if (!editorsNames.find(editorName => editorName == activeEditorFileName)) {
                        editorsNames.push(activeEditorFileName);
                        vscode.window.showInformationMessage('length ' + editorsNames.length);
                        editorsNames.sort();
                        const index = editorsNames.indexOf(activeEditorFileName);
                        vscode.window.showInformationMessage('index ' + index);
                        vscode.commands.executeCommand('moveActiveEditor', {by: 'tab', to: 'position', value: index + 1});
                    }
                    // editorsNames.splice(editorsNames.indexOf(activeEditorFileName), 1);
                }
            });
            vscode.window.showInformationMessage('Started sorting service');
        } else {
            editorsNames = [];
            onDidChangeActiveTextEditorDisposable.dispose();
            onDidChangeActiveTextEditorDisposable = undefined;
            vscode.window.showInformationMessage('Stopped sorting service');
        }

        // vscode.window.onDidChangeVisibleTextEditors((textEditors) => {
        //     editorsNames = [];
        //     textEditors.forEach(editor => {
        //         let fileName = editor.document.fileName.toLowerCase();
        //         fileName = fileName.slice(fileName.lastIndexOf('\\') + 1);
        //         vscode.window.showInformationMessage('fileName ' + fileName);

        //     })
        // });

        // if (!editorsList.find(editor => editor == activeTextEditor)) {
        //     // let activeEditorFileName = event.document.fileName.toLowerCase();
        //         let activeEditorFileName = activeTextEditor.document.fileName.toLowerCase();
        //         activeEditorFileName = activeEditorFileName.slice(activeEditorFileName.lastIndexOf('\\') + 1);
        //         // console.log(JSON.stringify(vscode.window.visibleTextEditors));
        //         vscode.window.showInformationMessage('length ' + editorsList.length);
        //         const index = editorsList.findIndex(editor => {
        //             let fileName = editor.document.fileName.toLowerCase();
        //             fileName = fileName.slice(fileName.lastIndexOf('\\') + 1);
        //             vscode.window.showInformationMessage(fileName);
        //             return fileName > activeEditorFileName;
        //         });
        //         vscode.window.showInformationMessage('index ' + index);
        //         vscode.commands.executeCommand('moveActiveEditor', {by: 'tab', to: 'position', value: index}); //to: 'first',
        //         editorsList.push(activeTextEditor);
        //     }

        // vscode.window.activeTextEditor = undefined;
        // console.log('undefined!');
        // console.log(JSON.stringify(vscode.window.visibleTextEditors));
        // vscode.window.visibleTextEditors = [];
        // vscode.window.visibleTextEditors.sort((firstTextEditor, secondTextEditor) => {
        //     let firstFileName = firstTextEditor.document.fileName.toLowerCase();
        //     let secondFileName = secondTextEditor.document.fileName.toLowerCase();
        //     firstFileName = firstFileName.slice(firstFileName.lastIndexOf('\\'));
        //     secondFileName = secondFileName.slice(secondFileName.lastIndexOf('\\'));
        //     console.log(firstFileName);
        //     console.log(secondFileName);
        //     return firstFileName > secondFileName ? 1 : firstFileName < secondFileName ? -1 : 0;
        // });
    });

    context.subscriptions.push(sortEditorsDisposable);
    context.subscriptions.push(sortingServiceDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}