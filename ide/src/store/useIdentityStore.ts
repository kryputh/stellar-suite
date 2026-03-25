import { create } from 'zustand';
import { Keypair } from '@stellar/stellar-sdk';
import { get as idbGet, set as idbSet } from 'idb-keyval';

export interface Identity {
    nickname: string;
    publicKey: string;
    secretKey: string;
}

interface IdentityStore {
    identities: Identity[];
    activeIdentity: Identity | null;
    loading: boolean;

    // Actions
    loadIdentities: () => Promise<void>;
    addIdentity: (nickname: string, keypair: { publicKey: string; secretKey: string }) => Promise<void>;
    generateNewIdentity: (nickname: string) => Promise<void>;
    setActiveIdentity: (identity: Identity | null) => void;
    deleteIdentity: (publicKey: string) => Promise<void>;
}

const STORAGE_KEY = 'stellar_kit_identities';

export const useIdentityStore = create<IdentityStore>((set, get) => ({
    identities: [],
    activeIdentity: null,
    loading: true,

    loadIdentities: async () => {
        set({ loading: true });
        try {
            const stored = await idbGet<Identity[]>(STORAGE_KEY);
            if (stored) {
                set({ identities: stored });
                if (stored.length > 0) {
                    set({ activeIdentity: stored[0] });
                }
            }
        } catch (error) {
            console.error('Failed to load identities:', error);
        } finally {
            set({ loading: false });
        }
    },

    addIdentity: async (nickname, { publicKey, secretKey }) => {
        const { identities } = get();
        const newIdentity: Identity = { nickname, publicKey, secretKey };
        const nextIdentities = [...identities, newIdentity];

        await idbSet(STORAGE_KEY, nextIdentities);
        set({ identities: nextIdentities });
        if (!get().activeIdentity) {
            set({ activeIdentity: newIdentity });
        }
    },

    generateNewIdentity: async (nickname) => {
        const keypair = Keypair.random();
        const publicKey = keypair.publicKey();
        const secretKey = keypair.secret();

        await get().addIdentity(nickname, { publicKey, secretKey });
    },

    setActiveIdentity: (identity) => set({ activeIdentity: identity }),

    deleteIdentity: async (publicKey) => {
        const { identities, activeIdentity } = get();
        const nextIdentities = identities.filter(id => id.publicKey !== publicKey);

        await idbSet(STORAGE_KEY, nextIdentities);
        set({ identities: nextIdentities });

        if (activeIdentity?.publicKey === publicKey) {
            set({ activeIdentity: nextIdentities.length > 0 ? nextIdentities[0] : null });
        }
    }
}));
