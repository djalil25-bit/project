import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="public-content-page section-padding">
      <div className="container container-m">
        <nav className="breadcrumb">
          <Link to="/">Home</Link> <span>/</span> <span>Contact Us</span>
        </nav>
        
        <div className="row mt-4">
          <div className="col-md-5">
            <h1 className="page-title">Get in Touch</h1>
            <p className="lead text-muted">Have feedback or need assistance? We're here to help you grow.</p>
            
            <div className="contact-info mt-5">
              <div className="d-flex mb-4">
                <div className="icon me-3">📍</div>
                <div>
                  <h4 className="h6 fw-bold mb-1">Our Office</h4>
                  <p className="text-muted small">AgriGov Hub, Algiers, Algeria</p>
                </div>
              </div>
              <div className="d-flex mb-4">
                <div className="icon me-3">📧</div>
                <div>
                  <h4 className="h6 fw-bold mb-1">Email Us</h4>
                  <p className="text-muted small">support@agrigov.com</p>
                </div>
              </div>
              <div className="d-flex mb-4">
                <div className="icon me-3">📞</div>
                <div>
                  <h4 className="h6 fw-bold mb-1">Call Us</h4>
                  <p className="text-muted small">+213 123 456 789</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-7">
            <div className="card shadow-sm border-0 p-4 p-md-5">
              {submitted ? (
                <div className="text-center py-5">
                  <div className="h1">✅</div>
                  <h3>Message Sent!</h3>
                  <p className="text-muted">Thank you for your feedback. Our team will get back to you shortly.</p>
                  <button onClick={() => setSubmitted(false)} className="btn btn-outline btn-sm mt-3">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" required placeholder="John Doe" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control" required placeholder="john@example.com" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Subject</label>
                      <input type="text" className="form-control" required placeholder="How can we help?" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Message</label>
                      <textarea className="form-control" rows="5" required placeholder="Your message here..."></textarea>
                    </div>
                    <div className="col-12 mt-4">
                      <button type="submit" className="btn btn-primary w-100">Send Message</button>
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
