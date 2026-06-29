import './TeamSection.css'
import Albenes from './images/Albenes.png'
import Ksa from './images/Ksa.png'

function TeamSection() {
  return (
    <div id="team">
      <h3>Team</h3>
      <div id="teammembers">
        <a
          href="https://twitter.com/albenes10"
          target="_blank"
          rel="noreferrer"
          className="member"
        >
          <img src={Albenes} alt="Albenes, designer and developer" />
          <div className="infos">
            <span className="nickname">Albenes</span>
            <p>Designer and developer</p>
          </div>
        </a>
        <div className="member">
          <img src={Ksa} alt="Ksa, designer and community manager" />
          <div className="infos">
            <span className="nickname">Ksa</span>
            <p>Mom by day</p>
            <p>Designer and community manager by night</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamSection
