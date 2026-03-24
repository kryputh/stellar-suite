import * as vscode from 'vscode';
import { execAsync } from '../services/sorobanCliService';

export async function generateBindings(contractItem?: any) {
    try {
        let contractId = '';
        
        if (contractItem && contractItem.contractId) {
            contractId = contractItem.contractId;
        } else {
            const input = await vscode.window.showInputBox({
                prompt: 'Enter the Contract ID to generate bindings for',
                placeHolder: 'C...'
            });
            if (!input) return;
            contractId = input;
        }

        const languages = [
            { label: 'TypeScript', value: 'typescript' },
            { label: 'Rust', value: 'rust' }
        ];

        const selectedLang = await vscode.window.showQuickPick(languages, {
            placeHolder: 'Select target language for bindings'
        });

        if (!selectedLang) return;

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a workspace folder first.');
            return;
        }

        const defaultUri = vscode.Uri.joinPath(workspaceFolders[0].uri, 'src', 'interactions', contractId.substring(0, 6));

        const outputUris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Output Directory',
            defaultUri: defaultUri
        });

        if (!outputUris || outputUris.length === 0) return;
        const outputPath = outputUris[0].fsPath;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Generating ${selectedLang.label} bindings for ${contractId.substring(0, 8)}...`,
            cancellable: false
        }, async () => {
            const cmd = `stellar contract bindings ${selectedLang.value} --id ${contractId} --output-dir "${outputPath}"`;
            await execAsync(cmd);
        });

        vscode.window.showInformationMessage(`Successfully generated ${selectedLang.label} bindings in ${outputPath}`);
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to generate bindings: ${e.message}`);
    }
}
