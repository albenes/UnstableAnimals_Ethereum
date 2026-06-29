import './SplashHeader.css'
import headlogo from './images/headlogo.png'
import logo from './images/logo.png'
import DiscordIcon from './images/discord.svg?react'
import TwitterIcon from './images/twitter.svg?react'
import OpenSeaIcon from './images/open-sea.svg?react'
import { OPENSEA_NAME } from './config/contract'

function SplashHeader() {
  const scrollToMint = new Event('scrollToMint')

  return (
    <div className="SplashHeader">
      <div className="splash-spacer">&nbsp;</div>
      <div className="unstable-wrap-away">
        <div className="unstable-wrap-sway">
          <div className="unstable-wrap-rotate">
            <div className="unstable-wrap-float">
              <img className="unstable" src={headlogo} alt="Unstable Animals" />
              <br />
            </div>
          </div>
        </div>
      </div>
      <img className="logo" src={logo} alt="Unstable Animals Logo" />
      <br />
      <button
        type="button"
        onClick={() => dispatchEvent(scrollToMint)}
        className="button-1"
      >
        Mint your Unstable Animals!
      </button>
      <br />
      <a
        href={`https://opensea.io/collection/${OPENSEA_NAME}`}
        target="_blank"
        rel="noreferrer"
        className="button-2"
      >
        VIEW GALLERY
      </a>
      <br />
      <div className="social-icons">
        <a
          href="https://discord.gg/dCX6vqxXNm"
          target="_blank"
          rel="noreferrer"
          className="social-icon"
          aria-label="Discord"
        >
          <DiscordIcon />
        </a>
        <a
          href="https://twitter.com/UnstableAnimals"
          target="_blank"
          rel="noreferrer"
          className="social-icon"
          aria-label="Twitter"
        >
          <TwitterIcon />
        </a>
        <a
          href={`https://opensea.io/collection/${OPENSEA_NAME}`}
          target="_blank"
          rel="noreferrer"
          className="social-icon"
          aria-label="OpenSea"
        >
          <OpenSeaIcon style={{ marginBottom: 6 }} />
        </a>
      </div>
    </div>
  )
}

export default SplashHeader
