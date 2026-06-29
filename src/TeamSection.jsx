import './TeamSection.css'
import Albenes from './images/Albenes.png'
import Ksa from './images/Ksa.png'

function TeamSection() {

    return (
      <div id = "team" > 
        <h3>Team</h3> 
        <div id = "teammembers" > 
            <a href="https://twitter.com/albenes10" target="_blank" class="member">
              <img src= {Albenes}></img>
                <div class="infos">
                    <span class="nickname">Albenes</span>
                    <p>Designer and developer</p>
                </div>
            </a>
            <a target="_blank" class="member">
              <img src= {Ksa}></img>
                <div class="infos">
                  <span class="nickname">Ksa</span>
                  <p>Mom by day</p>
                  <p>Designer and community manager by night</p>
                </div>
            </a>
        </div>
      </div>
    )

}

export default TeamSection 