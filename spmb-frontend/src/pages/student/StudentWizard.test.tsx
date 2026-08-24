import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StudentWizard from './StudentWizard'

const wizardStore = vi.hoisted(() => {
  const holder = {
    idPendaftaran: '',
    statusPendaftaran: 'Draft',
    currentStepValue: 1,
  }
  return {
    holder,
    loadSiswa: vi.fn(),
    selesaikanPendaftaranAwal: vi.fn(),
  }
})

vi.mock('../../store/studentStore', () => ({
  useStudentStore: (selector: (s: unknown) => unknown) =>
    selector({
      data: {
        idPendaftaran: wizardStore.holder.idPendaftaran,
        statusPendaftaran: wizardStore.holder.statusPendaftaran,
      },
      getCurrentStep: () => wizardStore.holder.currentStepValue,
      loadSiswa: wizardStore.loadSiswa,
      selesaikanPendaftaranAwal: wizardStore.selesaikanPendaftaranAwal,
    }),
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { email: 'siswa@gmail.com', nama: 'Siswa Uji', role: 'siswa' } }),
}))

vi.mock('./steps/Step1Jurusan', () => ({
  default: (props: { onComplete: () => void }) => (
    <button onClick={props.onComplete}>STEP_1</button>
  ),
}))
vi.mock('./steps/Step2Pribadi', () => ({
  default: (props: { onComplete: () => void }) => (
    <button onClick={props.onComplete}>STEP_2</button>
  ),
}))
vi.mock('./steps/Step3Alamat', () => ({
  default: (props: { onComplete: () => void }) => (
    <button onClick={props.onComplete}>STEP_3</button>
  ),
}))
vi.mock('./steps/Step4Ortu', () => ({
  default: (props: { onComplete: () => void }) => (
    <button onClick={props.onComplete}>STEP_4</button>
  ),
}))
vi.mock('./steps/Step5Berkas', () => ({
  default: (props: { onComplete: () => void }) => (
    <button onClick={props.onComplete}>STEP_5</button>
  ),
}))

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname + location.search}</span>
}

function renderWizard(initialUrl: string) {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path="/student/wizard" element={<StudentWizard />} />
        <Route path="/student/kartu-pendaftaran" element={<div>KARTU_PENDAFTARAN</div>} />
        <Route path="/student/dashboard" element={<div>DASHBOARD_SISWA</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  wizardStore.holder.idPendaftaran = ''
  wizardStore.holder.statusPendaftaran = 'Draft'
  wizardStore.holder.currentStepValue = 1
  vi.clearAllMocks()
})

describe('StudentWizard - pemetaan langkah', () => {
  it.each([
    ['1', 'STEP_1'],
    ['2', 'STEP_2'],
    ['3', 'STEP_3'],
  ])('mode awal step=%s menampilkan %s', async (stepParam, expectedLabel) => {
    renderWizard(`/student/wizard?mode=awal&step=${stepParam}`)

    expect(await screen.findByText(expectedLabel)).toBeInTheDocument()
  })

  it('mode awal dengan step di luar jangkauan di-clamp ke step 3', async () => {
    renderWizard('/student/wizard?mode=awal&step=99')

    expect(await screen.findByText('STEP_3')).toBeInTheDocument()
  })

  it('mode final membuka langkah 4 dan 5', async () => {
    renderWizard('/student/wizard?mode=final&step=4')
    expect(await screen.findByText('STEP_4')).toBeInTheDocument()

    renderWizard('/student/wizard?mode=final&step=5')
    expect(await screen.findByText('STEP_5')).toBeInTheDocument()
  })

  it('mode final dengan step di bawah minimum di-clamp ke step 4', async () => {
    renderWizard('/student/wizard?mode=final&step=1')

    expect(await screen.findByText('STEP_4')).toBeInTheDocument()
  })
})

describe('StudentWizard - navigasi antar langkah', () => {
  it('menyelesaikan step 1 → lanjut ke step 2 sesuai getCurrentStep', async () => {
    const user = userEvent.setup()
    wizardStore.holder.currentStepValue = 2
    renderWizard('/student/wizard?mode=awal&step=1')

    await user.click(await screen.findByText('STEP_1'))

    expect(screen.getByTestId('location')).toHaveTextContent('?mode=awal&step=2')
    expect(screen.getByText('STEP_2')).toBeInTheDocument()
  })

  it('langkah awal habis → finalisasi pendaftaran awal lalu ke kartu pendaftaran', async () => {
    const user = userEvent.setup()
    wizardStore.holder.currentStepValue = 4
    wizardStore.selesaikanPendaftaranAwal.mockResolvedValue(undefined)
    renderWizard('/student/wizard?mode=awal&step=3')

    await user.click(await screen.findByText('STEP_3'))

    expect(wizardStore.selesaikanPendaftaranAwal).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('KARTU_PENDAFTARAN')).toBeInTheDocument()
  })

  it('status bukan Draft → langsung ke kartu tanpa memanggil finalisasi', async () => {
    const user = userEvent.setup()
    wizardStore.holder.statusPendaftaran = 'Terdaftar'
    wizardStore.holder.currentStepValue = 4
    renderWizard('/student/wizard?mode=awal&step=3')

    await user.click(await screen.findByText('STEP_3'))

    expect(wizardStore.selesaikanPendaftaranAwal).not.toHaveBeenCalled()
    expect(await screen.findByText('KARTU_PENDAFTARAN')).toBeInTheDocument()
  })

  it('mode final selesai → kembali ke dashboard siswa', async () => {
    const user = userEvent.setup()
    wizardStore.holder.currentStepValue = 6
    renderWizard('/student/wizard?mode=final&step=5')

    await user.click(await screen.findByText('STEP_5'))

    expect(await screen.findByText('DASHBOARD_SISWA')).toBeInTheDocument()
  })
})

describe('StudentWizard - pemuatan data', () => {
  it('memanggil loadSiswa bila idPendaftaran belum ada', async () => {
    renderWizard('/student/wizard?mode=awal&step=1')

    await screen.findByText('STEP_1')
    expect(wizardStore.loadSiswa).toHaveBeenCalledWith('siswa@gmail.com')
  })

  it('tidak memanggil loadSiswa bila idPendaftaran sudah ada', async () => {
    wizardStore.holder.idPendaftaran = 'SPMB-26-G1-ABCD1234'
    renderWizard('/student/wizard?mode=awal&step=1')

    await screen.findByText('STEP_1')
    expect(wizardStore.loadSiswa).not.toHaveBeenCalled()
  })
})
