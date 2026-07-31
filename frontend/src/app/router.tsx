import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Home() {
  return <div className="p-4 text-xl font-semibold">koinonia</div>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
