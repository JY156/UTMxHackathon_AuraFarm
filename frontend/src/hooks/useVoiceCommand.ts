import { useState, useCallback, useRef } from 'react'
import { useFarmStore } from '../store/useFarmStore'

export const useVoiceCommand = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  
  const { toggleActuator, setLedMode, actuators } = useFarmStore()

  const handleCommand = useCallback((text: string) => {
    const cmd = text.toLowerCase()
    console.log('Voice Command Received:', cmd)

    // Fan / Ventilation
    if (cmd.includes('fan') || cmd.includes('ventilation')) {
      const target = cmd.includes('on')
      if (actuators.fan !== target) {
        useFarmStore.getState().toggleActuator('fan')
      }
    }

    // Pump / Irrigation
    if (cmd.includes('pump') || cmd.includes('irrigation')) {
      const target = cmd.includes('on')
      if (actuators.pump !== target) {
        useFarmStore.getState().toggleActuator('pump')
      }
    }

    // Mist
    if (cmd.includes('mist')) {
      const target = cmd.includes('on')
      if (actuators.mist !== target) {
        useFarmStore.getState().toggleActuator('mist')
      }
    }

    // Light
    if (cmd.includes('light') || cmd.includes('led')) {
      if (cmd.includes('off')) {
        setLedMode('off')
      } else if (cmd.includes('purple')) {
        setLedMode('purple')
      } else if (cmd.includes('full') || cmd.includes('on')) {
        setLedMode('full')
      }
    }
    
    // Auto Mode
    if (cmd.includes('automation') || cmd.includes('automated')) {
      if (cmd.includes('on') || cmd.includes('enable')) {
         if (!useFarmStore.getState().autoMode) useFarmStore.getState().toggleAutoMode()
      } else if (cmd.includes('off') || cmd.includes('disable')) {
         if (useFarmStore.getState().autoMode) useFarmStore.getState().toggleAutoMode()
      }
    }
  }, [actuators, setLedMode])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
      handleCommand(result)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
  }, [handleCommand])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening
  }
}
