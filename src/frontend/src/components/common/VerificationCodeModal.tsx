import React from 'react';
import Button from './Button';

interface VerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  verificationCode: string;
  onCopyCode?: () => void;
}

const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
  isOpen,
  onClose,
  email,
  verificationCode,
  onCopyCode
}) => {
  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode).then(() => {
      alert('인증번호가 클립보드에 복사되었습니다!');
      if (onCopyCode) onCopyCode();
    }).catch(err => {
      console.error('클립보드 복사 실패:', err);
    });
  };

  const handleAutoFill = () => {
    // 인증번호 입력 필드를 찾아서 자동으로 채우기
    const verificationInput = document.querySelector('input[name="verificationCode"], input[placeholder*="인증"], input[placeholder*="코드"]') as HTMLInputElement;
    if (verificationInput) {
      verificationInput.value = verificationCode;
      verificationInput.dispatchEvent(new Event('input', { bubbles: true }));
      verificationInput.dispatchEvent(new Event('change', { bubbles: true }));
      alert('인증번호가 자동으로 입력되었습니다!');
      onClose();
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            📧 개발용 인증번호
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>받는 사람:</strong> {email}
            </p>
            <p className="text-sm text-blue-600">
              실제 환경에서는 이메일로 발송됩니다.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-green-800 mb-2">인증번호</p>
            <div className="text-2xl font-bold text-green-900 bg-white border border-green-300 rounded px-4 py-2 inline-block tracking-widest">
              {verificationCode}
            </div>
            <p className="text-xs text-green-600 mt-2">
              5분 후 만료됩니다
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              💡 개발 모드: 실제 이메일 발송 대신 이 팝업으로 인증번호를 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-2 mt-6">
          <Button
            variant="primary"
            fullWidth
            onClick={handleAutoFill}
          >
            📋 자동 입력
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleCopyCode}
          >
            📄 복사하기
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerificationCodeModal;