import { Contract } from 'ethers';

export function createContractHelper(address, abi, provider, web3Enabled = false) {
  if (!provider) {
    return { web3Enabled: false };
  }

  const reader = new Contract(address, abi, provider);

  return {
    web3Enabled,
    reader,
    address,
    abi,
    provider,
    interface: reader.interface,
    async getSignerContract() {
      const signer = await provider.getSigner();
      return new Contract(address, abi, signer);
    },
  };
}
