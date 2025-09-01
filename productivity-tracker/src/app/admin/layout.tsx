interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  )
}
