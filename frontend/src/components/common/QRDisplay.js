import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRDisplay = ({ value, size = 120, title = "Order QR Reference" }) => {
  if (!value) return null;

  return (
    <div className="qr-container d-inline-block p-3 bg-white border rounded shadow-sm">
      <div className="very-small text-muted text-center mb-2 fw-bold text-uppercase">{title}</div>
      <div className="qr-svg-wrapper flex-center">
        <QRCodeSVG 
          value={value} 
          size={size}
          includeMargin={true}
          level="H"
          imageSettings={{
            src: "/favicon.ico",
            x: undefined,
            y: undefined,
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>
      <div className="very-small text-center mt-2 font-monospace text-primary">{value}</div>
    </div>
  );
};

export default QRDisplay;
