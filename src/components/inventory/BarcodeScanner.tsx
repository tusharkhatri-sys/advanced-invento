import { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'barcode-scanner-container'

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
          },
          () => {}
        )
        setStarted(true)
      } catch (err) {
        setError('Camera access denied or not available. Please allow camera permission.')
      }
    }

    const t = setTimeout(startScanner, 300)

    return () => {
      clearTimeout(t)
      if (scannerRef.current && started) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <Modal isOpen onClose={onClose} title="📷 Scan Barcode" size="sm">
      <div className="space-y-4">
        {error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center">Point camera at barcode or QR code</p>
        )}
        <div
          id={containerId}
          className="rounded-xl overflow-hidden bg-gray-800 min-h-48"
        />
        <div className="text-xs text-gray-500 text-center">
          Or type barcode manually in the text field
        </div>
      </div>
    </Modal>
  )
}
