import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md text-center animate-fade-in-up">
            <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
              <img src="/logo.svg" alt="Logo SMKS Al Azhar Sempu" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Terjadi Kesalahan</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Aplikasi mengalami kesalahan tak terduga. Coba muat ulang halaman ini untuk melanjutkan.
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-dark active:scale-[0.98] text-white text-sm font-semibold transition-all"
              >
                Muat Ulang Halaman
              </button>
              <a
                href="/"
                className="block w-full px-6 py-2.5 rounded-xl border-2 border-brand-green/30 bg-brand-green-light/20 hover:bg-brand-green-light/40 text-brand-green-dark text-sm font-semibold transition-colors"
              >
                Kembali ke Halaman Masuk
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
