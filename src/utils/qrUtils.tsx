import React from 'react';
import QRCode from 'react-qr-code';

export const generateQRString = (patientId: string | number) => {
  return `HEALER_PATIENT_${patientId}`;
};

export const QRCodeDisplay = ({ qrString, clinicName }: { qrString: string; clinicName?: string }) => {
  return (
    <div className="flex flex-col items-center gap-4 p-8 border-4 border-blue-600 rounded-3xl bg-white shadow-xl">
      <div className="p-4 bg-white rounded-2xl">
        <QRCode 
          value={qrString} 
          size={256}
          fgColor="#1e3a8a" // dark blue
        />
      </div>
      {clinicName && (
        <span className="text-2xl font-black text-blue-900 uppercase tracking-widest text-center">
          {clinicName}
        </span>
      )}
    </div>
  );
};
