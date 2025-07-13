import React, { useState, useEffect, useRef } from 'react'
import { Globe, ThumbsUp, ThumbsDown, Copy, Upload, Maximize2, Minimize2, Moon, Sun, FileText, Send, MessageSquare, ChevronLeft, ChevronRight, X, Maximize, PanelLeftClose, PanelRightClose } from 'lucide-react'
import { debounce } from 'lodash-es'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from './ui/ui/button'
import { Textarea } from './ui/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/ui/select'
import { Card, CardContent } from './ui/ui/card'

interface Translation {
  id: string
  source: string
  translated: string
  sourceLanguage: string
  targetLanguage: string
  model: string
  timestamp: Date
  isSourceEditing?: boolean
  isTranslatedEditing?: boolean
}

interface UploadedFile {
  id: string
  name: string
  content: string
  wordCount: number
  fileType: string
  timestamp: Date
}

const TranslationInterface: React.FC = () => {
  // State to manage the input text
  const [inputText, setInputText] = useState('')
  // State to manage the list of translations
  const [translations, setTranslations] = useState<Translation[]>([])
  // State to manage uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  // State to manage selected file for preview
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  // State to manage currently selected translation for canvas
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null)
  // State to manage source and target languages
  const [sourceLanguage, setSourceLanguage] = useState('auto')
  const [targetLanguage, setTargetLanguage] = useState('de')
  // State to manage selected AI model
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')
  // Reference to the end of the chat list for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  // Reference to the textarea element for auto-resizing
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
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
  // State to manage canvas visibility and layout
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false)
  const [isTranslationCollapsed, setIsTranslationCollapsed] = useState(false)
  const [isCanvasMaximized, setIsCanvasMaximized] = useState(false)

  // File input reference
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Supported file types
  const supportedFileTypes = [
    '.txt', '.md', '.json', '.csv', '.xml', '.html', '.js', '.ts', '.jsx', '.tsx',
    '.py', '.java', '.cpp', '.c', '.h', '.css', '.scss', '.less', '.yaml', '.yml'
  ]

  // Function to count words in text
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Function to handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const wordCount = countWords(content)
      
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        content,
        wordCount,
        fileType: file.name.split('.').pop() || 'unknown',
        timestamp: new Date()
      }
      
      setUploadedFiles(prev => [...prev, uploadedFile])
      setSelectedFile(uploadedFile)
      setSelectedTranslation(null) // Clear any selected translation
      setIsCanvasOpen(true)
    }
    
    reader.readAsText(file)
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Function to trigger file upload
  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

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
      const newTranslation: Translation = {
        id: Date.now().toString(),
        source: text,
        translated: translationCache.get(cacheKey)!,
        sourceLanguage,
        targetLanguage,
        model: selectedModel,
        timestamp: new Date()
      }
      setTranslations(prev => [...prev, newTranslation])
      setSelectedTranslation(newTranslation)
      setIsCanvasOpen(true)
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
      
      const newTranslation: Translation = {
        id: Date.now().toString(),
        source: text,
        translated: data.translatedText,
        sourceLanguage,
        targetLanguage,
        model: selectedModel,
        timestamp: new Date()
      }
      
      setTranslations(prev => [...prev, newTranslation]);
      setSelectedTranslation(newTranslation)
      setIsCanvasOpen(true)
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to showing the original text with an error indicator
      const errorTranslation: Translation = {
        id: Date.now().toString(),
        source: text,
        translated: '❌ Translation failed. Please check your API key and try again.',
        sourceLanguage,
        targetLanguage,
        model: selectedModel,
        timestamp: new Date()
      }
      setTranslations(prev => [...prev, errorTranslation]);
      setSelectedTranslation(errorTranslation)
      setIsCanvasOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle editing state changes
  const handleEditTranslated = (isEditing: boolean) => {
    if (selectedTranslation) {
      setSelectedTranslation(prev => prev ? { ...prev, isTranslatedEditing: isEditing } : null)
    }
  }

  // Handle text content changes
  const handleTranslatedChange = (newText: string) => {
    if (selectedTranslation) {
      setSelectedTranslation(prev => prev ? { ...prev, translated: newText } : null)
      // Also update in the translations array
      setTranslations(prev => prev.map(t => 
        t.id === selectedTranslation.id ? { ...t, translated: newText } : t
      ))
    }
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
        textareaRef.current.style.height = '200px'
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

  // Handle canvas maximize/minimize
  const handleCanvasMaximize = () => {
    setIsCanvasMaximized(!isCanvasMaximized)
  }

  // Scroll to the bottom of the chat list whenever a new translation is added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
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

  // Format timestamp for chat display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex-1 flex ${isDarkMode ? 'dark bg-background text-foreground' : 'bg-background text-foreground'} relative`}>
      {/* Floating dark mode toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        className="fixed bottom-4 left-4 rounded-full shadow-lg z-50"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {/* Left Side - Chat Interface */}
      <div className={`${isCanvasMaximized ? 'w-0 overflow-hidden' : 'w-96'} transition-all duration-300 border-r flex flex-col h-screen ${isDarkMode ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'}`}>
        {/* Chat Header */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold">Translation Chat</h2>
          </div>
          
          {/* Language and Model Settings */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="h-8 text-xs">
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
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="h-8 text-xs">
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
            </div>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 text-xs">
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

          {/* Real-time toggle */}
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRealTimeEnabled}
                onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-9 h-5 transition-colors duration-200 ease-in-out rounded-full ${isRealTimeEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 transition-transform duration-200 ease-in-out transform bg-white rounded-full shadow-md ${isRealTimeEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className={`ml-2 text-xs ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                Real-time
              </span>
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {translationCache.size} cached
            </span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 h-0 overflow-y-auto p-4 space-y-4">
          {translations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-12 h-12 mb-3 text-blue-600 opacity-50" />
              <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Start a conversation by typing a message below
              </p>
            </div>
          ) : (
            [...uploadedFiles.map((file) => (
              <div 
                key={`file-${file.id}`}
                className={`cursor-pointer transition-colors rounded-lg p-3 border ${
                  selectedFile?.id === file.id 
                    ? (isDarkMode ? 'bg-green-900/30 border-green-600' : 'bg-green-50 border-green-200')
                    : (isDarkMode ? 'hover:bg-neutral-800 border-neutral-700' : 'hover:bg-white border-neutral-200')
                }`}
                onClick={() => {
                  setSelectedFile(file)
                  setSelectedTranslation(null)
                  setIsCanvasOpen(true)
                }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Uploaded File
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {formatTime(file.timestamp)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                    {file.name}
                  </div>
                  <div className={`text-xs flex items-center space-x-3 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    <span>{file.wordCount} words</span>
                    <span>•</span>
                    <span className="uppercase">{file.fileType}</span>
                  </div>
                  <div className={`text-xs p-2 rounded font-mono ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                    {file.content.length > 120 ? `${file.content.substring(0, 120)}...` : file.content}
                  </div>
                </div>
              </div>
            )), ...translations.map((translation) => (
              <div 
                key={`translation-${translation.id}`}
                className={`cursor-pointer transition-colors rounded-lg p-3 ${
                  selectedTranslation?.id === translation.id 
                    ? (isDarkMode ? 'bg-blue-900/30 border border-blue-600' : 'bg-blue-50 border border-blue-200')
                    : (isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-white')
                }`}
                onClick={() => {
                  setSelectedTranslation(translation)
                  setSelectedFile(null)
                  setIsCanvasOpen(true)
                }}
              >
                <div className={`text-xs mb-2 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {formatTime(translation.timestamp)} • {languageOptions.find(l => l.code === translation.sourceLanguage)?.label} → {languageOptions.find(l => l.code === translation.targetLanguage)?.label}
                </div>
                <div className="space-y-2">
                  <div className={`text-sm p-2 rounded ${isDarkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                    {translation.source.length > 100 ? `${translation.source.substring(0, 100)}...` : translation.source}
                  </div>
                  <div className={`text-sm p-2 rounded ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    {translation.translated.length > 100 ? `${translation.translated.substring(0, 100)}...` : translation.translated}
                  </div>
                </div>
              </div>
            ))]
          )}
          <div ref={chatEndRef}></div>
        </div>

        {/* Chat Input */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={supportedFileTypes.join(',')}
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to translate..."
              className="w-full pr-24 resize-none min-h-[60px] max-h-[200px] text-sm"
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleExpandTextarea}
                className="h-8 w-8"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={triggerFileUpload}
                className="h-8 w-8"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                size="icon"
                className="h-8 w-8"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating Canvas Card */}
      {isCanvasOpen && (selectedTranslation || selectedFile) && (
        <div className={`absolute z-40 pointer-events-none ${
          isCanvasMaximized 
            ? 'inset-0 p-0' 
            : 'top-4 right-4 bottom-4 left-[400px] p-0'
        }`}>
          <Card className={`h-full pointer-events-auto transition-all duration-300 shadow-2xl ${
            isCanvasMaximized 
              ? 'rounded-none border-0' 
              : 'rounded-3xl border-2 m-4'
          } ${
            isDarkMode 
              ? 'bg-neutral-900 border-neutral-700' 
              : 'bg-white border-neutral-200'
          }`}>
            {/* Canvas Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Translation Canvas</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {selectedFile ? (
                      `File Preview: ${selectedFile.name}`
                    ) : selectedTranslation ? (
                      `${languageOptions.find(l => l.code === selectedTranslation.sourceLanguage)?.label} → ${languageOptions.find(l => l.code === selectedTranslation.targetLanguage)?.label}`
                    ) : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Column toggle buttons */}
                {!isSourceCollapsed && !isTranslationCollapsed && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSourceCollapsed(true)}
                      title="Collapse source"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTranslationCollapsed(true)}
                      title="Collapse translation"
                    >
                      <PanelRightClose className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {isSourceCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSourceCollapsed(false)}
                    title="Show source"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Source
                  </Button>
                )}
                
                {isTranslationCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTranslationCollapsed(false)}
                    title="Show translation"
                  >
                    Translation
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(selectedFile ? selectedFile.content : selectedTranslation?.translated || '')}
                  className="relative group"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                  <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {tooltipText}
                  </span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCanvasMaximize}
                  title={isCanvasMaximized ? "Restore" : "Maximize"}
                >
                  <Maximize className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCanvasOpen(false)}
                  title="Close canvas"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Canvas Content */}
            <div className="flex-1 overflow-auto">
              <div className={`grid h-full ${
                isSourceCollapsed && isTranslationCollapsed 
                  ? 'grid-cols-1' 
                  : isSourceCollapsed || isTranslationCollapsed 
                    ? 'grid-cols-1' 
                    : 'grid-cols-1 lg:grid-cols-2'
              }`}>
                {/* Source Text */}
                {!isSourceCollapsed && (
                  <div className={`p-6 ${!isTranslationCollapsed ? 'border-r' : ''} ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                    <div className={`mb-4 pb-2 border-b ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                      <h4 className="font-medium text-sm uppercase tracking-wide text-neutral-500">
                        {selectedFile ? (
                          `File Content (${selectedFile.fileType.toUpperCase()})`
                        ) : selectedTranslation ? (
                          `Source (${languageOptions.find(l => l.code === selectedTranslation.sourceLanguage)?.label})`
                        ) : 'Content'}
                      </h4>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-full">
                      {selectedFile ? (
                        detectMarkdown(selectedFile.content) ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedFile.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                            {selectedFile.content}
                          </div>
                        )
                      ) : selectedTranslation && detectMarkdown(selectedTranslation.source) ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedTranslation?.source}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {selectedTranslation?.source}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Translated Text */}
                {!isTranslationCollapsed && selectedTranslation && (
                  <div className="p-6">
                    <div className={`mb-4 pb-2 border-b ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                      <h4 className="font-medium text-sm uppercase tracking-wide text-neutral-500">
                        Translation ({languageOptions.find(l => l.code === selectedTranslation.targetLanguage)?.label})
                      </h4>
                    </div>
                    <div
                      className="cursor-pointer min-h-[100px]"
                      onClick={() => handleEditTranslated(true)}
                    >
                      {selectedTranslation.isTranslatedEditing ? (
                        <Textarea
                          value={selectedTranslation.translated}
                          onChange={(e) => handleTranslatedChange(e.target.value)}
                          onBlur={() => handleEditTranslated(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              handleEditTranslated(false)
                            }
                          }}
                          autoFocus
                          className="min-h-[100px] resize-none border-none shadow-none p-0 focus:ring-0 text-sm"
                        />
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-full">
                          {detectMarkdown(selectedTranslation.translated) ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {selectedTranslation.translated}
                            </ReactMarkdown>
                          ) : (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {selectedTranslation.translated}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default TranslationInterface