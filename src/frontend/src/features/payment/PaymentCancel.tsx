import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 취소</h2>
        <p className="text-gray-600 mb-6">
          결제가 취소되었습니다.<br/>
          언제든지 다시 시도하실 수 있습니다.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
          >
            대시보드로 가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;