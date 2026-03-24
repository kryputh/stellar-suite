import * as vscode from 'vscode';
let statusBarItem: vscode.StatusBarItem;

export async function initNetworkStatusBar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'stellarSuite.switchNetwork';
    context.subscriptions.push(statusBarItem);

    await updateNetworkStatusBar();
    statusBarItem.show();
}

export async function updateNetworkStatusBar() {
    try {
        const config = vscode.workspace.getConfiguration('stellarSuite');
        const currentNetwork = config.get<string>('network') || 'testnet';

        statusBarItem.text = `$(globe) Stellar: ${currentNetwork}`;
        statusBarItem.tooltip = 'Click to switch Stellar Network';
    } catch (e) {
        statusBarItem.text = `$(globe) Stellar: testnet`;
    }
}
