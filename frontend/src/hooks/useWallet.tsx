import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, JsonRpcProvider, Contract, type Provider } from "ethers";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  READONLY_RPC_URL,
  REGISTRO_ABI,
  getContract,
} from "../lib/contract";

export type Rol = "admin" | "emisor" | "verificador" | "sin-contrato";

interface WalletState {
  address: string | null;
  chainId: number | null;
  rol: Rol;
  conectando: boolean;
  contractAddress: string;
  /** true si hay window.ethereum (MetaMask u otra wallet inyectada). */
  tieneWallet: boolean;
  /** true si la wallet está en la red esperada (Sepolia). */
  redCorrecta: boolean;
}

interface WalletApi extends WalletState {
  conectar: () => Promise<void>;
  cambiarRed: () => Promise<void>;
  setContractAddress: (addr: string) => void;
  /** Provider de solo lectura: la wallet inyectada si existe, si no un RPC público. */
  providerLectura: () => Provider;
  /** Contrato de solo lectura: usa el signer si hay wallet, si no un RPC público. */
  contratoLectura: () => Contract;
  /** Contrato de escritura: requiere wallet conectada. Lanza si no hay signer. */
  contratoEscritura: () => Promise<Contract>;
  /** Re-deriva el rol consultando el contrato. */
  refrescarRol: () => Promise<void>;
}

const SEPOLIA_HEX = "0x" + CHAIN_ID.toString(16);
const WalletCtx = createContext<WalletApi | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [rol, setRol] = useState<Rol>("verificador");
  const [conectando, setConectando] = useState(false);
  const [contractAddress, setContractAddrState] = useState<string>(
    () => localStorage.getItem("contractAddr") || CONTRACT_ADDRESS,
  );

  const tieneWallet = typeof window !== "undefined" && !!window.ethereum;
  const redCorrecta = chainId === CHAIN_ID;

  const setContractAddress = useCallback((addr: string) => {
    const v = addr.trim();
    localStorage.setItem("contractAddr", v);
    setContractAddrState(v);
  }, []);

  const providerLectura = useCallback((): Provider => {
    return tieneWallet && window.ethereum
      ? new BrowserProvider(window.ethereum)
      : new JsonRpcProvider(READONLY_RPC_URL);
  }, [tieneWallet]);

  const contratoLectura = useCallback((): Contract => {
    if (!contractAddress) throw new Error("Falta configurar la dirección del contrato.");
    return getContract(contractAddress, providerLectura());
  }, [contractAddress, providerLectura]);

  const contratoEscritura = useCallback(async (): Promise<Contract> => {
    if (!window.ethereum) throw new Error("Instala MetaMask para enviar transacciones.");
    if (!contractAddress) throw new Error("Falta configurar la dirección del contrato.");
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new Contract(contractAddress, REGISTRO_ABI, signer);
  }, [contractAddress]);

  const refrescarRol = useCallback(async () => {
    if (!address || !contractAddress) {
      setRol("verificador");
      return;
    }
    try {
      const c = contratoLectura();
      const [adminAddr, esEmisor] = await Promise.all([
        c.admin() as Promise<string>,
        c.emisoresAutorizados(address) as Promise<boolean>,
      ]);
      if (adminAddr.toLowerCase() === address.toLowerCase()) setRol("admin");
      else if (esEmisor) setRol("emisor");
      else setRol("verificador");
    } catch {
      setRol("sin-contrato");
    }
  }, [address, contractAddress, contratoLectura]);

  const cambiarRed = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX }],
      });
    } catch {
      throw new Error("Cambia manualmente la red de MetaMask a Sepolia.");
    }
  }, []);

  const conectar = useCallback(async () => {
    if (!window.ethereum) throw new Error("Instala MetaMask para conectar tu wallet.");
    setConectando(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const red = await provider.getNetwork();
      if (Number(red.chainId) !== CHAIN_ID) {
        await cambiarRed();
      }
      const p2 = new BrowserProvider(window.ethereum);
      const signer = await p2.getSigner();
      const addr = await signer.getAddress();
      const net = await p2.getNetwork();
      setAddress(addr);
      setChainId(Number(net.chainId));
    } finally {
      setConectando(false);
    }
  }, [cambiarRed]);

  // Listeners de cambios de cuenta y red en MetaMask.
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accs = args[0] as string[];
      setAddress(accs && accs.length ? accs[0] : null);
    };
    const onChain = (...args: unknown[]) => {
      const cid = args[0] as string;
      setChainId(parseInt(cid, 16));
    };
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  // Recalcular rol cuando cambian dirección, contrato o red.
  useEffect(() => {
    void refrescarRol();
  }, [refrescarRol, chainId]);

  const value = useMemo<WalletApi>(
    () => ({
      address,
      chainId,
      rol,
      conectando,
      contractAddress,
      tieneWallet,
      redCorrecta,
      conectar,
      cambiarRed,
      setContractAddress,
      providerLectura,
      contratoLectura,
      contratoEscritura,
      refrescarRol,
    }),
    [
      address,
      chainId,
      rol,
      conectando,
      contractAddress,
      tieneWallet,
      redCorrecta,
      conectar,
      cambiarRed,
      setContractAddress,
      providerLectura,
      contratoLectura,
      contratoEscritura,
      refrescarRol,
    ],
  );

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet(): WalletApi {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet debe usarse dentro de <WalletProvider>");
  return ctx;
}
