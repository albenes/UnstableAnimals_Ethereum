import './FooterSection.css'
import DiscordIcon from './images/discord.svg?react'
import TwitterIcon from './images/twitter.svg?react'
import OpenSeaIcon from './images/open-sea.svg?react'
import { OPENSEA_NAME } from './config/contract'

function FooterSection() {
  return (
    <div className="footer">
      <div className="social">
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
        <a
          href="https://etherscan.io/address/0xe29d2d356bffe827e4df3b6ca9fdc9819c3e2651#code"
          target="_blank"
          rel="noreferrer"
        >
          Verified Smart Contract
        </a>
      </div>
    </div>
  )
}

export default FooterSection
