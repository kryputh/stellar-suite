import * as vscode from 'vscode';
import { execAsync } from '../services/sorobanCliService';
import { updateNetworkStatusBar } from '../ui/networkStatusBar';

export async function switchNetwork() {
    try {
        let networks: string[] = [];
        try {
            const { stdout } = await execAsync('stellar network ls');
            const lines = stdout.split('\n').filter((line: string) => line.trim().length > 0);
            networks = lines
                .map((line: string) => line.trim())
                .filter((line: string) => !line.startsWith('ℹ️'));
        } catch (e: any) {
            console.warn('Failed to fetch networks from CLI. Using fallbacks.', e.message);
        }
        
        if (networks.length === 0) {
            networks.push('testnet', 'mainnet', 'local');
        }

        const selected = await vscode.window.showQuickPick(networks, {
            placeHolder: 'Select a Stellar Network'
        });

        if (selected) {
            await execAsync(`stellar network use ${selected}`);
            
            const config = vscode.workspace.getConfiguration('stellarSuite');
            await config.update('network', selected, vscode.ConfigurationTarget.Global);
            
            vscode.window.showInformationMessage(`Switched to Stellar network: ${selected}`);
            await updateNetworkStatusBar();
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to switch network: ${e.message}`);
    }
}
