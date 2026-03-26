import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Mail, 
  Phone, 
  CheckCircle, 
  Send, 
  ChevronRight,
  Info
} from 'lucide-react';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="public-content-page section-padding bg-light-soft min-vh-100">
      <div className="container container-m">
        <nav className="breadcrumb mb-5">
          <Link to="/" className="text-decoration-none text-muted small">Home</Link> 
          <span className="mx-2 text-muted opacity-50"><ChevronRight size={12} /></span> 
          <span className="small fw-bold">Contact Inquiry</span>
        </nav>
        
        <div className="row mt-4 g-5 align-items-center">
          <div className="col-md-5">
            <h1 className="page-title display-5 fw-bold mb-3">Connect With Us</h1>
            <p className="lead text-muted mb-5">Have unique requirements or need platform assistance? Our support team is ready to help your agribusiness scale.</p>
            
            <div className="contact-info-list">
              <div className="d-flex align-items-start mb-4">
                <div className="icon-boxed me-4 bg-white shadow-sm rounded-lg p-3">
                  <MapPin className="text-primary" size={24} />
                </div>
                <div>
                  <h4 className="h6 fw-bold mb-1 text-dark">Platform Headquarters</h4>
                  <p className="text-muted small mb-0">AgriGov Hub, Innovations District<br/>Algiers, Algeria</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start mb-4">
                <div className="icon-boxed me-4 bg-white shadow-sm rounded-lg p-3">
                  <Mail className="text-primary" size={24} />
                </div>
                <div>
                  <h4 className="h6 fw-bold mb-1 text-dark">Digital Support</h4>
                  <p className="text-muted small mb-0 font-monospace">support@agrigov.com</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start mb-4">
                <div className="icon-boxed me-4 bg-white shadow-sm rounded-lg p-3">
                  <Phone className="text-primary" size={24} />
                </div>
                <div>
                  <h4 className="h6 fw-bold mb-1 text-dark">Logistics Hotline</h4>
                  <p className="text-muted small mb-0">+213 123 456 789</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-7">
            <div className="agr-card p-4 p-md-5 shadow-lg border-0">
              {submitted ? (
                <div className="text-center py-5 animate-scale-in">
                  <div className="bg-success-soft d-inline-block rounded-circle p-4 mb-4">
                    <CheckCircle className="text-success" size={48} />
                  </div>
                  <h3 className="fw-bold mb-2">Message Transmitted</h3>
                  <p className="text-muted small">Thank you for your inquiry. An account executive will reach out via your registered email shortly.</p>
                  <button onClick={() => setSubmitted(false)} className="btn-agr btn-outline btn-sm mt-4">Send New Inquiry</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="agr-form">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label small fw-bold">Full Identity</label>
                        <input type="text" className="form-input" required placeholder="John Doe" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label small fw-bold">Electronic Mail</label>
                        <input type="email" className="form-input" required placeholder="john@example.com" />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label small fw-bold">Subject Summary</label>
                        <input type="text" className="form-input" required placeholder="How can our platform serve you?" />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label small fw-bold">Detailed Message</label>
                        <textarea className="form-input" rows="5" required placeholder="Please provide specific details about your query..."></textarea>
                      </div>
                    </div>
                    <div className="col-12 mt-4 pt-2">
                      <button type="submit" className="btn-agr btn-primary w-100 py-3 d-flex align-items-center justify-content-center fw-bold">
                        <Send size={18} className="me-2" /> Dispatch Request
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
