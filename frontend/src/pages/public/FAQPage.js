import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQPage = () => {
  const faqs = [
    {
      q: "How do I join as a Farmer?",
      a: "Simply register and select the 'Farmer' role. After registration, your account will be pending admin approval. An admin will review your farm details and approve your account within 24-48 hours."
    },
    {
      q: "How is the pricing determined?",
      a: "AgriGov Admins set reference prices for each product in the catalog based on current market trends. Farmers are encouraged to set their prices within the recommended min/max ranges to ensure market stability."
    },
    {
      q: "Who handles the delivery?",
      a: "Delivery is handled by our network of verified Transporters. When a farmer accepts an order, they create a delivery request which transporters in the area can accept."
    },
    {
      q: "Is my payment secure?",
      a: "Currently, we support Cash on Delivery (COD). This ensures that buyers only pay when they receive the goods, and farmers are guaranteed payment upon successful delivery."
    }
  ];

  return (
    <div className="public-content-page section-padding">
      <div className="container container-m">
        <nav className="breadcrumb d-flex align-items-center mb-4">
          <Link to="/">Home</Link> <span className="mx-2 text-muted opacity-50"><ChevronRight size={12} /></span> <span>FAQ</span>
        </nav>
        <h1 className="page-title text-center">Frequently Asked Questions</h1>
        
        <div className="faq-list mt-5">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item card p-4 mb-3">
              <h3 className="faq-question h5 fw-bold text-primary mb-2">Q: {faq.q}</h3>
              <p className="faq-answer mb-0 text-muted">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <p>Still have questions?</p>
          <Link to="/contact" className="btn btn-primary">Contact Support</Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
