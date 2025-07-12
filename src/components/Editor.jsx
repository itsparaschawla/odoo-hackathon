'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

const Editor = ({ value, onChange, placeholder = "Write your content here..." }) => {
  const [editorValue, setEditorValue] = useState(value || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    setEditorValue(value || '');
    if (editorRef.current && value !== undefined) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    const content = e.target.innerHTML;
    setEditorValue(content);
    onChange && onChange(content);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const insertEmoji = (emoji) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // If no selection, insert at the end
      const textNode = document.createTextNode(emoji);
      editorRef.current.appendChild(textNode);
    }
    setShowEmojiPicker(false);
    editorRef.current.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.setEndAfter(img);
          } else {
            editorRef.current.appendChild(img);
          }
          
          editorRef.current.focus();
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const handleKeyDown = (e) => {
    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertText', '\t');
    }
  };

  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯'];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Custom Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('strikeThrough')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Insert Link"
        >
          <Link size={16} />
        </button>
        
        <button
          type="button"
          onClick={insertImage}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Insert Image"
        >
          <Image size={16} />
        </button>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Insert Emoji"
          >
            <Smile size={16} />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
              <div className="grid grid-cols-5 gap-1">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="p-1 rounded hover:bg-gray-100 text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Editor */}
      <div className="bg-white">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[200px] p-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          style={{
            minHeight: '200px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: editorValue }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />
        
        {/* Placeholder styling */}
        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Editor;