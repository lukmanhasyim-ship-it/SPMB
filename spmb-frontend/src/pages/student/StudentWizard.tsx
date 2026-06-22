import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useStudentStore } from '../../store/studentStore'
import Step1Jurusan from './steps/Step1Jurusan'
import Step2Pribadi from './steps/Step2Pribadi'
import Step3Alamat from './steps/Step3Alamat'
export default function StudentWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data, getCurrentStep, initRegistrasi, selesaikanPendaftaranAwal } = useStudentStore()
  const { user } = useAuthStore()

  const stepParam = searchParams.get('step')
  const maxStep = 3
  const initialStep = stepParam
    ? Math.max(1, Math.min(maxStep, parseInt(stepParam)))
    : getCurrentStep()

  useEffect(() => {
    if (!data.idPendaftaran) {
      initRegistrasi(user?.email || '')
    }
  }, [])

  const handleStepComplete = () => {
    const nextStep = getCurrentStep()
    if (nextStep > 3) {
      selesaikanPendaftaranAwal()
      navigate('/student/kartu-pendaftaran')
    } else {
      navigate(`/student/wizard?mode=awal&step=${nextStep}`)
    }
  }

  const handleBack = () => {
    navigate('/student/dashboard')
  }

  const renderStep = () => {
    switch (initialStep) {
      case 1:
        return <Step1Jurusan onComplete={handleStepComplete} onBack={handleBack} />
      case 2:
        return <Step2Pribadi onComplete={handleStepComplete} onBack={handleBack} />
      case 3:
        return <Step3Alamat onComplete={handleStepComplete} onBack={handleBack} />
      default:
        return <Step3Alamat onComplete={handleStepComplete} onBack={handleBack} />
    }
  }

  return <>{renderStep()}</>
}
