import React, { useState, useEffect, useRef } from 'react'
import { Globe, ThumbsUp, ThumbsDown, Copy, Upload, Maximize2, Minimize2, Moon, Sun, FileText } from 'lucide-react'
import { debounce } from 'lodash-es'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from './ui/ui/button'
import { Textarea } from './ui/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/ui/select'
import { Card, CardContent } from './ui/ui/card'

const TranslationInterface: React.FC = () => {
  // State to manage the input text
  const [inputText, setInputText] = useState('')
  // State to manage the list of translations
  const [translations, setTranslations] = useState<Array<{ source: string; translated: string; isSourceEditing?: boolean; isTranslatedEditing?: boolean }>>([])
  // State to manage source and target languages
  const [sourceLanguage, setSourceLanguage] = useState('auto')
  const [targetLanguage, setTargetLanguage] = useState('de')
  // State to manage selected AI model
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')
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
  // State to manage loading state
  const [isLoading, setIsLoading] = useState(false)
  // State to manage dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('isDarkMode')
    return savedMode ? JSON.parse(savedMode) : false
  })
  // State to manage real-time translation
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false)
  // State to manage translation cache
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map())

  // Function to detect if text contains markdown
  const detectMarkdown = (text: string): boolean => {
    const markdownPatterns = [
      /#{1,6}\s+/, // Headers
      /\*\*.*\*\*/, // Bold
      /\*.*\*/, // Italic
      /`.*`/, // Inline code
      /```[\s\S]*```/, // Code blocks
      /\[.*\]\(.*\)/, // Links
      /!\[.*\]\(.*\)/, // Images
      /^\s*[-*+]\s+/m, // Unordered lists
      /^\s*\d+\.\s+/m, // Ordered lists
      /^\s*>\s+/m, // Blockquotes
      /\|.*\|/, // Tables
      /---+/, // Horizontal rules
    ]
    
    return markdownPatterns.some(pattern => pattern.test(text))
  }

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

  const modelOptions = [
    { code: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fastest)' },
    { code: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Advanced)' },
    { code: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Latest)' },
  ]

  // Create a cache key for translations
  const createCacheKey = (text: string, source: string, target: string, model: string) => {
    return `${text}-${source}-${target}-${model}`
  }

  // Function to handle translation using Google AI API
  const translateText = async (text: string) => {
    // Check cache first
    const cacheKey = createCacheKey(text, sourceLanguage, targetLanguage, selectedModel)
    if (translationCache.has(cacheKey)) {
      setTranslations(prev => [...prev, { 
        source: text, 
        translated: translationCache.get(cacheKey)! 
      }])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      
      // Cache the translation
      setTranslationCache(prev => new Map(prev).set(cacheKey, data.translatedText))
      
      setTranslations(prev => [...prev, { 
        source: text, 
        translated: data.translatedText,
        isSourceEditing: false,
        isTranslatedEditing: false
      }]);
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to showing the original text with an error indicator
      setTranslations(prev => [...prev, { 
        source: text, 
        translated: '❌ Translation failed. Please check your API key and try again.',
        isSourceEditing: false,
        isTranslatedEditing: false
      }]);
    } finally {
      setIsLoading(false)
    }
  }

  // Handle editing state changes
  const handleEditSource = (index: number, isEditing: boolean) => {
    setTranslations(prev => prev.map((t, i) => 
      i === index ? { ...t, isSourceEditing: isEditing } : t
    ))
  }

  const handleEditTranslated = (index: number, isEditing: boolean) => {
    setTranslations(prev => prev.map((t, i) => 
      i === index ? { ...t, isTranslatedEditing: isEditing } : t
    ))
  }

  // Handle text content changes
  const handleSourceChange = (index: number, newText: string) => {
    setTranslations(prev => prev.map((t, i) => 
      i === index ? { ...t, source: newText } : t
    ))
  }

  const handleTranslatedChange = (index: number, newText: string) => {
    setTranslations(prev => prev.map((t, i) => 
      i === index ? { ...t, translated: newText } : t
    ))
  }

  // Debounced real-time translation
  const debouncedTranslate = useRef(
    debounce((text: string) => {
      if (text.trim() && isRealTimeEnabled) {
        translateText(text)
      }
    }, 1000)
  ).current

  // Handle changes in the input field
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    
    // Trigger real-time translation if enabled
    if (isRealTimeEnabled && e.target.value.trim()) {
      debouncedTranslate(e.target.value)
    }
    
    // Auto-resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  // Handle form submission to trigger translation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Cancel any pending debounced translation
    debouncedTranslate.cancel()
    
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
      debouncedTranslate.cancel()
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
    <div className={`flex-1 flex flex-col max-w-8xl mx-auto w-full ${isDarkMode ? 'dark bg-background text-foreground' : 'bg-background text-foreground'}`}>
      {/* Floating dark mode toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        className="fixed bottom-4 right-4 rounded-full shadow-lg z-50"
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </Button>
      {/* Container for the list of translations or empty state */}
      <div className={`${translations.length === 0 ? 'flex-1 flex flex-col items-center justify-center' : 'flex-1 overflow-y-auto mb-4 space-y-0'}`}>
        {translations.length === 0 ? (
          <>
            <div className="flex flex-col items-center p-1 justify-center h-full text-center text-neutral-500">
              <FileText className="w-8 h-8 mb-1 text-[#03eab3]" />
              <h2 className="text-neutral-700 text-3xl font-medium p-2">Prose</h2>
              <p>Safe, secure, and supercharged with your linguistic assets.</p>
            </div>
            {/* Form for entering text to be translated, centered */}
            <div className="w-full max-w-2xl mt-8">
              <form onSubmit={handleSubmit} className="relative mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRealTimeEnabled}
                      onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative w-11 h-6 transition-colors duration-200 ease-in-out rounded-full ${isRealTimeEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow-md ${isRealTimeEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      Real-time translation
                    </span>
                  </label>
                  <span className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {translationCache.size} cached
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <Select
                    value={sourceLanguage}
                    onValueChange={setSourceLanguage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value= {targetLanguage}
                    onValueChange={setTargetLanguage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.filter((lang) => lang.code !== 'auto').map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((model) => (
                        <SelectItem key={model.code} value={model.code}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => handleInputChange(e as React.ChangeEvent<HTMLTextAreaElement>)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type something... or drag and drop / upload a supported file"
                  className="w-full p-4 border shadow-lg rounded-2xl overflow-hidden resize-none min-h-[60px] max-h-[600px]"
                  rows={1}
                />
                {/* Buttons for file upload and submitting the form */}
                <div className="absolute right-2 bottom-2 p-2 flex items-center space-x-2">
                  <Button variant="ghost" size="icon" type="button" onClick={handleExpandTextarea}>
                    {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" type="button">              
                    <Upload className="w-5 h-5" />
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Translating...
                      </div>
                    ) : 'Translate'}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          translations.map((translation, index) => (
            <div key={index} className={`flex space-x-0 ${index % 2 === 0 ? (isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100') : ''}`}>
              {/* Source text container */}
              <div className={`flex-1 ml-24 border-r p-4 ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <div 
                  className="py-8 cursor-pointer min-h-[2rem]"
                  onClick={() => handleEditSource(index, true)}
                >
                  {translation.isSourceEditing ? (
                    <Textarea
                      value={translation.source}
                      onChange={(e) => handleSourceChange(index, e.target.value)}
                      onBlur={() => handleEditSource(index, false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleEditSource(index, false)
                        }
                      }}
                      autoFocus
                      className="min-h-[2rem] resize-none border-none shadow-none p-0 focus:ring-0"
                    />
                  ) : detectMarkdown(translation.source) ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-sm max-w-none dark:prose-invert"
                    >
                      {translation.source}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{translation.source}</div>
                  )}
                </div>
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
                <Card className="mr-2">
                  <CardContent className="p-4">
                    <div 
                      className="py-4 cursor-pointer min-h-[2rem]"
                      onClick={() => handleEditTranslated(index, true)}
                    >
                      {translation.isTranslatedEditing ? (
                        <Textarea
                          value={translation.translated}
                          onChange={(e) => handleTranslatedChange(index, e.target.value)}
                          onBlur={() => handleEditTranslated(index, false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              handleEditTranslated(index, false)
                            }
                          }}
                          autoFocus
                          className="min-h-[2rem] resize-none border-none shadow-none p-0 focus:ring-0"
                        />
                      ) : detectMarkdown(translation.translated) ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          className="prose prose-sm max-w-none dark:prose-invert"
                        >
                          {translation.translated}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">{translation.translated}</div>
                      )}
                    </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Globe className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />
                      <span className="text-sm font-medium">{languageOptions.find(lang => lang.code === targetLanguage)?.label}</span>
                    </div>
                   {/* Action buttons for each translation */}
                    <div className="flex border p-1 rounded-lg space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-1 hover:bg-neutral-700 rounded-md relative group"
                        onClick={() => handleCopyToClipboard(translation.translated)}
                        onMouseLeave={() => setTooltipText('Copy to clipboard')}
                      >
                        <Copy className="w-4 h-4" />
                        <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {tooltipText}
                        </span>
                      </Button>
                      <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-700 rounded-md">
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-700 rounded-md">
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  </CardContent>
                </Card>
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
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRealTimeEnabled}
                  onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 transition-colors duration-200 ease-in-out rounded-full ${isRealTimeEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow-md ${isRealTimeEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  Real-time translation
                </span>
              </label>
              <span className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {translationCache.size} cached
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              <Select
                value={sourceLanguage}
                onValueChange={setSourceLanguage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={targetLanguage}
                onValueChange={setTargetLanguage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.filter((lang) => lang.code !== 'auto').map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => (
                    <SelectItem key={model.code} value={model.code}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => handleInputChange(e as React.ChangeEvent<HTMLTextAreaElement>)}
              onKeyDown={handleKeyDown}
              placeholder="Type something... or drag and drop / upload a supported file"
              className="w-full p-4 border shadow-lg rounded-2xl overflow-hidden resize-none min-h-[60px] max-h-[600px]"
              rows={1}
            />
            {/* Buttons for file upload and submitting the form */}
            <div className="absolute right-2 bottom-2 p-2 flex items-center space-x-2">
              <Button variant="ghost" size="icon" type="button" onClick={handleExpandTextarea}>
                {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" type="button">              
                <Upload className="w-5 h-5" />
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="px-4 py-2 rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Translating...
                  </div>
                ) : 'Translate'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TranslationInterface