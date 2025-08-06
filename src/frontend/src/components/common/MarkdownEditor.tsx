import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '마크다운으로 작성하세요...',
  minHeight = '400px',
  onImageUpload
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isUploading, setIsUploading] = useState(false);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !onImageUpload) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setIsUploading(true);
          try {
            const imageUrl = await onImageUpload(file);
            const imageMarkdown = `![붙여넣은 이미지](${imageUrl})`;
            onChange(value + '\n' + imageMarkdown);
          } catch (error) {
            console.error('이미지 업로드 실패:', error);
            alert('이미지 업로드에 실패했습니다.');
          } finally {
            setIsUploading(false);
          }
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || !onImageUpload) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = imageFiles.map(file => onImageUpload(file));
      const imageUrls = await Promise.all(uploadPromises);
      const imageMarkdown = imageUrls.map(url => `![드래그한 이미지](${url})`).join('\n');
      onChange(value + '\n' + imageMarkdown);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveTab('write')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'write'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 작성
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👁️ 미리보기
        </button>
        <div className="flex-1"></div>
        <div className="px-4 py-2 text-xs text-gray-500 flex items-center">
          {isUploading ? (
            <span className="text-indigo-600">이미지 업로드 중...</span>
          ) : (
            <>마크다운 지원 • 이미지 붙여넣기/드래그 가능</>
          )}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div style={{ minHeight }}>
        {activeTab === 'write' ? (
          <div 
            className="relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="w-full h-full p-4 border-0 focus:outline-none resize-none"
              style={{ minHeight }}
            />
            
            {/* 마크다운 도움말 */}
            {!value && (
              <div className="absolute top-16 left-4 right-4 text-sm text-gray-400 pointer-events-none">
                <div className="space-y-2">
                  <div><strong># 제목</strong> → 큰 제목</div>
                  <div><strong>## 소제목</strong> → 작은 제목</div>
                  <div><strong>**굵은글씨**</strong> → <strong>굵은글씨</strong></div>
                  <div><strong>*기울임*</strong> → <em>기울임</em></div>
                  <div><strong>[링크](URL)</strong> → 링크</div>
                  <div><strong>![이미지](URL)</strong> → 이미지</div>
                  <div className="text-indigo-400"><strong>📷 이미지 업로드:</strong> 파일 첨부 버튼 또는 Ctrl+V로 붙여넣기</div>
                  <div><strong>```언어</strong><br />코드<br /><strong>```</strong> → 코드블록</div>
                  <div><strong>- 항목</strong> → 목록</div>
                  <div><strong>&gt; 인용</strong> → 인용문</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 overflow-auto" style={{ minHeight }}>
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props: any) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                        {...rest}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...rest}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-4 pb-2 border-b border-gray-200">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mb-3 mt-6">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold mb-2 mt-4">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 py-2 mb-4 italic bg-gray-50">
                      {children}
                    </blockquote>
                  ),
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline"
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    <img 
                      src={src} 
                      alt={alt} 
                      className="max-w-full h-auto rounded-lg shadow-sm my-4"
                    />
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-left font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 border-b border-gray-100">
                      {children}
                    </td>
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <div className="text-gray-400 italic">
                작성 탭에서 마크다운을 입력하면 여기에 미리보기가 표시됩니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;