import * as vscode from 'vscode';
import * as os from 'os';

export async function installCli(context: vscode.ExtensionContext) {
    const platform = os.platform();
    const terminal = vscode.window.createTerminal('Stellar CLI Installer');
    
    terminal.show();
    
    if (platform === 'win32') {
        terminal.sendText('winget install --id Stellar.StellarCLI');
    } else {
        terminal.sendText('curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh');
    }
    
    vscode.window.showInformationMessage('Stellar CLI installation started in the terminal. Once it completes, you may need to restart VS Code or your terminal to pick it up in your PATH.');
}
