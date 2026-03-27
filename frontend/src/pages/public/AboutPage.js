import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="public-content-page section-padding">
      <div className="container container-narrow">
        <nav className="breadcrumb d-flex align-items-center mb-4">
          <Link to="/">Home</Link> <span className="mx-2 text-muted opacity-50"><ChevronRight size={12} /></span> <span>About Us</span>
        </nav>
        <h1 className="page-title">About AgriGov</h1>
        
        <div className="content-rich-text">
          <p className="lead">
            AgriGov is a government-backed initiative aimed at digitizing and professionalizing 
            the agricultural marketplace. Our mission is to bridge the gap between rural producers 
            and urban consumers.
          </p>
          
          <h2>Our Vision</h2>
          <p>
            We envision a world where every farmer has direct access to the market, and every 
            consumer can trace their food back to the source. By removing unnecessary intermediaries, 
            we ensure that value is distributed fairly across the supply chain.
          </p>

          <h2>How It Works</h2>
          <p>
            AgriGov operates on a role-based ecosystem:
          </p>
          <ul>
            <li><strong>The Admin:</strong> Regulates the market, approves users, and sets fair price references for all products.</li>
            <li><strong>The Farmer:</strong> Lists their produce based on the official catalog and manages their farm operations.</li>
            <li><strong>The Transporter:</strong> Manages the logistics, ensuring produce reaches its destination fresh and on time.</li>
            <li><strong>The Buyer:</strong> Browses the marketplace, purchases fresh goods, and tracks their order until it arrives.</li>
          </ul>

          <div className="info-box green-box mt-4">
            <h3>Did you know?</h3>
            <p>
              AgriGov reduces post-harvest waste by over 30% by providing farmers with 
              predictable demand and efficient logistics tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
