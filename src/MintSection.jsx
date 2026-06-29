import { useEffect, useRef, useState } from 'react'
import { formatEther } from 'ethers'
import Modal from 'react-modal'
import AnimateOnChange from 'react-animate-on-change'
import UnstableGIF from './images/UnstableGIF.gif'
import pixelParty from './images/pixel-party.png'
import MetaMaskLogo from './images/mm-logo.svg?react'
import './MintSection.css'
import './pixelLoader.css'
import { createContractStateHook } from './createContractStateHook'
import { hasWallet, resolveProvider } from './resolveProvider'
import { createContractHelper } from './createContractHelper'
import UnstableAnimals from './UnstableAnimals.json'
import MintGallery from './MintGallery'
import { useSmoothScrollTo } from './useSmoothScrollTo'
import { useLocalStorage } from './useLocalStorage'
import { usePrevious } from './usePrevious'
import {
  CHAIN_ID,
  CHAIN_ID_HEX,
  CONTRACT_ADDRESS,
  OPENSEA_NAME,
} from './config/contract'

const provider = resolveProvider()
const unstableAnimals = createContractHelper(
  CONTRACT_ADDRESS,
  UnstableAnimals.abi,
  provider,
  hasWallet()
)
const useUnstableAnimalsState = createContractStateHook(unstableAnimals.reader)

export const APP_STATE = {
  readyToMint: 'READY_TO_MINT',
  waitingForTx: 'WAITING_FOR_TX',
  txSuccess: 'TX_SUCCESS',
  soldOut: 'SOLD_OUT',
}

if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('chainChanged', () => window.location.reload())
}

function toNumber(value) {
  return typeof value === 'bigint' ? Number(value) : value
}

function MintSection() {
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

  const loadedNoneMinted = useRef(hasMintedUnstableAnimals !== true)

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
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    })
  }

  async function ensureMainnet() {
    const network = await provider.getNetwork()
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

    if (!unstableAnimals.web3Enabled) {
      setModalOpen(true)
      return
    }

    if (!buyAmount || !parseInt(buyAmount) || buyPrice?.wei === undefined) return

    const etherAmount = buyPrice.wei * BigInt(buyAmount)
    await requestAccount()

    let txHash
    try {
      await ensureMainnet()

      const signerContract = await unstableAnimals.getSignerContract()
      const transaction = await signerContract.buy(buyAmount, {
        value: etherAmount,
        gasLimit: buyAmount * 200000,
      })

      txHash = transaction.hash
      setAppState(APP_STATE.waitingForTx)
      setLastPurchasedIds([])

      await transaction.wait()
      setAppState(APP_STATE.txSuccess)

      const txReceipt = await provider.getTransactionReceipt(transaction.hash)
      const purchasedIds = txReceipt.logs
        .map((log) => unstableAnimals.interface.parseLog(log))
        .filter((log) => log?.name === 'Transfer')
        .map((log) => toNumber(log.args.tokenId))

      setLastPurchasedIds(purchasedIds)
      setHasMintedUnstableAnimals(true)
      await refreshUnstableAnimalsMinted()
    } catch (err) {
      refreshIsSaleActive()
      console.error(err)

      if (txHash) {
        setErrorMessage(
          <div className="error-message">
            Transaction failed; you may have run out of gas. <br />
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              Click here to see what happened on Etherscan.
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

  const formattedEthAmount = buyPrice?.wei !== undefined
    ? `${formatEther(buyPrice.wei * BigInt(buyAmount))} ETH`
    : undefined

  function getMintButton() {
    switch (appState) {
      case APP_STATE.readyToMint:
        return (
          <button onClick={buyUnstableAnimals}>
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
          <button onClick={resetAppState}>
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
              const inputValueInt = parseInt(inputValue)
              if (isNaN(inputValue)) {
                return
              }
              if (inputValueInt > 10) {
                let toSet = inputValue % 10
                toSet = toSet === 0 ? 10 : toSet
                toSet = inputValue === 100 ? 10 : toSet
                toSet = toSet < 1 ? 1 : toSet
                setBuyAmountValue(toSet < 1 ? 1 : toSet)
                return
              }
              if (!e.target.validity.valid) {
                return
              }
              setBuyAmountValue(inputValue)
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
    <div ref={refToScroll} className="MintSection">
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
        disabled={!showViewUnstableAnimals}
        className={
          showViewUnstableAnimals
            ? 'view-my-UnstableAnimals'
            : 'view-my-UnstableAnimals not-minted-yet'
        }
      >
        <p>View my Unstable Animals on:</p>
        <a
          href={`https://opensea.io/${window.ethereum?.selectedAddress}/${OPENSEA_NAME}`}
          target="_blank"
          rel="noreferrer"
        >
          OpenSea
        </a>
        <a
          href={`https://rarible.com/user/${window.ethereum?.selectedAddress}?tab=owned`}
          target="_blank"
          rel="noreferrer"
        >
          Rarible
        </a>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={showModal(false)}
        className="get-metamask-modal"
        overlayClassName="get-metamask-modal-overlay"
        contentLabel="Install MetaMask"
      >
        <button onClick={showModal(false)}>✕</button>
        <p>
          You&apos;ll need to install MetaMask and refresh to continue.
          <br />
          Mobile user:
        </p>
        <a
          href="https://metamask.app.link/dapp/www.unstableanimals.com"
          target="_blank"
          rel="noreferrer"
        >
          Link this page with your app
          <br />
        </a>
        <a href="https://metamask.io/download.html" target="_blank" rel="noreferrer">
          Install Metamask
          <MetaMaskLogo />
        </a>
      </Modal>
    </div>
  )
}

export default MintSection
