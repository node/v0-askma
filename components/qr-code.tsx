"use client"

import { useEffect, useRef } from "react"
import QRCodeStyling from "qr-code-styling"

interface QRCodeProps {
  url: string
  size?: number
}

export function QRCode({ url, size = 200 }: QRCodeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrCode = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: size,
        height: size,
        data: url,
        margin: 10,
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "Q",
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 0,
        },
        dotsOptions: {
          type: "rounded",
          color: "#000000",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: "#000000",
        },
        cornersDotOptions: {
          type: "dot",
          color: "#000000",
        },
      })
    }

    if (ref.current) {
      ref.current.innerHTML = ""
      qrCode.current.append(ref.current)
    }
  }, [url, size])

  useEffect(() => {
    if (qrCode.current) {
      qrCode.current.update({
        data: url,
      })
    }
  }, [url])

  return <div ref={ref} />
}
