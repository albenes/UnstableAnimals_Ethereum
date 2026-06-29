import { useEffect, useMemo, useRef, useState } from 'react'
import { Contract, formatEther } from 'ethers'
import Modal from 'react-modal'
import AnimateOnChange from 'react-animate-on-change'
import UnstableGIF from './images/UnstableGIF.gif'
import pixelParty from './images/pixel-party.png'
import MetaMaskLogo from './images/mm-logo.svg?react'
import './MintSection.css'
import './pixelLoader.css'
import { createContractStateHook } from './createContractStateHook'
import UnstableAnimals from './UnstableAnimals.json'
import MintGallery from './MintGallery'
import { useSmoothScrollTo } from './useSmoothScrollTo'
import { useLocalStorage } from './useLocalStorage'
import { usePrevious } from './usePrevious'
import { useWalletConnection } from './wallet/WalletConnectionProvider'
import { parsePurchasedTokenIds } from './utils/parseMintReceipt'
import { switchToMainnet } from './utils/switchToMainnet'
import { toNumber } from './utils/toNumber'
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  OPENSEA_NAME,
} from './config/contract'

export const APP_STATE = {
  readyToMint: 'READY_TO_MINT',
  waitingForTx: 'WAITING_FOR_TX',
  txSuccess: 'TX_SUCCESS',
  soldOut: 'SOLD_OUT',
}

if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('chainChanged', () => window.location.reload())
}

function MintSection() {
  const wallet = useWalletConnection()
  const [buyAmount, setBuyAmountValue] = useState(1)
  const [lastPurchasedIds, setLastPurchasedIds] = useState([])
  const [appState, setAppState] = useState(APP_STATE.readyToMint)
  const [modalIsOpen, setModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [shouldAnimateCount, setShouldAnimateCount] = useState(false)
  const [hasMintedUnstableAnimals, setHasMintedUnstableAnimals] = useLocalStorage(
    'hasMintedUnstableAnimals',
    false
  )
  const [showViewUnstableAnimals, setShowViewUnstableAnimals] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState(null)

  const loadedNoneMinted = useRef(hasMintedUnstableAnimals !== true)

  const readerContract = useMemo(() => {
    if (!wallet.readProvider) return null
    return new Contract(CONTRACT_ADDRESS, UnstableAnimals.abi, wallet.readProvider)
  }, [wallet.readProvider])

  const contractInterface = useMemo(
    () => readerContract?.interface ?? new Contract(CONTRACT_ADDRESS, UnstableAnimals.abi).interface,
    [readerContract]
  )

  const useUnstableAnimalsState = useMemo(
    () => createContractStateHook(readerContract),
    [readerContract]
  )

  async function refreshConnectedAddress() {
    if (!wallet.canTransact) {
      setConnectedAddress(null)
      return
    }
    try {
      setConnectedAddress(await wallet.getConnectedAddress())
    } catch {
      setConnectedAddress(null)
    }
  }

  useEffect(() => {
    refreshConnectedAddress()
    if (wallet.appKitEnabled || !window.ethereum) return undefined

    const onAccountsChanged = () => {
      refreshConnectedAddress()
    }
    window.ethereum.on('accountsChanged', onAccountsChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
    }
  }, [wallet.canTransact, wallet.appKitEnabled])

  function disableCountAnimation() {
    setShouldAnimateCount(false)
  }

  useEffect(() => {
    if (hasMintedUnstableAnimals && loadedNoneMinted.current !== hasMintedUnstableAnimals) {
      setShowViewUnstableAnimals(true)
    }
  }, [hasMintedUnstableAnimals, appState])

  const [buyPrice] = useUnstableAnimalsState({
    stateVarName: 'price',
    initialData: 0n,
    transformData: (data) => ({
      wei: data,
      number: formatEther(data),
    }),
  })

  const [isSaleActive, _, __, refreshIsSaleActive] = useUnstableAnimalsState('saleEnabled', false)
  const [unstableAnimalsMinted, ___, ____, refreshUnstableAnimalsMinted] = useUnstableAnimalsState({
    stateVarName: 'UnstableAnimalsMinted',
    transformData: toNumber,
    swrOptions: { refreshInterval: 6000 },
  })
  const [maxUnstableAnimalsCount] = useUnstableAnimalsState({
    initialData: 10000n,
    stateVarName: 'MAX_SUPPLY',
    transformData: toNumber,
  })

  const allSold =
    maxUnstableAnimalsCount !== undefined &&
    unstableAnimalsMinted !== undefined &&
    maxUnstableAnimalsCount === unstableAnimalsMinted

  const unstableAnimalsMintedPrevious = usePrevious(unstableAnimalsMinted)
  useEffect(() => {
    if (
      unstableAnimalsMinted !== undefined &&
      unstableAnimalsMintedPrevious !== undefined &&
      unstableAnimalsMinted !== unstableAnimalsMintedPrevious
    ) {
      setShouldAnimateCount(true)
    }
  }, [unstableAnimalsMinted, unstableAnimalsMintedPrevious])

  useEffect(() => {
    setAppState((current) => {
      if (current === APP_STATE.waitingForTx || current === APP_STATE.txSuccess) {
        return current
      }
      if (!isSaleActive || allSold) {
        return APP_STATE.soldOut
      }
      if (current === APP_STATE.soldOut) {
        return APP_STATE.readyToMint
      }
      return current
    })
  }, [isSaleActive, allSold])

  const soldOutLabel = allSold ? 'Sold out!' : 'Sale not started'

  function showModal(bool) {
    return () => setModalOpen(bool)
  }

  async function requestAccount() {
    await wallet.connect()
    if (!wallet.appKitEnabled) {
      await switchToMainnet()
    }
    await refreshConnectedAddress()
  }

  async function ensureMainnet() {
    const writeProvider = await wallet.getWriteProvider()
    const network = await writeProvider.getNetwork()
    if (Number(network.chainId) !== CHAIN_ID) {
      throw new Error('Please use Ethereum Mainnet')
    }
  }

  function resetAppState() {
    loadedNoneMinted.current = false
    if (isSaleActive && !allSold) {
      setAppState(APP_STATE.readyToMint)
    } else {
      setAppState(APP_STATE.soldOut)
    }
  }

  async function buyUnstableAnimals() {
    setErrorMessage(null)

    if (!wallet.canTransact) {
      if (wallet.appKitEnabled) {
        wallet.openAppKit()
      } else {
        setModalOpen(true)
      }
      return
    }

    if (!buyAmount || !parseInt(buyAmount, 10) || buyPrice?.wei === undefined) return

    const etherAmount = buyPrice.wei * BigInt(buyAmount)

    let txHash
    try {
      await requestAccount()
      await ensureMainnet()

      const writeProvider = await wallet.getWriteProvider()
      const signer = await writeProvider.getSigner()
      const signerContract = new Contract(CONTRACT_ADDRESS, UnstableAnimals.abi, signer)

      let gasLimit
      try {
        const estimated = await signerContract.buy.estimateGas(buyAmount, { value: etherAmount })
        gasLimit = (estimated * 120n) / 100n
      } catch {
        gasLimit = BigInt(buyAmount * 200000)
      }

      const transaction = await signerContract.buy(buyAmount, {
        value: etherAmount,
        gasLimit,
      })

      txHash = transaction.hash
      setAppState(APP_STATE.waitingForTx)
      setLastPurchasedIds([])

      const txReceipt = await transaction.wait()
      setAppState(APP_STATE.txSuccess)

      const purchasedIds = parsePurchasedTokenIds(txReceipt, contractInterface)

      if (purchasedIds.length > 0 && purchasedIds.length < buyAmount) {
        setErrorMessage(
          <div className="confirmation-message">
            Minted {purchasedIds.length} of {buyAmount} requested — remaining supply may be limited.
            Excess ETH was refunded by the contract.
          </div>
        )
      }

      setLastPurchasedIds(purchasedIds)
      setHasMintedUnstableAnimals(true)
      await refreshUnstableAnimalsMinted()
    } catch (err) {
      refreshIsSaleActive()
      console.error(err)

      if (txHash) {
        setErrorMessage(
          <div className="error-message">
            Transaction failed.{' '}
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
              View on Etherscan
            </a>
          </div>
        )
      } else {
        setErrorMessage(
          <div className="error-message">Error occurred! Error message: {`${err.message}`}</div>
        )
      }
      resetAppState()
    }
  }

  const formattedEthAmount =
    buyPrice?.wei !== undefined
      ? `${formatEther(buyPrice.wei * BigInt(buyAmount))} ETH`
      : undefined

  function getMintButton() {
    switch (appState) {
      case APP_STATE.readyToMint:
        if (!wallet.canTransact) {
          return (
            <button type="button" onClick={buyUnstableAnimals} className="connect-wallet-btn">
              Connect wallet to mint
            </button>
          )
        }
        return (
          <button type="button" onClick={buyUnstableAnimals}>
            <span
              className="mint-word"
              style={formattedEthAmount ? { float: 'left', marginLeft: 8 } : {}}
            >
              Mint
            </span>
            {formattedEthAmount ? <span className="mint-price">({formattedEthAmount})</span> : ''}
          </button>
        )

      case APP_STATE.waitingForTx:
        return (
          <button className="minting" disabled={true}>
            <span>Minting...</span>
          </button>
        )

      case APP_STATE.txSuccess:
        return (
          <button type="button" onClick={resetAppState}>
            <span className="mint-more">Mint more!</span>
          </button>
        )

      case APP_STATE.soldOut:
        return (
          <button className="sold-out" disabled={true}>
            <span className="mint-word">{soldOutLabel}</span>
          </button>
        )

      default:
        return null
    }
  }

  function getMintInput() {
    switch (appState) {
      case APP_STATE.readyToMint:
        return (
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            pattern="[0-9]"
            onClick={(e) => e.target.select()}
            onChange={(e) => {
              const inputValue = e.target.value
              if (inputValue.indexOf('.') > -1) {
                setBuyAmountValue(inputValue.split('.')[0])
                return
              }
              if (inputValue === '') {
                return
              }
              const inputValueInt = parseInt(inputValue, 10)
              if (isNaN(inputValueInt)) {
                return
              }
              if (inputValueInt > 10) {
                let toSet = inputValueInt % 10
                toSet = toSet === 0 ? 10 : toSet
                toSet = inputValueInt === 100 ? 10 : toSet
                toSet = toSet < 1 ? 1 : toSet
                setBuyAmountValue(toSet < 1 ? 1 : toSet)
                return
              }
              if (!e.target.validity.valid) {
                return
              }
              setBuyAmountValue(inputValueInt)
            }}
            value={buyAmount}
          />
        )

      case APP_STATE.waitingForTx:
        return (
          <div className="loader-container">
            <div className="pixel-loader"></div>
          </div>
        )

      case APP_STATE.txSuccess:
        return <img src={pixelParty} className="pixel-party" alt="" />

      case APP_STATE.soldOut:
        return null

      default:
        return null
    }
  }

  const refToScroll = useSmoothScrollTo('#mint', 'scrollToMint')

  return (
    <div id="mint" ref={refToScroll} className="MintSection">
      <div className="mint-content-left">
        <h1>Find your Unstable Animals!</h1>
        <p>
          In our latest expedition to the parallel worlds, we found a breach in space. 10,000
          unstable animals have crossed to our reality and now live on the Ethereum blockchain as
          ERC-721 tokens.
        </p>
        <p>
          Each one is a unique digital collectible with voxel aesthetic. You could find 15 different
          species with 9 trait categories.
        </p>
        <p>
          Rare species: Martian, Dragon, Dinosaur and an Unknown Alien. (Each with less than 1% drop
          chance).
        </p>
        <p className="mint-time">Sale is ACTIVE! You can mint up to 10 at a time!</p>

        <div className="mint-interface">
          {wallet.appKitEnabled && (
            <div className="wallet-connect-row">
              <appkit-button />
            </div>
          )}
          <div className="UnstableAnimals-minted-wrapper">
            {unstableAnimalsMinted !== undefined && (
              <div className="UnstableAnimals-minted">
                <AnimateOnChange
                  baseClassName="UnstableAnimals-minted-count"
                  animationClassName="UnstableAnimals-minted-count--flash"
                  animate={shouldAnimateCount}
                  onAnimationEnd={disableCountAnimation}
                >
                  {unstableAnimalsMinted}
                </AnimateOnChange>{' '}
                / 10,000 Unstable Animals&nbsp;MINTED
              </div>
            )}
          </div>
          {getMintInput()}
          {getMintButton()}
        </div>
      </div>

      <div className="mint-content-right">
        <img src={UnstableGIF} alt="Unstable Animals" />
      </div>

      {errorMessage && errorMessage}

      {!(appState === APP_STATE.soldOut) && (
        <MintGallery
          buyAmount={buyAmount}
          purchasedIds={lastPurchasedIds}
          appState={appState}
          contractAddress={CONTRACT_ADDRESS}
        />
      )}

      <div
        className={
          showViewUnstableAnimals
            ? 'view-my-UnstableAnimals'
            : 'view-my-UnstableAnimals not-minted-yet'
        }
      >
        <p>View my Unstable Animals on:</p>
        {connectedAddress ? (
          <>
            <a
              href={`https://opensea.io/${connectedAddress}/${OPENSEA_NAME}`}
              target="_blank"
              rel="noreferrer"
            >
              OpenSea
            </a>
            <a
              href={`https://rarible.com/user/${connectedAddress}?tab=owned`}
              target="_blank"
              rel="noreferrer"
            >
              Rarible
            </a>
          </>
        ) : (
          <p className="connect-wallet-hint">Connect your wallet to view your collection links.</p>
        )}
      </div>

      {!wallet.appKitEnabled && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={showModal(false)}
          className="get-metamask-modal"
          overlayClassName="get-metamask-modal-overlay"
          contentLabel="Connect a wallet"
        >
          <button type="button" onClick={showModal(false)} aria-label="Close">
            ✕
          </button>
          <p>
            Connect an Ethereum wallet to mint (MetaMask, Coinbase Wallet, Rabby, etc.).
            <br />
            Mobile users can open this site in your wallet&apos;s in-app browser:
          </p>
          <a
            href="https://metamask.app.link/dapp/www.unstableanimals.com"
            target="_blank"
            rel="noreferrer"
          >
            Open in MetaMask
            <br />
          </a>
          <a href="https://metamask.io/download.html" target="_blank" rel="noreferrer">
            Get MetaMask
            <MetaMaskLogo />
          </a>
        </Modal>
      )}
    </div>
  )
}

export default MintSection
