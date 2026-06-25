export default function Loader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center min-h-[50vh] ${className}`}>
      <div className="loader" />
    </div>
  )
}
