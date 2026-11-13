import { useCallback, useEffect, useRef, useState } from 'react'

interface RecognitionAlternative {
  transcript: string
}

interface RecognitionResult {
  isFinal: boolean
  [index: number]: RecognitionAlternative
}

interface RecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: RecognitionResult
  }
}

interface Recognizer {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognizerConstructor = new () => Recognizer

function recognizerConstructor(): RecognizerConstructor | null {
  const scope = window as unknown as {
    SpeechRecognition?: RecognizerConstructor
    webkitSpeechRecognition?: RecognizerConstructor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

const recognitionErrors: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings, or type instead.',
  'service-not-allowed': 'Speech recognition is blocked in this browser. You can type your replies instead.',
  'audio-capture': 'No microphone was found. Check your device, or type instead.',
  'no-speech': 'I did not catch that. Tap the mic and speak a little closer, or type instead.',
  network: 'Speech recognition needs a connection to the browser service. Check your network, or type instead.',
}

export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [supported] = useState(() => Boolean(recognizerConstructor()))
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognizerRef = useRef<Recognizer | null>(null)
  const finalRef = useRef('')
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  useEffect(() => {
    return () => {
      recognizerRef.current?.abort()
      recognizerRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    recognizerRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    if (recognizerRef.current) return
    const Recognizer = recognizerConstructor()
    if (!Recognizer) {
      setError('Speech recognition is not available in this browser. You can type your replies instead.')
      return
    }
    if (!window.isSecureContext) {
      setError('Voice input needs a secure https connection. You can type your replies here.')
      return
    }

    const recognizer = new Recognizer()
    recognizer.lang = 'en-US'
    recognizer.continuous = false
    recognizer.interimResults = true
    recognizer.maxAlternatives = 1
    finalRef.current = ''
    setError(null)
    setInterim('')
    setListening(true)

    recognizer.onresult = (event) => {
      let interimText = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) finalRef.current += transcript
        else interimText += transcript
      }
      setInterim(interimText)
      const finalText = finalRef.current.trim()
      if (finalText) {
        finalRef.current = ''
        setInterim('')
        onFinalRef.current(finalText)
        recognizer.stop()
      }
    }

    recognizer.onerror = (event) => {
      if (event.error === 'aborted') return
      setError(recognitionErrors[event.error] ?? 'Voice input stopped unexpectedly. You can type instead.')
    }

    recognizer.onend = () => {
      recognizerRef.current = null
      setListening(false)
      setInterim('')
    }

    try {
      recognizer.start()
      recognizerRef.current = recognizer
    } catch {
      recognizerRef.current = null
      setListening(false)
      setError('Voice input could not start. Check microphone permission, or type instead.')
    }
  }, [])

  return { supported, listening, interim, error, start, stop, clearError: () => setError(null) }
}

function readMuted() {
  try {
    return window.localStorage.getItem('cocel.assistant.muted') === '1'
  } catch {
    return false
  }
}

function pickEnglishVoice() {
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(
    (voice) => /^en(-|_)/i.test(voice.lang) && /google|natural|aria|jenny|samantha|sonia/i.test(voice.name),
  )
  return preferred ?? voices.find((voice) => /^en(-|_)/i.test(voice.lang)) ?? null
}

export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const [muted, setMutedState] = useState(readMuted)
  const mutedRef = useRef(muted)

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || mutedRef.current) return
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`•]/g, ' ').slice(0, 600))
      const voice = pickEnglishVoice()
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang || 'en-US'
      utterance.rate = 1
      utterance.pitch = 1
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    },
    [supported],
  )

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next)
    try {
      window.localStorage.setItem('cocel.assistant.muted', next ? '1' : '0')
    } catch {
      /* Storage can be blocked; mute still applies for this session. */
    }
    if (next) {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
  }, [])

  return { supported, speaking, muted, speak, stop, setMuted }
}
