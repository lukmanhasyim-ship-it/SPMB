import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useStudentStore } from '../../store/studentStore'
import Step1Jurusan from './steps/Step1Jurusan'
import Step2Pribadi from './steps/Step2Pribadi'
import Step3Alamat from './steps/Step3Alamat'
import Step4Ortu from './steps/Step4Ortu'
import Step5Berkas from './steps/Step5Berkas'

export default function StudentWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idPendaftaran = useStudentStore((s) => s.data.idPendaftaran)
  const getCurrentStep = useStudentStore((s) => s.getCurrentStep)
  const loadSiswa = useStudentStore((s) => s.loadSiswa)
  const user = useAuthStore((s) => s.user)
  const loaded = useRef(false)

  const mode = searchParams.get('mode') || 'awal'
  const stepParam = searchParams.get('step')
  const maxStep = mode === 'awal' ? 3 : 5
  const initialStep = stepParam
    ? Math.max(mode === 'awal' ? 1 : 4, Math.min(maxStep, parseInt(stepParam)))
    : mode === 'awal'
      ? getCurrentStep()
      : 4

  useEffect(() => {
    if (!idPendaftaran && user?.email && !loaded.current) {
      loaded.current = true
      loadSiswa(user.email)
    }
  }, [idPendaftaran, user?.email, loadSiswa])

  const handleStepComplete = () => {
    if (mode === 'awal') {
      const nextStep = getCurrentStep()
      if (nextStep > 3) {
        navigate('/student/kartu-pendaftaran')
      } else {
        navigate(`/student/wizard?mode=awal&step=${nextStep}`)
      }
    } else {
      const nextStep = getCurrentStep()
      if (nextStep > 5) {
        navigate('/student/dashboard')
      } else {
        navigate(`/student/wizard?mode=final&step=${nextStep}`)
      }
    }
  }

  const handleBack = () => {
    navigate('/student/dashboard')
  }

  const renderStep = () => {
    if (mode === 'awal') {
      switch (initialStep) {
        case 1:
          return <Step1Jurusan onComplete={handleStepComplete} onBack={handleBack} />
        case 2:
          return <Step2Pribadi onComplete={handleStepComplete} onBack={handleBack} />
        case 3:
          return <Step3Alamat onComplete={handleStepComplete} onBack={handleBack} />
        default:
          return <Step1Jurusan onComplete={handleStepComplete} onBack={handleBack} />
      }
    } else {
      switch (initialStep) {
        case 4:
          return <Step4Ortu onComplete={handleStepComplete} onBack={handleBack} />
        case 5:
          return <Step5Berkas onComplete={handleStepComplete} onBack={handleBack} />
        default:
          return <Step4Ortu onComplete={handleStepComplete} onBack={handleBack} />
      }
    }
  }

  return <>{renderStep()}</>
}
