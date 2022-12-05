import React from 'react'
import DefaultNavbar from '../Navbar/DefaultNavbar'

export default function Layout({ children }) {
  return (
    <>
      <DefaultNavbar />
      <main>{children}</main>
    </>
  )
}
