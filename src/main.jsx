import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateTrip from './create-trip'
import Header from './components/custom/Header'
import { Toaster } from 'sonner'
// import { GoogleOAuthProvider } from '@react-oauth/google'
import ViewTrip from './view-trip/[tripId]/index.jsx'
import History from './history'
import ChatBotPage from './chatbot'
import Explore from './explore'

const router=createBrowserRouter([
  {
    path:'/',
    element:<App/>
  },
  {
    path:'/create-trip',
    element:<CreateTrip/>
  },
  {
    path:'/explore',
    element:<Explore/>
  },
  {
    path:'view-trip/:tripId',
    element:<ViewTrip/>
  },
  {
    path:'/history',
    element:<History/>
  },
  {
    path:'/chatbot',
    element:<ChatBotPage/>
  },
  {
    path:'*',
    element:<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Go Home
        </a>
      </div>
    </div>
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}> */}
      <Header/>
      <Toaster />
      <RouterProvider router={router}/>
    {/* </GoogleOAuthProvider> */}
  </StrictMode>
)
