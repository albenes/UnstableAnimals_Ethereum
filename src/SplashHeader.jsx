import './SplashHeader.css'
import shib from './images/shib.png'
import logo from './images/logo.png'
import DiscordIcon from "./images/discord.svg?react";
import TwitterIcon from "./images/twitter.svg?react";
import OpenSeaIcon from "./images/open-sea.svg?react";
import { OPENSEA_NAME } from "./MintSection";

function SplashHeader() {

  const scrollToMint = new Event('scrollToMint')

  return (
    <div className="SplashHeader">
      <div className="splash-spacer">&nbsp;</div>
      <div className="shiba-wrap-away">
        <div className="shiba-wrap-sway">
          <div className="shiba-wrap-rotate">
            <div className={"shiba-wrap-float"}>
              <img className="shiba-inu" src={shib} alt="Unstable Animals" /><br />
            </div>
          </div>
        </div>
      </div>
      <img className="logo" src={logo} alt="Unstable Animals Logo" /><br />
      <a onClick={() => dispatchEvent(scrollToMint)} className="button-1">
        MINT UNSTABLE ANIMALS
      </a><br />
      <a href={`https://opensea.io/collection/${OPENSEA_NAME}`} target='_blank' rel='noreferrer' className="button-2">
        VIEW GALLERY
      </a><br />
      <div className="social-icons">
        <a href="https://discord.gg/dCX6vqxXNm" target='_blank' rel='noreferrer' className="social-icon"><DiscordIcon /></a>
        <a href="https://twitter.com/UnstableAnimals" target='_blank' rel='noreferrer' className="social-icon"><TwitterIcon /></a>
        <a href={`https://opensea.io/collection/${OPENSEA_NAME}`} target='_blank' rel='noreferrer' className="social-icon"><OpenSeaIcon style={{marginBottom: 6}} /></a>
      </div>
    </div>
  )
}

export default SplashHeader
