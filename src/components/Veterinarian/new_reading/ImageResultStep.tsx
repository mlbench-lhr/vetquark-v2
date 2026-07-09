'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Copy } from 'lucide-react'
import { getLocalizedImageAnalysis } from '@/utils/imageAnalysis'

type Props = {
  analysisType: 'eye' | 'skin'
  previewDataUrl: string
  result: any
  onBack: () => void
  onFinish: () => void
}

export default function ImageResultStep({ analysisType, previewDataUrl, result, onBack, onFinish }: Props) {
  const { t, i18n } = useTranslation()

  const analysis = getLocalizedImageAnalysis(result, i18n.language)
  const diseaseDetected = analysis?.disease_detected === true
  const leadingHypothesis = analysis?.leading_hypothesis ?? null
  const differentialDiagnoses = analysis?.differential_diagnoses ?? []
  const message = analysis?.message ?? null

  const handleCopyResult = () => {
    const analysisTypeLabel = analysisType === 'eye' ? t('reading.identification.analysisTypeEye') : t('reading.identification.analysisTypeSkin')
    const diseaseDetectedText = diseaseDetected ? 'Yes' : 'No'
    
    let text = `Analysis Type: ${analysisTypeLabel}\n`
    text += `Disease detected: ${diseaseDetectedText}\n`
    
    if (diseaseDetected && leadingHypothesis) {
      const name = typeof leadingHypothesis.name === 'string' ? leadingHypothesis.name : 'Unknown'
      const confidence = typeof leadingHypothesis.confidence === 'number' ? `${(leadingHypothesis.confidence * 100).toFixed(1)}%` : 'N/A'
      text += `Leading: ${name} (${confidence})\n`
      
      const description = typeof leadingHypothesis.description === 'string' ? leadingHypothesis.description : ''
      if (description) text += `Description: ${description}\n`
      
      const findings = Array.isArray(leadingHypothesis.findings) ? leadingHypothesis.findings : []
      if (findings.length > 0) {
        text += `Findings: ${findings.join(', ')}\n`
      }
    }
    
    if (differentialDiagnoses.length > 0) {
      const sorted = [...differentialDiagnoses].sort((a, b) => {
        const confA = typeof a?.confidence === 'number' ? a.confidence : 0
        const confB = typeof b?.confidence === 'number' ? b.confidence : 0
        return confB - confA
      }).slice(0, 5)
      
      text += `Differentials: ${sorted.map(d => {
        const name = typeof d?.name === 'string' ? d.name : 'Unknown'
        const conf = typeof d?.confidence === 'number' ? `${(d.confidence * 100).toFixed(1)}%` : 'N/A'
        return `${name} (${conf})`
      }).join(', ')}\n`
    }
    
    if (message) {
      text += `Message: ${message}\n`
    }
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copied'))
    }).catch(() => {
      toast.error(t('common.error'))
    })
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl border border-secondary px-5 py-5">
        <h2 className="text-[20px] font-bold text-black/70">{t('reading.image.captureTitle')}</h2>
        
        <div className="mt-5 space-y-4">
          {previewDataUrl && (
            <div className="relative w-full aspect-video bg-[#F5F6F6] rounded-lg overflow-hidden">
              <img src={previewDataUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}
          
          {diseaseDetected && leadingHypothesis ? (
            <div className="space-y-3">
              <div className="p-4 bg-[#EBF2FF] rounded-lg">
                <div className="text-[16px] font-semibold text-black/70 mb-2">
                  {typeof leadingHypothesis.name === 'string' ? leadingHypothesis.name : 'Unknown'}
                  {typeof leadingHypothesis.confidence === 'number' && (
                    <span className="ml-2 text-primary">({(leadingHypothesis.confidence * 100).toFixed(1)}%)</span>
                  )}
                </div>
                {typeof leadingHypothesis.description === 'string' && leadingHypothesis.description && (
                  <p className="text-[14px] text-[#6B7280]">{leadingHypothesis.description}</p>
                )}
              </div>
              
              {Array.isArray(leadingHypothesis.findings) && leadingHypothesis.findings.length > 0 && (
                <div>
                  <div className="text-[14px] font-semibold text-black/70 mb-2">Findings</div>
                  <div className="flex flex-wrap gap-2">
                    {leadingHypothesis.findings.map((finding: any, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-[#F5F6F6] rounded-full text-[12px] text-black/70">
                        {typeof finding === 'string' ? finding : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {differentialDiagnoses.length > 0 && (
                <div>
                  <div className="text-[14px] font-semibold text-black/70 mb-2">Differential Diagnoses</div>
                  <div className="space-y-2">
                    {[...differentialDiagnoses]
                      .sort((a, b) => {
                        const confA = typeof a?.confidence === 'number' ? a.confidence : 0
                        const confB = typeof b?.confidence === 'number' ? b.confidence : 0
                        return confB - confA
                      })
                      .slice(0, 5)
                      .map((diag, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
                          <span className="text-[14px] text-black/70">
                            {typeof diag?.name === 'string' ? diag.name : 'Unknown'}
                          </span>
                          <span className="text-[14px] font-medium text-primary">
                            {typeof diag?.confidence === 'number' ? `${(diag.confidence * 100).toFixed(1)}%` : 'N/A'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-[#F5F6F6] rounded-lg">
              <p className="text-[14px] text-[#6B7280]">
                {message || t('reading.image.noDiseaseFallback')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={handleCopyResult}
          className="w-full py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all bg-[#EBF2FF] text-primary"
        >
          <Copy className="w-4 h-4" />
          {t('reading.image.copyResult')}
        </button>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all bg-[#E5E7EB] text-black/70"
          >
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="flex-1 py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all bg-primary text-white shadow-sm"
          >
            {t('reading.image.finish')}
          </button>
        </div>
      </div>
    </div>
  )
}
