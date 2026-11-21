import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Modal from './Modal'

function Harness({ dismissible = true }: { dismissible?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Buka dialog</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Judul dialog" dismissible={dismissible}>
        <button type="button">Aksi pertama</button>
        <button type="button">Aksi kedua</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('memakai semantics dialog yang diberi nama', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Buka dialog' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const label = dialog.getAttribute('aria-labelledby')
    expect(label).toBeTruthy()
    expect(document.getElementById(label!)).toHaveTextContent('Judul dialog')
  })

  it('memindahkan fokus ke dalam dan mengembalikannya saat ditutup', async () => {
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Buka dialog' })
    await userEvent.click(trigger)

    await waitFor(() => expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement))

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('ESC dan klik backdrop menutup dialog yang dismissible', async () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Modal open onClose={onClose} title="Judul">Isi</Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(<Modal open onClose={onClose} title="Judul">Isi</Modal>)
    const backdrop = document.querySelector('.fixed.inset-0 > [aria-hidden="true"]')
    expect(backdrop).not.toBeNull()
    await userEvent.click(backdrop as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('tidak menutup dialog bila dismissible=false', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Wajib dijawab" dismissible={false}>Isi</Modal>)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Tutup' })).toBeDisabled()
  })

  it('mengunci scroll body selama terbuka dan memulihkannya', async () => {
    render(<Harness />)
    expect(document.body.style.overflow).toBe('')

    await userEvent.click(screen.getByRole('button', { name: 'Buka dialog' }))
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
  })

  it('menjaga fokus tetap di dalam dialog saat Tab', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Buka dialog' }))

    const dialog = screen.getByRole('dialog')
    const items = dialog.querySelectorAll<HTMLElement>('button')
    expect(items.length).toBeGreaterThan(1)

    const terakhir = items[items.length - 1]
    terakhir.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(items[0]).toHaveFocus()

    items[0].focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(terakhir).toHaveFocus()
  })

  it('merender footer sticky bila diberikan', () => {
    render(
      <Modal open onClose={() => {}} title="Judul" footer={<button type="button">Simpan</button>}>
        Isi
      </Modal>,
    )
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument()
  })
})
