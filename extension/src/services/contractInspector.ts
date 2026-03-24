import { execFile } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);

function getEnvironmentWithPath(): NodeJS.ProcessEnv {
    const env = { ...process.env };
    const homeDir = os.homedir();
    const cargoBin = path.join(homeDir, '.cargo', 'bin');
    
    const additionalPaths = [
        cargoBin,
        path.join(homeDir, '.local', 'bin'),
        '/usr/local/bin',
        '/opt/homebrew/bin',
        '/opt/homebrew/sbin'
    ];
    
    const currentPath = env.PATH || env.Path || '';
    env.PATH = [...additionalPaths, currentPath].filter(Boolean).join(path.delimiter);
    env.Path = env.PATH;
    
    return env;
}

export interface ContractFunction {
    name: string;
    description?: string;
    parameters: FunctionParameter[];
}

export interface FunctionParameter {
    name: string;
    type?: string;
    required: boolean;
    description?: string;
}

export class ContractInspector {
    private cliPath: string;
    private source: string;
    private network: string;
    private rpcUrl: string;
    private networkPassphrase: string;

    constructor(cliPath: string, source: string = 'dev', network: string = 'testnet', rpcUrl: string = 'https://soroban-testnet.stellar.org:443', networkPassphrase: string = 'Test SDF Network ; September 2015') {
        this.cliPath = cliPath;
        this.source = source;
        this.network = network;
        this.rpcUrl = rpcUrl;
        this.networkPassphrase = networkPassphrase;
    }

    async getContractFunctions(contractId: string): Promise<ContractFunction[]> {
        try {
            const env = getEnvironmentWithPath();
            const { stdout } = await execFileAsync(
                this.cliPath,
                [
                    'contract',
                    'info',
                    'interface',
                    '--id', contractId,
                    '--rpc-url', this.rpcUrl,
                    '--network-passphrase', this.networkPassphrase,
                    '--output', 'json-formatted'
                ],
                {
                    env: env,
                    maxBuffer: 10 * 1024 * 1024,
                    timeout: 30000
                }
            );

            return this.parseInterfaceJson(stdout);
        } catch (error) {
            console.error('Failed to get contract functions via JSON interface:', error);
            // Fallback to legacy help parsing if JSON fails for some reason
            return this.getContractFunctionsLegacy(contractId);
        }
    }

    async getFunctionHelp(contractId: string, functionName: string): Promise<ContractFunction | null> {
        const functions = await this.getContractFunctions(contractId);
        return functions.find(f => f.name === functionName) || null;
    }

    private parseInterfaceJson(jsonOutput: string): ContractFunction[] {
        try {
            const entries = JSON.parse(jsonOutput);
            if (!Array.isArray(entries)) return [];

            const functions: ContractFunction[] = [];

            for (const entry of entries) {
                if (entry.function_v0) {
                    const fn = entry.function_v0;
                    functions.push({
                        name: fn.name,
                        description: fn.doc || '',
                        parameters: (fn.inputs || []).map((input: any) => ({
                            name: input.name,
                            type: this.formatType(input.type_),
                            required: true,
                            description: input.doc || ''
                        }))
                    });
                }
            }

            return functions;
        } catch (e) {
            console.error('Error parsing interface JSON:', e);
            return [];
        }
    }

    private formatType(typeObj: any): string {
        if (typeof typeObj === 'string') return typeObj;
        if (typeObj.udt) return typeObj.udt.name;
        if (typeObj.vec) return `Vec<${this.formatType(typeObj.vec.element_type)}>`;
        if (typeObj.map) return `Map<${this.formatType(typeObj.map.key_type)}, ${this.formatType(typeObj.map.value_type)}>`;
        if (typeObj.optional) return `${this.formatType(typeObj.optional.value_type)} (optional)`;
        if (typeObj.tuple) return `Tuple(${typeObj.tuple.value_types.map((t: any) => this.formatType(t)).join(', ')})`;
        return JSON.stringify(typeObj);
    }

    private async getContractFunctionsLegacy(contractId: string): Promise<ContractFunction[]> {
        try {
            const env = getEnvironmentWithPath();
            const { stdout } = await execFileAsync(
                this.cliPath,
                [
                    'contract',
                    'invoke',
                    '--id', contractId,
                    '--source', this.source,
                    '--rpc-url', this.rpcUrl,
                    '--network-passphrase', this.networkPassphrase,
                    '--',
                    '--help'
                ],
                { env: env, timeout: 30000 }
            );
            return this.parseHelpOutput(stdout);
        } catch {
            return [];
        }
    }

    private parseHelpOutput(helpOutput: string): ContractFunction[] {
        const functions: ContractFunction[] = [];
        const lines = helpOutput.split('\n');

        let inCommandsSection = false;
        const seenFunctions = new Set<string>();

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            if (line.length === 0) {
                continue;
            }

            if (line.toLowerCase().includes('commands:') || line.toLowerCase().includes('subcommands:')) {
                inCommandsSection = true;
                continue;
            }

            if ((line.toLowerCase().includes('options:') || line.toLowerCase().includes('global options:')) && inCommandsSection) {
                inCommandsSection = false;
                break;
            }

            if (inCommandsSection) {
                const functionMatch = line.match(/^(\w+)(?:\s{2,}|\s+)(.+)?$/);
                if (functionMatch) {
                    const funcName = functionMatch[1];
                    if (!seenFunctions.has(funcName)) {
                        seenFunctions.add(funcName);
                        functions.push({
                            name: funcName,
                            description: functionMatch[2]?.trim() || '',
                            parameters: []
                        });
                    }
                }
            }
        }

        return functions;
    }
}
