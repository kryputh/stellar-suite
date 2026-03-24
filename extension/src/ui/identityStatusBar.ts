import * as vscode from 'vscode';
import { execAsync } from '../services/sorobanCliService';

let identityStatusBarItem: vscode.StatusBarItem;

export async function initIdentityStatusBar(context: vscode.ExtensionContext) {
    identityStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    identityStatusBarItem.command = 'stellarSuite.switchIdentity';
    context.subscriptions.push(identityStatusBarItem);

    const configCommand = vscode.commands.registerCommand('stellarSuite.switchIdentity', async () => {
        await switchIdentity();
    });
    context.subscriptions.push(configCommand);

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('stellarSuite.source')) {
            updateIdentityStatusBar();
        }
    }));

    await updateIdentityStatusBar();
}

export async function updateIdentityStatusBar() {
    try {
        const config = vscode.workspace.getConfiguration('stellarSuite');
        const currentSource = config.get<string>('source', 'dev');

        identityStatusBarItem.text = `$(person) Stellar: ${currentSource}`;
        identityStatusBarItem.tooltip = 'Click to switch Stellar Identity';
        identityStatusBarItem.show();
    } catch (error) {
        identityStatusBarItem.text = '$(error) Stellar Identity: Error';
        identityStatusBarItem.tooltip = 'Failed to load Stellar Identity';
        identityStatusBarItem.show();
    }
}

export async function switchIdentity() {
    try {
        const { stdout } = await execAsync('stellar keys ls');

        const lines = stdout.split('\n').filter(line => line.trim().length > 0);
        const identities = lines
            .map(line => line.trim())
            .filter(line => !line.startsWith('ℹ️'));

        if (identities.length === 0) {
            vscode.window.showInformationMessage('No identities found. Create one first from the Stellar Kit sidebar.');
            return;
        }

        const selected = await vscode.window.showQuickPick(identities, {
            placeHolder: 'Select a Stellar Identity for invocations'
        });

        if (selected) {
            const config = vscode.workspace.getConfiguration('stellarSuite');
            await config.update('source', selected, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Active identity set to: ${selected}`);
            //onDidChangeConfiguration listener will update the status bar automatically
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to switch identity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
