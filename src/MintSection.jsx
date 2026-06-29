import { useEffect, useRef, useState } from 'react'
import { formatEther } from 'ethers'
import Modal from 'react-modal'
import AnimateOnChange from 'react-animate-on-change'
import scientist from './images/scientist-animated.gif'
import pixelParty from './images/pixel-party.png'
import MetaMaskLogo from './images/mm-logo.svg?react'
import './MintSection.css'
import './pixelLoader.css'
import { createContractStateHook } from "./createContractStateHook";
import { hasWallet, resolveProvider } from "./resolveProvider";
import { createContractHelper } from "./createContractHelper";
import SpaceShibas from './artifacts/contracts/SpaceShibas.sol/SpaceShibas.json'
import MintGallery from "./MintGallery";
import {useSmoothScrollTo} from "./useSmoothScrollTo";
import {useLocalStorage} from './useLocalStorage'
import {usePrevious} from "./usePrevious";

// Deployed mainnet contract — do not change without a redeployment
const CONTRACT_ADDRESS = '0xeF81c2C98cb9718003A89908e6bd1a5fA8A098A3'
const CHAIN_ID = '0x1'
// On-chain collection slug for OpenSea profile links (must match deployed contract listing)
export const OPENSEA_NAME = 'spaceshibas'

const provider = resolveProvider()
const spaceShibas = createContractHelper(CONTRACT_ADDRESS, SpaceShibas.abi, provider, hasWallet())
const useSpaceShibasState = createContractStateHook(spaceShibas.reader)

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
  const [lastPurchasedShibaIds, setLastPurchasedShibaIds] = useState([])
  const [appState, setAppState] = useState(APP_STATE.readyToMint)
  const [modalIsOpen, setModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [shouldAnimateCount, setShouldAnimateCount] = useState(false)
  const [hasMintedUnstableAnimals, setHasMintedUnstableAnimals] = useLocalStorage('hasMintedUnstableAnimals', false)
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

  const [buyPrice] = useSpaceShibasState({
    stateVarName: 'price',
    initialData: 0n,
    transformData: (data) => ({
      wei: data,
      number: formatEther(data)
    })
  })

  const [isSaleActive, _, __, refreshIsSaleActive] = useSpaceShibasState('saleEnabled', true)
  const [shibasMinted, ___, ____, refreshShibasMinted] = useSpaceShibasState({
    stateVarName: 'shibasMinted',
    transformData: toNumber,
    swrOptions: { refreshInterval: 6000 },
  })
  const [maxShibaCount] = useSpaceShibasState({
    initialData: 10000n,
    stateVarName: 'MAX_SUPPLY',
    transformData: toNumber,
  })

  const allSold = maxShibaCount === shibasMinted

  const shibasMintedPrevious = usePrevious(shibasMinted)
  useEffect(() => {
    if (
      shibasMinted !== undefined &&
      shibasMintedPrevious !== undefined &&
      shibasMinted !== shibasMintedPrevious
    ) {
      setShouldAnimateCount(true)
    }
  }, [shibasMinted, shibasMintedPrevious])

  useEffect(() => {
    if (!isSaleActive || allSold) {
      setAppState(APP_STATE.soldOut)
    }
  }, [isSaleActive, allSold])

  function showModal(bool) {
    return () => setModalOpen(bool)
  }

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID }],
    });
  }

  function resetAppState() {
    loadedNoneMinted.current = false
    setAppState(APP_STATE.readyToMint)
  }

  async function buyShibas() {
    setErrorMessage(null)
    if (!spaceShibas.web3Enabled) {
      setModalOpen(true)
      return
    }
    if (!buyAmount || !parseInt(buyAmount) || buyPrice?.wei === undefined) return
    const etherAmount = buyPrice.wei * BigInt(buyAmount)
    await requestAccount()
    let txHash
    try {
      const signerContract = await spaceShibas.getSignerContract()
      const transaction = await signerContract.buy(
        buyAmount, {
          value: etherAmount,
          gasLimit: buyAmount * 180000,
        }
      )
      txHash = transaction.hash
      setAppState(APP_STATE.waitingForTx)
      setLastPurchasedShibaIds([])
      await transaction.wait()
      setAppState(APP_STATE.txSuccess)
      const txReceipt = await provider.getTransactionReceipt(transaction.hash)
      const purchasedIds = txReceipt.logs
        .map((log) => spaceShibas.interface.parseLog(log))
        .filter((log) => log?.name === 'Transfer')
        .map((log) => toNumber(log.args.tokenId))
      setLastPurchasedShibaIds(purchasedIds)
      setHasMintedUnstableAnimals(true)
      await refreshShibasMinted()
    } catch (err) {
      refreshIsSaleActive()
      console.error(err)
      if (txHash) {
        setErrorMessage(
          <div className='error-message'>
            Transaction failed; you may have run out of gas. <br />
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel='noreferrer'>Click here to see what happened on EtherScan.</a>
          </div>
        )
      } else {
        setErrorMessage(
          <div className='error-message'>
            Error occurred! Error message: {`${err.message}`}
          </div>
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
        return <button
          onClick={buyShibas}
        >
          <span className='mint-word' style={formattedEthAmount ? {float: 'left', marginLeft: 8} : {}}>Mint</span>
          {formattedEthAmount ? <span className='mint-price'>({formattedEthAmount})</span> : ''}
        </button>;

      case APP_STATE.waitingForTx:
        return <button
          className='minting'
          disabled={true}
        >
          <span>Minting...</span>
        </button>

      case APP_STATE.txSuccess:
        return <button
          onClick={resetAppState}
        >
          <span className='mint-more'>Mint more!</span>
        </button>

      case APP_STATE.soldOut:
        return <button
          className='sold-out'
          disabled={true}
        >
          <span className='mint-word'>SOLD OUT!</span>
        </button>

      default:
        return
    }
  }

  function getMintInput() {
    switch (appState) {
      case APP_STATE.readyToMint:
        return <input
          type='number'
          min={1}
          max={10}
          step={1}
          pattern="[0-9]"
          onClick={e => {
            e.target.select()
          }}
          onChange={e => {
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
              toSet = toSet == 0 ? 10 : toSet
              toSet = inputValue == 100 ? 10 : toSet
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

      case APP_STATE.waitingForTx:
        return <div className="loader-container"><div className="pixel-loader"></div></div>

      case APP_STATE.txSuccess:
        return <img src={pixelParty} className='pixel-party' />

      case APP_STATE.soldOut:
        return

      default:
        return
    }
  }

  const refToScroll = useSmoothScrollTo('#mint', 'scrollToMint')

  return (
    <div ref={refToScroll} className="MintSection">
      <div className="mint-content-left">
        <h1>Find your Unstable Animals!</h1>
        <p>In our latest expedition to the parallel worlds, we found a breach in space. 10,000 unstable animals have crossed to our reality and now live on the Ethereum blockchain as ERC-721 tokens.</p>
        <p>Each mint can stabilize up to 10 Unstable Animals at a time.</p>
        <div className="mint-interface">
          <div className='shibas-minted-wrapper'>
            {shibasMinted !== undefined && <div className='shibas-minted'>
              <AnimateOnChange
                baseClassName='shiba-minted-count'
                animationClassName='shiba-minted-count--flash'
                animate={shouldAnimateCount}
                onAnimationEnd={disableCountAnimation}
              >
                {shibasMinted}
              </AnimateOnChange> / 10,000 Unstable Animals&nbsp;MINTED
            </div>}
          </div>
          {getMintInput()}
          {getMintButton()}
        </div>
      </div>

      <div className="mint-content-right">
        <img alt='An unstable animal researcher' src={scientist} />
      </div>

      {errorMessage && errorMessage}

      {!(appState === APP_STATE.soldOut) && <MintGallery
        buyAmount={buyAmount}
        purchasedIds={lastPurchasedShibaIds}
        appState={appState}
        contractAddress={CONTRACT_ADDRESS}
      />}

      <div
        disabled={!showViewUnstableAnimals}
        className={showViewUnstableAnimals ? 'view-my-shibas' : 'view-my-shibas not-minted-yet'}
      >
        <p>View my Unstable Animals on:</p>
        <a
          href={`https://opensea.io/${window.ethereum?.selectedAddress}/${OPENSEA_NAME}`}
          target='_blank'
          rel='noreferrer'
        >
          OpenSea
        </a>
        <a
          href={`https://rarible.com/user/${window.ethereum?.selectedAddress}?tab=owned`}
          target='_blank'
          rel='noreferrer'
        >
          Rarible
        </a>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={showModal(false)}
        className="get-metamask-modal"
        overlayClassName="get-metamask-modal-overlay"
        contentLabel="Example Modal"
      >
        <button onClick={showModal(false)}>✕</button>
        <p>You'll need to install MetaMask to continue.<br />Once you have it installed, refresh this page. </p>
        <a href='https://metamask.io/download.html' target='_blank' rel='noreferrer'>Install Metamask<MetaMaskLogo /></a>

      </Modal>
    </div>
  )
}

export default MintSection
