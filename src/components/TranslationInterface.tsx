import React, { useState, useEffect, useRef } from 'react'
import { Globe, ThumbsUp, ThumbsDown, Copy, Upload, Maximize2, Minimize2, Moon, Sun, FileText } from 'lucide-react'

const TranslationInterface: React.FC = () => {
  // State to manage the input text
  const [inputText, setInputText] = useState('')
  // State to manage the list of translations
  const [translations, setTranslations] = useState<Array<{ source: string; translated: string }>>([])
  // State to manage source and target languages
  const [sourceLanguage, setSourceLanguage] = useState('auto')
  const [targetLanguage, setTargetLanguage] = useState('de')
  // Reference to the end of the translations list for auto-scrolling
  const translationsEndRef = useRef<HTMLDivElement | null>(null)
  // Reference to the textarea element for auto-resizing
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  // State to manage whether to show the shadow on the form
  const [showShadow, setShowShadow] = useState(true)
  // State to manage whether the textarea is expanded
  const [isExpanded, setIsExpanded] = useState(false)
  // State to manage tooltip text for copy button
  const [tooltipText, setTooltipText] = useState('Copy to clipboard')
  // State to manage dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('isDarkMode')
    return savedMode ? JSON.parse(savedMode) : false
  })

  const languageOptions = [
    { code: 'auto', label: 'Auto-detect' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ru', label: 'Russian' },
    { code: 'ko', label: 'Korean' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'ar', label: 'Arabic' },
    { code: 'hi', label: 'Hindi' },
    { code: 'bn', label: 'Bengali' },
    { code: 'pa', label: 'Punjabi' },
    { code: 'vi', label: 'Vietnamese' },
    { code: 'tr', label: 'Turkish' },
    { code: 'fa', label: 'Persian' },
    { code: 'nl', label: 'Dutch' },
    { code: 'pl', label: 'Polish' },
  ]

  // Function to handle translation (mocked by reversing the text)
  const translateText = async (text: string) => {
    // Mock translation by reversing the input text
    const mockTranslation = text.split('').reverse().join('')
    // Update the translations state with the new translation
    setTranslations(prev => [...prev, { source: text, translated: mockTranslation }])
  }

  // Handle changes in the input field
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    // Auto-resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  // Handle form submission to trigger translation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      // Trigger translation and clear the input field
      translateText(inputText)
      setInputText('')
      // Reset the textarea height after submission
      if (textareaRef.current) {
        textareaRef.current.style.height = '60px'
      }
    }
  }

  // Handle key press events for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  // Handle expand/minimize textarea
  const handleExpandTextarea = () => {
    if (textareaRef.current) {
      if (isExpanded) {
        // Minimize textarea to fit content or minimum height
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 60)}px`
      } else {
        // Expand textarea to max-height
        textareaRef.current.style.height = '600px'
      }
      setIsExpanded(!isExpanded)
    }
  }

  // Copy translated text to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setTooltipText('Copied!')
      setTimeout(() => setTooltipText('Copy to clipboard'), 2000)
    }).catch((err) => {
      console.error('Failed to copy text: ', err)
    })
  }

  // Scroll to the bottom of the translations list whenever a new translation is added
  useEffect(() => {
    if (translationsEndRef.current) {
      translationsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [translations])

  // Handle scrolling to toggle the shadow on the form
  useEffect(() => {
    const handleScroll = () => {
      if (translationsEndRef.current) {
        const isScrolledToBottom = translationsEndRef.current.getBoundingClientRect().bottom <= window.innerHeight
        setShowShadow(!isScrolledToBottom)
      }
    }
    
    const container = document.querySelector('.overflow-y-auto')
    if (container) {
      container.addEventListener('scroll', handleScroll)
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [translations])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode: any) => {
      const newMode = !prevMode
      localStorage.setItem('isDarkMode', JSON.stringify(newMode))
      return newMode
    })
  }

  return (
    <div className={`flex-1 flex flex-col max-w-8xl mx-auto w-full ${isDarkMode ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-50 text-neutral-900'}`}>
      {/* Floating dark mode toggle button */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-4 right-4 p-2 bg-neutral-800 text-neutral-100 rounded-full shadow-lg focus:outline-none hover:bg-neutral-700 z-50"
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
      {/* Container for the list of translations or empty state */}
      <div className={`${translations.length === 0 ? 'flex-1 flex flex-col items-center justify-center' : 'flex-1 overflow-y-auto mb-4 space-y-0'}`}>
        {translations.length === 0 ? (
          <>
            <div className="flex flex-col items-center p-1 justify-center h-full text-center text-neutral-500">
              <FileText className="w-8 h-8 mb-1 text-[#03eab3]" />
              <h2 className="text-neutral-700 text-3xl font-medium p-2">Your Translation Portal</h2>
              <p>Safe, secure, and supercharged with your linguistic assets.</p>
            </div>
            {/* Form for entering text to be translated, centered */}
            <div className="w-full max-w-2xl mt-8">
              <form onSubmit={handleSubmit} className="relative mx-auto">
                <div className="flex space-x-2 mb-2">
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-100'}`}
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value= {targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-100'}`}
                  >
                    {languageOptions.filter((lang) => lang.code !== 'auto').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type something... or drag and drop / upload a supported file"
                  className={`w-full p-4 border shadow-lg rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-hidden resize-none hover:bg-neutral-100 ${isDarkMode ? 'bg-neutral-800 text-neutral-100 border-neutral-700 hover:bg-neutral-700' : 'bg-white border-neutral-200'}`}
                  rows={1}
                  style={{ minHeight: '60px', maxHeight: '600px' }}
                />
                {/* Buttons for file upload and submitting the form */}
                <div className="absolute right-2 bottom-2 p-2 flex items-center space-x-2">
                  <button type="button" className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'}`} onClick={handleExpandTextarea}>
                    {isExpanded ? <Minimize2 className={`w-5 h-5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} /> : <Maximize2 className={`w-5 h-5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />}
                  </button>
                  <button type="button" className={`p-2 rounded-lg mr-1 ${isDarkMode ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'}`}>              
                    <Upload className={`w-5 h-5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />
                  </button>
                  <button type="submit" className={`p-2 rounded-xl text-white ${isDarkMode ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-900 hover:bg-neutral-600'}`}>Translate</button>
                </div>
              </form>
            </div>
          </>
        ) : (
          translations.map((translation, index) => (
            <div key={index} className={`flex space-x-0 ${index % 2 === 0 ? (isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100') : ''}`}>
              {/* Source text container */}
              <div className={`flex-1 ml-24 border-r p-4 ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <div className="whitespace-pre-wrap py-8">{translation.source}</div>
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    <img src="https://i.pravatar.cc/24" alt="User Avatar" className="w-6 h-6 rounded-md mr-2" />
                    <span className={`text-sm pr-3 font-normal ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{sourceLanguage === 'auto' ? 'English' : languageOptions.find(lang => lang.code === sourceLanguage)?.label}</span>
                  </div>
                  <button className={`px-1.5 py-1 rounded-sm text-xs ${isDarkMode ? 'text-blue-300 bg-blue-900' : 'text-blue-600 bg-blue-100'}`}>Translate</button>
                </div>
              </div>
              {/* Translated text container */}
              <div className="flex-1 p-4">
                <div className={`border rounded-lg mr-2 p-4 ${isDarkMode ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200'}`}>
                  <div
                    className="whitespace-pre-wrap py-4"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const updatedText = (e.target as HTMLDivElement).innerText
                      setTranslations(prev => prev.map((t, i) => i === index ? { ...t, translated: updatedText } : t))
                    }}
                  >
                    {translation.translated}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Globe className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />
                      <span className="text-sm font-medium">{languageOptions.find(lang => lang.code === targetLanguage)?.label}</span>
                    </div>
                   {/* Action buttons for each translation */}
                    <div className="flex border p-1 rounded-lg space-x-2 ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}">
                      <button
                        className="p-1 hover:bg-neutral-700 rounded-md relative group"
                        onClick={() => handleCopyToClipboard(translation.translated)}
                        onMouseLeave={() => setTooltipText('Copy to clipboard')}
                      >
                        <Copy className={`w-4 h-4 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />
                        <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {tooltipText}
                        </span>
                      </button>
                      <button className="p-1 hover:bg-neutral-700 rounded-md">
                        <ThumbsUp className={`w-4 h-4 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />
                      </button>
                      <button className="p-1 hover:bg-neutral-700 rounded-md">
                        <ThumbsDown className={`w-4 h-4 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {/* Reference element to ensure auto-scrolling to the latest translation */}
        <div ref={translationsEndRef}></div>
      </div>
      
      {/* Form for entering text to be translated, at the bottom when translations exist */}
      {translations.length > 0 && (
        <div className={`sticky bottom-0 w-full flex justify-center items-center ${showShadow ? 'shadow-lg' : ''}`}>
          <form onSubmit={handleSubmit} className={`m-6 max-w-4xl w-full relative`}>
            <div className="flex space-x-2 mb-4">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-100'}`}
              >
                {languageOptions.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-100'}`}
              >
                {languageOptions.filter((lang) => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type something... or drag and drop / upload a supported file"
              className={`w-full p-4 border shadow-lg rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-hidden resize-none hover:bg-neutral-100 ${isDarkMode ? 'bg-neutral-800 text-neutral-100 border-neutral-700 hover:bg-neutral-700' : 'bg-white border-neutral-200'}`}
              rows={1}
              style={{ minHeight: '60px', maxHeight: '600px' }}
            />
            {/* Buttons for file upload and submitting the form */}
            <div className="absolute right-2 bottom-2 p-2 flex items-center space-x-2">
              <button type="button" className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'}`} onClick={handleExpandTextarea}>
                {isExpanded ? <Minimize2 className={`w-5 h-5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} /> : <Maximize2 className={`w-5 h-5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />}
              </button>
              <button type="button" className={`p-2 rounded-lg mr-1 ${isDarkMode ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'}`}>              
                <Upload className={`w-5 h-5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />
              </button>
              <button type="submit" className={`p-2 rounded-xl text-white ${isDarkMode ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-900 hover:bg-neutral-600'}`}>Translate</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TranslationInterface