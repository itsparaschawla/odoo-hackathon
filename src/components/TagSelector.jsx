'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const TagSelector = ({ selectedTags = [], onTagsChange, placeholder = "Add tags..." }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Popular tags for suggestions
  const popularTags = [
    'javascript', 'react', 'nodejs', 'python', 'html', 'css', 'mongodb',
    'express', 'nextjs', 'typescript', 'vue', 'angular', 'php', 'mysql',
    'postgresql', 'docker', 'aws', 'git', 'api', 'json', 'redux', 'graphql',
    'firebase', 'authentication', 'deployment', 'optimization', 'debugging',
    'testing', 'frontend', 'backend', 'fullstack', 'database', 'security'
  ];

  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = popularTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag)
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, selectedTags]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const addTag = (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !selectedTags.includes(normalizedTag) && selectedTags.length < 5) {
      const newTags = [...selectedTags, normalizedTag];
      onTagsChange(newTags);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Tags Container */}
      <div className="min-h-[42px] border border-gray-300 rounded-lg p-2 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {/* Selected Tags */}
        {selectedTags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent"
          disabled={selectedTags.length >= 5}
        />
        
        {/* Add Button */}
        {inputValue && (
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
          {suggestions.map((tag, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(tag)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <span className="text-gray-700">{tag}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Help Text */}
      <div className="mt-2 text-sm text-gray-500">
        {selectedTags.length > 0 && (
          <span>{selectedTags.length}/5 tags selected. </span>
        )}
        Press Enter or comma to add tags. Maximum 5 tags allowed.
      </div>
    </div>
  );
};

export default TagSelector;