import './App.css'
import SplashHeader from "./SplashHeader";
import MintSection from "./MintSection";
import TimelineSection from "./TimelineSection";
import TeamSection from './TeamSection';
import FooterSection from './FooterSection';

function App() {
  return (
    <div className="App">
      <SplashHeader />
      <MintSection />
      <TimelineSection />
      <TeamSection/>
      <FooterSection/>
    </div>
  )
}

export default App
